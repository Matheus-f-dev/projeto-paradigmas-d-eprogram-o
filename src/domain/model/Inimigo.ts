import { AFINIDADE_NEUTRA, type AvaliadorDeAfinidade } from '../contracts/AvaliadorDeAfinidade';
import type { ComportamentoDeCombate } from '../contracts/ComportamentoDeCombate';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Elemento } from '../events/CombatEvent';
import { aplicarMultiplicador } from '../rules/calculos';
import { AtacarMaisFraco } from '../rules/comportamentos';
import { Personagem, type OpcoesDePersonagem } from './Personagem';

export interface OpcoesDeInimigo extends OpcoesDePersonagem {
  /** Tipo de criatura consultado na base de conhecimento ("goblin", "demogorgon"...). */
  readonly tipoCriatura?: string;
  readonly afinidades?: AvaliadorDeAfinidade;
  readonly comportamento?: ComportamentoDeCombate;
}

// #region lab:inimigo
/**
 * Inimigo: "age como um adversário comum enfrentando os heróis". Não
 * implementa ComHabilidadeEspecial (ISP) e mesmo assim pode substituir
 * Personagem em qualquer contexto (LSP) — inclusive lutando ao lado dos
 * heróis, como o monstro domado do exemplo do PDF.
 */
export class Inimigo extends Personagem {
  readonly classe: string = 'inimigo';
  readonly tipoCriatura: string;
  private readonly afinidades: AvaliadorDeAfinidade;
  private readonly comportamento: ComportamentoDeCombate;

  constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDeInimigo = {}) {
    super(nome, vida, ataque, opcoes);
    this.tipoCriatura = opcoes.tipoCriatura ?? 'criatura';
    this.afinidades = opcoes.afinidades ?? AFINIDADE_NEUTRA;
    this.comportamento = opcoes.comportamento ?? new AtacarMaisFraco();
  }

  getComportamento(): ComportamentoDeCombate {
    return this.comportamento;
  }

  /** Fraquezas e resistências vêm da base de conhecimento (paradigma lógico). */
  protected override calcularDanoRecebido(valor: number, elemento: Elemento, notifier: CombatNotifier): number {
    const multiplicador = this.afinidades.inferirMultiplicadorDano(elemento, this.tipoCriatura);
    if (multiplicador !== 1) {
      notifier.notify({ key: 'weakness', alvoId: this.id, alvo: this.getNome(), elemento, multiplicador });
    }
    return super.calcularDanoRecebido(aplicarMultiplicador(valor, multiplicador), elemento, notifier);
  }
}
// #endregion
