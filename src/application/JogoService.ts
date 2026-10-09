import { Batalha, type AcaoDoJogador } from '../domain/combat/Batalha';
import { AcaoInvalidaError, type CodigoDeAcaoInvalida } from '../domain/combat/erros';
import type { GeradorAleatorio } from '../domain/contracts/ComportamentoDeCombate';
import type { CombatEvent } from '../domain/events/CombatEvent';
import { CatalogoDeItens, ehCatalogoIdValido } from '../domain/equipment/catalogoDeItens';
import { Inventario } from '../domain/equipment/Inventario';
import type { Item } from '../domain/equipment/Item';
import { GrupoDeBatalha } from '../domain/model/GrupoDeBatalha';
import type { Personagem } from '../domain/model/Personagem';
import { criarBaseDeAfinidadesDoJogo } from '../domain/paradigms/ModuloLogico';
import { ALEATORIO_PADRAO } from '../domain/rules/comportamentos';
import { ESTAGIOS, estagioPorIndice, type IdDeEstagio } from '../domain/world/estagios';
import {
  CLASSES_JOGAVEIS,
  INVENTARIO_INICIAL,
  definicaoDaClasse,
  ehClasseJogavel,
  type ClasseJogavel,
} from '../domain/world/herois';
import type { EventBus } from '../events/EventBus';
import {
  VERSAO_DO_SAVE,
  type DadosDeSave,
  type EstatisticasDaJornada,
  type HeroiSalvo,
  type ItemSalvo,
} from '../shared/contratosDePersistencia';
import { calcularEstatisticas, type EstatisticasDaBatalha } from './estatisticas';
import { ColetorDeEventos, NOTIFICADOR_SILENCIOSO, type EventosDoJogo } from './eventosDoJogo';
import type { RepositorioDeProgresso } from './portas';
import {
  fotografarBatalha,
  fotografarCombatente,
  fotografarInventario,
  type BatalhaSnapshot,
  type CombatenteSnapshot,
  type ItemSnapshot,
} from './snapshots';

export type CodigoDeErro = CodigoDeAcaoInvalida | 'error.generic';

export type ResultadoDeAcao =
  | { readonly ok: true; readonly eventos: readonly CombatEvent[] }
  | { readonly ok: false; readonly erro: CodigoDeErro; readonly detalhe?: string };

export type Espaco = 'arma' | 'armadura';

export interface JogoSnapshot {
  readonly emPartida: boolean;
  readonly estagio: number;
  readonly estagioId: IdDeEstagio | null;
  readonly objetivoDoEstagio: string | null;
  readonly totalDeEstagios: number;
  readonly campanhaConcluida: boolean;
  readonly grupo: readonly CombatenteSnapshot[];
  readonly inventario: readonly ItemSnapshot[];
  readonly batalha: BatalhaSnapshot | null;
  readonly estatisticas: EstatisticasDaJornada;
  readonly ultimaBatalha: EstatisticasDaBatalha | null;
  readonly recompensasRecentes: readonly string[];
  readonly descansou: boolean;
}

export interface DependenciasDoJogo {
  readonly progresso: RepositorioDeProgresso;
  readonly barramento?: EventBus<EventosDoJogo>;
  readonly aleatorio?: GeradorAleatorio;
}

interface Sessao {
  readonly grupo: GrupoDeBatalha;
  readonly inventario: Inventario;
  readonly catalogo: CatalogoDeItens;
  estagio: number;
  campanhaConcluida: boolean;
  batalha: Batalha | null;
  checkpoint: DadosDeSave | null;
  eventosDaBatalha: CombatEvent[];
  estatisticas: EstatisticasDaJornada;
  ultimaBatalha: EstatisticasDaBatalha | null;
  recompensasRecentes: string[];
  descansou: boolean;
}

const ESTATISTICAS_INICIAIS: EstatisticasDaJornada = {
  batalhasVencidas: 0,
  derrotas: 0,
  danoCausado: 0,
  danoRecebido: 0,
  habilidadesUsadas: 0,
  inimigosDerrotados: 0,
};

const SNAPSHOT_VAZIO: JogoSnapshot = {
  emPartida: false,
  estagio: 0,
  estagioId: null,
  objetivoDoEstagio: null,
  totalDeEstagios: ESTAGIOS.length,
  campanhaConcluida: false,
  grupo: [],
  inventario: [],
  batalha: null,
  estatisticas: ESTATISTICAS_INICIAIS,
  ultimaBatalha: null,
  recompensasRecentes: [],
  descansou: false,
};

