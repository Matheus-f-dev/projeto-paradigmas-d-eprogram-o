/**
 * Eventos de combate emitidos pelo domínio.
 *
 * No PDF, o CombatNotifier recebe uma chave de mensagem ("attack",
 * "damage_received", "defeated"...) e argumentos posicionais. Aqui a mesma
 * ideia é tipada: cada evento carrega a chave do PDF em `key` e os dados
 * estruturados do que aconteceu. O domínio não sabe se o evento vai virar
 * texto em português, uma animação ou um efeito sonoro (SRP + DIP).
 */

export type Elemento = 'fisico' | 'fogo' | 'perfurante' | 'sombrio';

export type TipoDeRecurso = 'mana' | 'furia' | 'flechas';

interface EventoComAtorEAlvo {
  readonly atorId: string;
  readonly ator: string;
  readonly alvoId: string;
  readonly alvo: string;
}

interface EventoDeDano {
  readonly alvoId: string;
  readonly alvo: string;
  readonly valor: number;
  readonly restante: number;
  readonly maximo: number;
}

export type CombatEvent =
  | ({ readonly key: 'attack'; readonly dano: number } & EventoComAtorEAlvo)
  | ({ readonly key: 'damage_received'; readonly elemento: Elemento; readonly absorvido: number } & EventoDeDano)
  | { readonly key: 'defeated'; readonly alvoId: string; readonly alvo: string }
  | { readonly key: 'unconscious'; readonly alvoId: string; readonly alvo: string }
  | ({ readonly key: 'brutal_strike' } & EventoComAtorEAlvo)
  | ({ readonly key: 'fireball' } & EventoComAtorEAlvo)
  | ({ readonly key: 'piercing_arrow' } & EventoComAtorEAlvo)
  | ({ readonly key: 'shadow_lunge' } & EventoComAtorEAlvo)
  | { readonly key: 'no_mana'; readonly atorId: string; readonly ator: string }
  | { readonly key: 'no_fury'; readonly atorId: string; readonly ator: string }
  | { readonly key: 'no_arrows'; readonly atorId: string; readonly ator: string }
  | {
      readonly key: 'resource_changed';
      readonly atorId: string;
      readonly recurso: TipoDeRecurso;
      readonly delta: number;
      readonly restante: number;
      readonly maximo: number;
    }
  | {
      readonly key: 'weakness';
      readonly alvoId: string;
      readonly alvo: string;
      readonly elemento: Elemento;
      readonly multiplicador: number;
    }
  | {
      readonly key: 'heal';
      readonly alvoId: string;
      readonly alvo: string;
      readonly quantidade: number;
      readonly restante: number;
      readonly maximo: number;
    }
  | {
      readonly key: 'mana_restored';
      readonly alvoId: string;
      readonly alvo: string;
      readonly quantidade: number;
      readonly restante: number;
      readonly maximo: number;
    }
  | { readonly key: 'fortified'; readonly alvoId: string; readonly alvo: string; readonly bonusAtaque: number }
  | {
      readonly key: 'weapon_equipped';
      readonly portadorId: string;
      readonly portador: string;
      readonly itemId: string;
      readonly catalogoId: string;
      readonly bonus: number;
    }
  | {
      readonly key: 'armor_equipped';
      readonly portadorId: string;
      readonly portador: string;
      readonly itemId: string;
      readonly catalogoId: string;
      readonly defesa: number;
    }
  | {
      readonly key: 'weapon_dropped';
      readonly portadorId: string;
      readonly portador: string;
      readonly itemId: string;
      readonly catalogoId: string;
    }
  | {
      readonly key: 'limb_severed';
      readonly membroId: string;
      readonly membro: string;
      readonly donoId: string;
      readonly dono: string;
      readonly penalidade: number;
    }
  | ({ readonly key: 'chest_damage' } & EventoDeDano)
  | {
      readonly key: 'chest_broken';
      readonly alvoId: string;
      readonly alvo: string;
      readonly catalogoIds: readonly string[];
    }
  | ({ readonly key: 'fortress_damage'; readonly absorvido: number } & EventoDeDano)
  | { readonly key: 'fortress_broken'; readonly alvoId: string; readonly alvo: string }
  | { readonly key: 'revived'; readonly alvoId: string; readonly alvo: string; readonly vida: number }
  | {
      readonly key: 'phase_change';
      readonly alvoId: string;
      readonly alvo: string;
      readonly fase: number;
      readonly vida: number;
      readonly bonusAtaque: number;
    }
  | ({ readonly key: 'item_used'; readonly itemId: string; readonly catalogoId: string } & EventoComAtorEAlvo)
  | { readonly key: 'loot_collected'; readonly catalogoIds: readonly string[] }
  | { readonly key: 'turn_start'; readonly atorId: string; readonly ator: string; readonly rodada: number }
  | { readonly key: 'coordinated_assault'; readonly alvoId: string; readonly alvo: string }
  | { readonly key: 'status'; readonly alvoId: string; readonly alvo: string; readonly vida: number }
  | { readonly key: 'battle_won' }
  | { readonly key: 'battle_lost' };

export type ChaveDeEvento = CombatEvent['key'];

/** Seleciona o tipo de um evento específico pela chave. */
export type EventoDo<K extends ChaveDeEvento> = Extract<CombatEvent, { key: K }>;

const CHAVES_DE_DANO = new Set<ChaveDeEvento>(['damage_received', 'chest_damage', 'fortress_damage']);

/** Eventos que reduzem os pontos de um alvo destrutível (personagem, membro, baú ou fortaleza). */
export function ehEventoDeDano(
  evento: CombatEvent,
): evento is EventoDo<'damage_received'> | EventoDo<'chest_damage'> | EventoDo<'fortress_damage'> {
  return CHAVES_DE_DANO.has(evento.key);
}
