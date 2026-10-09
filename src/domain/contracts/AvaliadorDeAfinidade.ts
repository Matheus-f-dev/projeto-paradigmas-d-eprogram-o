import type { Elemento } from '../events/CombatEvent';

/**
 * Contrato consultado por inimigos para descobrir fraquezas e resistências.
 * A implementação concreta é a BaseDeConhecimento do paradigma lógico.
 */
export interface AvaliadorDeAfinidade {
  inferirMultiplicadorDano(elementoAtaque: Elemento | string, tipoInimigo: string): number;
}

/** Avaliador neutro: nenhuma fraqueza ou resistência conhecida. */
export const AFINIDADE_NEUTRA: AvaliadorDeAfinidade = {
  inferirMultiplicadorDano: () => 1,
};
