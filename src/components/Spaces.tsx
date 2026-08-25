import { ArrowUpRight, CalendarCheck, MessageCircle, Users } from 'lucide-react';
import { ESPACOS, RESERVA } from '../content/spaces';
import { linkValido } from '../lib/eventos';
import { aoMoverPonteiro } from '../lib/movimento';
import { atrasoEmCascata } from '../lib/useRevelar';

export default function Spaces() {
  return (
    <section
      id="espacos"
      aria-labelledby="espacos-titulo"
      className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl">
        <hr className="divisor-secao mb-20 sm:mb-24" />

        <header className="revelar-item max-w-2xl">
          <p className="tipo-rotulo text-primary">Estrutura</p>
          <h2 id="espacos-titulo" className="tipo-titulo mt-4 text-balance text-on-surface">
            Reserve um espaço
          </h2>
          <p className="tipo-corpo mt-5 text-pretty text-on-surface-variant">
            Ambientes do Santer Hub disponíveis para reuniões, atendimentos e gravações.
          </p>
        </header>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {ESPACOS.map((espaco, indice) => {
            const agendamentoDisponivel = linkValido(espaco.linkAgendamento);
            const rotuloReserva = RESERVA[espaco.canal];
            const IconeReserva = espaco.canal === 'whatsapp' ? MessageCircle : CalendarCheck;

            const foto = (
              <img
                src={espaco.imagem}
                alt={`Ambiente da ${espaco.nome} no Santer Hub`}
                loading="lazy"
                decoding="async"
                className="h-56 w-full object-cover transition-transform duration-500 ease-out sm:h-64 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] group-active:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                style={{ transitionTimingFunction: 'var(--mola)' }}
              />
            );

            return (
              <li
                key={espaco.id}
                onPointerMove={aoMoverPonteiro}
                style={atrasoEmCascata(indice + 1)}
                className="glass-card revelar-item overflow-hidden rounded-3xl"
              >
                {/*
                 * A própria foto é o atalho de reserva: no hover ela cresce um
                 * pouco e o convite "Reservar agora" sobe no rodapé da imagem —
                 * o movimento aponta para onde a interação leva.
                 */}
                {agendamentoDisponivel ? (
                  <a
                    href={espaco.linkAgendamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${rotuloReserva}: ${espaco.nome} (abre em nova aba)`}
                    className="group relative block overflow-hidden focus-ring"
                  >
                    {foto}

                    <span
                      aria-hidden="true"
                      className="tipo-rotulo-botao pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 items-center justify-center gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-6 pt-12 pb-6 text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none"
                      style={{ transitionTimingFunction: 'var(--mola)' }}
                    >
                      Reservar agora
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </a>
                ) : (
                  foto
                )}

                <div className="p-6 sm:p-7">
                  <span className="tipo-rotulo inline-flex items-center gap-2 text-primary">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {espaco.capacidade}
                  </span>

                  <h3 className="tipo-subtitulo mt-4 text-on-surface">{espaco.nome}</h3>

                  <p className="tipo-corpo-menor vibrante mt-3 text-pretty">{espaco.descricao}</p>

                  <div className="mt-7">
                    {agendamentoDisponivel ? (
                      <a
                        href={espaco.linkAgendamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${rotuloReserva}: ${espaco.nome} (abre em nova aba)`}
                        className="botao-secundario pressionavel pressionavel-suave tipo-rotulo-botao inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 focus-ring"
                      >
                        {rotuloReserva}
                        <IconeReserva className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <p className="tipo-corpo-menor vibrante">
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
