import type { CombatNotifier } from '../src/domain/contracts/CombatNotifier';
import type { ChaveDeEvento, CombatEvent, EventoDo } from '../src/domain/events/CombatEvent';

/** Notificador de teste: guarda os eventos para que as asserções inspecionem o que aconteceu. */
export class NotificadorDeTeste implements CombatNotifier {
  readonly eventos: CombatEvent[] = [];

  notify(evento: CombatEvent): void {
    this.eventos.push(evento);
  }

  chaves(): ChaveDeEvento[] {
    return this.eventos.map((evento) => evento.key);
  }

  doTipo<K extends ChaveDeEvento>(chave: K): EventoDo<K>[] {
    return this.eventos.filter((evento): evento is EventoDo<K> => evento.key === chave);
  }

  limpar(): void {
    this.eventos.length = 0;
  }
}
