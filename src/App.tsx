import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Agenda from './components/Agenda';
import Spaces from './components/Spaces';
import Footer from './components/Footer';
import Revelar from './components/Revelar';
import { useRota } from './lib/router';
import { useAncora } from './lib/ancora';

/**
 * O painel é carregado sob demanda: assim o SDK do Firebase Authentication
 * fica fora do pacote da página pública, que não precisa dele.
 */
const AdminApp = lazy(() => import('./admin/AdminApp'));

/**
 * Santer Hub — página única de agenda.
 *
 * Vitrine dos eventos do Hub: cada card leva ao Google Forms externo daquele
 * evento. O site não coleta nem armazena nenhum dado de participante.
 *
 * Há uma única rota interna, `#/admin`, que abre o painel administrativo.
 * Âncoras comuns (`#agenda`, `#espacos`) continuam funcionando como rolagem.
 *
 * O site tem um tema só, o escuro — definido inteiro em `index.css`. Não há
 * provider de tema nem alternância: nada aqui muda de cor em tempo de execução.
 */
export default function App() {
  const rota = useRota();

  // Abrir o site já com #agenda, #espacos, #sobre... leva direto à seção.
  useAncora();

  if (rota.startsWith('/admin')) {
    return (
      <Suspense fallback={<CarregandoPainel />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <a
        href="#agenda"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-on-primary focus:shadow-[var(--sombra-2)]"
      >
        Ir para a agenda
      </a>

      <Header />

      <main className="flex-1">
        <Hero />

        {/* Abaixo do Hero cada seção entra conforme a pessoa rola a página. */}
        <Revelar>
          <About />
        </Revelar>
        <Revelar>
          <Agenda />
        </Revelar>
        <Revelar>
          <Spaces />
        </Revelar>
      </main>

      <Footer />
    </div>
  );
}

/** Mesma aparência do estado "Verificando acesso..." do painel. */
function CarregandoPainel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="respirando text-sm text-on-surface-variant">Carregando painel...</p>
    </div>
  );
}
