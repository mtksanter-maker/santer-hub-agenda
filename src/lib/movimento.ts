import { useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * Utilidades de movimento contínuo.
 *
 * A ideia comum a tudo aqui: o retorno acontece *durante* a interação, ligado
 * ao valor atual da entrada (a rolagem, o ponteiro) — não ao fim dela, e não a
 * um cronômetro.
 */

/** A pessoa pediu menos movimento ao sistema? */
export function movimentoReduzido() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Escreve o progresso da rolagem sobre a primeira dobra (0 a 1) na variável
 * `--rolagem-hero`, quadro a quadro.
 *
 * O CSS usa esse número para mover a marca junto com a rolagem, 1:1. A escrita
 * é feita dentro de `requestAnimationFrame` — o relógio do display — e só
 * quando o valor muda de fato, para não sujar o quadro à toa.
 */
export function useProgressoHero() {
  useEffect(() => {
    const raiz = document.documentElement;

    if (movimentoReduzido()) {
      raiz.style.setProperty('--rolagem-hero', '0');
      return;
    }

    let quadro = 0;
    let ultimo = -1;

    const aplicar = () => {
      quadro = 0;
      const altura = window.innerHeight || 1;
      const bruto = Math.min(1, Math.max(0, window.scrollY / altura));
      // Três casas bastam: abaixo disso o olho não distingue e o estilo não muda.
      const progresso = Math.round(bruto * 1000) / 1000;

      if (progresso !== ultimo) {
        ultimo = progresso;
        raiz.style.setProperty('--rolagem-hero', String(progresso));
      }
    };

    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(aplicar);
    };

    aplicar();
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);

    return () => {
      if (quadro) cancelAnimationFrame(quadro);
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
      raiz.style.removeProperty('--rolagem-hero');
    };
  }, []);
}

/**
 * Qual seção está sendo lida agora.
 *
 * Alimenta o indicador da navegação — a resposta visual para "onde estou?".
 * Considera atual a seção que cruza a faixa central da tela.
 */
export function useSecaoAtual(ids: readonly string[]) {
  const [atual, setAtual] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const alvos = ids
      .map((id) => document.getElementById(id))
      .filter((elemento): elemento is HTMLElement => elemento !== null);

    if (alvos.length === 0) return;

    const visiveis = new Map<string, number>();

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            visiveis.set(entrada.target.id, entrada.intersectionRatio);
          } else {
            visiveis.delete(entrada.target.id);
          }
        }

        // Entre as seções na faixa central, vence a que ocupa mais espaço.
        let vencedora: string | null = null;
        let maior = 0;
        for (const [id, proporcao] of visiveis) {
          if (proporcao >= maior) {
            maior = proporcao;
            vencedora = id;
          }
        }

        setAtual(vencedora);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    alvos.forEach((alvo) => observador.observe(alvo));
    return () => observador.disconnect();
  }, [ids]);

  return atual;
}

/**
 * Brilho que segue o ponteiro sobre uma superfície de vidro.
 *
 * Guarda a posição do ponteiro, relativa ao card, em variáveis CSS. É a luz
 * acompanhando a mão — retorno contínuo enquanto o ponteiro está sobre a peça,
 * e não só quando ele entra ou sai.
 */
export function aoMoverPonteiro(evento: ReactPointerEvent<HTMLElement>) {
  const alvo = evento.currentTarget;
  const area = alvo.getBoundingClientRect();
  alvo.style.setProperty('--ponteiro-x', `${((evento.clientX - area.left) / area.width) * 100}%`);
  alvo.style.setProperty('--ponteiro-y', `${((evento.clientY - area.top) / area.height) * 100}%`);
}
