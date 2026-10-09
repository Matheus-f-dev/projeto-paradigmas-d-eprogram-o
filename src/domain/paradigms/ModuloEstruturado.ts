import type { CombatNotifier } from '../contracts/CombatNotifier';
import type { Destrutivel } from '../contracts/Destrutivel';
import { Guerreiro } from '../model/Guerreiro';
import { Mago } from '../model/Mago';
import type { Personagem } from '../model/Personagem';
import { takeWhile } from './ModuloFuncional';

// #region lab:estruturado
/**
 * PARADIGMA ESTRUTURADO (PDF — ModuloEstruturado).
 *
 * Procedimentos sem estado, contadores explícitos e laços for/while. O PDF
 * conclui que este estilo é um contraexemplo pedagógico (modelo de domínio
 * anêmico); por isso o jogo usa GrupoDeBatalha.realizarInvestida, e este
 * módulo existe para comparação no Laboratório e nos testes.
 */
export const ModuloEstruturado = {
  gerarPelotao(qtdGuerreiros: number, qtdMagos: number): Personagem[] {
    const exercito: Personagem[] = [];
    let id = 1;
    for (let i = 0; i < qtdGuerreiros; i++) {
      exercito.push(new Guerreiro(`Guerreiro-Recruta-${id}`, 30, 8));
      id++;
    }
    for (let j = 0; j < qtdMagos; j++) {
      exercito.push(new Mago(`Mago-Aprendiz-${id}`, 20, 12, 10));
      id++;
    }
    return exercito;
  },

  executarAtaqueEmGrupo(atacantes: readonly Personagem[], alvo: Destrutivel, notifier: CombatNotifier): void {
    let i = 0;
    const totalAtacantes = atacantes.length;
    while (i < totalAtacantes && !alvo.estaDestruido()) {
      const combatente = atacantes[i]!;
      combatente.atacar(alvo, notifier);
      i++;
    }
  },
};
// #endregion

// #region lab:batalha-funcional
/** A mesma investida no estilo funcional do PDF: "processe enquanto o alvo estiver de pé". */
export const BatalhaFuncional = {
  executarAtaqueEmGrupo(atacantes: readonly Personagem[], alvo: Destrutivel, notifier: CombatNotifier): void {
    for (const combatente of takeWhile(atacantes, () => !alvo.estaDestruido())) {
      combatente.atacar(alvo, notifier);
    }
  },
};
// #endregion
