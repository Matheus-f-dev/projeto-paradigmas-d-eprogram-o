import { possuiMana } from '../contracts/ComRecurso';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Personagem } from '../model/Personagem';
import { curarEFortificar } from '../paradigms/ModuloFuncional';
import type { ItemBase } from './Item';

export interface ContextoDeUso {
  readonly alvo: Personagem;
  readonly grupo: readonly Personagem[];
  readonly notifier: CombatNotifier;
}

/** Estratégia de efeito de um consumível (OCP: novos efeitos são novas classes). */
export interface EfeitoDeConsumivel {
  readonly alcance: 'aliado' | 'grupo';
  podeAplicar(alvo: Personagem, grupo: readonly Personagem[]): boolean;
  aplicar(contexto: ContextoDeUso): void;
}

export class CuraDeVida implements EfeitoDeConsumivel {
  readonly alcance = 'aliado' as const;
  constructor(readonly quantidade: number) {}

  podeAplicar(alvo: Personagem): boolean {
    return !alvo.estaDestruido() && alvo.getVida() < alvo.getVidaMaxima();
  }

  aplicar({ alvo, notifier }: ContextoDeUso): void {
    alvo.receberCura(this.quantidade, notifier);
  }
}

/** Só pode ser usada em quem implementa PossuiMana (ISP). */
export class RestauracaoDeMana implements EfeitoDeConsumivel {
  readonly alcance = 'aliado' as const;
  constructor(readonly quantidade: number) {}

  podeAplicar(alvo: Personagem): boolean {
    return !alvo.estaDestruido() && possuiMana(alvo) && alvo.getMana() < alvo.getManaMaxima();
  }

  aplicar({ alvo, notifier }: ContextoDeUso): void {
    if (possuiMana(alvo)) alvo.restaurarMana(this.quantidade, notifier);
  }
}

// #region lab:bencao
/**
 * Bênção do Santuário: usa o pipeline funcional curarEFortificar sobre as
 * fichas imutáveis do grupo e aplica o resultado pelas operações públicas
 * das entidades (sem duplicar a regra de cura).
 */
export class BencaoDoSantuario implements EfeitoDeConsumivel {
  readonly alcance = 'grupo' as const;
  constructor(
    readonly corteDeVida: number,
    readonly multiplicador: number,
    readonly bonusDeAtaque: number,
  ) {}

  podeAplicar(_alvo: Personagem, grupo: readonly Personagem[]): boolean {
    return this.calcular(grupo).length > 0;
  }

  aplicar({ grupo, notifier }: ContextoDeUso): void {
    for (const ficha of this.calcular(grupo)) {
      const personagem = grupo.find((membro) => membro.id === ficha.id);
      if (!personagem) continue;
      // As diferenças entre a ficha nova e a entidade atual viram operações do domínio.
      personagem.receberCura(ficha.vida - personagem.getVida(), notifier);
      personagem.fortificar(ficha.bonusTemporario - personagem.getBonusTemporario(), notifier);
    }
  }

  private calcular(grupo: readonly Personagem[]) {
    const fichas = grupo.map((personagem) => personagem.getFicha());
    return curarEFortificar(fichas, this.corteDeVida, this.multiplicador, this.bonusDeAtaque);
  }
}
// #endregion

export class Consumivel implements ItemBase {
  readonly categoria = 'consumivel' as const;

  constructor(
    readonly id: string,
    readonly catalogoId: string,
    private readonly nome: string,
    readonly efeito: EfeitoDeConsumivel,
  ) {}

  getNome(): string {
    return this.nome;
  }
}
