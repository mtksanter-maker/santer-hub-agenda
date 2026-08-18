import { useMemo } from 'react';
import { ordenarEventos, useEventos } from '../lib/eventos';
import EventCard from './EventCard';

export default function Agenda() {
  // Só os ativos: os inativos ficam apenas no painel administrativo.
  const { eventos: ativos, carregando, erro } = useEventos(true);
  const eventos = useMemo(() => ordenarEventos(ativos), [ativos]);

  return (
    <section
      id="agenda"
      aria-labelledby="agenda-titulo"
      className="scroll-mt-24 border-t border-outline-variant/30 px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Próximos eventos</p>
          <h2
            id="agenda-titulo"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface"
          >
            Agenda Santer Hub
          </h2>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Encontros, treinamentos e imersões do Hub. Escolha o evento e faça sua inscrição
            pelo formulário oficial.
          </p>
        </header>

        {/* O erro não apaga a lista: se já havia eventos na tela, eles continuam. */}
        {erro && (
          <p
            role="alert"
            className="mt-12 rounded-2xl border border-error/40 bg-error/10 px-6 py-5 text-center text-sm font-medium text-error"
          >
            {erro}
          </p>
        )}

        {carregando && eventos.length === 0 ? (
          <p className="mt-12 text-center text-sm text-on-surface-variant">
            Carregando eventos...
          </p>
        ) : eventos.length === 0 && !erro ? (
          <p className="mt-12 rounded-2xl border border-outline-variant/50 px-6 py-10 text-center text-sm text-on-surface-variant">
            Nenhum evento publicado no momento. Em breve divulgaremos a próxima agenda.
          </p>
        ) : (
          eventos.length > 0 && (
            <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {eventos.map((evento) => (
                <li key={evento.id} className="h-full">
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
