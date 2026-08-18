import { GraduationCap, TrendingUp, Users } from 'lucide-react';
import { site } from '../content/site';

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
      className="scroll-mt-24 border-t border-outline-variant/30 px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">O Hub</p>
          <h2
            id="sobre-titulo"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface"
          >
            {site.tagline}
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-on-surface-variant">
            {site.textoInstitucional}
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILARES.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="glass-card rounded-2xl p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-on-surface">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
