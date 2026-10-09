import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useMovimentoReduzido } from '../store/ContextoDoJogo';

/** Número que "rola" até o valor final, atualizando o DOM diretamente (sem re-render a cada quadro). */
export function ContadorAnimado({ valor, atraso = 0 }: { valor: number; atraso?: number }) {
  const elemento = useRef<HTMLSpanElement>(null);
  const reduzido = useMovimentoReduzido();
  useEffect(() => {
    const alvo = elemento.current;
    if (!alvo) return;
    if (reduzido) {
      alvo.textContent = String(valor);
      return;
    }
    const controle = animate(0, valor, {
      duration: 1.2,
      delay: atraso,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (atual) => {
        alvo.textContent = String(Math.round(atual));
      },
    });
    return () => controle.stop();
  }, [valor, atraso, reduzido]);
  return <span ref={elemento}>0</span>;
}
