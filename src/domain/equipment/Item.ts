import type { Arma } from './Arma';
import type { Armadura } from './Armadura';
import type { Consumivel } from './Consumivel';

export type CategoriaDeItem = 'arma' | 'armadura' | 'consumivel';

/** Dados comuns a todo item que pode estar no inventário. */
export interface ItemBase {
  /** Identificador único da instância (duas poções têm ids diferentes). */
  readonly id: string;
  /** Identificador do modelo no catálogo (usado para tradução e persistência). */
  readonly catalogoId: string;
  readonly categoria: CategoriaDeItem;
  getNome(): string;
}

export type Item = Arma | Armadura | Consumivel;
