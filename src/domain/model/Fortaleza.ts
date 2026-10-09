import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { calcularDanoAposDefesa } from '../rules/calculos';

// #region lab:fortaleza
/**
 * Fortaleza do PDF: reduz o dano sofrido "devido à espessura da muralha"
 * (`Math.max(1, valor - 3)`). Também é um Destrutivel independente de Personagem.
 */
export class Fortaleza implements Destrutivel {
  static readonly ESPESSURA_DA_MURALHA = 3;
  private blindagem: number;
  private readonly blindagemMaxima: number;

  constructor(
    readonly id: string,
    private readonly nome: string,
    blindagem: number,
  ) {
    this.blindagem = blindagem;
    this.blindagemMaxima = blindagem;
  }

  receberDano(valor: number, notifier: CombatNotifier): void {
    if (this.estaDestruido()) return;
    const danoEfetivo = calcularDanoAposDefesa(valor, Fortaleza.ESPESSURA_DA_MURALHA);
    this.blindagem = Math.max(0, this.blindagem - danoEfetivo);
    notifier.notify({
      key: 'fortress_damage',
      alvoId: this.id,
      alvo: this.nome,
      valor: danoEfetivo,
      restante: this.blindagem,
      maximo: this.blindagemMaxima,
      absorvido: Math.max(0, Math.round(valor) - danoEfetivo),
    });
    if (this.estaDestruido()) {
      notifier.notify({ key: 'fortress_broken', alvoId: this.id, alvo: this.nome });
    }
  }
  // #endregion

  estaDestruido(): boolean {
    return this.blindagem === 0;
  }

  getNome(): string {
    return this.nome;
  }

  getVida(): number {
    return this.blindagem;
  }

  getVidaMaxima(): number {
    return this.blindagemMaxima;
  }
}
