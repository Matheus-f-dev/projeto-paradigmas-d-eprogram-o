import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { AlvoDaPolitica, DesfechoDaDerrota, PoliticaDeDerrota } from '../contracts/PoliticaDeDerrota';

// #region lab:politicas
/** Comportamento original do PDF: vida zerada → "foi derrotado!". */
export class DerrotaDefinitiva implements PoliticaDeDerrota {
  aoZerarVida(alvo: AlvoDaPolitica, notifier: CombatNotifier): DesfechoDaDerrota {
    notifier.notify({ key: 'defeated', alvoId: alvo.id, alvo: alvo.getNome() });
    return 'definitiva';
  }
}

/**
 * PDF: "o personagem só entra em coma por um tempo, podendo ser curado por
 * um de seus companheiros". Usada pelos heróis: caem inconscientes e são
 * reanimados no acampamento.
 */
export class Inconsciencia implements PoliticaDeDerrota {
  aoZerarVida(alvo: AlvoDaPolitica, notifier: CombatNotifier): DesfechoDaDerrota {
    notifier.notify({ key: 'unconscious', alvoId: alvo.id, alvo: alvo.getNome() });
    return 'inconsciente';
  }
}

/** PDF: "um Zumbi que não morre na primeira vez que a vida zera". */
export class ReerguerUmaVez implements PoliticaDeDerrota {
  private jaSeReergueu = false;

  constructor(private readonly fracaoDeVida: number) {}

  aoZerarVida(alvo: AlvoDaPolitica, notifier: CombatNotifier): DesfechoDaDerrota {
    if (this.jaSeReergueu) {
      notifier.notify({ key: 'defeated', alvoId: alvo.id, alvo: alvo.getNome() });
      return 'definitiva';
    }
    this.jaSeReergueu = true;
    const vida = Math.max(1, Math.ceil(alvo.getVidaMaxima() * this.fracaoDeVida));
    alvo.restaurarVida(vida);
    notifier.notify({ key: 'revived', alvoId: alvo.id, alvo: alvo.getNome(), vida });
    return 'evitada';
  }
}

/** PDF: "um Boss que muda de fase aos 0 HP". */
export class MudancaDeFase implements PoliticaDeDerrota {
  private fase = 1;

  constructor(
    private readonly vidaDaSegundaFase: number,
    private readonly bonusDeAtaque: number,
  ) {}

  aoZerarVida(alvo: AlvoDaPolitica, notifier: CombatNotifier): DesfechoDaDerrota {
    if (this.fase > 1) {
      notifier.notify({ key: 'defeated', alvoId: alvo.id, alvo: alvo.getNome() });
      return 'definitiva';
    }
    this.fase = 2;
    alvo.restaurarVida(this.vidaDaSegundaFase);
    alvo.fortalecerAtaque(this.bonusDeAtaque);
    notifier.notify({
      key: 'phase_change',
      alvoId: alvo.id,
      alvo: alvo.getNome(),
      fase: this.fase,
      vida: this.vidaDaSegundaFase,
      bonusAtaque: this.bonusDeAtaque,
    });
    return 'evitada';
  }

  getFase(): number {
    return this.fase;
  }
}
// #endregion
