import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * Marca um elemento como "visível" na primeira vez que ele entra na tela.
 *
 * É o que faz o conteúdo abaixo do Hero aparecer conforme a pessoa rola a
 * página. A revelação é definitiva: uma vez visto, o bloco não some mais ao
 * rolar de volta. Sem `IntersectionObserver` (ou com JS a meio caminho), o
 * conteúdo simplesmente já nasce visível — nunca fica invisível por falha.
 */
export function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;

    if (!alvo || typeof IntersectionObserver === 'undefined') {
      setVisivel(true);
      return;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      // A margem negativa embaixo segura a animação até o bloco entrar de fato.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );

    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  return { ref, visivel };
}

/**
 * Atraso em cascata para itens de uma mesma lista.
 *
 * Uma grade que aparece inteira de uma vez lê como um piscar. Entrando em
 * sequência, o olho acompanha a ordem — e o atraso é limitado para que o último
 * item de uma lista longa não fique esperando um tempo perceptível.
 */
export function atrasoEmCascata(indice: number, passo = 70, maximo = 420) {
  return { '--atraso': `${Math.min(indice * passo, maximo)}ms` } as CSSProperties;
}
