import { ArrowDown, ChevronDown } from 'lucide-react';
import { site } from '../content/site';
import { useRevelar } from '../lib/useRevelar';
import { useProgressoHero } from '../lib/movimento';

/**
 * Hero em duas dobras.
 *
 * A primeira ocupa a tela inteira e traz só a logo do Hub — sobre o gradiente
 * da marca no tema escuro, sobre fundo chapado no claro. A marca acompanha a
 * rolagem 1:1: recua e se dissolve conforme a página desce, em vez de esperar
 * um gatilho para animar. A abertura (chamada e botão da agenda) fica na
 * segunda dobra; daí para baixo o site flui normalmente.
 */
export default function Hero() {
  const abertura = useRevelar<HTMLDivElement>();

  // Liga a marca à rolagem, quadro a quadro.
  useProgressoHero();

  return (
    <>
      <section
        id="topo"
        className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 sm:px-8"
      >
        <div className="hero-bg absolute inset-0 -z-10" aria-hidden="true" />
        <div className="hero-fade absolute inset-x-0 bottom-0 -z-10 h-52" aria-hidden="true" />

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

        {/*
         * Uma tela inteira só com a marca não diz que existe mais coisa abaixo.
         * A dica resolve isso e some sozinha assim que a rolagem começa — já
         * cumpriu o que tinha para fazer.
         */}
        <a
          href="#apresentacao"
          aria-label="Rolar para a apresentação do Hub"
          className="hero-dica pressionavel absolute inset-x-0 bottom-9 mx-auto flex w-fit flex-col items-center gap-2 rounded-full px-4 py-2 text-on-surface-variant hover:text-primary focus-ring"
        >
          <span className="tipo-rotulo">Role para conhecer</span>
          <ChevronDown className="hero-dica-seta h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <section
        id="apresentacao"
        className="scroll-mt-20 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-24"
      >
        <div
          ref={abertura.ref}
          className={`mx-auto max-w-3xl text-center revelar${
            abertura.visivel ? ' revelar-visivel' : ''
          }`}
        >
          {/*
           * A tagline não entra aqui: ela é o título da seção "O Hub", logo
           * abaixo, e apareceria duas vezes na mesma tela.
           */}
          <p className="tipo-chamada mx-auto max-w-2xl text-balance text-on-surface">
            {site.chamadaHero}
          </p>

          <div className="mt-10 flex justify-center">
            <a
              href="#agenda"
              className="botao-primario pressionavel tipo-rotulo-botao inline-flex items-center justify-center gap-2.5 rounded-full px-9 py-4.5 focus-ring"
            >
              Ver a agenda
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
