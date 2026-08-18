import { useEffect, useState } from 'react';
import { Calendar, Menu, Moon, Sun, X } from 'lucide-react';
import { site } from '../content/site';
import { useTheme } from '../context/ThemeContext';

const LINKS = [
  { href: '#sobre', label: 'O Hub' },
  { href: '#espacos', label: 'Espaços' },
];

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  const [comScroll, setComScroll] = useState(false);

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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-md transition-shadow duration-300 ${
        comScroll ? 'border-b border-outline-variant/40 shadow-sm' : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="max-w-6xl mx-auto px-5 sm:px-8 h-16 md:h-18 flex items-center justify-between gap-4"
      >
        <a
          href="#topo"
          className="shrink-0 rounded-lg focus-ring"
          aria-label={`${site.nome} — ir para o início`}
        >
          <img
            src={site.logoUrl}
            alt={site.nome}
            width={140}
            height={36}
            className="logo-marca h-7 sm:h-8 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </a>

        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors rounded-md focus-ring"
            >
              {link.label}
            </a>
          ))}

          {site.siteInstitucional && (
            <a
              href={site.siteInstitucional}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors rounded-md focus-ring"
            >
              Santer
            </a>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            className="p-2 rounded-full border border-outline-variant/50 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors cursor-pointer focus-ring"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <a
            href="#agenda"
            className="inline-flex items-center gap-2 bg-primary text-on-primary text-sm font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity focus-ring"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Agenda
          </a>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            className="p-3 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-ring"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            className="p-3 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-ring"
          >
            {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {menuAberto && (
        <div
          id="menu-mobile"
          className="md:hidden border-t border-outline-variant/40 bg-surface px-5 py-4 flex flex-col animate-fade-in"
        >
          <a
            href="#agenda"
            onClick={() => setMenuAberto(false)}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary text-sm font-bold py-3.5 rounded-full mb-2 focus-ring"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Agenda
          </a>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuAberto(false)}
              className="py-3.5 text-base font-semibold text-on-surface-variant hover:text-primary transition-colors rounded-md focus-ring"
            >
              {link.label}
            </a>
          ))}
          {site.siteInstitucional && (
            <a
              href={site.siteInstitucional}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuAberto(false)}
              className="py-3.5 text-base font-semibold text-on-surface-variant hover:text-primary transition-colors rounded-md focus-ring"
            >
              Santer
            </a>
          )}
        </div>
      )}
    </header>
  );
}
