import { describe, expect, it } from 'vitest';
import { BolaDeFogo } from '../../src/domain/abilities/BolaDeFogo';
import { GolpeBrutal } from '../../src/domain/abilities/GolpeBrutal';
import { Arma } from '../../src/domain/equipment/Arma';
import { Armadura } from '../../src/domain/equipment/Armadura';
import { Arqueiro } from '../../src/domain/model/Arqueiro';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { NotificadorDeTeste } from '../helpers';

describe('Golpe Brutal (Guerreiro)', () => {
  it('causa ataque + 5 de dano e consome fúria', () => {
    const notifier = new NotificadorDeTeste();
    const guerreiro = new Guerreiro('Mike', 40, 8);
    const alvo = new Inimigo('Demogorgon', 100, 50);
    expect(guerreiro.getRecurso().atual).toBe(Guerreiro.FURIA_INICIAL);

    expect(guerreiro.usarHabilidade(alvo, notifier)).toBe(true);
    expect(alvo.getVida()).toBe(100 - (8 + GolpeBrutal.BONUS));
    expect(guerreiro.getRecurso().atual).toBe(Guerreiro.FURIA_INICIAL - 5);
    expect(notifier.chaves()).toContain('brutal_strike');
  });

  it('o bônus da arma também entra no Golpe Brutal', () => {
    const notifier = new NotificadorDeTeste();
    const guerreiro = new Guerreiro('Mike', 40, 8);
    guerreiro.equiparArma(new Arma('e1', 'espada-longa', 'Espada Longa', 3, 'lamina'), notifier);
    const alvo = new Inimigo('Alvo', 100, 1);
    guerreiro.usarHabilidade(alvo, notifier);
    expect(alvo.getVida()).toBe(100 - 16);
  });

  it('sem fúria suficiente não causa dano e emite no_fury', () => {
    const notifier = new NotificadorDeTeste();
    const guerreiro = new Guerreiro('Mike', 40, 8);
    const alvo = new Inimigo('Alvo', 100, 1);
    guerreiro.usarHabilidade(alvo, notifier); // fúria 5 → 0
    notifier.limpar();
    expect(guerreiro.podeUsarHabilidade()).toBe(false);
    expect(guerreiro.usarHabilidade(alvo, notifier)).toBe(false);
    expect(alvo.getVida()).toBe(87);
    expect(notifier.chaves()).toEqual(['no_fury']);
  });

  it('a fúria é recuperada ao atacar e ao receber dano, limitada ao máximo', () => {
    const notifier = new NotificadorDeTeste();
    const guerreiro = new Guerreiro('Mike', 40, 8);
    const alvo = new Inimigo('Alvo', 100, 1);
    guerreiro.atacar(alvo, notifier); // 5 + 3 = 8
    guerreiro.receberDano(1, notifier); // 8 + 2 = 10
    guerreiro.atacar(alvo, notifier); // limitado a 10
    expect(guerreiro.getRecurso()).toEqual({ tipo: 'furia', atual: 10, maximo: 10 });
  });
});

describe('Bola de Fogo (Mago)', () => {
  it('causa ataque + 10 de dano e consome 5 de mana', () => {
    const notifier = new NotificadorDeTeste();
    const mago = new Mago('Eleven', 30, 6, 20);
    const alvo = new Inimigo('Demogorgon', 100, 50);
    mago.usarHabilidade(alvo, notifier);
    expect(alvo.getVida()).toBe(100 - (6 + BolaDeFogo.BONUS));
    expect(mago.getMana()).toBe(15);
    const [gasto] = notifier.doTipo('resource_changed');
    expect(gasto).toMatchObject({ recurso: 'mana', delta: -5, restante: 15, maximo: 20 });
  });

  it('com menos de 5 de mana avisa "não tem mana" sem causar dano (PDF)', () => {
    const notifier = new NotificadorDeTeste();
    const mago = new Mago('Eleven', 30, 6, 7);
    const alvo = new Inimigo('Alvo', 100, 1);
    expect(mago.usarHabilidade(alvo, notifier)).toBe(true); // 7 → 2
    notifier.limpar();
    expect(mago.usarHabilidade(alvo, notifier)).toBe(false);
    expect(mago.getMana()).toBe(2);
    expect(alvo.getVida()).toBe(84);
    expect(notifier.chaves()).toEqual(['no_mana']);
  });

  it('a mana nunca fica negativa e a restauração respeita o máximo', () => {
    const notifier = new NotificadorDeTeste();
    const mago = new Mago('Eleven', 30, 6, 10);
    const alvo = new Inimigo('Alvo', 500, 1);
    for (let i = 0; i < 5; i++) mago.usarHabilidade(alvo, notifier);
    expect(mago.getMana()).toBe(0);
    expect(mago.restaurarMana(99, notifier)).toBe(10);
    expect(mago.getMana()).toBe(10);
  });

  it('o descanso recupera parte da mana (polimorfismo de descansar)', () => {
    const notifier = new NotificadorDeTeste();
    const mago = new Mago('Eleven', 30, 6, 20);
    const alvo = new Inimigo('Alvo', 500, 1);
    for (let i = 0; i < 4; i++) mago.usarHabilidade(alvo, notifier);
    mago.descansar();
    expect(mago.getMana()).toBe(10);
  });
});

describe('Flecha Perfurante (Arqueiro)', () => {
  it('ignora a armadura do alvo e consome uma flecha', () => {
    const notifier = new NotificadorDeTeste();
    const arqueiro = new Arqueiro('Will', 32, 7);
    const alvo = new Inimigo('Cavaleiro', 50, 5);
    alvo.equiparArmadura(new Armadura('a', 'cota-de-malha', 'Cota de Malha', 2), notifier);
    arqueiro.usarHabilidade(alvo, notifier);
    expect(alvo.getVida()).toBe(50 - 11);
    expect(arqueiro.getRecurso().atual).toBe(Arqueiro.FLECHAS_MAXIMAS - 1);
    arqueiro.atacar(alvo, notifier); // ataque físico comum sofre a defesa
    expect(alvo.getVida()).toBe(39 - 5);
  });

  it('sem flechas não pode usar a habilidade; o descanso reabastece', () => {
    const notifier = new NotificadorDeTeste();
    const arqueiro = new Arqueiro('Will', 32, 7);
    const alvo = new Inimigo('Alvo', 500, 1);
    for (let i = 0; i < Arqueiro.FLECHAS_MAXIMAS; i++) arqueiro.usarHabilidade(alvo, notifier);
    expect(arqueiro.usarHabilidade(alvo, notifier)).toBe(false);
    expect(notifier.chaves().at(-1)).toBe('no_arrows');
    arqueiro.descansar();
    expect(arqueiro.podeUsarHabilidade()).toBe(true);
  });
});
