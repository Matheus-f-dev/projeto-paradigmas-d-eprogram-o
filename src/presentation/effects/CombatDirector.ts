import type { CombatEvent, Elemento, TipoDeRecurso } from '../../domain/events/CombatEvent';

/**
 * Diretor de combate: converte os eventos REAIS emitidos pelo domínio em um
 * roteiro temporizado de "cues" visuais e sonoras.
 *
 * Regra de ouro: nenhuma cue inventa um resultado. Números de dano, vida
 * restante, mana gasta e derrotas vêm dos campos dos eventos; o diretor
 * apenas decide QUANDO e COMO mostrá-los. É uma função pura, testável sem
 * React, sem Canvas e sem temporizadores.
 */

export type EstiloDePreparo = 'furia' | 'arcano' | 'mira' | 'sombra' | 'golpe';

export type Cue =
  | { readonly tipo: 'turno'; readonly atorId: string }
  | { readonly tipo: 'log'; readonly evento: CombatEvent }
  | { readonly tipo: 'preparo'; readonly atorId: string; readonly estilo: EstiloDePreparo; readonly duracao: number }
  | { readonly tipo: 'avanco'; readonly atorId: string; readonly alvoId: string; readonly pesado: boolean; readonly duracao: number }
  | { readonly tipo: 'corte'; readonly atorId: string; readonly alvoId: string; readonly estilo: 'aco' | 'brutal' | 'sombra' | 'garra' }
  | { readonly tipo: 'projetil'; readonly atorId: string; readonly alvoId: string; readonly estilo: 'fogo' | 'flecha'; readonly duracao: number }
  | { readonly tipo: 'impacto'; readonly alvoId: string; readonly elemento: Elemento; readonly forca: 1 | 2 | 3 }
  | {
      readonly tipo: 'dano';
      readonly alvoId: string;
      readonly valor: number;
      readonly restante: number;
      readonly maximo: number;
      readonly elemento: Elemento;
      readonly material: 'carne' | 'madeira' | 'pedra';
      readonly absorvido: number;
    }
  | { readonly tipo: 'cura'; readonly alvoId: string; readonly quantidade: number; readonly restante: number; readonly maximo: number }
  | { readonly tipo: 'mana'; readonly alvoId: string; readonly quantidade: number; readonly restante: number; readonly maximo: number }
  | { readonly tipo: 'recurso'; readonly atorId: string; readonly recurso: TipoDeRecurso; readonly restante: number; readonly maximo: number }
  | { readonly tipo: 'fortificar'; readonly alvoId: string; readonly bonus: number }
  | {
      readonly tipo: 'texto';
      readonly alvoId: string;
      readonly chave: string;
      readonly args: readonly (string | number)[];
      readonly estilo: 'fraqueza' | 'resiste' | 'critico' | 'fase' | 'reergue' | 'espolio' | 'queda';
    }
  | { readonly tipo: 'derrota'; readonly alvoId: string; readonly definitiva: boolean }
  | { readonly tipo: 'reerguer'; readonly alvoId: string; readonly vida: number }
  | { readonly tipo: 'fase'; readonly alvoId: string; readonly vida: number }
  | { readonly tipo: 'quebra'; readonly alvoId: string; readonly material: 'madeira' | 'pedra' }
  | { readonly tipo: 'membro'; readonly membroId: string; readonly donoId: string }
  | { readonly tipo: 'espolio'; readonly catalogoIds: readonly string[] }
  | { readonly tipo: 'item'; readonly atorId: string; readonly alvoId: string; readonly catalogoId: string }
  | { readonly tipo: 'grito'; readonly chave: string }
  | { readonly tipo: 'fim'; readonly vitoria: boolean };

export interface CueAgendada {
  /** Instante, em milissegundos desde o início do roteiro. */
  readonly t: number;
  readonly cue: Cue;
}

export interface Roteiro {
  readonly cues: readonly CueAgendada[];
  readonly duracao: number;
}

export interface OpcoesDoRoteiro {
  /** Multiplicador de tempo (velocidade rápida, movimento reduzido). */
  readonly escala: number;
  /** Indica se o id pertence a um herói (turnos do jogador são mais curtos). */
  readonly ehDoJogador: (id: string) => boolean;
}

interface Acumulador {
  cues: CueAgendada[];
  cursor: number;
}

type Construtor<E> = (evento: E, acc: Acumulador, opcoes: OpcoesDoRoteiro) => void;
type Tabela = { [K in CombatEvent['key']]: Construtor<Extract<CombatEvent, { key: K }>> };

const agendar = (acc: Acumulador, atraso: number, cue: Cue, escala: number) => {
  acc.cues.push({ t: Math.round(acc.cursor + atraso * escala), cue });
};

const avancar = (acc: Acumulador, ms: number, escala: number) => {
  acc.cursor += ms * escala;
};

