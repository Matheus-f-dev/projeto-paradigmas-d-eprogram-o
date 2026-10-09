import { possuiHabilidadeEspecial } from '../contracts/ComHabilidadeEspecial';
import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import type { Personagem } from './Personagem';

// #region lab:grupo
/**
 * GrupoDeBatalha (PDF — "Pelotao"/"GrupoDeBatalha"): AGREGA personagens.
 * Desfeito o grupo, os personagens continuam existindo.
 *
 * realizarInvestida é o "ataque coordenado dos aliados" do PDF: cada membro
 * usa a habilidade especial se a possuir (ISP) e, caso contrário, o ataque
 * padrão — todos tratados de forma uniforme como Personagem (LSP).
 */
export class GrupoDeBatalha {
  private readonly membros: Personagem[] = [];

  constructor(membros: readonly Personagem[] = []) {
    membros.forEach((membro) => this.adicionar(membro));
  }

  adicionar(personagem: Personagem): void {
    if (!this.membros.includes(personagem)) this.membros.push(personagem);
  }

  remover(personagem: Personagem): void {
    const indice = this.membros.indexOf(personagem);
    if (indice >= 0) this.membros.splice(indice, 1);
  }

  realizarInvestida(alvo: Destrutivel, notifier: CombatNotifier): void {
    for (const membro of this.vivos()) {
      if (alvo.estaDestruido()) break; // interrompe se o alvo já sucumbiu
      if (possuiHabilidadeEspecial(membro) && membro.podeUsarHabilidade()) {
        membro.usarHabilidade(alvo, notifier);
      } else {
        membro.atacar(alvo, notifier); // sem habilidade: ataque padrão
      }
    }
  }
  // #endregion

  getMembros(): readonly Personagem[] {
    return this.membros;
  }

  vivos(): Personagem[] {
    return this.membros.filter((membro) => !membro.estaDestruido());
  }

  todosDerrotados(): boolean {
    return this.membros.every((membro) => membro.estaDestruido());
  }

  encontrar(id: string): Personagem | undefined {
    return this.membros.find((membro) => membro.id === id);
  }

  /** Desfaz o grupo e devolve os personagens, que continuam existindo (agregação). */
  desfazer(): Personagem[] {
    return this.membros.splice(0, this.membros.length);
  }
}
