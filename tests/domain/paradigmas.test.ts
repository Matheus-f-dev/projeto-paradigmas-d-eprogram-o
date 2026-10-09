import { describe, expect, it } from 'vitest';
import { GrupoDeBatalha } from '../../src/domain/model/GrupoDeBatalha';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { BatalhaFuncional, ModuloEstruturado } from '../../src/domain/paradigms/ModuloEstruturado';
import { curarEFortificar, takeWhile, type FichaDeCombatente } from '../../src/domain/paradigms/ModuloFuncional';
import { BaseDeConhecimento, criarBaseDeAfinidadesDoJogo } from '../../src/domain/paradigms/ModuloLogico';
import { calcularDanoAposDefesa, calcularCura, calcularAtaqueTotal } from '../../src/domain/rules/calculos';
import { NotificadorDeTeste } from '../helpers';

const ficha = (id: string, vida: number, vidaMaxima = 50): FichaDeCombatente =>
  Object.freeze({ id, nome: id, vida, vidaMaxima, ataque: 8, bonusTemporario: 0 });

describe('Paradigma funcional — curarEFortificar', () => {
  it('filtra quem está abaixo do corte e multiplica a vida (exemplo do PDF)', () => {
    const veteranos = [ficha('Thorin', 15), ficha('Gandalf', 40), ficha('Boromir', 8)];
    const fortificados = curarEFortificar(veteranos, 25, 3);
    expect(fortificados.map((f) => [f.nome, f.vida])).toEqual([
      ['Thorin', 45],
      ['Boromir', 24],
    ]);
  });

  it('não altera a lista nem as fichas originais (imutabilidade)', () => {
    const veteranos = Object.freeze([ficha('Thorin', 15), ficha('Boromir', 8)]);
    const copia = JSON.stringify(veteranos);
    const resultado = curarEFortificar(veteranos, 25, 3, 2);
    expect(JSON.stringify(veteranos)).toBe(copia);
    expect(resultado[0]).not.toBe(veteranos[0]);
    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado[0])).toBe(true);
  });

  it('respeita a vida máxima e ignora derrotados', () => {
    const resultado = curarEFortificar([ficha('A', 20, 30), ficha('B', 0, 30)], 25, 3, 2);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({ vida: 30, bonusTemporario: 2, ataque: 10 });
  });

  it('funções puras: mesma entrada, mesma saída', () => {
    expect(calcularDanoAposDefesa(10, 3)).toBe(7);
    expect(calcularDanoAposDefesa(2, 5)).toBe(1);
    expect(calcularDanoAposDefesa(10, 3, 'perfurante')).toBe(10);
    expect(calcularDanoAposDefesa(0, 3)).toBe(0);
    expect(calcularCura(28, 30, 10)).toBe(30);
    expect(calcularAtaqueTotal(8, 3, 2, 20)).toBe(1);
  });

  it('takeWhile interrompe o fluxo assim que a condição falha', () => {
    expect([...takeWhile([1, 2, 3, 10, 4], (n) => n < 5)]).toEqual([1, 2, 3]);
  });
});

describe('Paradigma lógico — BaseDeConhecimento', () => {
  it('infere os multiplicadores do exemplo do PDF', () => {
    const base = new BaseDeConhecimento();
    base.declararFato('fraqueza', 'fogo', 'demogorgon');
    base.declararRegra({ predicado: 'fraqueza', arg1: 'fogo', arg2: 'demogorgon' }, 'CRITICO');
    base.declararFato('fraqueza', 'gelo', 'golem');
    base.declararRegra({ predicado: 'fraqueza', arg1: 'gelo', arg2: 'golem' }, 'RESISTENTE');

    expect(base.inferirMultiplicadorDano('fogo', 'demogorgon')).toBe(2.0);
    expect(base.inferirMultiplicadorDano('raio', 'demogorgon')).toBe(1.0);
    expect(base.inferirMultiplicadorDano('GELO', 'Golem')).toBe(0.5);
  });

  it('uma regra sem o fato correspondente não é aplicada', () => {
    const base = new BaseDeConhecimento();
    base.declararRegra({ predicado: 'fraqueza', arg1: 'fogo', arg2: 'goblin' }, 'CRITICO');
    expect(base.inferirMultiplicadorDano('fogo', 'goblin')).toBe(1.0);
  });

  it('o inimigo consulta a base: a Bola de Fogo causa dano dobrado no Demogorgon', () => {
    const notifier = new NotificadorDeTeste();
    const afinidades = criarBaseDeAfinidadesDoJogo();
    const demogorgon = new Inimigo('Demogorgon', 100, 10, { tipoCriatura: 'demogorgon', afinidades });
    const eleven = new Mago('Eleven', 30, 6, 20);
    eleven.usarHabilidade(demogorgon, notifier);
    expect(demogorgon.getVida()).toBe(100 - 32);
    expect(notifier.doTipo('weakness')[0]).toMatchObject({ elemento: 'fogo', multiplicador: 2 });
  });

  it('mortos-vivos resistem a dano físico', () => {
    const notifier = new NotificadorDeTeste();
    const afinidades = criarBaseDeAfinidadesDoJogo();
    const zumbi = new Inimigo('Sentinela', 40, 5, { tipoCriatura: 'morto-vivo', afinidades });
    new Guerreiro('Mike', 40, 10).atacar(zumbi, notifier);
    expect(zumbi.getVida()).toBe(35);
  });
});

describe('Paradigma estruturado × POO × funcional — a mesma investida', () => {
  it('gerarPelotao cria guerreiros e magos com ids sequenciais', () => {
    const pelotao = ModuloEstruturado.gerarPelotao(2, 1);
    expect(pelotao.map((p) => p.getNome())).toEqual(['Guerreiro-Recruta-1', 'Guerreiro-Recruta-2', 'Mago-Aprendiz-3']);
    expect(pelotao[2]).toBeInstanceOf(Mago);
  });

  it('as três versões param quando o alvo é destruído e produzem o mesmo resultado', () => {
    const resultados = [
      (atacantes: Guerreiro[], alvo: Inimigo, n: NotificadorDeTeste) => ModuloEstruturado.executarAtaqueEmGrupo(atacantes, alvo, n),
      (atacantes: Guerreiro[], alvo: Inimigo, n: NotificadorDeTeste) => BatalhaFuncional.executarAtaqueEmGrupo(atacantes, alvo, n),
      (atacantes: Guerreiro[], alvo: Inimigo, n: NotificadorDeTeste) => {
        // O GrupoDeBatalha usa habilidades; para comparar apenas ataques, esgotamos a fúria antes.
        atacantes.forEach((g) => g.usarHabilidade(new Inimigo('Saco', 999, 0), new NotificadorDeTeste()));
        new GrupoDeBatalha(atacantes).realizarInvestida(alvo, n);
      },
    ].map((executar) => {
      const notifier = new NotificadorDeTeste();
      const atacantes = [new Guerreiro('A', 30, 8), new Guerreiro('B', 30, 8), new Guerreiro('C', 30, 8)];
      const alvo = new Inimigo('Alvo', 15, 1);
      executar(atacantes, alvo, notifier);
      return { vida: alvo.getVida(), ataques: notifier.doTipo('attack').length };
    });
    expect(resultados).toEqual([
      { vida: 0, ataques: 2 },
      { vida: 0, ataques: 2 },
      { vida: 0, ataques: 2 },
    ]);
  });
});
