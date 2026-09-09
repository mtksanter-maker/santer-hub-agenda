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
