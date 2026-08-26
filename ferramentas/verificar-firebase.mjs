/**
 * Diagnóstico da integração com o Firebase.
 *
 *   npm run verificar                          → só o que não exige login
 *   npm run verificar -- email@x.com senha     → ciclo completo de CRUD
 *
 * Testa contra o projeto real. Os eventos criados no teste são apagados no fim.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore/lite';
import { readFileSync } from 'node:fs';

/* Lê a mesma configuração que o site usa, para não haver divergência. */
const fonte = readFileSync('src/lib/firebase.ts', 'utf8');
const valor = (campo) => (new RegExp(`${campo}:\\s*'([^']*)'`).exec(fonte) || [])[1];

const firebaseConfig = {
  apiKey: valor('apiKey'),
  authDomain: valor('authDomain'),
  projectId: valor('projectId'),
  storageBucket: valor('storageBucket'),
  messagingSenderId: valor('messagingSenderId'),
  appId: valor('appId'),
};

const [email, senha] = process.argv.slice(2);

let falhas = 0;
function conferir(nome, ok, extra = '') {
  console.log(`  ${ok ? 'OK   ' : 'FALHA'} ${nome}${extra ? `  → ${extra}` : ''}`);
  if (!ok) falhas++;
}

function titulo(texto) {
  console.log(`\n${texto}\n${'─'.repeat(texto.length)}`);
}

function codigo(erro) {
  return erro && typeof erro === 'object' && 'code' in erro ? String(erro.code) : String(erro);
}

/* ========================================================================== */

titulo('1. Inicialização do Firebase');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
conferir('projeto', !!firebaseConfig.projectId, firebaseConfig.projectId);
conferir('Firestore inicializado', !!db);
conferir('Authentication inicializado', !!auth);

titulo('2/3. Leitura pública (ativo == true), sem login');
let publicos = [];
try {
  const r = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
  publicos = r.docs.map((d) => ({ id: d.id, ...d.data() }));
  conferir('consulta filtrada é permitida', true, `${publicos.length} evento(s) ativo(s)`);
  conferir(
    '4. nenhum inativo veio na consulta pública',
    publicos.every((e) => e.ativo === true),
  );
} catch (erro) {
  conferir('consulta filtrada é permitida', false, codigo(erro));
  console.log(`
  Se apareceu permission-denied, as Security Rules ainda não foram publicadas.
  Console do Firebase → Firestore Database → Regras → cole firestore.rules → Publicar.`);
}

titulo('TESTE DE SEGURANÇA — leitura sem filtro, sem login');
try {
  await getDocs(collection(db, 'eventos'));
  conferir('leitura irrestrita deve ser bloqueada', false, 'foi PERMITIDA — regras abertas demais');
} catch (erro) {
  conferir('leitura irrestrita é bloqueada', codigo(erro).includes('permission-denied'), codigo(erro));
}

titulo('5/6/7. TESTE DE SEGURANÇA — escrita sem autenticação');
try {
  await addDoc(collection(db, 'eventos'), {
    nome: 'INVASOR',
    descricao: '',
    data: '2026-01-01',
    hora: '00:00',
    imagem: 'https://exemplo.com/evento.jpg',
    linkGoogleForms: 'https://exemplo.com',
    ativo: true,
  });
  conferir('criar sem login deve falhar', false, 'foi PERMITIDO — regras abertas demais');
} catch (erro) {
  conferir('criar sem login é bloqueado', codigo(erro).includes('permission-denied'), codigo(erro));
}

if (publicos.length > 0) {
  const alvo = publicos[0].id;
  try {
    await updateDoc(doc(db, 'eventos', alvo), { nome: 'INVASOR' });
    conferir('editar sem login deve falhar', false, 'foi PERMITIDO');
  } catch (erro) {
    conferir('editar sem login é bloqueado', codigo(erro).includes('permission-denied'), codigo(erro));
  }
  try {
    await deleteDoc(doc(db, 'eventos', alvo));
    conferir('excluir sem login deve falhar', false, 'foi PERMITIDO');
  } catch (erro) {
    conferir('excluir sem login é bloqueado', codigo(erro).includes('permission-denied'), codigo(erro));
  }
} else {
  console.log('  (sem eventos ativos para testar edição/exclusão anônima)');
}

titulo('9. Login inválido');
try {
  await signInWithEmailAndPassword(auth, 'ninguem@santer-teste.invalid', 'senhaerrada123');
  conferir('login inválido deve falhar', false, 'foi ACEITO');
} catch (erro) {
  const c = codigo(erro);
  conferir('login inválido é recusado', c.startsWith('auth/'), c);
}

if (!email || !senha) {
  console.log(`
Para testar o ciclo completo (login, criar, editar, ativar/desativar, excluir):

  npm run verificar -- seu-email@dominio.com SUA_SENHA

Crie o usuário em: Console do Firebase → Authentication → Users → Adicionar usuário.
`);
  process.exit(falhas === 0 ? 0 : 1);
}

/* ========================================================================== */

titulo('8. Login do administrador');
try {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  conferir('login aceito', true, credencial.user.email || '');
  console.log(`         UID: ${credencial.user.uid}`);
} catch (erro) {
  conferir('login aceito', false, codigo(erro));
  console.log('\n  Sem login não dá para testar o CRUD. Confira e-mail, senha e se o');
  console.log('  provedor "E-mail/senha" está ativo em Authentication → Sign-in method.\n');
  process.exit(1);
}