// #region lab:jogo-service
/**
 * Fachada de casos de uso da aplicação. É a única porta pela qual a
 * interface altera o jogo: valida a intenção, delega as regras ao domínio,
 * coleta os eventos resultantes e devolve um resultado estruturado.
 * Mantém a sessão como fonte única de verdade e notifica os assinantes
 * (useSyncExternalStore no React) a cada mudança.
 */
export class JogoService {
  private sessao: Sessao | null = null;
  private snapshot: JogoSnapshot = SNAPSHOT_VAZIO;
  private readonly assinantes = new Set<() => void>();
  private readonly afinidades = criarBaseDeAfinidadesDoJogo();
  private readonly aleatorio: GeradorAleatorio;

  constructor(private readonly dependencias: DependenciasDoJogo) {
    this.aleatorio = dependencias.aleatorio ?? ALEATORIO_PADRAO;
  }
  // #endregion

  // ------------------------------------------------------- assinatura

  subscribe = (assinante: () => void): (() => void) => {
    this.assinantes.add(assinante);
    return () => this.assinantes.delete(assinante);
  };

  getSnapshot = (): JogoSnapshot => this.snapshot;

  // ----------------------------------------------------- ciclo da partida

  novaPartida(classes: readonly ClasseJogavel[]): ResultadoDeAcao {
    if (classes.length !== 2 || new Set(classes).size !== 2 || !classes.every(ehClasseJogavel)) {
      return { ok: false, erro: 'error.unknownCharacter' };
    }
    const catalogo = new CatalogoDeItens();
    const herois = classes.map((classe) => {
      const definicao = definicaoDaClasse(classe);
      const heroi = definicao.criar();
      heroi.equiparArma(catalogo.criarArma(definicao.armaInicial), NOTIFICADOR_SILENCIOSO);
      return heroi;
    });
    const inventario = new Inventario();
    INVENTARIO_INICIAL.forEach((catalogoId) => inventario.adicionar(catalogo.criar(catalogoId)));
    this.sessao = this.criarSessao(new GrupoDeBatalha(herois), inventario, catalogo);
    this.publicar();
    return { ok: true, eventos: [] };
  }

  async lerSave(): Promise<DadosDeSave | null> {
    return this.dependencias.progresso.carregar();
  }

  async carregarPartida(): Promise<boolean> {
    const dados = await this.dependencias.progresso.carregar();
    if (!dados) return false;
    const sessao = this.reconstruirSessao(dados);
    if (!sessao) return false;
    this.sessao = sessao;
    this.publicar();
    return true;
  }

  async salvar(): Promise<void> {
    const sessao = this.exigirSessao();
    if (sessao.batalha) throw new AcaoInvalidaError('error.inBattle');
    const dados = this.criarSave(sessao);
    await this.dependencias.progresso.salvar(dados);
    this.dependencias.barramento?.emit('jogo:salvo', { salvoEm: dados.salvoEm });
  }

  async apagarSave(): Promise<void> {
    await this.dependencias.progresso.limpar();
  }

  encerrarPartida(): void {
    this.sessao = null;
    this.publicar();
  }

  // ------------------------------------------------------------ batalha

  iniciarBatalha(): ResultadoDeAcao {
    return this.executar(() => {
      const sessao = this.exigirSessao();
      if (sessao.batalha && sessao.batalha.getEstado() === 'em-andamento') throw new AcaoInvalidaError('error.inBattle');
      if (sessao.campanhaConcluida) throw new AcaoInvalidaError('error.battleOver');
      sessao.checkpoint = this.criarSave(sessao);
      const elenco = estagioPorIndice(sessao.estagio).montar({
        catalogo: sessao.catalogo,
        afinidades: this.afinidades,
        aleatorio: this.aleatorio,
        preparacao: NOTIFICADOR_SILENCIOSO,
      });
      sessao.batalha = new Batalha({
        herois: sessao.grupo,
        aliados: elenco.aliados,
        inimigos: elenco.inimigos,
        cenario: elenco.cenario,
        inventario: sessao.inventario,
        condicaoDeVitoria: elenco.condicaoDeVitoria,
      });
      sessao.eventosDaBatalha = [];
      sessao.ultimaBatalha = null;
      sessao.recompensasRecentes = [];
      sessao.descansou = false;
      const coletor = this.novoColetor();
      sessao.batalha.iniciar(coletor);
      sessao.batalha.executarTurnosAutomaticos(coletor);
      return this.registrarEventosDaBatalha(sessao, coletor.eventos);
    });
  }

