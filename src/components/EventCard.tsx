import { CalendarDays, Clock, ExternalLink } from 'lucide-react';
import type { Evento } from '../content/events';
import { diaDaSemana, formatarData, linkValido, partesData } from '../lib/eventos';
import { aoMoverPonteiro } from '../lib/movimento';

interface EventCardProps {
  evento: Evento;
}

/**
 * Card do evento. Mostra nome, descrição, data e hora, e leva o participante
 * ao Google Forms externo — o site não coleta nada.
 *
 * A data ganha um bloco próprio no topo: numa agenda, "quando" é a primeira
 * pergunta de quem lê, e o número grande responde antes da frase.
 */
export default function EventCard({ evento }: EventCardProps) {
  const inscricaoDisponivel = linkValido(evento.linkGoogleForms);
  const data = evento.data ? partesData(evento.data) : null;

  return (
    <article
      onPointerMove={aoMoverPonteiro}
      className="glass-card flex h-full flex-col rounded-3xl p-6 sm:p-7"
    >
      <div className="flex items-start gap-4">
        {/*
         * O bloco é a data por extenso para quem lê com leitor de tela e o
         * "15 set" para quem lê com os olhos — a mesma informação, na forma que
         * cada leitura pede, sem repeti-la duas vezes na tela.
         */}
        {evento.data &&
          (data ? (
            <time
              dateTime={evento.data}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 leading-none"
            >
              <span aria-hidden="true" className="font-display text-2xl font-extrabold tracking-tight text-primary">
                {data.dia}
              </span>
              <span
                aria-hidden="true"
                className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-primary/80"
              >
                {data.mes}
              </span>
              <span className="sr-only">{formatarData(evento.data)}</span>
            </time>
          ) : (
            // Data fora do formato esperado: mostramos o que veio, sem inventar.
            <span className="tipo-rotulo shrink-0 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">
              {formatarData(evento.data)}
            </span>
          ))}

        <h3 className="tipo-subtitulo pt-0.5 text-balance text-on-surface">{evento.nome}</h3>
      </div>

      {evento.descricao && (
        <p className="tipo-corpo-menor vibrante mt-5 text-pretty">{evento.descricao}</p>
      )}

      <div className="mt-6 flex flex-1 flex-col justify-end">
        {/*
         * O rodapé completa o bloco em vez de repeti-lo: lá em cima está o dia
         * e o mês, aqui o dia da semana e o ano. Junto com a hora, fecha a
         * resposta de "quando" sem dizer a mesma coisa duas vezes.
         */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-outline-variant pt-5 text-sm font-medium text-on-surface-variant">
          {data && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              {[diaDaSemana(evento.data), data.ano].filter(Boolean).join(', ')}
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
              className="botao-primario pressionavel pressionavel-suave tipo-rotulo-botao flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 focus-ring"
            >
              Quero participar
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            // Sem link válido não mostramos um botão quebrado.
            <p className="tipo-rotulo-botao w-full rounded-full border border-outline-variant px-6 py-4 text-center text-on-surface-variant/70">
              Inscrições em breve
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
