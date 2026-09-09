# Upload das capas no servidor próprio — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O administrador escolhe um arquivo do computador como capa do evento; o servidor do próprio site recebe, valida, redimensiona e devolve a URL.

**Architecture:** Um endpoint PHP (`public/upload.php`) recebe `multipart/form-data` com o token do Firebase no cabeçalho `Authorization`. Ele confirma o token com o Google, decide o tipo pelo conteúdo do arquivo, regrava a imagem com GD a no máximo 1600px e responde com a URL absoluta. O painel guarda essa URL no evento, exatamente como já guardava um link colado.

**Tech Stack:** PHP 8 com GD e cURL (sem dependências externas), React 19 + TypeScript no painel, Vite.

**Spec:** [docs/superpowers/specs/2026-09-09-upload-capas-servidor-proprio-design.md](../specs/2026-09-09-upload-capas-servidor-proprio-design.md)

## Global Constraints

- **Nada de dependência nova.** Nem no PHP (sem Composer) nem no npm. O que existe basta.
- **Texto de tela em português**, com a voz do projeto: frase direta, sem "Ops!" nem exclamação.
- **Comentários em português**, explicando *por que*, não *o que* — é o padrão de todo arquivo deste repositório.
- **Limite de 5 MB** por arquivo, antes de qualquer processamento.
- **Largura máxima 1600px**, qualidade JPEG **82**.
- **Formatos aceitos:** JPEG, PNG, WebP, AVIF. A saída é sempre JPEG.
- **A chave do Firebase** usada no PHP é a mesma de `src/lib/firebase.ts`: `AIzaSyAPQ330T_Y24dCfVtCxzsS5KjHddPJ9hk8`. Ela é pública por natureza.
- **Os testes rodam em container**, porque não há PHP nem Node no WSL:
  - PHP: `docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php <arquivo>`
  - Node: `docker exec mde-santer-hub-node <comando>`
  - Atenção: o container é PHP **8.3** e a produção é **8.5**. Não use nada removido ou adicionado entre as duas.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `public/upload.php` | Criar: endpoint. Funções puras + um `main()` que só roda fora do CLI |
| `public/uploads/.htaccess` | Criar: desliga execução na pasta que recebe arquivo de fora |
| `ferramentas/testar-upload.php` | Criar: testes das funções do endpoint, rodados no CLI |
| `src/lib/imagens.ts` | Criar: envia o `File` para o endpoint e devolve a URL |
| `src/lib/auth.ts` | Modificar: expor o token do usuário logado |
| `src/admin/EventoForm.tsx` | Modificar: trocar o campo de link pelo campo de arquivo |

O `upload.php` guarda as funções e o `main()` no mesmo arquivo, com o `main()`
protegido por `PHP_SAPI !== 'cli'`. Assim o teste faz `require` do arquivo e
chama cada função isoladamente, sem que nada seja executado ao carregar — e o
endpoint continua sendo um arquivo só, que é o que o deploy por FTP entrega.

---

### Task 1: Esqueleto do endpoint e detecção do tipo real

**Files:**
- Create: `public/upload.php`
- Test: `ferramentas/testar-upload.php`

**Interfaces:**
- Consumes: nada
- Produces:
  - `tipoDaImagem(string $caminho): ?string` — devolve `'image/jpeg'`, `'image/png'`, `'image/webp'`, `'image/avif'` ou `null` se não for imagem aceita
  - constantes `LARGURA_MAXIMA` (1600), `TAMANHO_MAXIMO` (5242880), `QUALIDADE_JPEG` (82)

- [ ] **Step 1: Escrever o teste que falha**

Crie `ferramentas/testar-upload.php`:

```php
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: erro fatal, `Failed opening required '.../public/upload.php'`.

- [ ] **Step 3: Escrever o mínimo para passar**

Crie `public/upload.php`:

```php
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `4 teste(s), 0 falha(s)`.

- [ ] **Step 5: Commit**

