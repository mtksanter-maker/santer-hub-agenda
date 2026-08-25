import { useMemo } from 'react';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { ordenarEventos, useEventos } from '../lib/eventos';
import { atrasoEmCascata } from '../lib/useRevelar';
import EventCard from './EventCard';

export default function Agenda() {
  // Só os ativos: os inativos ficam apenas no painel administrativo.
  const { eventos: ativos, carregando, erro } = useEventos(true);
  const eventos = useMemo(() => ordenarEventos(ativos), [ativos]);

  return (
    <section
      id="agenda"
      aria-labelledby="agenda-titulo"
      className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl">
        <hr className="divisor-secao mb-20 sm:mb-24" />

        <header className="revelar-item max-w-2xl">
          <p className="tipo-rotulo text-primary">Próximos eventos</p>
          <h2 id="agenda-titulo" className="tipo-titulo mt-4 text-balance text-on-surface">
            Agenda Santer Hub
          </h2>
          <p className="tipo-corpo mt-5 text-pretty text-on-surface-variant">
            Encontros, treinamentos e imersões do Hub. Escolha o evento e faça sua inscrição
            pelo formulário oficial.
          </p>
        </header>

        {/* O erro não apaga a lista: se já havia eventos na tela, eles continuam. */}
        {erro && (
          <p
            role="alert"
            className="revelar-item mt-12 flex items-center justify-center gap-3 rounded-3xl border border-error/40 bg-error/10 px-6 py-5 text-center text-sm font-medium text-error"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {erro}
          </p>
        )}

        {carregando && eventos.length === 0 ? (
          <EsqueletoAgenda />
        ) : eventos.length === 0 && !erro ? (
          <div className="revelar-item mt-12 flex flex-col items-center rounded-3xl border border-outline-variant px-6 py-16 text-center">
            <CalendarClock className="h-7 w-7 text-primary/70" aria-hidden="true" />
            <p className="tipo-subtitulo-menor mt-4 text-on-surface">
              Nenhum evento publicado no momento
            </p>
            <p className="tipo-corpo-menor vibrante mt-2 max-w-sm">
              A próxima agenda do Hub é divulgada aqui assim que for confirmada.
            </p>
          </div>
        ) : (
          eventos.length > 0 && (
            <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {eventos.map((evento, indice) => (
                <li
                  key={evento.id}
                  style={atrasoEmCascata(indice + 1)}
                  className="revelar-item h-full"
                >
                  <EventCard evento={evento} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </section>
  );
}

/**
 * Estado de carregamento no formato do resultado.
 *
 * Um texto "Carregando..." avisa que algo acontece, mas não diz o quê. O
 * esqueleto já mostra a forma da agenda que está chegando, então a troca pelo
 * conteúdo real não reorganiza a página debaixo de quem está lendo.
 */
function EsqueletoAgenda() {
  return (
    <div className="mt-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando a agenda de eventos...</span>

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((indice) => (
          <li
            key={indice}
            // Cada coluna pulsa fora de fase: o conjunto lê como carregando,
            // não como um bloco piscando junto.
            style={{ animationDelay: `${indice * 160}ms` }}
            className="glass-card respirando rounded-3xl p-6 sm:p-7"
            aria-hidden="true"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-on-surface-variant/15" />
              <div className="flex-1 space-y-2.5 pt-1.5">
                <div className="h-4 w-4/5 rounded-full bg-on-surface-variant/15" />
                <div className="h-4 w-2/5 rounded-full bg-on-surface-variant/10" />
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              <div className="h-3 w-full rounded-full bg-on-surface-variant/10" />
              <div className="h-3 w-11/12 rounded-full bg-on-surface-variant/10" />
            </div>
            <div className="mt-8 h-12 w-full rounded-full bg-on-surface-variant/10" />
          </li>
        ))}
      </ul>
    </div>
  );
}
