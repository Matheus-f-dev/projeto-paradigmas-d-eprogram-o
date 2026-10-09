import type { AvaliadorDeAfinidade } from '../contracts/AvaliadorDeAfinidade';

/**
 * PARADIGMA LÓGICO (PDF — ModuloLogico).
 *
 * Em vez de criar classes como InimigoVulneravelAFogo ou uma cadeia de
 * if/else, o jogo declara fatos e regras e delega a dedução a um pequeno
 * motor de consulta por casamento de padrões.
 */

// #region lab:logico
export interface Fato {
  readonly predicado: string;
  readonly arg1: string;
  readonly arg2: string;
}

export type Efeito = 'CRITICO' | 'RESISTENTE';

export interface RegraDeAfinidade {
  readonly condicao: Fato;
  readonly efeitoMultiplicador: Efeito;
}

const MULTIPLICADORES: Readonly<Record<Efeito, number>> = { CRITICO: 2.0, RESISTENTE: 0.5 };

const normalizar = (texto: string): string => texto.toLowerCase();

export class BaseDeConhecimento implements AvaliadorDeAfinidade {
  private readonly fatos = new Map<string, Fato>();
  private readonly regras: RegraDeAfinidade[] = [];

  declararFato(predicado: string, arg1: string, arg2: string): void {
    const fato = { predicado: normalizar(predicado), arg1: normalizar(arg1), arg2: normalizar(arg2) };
    this.fatos.set(`${fato.predicado}(${fato.arg1},${fato.arg2})`, fato);
  }

  declararRegra(condicao: Fato, efeito: Efeito): void {
    this.regras.push({
      condicao: { predicado: normalizar(condicao.predicado), arg1: normalizar(condicao.arg1), arg2: normalizar(condicao.arg2) },
      efeitoMultiplicador: efeito,
    });
  }

  /** Consulta: o fato existe na base? */
  consultar(predicado: string, arg1: string, arg2: string): boolean {
    return this.fatos.has(`${normalizar(predicado)}(${normalizar(arg1)},${normalizar(arg2)})`);
  }

  /** Unifica o padrão (predicado, elemento, tipo) com as regras declaradas. */
  inferirMultiplicadorDano(elementoAtaque: string, tipoInimigo: string): number {
    const elemento = normalizar(elementoAtaque);
    const tipo = normalizar(tipoInimigo);
    const regra = this.regras.find(
      ({ condicao }) =>
        (condicao.predicado === 'fraqueza' || condicao.predicado === 'resistencia') &&
        condicao.arg1 === elemento &&
        condicao.arg2 === tipo &&
        this.consultar(condicao.predicado, condicao.arg1, condicao.arg2),
    );
    return regra ? MULTIPLICADORES[regra.efeitoMultiplicador] : 1.0;
  }
}
// #endregion

/** Base de afinidades usada no jogo (inclui os fatos do exemplo do PDF). */
export function criarBaseDeAfinidadesDoJogo(): BaseDeConhecimento {
  const base = new BaseDeConhecimento();
  const declarar = (predicado: 'fraqueza' | 'resistencia', elemento: string, tipo: string, efeito: Efeito) => {
    base.declararFato(predicado, elemento, tipo);
    base.declararRegra({ predicado, arg1: elemento, arg2: tipo }, efeito);
  };
  declarar('fraqueza', 'fogo', 'demogorgon', 'CRITICO');
  declarar('fraqueza', 'gelo', 'golem', 'RESISTENTE'); // fato do PDF, mantido como exemplo
  declarar('fraqueza', 'fogo', 'morto-vivo', 'CRITICO');
  declarar('fraqueza', 'perfurante', 'goblin', 'CRITICO');
  declarar('resistencia', 'fisico', 'morto-vivo', 'RESISTENTE');
  declarar('resistencia', 'sombrio', 'demogorgon', 'RESISTENTE');
  return base;
}
