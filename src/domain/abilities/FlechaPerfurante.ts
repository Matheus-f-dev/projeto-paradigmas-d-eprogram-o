import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Atacante, Habilidade } from './Habilidade';

/**
 * Flecha Perfurante do Arqueiro: ignora armaduras (elemento "perfurante").
 * O Arqueiro é o exemplo de extensão citado no PDF para o OCP
 * ("Arqueiro implements ComHabilidadeEspecial").
 */
export class FlechaPerfurante implements Habilidade {
  static readonly BONUS = 4;
  readonly id = 'flecha-perfurante';
  readonly elemento = 'perfurante' as const;
  readonly recurso = 'flechas' as const;
  readonly custo = 1;

  calcularDano(ataqueDoUsuario: number): number {
    return ataqueDoUsuario + FlechaPerfurante.BONUS;
  }

  executar(usuario: Atacante, alvo: Destrutivel, notifier: CombatNotifier): void {
    notifier.notify({ key: 'piercing_arrow', atorId: usuario.id, ator: usuario.getNome(), alvoId: alvo.id, alvo: alvo.getNome() });
    alvo.receberDano(this.calcularDano(usuario.getAtaque()), notifier, this.elemento);
  }
}
