import type { Elemento } from '../events/CombatEvent';

/**
 * Funções puras com as regras numéricas do combate. Não leem nem alteram
 * estado externo: o mesmo argumento produz sempre o mesmo resultado, o que
 * facilita os testes e permite reutilizá-las tanto nas entidades quanto no
 * módulo funcional sem duplicar regras.
 */

// #region lab:funcoes-puras
/** Garante um inteiro não negativo; rejeita NaN e infinitos. */
export function quantidadeValida(valor: number): number {
  if (!Number.isFinite(valor)) {
    throw new RangeError(`Quantidade inválida: ${valor}`);
  }
  return Math.max(0, Math.round(valor));
}

/** Mantém um valor dentro do intervalo [0, máximo]. */
export function limitar(valor: number, maximo: number): number {
  return Math.min(maximo, Math.max(0, valor));
}

/** Ataque efetivo: base + bônus da arma + bônus temporário − penalidade de membros perdidos. */
export function calcularAtaqueTotal(base: number, bonusArma: number, bonusTemporario: number, penalidade: number): number {
  return Math.max(1, base + bonusArma + bonusTemporario - penalidade);
}

/** Elementos que atravessam armaduras. */
const ELEMENTOS_QUE_IGNORAM_DEFESA: ReadonlySet<Elemento> = new Set<Elemento>(['perfurante']);

/**
 * Dano após a defesa. Segue a regra da Fortaleza do PDF:
 * `Math.max(1, valor - blindagem)` — todo golpe causa ao menos 1 de dano.
 */
export function calcularDanoAposDefesa(valor: number, defesa: number, elemento: Elemento = 'fisico'): number {
  const bruto = quantidadeValida(valor);
  if (bruto === 0) return 0;
  if (defesa <= 0 || ELEMENTOS_QUE_IGNORAM_DEFESA.has(elemento)) return bruto;
  return Math.max(1, bruto - defesa);
}

/** Aplica um multiplicador elemental (fraqueza 2x, resistência 0.5x) arredondando. */
export function aplicarMultiplicador(valor: number, multiplicador: number): number {
  return Math.max(0, Math.round(valor * multiplicador));
}

/** Vida resultante de uma cura, sem ultrapassar o máximo. */
export function calcularCura(vidaAtual: number, vidaMaxima: number, quantidade: number): number {
  return limitar(vidaAtual + quantidadeValida(quantidade), vidaMaxima);
}
// #endregion