titulo('10. Admin enxerga ativos e inativos');
let idTeste = null;
try {
  const r = await getDocs(collection(db, 'eventos'));
  conferir('leitura completa permitida', true, `${r.size} evento(s) no total`);
} catch (erro) {
  conferir('leitura completa permitida', false, codigo(erro));
}

titulo('11. Criar evento');
try {
  const ref = await addDoc(collection(db, 'eventos'), {
    nome: 'TESTE AUTOMÁTICO — pode apagar',
    descricao: 'Criado pelo diagnóstico.',
    data: '2026-09-15',
    hora: '19:00',
    imagem: 'https://exemplo.com/evento.jpg',
    linkGoogleForms: 'https://docs.google.com/forms/d/e/TESTE/viewform',
    ativo: true,
  });
  idTeste = ref.id;
  conferir('evento criado', true, `id ${idTeste}`);
} catch (erro) {
  conferir('evento criado', false, codigo(erro));
}

if (idTeste) {
  titulo('12/14. Aparece na consulta pública');
  const ativos = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
  conferir('evento ativo está na lista pública', ativos.docs.some((d) => d.id === idTeste));

  titulo('15/16/17. Editar');
  await updateDoc(doc(db, 'eventos', idTeste), {
    nome: 'TESTE AUTOMÁTICO — editado',
    descricao: 'Editado pelo diagnóstico.',
    data: '2026-09-16',
    hora: '19:30',
    imagem: 'https://exemplo.com/evento-editado.jpg',
    linkGoogleForms: 'https://docs.google.com/forms/d/e/TESTE/viewform',
    ativo: true,
  });
  const aposEditar = await getDocs(collection(db, 'eventos'));
  const editado = aposEditar.docs.find((d) => d.id === idTeste)?.data();
  conferir('alteração gravada', editado?.nome === 'TESTE AUTOMÁTICO — editado', editado?.nome);
  conferir('hora atualizada', editado?.hora === '19:30', editado?.hora);

  titulo('18/19/20. Desativar');
  await updateDoc(doc(db, 'eventos', idTeste), { ...editado, ativo: false });
  const semEle = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
  conferir('some da lista pública', !semEle.docs.some((d) => d.id === idTeste));
  const todos = await getDocs(collection(db, 'eventos'));
  conferir('continua visível para o admin', todos.docs.some((d) => d.id === idTeste));

  titulo('21. Reativar');
  await updateDoc(doc(db, 'eventos', idTeste), { ...editado, ativo: true });
  const voltou = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
  conferir('volta para a lista pública', voltou.docs.some((d) => d.id === idTeste));

  titulo('VALIDAÇÃO DAS REGRAS — campos fora do formato');
  try {
    await addDoc(collection(db, 'eventos'), {
      nome: 'X',
      descricao: '',
      data: '15/09/2026',
      hora: '19:00',
      imagem: 'https://exemplo.com/evento.jpg',
      linkGoogleForms: 'https://x.com',
      ativo: true,
    });
    conferir('data em formato errado deve ser recusada', false, 'foi ACEITA');
  } catch (erro) {
    conferir('data em formato errado é recusada', codigo(erro).includes('permission-denied'), codigo(erro));
  }
  try {
    await addDoc(collection(db, 'eventos'), {
      nome: 'X',
      descricao: '',
      data: '2026-09-15',
      hora: '19:00',
      imagem: 'https://exemplo.com/evento.jpg',
      linkGoogleForms: 'https://x.com',
      ativo: true,
      emailParticipante: 'a@b.com',
    });
    conferir('campo extra deve ser recusado', false, 'foi ACEITO');
  } catch (erro) {
    conferir('campo extra é recusado', codigo(erro).includes('permission-denied'), codigo(erro));
  }

  titulo('22/23. Excluir (limpeza)');
  await deleteDoc(doc(db, 'eventos', idTeste));
  const final = await getDocs(collection(db, 'eventos'));
  conferir('evento removido do Firestore', !final.docs.some((d) => d.id === idTeste));
  conferir(
    'nenhum resíduo de teste',
    !final.docs.some((d) => String(d.data().nome).startsWith('TESTE AUTOMÁTICO')),
    `${final.size} evento(s) restante(s)`,
  );
}

titulo('24/25. Logout e bloqueio depois de sair');
await signOut(auth);
conferir('sessão encerrada', auth.currentUser === null);

try {
  await addDoc(collection(db, 'eventos'), {
    nome: 'DEPOIS DO LOGOUT',
    descricao: '',
    data: '2026-01-01',
    hora: '00:00',
    imagem: 'https://exemplo.com/evento.jpg',
    linkGoogleForms: 'https://exemplo.com',
    ativo: true,
  });
  conferir('escrita após logout deve falhar', false, 'foi PERMITIDA');
} catch (erro) {
  conferir('escrita após logout é bloqueada', codigo(erro).includes('permission-denied'), codigo(erro));
}

console.log(
  falhas === 0
    ? '\nTodos os testes passaram.\n'
    : `\n${falhas} verificação(ões) falharam.\n`,
);
process.exit(falhas === 0 ? 0 : 1);
