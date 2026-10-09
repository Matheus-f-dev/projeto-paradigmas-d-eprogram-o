import type { ItemBase } from './Item';

export type TipoDeArma = 'lamina' | 'cajado' | 'arco';

// #region lab:arma
/**
 * A PARTE DA AGREGAÇÃO (PDF — "A classe Arma").
 *
 * A arma é criada fora de qualquer personagem (no catálogo, em um baú ou
 * carregada por um inimigo). O personagem apenas guarda uma referência a
 * ela; quando ele é derrotado, a arma continua existindo e pode ser
 * recolhida e equipada por outro.
 */
export class Arma implements ItemBase {
  readonly categoria = 'arma' as const;

  constructor(
    readonly id: string,
    readonly catalogoId: string,
    private readonly nome: string,
    private readonly bonusAtaque: number,
    readonly tipo: TipoDeArma,
  ) {
    if (!Number.isInteger(bonusAtaque) || bonusAtaque < 0) {
      throw new RangeError('O bônus de ataque deve ser um inteiro não negativo.');
    }
  }

  getBonusAtaque(): number {
    return this.bonusAtaque;
  }

  getNome(): string {
    return this.nome;
  }
}
// #endregion
