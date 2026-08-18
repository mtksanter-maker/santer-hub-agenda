import { ExternalLink, Users } from 'lucide-react';
import { ESPACOS } from '../content/spaces';
import { linkValido } from '../lib/eventos';

export default function Spaces() {
  return (
    <section
      id="espacos"
      aria-labelledby="espacos-titulo"
      className="scroll-mt-24 border-t border-outline-variant/30 px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Estrutura</p>
          <h2
            id="espacos-titulo"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface"
          >
            Reserve um espaço
          </h2>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Ambientes do Santer Hub disponíveis para reuniões, atendimentos e gravações.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {ESPACOS.map((espaco) => {
            const agendamentoDisponivel = linkValido(espaco.linkAgendamento);

            return (
              <li key={espaco.id} className="glass-card overflow-hidden rounded-2xl">
                <img
                  src={espaco.imagem}
                  alt={`Ambiente da ${espaco.nome} no Santer Hub`}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-full object-cover sm:h-60"
                  referrerPolicy="no-referrer"
                />

                <div className="p-6 sm:p-7">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {espaco.capacidade}
                  </span>

                  <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
                    {espaco.nome}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                    {espaco.descricao}
                  </p>

                  <div className="mt-6">
                    {agendamentoDisponivel ? (
                      <a
                        href={espaco.linkAgendamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Agendar a ${espaco.nome} (abre em nova aba)`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-on-primary focus-ring"
                      >
                        Agendar
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-on-surface-variant">
                        Agendamento sob consulta na recepção do Hub.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
