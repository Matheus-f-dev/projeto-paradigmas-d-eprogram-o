import type { CombatEvent } from '../domain/events/CombatEvent';
import type { CombatNotifier } from '../domain/contracts/CombatNotifier';
import type { EventBus } from '../events/EventBus';

/** Eventos publicados pela camada de aplicação no barramento. */
export interface EventosDoJogo {
  combate: CombatEvent;
  'jogo:salvo': { readonly salvoEm: string };
  'jogo:equipamento': { readonly tipo: 'equipado' | 'guardado' | 'transferido' | 'usado'; readonly personagemId: string; readonly catalogoId: string };
}

/**
 * Notificador da aplicação: registra os eventos de uma ação (para devolvê-los
 * como resultado estruturado) e os publica no barramento.
 */
export class ColetorDeEventos implements CombatNotifier {
  readonly eventos: CombatEvent[] = [];

  constructor(private readonly barramento?: EventBus<EventosDoJogo>) {}

  notify(evento: CombatEvent): void {
    this.eventos.push(evento);
    this.barramento?.emit('combate', evento);
  }
}

/** Notificador que descarta eventos (preparação de cenários). */
export const NOTIFICADOR_SILENCIOSO: CombatNotifier = { notify: () => undefined };
