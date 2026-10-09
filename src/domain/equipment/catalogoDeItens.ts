import { Arma, type TipoDeArma } from './Arma';
import { Armadura } from './Armadura';
import { BencaoDoSantuario, Consumivel, CuraDeVida, RestauracaoDeMana, type EfeitoDeConsumivel } from './Consumivel';
import type { Item } from './Item';

type ModeloDeItem =
  | { readonly categoria: 'arma'; readonly nome: string; readonly bonus: number; readonly tipo: TipoDeArma }
  | { readonly categoria: 'armadura'; readonly nome: string; readonly defesa: number }
  | { readonly categoria: 'consumivel'; readonly nome: string; readonly efeito: () => EfeitoDeConsumivel };

/** Modelos de item disponíveis no jogo. Novos itens entram aqui, sem alterar o combate. */
const MODELOS = {
  'espada-longa': { categoria: 'arma', nome: 'Espada Longa', bonus: 3, tipo: 'lamina' },
  'espada-vorpal': { categoria: 'arma', nome: 'Espada Vorpal', bonus: 6, tipo: 'lamina' },
  'adaga-enferrujada': { categoria: 'arma', nome: 'Adaga Enferrujada', bonus: 2, tipo: 'lamina' },
  'cajado-de-carvalho': { categoria: 'arma', nome: 'Cajado de Carvalho', bonus: 2, tipo: 'cajado' },
  'cajado-das-brasas': { categoria: 'arma', nome: 'Cajado das Brasas', bonus: 4, tipo: 'cajado' },
  'arco-curto': { categoria: 'arma', nome: 'Arco Curto', bonus: 2, tipo: 'arco' },
  'arco-de-teixo': { categoria: 'arma', nome: 'Arco de Teixo', bonus: 4, tipo: 'arco' },
  'gibao-de-couro': { categoria: 'armadura', nome: 'Gibão de Couro', defesa: 1 },
  'cota-de-malha': { categoria: 'armadura', nome: 'Cota de Malha', defesa: 2 },
  'manto-runico': { categoria: 'armadura', nome: 'Manto Rúnico', defesa: 1 },
  'pocao-de-vida': { categoria: 'consumivel', nome: 'Poção de Vida', efeito: () => new CuraDeVida(15) },
  'pocao-de-mana': { categoria: 'consumivel', nome: 'Poção de Mana', efeito: () => new RestauracaoDeMana(10) },
  'elixir-do-santuario': {
    categoria: 'consumivel',
    nome: 'Elixir do Santuário',
    efeito: () => new BencaoDoSantuario(20, 2, 2),
  },
} as const satisfies Record<string, ModeloDeItem>;

export type CatalogoId = keyof typeof MODELOS;

export function ehCatalogoIdValido(valor: string): valor is CatalogoId {
  return Object.prototype.hasOwnProperty.call(MODELOS, valor);
}

/** Fábrica de itens: cria instâncias com identificadores únicos. */
export class CatalogoDeItens {
  private contador = 0;

  criar(catalogoId: CatalogoId, idExistente?: string): Item {
    const id = idExistente ?? `${catalogoId}#${++this.contador}`;
    if (idExistente) this.sincronizarContador(idExistente);
    const modelo: ModeloDeItem = MODELOS[catalogoId];
    switch (modelo.categoria) {
      case 'arma':
        return new Arma(id, catalogoId, modelo.nome, modelo.bonus, modelo.tipo);
      case 'armadura':
        return new Armadura(id, catalogoId, modelo.nome, modelo.defesa);
      case 'consumivel':
        return new Consumivel(id, catalogoId, modelo.nome, modelo.efeito());
    }
  }

  criarArma(catalogoId: CatalogoId): Arma {
    const item = this.criar(catalogoId);
    if (item.categoria !== 'arma') throw new RangeError(`${catalogoId} não é uma arma.`);
    return item;
  }

  criarArmadura(catalogoId: CatalogoId): Armadura {
    const item = this.criar(catalogoId);
    if (item.categoria !== 'armadura') throw new RangeError(`${catalogoId} não é uma armadura.`);
    return item;
  }

  /** Evita colisão de ids ao restaurar itens de um save. */
  private sincronizarContador(id: string): void {
    const numero = Number(id.split('#')[1]);
    if (Number.isInteger(numero)) this.contador = Math.max(this.contador, numero);
  }
}
