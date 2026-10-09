import type { Habilidade } from '../abilities/Habilidade';
import type { CombatNotifier } from './CombatNotifier';
import type { Destrutivel } from './Destrutivel';

// #region lab:com-habilidade-especial
/**
 * Contrato segregado (ISP): apenas quem domina técnicas especiais o assina.
 * Inimigo comum não é obrigado a implementar um método vazio, o que
 * preserva o LSP na hierarquia de Personagem.
 */
export interface ComHabilidadeEspecial {
  usarHabilidade(alvo: Destrutivel, notifier: CombatNotifier): boolean;
  podeUsarHabilidade(): boolean;
  getHabilidade(): Habilidade;
}

/**
 * Equivalente TypeScript do `p instanceof ComHabilidadeEspecial` do PDF.
 * Interfaces não existem em tempo de execução no TypeScript, então a
 * verificação é feita pela presença dos métodos do contrato.
 */
export function possuiHabilidadeEspecial(objeto: unknown): objeto is ComHabilidadeEspecial {
  if (typeof objeto !== 'object' || objeto === null) return false;
  const candidato = objeto as Partial<ComHabilidadeEspecial>;
  return (
    typeof candidato.usarHabilidade === 'function' &&
    typeof candidato.podeUsarHabilidade === 'function' &&
    typeof candidato.getHabilidade === 'function'
  );
}
// #endregion
