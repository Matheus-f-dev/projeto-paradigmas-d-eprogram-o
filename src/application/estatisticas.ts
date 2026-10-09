import { ehEventoDeDano, type CombatEvent } from '../domain/events/CombatEvent';

export interface EstatisticasDaBatalha {
  readonly danoCausado: number;
  readonly danoRecebido: number;
  readonly maiorGolpe: { readonly valor: number; readonly atorId: string | null };
  readonly curaTotal: number;
  readonly habilidadesUsadas: number;
  readonly inimigosDerrotados: number;
  readonly membrosDecepados: number;
  readonly itensUsados: number;
  readonly rodadas: number;
  readonly espolios: readonly string[];
}

const ESTATISTICAS_VAZIAS: EstatisticasDaBatalha = {
  danoCausado: 0,
  danoRecebido: 0,
  maiorGolpe: { valor: 0, atorId: null },
  curaTotal: 0,
  habilidadesUsadas: 0,
  inimigosDerrotados: 0,
  membrosDecepados: 0,
  itensUsados: 0,
  rodadas: 0,
  espolios: [],
};

const CHAVES_DE_HABILIDADE = new Set(['brutal_strike', 'fireball', 'piercing_arrow']);
const CHAVES_DE_ACAO = new Set(['attack', 'brutal_strike', 'fireball', 'piercing_arrow', 'shadow_lunge']);

interface Acumulador extends EstatisticasDaBatalha {
  readonly atorAtual: string | null;
}

// #region lab:reduce
/**
 * Agregação funcional dos eventos da batalha com reduce. Cada passo devolve
 * um novo acumulador (sem mutação). `aliados` são os ids do lado do jogador.
 */
export function calcularEstatisticas(eventos: readonly CombatEvent[], aliados: ReadonlySet<string>): EstatisticasDaBatalha {
  const ehAliado = (id: string) => aliados.has(id) || aliados.has(id.split(':')[0]!);

  const final = eventos.reduce<Acumulador>(
    (acc, evento) => {
      if ('atorId' in evento && CHAVES_DE_ACAO.has(evento.key)) {
        return {
          ...acc,
          atorAtual: evento.atorId,
          habilidadesUsadas: acc.habilidadesUsadas + (CHAVES_DE_HABILIDADE.has(evento.key) ? 1 : 0),
        };
      }
      if (ehEventoDeDano(evento)) {
        if (ehAliado(evento.alvoId)) return { ...acc, danoRecebido: acc.danoRecebido + evento.valor };
        const golpeDoJogador = acc.atorAtual !== null && ehAliado(acc.atorAtual);
        if (!golpeDoJogador) return acc;
        const maior = evento.valor > acc.maiorGolpe.valor ? { valor: evento.valor, atorId: acc.atorAtual } : acc.maiorGolpe;
        return { ...acc, danoCausado: acc.danoCausado + evento.valor, maiorGolpe: maior };
      }
      switch (evento.key) {
        case 'heal':
          return { ...acc, curaTotal: acc.curaTotal + evento.quantidade };
        case 'defeated':
          return ehAliado(evento.alvoId) ? acc : { ...acc, inimigosDerrotados: acc.inimigosDerrotados + 1 };
        case 'limb_severed':
          return { ...acc, membrosDecepados: acc.membrosDecepados + 1 };
        case 'item_used':
          return { ...acc, itensUsados: acc.itensUsados + 1 };
        case 'turn_start':
          return { ...acc, rodadas: Math.max(acc.rodadas, evento.rodada) };
        case 'loot_collected':
          return { ...acc, espolios: [...acc.espolios, ...evento.catalogoIds] };
        default:
          return acc;
      }
    },
    { ...ESTATISTICAS_VAZIAS, atorAtual: null },
  );

  const { atorAtual: _descartado, ...estatisticas } = final;
  return estatisticas;
}
// #endregion