```bash
git add public/upload.php ferramentas/testar-upload.php
git commit -m "feat(upload): reconhecer o tipo da imagem pelo conteudo

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Redimensionar e gravar

**Files:**
- Modify: `public/upload.php`
- Test: `ferramentas/testar-upload.php`

**Interfaces:**
- Consumes: `tipoDaImagem()`, `LARGURA_MAXIMA`, `QUALIDADE_JPEG` da Task 1
- Produces: `redimensionarParaJpeg(string $origem, string $tipo, string $destino): bool`

- [ ] **Step 1: Escrever o teste que falha**

Acrescente ao fim de `ferramentas/testar-upload.php`, **antes** da linha do
`printf` final:

```php
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `Call to undefined function redimensionarParaJpeg()`.

- [ ] **Step 3: Escrever o mínimo para passar**

Acrescente a `public/upload.php`:

```php
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `10 teste(s), 0 falha(s)`.

- [ ] **Step 5: Commit**

```bash
git add public/upload.php ferramentas/testar-upload.php
git commit -m "feat(upload): redimensionar a capa para 1600px

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Nome do arquivo e URL pública

**Files:**
- Modify: `public/upload.php`
- Test: `ferramentas/testar-upload.php`

**Interfaces:**
- Consumes: nada das tasks anteriores
- Produces:
  - `nomeAleatorio(): string` — ex.: `1757440000-3f9c2a1b.jpg`
  - `urlPublica(string $nome, array $servidor): string`

- [ ] **Step 1: Escrever o teste que falha**

Acrescente antes do `printf` final:

```php
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `Call to undefined function nomeAleatorio()`.

- [ ] **Step 3: Escrever o mínimo para passar**

Acrescente a `public/upload.php`:

```php
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `15 teste(s), 0 falha(s)`.

- [ ] **Step 5: Commit**

```bash
git add public/upload.php ferramentas/testar-upload.php
git commit -m "feat(upload): nome aleatorio e URL absoluta da capa

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Verificação do token e o `main()`

**Files:**
- Modify: `public/upload.php`
- Test: `ferramentas/testar-upload.php`

**Interfaces:**
- Consumes: tudo das tasks 1 a 3
- Produces: `tokenValido(string $token): bool`, `responder(int $codigo, array $corpo): void`, `main(): void`

- [ ] **Step 1: Escrever o teste que falha**

Acrescente antes do `printf` final:

```php
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `Call to undefined function tokenValido()`.

- [ ] **Step 3: Escrever o mínimo para passar**

Acrescente a `public/upload.php`:

```php
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
    return isset($dados['users'][0]['localId']);
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
 * A ordem importa: autoriza antes de olhar o arquivo, e olha o conteúdo do
 * arquivo antes de gravar qualquer coisa no disco.
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

    if ($arquivo['size'] > TAMANHO_MAXIMO) {
        responder(413, ['erro' => 'A imagem passa de 5 MB. Reduza o arquivo e tente de novo.']);
    }

    $tipo = tipoDaImagem($arquivo['tmp_name']);
    if ($tipo === null) {
        responder(415, ['erro' => 'Formato não aceito. Envie um JPG, PNG, WebP ou AVIF.']);
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
docker run --rm -v "$PWD":/app -w /app mde/php:8.3 php ferramentas/testar-upload.php
```

Esperado: `21 teste(s), 0 falha(s)`. Se os três testes do token falharem por
falta de internet no container, confirme com
`docker run --rm mde/php:8.3 php -r 'echo file_get_contents("https://www.google.com") ? "rede ok" : "sem rede";'`
antes de mexer no código.

- [ ] **Step 5: Commit**

```bash
git add public/upload.php ferramentas/testar-upload.php
git commit -m "feat(upload): exigir o token do painel e responder em JSON

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Desligar a execução na pasta de uploads

**Files:**
- Create: `public/uploads/.htaccess`

**Interfaces:**
- Consumes: `PASTA_UPLOADS` da Task 3
- Produces: nada em código

Esta é a terceira barreira: mesmo que as duas primeiras falhem um dia, nada
dentro de `uploads/` pode ser executado.

O `.htaccess` precisa ir para o servidor no deploy, e a `FTP-Deploy-Action`
ignora arquivos que começam com ponto por padrão — mas a workflow já declara a
própria lista de exclusões, e ela não bloqueia este caminho. O Vite, por sua
vez, copia `public/` inteiro para `dist/`, arquivos ocultos inclusive.

- [ ] **Step 1: Criar o arquivo**

```apache
# Esta pasta recebe arquivo enviado de fora. Nada aqui pode ser executado:
# é a última barreira caso a validação de tipo do upload.php seja contornada.
<IfModule mod_php.c>
  php_flag engine off
