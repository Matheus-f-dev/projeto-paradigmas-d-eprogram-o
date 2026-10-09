import type {
  ComportamentoDeCombate,
  DecisaoDeCombate,
  GeradorAleatorio,
  SituacaoDeCombate,
} from '../contracts/ComportamentoDeCombate';
import type { Destrutivel } from '../contracts/Destrutivel';

/** Seleciona, com reduce, o oponente com menos vida (o primeiro em caso de empate). */
export function oponenteMaisFraco(oponentes: readonly Destrutivel[]): Destrutivel | null {
  const vivos = oponentes.filter((oponente) => !oponente.estaDestruido());
  if (vivos.length === 0) return null;
  return vivos.reduce((menor, atual) => (atual.getVida() < menor.getVida() ? atual : menor));
}

/** Ataca sempre o oponente mais ferido — o comportamento do Goblin "oportunista". */
export class AtacarMaisFraco implements ComportamentoDeCombate {
  decidir(situacao: SituacaoDeCombate): DecisaoDeCombate | null {
    const alvo = oponenteMaisFraco(situacao.oponentes);
    return alvo ? { tipo: 'atacar', alvo } : null;
  }
}

/** Escolhe um oponente vivo ao acaso, com gerador injetável (DIP) para testes determinísticos. */
export class AtacarAleatorio implements ComportamentoDeCombate {
  constructor(private readonly aleatorio: GeradorAleatorio) {}

  decidir(situacao: SituacaoDeCombate): DecisaoDeCombate | null {
    const vivos = situacao.oponentes.filter((oponente) => !oponente.estaDestruido());
    if (vivos.length === 0) return null;
    const indice = Math.min(vivos.length - 1, Math.floor(this.aleatorio.proximo() * vivos.length));
    return { tipo: 'atacar', alvo: vivos[indice]! };
  }
}

/** Usa a habilidade especial sempre que disponível; caso contrário, ataca o mais fraco. */
export class Implacavel implements ComportamentoDeCombate {
  decidir(situacao: SituacaoDeCombate): DecisaoDeCombate | null {
    const alvo = oponenteMaisFraco(situacao.oponentes);
    if (!alvo) return null;
    return { tipo: situacao.podeUsarHabilidade ? 'habilidade' : 'atacar', alvo };
  }
}

export const ALEATORIO_PADRAO: GeradorAleatorio = { proximo: () => Math.random() };

/** Gerador pseudoaleatório com semente (mulberry32), usado nos testes. */
export function geradorComSemente(semente: number): GeradorAleatorio {
  let estado = semente >>> 0;
  return {
    proximo() {
      estado = (estado + 0x6d2b79f5) >>> 0;
      let t = estado;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
