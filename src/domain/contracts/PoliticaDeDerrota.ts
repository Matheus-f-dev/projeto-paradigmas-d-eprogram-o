import type { CombatNotifier } from './CombatNotifier';

/**
 * Visão estreita que o Personagem entrega à política de derrota. A política
 * pode restaurar vida ou fortalecer o ataque, mas não acessa o restante do
 * estado interno do personagem.
 */
export interface AlvoDaPolitica {
  readonly id: string;
  getNome(): string;
  getVidaMaxima(): number;
  restaurarVida(quantidade: number): void;
  fortalecerAtaque(bonus: number): void;
}

export type DesfechoDaDerrota = 'definitiva' | 'inconsciente' | 'evitada';

// #region lab:politica-de-derrota
/**
 * Resposta do PDF ao "Problema 2" do OCP: o que acontece quando a vida
 * zera não fica mais preso em um if dentro de receberDano. Zumbis que se
 * reerguem, chefes que mudam de fase e heróis que ficam inconscientes são
 * novas estratégias, sem alterar a classe Personagem.
 */
export interface PoliticaDeDerrota {
  aoZerarVida(alvo: AlvoDaPolitica, notifier: CombatNotifier): DesfechoDaDerrota;
}
// #endregion
