# Santer Hub — Agenda

Vitrine dos eventos do Santer Hub. O site divulga os eventos e manda o
participante para o **Google Forms** de cada um.

**O site não coleta, não valida e não armazena nenhum dado de participante.**
Toda a inscrição acontece dentro do Google Forms, fora do site.

```
Página pública  →  Cloud Firestore  →  lê somente eventos ativos
Painel admin    →  Firebase Auth + Cloud Firestore  →  CRUD dos eventos
Participante    →  "Quero participar"  →  Google Forms externo
```

Os eventos vivem no Firestore: qualquer pessoa que abrir o site vê a mesma
agenda, em qualquer dispositivo, e o que você altera no painel aparece para
todos.

## Rodar localmente

**Pré-requisito:** Node.js 18+

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros comandos:

```bash
npm run build      # gera dist/
npm start          # serve o build (porta 5173, ou a da variável PORT)
npm run lint       # checagem de tipos (tsc --noEmit)
npm run verificar  # diagnóstico da conexão com o Firebase
```

O site não tem back-end próprio: o servidor apenas entrega os arquivos. Funciona
igual em hospedagem estática (Firebase Hosting, Vercel, Netlify) ou com Node.

## Configurar o Firebase (uma vez só)

O projeto já aponta para o Firebase `santer-hub`. Faltam dois passos no console:

### 1. Publicar as Security Rules

Console → **Firestore Database → Regras** → cole o conteúdo de
[`firestore.rules`](firestore.rules) → **Publicar**.

São elas que garantem que o público só leia eventos ativos e que ninguém escreva
sem estar autenticado.

### 2. Criar o usuário administrador

Console → **Authentication → Sign-in method** → ative **E-mail/senha**.
Depois, aba **Users** → **Adicionar usuário** com e-mail e senha.

Não existe autocadastro: o site nunca chama `createUserWithEmailAndPassword`.
Só entra quem você criar ali.

### Conferir se deu certo

```bash
npm run verificar                              # o que não exige login
npm run verificar -- seu@email.com SUA_SENHA   # ciclo completo de CRUD
```

O diagnóstico testa a inicialização, a leitura pública, o bloqueio de escrita
anônima, o login inválido e — com credenciais — todo o ciclo de criar, editar,
ativar/desativar e excluir. Os eventos de teste são apagados no fim.

## Painel administrativo

Endereço: **`/#/admin`** — local: <http://localhost:5173/#/admin>

Não há link para ele no site público.

O acesso é por **Firebase Authentication** (e-mail e senha). Nenhuma senha
existe no código, no `localStorage` ou no `sessionStorage` — quem mantém a
sessão é o Firebase. O botão **Sair** encerra a sessão.

O painel faz cinco coisas: **listar, criar, editar, excluir e ativar/desativar**
eventos. O administrador autenticado enxerga também os eventos inativos.

## Um evento

Coleção `eventos`, um documento por evento:

```json
{
  "nome": "Masterclass TIR",
  "descricao": "Descrição opcional",
  "data": "2026-09-15",
  "hora": "19:00",
  "linkGoogleForms": "https://docs.google.com/forms/...",
  "ativo": true
}
```

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| `nome` | ✅ | |
| `descricao` | — | Aparece no card quando preenchida |
| `data` | ✅ | `AAAA-MM-DD` |
| `hora` | ✅ | `HH:MM` |
| `linkGoogleForms` | ✅ | Precisa começar com `https://` |
| `ativo` | ✅ | Padrão: Ativo |

O **ID do evento é o ID do documento**, gerado automaticamente pelo Firestore.
O administrador nunca o preenche.

**Ativo** aparece no site. **Inativo** continua no painel, mas some da página
pública — serve para preparar um evento antes de publicá-lo.

Eventos passados não são excluídos sozinhos: desative, edite ou exclua quando
quiser.

## Como o site conversa com o Firebase

| Arquivo | Papel |
| --- | --- |
| [`src/lib/firebase.ts`](src/lib/firebase.ts) | Único `initializeApp()`. Exporta `app` e `db` |
| [`src/lib/eventsService.ts`](src/lib/eventsService.ts) | Única camada que fala com o Firestore |
| [`src/lib/auth.ts`](src/lib/auth.ts) | Login, logout e estado da sessão |

Funções do `eventsService`:

| Função | O que faz | Exige login |
| --- | --- | --- |
| `getPublicEvents()` | `where('ativo','==',true)` | não |
| `getAdminEvents()` | Todos, inclusive inativos | sim |
| `createEvent(dados)` | Cria com ID automático | sim |
| `updateEvent(id, dados)` | Edita e ativa/desativa | sim |
| `deleteEvent(id)` | Exclui | sim |

A página pública **filtra no servidor**, não no navegador: as Security Rules só
liberam a leitura anônima quando a consulta traz `ativo == true`. A ordenação é
feita no cliente — combinar `where` com `orderBy` em outro campo exigiria criar
um índice composto no console, e a lista é curta.

Duas escolhas de peso do pacote, ambas sem perda de funcionalidade:

- **Firestore Lite** (`firebase/firestore/lite`): o site só faz leituras e
  gravações pontuais, nunca escuta mudanças em tempo real. Metade do tamanho.
- **Painel carregado sob demanda**: o SDK de autenticação só é baixado por quem
  abre `/#/admin`, não por quem visita a home.

## Google Forms

Cada evento tem um formulário criado por você, fora do site. O site só abre o
link — não cria, não edita e não lê respostas.

O link abre em nova aba, com `rel="noopener noreferrer"`. Enquanto o link não
for uma URL válida, o card mostra **Em breve** em vez de um botão quebrado.

## Outros pontos de edição

| Arquivo | Conteúdo |
| --- | --- |
| [`src/content/site.ts`](src/content/site.ts) | Textos institucionais, logo, vídeo, endereço, e-mail, redes |
| [`src/content/spaces.ts`](src/content/spaces.ts) | Sala Master e Sala Podcast + link externo de agendamento |
| [`src/index.css`](src/index.css) | Cores, tipografia e componentes visuais da marca |

## Estrutura

```
firestore.rules        Security Rules — cole no console do Firebase
ferramentas/
  verificar-firebase.mjs   diagnóstico (npm run verificar)
server.ts              servidor de produção: só entrega dist/
src/
  App.tsx              página única + rota #/admin (carregada sob demanda)
  components/          Header, Hero, About, Agenda, EventCard, Spaces, Footer
  admin/               AdminApp (login + lista), EventoForm (criar/editar)
  content/             events.ts (só o tipo Evento), site.ts, spaces.ts
  lib/
    firebase.ts        inicialização do Firebase App + Firestore
    eventsService.ts   getPublicEvents/getAdminEvents/create/update/delete
    auth.ts            entrar, sair e useAutenticacao
    eventos.ts         ordenação, formatação de data e o hook useEventos
    router.ts          rota por hash (#/admin)
  context/             tema claro/escuro
```
