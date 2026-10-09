import type { Batalha, EstadoDaBatalha } from '../domain/combat/Batalha';
import { possuiHabilidadeEspecial } from '../domain/contracts/ComHabilidadeEspecial';
import { possuiRecurso, type Recurso } from '../domain/contracts/ComRecurso';
import type { Destrutivel } from '../domain/contracts/Destrutivel';
import type { CombatEvent, Elemento, TipoDeRecurso } from '../domain/events/CombatEvent';
import type { Inventario } from '../domain/equipment/Inventario';
import type { Item } from '../domain/equipment/Item';
import { Bau } from '../domain/model/Bau';
import { Fortaleza } from '../domain/model/Fortaleza';
import { Inimigo } from '../domain/model/Inimigo';
import type { Personagem } from '../domain/model/Personagem';
import type { TipoDeArma } from '../domain/equipment/Arma';

/**
 * Fotografias somente-leitura do estado do jogo. A interface só lê estes
 * dados; qualquer alteração passa pelos casos de uso do JogoService.
 */

export interface ItemSnapshot {
  readonly id: string;
  readonly catalogoId: string;
  readonly categoria: Item['categoria'];
  readonly nome: string;
  readonly bonusAtaque?: number;
  readonly defesa?: number;
  readonly tipoDeArma?: TipoDeArma;
  readonly alcance?: 'aliado' | 'grupo';
  /** Para consumíveis: ids dos aliados em que o efeito pode ser aplicado agora. */
  readonly alvosValidos?: readonly string[];
  /** Para armas: ids dos heróis que podem empunhá-la. */
  readonly portadoresPossiveis?: readonly string[];
}

export interface HabilidadeSnapshot {
  readonly id: string;
  readonly custo: number;
  readonly recurso: TipoDeRecurso | null;
  readonly elemento: Elemento;
  readonly dano: number;
}

export interface MembroSnapshot {
  readonly id: string;
  readonly parte: string;
  readonly nome: string;
  readonly vida: number;
  readonly vidaMaxima: number;
  readonly destruido: boolean;
}

export type LadoDoCombate = 'heroi' | 'aliado' | 'inimigo';

export interface CombatenteSnapshot {
  readonly id: string;
  readonly nome: string;
  readonly classe: string;
  readonly lado: LadoDoCombate;
  readonly tipoCriatura: string | null;
  readonly vida: number;
  readonly vidaMaxima: number;
  readonly ataque: number;
  readonly ataqueBase: number;
  readonly defesa: number;
  readonly bonusTemporario: number;
  readonly destruido: boolean;
  readonly derrotaDefinitiva: boolean;
  readonly recurso: Recurso | null;
  readonly habilidade: HabilidadeSnapshot | null;
  readonly podeUsarHabilidade: boolean;
  readonly arma: ItemSnapshot | null;
  readonly armadura: ItemSnapshot | null;
  readonly tiposDeArma: readonly TipoDeArma[];
  readonly membros: readonly MembroSnapshot[];
}

export interface ObjetoSnapshot {
  readonly id: string;
  readonly nome: string;
  readonly tipo: 'bau' | 'fortaleza' | 'objeto';
  readonly vida: number;
  readonly vidaMaxima: number;
  readonly destruido: boolean;
}

export interface BatalhaSnapshot {
  readonly estado: EstadoDaBatalha;
  readonly rodada: number;
  readonly atorAtualId: string | null;
  readonly turnoDoJogador: boolean;
  readonly ordemDeTurnos: readonly string[];
  readonly herois: readonly CombatenteSnapshot[];
  readonly aliados: readonly CombatenteSnapshot[];
  readonly inimigos: readonly CombatenteSnapshot[];
  readonly cenario: readonly ObjetoSnapshot[];
  readonly alvosHostis: readonly string[];
  readonly investidaDisponivel: boolean;
  readonly objetivo: string;
  /** Eventos já ocorridos nesta batalha (para o registro ao reabrir a tela). */
  readonly eventos: readonly CombatEvent[];
}

