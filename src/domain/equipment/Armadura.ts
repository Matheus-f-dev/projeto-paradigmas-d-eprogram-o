import type { ItemBase } from './Item';

/**
 * Armadura (agregação, como a Arma): reduz o dano recebido pelo portador
 * usando a mesma regra da Fortaleza do PDF — `max(1, valor - defesa)`.
 */
export class Armadura implements ItemBase {
  readonly categoria = 'armadura' as const;

  constructor(
    readonly id: string,
    readonly catalogoId: string,
    private readonly nome: string,
    private readonly defesa: number,
  ) {
    if (!Number.isInteger(defesa) || defesa < 0) {
      throw new RangeError('A defesa deve ser um inteiro não negativo.');
    }
  }

  getDefesa(): number {
    return this.defesa;
  }

  getNome(): string {
    return this.nome;
  }
}
