import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Atacante, Habilidade } from './Habilidade';

/** Ataque especial do chefe: `ataque + 6` de dano sombrio, limitado por recarga de turnos. */
export class InvestidaSombria implements Habilidade {
  static readonly BONUS = 6;
  readonly id = 'investida-sombria';
  readonly elemento = 'sombrio' as const;
  readonly recurso = null;
  readonly custo = 0;

  calcularDano(ataqueDoUsuario: number): number {
    return ataqueDoUsuario + InvestidaSombria.BONUS;
  }

  executar(usuario: Atacante, alvo: Destrutivel, notifier: CombatNotifier): void {
    notifier.notify({ key: 'shadow_lunge', atorId: usuario.id, ator: usuario.getNome(), alvoId: alvo.id, alvo: alvo.getNome() });
    alvo.receberDano(this.calcularDano(usuario.getAtaque()), notifier, this.elemento);
  }
}
