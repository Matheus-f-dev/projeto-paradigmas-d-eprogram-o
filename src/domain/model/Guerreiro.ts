import { GolpeBrutal } from '../abilities/GolpeBrutal';
import type { Habilidade } from '../abilities/Habilidade';
import type { ComHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { ComRecurso, Recurso } from '../contracts/ComRecurso';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { limitar } from '../rules/calculos';
import { Personagem, type OpcoesDePersonagem } from './Personagem';

// #region lab:guerreiro
/**
 * Guerreiro: "entra em combate armado e pode usar o Golpe Brutal para causar
 * dano extra". A análise do PDF observa que, no guerreiro, a habilidade
 * "consome energia de ataque" — representada aqui pela fúria, acumulada a
 * cada golpe desferido ou recebido.
 */
export class Guerreiro extends Personagem implements ComHabilidadeEspecial, ComRecurso {
  static readonly FURIA_MAXIMA = 10;
  static readonly FURIA_INICIAL = 5;
  static readonly FURIA_POR_ATAQUE = 3;
  static readonly FURIA_POR_DANO = 2;

  readonly classe = 'guerreiro';
  private readonly golpeBrutal = new GolpeBrutal();
  private furia = Guerreiro.FURIA_INICIAL;

  constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDePersonagem = {}) {
    super(nome, vida, ataque, { tiposDeArma: ['lamina'], ...opcoes });
  }

  usarHabilidade(alvo: Destrutivel, notifier: CombatNotifier): boolean {
    this.garantirQuePodeAgir();
    if (!this.podeUsarHabilidade()) {
      notifier.notify({ key: 'no_fury', atorId: this.id, ator: this.getNome() });
      return false;
    }
    this.alterarFuria(-this.golpeBrutal.custo, notifier);
    this.golpeBrutal.executar(this, alvo, notifier);
    return true;
  }

  podeUsarHabilidade(): boolean {
    return !this.estaDestruido() && this.furia >= this.golpeBrutal.custo;
  }
  // #endregion

  getHabilidade(): Habilidade {
    return this.golpeBrutal;
  }

  getRecurso(): Recurso {
    return { tipo: 'furia', atual: this.furia, maximo: Guerreiro.FURIA_MAXIMA };
  }

  protected override aoAtacar(notifier: CombatNotifier): void {
    this.alterarFuria(Guerreiro.FURIA_POR_ATAQUE, notifier);
  }

  protected override aoReceberDano(_dano: number, notifier: CombatNotifier): void {
    this.alterarFuria(Guerreiro.FURIA_POR_DANO, notifier);
  }

  override descansar(): void {
    super.descansar();
    this.furia = Guerreiro.FURIA_INICIAL;
  }

  private alterarFuria(delta: number, notifier: CombatNotifier): void {
    const anterior = this.furia;
    this.furia = limitar(this.furia + delta, Guerreiro.FURIA_MAXIMA);
    if (this.furia !== anterior) {
      notifier.notify({
        key: 'resource_changed',
        atorId: this.id,
        recurso: 'furia',
        delta: this.furia - anterior,
        restante: this.furia,
        maximo: Guerreiro.FURIA_MAXIMA,
      });
    }
  }

  protected override exportarEstadoExtra(): Record<string, number> {
    return { furia: this.furia };
  }

  protected override importarEstadoExtra(extra: Readonly<Record<string, number>>): void {
    if (extra.furia !== undefined) this.furia = limitar(Math.round(extra.furia), Guerreiro.FURIA_MAXIMA);
  }
}
