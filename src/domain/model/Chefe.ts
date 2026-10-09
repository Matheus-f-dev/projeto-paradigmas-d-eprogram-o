import type { Habilidade } from '../abilities/Habilidade';
import { InvestidaSombria } from '../abilities/InvestidaSombria';
import type { ComHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { Implacavel } from '../rules/comportamentos';
import { MudancaDeFase } from '../rules/politicasDeDerrota';
import { Inimigo, type OpcoesDeInimigo } from './Inimigo';

export interface OpcoesDeChefe extends OpcoesDeInimigo {
  readonly vidaDaSegundaFase?: number;
  readonly bonusDaSegundaFase?: number;
}

/**
 * Chefe: um Inimigo que também domina uma técnica especial. Muda de fase
 * ao zerar a vida pela primeira vez (PDF: "um Boss que muda de fase aos 0 HP").
 */
export class Chefe extends Inimigo implements ComHabilidadeEspecial {
  /** Turnos necessários entre dois usos da Investida Sombria. */
  static readonly RECARGA = 2;

  override readonly classe = 'chefe';
  private readonly investida = new InvestidaSombria();
  private turnosDesdeEspecial = 0;

  constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDeChefe = {}) {
    super(nome, vida, ataque, {
      comportamento: new Implacavel(),
      politicaDeDerrota: new MudancaDeFase(opcoes.vidaDaSegundaFase ?? Math.ceil(vida * 0.6), opcoes.bonusDaSegundaFase ?? 4),
      ...opcoes,
    });
  }

  override iniciarTurno(): void {
    this.turnosDesdeEspecial += 1;
  }

  usarHabilidade(alvo: Destrutivel, notifier: CombatNotifier): boolean {
    this.garantirQuePodeAgir();
    if (!this.podeUsarHabilidade()) return false;
    this.turnosDesdeEspecial = 0;
    this.investida.executar(this, alvo, notifier);
    return true;
  }

  podeUsarHabilidade(): boolean {
    return !this.estaDestruido() && this.turnosDesdeEspecial > Chefe.RECARGA;
  }

  getHabilidade(): Habilidade {
    return this.investida;
  }
}
