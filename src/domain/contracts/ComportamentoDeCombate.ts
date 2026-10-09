import type { Destrutivel } from './Destrutivel';

export type DecisaoDeCombate =
  | { readonly tipo: 'atacar'; readonly alvo: Destrutivel }
  | { readonly tipo: 'habilidade'; readonly alvo: Destrutivel };

/** Situação que um combatente controlado pelo computador observa ao decidir. */
export interface SituacaoDeCombate {
  readonly oponentes: readonly Destrutivel[];
  readonly podeUsarHabilidade: boolean;
}

/** Estratégia de decisão dos combatentes automáticos (inimigos e aliados domados). */
export interface ComportamentoDeCombate {
  decidir(situacao: SituacaoDeCombate): DecisaoDeCombate | null;
}

/** Fonte de aleatoriedade injetável, para que os testes sejam determinísticos. */
export interface GeradorAleatorio {
  /** Número em [0, 1). */
  proximo(): number;
}
