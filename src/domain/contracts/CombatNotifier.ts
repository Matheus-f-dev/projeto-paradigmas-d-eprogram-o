import type { CombatEvent } from '../events/CombatEvent';

/**
 * Contrato de notificação usado pelo domínio.
 *
 * No PDF ("TOTAL SOLID"), CombatNotifier é uma classe concreta que compõe
 * OutputChannel e MessageProvider. Aqui ele vira uma abstração: o domínio
 * depende apenas desta interface (DIP), e quem decide o destino do evento
 * (texto traduzido, log da batalha, animação, testes) é a camada externa.
 */
export interface CombatNotifier {
  notify(evento: CombatEvent): void;
}
