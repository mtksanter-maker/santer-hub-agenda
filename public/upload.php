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

/**
 * Tenta abrir um pouco mais de fôlego para o decode de imagem grande.
 *
 * Com @ porque muita hospedagem compartilhada proíbe alterar memory_limit
 * por php_ini_set (retorna false ou lança aviso) — o código não pode depender
 * de que isso funcione, só se beneficia quando funciona. MEGAPIXELS_MAXIMO,
 * mais abaixo, é dimensionado para sobreviver mesmo que este ini_set seja
 * ignorado e o limite fique no padrão de 128M da hospedagem.
 */
@ini_set('memory_limit', '256M');

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
 *
 * A instalação de GD varia por hospedagem: recusamos o formato se a função
 * de leitura não existir, e o chamador já trata null como "415 Not Acceptable",
 * que é melhor que derrubar a requisição com erro fatal.
 */
function tipoDaImagem(string $caminho): ?string
{
    $info = @getimagesize($caminho);
    if ($info === false) {
        return null;
    }

    $tipo = TIPOS_ACEITOS[$info[2]] ?? null;
    if ($tipo === null) {
        return null;
    }

    // Só devolve o tipo se a função de leitura existe no GD deste ambiente.
    $mapaDeFuncoes = [
        'image/jpeg' => 'imagecreatefromjpeg',
        'image/png' => 'imagecreatefrompng',
        'image/webp' => 'imagecreatefromwebp',
        'image/avif' => 'imagecreatefromavif',
    ];

    if (!isset($mapaDeFuncoes[$tipo]) || !function_exists($mapaDeFuncoes[$tipo])) {
        return null;
    }

    return $tipo;
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
 *
 * A instalação de GD varia por hospedagem: não chamamos função inexistente,
 * devolvemos false em vez de estourar erro fatal — é melhor que 500 para quem
 * tenta enviar um formato que o ambiente não suporta.
 */
function redimensionarParaJpeg(string $origem, string $tipo, string $destino): bool
{
    $imagem = false;

    // Verifica se a função existe antes de chamar, para não estourar erro fatal.
    switch ($tipo) {
        case 'image/jpeg':
            if (function_exists('imagecreatefromjpeg')) {
                $imagem = @imagecreatefromjpeg($origem);
            }
            break;
        case 'image/png':
            if (function_exists('imagecreatefrompng')) {
                $imagem = @imagecreatefrompng($origem);
            }
            break;
        case 'image/webp':
            if (function_exists('imagecreatefromwebp')) {
                $imagem = @imagecreatefromwebp($origem);
            }
            break;
        case 'image/avif':
            if (function_exists('imagecreatefromavif')) {
                $imagem = @imagecreatefromavif($origem);
            }
            break;
    }

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

/** Pasta que recebe as capas. Fica sob o docroot para ser servida direto. */
const PASTA_UPLOADS = __DIR__ . '/uploads/eventos';

/**
 * Nome novo para cada envio, sem nenhuma relação com o nome original.
 *
 * O carimbo de tempo dá ordem cronológica na pasta e os 8 dígitos aleatórios
 * evitam que dois envios de "capa.jpg" no mesmo segundo se sobrescrevam.
 */
function nomeAleatorio(): string
{
    return sprintf('%d-%s.jpg', time(), bin2hex(random_bytes(4)));
}

/**
 * URL absoluta da imagem gravada.
 *
 * Absoluta, e não relativa, porque o mesmo build também é publicado no GitHub
 * Pages, numa subpasta: um caminho relativo apontaria para o lugar errado lá.
 *
 * O esquema é sempre https — o site só atende em https, e atrás do Cloudflare
 * o PHP nem sempre enxerga a conexão como segura.
 */
function urlPublica(string $nome, array $servidor): string
{
    $host = $servidor['HTTP_HOST'] ?? '';
    return sprintf('https://%s/uploads/eventos/%s', $host, $nome);
}

/**
 * Teto de megapixels antes de decodificar a imagem.
 *
 * O número existe por causa da aritmética do GD, não do tamanho do arquivo:
 * imagecreatefrom*() aloca ~4 bytes por pixel para o buffer decodificado
 * (RGBA interno), então 24 milhões de pixels já pedem ~96 MB só de buffer,
 * fora o resto do processo PHP. Um arquivo pequeno em bytes pode declarar
 * dimensões gigantescas — as dimensões cabem em poucos bytes do cabeçalho
 * do formato — e estourar essa conta na hora do decode, o que é uma forma
 * barata de derrubar um endpoint público.
 *
 * 50 milhões de pixels (o valor original desta constante) já estoura um
 * memory_limit de 128M: 50_000_000 × 4 bytes = ~191 MB só de buffer, sem
 * contar a cópia de saída do redimensionamento. E esse fatal não passa por
 * responder() — o cliente recebe HTML/500 em vez de JSON, e com
 * display_errors ligado o caminho absoluto do servidor vaza na resposta.
 * 24 milhões de pixels (6000×4000, bem mais que qualquer foto real de capa
 * de evento) já sobrevive com folga a um memory_limit de 256M.
 */
const MEGAPIXELS_MAXIMO = 24_000_000;

/**
 * Lê as dimensões da imagem sem decodificar os pixels.
 *
 * É uma função irmã de tipoDaImagem(), e não uma alteração nela: as duas
 * chamam getimagesize() sobre o mesmo arquivo, mas servem perguntas
 * diferentes ("que tipo é" vs. "que resolução tem") e mudar a assinatura de
 * tipoDaImagem() obrigaria a tocar numa função que os testes já cobrem e que
 * as tasks anteriores revisaram. getimagesize() só lê o cabeçalho do
 * arquivo — é a mesma operação barata que tipoDaImagem() já faz, então
 * checar a resolução aqui não adiciona custo antes do decode real.
 */
function dimensoesDaImagem(string $caminho): ?array
{
    $info = @getimagesize($caminho);
    if ($info === false) {
        return null;
    }

    return [$info[0], $info[1]];
}

/**
 * A mesma chave que já é pública em src/lib/firebase.ts.
 *
 * Ela identifica o projeto, não autoriza nada — e é por ser do projeto que
 * serve aqui: um token emitido por outro projeto Firebase não passa.
 */
const FIREBASE_API_KEY = 'AIzaSyAPQ330T_Y24dCfVtCxzsS5KjHddPJ9hk8';

/**
 * Pergunta ao Google se o token vale.
 *
 * Delegar a verificação evita escrever validação de JWT à mão, que é onde
 * moram os furos clássicos: esquecer de conferir a expiração, o emissor ou o
 * destinatário deixa a porta aberta sem que nada denuncie.
 *
 * Qualquer resposta que não traga um usuário é tratada como token inválido —
 * inclusive falha de rede. Recusar é o lado seguro do erro.
 */
function tokenValido(string $token): bool
{
    if ($token === '') {
        return false;
    }

    $ch = curl_init('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . FIREBASE_API_KEY);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['idToken' => $token]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $resposta = curl_exec($ch);
    $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($codigo !== 200 || !is_string($resposta)) {
        return false;
    }

    $dados = json_decode($resposta, true);
    if (!isset($dados['users'][0]['localId'])) {
        return false;
    }

    // accounts:lookup devolve 200 com o usuário mesmo se ele foi desabilitado
    // no console do Firebase — "token existe e é de um usuário" não é o mesmo
    // que "esse usuário pode usar o painel agora". Sem esta checagem,
    // desabilitar alguém no console não corta o envio: o token continua
    // validando até expirar.
    if (($dados['users'][0]['disabled'] ?? false) === true) {
        return false;
    }

    return true;
}

/**
 * Lê o cabeçalho Authorization, que nem sempre chega inteiro ao PHP.
 *
 * Muita hospedagem roda o PHP como CGI/FPM, e nessa configuração o Apache
 * descarta o Authorization antes de repassar — o endpoint responderia 401
 * para todo mundo, sem nada no código denunciando o motivo. Os três lugares
 * abaixo cobrem as variações que aparecem na prática.
 */
function cabecalhoAutorizacao(): string
{
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $chave) {
        if (!empty($_SERVER[$chave])) {
            return $_SERVER[$chave];
        }
    }

    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $nome => $valor) {
            if (strcasecmp($nome, 'Authorization') === 0) {
                return $valor;
            }
        }
    }

    return '';
}