</IfModule>

# Em hospedagem com PHP-FPM/LiteSpeed o php_flag acima é ignorado; então
# também recusamos qualquer requisição a arquivo executável.
<FilesMatch "\.(php|phtml|php[0-9]|phar|cgi|pl|py|sh|htaccess)$">
  Require all denied
</FilesMatch>

Options -ExecCGI -Indexes
AddType image/jpeg .jpg
```

- [ ] **Step 2: Confirmar que o build leva o arquivo**

```bash
docker exec mde-santer-hub-node npm run build
docker exec mde-santer-hub-node ls -a dist/uploads
```

Esperado: `.htaccess` aparece na listagem.

- [ ] **Step 3: Commit**

```bash
git add public/uploads/.htaccess
git commit -m "feat(upload): impedir execucao de arquivo na pasta de uploads

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: O painel envia o arquivo

**Files:**
- Create: `src/lib/imagens.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/admin/EventoForm.tsx`

**Interfaces:**
- Consumes: o contrato do endpoint da Task 4 (`POST upload.php`, campo `imagem`, resposta `{url}` ou `{erro}`)
- Produces:
  - `tokenAtual(): Promise<string>` em `src/lib/auth.ts`
  - `enviarImagemEvento(arquivo: File): Promise<string>` e a constante `ACEITA` em `src/lib/imagens.ts`

Não há suíte de testes no front-end deste projeto e não vamos criar uma para
três funções — a verificação aqui é `tsc`, o build e a tela real.

- [ ] **Step 1: Expor o token em `src/lib/auth.ts`**

Acrescente ao fim do arquivo:

```ts
/**
 * Token de quem está logado, para provar ao servidor do site que o envio de
 * imagem parte do painel. O Firebase renova o token sozinho quando expira.
 */
export async function tokenAtual(): Promise<string> {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Sua sessão expirou. Entre de novo.');
  return usuario.getIdToken();
}
```

- [ ] **Step 2: Criar `src/lib/imagens.ts`**

```ts
/**
 * Envio da imagem de capa para o servidor do próprio site.
 *
 * O Cloud Storage do Firebase exigiria o plano Blaze, então quem guarda o
 * arquivo é a hospedagem: `upload.php` recebe, valida, redimensiona e devolve
 * a URL — que é tudo o que o evento guarda.
 *
 * O caminho é relativo de propósito. O painel vive na raiz do site publicado
 * e um caminho absoluto quebraria no GitHub Pages, onde o site mora numa
 * subpasta (lá o upload não funciona de qualquer forma: não há PHP).
 */
import { tokenAtual } from './auth';

const ENDPOINT = 'upload.php';

/** Atributo `accept` do input de arquivo. Os mesmos tipos que o PHP aceita. */
export const ACEITA = 'image/jpeg,image/png,image/webp,image/avif';

/** 5 MB — o mesmo teto do servidor, checado aqui só para avisar antes. */
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export const ERRO_TAMANHO = 'A imagem passa de 5 MB. Reduza o arquivo e tente de novo.';
export const ERRO_ENVIO = 'Não foi possível enviar a imagem. Tente de novo.';

/**
 * Envia a imagem e devolve a URL pública, pronta para gravar no evento.
 *
 * Lança `Error` com mensagem pronta para a tela: o formulário mostra o que
 * vier daqui sem reescrever nada.
 */
export async function enviarImagemEvento(arquivo: File): Promise<string> {
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error(ERRO_TAMANHO);

  const corpo = new FormData();
  corpo.append('imagem', arquivo);

  let resposta: Response;
  try {
    resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await tokenAtual()}` },
      body: corpo,
    });
  } catch (erro) {
    if (import.meta.env.DEV) console.error('[imagens] rede', erro);
    throw new Error(ERRO_ENVIO);
  }

  // O servidor manda a mensagem já pronta para a pessoa ler; só caímos no
  // texto genérico quando a resposta não é o JSON que combinamos.
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok || typeof dados?.url !== 'string') {
    throw new Error(typeof dados?.erro === 'string' ? dados.erro : ERRO_ENVIO);
  }

  return dados.url;
}
```

- [ ] **Step 3: Trocar o campo no formulário**

Em `src/admin/EventoForm.tsx`, restaure o campo de arquivo que existia antes do
commit `60be29f`:

```bash
git show 60be29f^:src/admin/EventoForm.tsx > src/admin/EventoForm.tsx
```

Esse arquivo já importa `ACEITA`, `ERRO_ENVIO` e `enviarImagemEvento` de
`../lib/imagens` — os mesmos nomes criados no Step 2 — e traz o componente
`CampoImagem` com prévia em 16:9 e o salvar travado durante o envio.

- [ ] **Step 4: Verificar tipos e build**

```bash
docker exec mde-santer-hub-node npm run lint
docker exec mde-santer-hub-node npm run build
```

Esperado: `tsc` sem saída de erro; build concluído. Confira também que o
pacote da página pública (`dist/assets/index-*.js`) continua em torno de
395 KB — o código de upload só pode entrar no pedaço do painel.

- [ ] **Step 5: Ver a tela**

```bash
docker exec mde-santer-hub-node node .mde-tools/shot.cjs 'https://santer-hub.test/#/admin' /app/.mde-tools/upload.png
```

Esperado: a tela de login, sem erro no console. O formulário em si só aparece
com credencial do painel; se você tiver uma, passe e-mail e senha como 3º e 4º
argumentos para fotografar o formulário com o campo de arquivo.

- [ ] **Step 6: Commit**

```bash
git add src/lib/imagens.ts src/lib/auth.ts src/admin/EventoForm.tsx
git commit -m "feat(painel): enviar a capa como arquivo para o servidor do site

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Publicar e conferir em produção

