import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Agenda from './components/Agenda';
import Spaces from './components/Spaces';
import Footer from './components/Footer';
import { useRota } from './lib/router';

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
 */
export default function App() {
  const rota = useRota();

  if (rota.startsWith('/admin')) {
    return (
      <ThemeProvider>
        <Suspense fallback={<CarregandoPainel />}>
          <AdminApp />
        </Suspense>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col bg-surface text-on-surface">
        <a
          href="#agenda"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-on-primary"
        >
          Ir para a agenda
        </a>

        <Header />

        <main className="flex-1">
          <Hero />
          <About />
          <Agenda />
          <Spaces />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

/** Mesma aparência do estado "Verificando acesso..." do painel. */
function CarregandoPainel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-on-surface-variant">Carregando painel...</p>
    </div>
  );
}
