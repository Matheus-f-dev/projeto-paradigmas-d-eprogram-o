import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { ContemItens } from '../contracts/ContemItens';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Item } from '../equipment/Item';
import { quantidadeValida } from '../rules/calculos';

// #region lab:bau
/**
 * Entidade inanimada que implementa Destrutivel sem herdar de Personagem
 * (PDF — DIP). Também agrega itens: quando quebra, os itens são revelados e
 * continuam existindo para serem recolhidos.
 */
export class Bau implements Destrutivel, ContemItens {
  private durabilidade: number;
  private readonly durabilidadeMaxima: number;
  private itens: Item[];

  constructor(
    readonly id: string,
    private readonly nome: string,
    durabilidade: number,
    itens: readonly Item[] = [],
  ) {
    this.durabilidade = durabilidade;
    this.durabilidadeMaxima = durabilidade;
    this.itens = [...itens];
  }

  receberDano(valor: number, notifier: CombatNotifier): void {
    if (this.estaDestruido()) return;
    const dano = quantidadeValida(valor);
    this.durabilidade = Math.max(0, this.durabilidade - dano);
    notifier.notify({
      key: 'chest_damage',
      alvoId: this.id,
      alvo: this.nome,
      valor: dano,
      restante: this.durabilidade,
      maximo: this.durabilidadeMaxima,
    });
    if (this.estaDestruido()) {
      notifier.notify({ key: 'chest_broken', alvoId: this.id, alvo: this.nome, catalogoIds: this.itens.map((item) => item.catalogoId) });
    }
  }
  // #endregion

  estaDestruido(): boolean {
    return this.durabilidade === 0;
  }

  getNome(): string {
    return this.nome;
  }

  getVida(): number {
    return this.durabilidade;
  }

  getVidaMaxima(): number {
    return this.durabilidadeMaxima;
  }

  getItens(): readonly Item[] {
    return this.itens;
  }

  /** Entrega os itens (que sobrevivem ao baú) e esvazia o recipiente. */
  retirarItens(): Item[] {
    const retirados = this.itens;
    this.itens = [];
    return retirados;
  }
}
