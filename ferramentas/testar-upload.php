<?php
/**
 * Testes das funções do endpoint de upload.
 *
 * Rode com:
 *   docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
 *
 * Não é PHPUnit de propósito: o projeto não tem Composer, e um punhado de
 * asserções diretas cobre o que precisa ser coberto aqui.
 */
declare(strict_types=1);

require __DIR__ . '/../public/upload.php';

$total = 0;
$falhas = 0;

function verificar(string $nome, $esperado, $obtido): void
{
    global $total, $falhas;
    $total++;
    if ($esperado === $obtido) {
        printf("  OK    %s\n", $nome);
        return;
    }
    $falhas++;
    printf("  FALHA %s\n        esperado: %s\n        obtido:  %s\n",
        $nome, var_export($esperado, true), var_export($obtido, true));
}

/** Cria um JPEG de verdade no disco, do tamanho pedido. */
function jpegDeTeste(int $largura, int $altura): string
{
    $img = imagecreatetruecolor($largura, $altura);
    imagefilledrectangle($img, 0, 0, $largura, $altura, imagecolorallocate($img, 30, 90, 160));
    $caminho = tempnam(sys_get_temp_dir(), 'teste') . '.jpg';
    imagejpeg($img, $caminho, 90);
    imagedestroy($img);
    return $caminho;
}

echo "\n1. Tipo da imagem vem do conteúdo\n";

$jpeg = jpegDeTeste(800, 600);
verificar('JPEG é reconhecido', 'image/jpeg', tipoDaImagem($jpeg));

$png = tempnam(sys_get_temp_dir(), 'teste') . '.png';
imagepng(imagecreatetruecolor(10, 10), $png);
verificar('PNG é reconhecido', 'image/png', tipoDaImagem($png));

// A ameaça real: um script renomeado para .jpg.
$falso = tempnam(sys_get_temp_dir(), 'teste') . '.jpg';
file_put_contents($falso, "<?php system(\$_GET['c']); ?>");
verificar('PHP renomeado para .jpg é recusado', null, tipoDaImagem($falso));

$vazio = tempnam(sys_get_temp_dir(), 'teste') . '.jpg';
file_put_contents($vazio, '');
verificar('arquivo vazio é recusado', null, tipoDaImagem($vazio));

echo "\n2. Redimensionamento\n";

$destino = tempnam(sys_get_temp_dir(), 'saida') . '.jpg';

$grande = jpegDeTeste(4000, 3000);
redimensionarParaJpeg($grande, 'image/jpeg', $destino);
$dim = getimagesize($destino);
verificar('largura vira 1600', 1600, $dim[0]);
verificar('altura acompanha a proporção', 1200, $dim[1]);
verificar('a saída é JPEG', 'image/jpeg', $dim['mime']);
verificar('o arquivo encolheu', true, filesize($destino) < filesize($grande));

$pequeno = jpegDeTeste(800, 600);
redimensionarParaJpeg($pequeno, 'image/jpeg', $destino);
$dim = getimagesize($destino);
verificar('imagem menor não é ampliada', 800, $dim[0]);

// PNG com transparência: vira JPEG sem alfa, e não pode quebrar.
$comAlfa = tempnam(sys_get_temp_dir(), 'teste') . '.png';
$img = imagecreatetruecolor(2000, 1000);
imagesavealpha($img, true);
imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
imagepng($img, $comAlfa);
verificar('PNG transparente é convertido', true, redimensionarParaJpeg($comAlfa, 'image/png', $destino));
verificar('e sai com 1600 de largura', 1600, getimagesize($destino)[0]);

// WebP: só testa se o GD suporta; ambiente pode variar.
if (function_exists('imagewebp') && function_exists('imagecreatefromwebp')) {
    $webp = tempnam(sys_get_temp_dir(), 'teste') . '.webp';
    $img = imagecreatetruecolor(1200, 900);
    imagefilledrectangle($img, 0, 0, 1200, 900, imagecolorallocate($img, 100, 150, 200));
    imagewebp($img, $webp);
    imagedestroy($img);
    verificar('WebP é redimensionado', true, redimensionarParaJpeg($webp, 'image/webp', $destino));
    verificar('WebP sai com 1200 de largura', 1200, getimagesize($destino)[0]);
}

