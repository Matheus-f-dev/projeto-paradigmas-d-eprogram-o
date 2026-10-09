import { describe, expect, it } from 'vitest';
import { possuiHabilidadeEspecial } from '../../src/domain/contracts/ComHabilidadeEspecial';
import type { Destrutivel } from '../../src/domain/contracts/Destrutivel';
import { Arqueiro } from '../../src/domain/model/Arqueiro';
import { Bau } from '../../src/domain/model/Bau';
import { Chefe } from '../../src/domain/model/Chefe';
import { Fortaleza } from '../../src/domain/model/Fortaleza';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import type { Personagem } from '../../src/domain/model/Personagem';
import { Zumbi } from '../../src/domain/model/Zumbi';
import { NotificadorDeTeste } from '../helpers';

describe('LSP + ISP — o exemplo do monstro domado do PDF', () => {
  it('trata Guerreiro, Mago e Inimigo de modo uniforme sem erro', () => {
    const notifier = new NotificadorDeTeste();
    const heroi: Personagem = new Guerreiro('Mike', 40, 8);
    const feiticeira: Personagem = new Mago('Eleven', 30, 6, 20);
    const monstrinho: Personagem = new Inimigo('Dart', 25, 5);
    const monstrao: Personagem = new Inimigo('Demogorgon', 100, 50);

    const aliados = [heroi, feiticeira, monstrinho];
    for (const p of aliados) {
      if (possuiHabilidadeEspecial(p)) p.usarHabilidade(monstrao, notifier);
      else p.atacar(monstrao, notifier); // personagens sem habilidade usam o ataque padrão
    }

    // 100 - (8 + 5) - (6 + 10) - 5 = 66
    expect(monstrao.getVida()).toBe(66);
    expect(notifier.doTipo('brutal_strike')).toHaveLength(1);
    expect(notifier.doTipo('fireball')).toHaveLength(1);
    expect(notifier.doTipo('attack').map((e) => e.ator)).toEqual(['Dart']);
  });

  it('Inimigo comum não é obrigado a implementar a habilidade especial (ISP)', () => {
    expect(possuiHabilidadeEspecial(new Inimigo('Goblin', 10, 2))).toBe(false);
    expect(possuiHabilidadeEspecial(new Guerreiro('Mike', 40, 8))).toBe(true);
    expect(possuiHabilidadeEspecial(new Chefe('Boss', 40, 8))).toBe(true);
  });

  it('todas as especializações respeitam o contrato de Personagem', () => {
    const notifier = new NotificadorDeTeste();
    const especializacoes: Personagem[] = [
      new Guerreiro('G', 20, 4),
      new Mago('M', 20, 4, 10),
      new Arqueiro('A', 20, 4),
      new Inimigo('I', 20, 4),
      new Zumbi('Z', 20, 4),
      new Chefe('C', 20, 4),
    ];
    for (const personagem of especializacoes) {
      personagem.receberDano(7, notifier);
      expect(personagem.getVida()).toBeLessThanOrEqual(personagem.getVidaMaxima());
      expect(personagem.getVida()).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < 20; i++) personagem.receberDano(9, notifier);
      // Cada um pode adiar a derrota à sua maneira, mas no fim todos são derrotados
      // e a vida jamais fica negativa.
      expect(personagem.getVida()).toBe(0);
      expect(personagem.estaDestruido()).toBe(true);
    }
  });
});

describe('DIP — atacar depende da abstração Destrutivel', () => {
  it('o mesmo atacar() funciona contra baú e fortaleza (exemplo do PDF)', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Mike', 40, 8);
    const feiticeira = new Mago('Eleven', 30, 6, 20);
    const bauDeMadeira: Destrutivel = new Bau('bau', 'Baú Antigo', 12);
    const portaoForte: Destrutivel = new Fortaleza('portao', 'Portão da Cidadela', 20);

    heroi.atacar(bauDeMadeira, notifier);
    feiticeira.atacar(portaoForte, notifier);
    heroi.usarHabilidade(portaoForte, notifier);

    expect(bauDeMadeira.getVida()).toBe(4);
    // Fortaleza: max(1, 6 - 3) = 3 e depois max(1, 13 - 3) = 10
    expect(portaoForte.getVida()).toBe(20 - 3 - 10);
    expect(notifier.chaves()).toContain('chest_damage');
    expect(notifier.chaves()).toContain('fortress_damage');
  });

  it('a fortaleza ruirá e o baú quebrará ao chegar a zero', () => {
    const notifier = new NotificadorDeTeste();
    const bau = new Bau('bau', 'Baú Antigo', 5);
    const portao = new Fortaleza('portao', 'Portão', 2);
    bau.receberDano(10, notifier);
    portao.receberDano(1, notifier); // mínimo de 1 de dano
    portao.receberDano(1, notifier);
    expect(bau.estaDestruido()).toBe(true);
    expect(portao.estaDestruido()).toBe(true);
    expect(notifier.chaves()).toEqual(['chest_damage', 'chest_broken', 'fortress_damage', 'fortress_damage', 'fortress_broken']);
  });
});

describe('OCP — novas regras de derrota sem alterar receberDano', () => {
  it('o Zumbi se reergue uma única vez', () => {
    const notifier = new NotificadorDeTeste();
    const zumbi = new Zumbi('Sentinela', 20, 4);
    zumbi.receberDano(20, notifier);
    expect(zumbi.estaDestruido()).toBe(false);
    expect(zumbi.getVida()).toBe(10);
    expect(notifier.chaves()).toEqual(['damage_received', 'revived']);
    zumbi.receberDano(10, notifier);
    expect(zumbi.estaDestruido()).toBe(true);
    expect(zumbi.foiDerrotadoDefinitivamente()).toBe(true);
    expect(notifier.chaves().at(-1)).toBe('defeated');
  });

  it('o Chefe muda de fase ao zerar a vida pela primeira vez', () => {
    const notifier = new NotificadorDeTeste();
    const chefe = new Chefe('Demogorgon', 60, 10, { vidaDaSegundaFase: 35, bonusDaSegundaFase: 4 });
    chefe.receberDano(60, notifier);
    expect(chefe.getVida()).toBe(35);
    expect(chefe.getAtaque()).toBe(14);
    expect(notifier.doTipo('phase_change')[0]).toMatchObject({ fase: 2, vida: 35, bonusAtaque: 4 });
    chefe.receberDano(35, notifier);
    expect(chefe.foiDerrotadoDefinitivamente()).toBe(true);
  });

  it('o Chefe só usa a Investida Sombria depois da recarga', () => {
    const notifier = new NotificadorDeTeste();
    const chefe = new Chefe('Demogorgon', 60, 10);
    const heroi = new Guerreiro('Mike', 100, 8);
    expect(chefe.podeUsarHabilidade()).toBe(false);
    chefe.iniciarTurno();
    chefe.iniciarTurno();
    chefe.iniciarTurno();
    expect(chefe.usarHabilidade(heroi, notifier)).toBe(true);
    expect(heroi.getVida()).toBe(100 - 16);
    expect(chefe.podeUsarHabilidade()).toBe(false);
  });
});
