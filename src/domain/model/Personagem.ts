import type { Atacante } from '../abilities/Habilidade';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { AlvoDaPolitica, PoliticaDeDerrota } from '../contracts/PoliticaDeDerrota';
import { AcaoInvalidaError } from '../combat/erros';
import type { Arma, TipoDeArma } from '../equipment/Arma';
import type { Armadura } from '../equipment/Armadura';
import type { Elemento } from '../events/CombatEvent';
import {
  calcularAtaqueTotal,
  calcularCura,
  calcularDanoAposDefesa,
  quantidadeValida,
} from '../rules/calculos';
import { DerrotaDefinitiva } from '../rules/politicasDeDerrota';
import type { FichaDeCombatente } from '../paradigms/ModuloFuncional';
import { Membro, membrosPadrao, type DefinicaoDeMembro } from './Membro';

export interface OpcoesDePersonagem {
  readonly id?: string;
  readonly politicaDeDerrota?: PoliticaDeDerrota;
  readonly tiposDeArma?: readonly TipoDeArma[];
  readonly membros?: readonly DefinicaoDeMembro[];
}

/** Consulta de estado (o "mostrar status" do PDF, em forma de dados). */
export interface StatusDoPersonagem {
  readonly id: string;
  readonly nome: string;
  readonly classe: string;
  readonly vida: number;
  readonly vidaMaxima: number;
  readonly ataque: number;
  readonly ataqueBase: number;
  readonly defesa: number;
  readonly bonusTemporario: number;
  readonly destruido: boolean;
  readonly derrotaDefinitiva: boolean;
}

/** Estado mínimo necessário para reconstruir o personagem a partir de um save. */
export interface MementoDePersonagem {
  readonly vida: number;
  readonly bonusTemporario: number;
  readonly membros: Readonly<Record<string, number>>;
  readonly extra: Readonly<Record<string, number>>;
}

/** Fração da vida máxima recuperada ao descansar no acampamento. */
const FRACAO_DE_DESCANSO = 0.3;

