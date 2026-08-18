/**
 * Rodapé — apenas o acesso discreto ao painel administrativo.
 *
 * O link muda o hash para `#/admin`, que é a rota tratada em `App.tsx`. Ele não
 * dá acesso a nada por si só: quem entra precisa passar pelo Firebase
 * Authentication, e as Security Rules do Firestore é que autorizam as operações.
 */

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/30 px-5 sm:px-8 py-10">
      <div className="mx-auto flex max-w-6xl justify-center">
        <a
          href="#/admin"
          className="rounded-full px-4 py-2 text-xs font-medium tracking-wide text-on-surface-variant/60 transition-colors hover:text-primary focus-ring"
        >
          Painel ADM
        </a>
      </div>
    </footer>
  );
}
