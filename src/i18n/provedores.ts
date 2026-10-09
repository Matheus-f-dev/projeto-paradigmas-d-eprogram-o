import { EN } from './dicionarios/en';
import { PT } from './dicionarios/pt';
import { ZH } from './dicionarios/zh';
import { MapBasedMessageProvider, type Idioma, type MessageProvider } from './MessageProvider';

// #region lab:provedores
/** Suporte a Português (idioma padrão e reserva final). */
export class PortugueseMessageProvider extends MapBasedMessageProvider {
  constructor() {
    super('pt', PT);
  }
}

/** Suporte a Inglês, com reserva em português. */
export class EnglishMessageProvider extends MapBasedMessageProvider {
  constructor() {
    super('en', EN, new PortugueseMessageProvider());
  }
}

/** Suporte a Mandarim (Chinês Simplificado), com reserva em inglês. */
export class ChineseMessageProvider extends MapBasedMessageProvider {
  constructor() {
    super('zh', ZH, new EnglishMessageProvider());
  }
}
// #endregion

const FABRICAS: Readonly<Record<Idioma, () => MessageProvider>> = {
  pt: () => new PortugueseMessageProvider(),
  en: () => new EnglishMessageProvider(),
  zh: () => new ChineseMessageProvider(),
};

export function criarMessageProvider(idioma: Idioma): MessageProvider {
  return FABRICAS[idioma]();
}
