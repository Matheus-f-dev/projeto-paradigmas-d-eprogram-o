import type { CatalogoId } from '../equipment/catalogoDeItens';
import { Arqueiro } from '../model/Arqueiro';
import { Guerreiro } from '../model/Guerreiro';
import { Mago } from '../model/Mago';
import type { Personagem } from '../model/Personagem';
import { Inconsciencia } from '../rules/politicasDeDerrota';

export type ClasseJogavel = 'guerreiro' | 'mago' | 'arqueiro';

/** Dados de apresentação e criação de cada classe jogável. */
export interface DefinicaoDeClasse {
  readonly classe: ClasseJogavel;
  readonly nome: string;
  readonly vida: number;
  readonly ataque: number;
  readonly mana?: number;
  readonly habilidadeId: string;
  readonly armaInicial: CatalogoId;
  criar(): Personagem;
}

/** Heróis caem inconscientes em vez de morrer: podem ser reanimados no acampamento. */
const opcoesDeHeroi = (id: string) => ({ id, politicaDeDerrota: new Inconsciencia() });

export const CLASSES_JOGAVEIS: readonly DefinicaoDeClasse[] = [
  {
    classe: 'guerreiro',
    nome: 'Mike',
    vida: 40,
    ataque: 8,
    habilidadeId: 'golpe-brutal',
    armaInicial: 'espada-longa',
    criar: () => new Guerreiro('Mike', 40, 8, opcoesDeHeroi('heroi-guerreiro')),
  },
  {
    classe: 'mago',
    nome: 'Eleven',
    vida: 30,
    ataque: 6,
    mana: 20,
    habilidadeId: 'bola-de-fogo',
    armaInicial: 'cajado-de-carvalho',
    criar: () => new Mago('Eleven', 30, 6, 20, opcoesDeHeroi('heroi-mago')),
  },
  {
    classe: 'arqueiro',
    nome: 'Will',
    vida: 32,
    ataque: 7,
    habilidadeId: 'flecha-perfurante',
    armaInicial: 'arco-curto',
    criar: () => new Arqueiro('Will', 32, 7, opcoesDeHeroi('heroi-arqueiro')),
  },
];

export function definicaoDaClasse(classe: ClasseJogavel): DefinicaoDeClasse {
  const definicao = CLASSES_JOGAVEIS.find((item) => item.classe === classe);
  if (!definicao) throw new RangeError(`Classe desconhecida: ${classe}`);
  return definicao;
}

export function ehClasseJogavel(valor: unknown): valor is ClasseJogavel {
  return CLASSES_JOGAVEIS.some((definicao) => definicao.classe === valor);
}

/** Itens com que todo grupo começa a jornada. */
export const INVENTARIO_INICIAL: readonly CatalogoId[] = ['pocao-de-vida', 'pocao-de-vida', 'pocao-de-mana'];
