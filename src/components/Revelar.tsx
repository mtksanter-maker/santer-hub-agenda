import type { ReactNode } from 'react';
import { useRevelar } from '../lib/useRevelar';

/**
 * Grupo de revelação por rolagem.
 *
 * Não anima a si mesmo: apenas marca quando a seção entrou na tela. Quem se
 * move são as peças de dentro marcadas com `revelar-item`, cada uma com seu
 * próprio atraso — o cabeçalho da seção primeiro, os cards em sequência.
 * Assim o olho acompanha a ordem de leitura em vez de receber o bloco inteiro
 * de uma vez.
 */
export default function Revelar({ children }: { children: ReactNode }) {
  const { ref, visivel } = useRevelar<HTMLDivElement>();

  return (
    <div ref={ref} className="revelar-grupo" data-visivel={visivel}>
      {children}
    </div>
  );
}