  // #region lab:executar-acao
  /** Caso de uso principal do combate: ação do jogador + turnos automáticos. */
  executarAcao(acao: AcaoDoJogador): ResultadoDeAcao {
    return this.executar(() => {
      const sessao = this.exigirSessao();
      const batalha = sessao.batalha;
      if (!batalha) throw new AcaoInvalidaError('error.notInBattle');
      const coletor = this.novoColetor();
      batalha.executarAcaoDoJogador(acao, coletor); // valida e aplica as regras
      batalha.executarTurnosAutomaticos(coletor); // resposta dos inimigos/aliados
      return this.registrarEventosDaBatalha(sessao, coletor.eventos);
    });
  }
  // #endregion

  /** Desfaz a batalha atual e a recomeça a partir do ponto anterior a ela. */
  reiniciarBatalha(): ResultadoDeAcao {
    const sessao = this.exigirSessao();
    if (!sessao.checkpoint) return { ok: false, erro: 'error.notInBattle' };
    const reconstruida = this.reconstruirSessao(sessao.checkpoint);
    if (!reconstruida) return { ok: false, erro: 'error.generic' };
    reconstruida.estatisticas = { ...sessao.estatisticas, derrotas: sessao.estatisticas.derrotas + 1 };
    this.sessao = reconstruida;
    return this.iniciarBatalha();
  }

  /** Após a vitória: espólios, avanço de capítulo, descanso e salvamento automático. */
  async seguirParaAcampamento(): Promise<void> {
    const sessao = this.exigirSessao();
    const batalha = sessao.batalha;
    if (!batalha || batalha.getEstado() !== 'vitoria') throw new AcaoInvalidaError('error.notInBattle');

    const resumo = sessao.ultimaBatalha;
    if (resumo) {
      sessao.estatisticas = {
        ...sessao.estatisticas,
        batalhasVencidas: sessao.estatisticas.batalhasVencidas + 1,
        danoCausado: sessao.estatisticas.danoCausado + resumo.danoCausado,
        danoRecebido: sessao.estatisticas.danoRecebido + resumo.danoRecebido,
        habilidadesUsadas: sessao.estatisticas.habilidadesUsadas + resumo.habilidadesUsadas,
        inimigosDerrotados: sessao.estatisticas.inimigosDerrotados + resumo.inimigosDerrotados,
      };
    }

    const estagio = estagioPorIndice(sessao.estagio);
    sessao.recompensasRecentes = estagio.recompensas.map((catalogoId) => {
      sessao.inventario.adicionar(sessao.catalogo.criar(catalogoId));
      return catalogoId;
    });
    if (sessao.estagio + 1 >= ESTAGIOS.length) {
      sessao.campanhaConcluida = true;
    } else {
      sessao.estagio += 1;
    }
    // Polimorfismo: cada classe descansa à sua maneira.
    sessao.grupo.getMembros().forEach((heroi) => heroi.descansar());
    sessao.descansou = true;
    sessao.batalha = null;
    sessao.checkpoint = null;
    this.publicar();
    await this.salvar();
  }

  // ------------------------------------------------ inventário/equipamento

  equipar(personagemId: string, itemId: string): ResultadoDeAcao {
    return this.executarForaDeCombate((sessao, coletor) => {
      const personagem = this.heroi(sessao, personagemId);
      const item = sessao.inventario.obter(itemId);
      if (!item) throw new AcaoInvalidaError('error.itemUnavailable');
      if (item.categoria === 'arma') {
        if (!personagem.podeEmpunhar(item)) throw new AcaoInvalidaError('error.weaponNotAllowed');
        sessao.inventario.retirar(itemId);
        this.devolver(sessao, personagem.equiparArma(item, coletor));
      } else if (item.categoria === 'armadura') {
        sessao.inventario.retirar(itemId);
        this.devolver(sessao, personagem.equiparArmadura(item, coletor));
      } else {
        throw new AcaoInvalidaError('error.invalidTarget');
      }
      this.dependencias.barramento?.emit('jogo:equipamento', { tipo: 'equipado', personagemId, catalogoId: item.catalogoId });
    });
  }

  guardar(personagemId: string, espaco: Espaco): ResultadoDeAcao {
    return this.executarForaDeCombate((sessao) => {
      const personagem = this.heroi(sessao, personagemId);
      const item = espaco === 'arma' ? personagem.desequiparArma() : personagem.desequiparArmadura();
      if (!item) throw new AcaoInvalidaError('error.nothingEquipped');
      sessao.inventario.adicionar(item);
      this.dependencias.barramento?.emit('jogo:equipamento', { tipo: 'guardado', personagemId, catalogoId: item.catalogoId });
    });
  }

