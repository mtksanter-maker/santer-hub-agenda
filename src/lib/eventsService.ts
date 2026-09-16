/**
 * ============================================================================
 * ÚNICA CAMADA QUE FALA COM O CLOUD FIRESTORE
 * ============================================================================
 *
 * O Firestore é a fonte oficial dos eventos. Nenhum componente monta query
 * própria: todos passam por estas funções.
 *
 *   getPublicEvents()          eventos ativos — página pública
 *   getAdminEvents()           todos, inclusive inativos — exige login
 *   createEvent(dados)         cria com ID automático do Firestore
 *   updateEvent(id, dados)     edita (inclui ativar/desativar)
 *   deleteEvent(id)            exclui
 *
 * Coleção: `eventos`. Cada documento tem exatamente sete campos — nome,
 * descricao, data, hora, imagem, linkGoogleForms e ativo. O ID do documento é
 * o ID do evento; o administrador nunca o preenche.
 *
 * Nenhum dado de participante é gravado: as inscrições acontecem no Google
 * Forms externo, referenciado apenas por `linkGoogleForms`.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { db } from './firebase';
import type { Evento } from '../content/events';
import { urlDaCapa } from './imagens';

const COLECAO = 'eventos';

/** Campos que o administrador preenche — o ID vem do Firestore. */
export type DadosEvento = Omit<Evento, 'id'>;

export const ERRO_LEITURA = 'Não foi possível carregar os eventos.';
export const ERRO_ESCRITA = 'Não foi possível salvar o evento.';
export const ERRO_EXCLUSAO = 'Não foi possível excluir o evento.';
export const ERRO_PERMISSAO = 'Você não tem permissão para esta ação. Faça login novamente.';

/** Detalhes técnicos ficam no console, e só em desenvolvimento. */
function registrar(contexto: string, erro: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[eventsService] ${contexto}`, erro);
  }
}

/** Código de erro do Firebase, quando houver. */
function codigo(erro: unknown): string {
  return typeof erro === 'object' && erro !== null && 'code' in erro
    ? String((erro as { code: unknown }).code)
    : '';
}

/**
 * Traduz a falha em uma mensagem para a tela. Nunca vaza stack trace nem
 * mensagem interna do Firebase.
 */
function mensagemDeErro(erro: unknown, padrao: string): string {
  return codigo(erro) === 'permission-denied' ? ERRO_PERMISSAO : padrao;
}

/** Converte um documento do Firestore no formato usado pelo site. */
function paraEvento(documento: QueryDocumentSnapshot<DocumentData>): Evento {
  const d = documento.data();

  return {
    id: documento.id,
    nome: String(d.nome ?? '').trim(),
    descricao: String(d.descricao ?? '').trim(),
    data: String(d.data ?? '').trim(),
    hora: String(d.hora ?? '').trim(),
    imagem: urlDaCapa(String(d.imagem ?? '')),
    linkGoogleForms: String(d.linkGoogleForms ?? '').trim(),
    ativo: d.ativo === true,
  };
}

/** Garante que só os sete campos previstos cheguem ao Firestore. */
function paraDocumento(dados: DadosEvento) {
  return {
    nome: dados.nome.trim(),
    descricao: (dados.descricao ?? '').trim(),
    data: dados.data.trim(),
    hora: dados.hora.trim(),
    imagem: (dados.imagem ?? '').trim(),
    linkGoogleForms: dados.linkGoogleForms.trim(),
    ativo: dados.ativo === true,
  };
}

/* ==========================================================================
   LEITURA
   ========================================================================== */

/**
 * Eventos da página pública.
 *
 * O filtro `ativo == true` é feito PELO FIRESTORE, não no navegador: as
 * Security Rules só liberam a leitura pública quando a consulta traz esse
 * filtro. Um visitante nunca chega perto de um evento inativo.
 *
 * A ordenação fica no cliente de propósito: combinar `where` com `orderBy` em
 * outro campo exigiria criar um índice composto no console, e a lista é curta.
 */
export async function getPublicEvents(): Promise<Evento[]> {
  try {
    const consulta = query(collection(db, COLECAO), where('ativo', '==', true));
    const resultado = await getDocs(consulta);

    return resultado.docs.map(paraEvento);
  } catch (erro) {
    registrar('getPublicEvents', erro);
    throw new Error(ERRO_LEITURA);
  }
}

/** Todos os eventos, inclusive os inativos. As regras exigem login. */
export async function getAdminEvents(): Promise<Evento[]> {
  try {
    const resultado = await getDocs(collection(db, COLECAO));
    return resultado.docs.map(paraEvento);
  } catch (erro) {
    registrar('getAdminEvents', erro);
    throw new Error(mensagemDeErro(erro, ERRO_LEITURA));
  }
}

/* ==========================================================================
   ESCRITA — as Security Rules exigem usuário autenticado
   ========================================================================== */

/** Cria um evento. O ID é gerado pelo Firestore. */
export async function createEvent(dados: DadosEvento): Promise<Evento> {
  try {
    const referencia = await addDoc(collection(db, COLECAO), paraDocumento(dados));
    return { id: referencia.id, ...paraDocumento(dados) };
  } catch (erro) {
    registrar('createEvent', erro);
    throw new Error(mensagemDeErro(erro, ERRO_ESCRITA));
  }
}

/** Edita um evento pelo ID do documento. Também é o caminho de ativar/desativar. */
export async function updateEvent(id: string, dados: DadosEvento): Promise<Evento> {
  try {
    await updateDoc(doc(db, COLECAO, id), paraDocumento(dados));
    return { id, ...paraDocumento(dados) };
  } catch (erro) {
    registrar('updateEvent', erro);
    throw new Error(mensagemDeErro(erro, ERRO_ESCRITA));
  }
}

/** Exclui um evento. Só resolve depois que o Firestore confirma. */
export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLECAO, id));
  } catch (erro) {
    registrar('deleteEvent', erro);
    throw new Error(mensagemDeErro(erro, ERRO_EXCLUSAO));
  }
}
