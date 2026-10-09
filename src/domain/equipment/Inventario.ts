import { AcaoInvalidaError } from '../combat/erros';
import type { CategoriaDeItem, Item } from './Item';

// #region lab:inventario
/**
 * Inventário compartilhado do grupo. Guarda referências aos itens que não
 * estão equipados. Regra de posse: um item está no inventário OU equipado
 * em exatamente um personagem — nunca nos dois lugares.
 */
export class Inventario {
  private readonly itens: Item[] = [];

  adicionar(item: Item): void {
    if (this.contem(item.id)) return;
    this.itens.push(item);
  }

  retirar(itemId: string): Item {
    const indice = this.itens.findIndex((item) => item.id === itemId);
    if (indice < 0) throw new AcaoInvalidaError('error.itemUnavailable');
    return this.itens.splice(indice, 1)[0]!;
  }

  obter(itemId: string): Item | undefined {
    return this.itens.find((item) => item.id === itemId);
  }

  contem(itemId: string): boolean {
    return this.itens.some((item) => item.id === itemId);
  }

  listar(): readonly Item[] {
    return [...this.itens];
  }

  porCategoria(categoria: CategoriaDeItem): Item[] {
    return this.itens.filter((item) => item.categoria === categoria);
  }

  /** Quantidade de cada modelo de item (reduce para agrupar). */
  contarPorModelo(): Readonly<Record<string, number>> {
    return this.itens.reduce<Record<string, number>>((contagem, item) => {
      contagem[item.catalogoId] = (contagem[item.catalogoId] ?? 0) + 1;
      return contagem;
    }, {});
  }
}
// #endregion
