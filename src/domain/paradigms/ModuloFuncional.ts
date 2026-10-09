import { calcularCura } from '../rules/calculos';

/**
 * PARADIGMA FUNCIONAL (PDF — "Mesclando paradigmas", ModuloFuncional).
 *
 * No PDF, curarEFortificar recebe uma lista imutável de Personagem e devolve
 * novos objetos via `comVida(...)`. Aqui as entidades do jogo continuam
 * mutáveis e encapsuladas (são a fonte de verdade da partida); o pipeline
 * funcional trabalha sobre fichas imutáveis — fotografias dos combatentes —
 * e devolve novas fichas sem tocar nas originais. Quem aplica o resultado às
 * entidades é o caso de uso, usando os métodos públicos receberCura/fortificar.
 */

/** Fotografia imutável de um combatente. */
export interface FichaDeCombatente {
  readonly id: string;
  readonly nome: string;
  readonly vida: number;
  readonly vidaMaxima: number;
  readonly ataque: number;
  readonly bonusTemporario: number;
}

// #region lab:cura-funcional
/** Equivalente funcional do `comVida(novaVida)` do PDF: cria uma cópia, não altera o original. */
export const comVida = (ficha: FichaDeCombatente, novaVida: number): FichaDeCombatente =>
  Object.freeze({ ...ficha, vida: calcularCura(0, ficha.vidaMaxima, novaVida) });

export const comBonus = (ficha: FichaDeCombatente, bonus: number): FichaDeCombatente =>
  Object.freeze({ ...ficha, bonusTemporario: ficha.bonusTemporario + bonus, ataque: ficha.ataque + bonus });

/**
 * Pipeline puro: filter (quem está abaixo do corte e ainda de pé) → map
 * (multiplica a vida, limitada ao máximo, e soma o bônus de ataque).
 */
export function curarEFortificar(
  combatentes: readonly FichaDeCombatente[],
  corteDeVida: number,
  multiplicador: number,
  bonusDeAtaque = 0,
): readonly FichaDeCombatente[] {
  const precisaDeCura = (ficha: FichaDeCombatente): boolean => ficha.vida > 0 && ficha.vida < corteDeVida;
  const multiplicarVida = (ficha: FichaDeCombatente): FichaDeCombatente => comVida(ficha, ficha.vida * multiplicador);
  const fortificar = (ficha: FichaDeCombatente): FichaDeCombatente => comBonus(ficha, bonusDeAtaque);

  return Object.freeze(combatentes.filter(precisaDeCura).map(multiplicarVida).map(fortificar));
}
// #endregion

/**
 * takeWhile não existe nos arrays do JavaScript; esta é uma versão funcional
 * com gerador, usada na "BatalhaFuncional" do PDF.
 */
export function* takeWhile<T>(itens: Iterable<T>, condicao: (item: T) => boolean): Generator<T> {
  for (const item of itens) {
    if (!condicao(item)) return;
    yield item;
  }
}
