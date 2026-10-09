import type { AvaliadorDeAfinidade } from '../contracts/AvaliadorDeAfinidade';
import type { GeradorAleatorio } from '../contracts/ComportamentoDeCombate';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import { DerrotarInimigosEDestruir, DerrotarTodosOsInimigos, type CondicaoDeVitoria } from '../combat/condicoesDeVitoria';
import type { CatalogoDeItens, CatalogoId } from '../equipment/catalogoDeItens';
import { Bau } from '../model/Bau';
import { Chefe } from '../model/Chefe';
import { Fortaleza } from '../model/Fortaleza';
import { Inimigo } from '../model/Inimigo';
import type { Personagem } from '../model/Personagem';
import { Zumbi } from '../model/Zumbi';
import { AtacarAleatorio, AtacarMaisFraco } from '../rules/comportamentos';

export type IdDeEstagio = 'floresta-sombria' | 'portao-da-cidadela' | 'covil-do-demogorgon';

export interface DependenciasDoEstagio {
  readonly catalogo: CatalogoDeItens;
  readonly afinidades: AvaliadorDeAfinidade;
  readonly aleatorio: GeradorAleatorio;
  /** Notificador silencioso para equipar os inimigos antes da batalha. */
  readonly preparacao: CombatNotifier;
}

export interface ElencoDoEstagio {
  readonly inimigos: Personagem[];
  readonly aliados: Personagem[];
  readonly cenario: Destrutivel[];
  readonly condicaoDeVitoria: CondicaoDeVitoria;
}

export interface DefinicaoDeEstagio {
  readonly id: IdDeEstagio;
  /** Chave de tradução do objetivo (igual à da condição de vitória montada). */
  readonly objetivo: string;
  /** Itens entregues ao grupo após a vitória. */
  readonly recompensas: readonly CatalogoId[];
  montar(dependencias: DependenciasDoEstagio): ElencoDoEstagio;
}

export const ESTAGIOS: readonly DefinicaoDeEstagio[] = [
  {
    id: 'floresta-sombria',
    objetivo: 'objective.defeatAll',
    recompensas: ['pocao-de-vida', 'manto-runico'],
    montar({ catalogo, afinidades, aleatorio, preparacao }) {
      const goblin = new Inimigo('Goblin', 25, 5, {
        id: 'goblin',
        tipoCriatura: 'goblin',
        afinidades,
        comportamento: new AtacarAleatorio(aleatorio),
      });
      goblin.equiparArma(catalogo.criarArma('adaga-enferrujada'), preparacao);
      const batedor = new Inimigo('Goblin Batedor', 18, 4, {
        id: 'goblin-batedor',
        tipoCriatura: 'goblin',
        afinidades,
        comportamento: new AtacarMaisFraco(),
      });
      const bau = new Bau('bau-antigo', 'Baú Antigo', 10, [
        catalogo.criar('pocao-de-vida'),
        catalogo.criar('gibao-de-couro'),
        catalogo.criar('pocao-de-mana'),
      ]);
      return { inimigos: [goblin, batedor], aliados: [], cenario: [bau], condicaoDeVitoria: new DerrotarTodosOsInimigos() };
    },
  },
  {
    id: 'portao-da-cidadela',
    objetivo: 'objective.defeatAllAndDestroy',
    recompensas: ['elixir-do-santuario', 'cajado-das-brasas', 'arco-de-teixo', 'cota-de-malha'],
    montar({ catalogo, afinidades, aleatorio, preparacao }) {
      const sentinela = new Zumbi('Sentinela Morta', 28, 6, { id: 'sentinela-morta', afinidades });
      sentinela.equiparArma(catalogo.criarArma('espada-longa'), preparacao);
      const goblin = new Inimigo('Goblin Saqueador', 24, 6, {
        id: 'goblin-saqueador',
        tipoCriatura: 'goblin',
        afinidades,
        comportamento: new AtacarAleatorio(aleatorio),
      });
      goblin.equiparArma(catalogo.criarArma('adaga-enferrujada'), preparacao);
      const portao = new Fortaleza('portao-da-cidadela', 'Portão da Cidadela', 15);
      return {
        inimigos: [sentinela, goblin],
        aliados: [],
        cenario: [portao],
        condicaoDeVitoria: new DerrotarInimigosEDestruir('portao-da-cidadela'),
      };
    },
  },
  {
    id: 'covil-do-demogorgon',
    objetivo: 'objective.defeatAll',
    recompensas: [],
    montar({ afinidades }) {
      const demogorgon = new Chefe('Demogorgon', 90, 11, {
        id: 'demogorgon',
        tipoCriatura: 'demogorgon',
        afinidades,
        vidaDaSegundaFase: 60,
        bonusDaSegundaFase: 4,
      });
      // O monstro domado do PDF: um Inimigo que luta ao lado dos heróis (LSP).
      const dart = new Inimigo('Dart', 25, 5, { id: 'dart', tipoCriatura: 'criatura', comportamento: new AtacarMaisFraco() });
      return { inimigos: [demogorgon], aliados: [dart], cenario: [], condicaoDeVitoria: new DerrotarTodosOsInimigos() };
    },
  },
];

export function estagioPorIndice(indice: number): DefinicaoDeEstagio {
  const estagio = ESTAGIOS[indice];
  if (!estagio) throw new RangeError(`Estágio inexistente: ${indice}`);
  return estagio;
}
