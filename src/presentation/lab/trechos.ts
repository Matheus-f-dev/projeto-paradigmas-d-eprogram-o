import DIAGRAMA_UML from '../../../docs/DIAGRAMA_UML.md?raw';
import { extrairBlocosMermaid, extrairRegiao } from './extrairRegiao';

/**
 * O próprio código-fonte do jogo, empacotado como texto pelo Vite. Assim o
 * Laboratório mostra exatamente o que está implementado, sem cópias manuais.
 */
const FONTES = import.meta.glob(['/src/**/*.ts', '!/src/**/*.d.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function obterTrecho(arquivo: string, regiao: string): string | null {
  const fonte = FONTES[`/${arquivo}`];
  return fonte ? extrairRegiao(fonte, regiao) : null;
}

export function obterBlocosDoDiagrama(): string[] {
  return extrairBlocosMermaid(DIAGRAMA_UML);
}
