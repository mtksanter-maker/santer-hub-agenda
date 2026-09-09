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

printf("\n%d teste(s), %d falha(s)\n", $total, $falhas);
exit($falhas > 0 ? 1 : 0);
