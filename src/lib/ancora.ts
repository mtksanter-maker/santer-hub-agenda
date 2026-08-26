/**
 * Faz o endereço com âncora funcionar já na abertura da página.
 *
 * Abrir `.../santer-hub-agenda/#agenda` direto no navegador não rolava até a
 * seção: quando o navegador procura o elemento, o React ainda não montou nada —
 * e a agenda só ganha altura depois que os eventos chegam do Firestore. Por
 * isso a rolagem é tentada de novo por um curto período, até a posição do alvo
 * parar de mudar.
 *
 * Vale para qualquer seção com `id` (#topo, #apresentacao, #sobre, #agenda,
 * #espacos). Hashes de rota, que começam com barra (#/admin), são ignorados.
 */

import { useEffect } from 'react';

/** Quanto tempo insistimos até o conteúdo assíncrono terminar de entrar. */
const TEMPO_LIMITE = 3000;

export function useAncora(): void {
  useEffect(() => {
    let cancelar: (() => void) | undefined;

    function irParaAncora() {
      cancelar?.();

      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (!id || id.startsWith('/')) return;

      const inicio = performance.now();
      let ultimaPosicao = Number.NaN;
      let quadro = 0;

      const tentar = () => {
        const alvo = document.getElementById(id);

        if (alvo) {
          const posicao = Math.round(alvo.getBoundingClientRect().top + window.scrollY);

          // Só rolamos de novo quando o alvo mudou de lugar (conteúdo entrou).
          if (posicao !== ultimaPosicao) {
            ultimaPosicao = posicao;
            alvo.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }

        if (performance.now() - inicio < TEMPO_LIMITE) {
          quadro = requestAnimationFrame(tentar);
        }
      };

      quadro = requestAnimationFrame(tentar);

      // Se a pessoa rolar ou tocar na tela, paramos de insistir na hora.
      const parar = () => {
        cancelAnimationFrame(quadro);
        window.removeEventListener('wheel', parar);
        window.removeEventListener('touchstart', parar);
        window.removeEventListener('keydown', parar);
      };

      window.addEventListener('wheel', parar, { passive: true });
      window.addEventListener('touchstart', parar, { passive: true });
      window.addEventListener('keydown', parar);

      cancelar = parar;
    }

    irParaAncora();
    window.addEventListener('hashchange', irParaAncora);

    return () => {
      cancelar?.();
      window.removeEventListener('hashchange', irParaAncora);
    };
  }, []);
}
