import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Atacante, Habilidade } from './Habilidade';

// #region lab:golpe-brutal
/** Golpe Brutal do Guerreiro: `dano = ataque + 5` (PDF), consumindo fúria. */
export class GolpeBrutal implements Habilidade {
  static readonly BONUS = 5;
  readonly id = 'golpe-brutal';
  readonly elemento = 'fisico' as const;
  readonly recurso = 'furia' as const;
  readonly custo = 5;

  calcularDano(ataqueDoUsuario: number): number {
    return ataqueDoUsuario + GolpeBrutal.BONUS;
  }

  executar(usuario: Atacante, alvo: Destrutivel, notifier: CombatNotifier): void {
    notifier.notify({ key: 'brutal_strike', atorId: usuario.id, ator: usuario.getNome(), alvoId: alvo.id, alvo: alvo.getNome() });
    alvo.receberDano(this.calcularDano(usuario.getAtaque()), notifier, this.elemento);
  }
}
// #endregion
