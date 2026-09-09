# Upload das capas no servidor próprio

Data: 2026-09-09
Situação: aguardando revisão

## O problema

O painel pede o **link** da imagem de capa. O cliente quer escolher um arquivo
do computador.

O projeto já teve esse campo: o commit `4d558b2` enviava a capa para o Cloud
Storage do Firebase, e o `60be29f` removeu tudo, trocando por um `input
type="url"`. O motivo não está escrito em lugar nenhum, mas é visível de fora:
**o bucket não existe**. Listar `santer-hub.firebasestorage.app` devolve `404
Not Found` — se o bucket existisse e as regras bloqueassem, viria `403`.
Provisionar o Storage exige o plano Blaze e acesso ao console do Firebase, que
ninguém desta ponta tem.

Daí a decisão: **receber o arquivo no servidor do próprio site**, sem depender
do Firebase para armazenar.

## O que muda de fundo

O site é estático e tem orgulho disso: o `README` diz que não há back-end, e o
`server.ts` só entrega arquivos. Esta mudança quebra isso — passa a existir um
endpoint que recebe dados de fora. É a razão de esta spec existir.

O que **não** muda: o evento continua guardando uma **string de URL** no
Firestore. O site público não sabe nem precisa saber de onde a imagem veio, e
os eventos que hoje apontam para links externos seguem funcionando.

## Decisões tomadas

| Questão | Decisão | Por quê |
|---|---|---|
| Onde o arquivo fica | Servidor próprio, em `uploads/eventos/` | Não depende do plano Blaze nem de acesso ao console |
| Quem pode enviar | Só quem está logado no painel, verificado pelo token do Firebase | Nenhuma senha nova; a mesma regra do painel |
| Como o PHP confere o token | Perguntando ao Google a cada envio | ~15 linhas contra ~70 de criptografia; impossível esquecer uma checagem |
| Tratamento da imagem | Redimensionar para 1600px no servidor | O cliente manda foto de celular; o visitante não deve baixar 4 MB |
| Campo de colar link | Sai do formulário | Foi o pedido: só upload |

## O ambiente, medido

Levantado em 09/09/2026 com um arquivo de diagnóstico temporário, subido e
removido em seguida:

- PHP **8.5.10**, com **GD** (JPEG, PNG, WebP, AVIF) e Imagick
- `curl` presente e com **saída HTTPS funcionando** (alcançou o Google)
- `upload_max_filesize` e `post_max_size` de **2 GB**; nenhum limite aperta aqui
- O PHP **pode criar pastas**, então `uploads/eventos/` nasce no primeiro envio
- Docroot: `/home/santer/web/hub.santerempreendimentos.com.br/public_html`
- Cloudflare e um micro-cache na frente do site

Nada no desenho depende de algo que falte.

## Arquitetura

```
Painel (navegador)                    Servidor do site              Google
  escolhe arquivo
  POST /upload.php  ──────────────▶  upload.php
    Authorization: Bearer <token>      valida o token  ──────────▶  accounts:lookup
    multipart: imagem                                   ◀──────────  quem é / inválido
                                       valida tipo e tamanho
                                       redimensiona (GD)
                                       grava uploads/eventos/<aleatório>.jpg
  { "url": "https://..." }  ◀────────  devolve a URL absoluta
  grava a URL no evento ────────────────────────────────────────▶  Firestore
```

Mesma origem do site, então **não há CORS** — o problema que inviabiliza o
caminho do Firebase Storage não existe aqui.

## O contrato do endpoint

`POST /upload.php`

- Cabeçalho `Authorization: Bearer <idToken do Firebase>`
- Corpo `multipart/form-data` com o campo `imagem`
- Resposta `200`: `{ "url": "https://hub.santerempreendimentos.com.br/uploads/eventos/xxx.jpg" }`
- Resposta de erro: código HTTP adequado e `{ "erro": "mensagem pronta para a tela" }`

Códigos: `401` token ausente, inválido ou expirado · `413` arquivo grande demais
· `415` não é imagem de formato aceito · `500` falha ao gravar.

A URL devolvida é **absoluta**, montada a partir do host da requisição. Precisa
ser: o site também é publicado no GitHub Pages, e uma URL relativa quebraria lá.

## Como o token é conferido

O painel manda o `idToken` que o Firebase já mantém na sessão. O PHP repassa
para `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=<apiKey>`.
Se o Google devolver um usuário, o envio segue; qualquer outra coisa é `401`.

A `apiKey` é a mesma que já está pública em `src/lib/firebase.ts` — ela
identifica o projeto, não autoriza nada. E é justamente por ser do projeto que
ela serve aqui: um token de outro projeto Firebase não passa nessa checagem.

