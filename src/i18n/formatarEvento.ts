import type { CombatEvent } from '../domain/events/CombatEvent';
import type { ArgumentoDeMensagem, MessageProvider } from './MessageProvider';

/** Resolve o nome exibido de uma entidade a partir do id (e do nome do domínio como reserva). */
export type ResolvedorDeNome = (id: string, nomeDoDominio: string) => string;

/** Resolvedor padrão: procura `name.<id>` no dicionário; senão usa o nome do domínio. */
export function resolvedorPadrao(messages: MessageProvider): ResolvedorDeNome {
  return (id, nomeDoDominio) => (messages.has(`name.${id}`) ? messages.getMessage(`name.${id}`) : nomeDoDominio);
}

type Formatador<E> = (evento: E, nome: ResolvedorDeNome, t: MessageProvider) => ArgumentoDeMensagem[] | null;
type TabelaDeFormatadores = { [K in CombatEvent['key']]: Formatador<Extract<CombatEvent, { key: K }>> };

const item = (t: MessageProvider, catalogoId: string) => t.getMessage(`item.${catalogoId}.name`);
const elemento = (t: MessageProvider, valor: string) => t.getMessage(`element.${valor}`);

/**
 * Argumentos posicionais de cada mensagem. A tabela tipada obriga que todo
 * evento tenha um formatador: ao criar um evento novo, o compilador aponta
 * a ausência aqui.
 */
const FORMATADORES: TabelaDeFormatadores = {
  attack: (e, n) => [n(e.atorId, e.ator), n(e.alvoId, e.alvo), e.dano],
  damage_received: (e, n) => [n(e.alvoId, e.alvo), e.valor, e.restante],
  defeated: (e, n) => [n(e.alvoId, e.alvo)],
  unconscious: (e, n) => [n(e.alvoId, e.alvo)],
  brutal_strike: (e, n) => [n(e.atorId, e.ator), n(e.alvoId, e.alvo)],
  fireball: (e, n) => [n(e.atorId, e.ator), n(e.alvoId, e.alvo)],
  piercing_arrow: (e, n) => [n(e.atorId, e.ator), n(e.alvoId, e.alvo)],
  shadow_lunge: (e, n) => [n(e.atorId, e.ator), n(e.alvoId, e.alvo)],
  no_mana: (e, n) => [n(e.atorId, e.ator)],
  no_fury: (e, n) => [n(e.atorId, e.ator)],
  no_arrows: (e, n) => [n(e.atorId, e.ator)],
  resource_changed: () => null, // refletido nas barras; não polui o registro
  weakness: (e, n, t) => [n(e.alvoId, e.alvo), elemento(t, e.elemento), e.multiplicador],
  heal: (e, n) => [n(e.alvoId, e.alvo), e.quantidade, e.restante],
  mana_restored: (e, n) => [n(e.alvoId, e.alvo), e.quantidade],
  fortified: (e, n) => [n(e.alvoId, e.alvo), e.bonusAtaque],
  weapon_equipped: (e, n, t) => [n(e.portadorId, e.portador), item(t, e.catalogoId), e.bonus],
  armor_equipped: (e, n, t) => [n(e.portadorId, e.portador), item(t, e.catalogoId), e.defesa],
  weapon_dropped: (e, n, t) => [n(e.portadorId, e.portador), item(t, e.catalogoId)],
  limb_severed: (e, n) => [n(e.membroId, e.membro), n(e.donoId, e.dono), e.penalidade],
  chest_damage: (e, n) => [n(e.alvoId, e.alvo), e.valor],
  chest_broken: (e, n) => [n(e.alvoId, e.alvo)],
  fortress_damage: (e, n) => [n(e.alvoId, e.alvo), e.valor],
  fortress_broken: (e, n) => [n(e.alvoId, e.alvo)],
  revived: (e, n) => [n(e.alvoId, e.alvo), e.vida],
  phase_change: (e, n) => [n(e.alvoId, e.alvo), e.fase],
  item_used: (e, n, t) => [n(e.atorId, e.ator), item(t, e.catalogoId), n(e.alvoId, e.alvo)],
  loot_collected: (e, _n, t) => [e.catalogoIds.map((id) => item(t, id)).join(', ')],
  turn_start: (e, n) => [n(e.atorId, e.ator), e.rodada],
  coordinated_assault: (e, n) => [n(e.alvoId, e.alvo)],
  status: (e, n) => [n(e.alvoId, e.alvo), e.vida],
  battle_won: () => [],
  battle_lost: () => [],
};

// #region lab:formatar-evento
/** Converte um evento do domínio em texto no idioma do MessageProvider. */
export function formatarEvento(
  evento: CombatEvent,
  messages: MessageProvider,
  nome: ResolvedorDeNome = resolvedorPadrao(messages),
): string | null {
  const formatador = FORMATADORES[evento.key] as Formatador<CombatEvent>;
  const argumentos = formatador(evento, nome, messages);
  return argumentos === null ? null : messages.getMessage(`event.${evento.key}`, ...argumentos);
}
// #endregion
