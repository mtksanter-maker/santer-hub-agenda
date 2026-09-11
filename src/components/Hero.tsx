import { ArrowDown, ChevronDown } from 'lucide-react';
import { site } from '../content/site';
import { useRevelar } from '../lib/useRevelar';
import { useProgressoHero } from '../lib/movimento';

/**
 * Hero de abertura.
 *
 * Ocupa a tela inteira e apresenta a marca, a chamada e o acesso à agenda logo
 * na primeira dobra. A marca acompanha a rolagem 1:1: recua e se dissolve
 * conforme a página desce, em vez de esperar um gatilho para animar.
 */
export default function Hero() {
  const abertura = useRevelar<HTMLDivElement>();

  // Liga a marca à rolagem, quadro a quadro.
  useProgressoHero();

  return (
    <section
      id="topo"
      className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 sm:px-8"
    >
      <div className="hero-bg absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-fade absolute inset-x-0 bottom-0 -z-10 h-52" aria-hidden="true" />

      <div
        ref={abertura.ref}
        className={`mx-auto flex max-w-5xl flex-col items-center text-center revelar${
          abertura.visivel ? ' revelar-visivel' : ''
        }`}
      >
        <h1 className="flex animate-fade-in justify-center">
          <img
            src={site.logoUrl}
            alt={site.nome}
            width={560}
            height={150}
            fetchPriority="high"
            className="logo-marca hero-logo h-auto w-[80vw] max-w-[320px] object-contain sm:max-w-[440px] md:max-w-[540px]"
            referrerPolicy="no-referrer"
          />
        </h1>

        <p className="tipo-chamada mt-9 max-w-5xl text-balance text-on-surface sm:mt-11">
          {site.chamadaHero.map((linha, indice) => (
            <span key={linha} className="lg:block">
              {linha}
              {indice < site.chamadaHero.length - 1 ? ' ' : null}
            </span>
          ))}
        </p>

        <a
          href="#agenda"
          className="botao-primario pressionavel tipo-rotulo-botao mt-9 inline-flex items-center justify-center gap-2.5 rounded-full px-9 py-4.5 focus-ring sm:mt-11"
        >
          Ver a agenda
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

        {/*
         * Uma tela inteira só com a marca não diz que existe mais coisa abaixo.
         * A dica resolve isso e some sozinha assim que a rolagem começa — já
         * cumpriu o que tinha para fazer.
         */}
      <a
        href="#sobre"
        aria-label="Rolar para conhecer o Hub"
        className="hero-dica pressionavel absolute inset-x-0 bottom-4 mx-auto flex w-fit flex-col items-center gap-1 rounded-full px-4 py-2 text-on-surface-variant hover:text-primary focus-ring sm:bottom-7 sm:gap-2"
      >
        <span className="tipo-rotulo">Role para conhecer</span>
        <ChevronDown className="hero-dica-seta h-4 w-4" aria-hidden="true" />
      </a>
    </section>
  );
}
