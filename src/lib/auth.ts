/**
 * Autenticação do painel, via Firebase Authentication (e-mail e senha).
 *
 * Nenhuma senha existe no código, no localStorage ou no sessionStorage: quem
 * mantém a sessão é o próprio Firebase. Ao fazer logout, ou quando o token
 * expira, o painel volta sozinho para a tela de login.
 *
 * O front-end não é a camada de segurança — ele apenas esconde a interface.
 * Quem autoriza de fato as operações são as Security Rules do Firestore.
 */

import { useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { app } from './firebase';

/**
 * Instância única do Authentication, criada a partir do mesmo Firebase App.
 * Fica aqui, e não em firebase.ts, para que o SDK de autenticação só seja
 * baixado por quem abre o painel.
 */
const auth = getAuth(app);

/** Mensagens amigáveis para os erros de login do Firebase. */
const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'E-mail ou senha inválidos.',
  'auth/user-not-found': 'E-mail ou senha inválidos.',
  'auth/wrong-password': 'E-mail ou senha inválidos.',
  'auth/user-disabled': 'Este usuário está desativado.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/network-request-failed': 'Sem conexão com o servidor. Verifique sua internet.',
};

function mensagemDeErro(erro: unknown): string {
  const cod =
    typeof erro === 'object' && erro !== null && 'code' in erro
      ? String((erro as { code: unknown }).code)
      : '';

  if (import.meta.env.DEV) console.error('[auth]', erro);

  return MENSAGENS[cod] ?? 'Não foi possível entrar. Tente novamente.';
}

/** Entra com e-mail e senha. Lança Error com mensagem pronta para a tela. */
export async function entrar(email: string, senha: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  } catch (erro) {
    throw new Error(mensagemDeErro(erro));
  }
}

/** Encerra a sessão. */
export async function sair(): Promise<void> {
  await signOut(auth);
}

export interface EstadoAutenticacao {
  usuario: User | null;
  /** true enquanto o Firebase ainda não disse se há sessão salva. */
  carregando: boolean;
}

/**
 * Acompanha a sessão do Firebase.
 *
 * `carregando` evita o pisca-pisca de mostrar a tela de login por um instante
 * antes de o Firebase restaurar uma sessão que já existia.
 */
export function useAutenticacao(): EstadoAutenticacao {
  const [estado, setEstado] = useState<EstadoAutenticacao>({
    usuario: null,
    carregando: true,
  });

  useEffect(
    () => onAuthStateChanged(auth, (usuario) => setEstado({ usuario, carregando: false })),
    [],
  );

  return estado;
}
