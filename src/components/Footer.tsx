import { Mail, MapPin } from 'lucide-react';
import { mapaUrl, site } from '../content/site';

/**
 * Rodapé.
 *
 * O fim da página é onde alguém procura "onde fica" e "como falo com vocês" —
 * então endereço e e-mail moram aqui, junto com os atalhos para as seções.
 *
 * O painel administrativo não é divulgado no rodapé. A rota `#/admin`
 * continua disponível somente para quem possui o endereço direto e passa pela
 * autenticação do Firebase.
 */

const ATALHOS = [
  { href: '#sobre', label: 'O Hub' },
  { href: '#agenda', label: 'Agenda' },
  { href: '#espacos', label: 'Espaços' },
];

export default function Footer() {
  return (
    <footer className="px-5 pb-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <hr className="divisor-secao" />

        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div className="max-w-md">
            {/*
             * As duas marcas lado a lado, separadas por um filete: a Santer
             * assina, o Hub é o que está na tela. O filete evita que os dois
             * logos leiam como uma marca só.
             */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <img
                src={site.logoSanterUrl}
                alt="Santer"
                width={140}
                height={36}
                loading="lazy"
                className="logo-marca h-7 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <span aria-hidden="true" className="h-7 w-px shrink-0 bg-outline-variant" />
              <img
                src={site.logoUrl}
                alt={site.nome}
                width={140}
                height={36}
                loading="lazy"
                className="logo-marca h-7 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="tipo-corpo-menor vibrante mt-5 text-pretty">{site.textoRodape}</p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-12 md:justify-end">
            <nav aria-label="Seções do site">
              <p className="tipo-rotulo text-on-surface-variant/70">Navegar</p>
              <ul className="mt-4 space-y-1">
                {ATALHOS.map((atalho) => (
                  <li key={atalho.href}>
                    <a
                      href={atalho.href}
                      className="pressionavel -mx-2 inline-flex rounded-lg px-2 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary focus-ring"
                    >
                      {atalho.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="tipo-rotulo text-on-surface-variant/70">Contato</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver o endereço do Hub no Google Maps: ${site.endereco} (abre em nova aba)`}
                    className="pressionavel -mx-2 flex max-w-64 items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-on-surface-variant hover:text-primary focus-ring"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {site.endereco}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="pressionavel -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-on-surface-variant hover:text-primary focus-ring"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center border-t border-outline-variant pt-7">
          <p className="text-xs text-on-surface-variant/60">
            © {new Date().getFullYear()} {site.nome}
          </p>
        </div>
      </div>
    </footer>
  );
}