/** Ataque com aproximação: preparo opcional, avanço, corte e o instante do impacto. */
function golpeCorpoACorpo(
  acc: Acumulador,
  escala: number,
  dados: { atorId: string; alvoId: string; preparo?: EstiloDePreparo; preparoMs?: number; pesado: boolean; corte: 'aco' | 'brutal' | 'sombra' | 'garra'; forca: 1 | 2 | 3; elemento: Elemento },
) {
  const preparo = dados.preparo ? (dados.preparoMs ?? 500) : 0;
  if (dados.preparo) agendar(acc, 0, { tipo: 'preparo', atorId: dados.atorId, estilo: dados.preparo, duracao: preparo * escala }, escala);
  const duracaoDoAvanco = dados.pesado ? 640 : 520;
  agendar(acc, preparo, { tipo: 'avanco', atorId: dados.atorId, alvoId: dados.alvoId, pesado: dados.pesado, duracao: duracaoDoAvanco * escala }, escala);
  const impacto = preparo + (dados.pesado ? 300 : 240);
  agendar(acc, impacto - 40, { tipo: 'corte', atorId: dados.atorId, alvoId: dados.alvoId, estilo: dados.corte }, escala);
  agendar(acc, impacto, { tipo: 'impacto', alvoId: dados.alvoId, elemento: dados.elemento, forca: dados.forca }, escala);
  avancar(acc, impacto, escala);
}

const MATERIAL: Readonly<Record<string, 'carne' | 'madeira' | 'pedra'>> = {
  damage_received: 'carne',
  chest_damage: 'madeira',
  fortress_damage: 'pedra',
};

