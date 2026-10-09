import { possuiHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import { contemItens } from '../contracts/ContemItens';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Inventario } from '../equipment/Inventario';
import type { GrupoDeBatalha } from '../model/GrupoDeBatalha';
import { Inimigo } from '../model/Inimigo';
import type { Personagem } from '../model/Personagem';
import type { CondicaoDeVitoria } from './condicoesDeVitoria';
import { AcaoInvalidaError } from './erros';

export type EstadoDaBatalha = 'preparando' | 'em-andamento' | 'vitoria' | 'derrota';

export type AcaoDoJogador =
  | { readonly tipo: 'atacar'; readonly atorId: string; readonly alvoId: string }
  | { readonly tipo: 'habilidade'; readonly atorId: string; readonly alvoId: string }
  | { readonly tipo: 'item'; readonly atorId: string; readonly itemId: string; readonly alvoId: string }
  | { readonly tipo: 'investida'; readonly atorId: string; readonly alvoId: string };

export interface ConfiguracaoDeBatalha {
  readonly herois: GrupoDeBatalha;
  /** Aliados controlados pelo computador (ex.: o monstro domado do PDF). */
  readonly aliados?: readonly Personagem[];
  readonly inimigos: readonly Personagem[];
  readonly cenario?: readonly Destrutivel[];
  readonly inventario: Inventario;
  readonly condicaoDeVitoria: CondicaoDeVitoria;
}

/** Limite de segurança para turnos automáticos consecutivos. */
const MAXIMO_DE_TURNOS_AUTOMATICOS = 200;

// #region lab:batalha
/**
 * Orquestra uma batalha por turnos. É a autoridade sobre a ordem dos turnos,
 * a validação das ações, o espólio e as condições de vitória e derrota. Não
 * conhece interface, animações nem idiomas: tudo é comunicado por eventos.
 */
export class Batalha {
  private estado: EstadoDaBatalha = 'preparando';
  private rodada = 0;
  private fila: Personagem[] = [];
  private indice = 0;
  private investidaUsada = false;

  private readonly herois: GrupoDeBatalha;
  private readonly aliados: readonly Personagem[];
  private readonly inimigos: readonly Personagem[];
  private readonly cenario: readonly Destrutivel[];
  private readonly inventario: Inventario;
  private readonly condicaoDeVitoria: CondicaoDeVitoria;

  constructor(configuracao: ConfiguracaoDeBatalha) {
    this.herois = configuracao.herois;
    this.aliados = configuracao.aliados ?? [];
    this.inimigos = configuracao.inimigos;
    this.cenario = configuracao.cenario ?? [];
    this.inventario = configuracao.inventario;
    this.condicaoDeVitoria = configuracao.condicaoDeVitoria;
  }

  iniciar(notifier: CombatNotifier): void {
    if (this.estado !== 'preparando') throw new AcaoInvalidaError('error.inBattle');
    this.estado = 'em-andamento';
    this.iniciarRodada();
    this.anunciarTurno(notifier);
  }

  executarAcaoDoJogador(acao: AcaoDoJogador, notifier: CombatNotifier): void {
    const ator = this.validarAtorDoJogador(acao.atorId);
    switch (acao.tipo) {
      case 'atacar':
        ator.atacar(this.alvoHostil(acao.alvoId), notifier);
        break;
      case 'habilidade': {
        if (!possuiHabilidadeEspecial(ator)) throw new AcaoInvalidaError('error.noAbility');
        if (!ator.podeUsarHabilidade()) throw new AcaoInvalidaError('error.insufficientResource');
        ator.usarHabilidade(this.alvoHostil(acao.alvoId), notifier);
        break;
      }
      case 'item':
        this.usarItem(ator, acao.itemId, acao.alvoId, notifier);
        break;
      case 'investida': {
        if (this.investidaUsada) throw new AcaoInvalidaError('error.assaultUsed');
        const alvo = this.alvoHostil(acao.alvoId);
        this.investidaUsada = true;
        notifier.notify({ key: 'coordinated_assault', alvoId: alvo.id, alvo: alvo.getNome() });
        this.herois.realizarInvestida(alvo, notifier);
        this.pularTurnosRestantesDosHerois();
        break;
      }
    }
    this.concluirAcao(notifier);
  }