**Files:** nenhum

O upload não tem como ser exercitado em desenvolvimento: não há PHP no
`santer-hub.test`. Esta task é a verificação de verdade, e nenhuma das
anteriores substitui.

- [ ] **Step 1: Abrir PR e publicar**

```bash
git push origin feat/upload-servidor-proprio
gh pr create --fill
```

Só entre na `main` depois da revisão. O merge dispara os dois deploys.

- [ ] **Step 2: Confirmar que o endpoint existe e recusa quem não tem token**

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://hub.santerempreendimentos.com.br/upload.php
```

Esperado: `401`.

- [ ] **Step 3: Confirmar que o cabeçalho Authorization chega ao PHP**

```bash
curl -s -X POST -H 'Authorization: Bearer token-invalido' \
  https://hub.santerempreendimentos.com.br/upload.php
```

Esperado: `{"erro":"Sua sessão expirou. Entre de novo para enviar a imagem."}`.
A mesma mensagem sairia se o cabeçalho tivesse sido descartado pelo servidor,
então este passo só descarta o problema junto com o Step 4: se o envio pelo
painel funcionar, o cabeçalho chegou.

- [ ] **Step 4: Confirmar que a pasta não executa PHP**

Envie uma capa pelo painel primeiro, para a pasta existir. Depois:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://hub.santerempreendimentos.com.br/uploads/eventos/qualquer.php
```

Esperado: `403`. Um `404` também é aceitável — o que não pode aparecer é `200`
com conteúdo executado.

- [ ] **Step 5: Enviar uma capa de verdade pelo painel**

Escolha uma foto grande (3 MB ou mais). Confira, na URL gravada no evento:
a imagem abre, tem no máximo 1600px de largura e pesa uma fração do original.

- [ ] **Step 6: Confirmar que a capa sobrevive a um deploy**

Rode o deploy de novo e recarregue a imagem:

```bash
gh workflow run "Deploy via FTP" -R mtksanter-maker/santer-hub-agenda --ref main
```

Esperado: a imagem continua no ar. É a confirmação prática de que a action não
apaga o que ela não enviou.

- [ ] **Step 7: Atualizar o README**

O README afirma que o site não tem back-end. Agora tem uma exceção, e ela
precisa estar escrita: uma seção curta sobre o `upload.php` — o que ele faz,
que exige token do painel, e que as capas ficam em `uploads/eventos/`.

```bash
git add README.md
git commit -m "docs: registrar o endpoint de upload das capas

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Ordem e dependências

As tasks 1 a 4 constroem o endpoint e precisam ser feitas em ordem: cada uma
usa as funções da anterior. A 5 é independente e pode ser feita a qualquer
momento. A 6 depende do contrato definido na 4. A 7 depende de todas.
