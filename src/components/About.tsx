import { GraduationCap, TrendingUp, Users } from 'lucide-react';
import { site } from '../content/site';
import { aoMoverPonteiro } from '../lib/movimento';
import { atrasoEmCascata } from '../lib/useRevelar';

const PILARES = [
  {
    icone: GraduationCap,
    titulo: 'Capacitação',
    texto: 'Treinamentos, imersões e conteúdo prático para ampliar repertório e conhecimento.',
  },
  {
    icone: Users,
    titulo: 'Conexão',
    texto: 'Um ambiente de proximidade, relacionamento e comunidade entre os parceiros.',
  },
  {
    icone: TrendingUp,
    titulo: 'Resultado',
    texto: 'Performance no dia a dia comercial e novas oportunidades de negócio.',
  },
];

export default function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl">
        <hr className="divisor-secao mb-20 sm:mb-24" />

        <div className="revelar-item max-w-2xl">
          <p className="tipo-rotulo text-primary">O Hub</p>
          <h2 id="sobre-titulo" className="tipo-titulo mt-4 text-balance text-on-surface">
            {site.tagline}
          </h2>
          <p className="tipo-corpo mt-5 text-pretty text-on-surface-variant">
            {site.textoInstitucional}
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILARES.map(({ icone: Icone, titulo, texto }, indice) => (
            <li
              key={titulo}
              onPointerMove={aoMoverPonteiro}
              style={atrasoEmCascata(indice + 1)}
              className="glass-card revelar-item rounded-3xl p-7"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="tipo-subtitulo-menor mt-6 text-on-surface">{titulo}</h3>
              <p className="tipo-corpo-menor vibrante mt-2.5">{texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