const CONSTRUTORES: Tabela = {
  turn_start: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'turno', atorId: e.atorId }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, o.ehDoJogador(e.atorId) ? 80 : 450, o.escala);
  },
  attack: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    golpeCorpoACorpo(acc, o.escala, { atorId: e.atorId, alvoId: e.alvoId, pesado: false, corte: 'aco', forca: 1, elemento: 'fisico' });
  },
  brutal_strike: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    golpeCorpoACorpo(acc, o.escala, {
      atorId: e.atorId,
      alvoId: e.alvoId,
      preparo: 'furia',
      preparoMs: 560,
      pesado: true,
      corte: 'brutal',
      forca: 3,
      elemento: 'fisico',
    });
  },
  shadow_lunge: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    golpeCorpoACorpo(acc, o.escala, {
      atorId: e.atorId,
      alvoId: e.alvoId,
      preparo: 'sombra',
      preparoMs: 600,
      pesado: true,
      corte: 'sombra',
      forca: 3,
      elemento: 'sombrio',
    });
  },
  fireball: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    agendar(acc, 0, { tipo: 'preparo', atorId: e.atorId, estilo: 'arcano', duracao: 760 * o.escala }, o.escala);
    agendar(acc, 680, { tipo: 'projetil', atorId: e.atorId, alvoId: e.alvoId, estilo: 'fogo', duracao: 440 * o.escala }, o.escala);
    agendar(acc, 1120, { tipo: 'impacto', alvoId: e.alvoId, elemento: 'fogo', forca: 3 }, o.escala);
    avancar(acc, 1120, o.escala);
  },
  piercing_arrow: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    agendar(acc, 0, { tipo: 'preparo', atorId: e.atorId, estilo: 'mira', duracao: 360 * o.escala }, o.escala);
    agendar(acc, 340, { tipo: 'projetil', atorId: e.atorId, alvoId: e.alvoId, estilo: 'flecha', duracao: 200 * o.escala }, o.escala);
    agendar(acc, 540, { tipo: 'impacto', alvoId: e.alvoId, elemento: 'perfurante', forca: 2 }, o.escala);
    avancar(acc, 540, o.escala);
  },
  damage_received: (e, acc, o) => {
    agendar(
      acc,
      0,
      {
        tipo: 'dano',
        alvoId: e.alvoId,
        valor: e.valor,
        restante: e.restante,
        maximo: e.maximo,
        elemento: e.elemento,
        material: MATERIAL[e.key]!,
        absorvido: e.absorvido,
      },
      o.escala,
    );
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 260, o.escala);
  },
  chest_damage: (e, acc, o) => {
    agendar(
      acc,
      0,
      { tipo: 'dano', alvoId: e.alvoId, valor: e.valor, restante: e.restante, maximo: e.maximo, elemento: 'fisico', material: 'madeira', absorvido: 0 },
      o.escala,
    );
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 240, o.escala);
  },
  fortress_damage: (e, acc, o) => {
    agendar(
      acc,
      0,
      {
        tipo: 'dano',
        alvoId: e.alvoId,
        valor: e.valor,
        restante: e.restante,
        maximo: e.maximo,
        elemento: 'fisico',
        material: 'pedra',
        absorvido: e.absorvido,
      },
      o.escala,
    );
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 260, o.escala);
  },
  weakness: (e, acc, o) => {
    const fraqueza = e.multiplicador > 1;
    agendar(
      acc,
      0,
      {
        tipo: 'texto',
        alvoId: e.alvoId,
        chave: fraqueza ? 'combat.weak' : 'combat.resist',
        args: [e.multiplicador],
        estilo: fraqueza ? 'fraqueza' : 'resiste',
      },
      o.escala,
    );
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
  },
  defeated: (e, acc, o) => {
    agendar(acc, 60, { tipo: 'derrota', alvoId: e.alvoId, definitiva: true }, o.escala);
    agendar(acc, 60, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 700, o.escala);
  },
  unconscious: (e, acc, o) => {
    agendar(acc, 60, { tipo: 'derrota', alvoId: e.alvoId, definitiva: false }, o.escala);
    agendar(acc, 60, { tipo: 'texto', alvoId: e.alvoId, chave: 'combat.unconscious', args: [], estilo: 'queda' }, o.escala);
    agendar(acc, 60, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 560, o.escala);
  },
  limb_severed: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'membro', membroId: e.membroId, donoId: e.donoId }, o.escala);
    agendar(acc, 0, { tipo: 'texto', alvoId: e.donoId, chave: 'combat.critical', args: [], estilo: 'critico' }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 480, o.escala);
  },
  chest_broken: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'quebra', alvoId: e.alvoId, material: 'madeira' }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 520, o.escala);
  },
  fortress_broken: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'quebra', alvoId: e.alvoId, material: 'pedra' }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 1000, o.escala);
  },
  revived: (e, acc, o) => {
    agendar(acc, 200, { tipo: 'reerguer', alvoId: e.alvoId, vida: e.vida }, o.escala);
    agendar(acc, 200, { tipo: 'texto', alvoId: e.alvoId, chave: 'combat.revived', args: [], estilo: 'reergue' }, o.escala);
    agendar(acc, 200, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 1200, o.escala);
  },
  phase_change: (e, acc, o) => {
    agendar(acc, 200, { tipo: 'fase', alvoId: e.alvoId, vida: e.vida }, o.escala);
    agendar(acc, 200, { tipo: 'texto', alvoId: e.alvoId, chave: 'combat.phase', args: [e.fase], estilo: 'fase' }, o.escala);
    agendar(acc, 200, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 1700, o.escala);
  },
  heal: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'cura', alvoId: e.alvoId, quantidade: e.quantidade, restante: e.restante, maximo: e.maximo }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 480, o.escala);
  },
  mana_restored: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'mana', alvoId: e.alvoId, quantidade: e.quantidade, restante: e.restante, maximo: e.maximo }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 420, o.escala);
  },
  fortified: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'fortificar', alvoId: e.alvoId, bonus: e.bonusAtaque }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 380, o.escala);
  },
  resource_changed: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'recurso', atorId: e.atorId, recurso: e.recurso, restante: e.restante, maximo: e.maximo }, o.escala);
  },
  item_used: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'item', atorId: e.atorId, alvoId: e.alvoId, catalogoId: e.catalogoId }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 420, o.escala);
  },
  coordinated_assault: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'grito', chave: 'combat.assault' }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 700, o.escala);
  },
  loot_collected: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'espolio', catalogoIds: e.catalogoIds }, o.escala);
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 600, o.escala);
  },
  weapon_dropped: (e, acc, o) => {
    agendar(acc, 0, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 150, o.escala);
  },
  no_mana: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  no_fury: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  no_arrows: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  status: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  weapon_equipped: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  armor_equipped: (e, acc, o) => agendar(acc, 0, { tipo: 'log', evento: e }, o.escala),
  battle_won: (e, acc, o) => {
    agendar(acc, 250, { tipo: 'fim', vitoria: true }, o.escala);
    agendar(acc, 250, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 900, o.escala);
  },
  battle_lost: (e, acc, o) => {
    agendar(acc, 250, { tipo: 'fim', vitoria: false }, o.escala);
    agendar(acc, 250, { tipo: 'log', evento: e }, o.escala);
    avancar(acc, 900, o.escala);
  },
};

// #region lab:diretor
export function construirRoteiro(eventos: readonly CombatEvent[], opcoes: OpcoesDoRoteiro): Roteiro {
  const acc: Acumulador = { cues: [], cursor: 0 };
  eventos.forEach((evento, indice) => {
    // Uma pausa curta separa ações diferentes (antes de cada novo turno).
    if (evento.key === 'turn_start' && indice > 0) avancar(acc, 260, opcoes.escala);
    (CONSTRUTORES[evento.key] as Construtor<CombatEvent>)(evento, acc, opcoes);
  });
  const cues = [...acc.cues].sort((a, b) => a.t - b.t);
  return { cues, duracao: Math.round(acc.cursor) };
}
// #endregion
