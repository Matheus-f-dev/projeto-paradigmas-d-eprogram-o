import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Elemento, TipoDeRecurso } from '../events/CombatEvent';

/** O mínimo que uma habilidade precisa saber sobre quem a utiliza. */
export interface Atacante {
  readonly id: string;
  getNome(): string;
  getAtaque(): number;
}

// #region lab:habilidade
/**
 * Estratégia de habilidade especial (OCP). Novas habilidades são novas
 * classes que implementam este contrato; o combate e os personagens que
 * já existem não precisam ser alterados.
 */
export interface Habilidade {
  readonly id: string;
  readonly elemento: Elemento;
  readonly recurso: TipoDeRecurso | null;
  readonly custo: number;
  calcularDano(ataqueDoUsuario: number): number;
  executar(usuario: Atacante, alvo: Destrutivel, notifier: CombatNotifier): void;
}
// #endregion