  /** Resolve os turnos do computador até que seja a vez de um herói ou a batalha termine. */
  executarTurnosAutomaticos(notifier: CombatNotifier): void {
    let seguranca = 0;
    while (this.estado === 'em-andamento' && !this.ehTurnoDoJogador() && seguranca++ < MAXIMO_DE_TURNOS_AUTOMATICOS) {
      const ator = this.getAtorAtual();
      if (ator) this.executarTurnoAutomatico(ator, notifier);
      this.concluirAcao(notifier);
    }
  }
  // #endregion

  // ------------------------------------------------------------ consultas

  getEstado(): EstadoDaBatalha {
    return this.estado;
  }

  getRodada(): number {
    return this.rodada;
  }

  getAtorAtual(): Personagem | null {
    if (this.estado !== 'em-andamento') return null;
    return this.fila[this.indice] ?? null;
  }

  ehTurnoDoJogador(): boolean {
    const ator = this.getAtorAtual();
    return ator !== null && this.herois.getMembros().includes(ator);
  }

  /** Próximos combatentes a agir nesta rodada, a partir do atual. */
  getOrdemDeTurnos(): readonly Personagem[] {
    return this.fila.slice(this.indice).filter((personagem) => !personagem.estaDestruido());
  }

  investidaDisponivel(): boolean {
    return !this.investidaUsada && this.estado === 'em-andamento';
  }

  getHerois(): readonly Personagem[] {
    return this.herois.getMembros();
  }

  getAliados(): readonly Personagem[] {
    return this.aliados;
  }

  getInimigos(): readonly Personagem[] {
    return this.inimigos;
  }

  getCenario(): readonly Destrutivel[] {
    return this.cenario;
  }

  getCondicaoDeVitoria(): CondicaoDeVitoria {
    return this.condicaoDeVitoria;
  }

  /** Tudo que o jogador pode atacar agora: inimigos, seus membros e objetos do cenário. */
  getAlvosHostis(): Destrutivel[] {
    const inimigosVivos = this.inimigos.filter((inimigo) => !inimigo.estaDestruido());
    const membros = inimigosVivos.flatMap((inimigo) => inimigo.getMembros().filter((membro) => !membro.estaDestruido()));
    const objetos = this.cenario.filter((objeto) => !objeto.estaDestruido());
    return [...inimigosVivos, ...membros, ...objetos];
  }

  // ------------------------------------------------------------- internos

  private validarAtorDoJogador(atorId: string): Personagem {
    if (this.estado !== 'em-andamento') throw new AcaoInvalidaError('error.battleOver');
    const ator = this.getAtorAtual();
    if (!ator || ator.id !== atorId || !this.ehTurnoDoJogador()) throw new AcaoInvalidaError('error.notYourTurn');
    if (ator.estaDestruido()) throw new AcaoInvalidaError('error.actorDefeated');
    return ator;
  }

  private alvoHostil(alvoId: string): Destrutivel {
    const alvo = this.getAlvosHostis().find((destrutivel) => destrutivel.id === alvoId);
    if (!alvo) throw new AcaoInvalidaError('error.invalidTarget');
    return alvo;
  }

  private aliadosDoJogador(): Personagem[] {
    return [...this.herois.getMembros(), ...this.aliados];
  }

