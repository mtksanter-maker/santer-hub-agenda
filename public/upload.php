<?php
/**
 * Recebe a imagem de capa dos eventos, enviada pelo painel administrativo.
 *
 * O site é estático e não tem back-end: este arquivo é a única exceção, e
 * existe porque o Cloud Storage do Firebase exigiria o plano Blaze.
 *
 * Só envia quem está logado no painel — a checagem do token é feita com o
 * Google a cada requisição, e não há sessão nem senha própria aqui.
 *
 * As funções ficam separadas do `main()` para que os testes em
 * `ferramentas/testar-upload.php` possam chamá-las uma a uma.
 */
declare(strict_types=1);

/** Acima disso a capa demora a carregar no celular de quem visita. */
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

/** Largura de tela cheia num monitor comum; o card mostra bem menos. */
const LARGURA_MAXIMA = 1600;

const QUALIDADE_JPEG = 82;

/** Mapa dos tipos que o GD desta hospedagem sabe abrir. */
const TIPOS_ACEITOS = [
    IMAGETYPE_JPEG => 'image/jpeg',
    IMAGETYPE_PNG => 'image/png',
    IMAGETYPE_WEBP => 'image/webp',
    IMAGETYPE_AVIF => 'image/avif',
];

/**
 * Descobre o tipo pelo CONTEÚDO do arquivo, nunca pelo nome.
 *
 * É a primeira das três barreiras contra subir um .php disfarçado de imagem:
 * `getimagesize()` lê os bytes iniciais e não tem opinião sobre a extensão.
 * Devolve null quando o arquivo não é uma imagem que aceitamos.
 */
function tipoDaImagem(string $caminho): ?string
{
    $info = @getimagesize($caminho);
    if ($info === false) {
        return null;
    }
    return TIPOS_ACEITOS[$info[2]] ?? null;
}

/**
 * Regrava a imagem como JPEG, com no máximo LARGURA_MAXIMA de largura.
 *
 * Regravar é a segunda barreira de segurança: o GD decodifica os pixels e
 * escreve um arquivo novo, então qualquer coisa escondida nos metadados do
 * original — inclusive PHP — fica para trás.
 *
 * A saída é sempre JPEG porque a capa é foto e o card recorta em 16:9; a
 * transparência de um PNG não teria para onde ir, e por isso o fundo vira
 * branco em vez de preto, que é o padrão do GD e ninguém espera.
 */
function redimensionarParaJpeg(string $origem, string $tipo, string $destino): bool
{
    $imagem = match ($tipo) {
        'image/jpeg' => @imagecreatefromjpeg($origem),
        'image/png' => @imagecreatefrompng($origem),
        'image/webp' => @imagecreatefromwebp($origem),
        'image/avif' => @imagecreatefromavif($origem),
        default => false,
    };
    if ($imagem === false) {
        return false;
    }

    $largura = imagesx($imagem);
    $altura = imagesy($imagem);

    // Imagem menor que o teto não é ampliada: só perderia qualidade.
    $escala = min(1, LARGURA_MAXIMA / $largura);
    $novaLargura = (int) round($largura * $escala);
    $novaAltura = (int) round($altura * $escala);

    $saida = imagecreatetruecolor($novaLargura, $novaAltura);
    imagefilledrectangle($saida, 0, 0, $novaLargura, $novaAltura, imagecolorallocate($saida, 255, 255, 255));
    imagecopyresampled($saida, $imagem, 0, 0, 0, 0, $novaLargura, $novaAltura, $largura, $altura);

    $gravou = imagejpeg($saida, $destino, QUALIDADE_JPEG);

    imagedestroy($imagem);
    imagedestroy($saida);

    return $gravou;
}