  // #region lab:transferir
  /** Agregação: o mesmo objeto passa de um herói para outro, sem ser recriado. */
  transferir(deId: string, paraId: string, espaco: Espaco): ResultadoDeAcao {
    return this.executarForaDeCombate((sessao, coletor) => {
      if (deId === paraId) throw new AcaoInvalidaError('error.sameCharacter');
      const origem = this.heroi(sessao, deId);
      const destino = this.heroi(sessao, paraId);
      if (espaco === 'arma') {
        const arma = origem.getArma();
        if (!arma) throw new AcaoInvalidaError('error.nothingEquipped');
        if (!destino.podeEmpunhar(arma)) throw new AcaoInvalidaError('error.weaponNotAllowed');
        origem.desequiparArma();
        this.devolver(sessao, destino.equiparArma(arma, coletor));
        this.dependencias.barramento?.emit('jogo:equipamento', { tipo: 'transferido', personagemId: paraId, catalogoId: arma.catalogoId });
      } else {
        const armadura = origem.getArmadura();
        if (!armadura) throw new AcaoInvalidaError('error.nothingEquipped');
        origem.desequiparArmadura();
        this.devolver(sessao, destino.equiparArmadura(armadura, coletor));
        this.dependencias.barramento?.emit('jogo:equipamento', { tipo: 'transferido', personagemId: paraId, catalogoId: armadura.catalogoId });
      }
    });
  }
  // #endregion

  usarItemNoAcampamento(itemId: string, alvoId: string): ResultadoDeAcao {
    return this.executarForaDeCombate((sessao, coletor) => {
      const item = sessao.inventario.obter(itemId);
      if (!item) throw new AcaoInvalidaError('error.itemUnavailable');
      if (item.categoria !== 'consumivel') throw new AcaoInvalidaError('error.itemNotConsumable');
      const grupo = sessao.grupo.getMembros();
      const alvo = this.heroi(sessao, alvoId);
      if (!item.efeito.podeAplicar(alvo, grupo)) throw new AcaoInvalidaError('error.itemCannotTarget');
      sessao.inventario.retirar(itemId);
      item.efeito.aplicar({ alvo, grupo, notifier: coletor });
      this.dependencias.barramento?.emit('jogo:equipamento', { tipo: 'usado', personagemId: alvoId, catalogoId: item.catalogoId });
    });
  }

  // ------------------------------------------------------------ internos

  private executar(operacao: () => readonly CombatEvent[]): ResultadoDeAcao {
    try {
      const eventos = operacao();
      return { ok: true, eventos };
    } catch (erro) {
      if (erro instanceof AcaoInvalidaError) return { ok: false, erro: erro.codigo };
      return { ok: false, erro: 'error.generic', detalhe: erro instanceof Error ? erro.message : String(erro) };
    } finally {
      this.publicar();
    }
  }

  private executarForaDeCombate(operacao: (sessao: Sessao, coletor: ColetorDeEventos) => void): ResultadoDeAcao {
    return this.executar(() => {
      const sessao = this.exigirSessao();
      if (sessao.batalha) throw new AcaoInvalidaError('error.inBattle');
      const coletor = this.novoColetor();
      operacao(sessao, coletor);
      return coletor.eventos;
    });
  }

  private registrarEventosDaBatalha(sessao: Sessao, eventos: readonly CombatEvent[]): readonly CombatEvent[] {
    sessao.eventosDaBatalha.push(...eventos);
    const batalha = sessao.batalha;
    if (batalha && batalha.getEstado() !== 'em-andamento') {
      const ladoDoJogador = new Set([...batalha.getHerois(), ...batalha.getAliados()].map((personagem) => personagem.id));
      sessao.ultimaBatalha = calcularEstatisticas(sessao.eventosDaBatalha, ladoDoJogador);
    }
    return eventos;
  }

  private novoColetor(): ColetorDeEventos {
    return new ColetorDeEventos(this.dependencias.barramento);
  }

  private exigirSessao(): Sessao {
    if (!this.sessao) throw new AcaoInvalidaError('error.notInBattle');
    return this.sessao;
  }

  private heroi(sessao: Sessao, id: string): Personagem {
    const heroi = sessao.grupo.encontrar(id);
    if (!heroi) throw new AcaoInvalidaError('error.unknownCharacter');
    return heroi;
  }

  private devolver(sessao: Sessao, item: Item | null): void {
    if (item) sessao.inventario.adicionar(item);
  }

