import { BolaDeFogo } from '../abilities/BolaDeFogo';
import type { Habilidade } from '../abilities/Habilidade';
import type { ComHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { ComRecurso, PossuiMana, Recurso } from '../contracts/ComRecurso';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { AcaoInvalidaError } from '../combat/erros';
import { limitar, quantidadeValida } from '../rules/calculos';
import { Personagem, type OpcoesDePersonagem } from './Personagem';

/** Fração da mana máxima recuperada ao descansar. */
const FRACAO_DE_MANA_NO_DESCANSO = 0.5;

// #region lab:mago
/**
 * Mago: "além dos atributos comuns também possui uma reserva de mana".
 * A Bola de Fogo gasta 5 pontos de mana; sem mana suficiente, o PDF
 * apenas avisa "não tem mana!" — aqui o aviso vira o evento `no_mana`.
 */
export class Mago extends Personagem implements ComHabilidadeEspecial, ComRecurso, PossuiMana {
  readonly classe = 'mago';
  private readonly bolaDeFogo = new BolaDeFogo();
  private readonly manaMaxima: number;
  private mana: number;

  constructor(nome: string, vida: number, ataque: number, mana: number, opcoes: OpcoesDePersonagem = {}) {
    super(nome, vida, ataque, { tiposDeArma: ['cajado', 'lamina'], ...opcoes });
    if (!Number.isInteger(mana) || mana < 0) throw new RangeError('A mana deve ser um inteiro não negativo.');
    this.manaMaxima = mana;
    this.mana = mana;
  }

  usarHabilidade(alvo: Destrutivel, notifier: CombatNotifier): boolean {
    this.garantirQuePodeAgir();
    if (this.mana >= this.bolaDeFogo.custo) {
      this.mana -= this.bolaDeFogo.custo;
      notifier.notify({
        key: 'resource_changed',
        atorId: this.id,
        recurso: 'mana',
        delta: -this.bolaDeFogo.custo,
        restante: this.mana,
        maximo: this.manaMaxima,
      });
      this.bolaDeFogo.executar(this, alvo, notifier);
      return true;
    }
    notifier.notify({ key: 'no_mana', atorId: this.id, ator: this.getNome() });
    return false;
  }

  podeUsarHabilidade(): boolean {
    return !this.estaDestruido() && this.mana >= this.bolaDeFogo.custo;
  }
  // #endregion

  getHabilidade(): Habilidade {
    return this.bolaDeFogo;
  }

  getMana(): number {
    return this.mana;
  }

  getManaMaxima(): number {
    return this.manaMaxima;
  }

  getRecurso(): Recurso {
    return { tipo: 'mana', atual: this.mana, maximo: this.manaMaxima };
  }

  restaurarMana(quantidade: number, notifier: CombatNotifier): number {
    if (this.estaDestruido()) throw new AcaoInvalidaError('error.characterDefeated');
    const antes = this.mana;
    this.mana = limitar(this.mana + quantidadeValida(quantidade), this.manaMaxima);
    const recuperada = this.mana - antes;
    notifier.notify({
      key: 'mana_restored',
      alvoId: this.id,
      alvo: this.getNome(),
      quantidade: recuperada,
      restante: this.mana,
      maximo: this.manaMaxima,
    });
    return recuperada;
  }

  override descansar(): void {
    super.descansar();
    this.mana = limitar(this.mana + Math.ceil(this.manaMaxima * FRACAO_DE_MANA_NO_DESCANSO), this.manaMaxima);
  }

  protected override exportarEstadoExtra(): Record<string, number> {
    return { mana: this.mana };
  }

  protected override importarEstadoExtra(extra: Readonly<Record<string, number>>): void {
    if (extra.mana !== undefined) this.mana = limitar(Math.round(extra.mana), this.manaMaxima);
  }
}