Não há lista de e-mails autorizados: quem tem conta no projeto é administrador
do painel, e não existe autocadastro.

## Segurança do arquivo recebido

A ameaça real é subir um `.php` disfarçado de imagem e depois acessá-lo. Três
barreiras, nessa ordem:

1. **O tipo vem do conteúdo, nunca do nome.** `getimagesize()` decide o que é
   o arquivo; a extensão enviada é ignorada.
2. **O arquivo é reescrito, não copiado.** O GD decodifica e regrava a imagem.
   Um PHP embutido nos metadados não sobrevive a isso.
3. **A pasta não executa nada.** Um `.htaccess` em `uploads/` desliga o handler
   de PHP e força `Content-Type` de imagem.

Some-se: nome gerado no servidor (aleatório, sem relação com o original, dois
envios de `capa.jpg` não se atropelam), teto de 5 MB antes de qualquer
processamento, e apenas JPEG, PNG, WebP e AVIF aceitos.

## Redimensionamento

Largura máxima de 1600px, proporção preservada, saída sempre JPEG com qualidade
82. Imagem menor que isso não é ampliada.

Sempre JPEG porque a capa é foto e o card recorta em 16:9 de qualquer jeito; a
transparência de um PNG não teria para onde ir. Uma foto de celular de 4 MB sai
em torno de 200 KB.

## Convivência com o deploy

O `upload.php` e o `.htaccess` moram em `public/`, que o Vite copia para o
`dist/` — então sobem junto no deploy que já existe, sem passo manual.

**As imagens enviadas sobrevivem aos deploys.** A `FTP-Deploy-Action` guarda o
próprio inventário (`.ftp-deploy-sync-state.json`) e só apaga o que ela mesma
enviou. Verificado na prática em 09/09/2026: na primeira run ela relatou `Server
Files: 0` mesmo havendo um `index.php` da hospedagem na pasta, e não o tocou; e
o arquivo de diagnóstico, esse sim enviado por ela, sumiu quando foi removido do
repositório. Se fosse o contrário, cada publicação apagaria as capas do cliente.

## O formulário

A branch `feat/upload-capa`, que restaurou o upload contra o Firebase Storage,
fica sem uso: ela depende do bucket que não existe. O `CampoImagem` dela é
reaproveitado inteiro aqui, e a branch em si pode ser descartada depois —
o histórico continua guardando o caminho do Storage, se um dia o Blaze entrar.

O componente traz:
botão de escolher arquivo, envio na hora da escolha, prévia no mesmo recorte
16:9 do card público, e salvar travado enquanto o envio não termina.

Muda só o miolo do `src/lib/imagens.ts`: em vez de `uploadBytes` no Storage do
Firebase, um `fetch` para `/upload.php` com o token no cabeçalho. A interface da
função continua a mesma — recebe um `File`, devolve a URL.

Em desenvolvimento (`santer-hub.test`) não há PHP, então o envio falha com a
mensagem de erro normal. É esperado: o upload se verifica em produção.

## Fora do escopo, de propósito

- **Apagar a imagem antiga quando a capa é trocada.** O arquivo velho fica
  órfão. Fazer isso direito exige saber se nenhum outro evento aponta para ele;
  não vale a complexidade agora.
- Vários tamanhos por imagem, CDN, galeria de imagens já enviadas.

## Riscos

**O upload depende do Google estar de pé.** Se o `accounts:lookup` não
responder, ninguém envia. Mas nesse cenário o login do painel também não
funciona, então não é uma fragilidade nova.

**Um erro no `.htaccess` derruba a barreira mais importante.** Depois do
primeiro deploy, confirmar na prática que um `.php` dentro de `uploads/` não
executa — não basta o arquivo estar escrito.

**O micro-cache da hospedagem pode servir HTML velho** depois de um deploy. Não
afeta o `POST` do upload, mas pode confundir na hora de testar.

## Como verificar

O projeto não tem suíte de testes automatizados; a verificação é a que ele já
usa: `npm run lint`, `npm run build` e o `npm run verificar`, que não cobre
upload.

Em produção, depois do deploy:

1. Enviar uma capa pelo painel e ver a URL gravada no evento.
2. Abrir a imagem: precisa ser bem menor que o original e ter no máximo 1600px.
3. `POST /upload.php` sem token → `401`.
4. `POST` com token válido e um `.php` renomeado para `.jpg` → `415`.
5. Acessar um `.php` colocado dentro de `uploads/` → não pode executar.
6. Publicar um deploy qualquer e confirmar que a capa enviada continua no ar.