  private criarSessao(grupo: GrupoDeBatalha, inventario: Inventario, catalogo: CatalogoDeItens): Sessao {
    return {
      grupo,
      inventario,
      catalogo,
      estagio: 0,
      campanhaConcluida: false,
      batalha: null,
      checkpoint: null,
      eventosDaBatalha: [],
      estatisticas: ESTATISTICAS_INICIAIS,
      ultimaBatalha: null,
      recompensasRecentes: [],
      descansou: false,
    };
  }

  private publicar(): void {
    this.snapshot = this.fotografar();
    this.assinantes.forEach((assinante) => assinante());
  }

  private fotografar(): JogoSnapshot {
    const sessao = this.sessao;
    if (!sessao) return SNAPSHOT_VAZIO;
    const herois = sessao.grupo.getMembros();
    const grupoParaItens = sessao.batalha ? [...herois, ...sessao.batalha.getAliados()] : herois;
    return {
      emPartida: true,
      estagio: sessao.estagio,
      estagioId: estagioPorIndice(sessao.estagio).id,
      objetivoDoEstagio: estagioPorIndice(sessao.estagio).objetivo,
      totalDeEstagios: ESTAGIOS.length,
      campanhaConcluida: sessao.campanhaConcluida,
      grupo: herois.map((heroi) => fotografarCombatente(heroi, 'heroi')),
      inventario: fotografarInventario(sessao.inventario, grupoParaItens, herois),
      batalha: sessao.batalha ? fotografarBatalha(sessao.batalha, sessao.eventosDaBatalha) : null,
      estatisticas: sessao.estatisticas,
      ultimaBatalha: sessao.ultimaBatalha,
      recompensasRecentes: sessao.recompensasRecentes,
      descansou: sessao.descansou,
    };
  }

  // ------------------------------------------------------- persistência

  private criarSave(sessao: Sessao): DadosDeSave {
    const salvarItem = (item: Item | null): ItemSalvo | null => (item ? { id: item.id, catalogoId: item.catalogoId } : null);
    const grupo: HeroiSalvo[] = sessao.grupo.getMembros().map((heroi) => {
      const memento = heroi.criarMemento();
      return {
        classe: heroi.classe,
        vida: memento.vida,
        bonusTemporario: memento.bonusTemporario,
        membros: memento.membros,
        extra: memento.extra,
        arma: salvarItem(heroi.getArma()),
        armadura: salvarItem(heroi.getArmadura()),
      };
    });
    return {
      versao: VERSAO_DO_SAVE,
      salvoEm: new Date().toISOString(),
      estagio: sessao.estagio,
      campanhaConcluida: sessao.campanhaConcluida,
      grupo,
      inventario: sessao.inventario.listar().map((item) => ({ id: item.id, catalogoId: item.catalogoId })),
      estatisticas: sessao.estatisticas,
    };
  }

  /** Reconstrói as entidades a partir de dados já validados; devolve null se forem incoerentes. */
  private reconstruirSessao(dados: DadosDeSave): Sessao | null {
    if (dados.estagio >= ESTAGIOS.length) return null;
    const catalogo = new CatalogoDeItens();
    const criarItem = (salvo: ItemSalvo): Item | null =>
      ehCatalogoIdValido(salvo.catalogoId) ? catalogo.criar(salvo.catalogoId, salvo.id) : null;

    const herois: Personagem[] = [];
    for (const salvo of dados.grupo) {
      if (!ehClasseJogavel(salvo.classe)) return null;
      const heroi = definicaoDaClasse(salvo.classe).criar();
      heroi.restaurarMemento(salvo);
      if (salvo.arma) {
        const arma = criarItem(salvo.arma);
        if (!arma || arma.categoria !== 'arma' || !heroi.podeEmpunhar(arma)) return null;
        heroi.equiparArma(arma, NOTIFICADOR_SILENCIOSO);
      }
      if (salvo.armadura) {
        const armadura = criarItem(salvo.armadura);
        if (!armadura || armadura.categoria !== 'armadura') return null;
        heroi.equiparArmadura(armadura, NOTIFICADOR_SILENCIOSO);
      }
      herois.push(heroi);
    }
    const inventario = new Inventario();
    for (const salvo of dados.inventario) {
      const item = criarItem(salvo);
      if (!item) return null;
      inventario.adicionar(item);
    }
    const sessao = this.criarSessao(new GrupoDeBatalha(herois), inventario, catalogo);
    sessao.estagio = dados.estagio;
    sessao.campanhaConcluida = dados.campanhaConcluida;
    sessao.estatisticas = dados.estatisticas;
    return sessao;
  }
}

/** Classes disponíveis para a tela de seleção. */
export const CLASSES_DISPONIVEIS = CLASSES_JOGAVEIS;