  private usarItem(ator: Personagem, itemId: string, alvoId: string, notifier: CombatNotifier): void {
    const item = this.inventario.obter(itemId);
    if (!item) throw new AcaoInvalidaError('error.itemUnavailable');
    if (item.categoria !== 'consumivel') throw new AcaoInvalidaError('error.itemNotConsumable');
    const grupo = this.aliadosDoJogador();
    const alvo = grupo.find((personagem) => personagem.id === alvoId);
    if (!alvo) throw new AcaoInvalidaError('error.invalidTarget');
    if (!item.efeito.podeAplicar(alvo, grupo)) throw new AcaoInvalidaError('error.itemCannotTarget');

    this.inventario.retirar(itemId);
    notifier.notify({
      key: 'item_used',
      atorId: ator.id,
      ator: ator.getNome(),
      alvoId: alvo.id,
      alvo: alvo.getNome(),
      itemId: item.id,
      catalogoId: item.catalogoId,
    });
    item.efeito.aplicar({ alvo, grupo, notifier });
  }

  private executarTurnoAutomatico(ator: Personagem, notifier: CombatNotifier): void {
    if (!(ator instanceof Inimigo)) return;
    const oponentes = this.inimigos.includes(ator)
      ? this.aliadosDoJogador().filter((personagem) => !personagem.estaDestruido())
      : this.inimigos.filter((inimigo) => !inimigo.estaDestruido());
    const podeUsarHabilidade = possuiHabilidadeEspecial(ator) && ator.podeUsarHabilidade();
    const decisao = ator.getComportamento().decidir({ oponentes, podeUsarHabilidade });
    if (!decisao) return;
    if (decisao.tipo === 'habilidade' && possuiHabilidadeEspecial(ator) && ator.podeUsarHabilidade()) {
      ator.usarHabilidade(decisao.alvo, notifier);
    } else {
      ator.atacar(decisao.alvo, notifier);
    }
  }

  private concluirAcao(notifier: CombatNotifier): void {
    this.recolherEspolio(notifier);
    if (this.condicaoDeVitoria.foiAtendida({ inimigos: this.inimigos, cenario: this.cenario })) {
      this.estado = 'vitoria';
      notifier.notify({ key: 'battle_won' });
      return;
    }
    if (this.herois.todosDerrotados()) {
      this.estado = 'derrota';
      notifier.notify({ key: 'battle_lost' });
      return;
    }
    this.avancarTurno();
    this.anunciarTurno(notifier);
  }

  /** Agregação em ação: itens de baús quebrados e armas de inimigos caídos vão para o inventário. */
  private recolherEspolio(notifier: CombatNotifier): void {
    const recolhidos: string[] = [];
    for (const objeto of this.cenario) {
      if (objeto.estaDestruido() && contemItens(objeto)) {
        for (const item of objeto.retirarItens()) {
          this.inventario.adicionar(item);
          recolhidos.push(item.catalogoId);
        }
      }
    }
    for (const inimigo of this.inimigos) {
      if (inimigo.foiDerrotadoDefinitivamente()) {
        const arma = inimigo.droparArmaAoMorrer(notifier);
        if (arma) {
          this.inventario.adicionar(arma);
          recolhidos.push(arma.catalogoId);
        }
      }
    }
    if (recolhidos.length > 0) notifier.notify({ key: 'loot_collected', catalogoIds: recolhidos });
  }

  private iniciarRodada(): void {
    this.rodada += 1;
    this.fila = [...this.herois.getMembros(), ...this.aliados, ...this.inimigos].filter(
      (personagem) => !personagem.estaDestruido(),
    );
    this.indice = 0;
  }

  private avancarTurno(): void {
    do {
      this.indice += 1;
      if (this.indice >= this.fila.length) this.iniciarRodada();
    } while (this.fila[this.indice]?.estaDestruido());
  }

  private pularTurnosRestantesDosHerois(): void {
    const herois = this.herois.getMembros();
    while (this.indice + 1 < this.fila.length && herois.includes(this.fila[this.indice + 1]!)) {
      this.indice += 1;
    }
  }

  private anunciarTurno(notifier: CombatNotifier): void {
    const ator = this.getAtorAtual();
    if (!ator) return;
    ator.iniciarTurno();
    notifier.notify({ key: 'turn_start', atorId: ator.id, ator: ator.getNome(), rodada: this.rodada });
  }
}
