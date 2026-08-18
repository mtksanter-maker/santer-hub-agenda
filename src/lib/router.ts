/**
 * Roteamento mínimo por hash, sem dependências novas.
 *
 * O site é de página única e usa âncoras (`#agenda`, `#espacos`) para rolagem.
 * Só é tratado como rota o que começa com barra — hoje apenas `#/admin`.
 * Qualquer outro hash continua sendo uma âncora comum da página.
 */

import { useEffect, useState } from 'react';

function rotaAtual(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '';
}

export function useRota(): string {
  const [rota, setRota] = useState(rotaAtual);

  useEffect(() => {
    const aoMudar = () => setRota(rotaAtual());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  return rota;
}

/** Navega para uma rota interna (ex.: '/admin') ou para a home (''). */
export function irPara(rota: string): void {
  window.location.hash = rota ? `#${rota}` : '';
}