/** Resposta JSON única do endpoint. Encerra a execução. */
function responder(int $codigo, array $corpo): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($corpo, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * O endpoint em si.
 *
 * A ordem importa: autoriza antes de olhar o arquivo, olha as dimensões
 * antes de decodificar os pixels, e olha o conteúdo do arquivo antes de
 * gravar qualquer coisa no disco.
 */
function main(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        responder(405, ['erro' => 'Método não permitido.']);
    }

    $cabecalho = cabecalhoAutorizacao();
    $token = str_starts_with($cabecalho, 'Bearer ') ? substr($cabecalho, 7) : '';
    if (!tokenValido($token)) {
        responder(401, ['erro' => 'Sua sessão expirou. Entre de novo para enviar a imagem.']);
    }

    $arquivo = $_FILES['imagem'] ?? null;
    if ($arquivo === null || ($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        responder(400, ['erro' => 'Nenhuma imagem chegou ao servidor. Tente de novo.']);
    }

    // Defesa em profundidade: confirma que tmp_name é mesmo um upload desta
    // requisição, e não um caminho arbitrário. Não há hoje um jeito de
    // $_FILES['imagem']['tmp_name'] apontar para outro lugar, mas é o
    // convencional para qualquer código que vai ler o arquivo por esse nome.
    if (!is_uploaded_file($arquivo['tmp_name'])) {
        responder(400, ['erro' => 'Nenhuma imagem chegou ao servidor. Tente de novo.']);
    }

    if ($arquivo['size'] > TAMANHO_MAXIMO) {
        responder(413, ['erro' => 'A imagem passa de 5 MB. Reduza o arquivo e tente de novo.']);
    }

    $tipo = tipoDaImagem($arquivo['tmp_name']);
    if ($tipo === null) {
        responder(415, ['erro' => 'Formato não aceito. Envie um JPG, PNG, WebP ou AVIF.']);
    }

    // Confere a resolução com o cabeçalho já lido, antes de qualquer decode
    // de pixels: um arquivo leve em bytes pode declarar uma resolução gigante
    // e estourar a memória do processo no imagecreatefrom*, que é uma forma
    // barata de derrubar o endpoint. TAMANHO_MAXIMO sozinho não pega isso.
    $dimensoes = dimensoesDaImagem($arquivo['tmp_name']);
    if ($dimensoes !== null && ($dimensoes[0] * $dimensoes[1]) > MEGAPIXELS_MAXIMO) {
        responder(413, ['erro' => 'A imagem tem resolução alta demais. Reduza as dimensões e tente de novo.']);
    }

    if (!is_dir(PASTA_UPLOADS) && !mkdir(PASTA_UPLOADS, 0755, true) && !is_dir(PASTA_UPLOADS)) {
        responder(500, ['erro' => 'Não foi possível salvar a imagem. Tente de novo.']);
    }

    $nome = nomeAleatorio();
    if (!redimensionarParaJpeg($arquivo['tmp_name'], $tipo, PASTA_UPLOADS . '/' . $nome)) {
        responder(500, ['erro' => 'Não foi possível salvar a imagem. Tente de novo.']);
    }

    responder(200, ['url' => urlPublica($nome, $_SERVER)]);
}

// No CLI o arquivo é apenas uma biblioteca, para os testes poderem carregá-lo.
if (PHP_SAPI !== 'cli') {
    main();
}
