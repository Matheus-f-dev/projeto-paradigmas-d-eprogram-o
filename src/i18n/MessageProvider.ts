export type Idioma = 'pt' | 'en' | 'zh';

export const IDIOMAS: readonly Idioma[] = ['pt', 'en', 'zh'];

export type ArgumentoDeMensagem = string | number;

// #region lab:message-provider
/** Contrato de tradução (PDF — "CAMADA DE INTERNACIONALIZAÇÃO"). */
export interface MessageProvider {
  readonly idioma: Idioma;
  getMessage(key: string, ...args: ArgumentoDeMensagem[]): string;
  has(key: string): boolean;
}

/**
 * Implementação baseada em mapa, como a MapBasedMessageProvider do PDF.
 * Substitui {0}, {1}... pelos argumentos (equivalente ao MessageFormat do
 * Java) e, se a chave não existir neste idioma, consulta o idioma de
 * reserva; em último caso devolve a própria chave.
 */
export abstract class MapBasedMessageProvider implements MessageProvider {
  protected constructor(
    readonly idioma: Idioma,
    protected readonly messages: Readonly<Record<string, string>>,
    private readonly reserva?: MessageProvider,
  ) {}

  getMessage(key: string, ...args: ArgumentoDeMensagem[]): string {
    const template = this.messages[key];
    if (template === undefined) {
      return this.reserva ? this.reserva.getMessage(key, ...args) : key;
    }
    return template.replace(/\{(\d+)\}/g, (marcador, indice: string) => {
      const valor = args[Number(indice)];
      return valor === undefined ? marcador : String(valor);
    });
  }

  has(key: string): boolean {
    return key in this.messages || (this.reserva?.has(key) ?? false);
  }
}
// #endregion
