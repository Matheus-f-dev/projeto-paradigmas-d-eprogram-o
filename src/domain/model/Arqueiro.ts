import { FlechaPerfurante } from '../abilities/FlechaPerfurante';
import type { Habilidade } from '../abilities/Habilidade';
import type { ComHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { ComRecurso, Recurso } from '../contracts/ComRecurso';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { limitar } from '../rules/calculos';
import { Personagem, type OpcoesDePersonagem } from './Personagem';

/**
 * Arqueiro — a extensão sugerida no PDF para demonstrar o OCP:
 * "Novos tipos (ex.: Arqueiro implements ComHabilidadeEspecial) são
 * adicionados sem alterar nenhuma linha das classes existentes."
 */
export class Arqueiro extends Personagem implements ComHabilidadeEspecial, ComRecurso {
  static readonly FLECHAS_MAXIMAS = 6;

  readonly classe = 'arqueiro';
  private readonly flechaPerfurante = new FlechaPerfurante();
  private flechas = Arqueiro.FLECHAS_MAXIMAS;

  constructor(nome: string, vida: number, ataque: number, opcoes: OpcoesDePersonagem = {}) {
    super(nome, vida, ataque, { tiposDeArma: ['arco', 'lamina'], ...opcoes });
  }

  usarHabilidade(alvo: Destrutivel, notifier: CombatNotifier): boolean {
    this.garantirQuePodeAgir();
    if (!this.podeUsarHabilidade()) {
      notifier.notify({ key: 'no_arrows', atorId: this.id, ator: this.getNome() });
      return false;
    }
    this.flechas -= this.flechaPerfurante.custo;
    notifier.notify({
      key: 'resource_changed',
      atorId: this.id,
      recurso: 'flechas',
      delta: -this.flechaPerfurante.custo,
      restante: this.flechas,
      maximo: Arqueiro.FLECHAS_MAXIMAS,
    });
    this.flechaPerfurante.executar(this, alvo, notifier);
    return true;
  }

  podeUsarHabilidade(): boolean {
    return !this.estaDestruido() && this.flechas >= this.flechaPerfurante.custo;
  }

  getHabilidade(): Habilidade {
    return this.flechaPerfurante;
  }

  getRecurso(): Recurso {
    return { tipo: 'flechas', atual: this.flechas, maximo: Arqueiro.FLECHAS_MAXIMAS };
  }

  override descansar(): void {
    super.descansar();
    this.flechas = Arqueiro.FLECHAS_MAXIMAS;
  }

  protected override exportarEstadoExtra(): Record<string, number> {
    return { flechas: this.flechas };
  }

  protected override importarEstadoExtra(extra: Readonly<Record<string, number>>): void {
    if (extra.flechas !== undefined) this.flechas = limitar(Math.round(extra.flechas), Arqueiro.FLECHAS_MAXIMAS);
  }
}
