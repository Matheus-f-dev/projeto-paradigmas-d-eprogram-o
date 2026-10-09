import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Elemento } from '../events/CombatEvent';
import { quantidadeValida } from '../rules/calculos';

export interface DefinicaoDeMembro {
  /** Identificador da parte do corpo ("braco", "perna"...). */
  readonly parte: string;
  readonly nome: string;
  readonly integridade: number;
  /** Quanto o ataque do dono diminui quando este membro é decepado. */
  readonly penalidadeDeAtaque: number;
}

// #region lab:membro
/**
 * A PARTE DA COMPOSIÇÃO (PDF — "A classe Membro").
 *
 * Um Membro só é criado dentro do construtor de Personagem e não pode ser
 * transferido para outro dono. Quando o Personagem é derrotado de forma
 * definitiva, ele encerra o ciclo de vida de todos os seus membros.
 */
export class Membro implements Destrutivel {
  readonly id: string;
  readonly parte: string;
  readonly donoId: string;
  private readonly nome: string;
  private readonly dono: string;
  private readonly integridadeMaxima: number;
  private integridade: number;
  private readonly penalidadeDeAtaque: number;

  /** @internal Use apenas a partir de Personagem (composição). */
  constructor(donoId: string, dono: string, definicao: DefinicaoDeMembro) {
    this.id = `${donoId}:${definicao.parte}`;
    this.parte = definicao.parte;
    this.donoId = donoId;
    this.dono = dono;
    this.nome = definicao.nome;
    this.integridadeMaxima = definicao.integridade;
    this.integridade = definicao.integridade;
    this.penalidadeDeAtaque = definicao.penalidadeDeAtaque;
  }

  receberDano(valor: number, notifier: CombatNotifier, elemento: Elemento = 'fisico'): void {
    if (this.estaDestruido()) return;
    const dano = quantidadeValida(valor);
    this.integridade = Math.max(0, this.integridade - dano);
    notifier.notify({
      key: 'damage_received',
      alvoId: this.id,
      alvo: this.nome,
      valor: dano,
      restante: this.integridade,
      maximo: this.integridadeMaxima,
      elemento,
      absorvido: 0,
    });
    if (this.estaDestruido()) {
      notifier.notify({
        key: 'limb_severed',
        membroId: this.id,
        membro: this.nome,
        donoId: this.donoId,
        dono: this.dono,
        penalidade: this.penalidadeDeAtaque,
      });
    }
  }

  estaDestruido(): boolean {
    return this.integridade === 0;
  }

  getNome(): string {
    return this.nome;
  }

  getVida(): number {
    return this.integridade;
  }

  getVidaMaxima(): number {
    return this.integridadeMaxima;
  }

  /** Penalidade aplicada ao dono somente enquanto o membro estiver destruído. */
  getPenalidadeAtiva(): number {
    return this.estaDestruido() ? this.penalidadeDeAtaque : 0;
  }

  /** @internal Fim do ciclo de vida, disparado pelo Personagem dono. */
  destruirJuntoComDono(): void {
    this.integridade = 0;
  }

  /** @internal Usado ao restaurar um jogo salvo. */
  restaurarIntegridade(integridade: number): void {
    this.integridade = Math.min(this.integridadeMaxima, quantidadeValida(integridade));
  }
}
// #endregion

export const MEMBROS_PADRAO: readonly Omit<DefinicaoDeMembro, 'nome'>[] = [
  { parte: 'braco', integridade: 12, penalidadeDeAtaque: 3 },
  { parte: 'perna', integridade: 18, penalidadeDeAtaque: 1 },
];

const NOME_DA_PARTE: Readonly<Record<string, string>> = { braco: 'Braço', perna: 'Perna' };

/** Gera as definições padrão de membros do PDF ("Braço de X", "Perna de X"). */
export function membrosPadrao(nomeDoDono: string): DefinicaoDeMembro[] {
  return MEMBROS_PADRAO.map((membro) => ({
    ...membro,
    nome: `${NOME_DA_PARTE[membro.parte] ?? membro.parte} de ${nomeDoDono}`,
  }));
}
