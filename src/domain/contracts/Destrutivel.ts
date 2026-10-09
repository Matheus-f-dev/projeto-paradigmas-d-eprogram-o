import type { Elemento } from '../events/CombatEvent';
import type { CombatNotifier } from './CombatNotifier';

// #region lab:destrutivel
/**
 * Abstração de "algo que pode sofrer dano" (PDF — Violações do DIP).
 * Personagem, Membro, Bau e Fortaleza assinam este contrato, e por isso
 * `atacar()` aceita qualquer Destrutivel em vez de exigir um Personagem.
 */
export interface Destrutivel {
  readonly id: string;
  receberDano(valor: number, notifier: CombatNotifier, elemento?: Elemento): void;
  estaDestruido(): boolean;
  getNome(): string;
  getVida(): number;
  getVidaMaxima(): number;
}
// #endregion
