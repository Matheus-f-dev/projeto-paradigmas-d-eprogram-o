import type { Transition, Variants } from 'framer-motion';

/** Transição entre telas: escurece como uma cortina de névoa e revela a próxima. */
export const transicaoDeTela: Variants = {
  entrada: { opacity: 0, scale: 1.03, filter: 'blur(6px) brightness(0.4)' },
  visivel: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px) brightness(1)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  saida: {
    opacity: 0,
    scale: 0.985,
    filter: 'blur(4px) brightness(0.3)',
    transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
  },
};

/** Lista com entrada em cascata (opções de menu, cartões, itens). */
export const cascata = (atraso = 0.08, inicio = 0): Variants => ({
  oculto: {},
  visivel: { transition: { staggerChildren: atraso, delayChildren: inicio } },
});

export const surgirDeBaixo: Variants = {
  oculto: { opacity: 0, y: 18 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const surgirDaEsquerda: Variants = {
  oculto: { opacity: 0, x: -24 },
  visivel: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export const mola: Transition = { type: 'spring', stiffness: 320, damping: 28 };
