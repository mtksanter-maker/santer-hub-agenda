/**
 * Painel administrativo — endereço `/#/admin`, sem link no site público.
 *
 * Listar, criar, editar, excluir e ativar/desativar eventos. Tudo grava no
 * Cloud Firestore, então aparece para todo mundo, em qualquer dispositivo.
 *
 * O acesso é por Firebase Authentication (e-mail e senha). Nenhuma senha existe
 * neste código nem no armazenamento do navegador: quem mantém a sessão é o
 * próprio Firebase, e quem autoriza as gravações são as Security Rules.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Evento } from '../content/events';
import { entrar, sair, useAutenticacao } from '../lib/auth';
import { deleteEvent } from '../lib/eventsService';
import { formatarData, ordenarEventos, useEventos } from '../lib/eventos';
import { irPara } from '../lib/router';
import EventoForm from './EventoForm';

export default function AdminApp() {
  const { usuario, carregando } = useAutenticacao();

  useEffect(() => {
    document.title = 'Painel — Santer Hub';
  }, []);

  // Evita mostrar a tela de login por um instante antes de o Firebase
  // restaurar uma sessão que já existia.
  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-on-surface-variant">Verificando acesso...</p>
      </div>
    );
  }

  if (!usuario) return <TelaLogin />;
  return <GerenciarEventos email={usuario.email ?? ''} />;
}

/* ==========================================================================
   Login
   ========================================================================== */

function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (entrando || !email.trim() || !senha) return;

    setEntrando(true);
    setErro('');

    try {
      // Em caso de sucesso, useAutenticacao troca a tela sozinho.
      await entrar(email, senha);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'E-mail ou senha inválidos.');
      setEntrando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5">
      <form onSubmit={enviar} className="glass-card w-full max-w-sm rounded-2xl p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Santer Hub</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-on-surface">
          Painel administrativo
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Entre com seu e-mail e senha para gerenciar os eventos.
        </p>

        <label htmlFor="email-admin" className="mb-1.5 mt-6 block text-sm font-semibold">
          E-mail
        </label>
        <input
          id="email-admin"
          type="email"
          value={email}
          autoComplete="username"
          onChange={(e) => {
            setEmail(e.target.value);
            setErro('');
          }}
          className={estiloEntrada}
        />

        <label htmlFor="senha-admin" className="mb-1.5 mt-4 block text-sm font-semibold">
          Senha
        </label>
        <input
          id="senha-admin"
          type="password"
          value={senha}
          autoComplete="current-password"
          onChange={(e) => {
            setSenha(e.target.value);
            setErro('');
          }}
          className={estiloEntrada}
        />

        {erro && (
          <p role="alert" className="mt-3 text-sm font-medium text-error">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={entrando}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-on-primary transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 focus-ring"
        >
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={() => irPara('')}
          className="mt-4 w-full text-center text-xs font-semibold text-on-surface-variant underline-offset-4 hover:underline focus-ring"
        >
          Voltar ao site
        </button>
      </form>
    </div>
  );
}

const estiloEntrada =
  'w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus-ring';

/* ==========================================================================
   Lista de eventos
   ========================================================================== */

function GerenciarEventos({ email }: { email: string }) {
  // false = traz também os inativos, que só existem aqui dentro.
  const { eventos, carregando, erro, recarregar } = useEventos(false);

  /** `null` = nenhum formulário aberto; 'novo' = criação. */
  const [editando, setEditando] = useState<Evento | 'novo' | null>(null);
  const [confirmando, setConfirmando] = useState<Evento | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  async function excluir(evento: Evento) {
    if (excluindo) return;

    setExcluindo(true);
    setErroAcao('');

    try {
      // Só seguimos depois que o Firestore confirma a exclusão.
      await deleteEvent(evento.id);
      setConfirmando(null);
      await recarregar();
    } catch (falha) {
      setErroAcao(falha instanceof Error ? falha.message : 'Não foi possível excluir o evento.');
      setConfirmando(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (editando) {
    return (
      <Moldura email={email}>
        <EventoForm
          evento={editando === 'novo' ? null : editando}
          onCancelar={() => setEditando(null)}
          onSalvo={async () => {
            setEditando(null);
            await recarregar();
          }}
        />
      </Moldura>
    );
  }

  const mensagem = erroAcao || erro;

  return (
    <Moldura email={email}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Gerenciar eventos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {carregando ? 'Carregando eventos...' : `${eventos.length} evento(s) cadastrado(s)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void recarregar()}
            disabled={carregando}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-60 focus-ring"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Atualizar
          </button>

          <button
            type="button"
            onClick={() => setEditando('novo')}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary transition-transform hover:scale-[1.02] focus-ring"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Criar evento
          </button>
        </div>
      </header>

      {mensagem && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm font-medium text-error"
        >
          {mensagem}
        </p>
      )}

      {!carregando && !mensagem && eventos.length === 0 && (
        <p className="mt-8 rounded-2xl border border-outline-variant/50 px-6 py-10 text-center text-sm text-on-surface-variant">
          Nenhum evento cadastrado. Clique em “Criar evento” para começar.
        </p>
      )}

      {eventos.length > 0 && (
        <ul className="mt-6 space-y-3">
          {ordenarEventos(eventos).map((evento) => (
            <li
              key={evento.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/50 px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-on-surface">{evento.nome}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      evento.ativo
                        ? 'bg-primary/15 text-primary'
                        : 'border border-outline-variant/60 text-on-surface-variant'
                    }`}
                  >
                    {evento.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {evento.data ? formatarData(evento.data) : 'Sem data'}
                  {evento.hora && ` · ${evento.hora}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(evento)}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-ring"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErroAcao('');
                    setConfirmando(evento);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-error hover:text-error focus-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmando && (
        <ConfirmarExclusao
          evento={confirmando}
          excluindo={excluindo}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() => void excluir(confirmando)}
        />
      )}
    </Moldura>
  );
}

/* ==========================================================================
   Peças compartilhadas
   ========================================================================== */

function Moldura({ children, email }: { children: React.ReactNode; email: string }) {
  const [saindo, setSaindo] = useState(false);

  async function encerrar() {
    if (saindo) return;
    setSaindo(true);
    // useAutenticacao devolve a tela de login sozinho quando a sessão cai.
    await sair();
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-outline-variant/40 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Santer Hub · Painel
            </p>
            {email && (
              <p className="mt-0.5 text-xs text-on-surface-variant">{email}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => irPara('')}
              className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-ring"
            >
              Ver o site
            </button>
            <button
              type="button"
              onClick={() => void encerrar()}
              disabled={saindo}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-60 focus-ring"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {saindo ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}

function ConfirmarExclusao({
  evento,
  excluindo,
  onCancelar,
  onConfirmar,
}: {
  evento: Evento;
  excluindo: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !excluindo) onCancelar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onCancelar, excluindo]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !excluindo) onCancelar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        className="glass-card w-full max-w-md rounded-2xl p-6 sm:p-8"
      >
        <h2
          id="confirmar-titulo"
          className="font-display text-xl font-extrabold tracking-tight text-on-surface"
        >
          Tem certeza que deseja excluir este evento?
        </h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          <strong className="text-on-surface">{evento.nome}</strong> será removido
          definitivamente. Esta ação não pode ser desfeita.
        </p>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={excluindo}
            className="rounded-full border border-outline-variant px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-60 focus-ring"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={excluindo}
            className="rounded-full bg-error px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 focus-ring"
          >
            {excluindo ? 'Excluindo...' : 'Excluir evento'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
