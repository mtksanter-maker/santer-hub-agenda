import { CalendarDays, Clock, ExternalLink } from 'lucide-react';
import type { Evento } from '../content/events';
import { formatarData, linkValido } from '../lib/eventos';

interface EventCardProps {
  evento: Evento;
}

/**
 * Card do evento. Mostra nome, descrição, data e hora, e leva o participante
 * ao Google Forms externo — o site não coleta nada.
 */
export default function EventCard({ evento }: EventCardProps) {
  const inscricaoDisponivel = linkValido(evento.linkGoogleForms);

  return (
    <article className="glass-card flex h-full flex-col rounded-2xl p-6 sm:p-7">
      <h3 className="font-display text-xl sm:text-2xl font-extrabold leading-snug tracking-tight text-on-surface">
        {evento.nome}
      </h3>

      {evento.descricao && (
        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
          {evento.descricao}
        </p>
      )}

      <div className="mt-6 flex flex-1 flex-col justify-end">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-outline-variant/40 pt-5 text-sm font-medium text-on-surface-variant">
          {evento.data && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              {formatarData(evento.data)}
            </span>
          )}
          {evento.hora && (
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              {evento.hora}
            </span>
          )}
        </div>

        <div className="mt-5">
          {inscricaoDisponivel ? (
            <a
              href={evento.linkGoogleForms}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Quero participar do evento ${evento.nome} (abre o formulário de inscrição em nova aba)`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-on-primary transition-transform hover:scale-[1.02] active:scale-[0.99] focus-ring"
            >
              Quero participar
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            // Sem link válido não mostramos um botão quebrado.
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full border border-outline-variant/50 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-on-surface-variant/70"
            >
              Em breve
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
