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

$servidor = ['HTTP_HOST' => 'hub.santerempreendimentos.com.br', 'HTTPS' => 'on'];
verificar(
    'monta a URL absoluta',
    'https://hub.santerempreendimentos.com.br/uploads/eventos/abc.jpg',
    urlPublica('abc.jpg', $servidor)
);

// Atrás do Cloudflare o PHP às vezes não vê HTTPS; o site é https de qualquer forma.
verificar(
    'sem HTTPS no ambiente ainda monta https',
    'https://hub.santerempreendimentos.com.br/uploads/eventos/abc.jpg',
    urlPublica('abc.jpg', ['HTTP_HOST' => 'hub.santerempreendimentos.com.br'])
);

printf("\n%d teste(s), %d falha(s)\n", $total, $falhas);
exit($falhas > 0 ? 1 : 0);
