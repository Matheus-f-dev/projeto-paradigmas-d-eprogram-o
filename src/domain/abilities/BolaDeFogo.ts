import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Atacante, Habilidade } from './Habilidade';

// #region lab:bola-de-fogo
/** Bola de Fogo do Mago: `dano = ataque + 10` e custo de 5 de mana (PDF). */
export class BolaDeFogo implements Habilidade {
  static readonly BONUS = 10;
  readonly id = 'bola-de-fogo';
  readonly elemento = 'fogo' as const;
  readonly recurso = 'mana' as const;
  readonly custo = 5;

  calcularDano(ataqueDoUsuario: number): number {
    return ataqueDoUsuario + BolaDeFogo.BONUS;
  }

  executar(usuario: Atacante, alvo: Destrutivel, notifier: CombatNotifier): void {
    notifier.notify({ key: 'fireball', atorId: usuario.id, ator: usuario.getNome(), alvoId: alvo.id, alvo: alvo.getNome() });
    alvo.receberDano(this.calcularDano(usuario.getAtaque()), notifier, this.elemento);
  }
}
// #endregion
