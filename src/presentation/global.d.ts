import type { PonteDoJogo } from '../shared/contratosDePersistencia';

declare global {
  interface Window {
    /** API mínima exposta pelo preload do Electron (ausente no navegador). */
    readonly rpg?: PonteDoJogo;
  }
}

export {};