export function fotografarItem(item: Item, contexto?: { grupo: readonly Personagem[]; herois: readonly Personagem[] }): ItemSnapshot {
  const base = { id: item.id, catalogoId: item.catalogoId, categoria: item.categoria, nome: item.getNome() };
  switch (item.categoria) {
    case 'arma':
      return {
        ...base,
        bonusAtaque: item.getBonusAtaque(),
        tipoDeArma: item.tipo,
        portadoresPossiveis: contexto?.herois.filter((heroi) => heroi.podeEmpunhar(item)).map((heroi) => heroi.id) ?? [],
      };
    case 'armadura':
      return { ...base, defesa: item.getDefesa() };
    case 'consumivel':
      return {
        ...base,
        alcance: item.efeito.alcance,
        alvosValidos:
          contexto?.grupo.filter((alvo) => item.efeito.podeAplicar(alvo, contexto.grupo)).map((alvo) => alvo.id) ?? [],
      };
  }
}

export function fotografarCombatente(personagem: Personagem, lado: LadoDoCombate): CombatenteSnapshot {
  const status = personagem.getStatus();
  const habilidade = possuiHabilidadeEspecial(personagem) ? personagem.getHabilidade() : null;
  return {
    ...status,
    lado,
    tipoCriatura: personagem instanceof Inimigo ? personagem.tipoCriatura : null,
    destruido: status.destruido,
    recurso: possuiRecurso(personagem) ? personagem.getRecurso() : null,
    habilidade: habilidade
      ? {
          id: habilidade.id,
          custo: habilidade.custo,
          recurso: habilidade.recurso,
          elemento: habilidade.elemento,
          dano: habilidade.calcularDano(personagem.getAtaque()),
        }
      : null,
    podeUsarHabilidade: possuiHabilidadeEspecial(personagem) && personagem.podeUsarHabilidade(),
    arma: personagem.getArma() ? fotografarItem(personagem.getArma()!) : null,
    armadura: personagem.getArmadura() ? fotografarItem(personagem.getArmadura()!) : null,
    tiposDeArma: personagem.getTiposDeArma(),
    membros: personagem.getMembros().map((membro) => ({
      id: membro.id,
      parte: membro.parte,
      nome: membro.getNome(),
      vida: membro.getVida(),
      vidaMaxima: membro.getVidaMaxima(),
      destruido: membro.estaDestruido(),
    })),
  };
}

function fotografarObjeto(objeto: Destrutivel): ObjetoSnapshot {
  const tipo = objeto instanceof Bau ? 'bau' : objeto instanceof Fortaleza ? 'fortaleza' : 'objeto';
  return {
    id: objeto.id,
    nome: objeto.getNome(),
    tipo,
    vida: objeto.getVida(),
    vidaMaxima: objeto.getVidaMaxima(),
    destruido: objeto.estaDestruido(),
  };
}

export function fotografarBatalha(batalha: Batalha, eventos: readonly CombatEvent[] = []): BatalhaSnapshot {
  return {
    estado: batalha.getEstado(),
    rodada: batalha.getRodada(),
    atorAtualId: batalha.getAtorAtual()?.id ?? null,
    turnoDoJogador: batalha.ehTurnoDoJogador(),
    ordemDeTurnos: batalha.getOrdemDeTurnos().map((personagem) => personagem.id),
    herois: batalha.getHerois().map((heroi) => fotografarCombatente(heroi, 'heroi')),
    aliados: batalha.getAliados().map((aliado) => fotografarCombatente(aliado, 'aliado')),
    inimigos: batalha.getInimigos().map((inimigo) => fotografarCombatente(inimigo, 'inimigo')),
    cenario: batalha.getCenario().map(fotografarObjeto),
    alvosHostis: batalha.getAlvosHostis().map((alvo) => alvo.id),
    investidaDisponivel: batalha.investidaDisponivel(),
    objetivo: batalha.getCondicaoDeVitoria().chave,
    eventos: [...eventos],
  };
}

export function fotografarInventario(inventario: Inventario, grupo: readonly Personagem[], herois: readonly Personagem[]): ItemSnapshot[] {
  return inventario.listar().map((item) => fotografarItem(item, { grupo, herois }));
}
