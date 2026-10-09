import type { TipoDeRecurso } from '../events/CombatEvent';
import type { CombatNotifier } from './CombatNotifier';

/** Fotografia de um recurso especial (mana, fúria ou flechas). */
export interface Recurso {
  readonly tipo: TipoDeRecurso;
  readonly atual: number;
  readonly maximo: number;
}

/** Personagens que possuem uma reserva consumida pela habilidade especial. */
export interface ComRecurso {
  getRecurso(): Recurso;
}

// #region lab:possui-mana
/**
 * Contrato específico de quem possui mana (ISP). A Poção de Mana só pode
 * ser usada em um alvo que implemente esta interface.
 */
export interface PossuiMana {
  getMana(): number;
  getManaMaxima(): number;
  restaurarMana(quantidade: number, notifier: CombatNotifier): number;
}
// #endregion

export function possuiRecurso(objeto: unknown): objeto is ComRecurso {
  return typeof objeto === 'object' && objeto !== null && typeof (objeto as ComRecurso).getRecurso === 'function';
}

export function possuiMana(objeto: unknown): objeto is PossuiMana {
  if (typeof objeto !== 'object' || objeto === null) return false;
  const candidato = objeto as Partial<PossuiMana>;
  return typeof candidato.restaurarMana === 'function' && typeof candidato.getMana === 'function';
}
