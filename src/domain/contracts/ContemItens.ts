import type { Item } from '../equipment/Item';

/**
 * Agregação "Bau agregando Item" (PDF — Outras Ideias Complementares):
 * quando o baú quebra, os itens caem no chão; a destruição do recipiente
 * não aniquila os itens contidos nele.
 */
export interface ContemItens {
  getItens(): readonly Item[];
  retirarItens(): Item[];
}

export function contemItens(objeto: unknown): objeto is ContemItens {
  if (typeof objeto !== 'object' || objeto === null) return false;
  const candidato = objeto as Partial<ContemItens>;
  return typeof candidato.retirarItens === 'function' && typeof candidato.getItens === 'function';
}