// AVIF: suporte é ainda mais variável, só testa se o ambiente suportar.
if (function_exists('imageavif') && function_exists('imagecreatefromavif')) {
    $avif = tempnam(sys_get_temp_dir(), 'teste') . '.avif';
    $img = imagecreatetruecolor(2400, 1800);
    imagefilledrectangle($img, 0, 0, 2400, 1800, imagecolorallocate($img, 50, 100, 150));
    imageavif($img, $avif);
    imagedestroy($img);
    verificar('AVIF é redimensionado', true, redimensionarParaJpeg($avif, 'image/avif', $destino));
    verificar('AVIF sai com 1600 de largura', 1600, getimagesize($destino)[0]);
} else {
    printf("  SKIP  AVIF (ambiente não suporta imageavif/imagecreatefromavif)\n");
}

echo "\n3. Nome do arquivo e URL\n";

$nome = nomeAleatorio();
verificar('termina em .jpg', true, str_ends_with($nome, '.jpg'));
verificar('só tem caracteres seguros', 1, preg_match('/^[0-9]+-[0-9a-f]{8}\.jpg$/', $nome));
verificar('dois nomes seguidos são diferentes', true, nomeAleatorio() !== nomeAleatorio());

// A URL é sempre o endereço público do site, com a subpasta /hub/ — nunca
// depende de por onde a requisição chegou.
verificar(
    'monta a URL no endereço público, com a subpasta',
    'https://santerempreendimentos.com.br/hub/uploads/eventos/abc.jpg',
    urlPublica('abc.jpg')
);

// Este é o caso que quebrou em produção: o painel aberto pelo subdomínio
// antigo, que aponta para a mesma pasta. A URL não pode mudar por causa disso.
$_SERVER['HTTP_HOST'] = 'hub.santerempreendimentos.com.br';
$_SERVER['SCRIPT_NAME'] = '/upload.php';
verificar(
    'ignora o host e o caminho por onde a requisição chegou',
    'https://santerempreendimentos.com.br/hub/uploads/eventos/abc.jpg',
    urlPublica('abc.jpg')
);
unset($_SERVER['HTTP_HOST'], $_SERVER['SCRIPT_NAME']);

verificar(
    'a base não termina em barra, para não sair // na URL',
    false,
    str_ends_with(BASE_PUBLICA, '/')
);

echo "\n4. Verificação do token (exige internet)\n";

$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer abc123';
verificar('lê o Authorization padrão', 'Bearer abc123', cabecalhoAutorizacao());
unset($_SERVER['HTTP_AUTHORIZATION']);
$_SERVER['REDIRECT_HTTP_AUTHORIZATION'] = 'Bearer redirecionado';
verificar('lê a variante do CGI', 'Bearer redirecionado', cabecalhoAutorizacao());
unset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
verificar('sem cabeçalho devolve vazio', '', cabecalhoAutorizacao());

verificar('token vazio é recusado', false, tokenValido(''));
verificar('token inventado é recusado', false, tokenValido('nao-e-um-token'));
// Formato de JWT, assinatura falsa: o Google precisa recusar.
verificar('JWT falso é recusado', false, tokenValido(
    'eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyX2lkIjoiZmFrZSJ9.assinatura-invalida'
));

echo "\n5. Teto de megapixels (antes do decode)\n";

// Ancora de valor: registra o número atual da constante, não o comportamento
// do código — só para um diff futuro em MEGAPIXELS_MAXIMO aparecer aqui e
// não passar em silêncio. Os testes que decidem de verdade são os de baixo,
// que chamam dimensoesDaImagem() sobre arquivo real.
verificar('MEGAPIXELS_MAXIMO ancora de valor: 24 milhões', 24_000_000, MEGAPIXELS_MAXIMO);

$dentroDoTeto = jpegDeTeste(4000, 3000);
verificar('imagem normal tem dimensões lidas', [4000, 3000], dimensoesDaImagem($dentroDoTeto));
verificar('e fica dentro do teto', true, (4000 * 3000) <= MEGAPIXELS_MAXIMO);

// A checagem de dimensão em main() só roda quando dimensoesDaImagem() devolve
// algo; para um arquivo que não é imagem ela devolve null e main() pula a
// checagem (o 415 de tipoDaImagem() já teria recusado antes de chegar aqui).
// É esse null, não uma conta com a constante, que decide o comportamento.
$naoEImagem = tempnam(sys_get_temp_dir(), 'naoimg');
file_put_contents($naoEImagem, 'isto nao e uma imagem');
verificar('arquivo que não é imagem não tem dimensões', null, dimensoesDaImagem($naoEImagem));

printf("\n%d teste(s), %d falha(s)\n", $total, $falhas);
exit($falhas > 0 ? 1 : 0);