function gerarId(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// #region lab:personagem
/**
 * Base abstrata comum a todos os combatentes (PDF — "abstract class Personagem").
 *
 * - Encapsulamento: os atributos são privados; a vida só muda por meio de
 *   receberDano, receberCura e das políticas de derrota.
 * - Invariantes: 0 <= vida <= vidaMaxima; personagem derrotado não age.
 * - SRP: não imprime nada. Tudo que acontece é comunicado ao CombatNotifier.
 * - DIP: atacar() recebe um Destrutivel, não um Personagem.
 */
export abstract class Personagem implements Destrutivel, Atacante {
  readonly id: string;
  abstract readonly classe: string;

  private readonly nome: string;
  private readonly vidaMaxima: number;
  private vida: number;
  private readonly ataqueBase: number;
  private bonusTemporario = 0;
  private derrotaDefinitiva = false;
  private readonly politicaDeDerrota: PoliticaDeDerrota;
  private readonly tiposDeArma: ReadonlySet<TipoDeArma>;

  // COMPOSIÇÃO: os membros nascem e morrem com o personagem.
  private readonly membros: readonly Membro[];

  // AGREGAÇÃO: referências a objetos que existem fora do personagem.
  private armaEquipada: Arma | null = null;
  private armaduraEquipada: Armadura | null = null;

  protected constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDePersonagem = {}) {
    if (!nome.trim()) throw new RangeError('O personagem precisa de um nome.');
    if (!Number.isInteger(vida) || vida <= 0) throw new RangeError('A vida inicial deve ser um inteiro positivo.');
    if (!Number.isInteger(ataque) || ataque < 0) throw new RangeError('O ataque deve ser um inteiro não negativo.');

    this.id = opcoes.id ?? gerarId(nome);
    this.nome = nome;
    this.vidaMaxima = vida;
    this.vida = vida;
    this.ataqueBase = ataque;
    this.politicaDeDerrota = opcoes.politicaDeDerrota ?? new DerrotaDefinitiva();
    this.tiposDeArma = new Set(opcoes.tiposDeArma ?? ['lamina', 'cajado', 'arco']);
    // Instanciação forte da composição: o próprio personagem cria suas partes.
    this.membros = Object.freeze(
      (opcoes.membros ?? membrosPadrao(nome)).map((definicao) => new Membro(this.id, nome, definicao)),
    );
  }
  // #endregion

  // ---------------------------------------------------------------- consulta

  getNome(): string {
    return this.nome;
  }

  getVida(): number {
    return this.vida;
  }

  getVidaMaxima(): number {
    return this.vidaMaxima;
  }

  getAtaqueBase(): number {
    return this.ataqueBase;
  }

  getBonusTemporario(): number {
    return this.bonusTemporario;
  }

  /** Soma das penalidades dos membros decepados (reduce sobre a composição). */
  getPenalidadeDeMembros(): number {
    return this.membros.reduce((total, membro) => total + membro.getPenalidadeAtiva(), 0);
  }

  getAtaque(): number {
    return calcularAtaqueTotal(
      this.ataqueBase,
      this.armaEquipada?.getBonusAtaque() ?? 0,
      this.bonusTemporario,
      this.getPenalidadeDeMembros(),
    );
  }

  getDefesa(): number {
    return this.armaduraEquipada?.getDefesa() ?? 0;
  }

  estaDestruido(): boolean {
    return this.vida === 0;
  }

  foiDerrotadoDefinitivamente(): boolean {
    return this.derrotaDefinitiva;
  }

  getMembros(): readonly Membro[] {
    return this.membros;
  }

  getArma(): Arma | null {
    return this.armaEquipada;
  }

  getArmadura(): Armadura | null {
    return this.armaduraEquipada;
  }

  getStatus(): StatusDoPersonagem {
    return {
      id: this.id,
      nome: this.nome,
      classe: this.classe,
      vida: this.vida,
      vidaMaxima: this.vidaMaxima,
      ataque: this.getAtaque(),
      ataqueBase: this.ataqueBase,
      defesa: this.getDefesa(),
      bonusTemporario: this.bonusTemporario,
      destruido: this.estaDestruido(),
      derrotaDefinitiva: this.derrotaDefinitiva,
    };
  }

  /** Representação imutável usada pelo paradigma funcional. */
  getFicha(): FichaDeCombatente {
    return Object.freeze({
      id: this.id,
      nome: this.nome,
      vida: this.vida,
      vidaMaxima: this.vidaMaxima,
      ataque: this.getAtaque(),
      bonusTemporario: this.bonusTemporario,
    });
  }

  /** "mostrarStatus" do PDF: em vez de imprimir, notifica. */
  mostrarStatus(notifier: CombatNotifier): void {
    notifier.notify({ key: 'status', alvoId: this.id, alvo: this.nome, vida: this.vida });
  }

  // ---------------------------------------------------------------- combate

  // #region lab:atacar
  atacar(alvo: Destrutivel, notifier: CombatNotifier): void {
    this.garantirQuePodeAgir();
    const dano = this.getAtaque();
    notifier.notify({ key: 'attack', atorId: this.id, ator: this.nome, alvoId: alvo.id, alvo: alvo.getNome(), dano });
    alvo.receberDano(dano, notifier, 'fisico');
    this.aoAtacar(notifier);
  }

  receberDano(valor: number, notifier: CombatNotifier, elemento: Elemento = 'fisico'): void {
    if (this.estaDestruido()) return;
    const bruto = quantidadeValida(valor);
    const efetivo = this.calcularDanoRecebido(bruto, elemento, notifier);
    this.vida = Math.max(0, this.vida - efetivo);
    notifier.notify({
      key: 'damage_received',
      alvoId: this.id,
      alvo: this.nome,
      valor: efetivo,
      restante: this.vida,
      maximo: this.vidaMaxima,
      elemento,
      absorvido: Math.max(0, bruto - efetivo),
    });
    if (this.vida > 0) {
      this.aoReceberDano(efetivo, notifier);
      return;
    }
    // SRP/OCP: o que acontece na derrota é decidido por uma estratégia.
    const desfecho = this.politicaDeDerrota.aoZerarVida(this.criarAlvoDaPolitica(), notifier);
    if (desfecho === 'definitiva') this.encerrarCicloDeVida();
  }
  // #endregion

  /** Gancho (template method): por padrão aplica a defesa da armadura. */
  protected calcularDanoRecebido(valor: number, elemento: Elemento, _notifier: CombatNotifier): number {
    return calcularDanoAposDefesa(valor, this.getDefesa(), elemento);
  }

  /** Gancho chamado depois de um ataque básico bem-sucedido. */
  protected aoAtacar(_notifier: CombatNotifier): void {}

  /** Gancho chamado quando o personagem sobrevive a um dano. */
  protected aoReceberDano(_dano: number, _notifier: CombatNotifier): void {}

  /** Gancho executado no início de cada turno do personagem. */
  iniciarTurno(): void {}

  protected garantirQuePodeAgir(): void {
    if (this.estaDestruido()) throw new AcaoInvalidaError('error.actorDefeated');
  }

  private encerrarCicloDeVida(): void {
    this.derrotaDefinitiva = true;
    // COMPOSIÇÃO: destruído o todo, as partes deixam de existir.
    this.membros.forEach((membro) => membro.destruirJuntoComDono());
  }

  /** Fachada estreita entregue à política de derrota. */
  private criarAlvoDaPolitica(): AlvoDaPolitica {
    return {
      id: this.id,
      getNome: () => this.nome,
      getVidaMaxima: () => this.vidaMaxima,
      restaurarVida: (quantidade: number) => {
        this.vida = calcularCura(this.vida, this.vidaMaxima, quantidade);
      },
      fortalecerAtaque: (bonus: number) => {
        this.bonusTemporario += quantidadeValida(bonus);
      },
    };
  }

  // ------------------------------------------------------- cura e reforço

  /** Cura um personagem consciente. Retorna a quantidade efetivamente curada. */
  receberCura(quantidade: number, notifier: CombatNotifier): number {
    if (!Number.isFinite(quantidade) || quantidade < 0) throw new AcaoInvalidaError('error.invalidAmount');
    if (this.estaDestruido()) throw new AcaoInvalidaError('error.characterDefeated');
    const antes = this.vida;
    this.vida = calcularCura(this.vida, this.vidaMaxima, quantidade);
    const curado = this.vida - antes;
    notifier.notify({ key: 'heal', alvoId: this.id, alvo: this.nome, quantidade: curado, restante: this.vida, maximo: this.vidaMaxima });
    return curado;
  }

  fortificar(bonusAtaque: number, notifier: CombatNotifier): void {
    if (this.estaDestruido()) throw new AcaoInvalidaError('error.characterDefeated');
    const bonus = quantidadeValida(bonusAtaque);
    this.bonusTemporario += bonus;
    notifier.notify({ key: 'fortified', alvoId: this.id, alvo: this.nome, bonusAtaque: bonus });
  }

  /**
   * Descanso no acampamento entre batalhas (polimórfico: o Mago também
   * recupera mana, o Guerreiro recompõe a fúria, o Arqueiro reabastece flechas).
   */
  descansar(): void {
    if (this.derrotaDefinitiva) throw new AcaoInvalidaError('error.characterDefeated');
    const recuperacao = Math.ceil(this.vidaMaxima * FRACAO_DE_DESCANSO);
    this.vida = calcularCura(this.vida, this.vidaMaxima, recuperacao);
    this.bonusTemporario = 0;
  }

  // ------------------------------------------------------------ agregação

  podeEmpunhar(arma: Arma): boolean {
    return this.tiposDeArma.has(arma.tipo);
  }

  getTiposDeArma(): readonly TipoDeArma[] {
    return [...this.tiposDeArma];
  }

  // #region lab:equipar
  /** Equipa a arma e devolve a anterior (que continua existindo). */
  equiparArma(novaArma: Arma, notifier: CombatNotifier): Arma | null {
    if (this.derrotaDefinitiva) throw new AcaoInvalidaError('error.characterDefeated');
    if (!this.podeEmpunhar(novaArma)) throw new AcaoInvalidaError('error.weaponNotAllowed');
    const anterior = this.armaEquipada;
    this.armaEquipada = novaArma;
    notifier.notify({
      key: 'weapon_equipped',
      portadorId: this.id,
      portador: this.nome,
      itemId: novaArma.id,
      catalogoId: novaArma.catalogoId,
      bonus: novaArma.getBonusAtaque(),
    });
    return anterior;
  }

  desequiparArma(): Arma | null {
    const anterior = this.armaEquipada;
    this.armaEquipada = null;
    return anterior;
  }

  /** PDF: o personagem derrotado larga a arma; a referência continua viva. */
  droparArmaAoMorrer(notifier: CombatNotifier): Arma | null {
    if (this.armaEquipada === null) return null;
    const dropada = this.armaEquipada;
    this.armaEquipada = null; // quebra a associação, sem destruir a arma
    notifier.notify({
      key: 'weapon_dropped',
      portadorId: this.id,
      portador: this.nome,
      itemId: dropada.id,
      catalogoId: dropada.catalogoId,
    });
    return dropada;
  }
  // #endregion

  equiparArmadura(armadura: Armadura, notifier: CombatNotifier): Armadura | null {
    if (this.derrotaDefinitiva) throw new AcaoInvalidaError('error.characterDefeated');
    const anterior = this.armaduraEquipada;
    this.armaduraEquipada = armadura;
    notifier.notify({
      key: 'armor_equipped',
      portadorId: this.id,
      portador: this.nome,
      itemId: armadura.id,
      catalogoId: armadura.catalogoId,
      defesa: armadura.getDefesa(),
    });
    return anterior;
  }

  desequiparArmadura(): Armadura | null {
    const anterior = this.armaduraEquipada;
    this.armaduraEquipada = null;
    return anterior;
  }

  // ---------------------------------------------------------- persistência

  criarMemento(): MementoDePersonagem {
    return {
      vida: this.vida,
      bonusTemporario: this.bonusTemporario,
      membros: Object.fromEntries(this.membros.map((membro) => [membro.parte, membro.getVida()])),
      extra: this.exportarEstadoExtra(),
    };
  }

  restaurarMemento(memento: MementoDePersonagem): void {
    this.vida = Math.min(this.vidaMaxima, quantidadeValida(memento.vida));
    this.bonusTemporario = quantidadeValida(memento.bonusTemporario);
    this.derrotaDefinitiva = false;
    for (const membro of this.membros) {
      const integridade = memento.membros[membro.parte];
      if (integridade !== undefined) membro.restaurarIntegridade(integridade);
    }
    this.importarEstadoExtra(memento.extra);
  }

  protected exportarEstadoExtra(): Record<string, number> {
    return {};
  }

  protected importarEstadoExtra(_extra: Readonly<Record<string, number>>): void {}
}
