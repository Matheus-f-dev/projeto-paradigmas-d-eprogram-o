import type { Destrutivel } from '../contracts/Destrutivel';

export interface CampoDeBatalha {
  readonly inimigos: readonly Destrutivel[];
  readonly cenario: readonly Destrutivel[];
}

/** Estratégia que decide quando a batalha está vencida (OCP: um estágio, uma regra). */
export interface CondicaoDeVitoria {
  /** Chave de tradução que descreve o objetivo para o jogador. */
  readonly chave: string;
  foiAtendida(campo: CampoDeBatalha): boolean;
}

export class DerrotarTodosOsInimigos implements CondicaoDeVitoria {
  readonly chave = 'objective.defeatAll';

  foiAtendida({ inimigos }: CampoDeBatalha): boolean {
    return inimigos.every((inimigo) => inimigo.estaDestruido());
  }
}

/** Derrotar todos os inimigos e também destruir um alvo do cenário (ex.: o portão). */
export class DerrotarInimigosEDestruir implements CondicaoDeVitoria {
  readonly chave = 'objective.defeatAllAndDestroy';
  private readonly todosOsInimigos = new DerrotarTodosOsInimigos();

  constructor(private readonly alvoId: string) {}

  foiAtendida(campo: CampoDeBatalha): boolean {
    const alvo = campo.cenario.find((destrutivel) => destrutivel.id === this.alvoId);
    return this.todosOsInimigos.foiAtendida(campo) && (alvo?.estaDestruido() ?? true);
  }
}
