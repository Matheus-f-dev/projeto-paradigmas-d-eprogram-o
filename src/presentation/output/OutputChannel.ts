import type { CombatNotifier } from '../../domain/contracts/CombatNotifier';
import type { CombatEvent } from '../../domain/events/CombatEvent';
import { formatarEvento, type ResolvedorDeNome } from '../../i18n/formatarEvento';
import type { MessageProvider } from '../../i18n/MessageProvider';

// #region lab:output-channel
/** Destino das mensagens (PDF — "CAMADA DE SAÍDA / APRESENTAÇÃO"). */
export interface OutputChannel {
  print(message: string): void;
}

export class ConsoleOutputChannel implements OutputChannel {
  print(message: string): void {
    console.info(message);
  }
}

/** Implementação alternativa para GUI ou testes: guarda as linhas em memória. */
export class LogInMemoryOutputChannel implements OutputChannel {
  private readonly linhas: string[] = [];

  print(message: string): void {
    this.linhas.push(message);
  }

  getLog(): string {
    return this.linhas.join('\n');
  }

  getLinhas(): readonly string[] {
    return this.linhas;
  }
}

/**
 * O CombatNotifier do PDF: compõe um OutputChannel e um MessageProvider.
 * O domínio emite eventos; esta classe os traduz e os envia ao canal.
 */
export class TextCombatNotifier implements CombatNotifier {
  constructor(
    private readonly output: OutputChannel,
    private readonly messages: MessageProvider,
    private readonly nomes?: ResolvedorDeNome,
  ) {}

  notify(evento: CombatEvent): void {
    const mensagem = formatarEvento(evento, this.messages, this.nomes);
    if (mensagem) this.output.print(mensagem);
  }
}
// #endregion
