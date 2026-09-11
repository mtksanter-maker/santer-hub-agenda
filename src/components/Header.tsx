import { useEffect, useState } from 'react';
import { Calendar, Menu, X } from 'lucide-react';
import { site } from '../content/site';
import { useSecaoAtual } from '../lib/movimento';

/**
 * Nomes diretos, com o conteúdo de cada seção — não guarda-chuvas vagos.
 * Especificidade é o que torna a navegação previsível.
 */
const LINKS = [
  { href: '#sobre', id: 'sobre', label: 'O Hub' },
  { href: '#agenda', id: 'agenda', label: 'Agenda' },
  { href: '#espacos', id: 'espacos', label: 'Espaços' },
] as const;

const IDS_SECOES = LINKS.map((link) => link.id);

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [comScroll, setComScroll] = useState(false);
  const secaoAtual = useSecaoAtual(IDS_SECOES);

  useEffect(() => {
    const onScroll = () => setComScroll(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha o menu ao voltar para o layout de desktop.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setMenuAberto(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Esc fecha o menu: nunca deixar a pessoa presa em um estado.
  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  const comMaterial = comScroll || menuAberto;

  return (
    <header
      // Sobre a primeira dobra do Hero o cabeçalho é invisível, para que a logo
      // apareça sozinha. O material aparece assim que a página rola — e o
      // conteúdo passa por baixo dele, sem uma faixa opaca comendo a tela.
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
        comMaterial ? 'material-cromo' : 'bg-transparent'
      }`}
      style={{ transitionTimingFunction: 'var(--mola)' }}
    >
      {/*
       * Onde o cromo encontra o conteúdo, um degradê curto de desfoque faz a
       * emenda — no lugar de um filete de 1px cortando a página.
       */}
      <div className="borda-rolagem" data-visivel={comMaterial} aria-hidden="true" />

      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 md:h-18"
      >
        <a
          href="#topo"
          className="pressionavel shrink-0 rounded-lg focus-ring"
          aria-label={`${site.nome} — ir para o início`}
        >
          {/* No menu quem assina é a Santer; o logo do Hub já domina o topo. */}
          <img
            src={site.logoSanterUrl}
            alt="Santer"
            width={219}
            height={56}
            className="logo-marca h-[45px] w-auto object-contain sm:h-[50px]"
            referrerPolicy="no-referrer"
          />
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-atual={secaoAtual === link.id}
              aria-current={secaoAtual === link.id ? 'true' : undefined}
              className={`link-nav pressionavel rounded-md text-sm font-semibold focus-ring ${
                secaoAtual === link.id
                  ? 'text-on-surface'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {link.label}
            </a>
          ))}

          {site.siteInstitucional && (
            <a
              href={site.siteInstitucional}
              target="_blank"
              rel="noopener noreferrer"
              className="pressionavel rounded-md text-sm font-semibold text-on-surface-variant hover:text-primary focus-ring"
            >
              Santer
            </a>
          )}

          <a
            href="#agenda"
            className="botao-primario pressionavel tipo-rotulo-botao inline-flex items-center gap-2 rounded-full px-5 py-3 focus-ring"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Inscrições
          </a>
        </div>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            className="pressionavel cursor-pointer rounded-full p-3 text-on-surface-variant hover:text-primary focus-ring"
          >
            {menuAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/*
       * O painel nasce do canto onde está o botão que o abriu e volta pelo mesmo
       * caminho. Fica sempre montado: assim abrir e fechar podem se cruzar no
       * meio do movimento, sem esperar um terminar para o outro começar.
       *
       * Encosta na base da barra sem sobrepô-la: vidro leve sobre vidro leve
       * derruba a legibilidade dos dois.
       */}
      <div
        id="menu-mobile"
        data-aberto={menuAberto}
        inert={!menuAberto}
        className="folha-menu folha-menu-material absolute inset-x-3 top-full origin-top-right rounded-3xl border border-outline-variant bg-surface-container/90 p-3 shadow-[var(--sombra-2)] backdrop-blur-xl md:hidden"
      >
        <a
          href="#agenda"
          onClick={() => setMenuAberto(false)}
          className="botao-primario pressionavel-suave pressionavel tipo-rotulo-botao mb-2 flex items-center justify-center gap-2 rounded-2xl py-4 focus-ring"
        >
          <Calendar className="h-4 w-4" aria-hidden="true" />
          Inscrições
        </a>

        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setMenuAberto(false)}
            aria-current={secaoAtual === link.id ? 'true' : undefined}
            className={`pressionavel-suave pressionavel flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold focus-ring ${
              secaoAtual === link.id
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {link.label}
            {secaoAtual === link.id && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            )}
          </a>
        ))}

        {site.siteInstitucional && (
          <a
            href={site.siteInstitucional}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuAberto(false)}
            className="pressionavel-suave pressionavel flex rounded-2xl px-4 py-3.5 text-base font-semibold text-on-surface-variant hover:text-primary focus-ring"
          >
            Santer
          </a>
        )}
      </div>
    </header>
  );
}
