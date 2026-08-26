/**
 * Formulário de criação e edição de evento.
 *
 * O mesmo formulário serve para os dois casos: com `evento` preenchido, edita;
 * com `evento` nulo, cria. O `id` é o ID do documento no Firestore, gerado
 * automaticamente — o administrador nunca o informa.
 */

import { useState } from 'react';
import type { Evento } from '../content/events';
import { createEvent, updateEvent } from '../lib/eventsService';
import { EVENTO_NOVO, linkValido, type DadosEvento } from '../lib/eventos';

interface Props {
  /** `null` para criar um evento novo. */
  evento: Evento | null;
  onCancelar: () => void;
  onSalvo: (evento: Evento) => void | Promise<void>;
}

export default function EventoForm({ evento, onCancelar, onSalvo }: Props) {
  const [dados, setDados] = useState<DadosEvento>(() =>
    evento
      ? {
          nome: evento.nome,
          descricao: evento.descricao ?? '',
          data: evento.data,
          hora: evento.hora,
          imagem: evento.imagem ?? '',
          linkGoogleForms: evento.linkGoogleForms,
          ativo: evento.ativo,
        }
      : { ...EVENTO_NOVO },
  );
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function alterar<K extends keyof DadosEvento>(campo: K, valor: DadosEvento[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setErro('');
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;

    if (!dados.nome.trim()) return setErro('Informe o nome do evento.');
    if (!dados.data) return setErro('Informe a data do evento.');
    if (!dados.hora) return setErro('Informe o horário do evento.');
    if (!linkValido(dados.imagem)) {
      return setErro('Informe o link da imagem de capa, começando com https://');
    }
    if (!linkValido(dados.linkGoogleForms) || !dados.linkGoogleForms.trim().startsWith('https://')) {
      return setErro('Informe um link válido, começando com https://');
    }

    setSalvando(true);

    try {
      const salvo = evento
        ? await updateEvent(evento.id, dados)
        : await createEvent(dados);
      await onSalvo(salvo);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o evento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        {evento ? 'Editar evento' : 'Criar evento'}
      </h1>

      <div className="mt-6 space-y-5">
        <Campo label="Nome do evento" obrigatorio>
          <input
            type="text"
            value={dados.nome}
            onChange={(e) => alterar('nome', e.target.value)}
            className={estiloCampo}
          />
        </Campo>

        <Campo label="Breve descrição" ajuda="Opcional. Aparece no card do evento.">
          <textarea
            rows={3}
            value={dados.descricao ?? ''}
            onChange={(e) => alterar('descricao', e.target.value)}
            className={estiloCampo}
          />
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Data" obrigatorio>
            <input
              type="date"
              value={dados.data}
              onChange={(e) => alterar('data', e.target.value)}
              className={estiloCampo}
            />
          </Campo>

          <Campo label="Hora" obrigatorio>
            <input
              type="time"
              value={dados.hora}
              onChange={(e) => alterar('hora', e.target.value)}
              className={estiloCampo}
            />
          </Campo>
        </div>

        <Campo
          label="Imagem de capa"
          obrigatorio
          ajuda="Cole o link público da imagem. Precisa começar com https:// e ficar melhor na proporção 16:9 (ex.: 1280x720) — a imagem preenche o card inteiro e o que sobrar é recortado."
        >
          <input
            type="url"
            inputMode="url"
            placeholder="https://exemplo.com/imagem-do-evento.jpg"
            value={dados.imagem}
            onChange={(e) => alterar('imagem', e.target.value)}
            className={estiloCampo}
          />
        </Campo>

        {/* Prévia no mesmo recorte do card público: 16:9, cobrindo a área. */}
        {linkValido(dados.imagem) && (
          <div className="overflow-hidden rounded-xl border border-outline-variant">
            <img
              src={dados.imagem}
              alt="Prévia da capa do evento"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <Campo
          label="Link do Google Forms"
          obrigatorio
          ajuda="Cole aqui o link do formulário de inscrição. Precisa começar com https://"
        >
          <input
            type="url"
            inputMode="url"
            placeholder="https://docs.google.com/forms/..."
            value={dados.linkGoogleForms}
            onChange={(e) => alterar('linkGoogleForms', e.target.value)}
            className={estiloCampo}
          />
        </Campo>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-on-surface">Situação</legend>
          <div className="flex flex-wrap gap-3">
            <Opcao
              marcada={dados.ativo}
              onSelecionar={() => alterar('ativo', true)}
              titulo="Ativo"
              detalhe="Aparece no site"
            />
            <Opcao
              marcada={!dados.ativo}
              onSelecionar={() => alterar('ativo', false)}
              titulo="Inativo"
              detalhe="Só no painel"
            />
          </div>
        </fieldset>
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm font-medium text-error"
        >
          {erro}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-on-primary transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 focus-ring"
        >
          {salvando ? 'Salvando...' : 'Salvar evento'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-full border border-outline-variant px-6 py-3 text-sm font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-ring"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ==========================================================================
   Peças internas
   ========================================================================== */

const estiloCampo =
  'w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus-ring';

function Campo({
  label,
  ajuda,
  obrigatorio,
  children,
}: {
  label: string;
  ajuda?: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-on-surface">
        {label}
        {obrigatorio && <span className="text-error"> *</span>}
      </span>
      {children}
      {ajuda && <span className="mt-1.5 block text-xs text-on-surface-variant">{ajuda}</span>}
    </label>
  );
}

function Opcao({
  marcada,
  onSelecionar,
  titulo,
  detalhe,
}: {
  marcada: boolean;
  onSelecionar: () => void;
  titulo: string;
  detalhe: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelecionar}
      aria-pressed={marcada}
      className={`rounded-xl border px-5 py-3 text-left transition-colors focus-ring ${
        marcada
          ? 'border-primary bg-primary/10'
          : 'border-outline-variant hover:border-primary/50'
      }`}
    >
      <span
        className={`block text-sm font-bold ${marcada ? 'text-primary' : 'text-on-surface'}`}
      >
        {titulo}
      </span>
      <span className="block text-xs text-on-surface-variant">{detalhe}</span>
    </button>
  );
}
