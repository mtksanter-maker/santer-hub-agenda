/**
 * Inicialização única do Firebase.
 *
 * É o único lugar do projeto que chama `initializeApp()`. Todo o resto importa
 * daqui — nunca cria a própria instância.
 *
 * Usamos o SDK modular (`firebase/app`, `firebase/firestore/lite`,
 * `firebase/auth`), não o antigo `firebase/compat`.
 *
 * POR QUE FIRESTORE LITE
 * ----------------------
 * O site faz apenas leituras e gravações pontuais — nunca escuta mudanças em
 * tempo real nem precisa de cache offline. A versão Lite cobre exatamente isso
 * e pesa menos da metade do SDK completo no pacote final.
 *
 * POR QUE O AUTH NÃO É INICIALIZADO AQUI
 * --------------------------------------
 * `getAuth()` vive em `src/lib/auth.ts`, que só é carregado pelo painel. Se o
 * Authentication fosse inicializado neste arquivo, todo visitante da página
 * pública baixaria o SDK de autenticação sem precisar — cerca de 100 KB a mais
 * em cada visita. A instância continua sendo uma só, criada a partir do mesmo
 * `app` exportado abaixo.
 *
 * SOBRE A CHAVE PÚBLICA
 * ---------------------
 * A `apiKey` do Firebase é pública por natureza — ela identifica o projeto, não
 * autoriza nada. Quem controla o acesso são as Security Rules do Firestore
 * (veja `firestore.rules`). Por isso ela pode viver no código do site.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: 'AIzaSyAPQ330T_Y24dCfVtCxzsS5KjHddPJ9hk8',
  authDomain: 'santer-hub.firebaseapp.com',
  projectId: 'santer-hub',
  storageBucket: 'santer-hub.firebasestorage.app',
  messagingSenderId: '603883570282',
  appId: '1:603883570282:web:a047921276b6d385c8f613',
};

/** Instância única do Firebase App. Base do Firestore e do Authentication. */
export const app = initializeApp(firebaseConfig);

/** Banco dos eventos. Nenhum dado de participante é gravado aqui. */
export const db = getFirestore(app);
