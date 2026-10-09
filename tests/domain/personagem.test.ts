import { describe, expect, it } from 'vitest';
import { AcaoInvalidaError } from '../../src/domain/combat/erros';
import { Armadura } from '../../src/domain/equipment/Armadura';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { NotificadorDeTeste } from '../helpers';

describe('Personagem — atributos, ataque e recebimento de dano', () => {
  it('reproduz a batalha do PDF (Aragorn, Luna e Goblin)', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Aragorn', 40, 8);
    const feiticeiro = new Mago('Luna', 30, 6, 20);
    const monstro = new Inimigo('Goblin', 25, 5);

    heroi.atacar(monstro, notifier); // 25 - 8 = 17
    feiticeiro.usarHabilidade(monstro, notifier); // 17 - (6 + 10) = 1
    monstro.atacar(heroi, notifier); // 40 - 5 = 35

    expect(heroi.getVida()).toBe(35);
    expect(feiticeiro.getVida()).toBe(30);
    expect(feiticeiro.getMana()).toBe(15);
    expect(monstro.getVida()).toBe(1);
    expect(notifier.chaves()).toEqual([
      'attack',
      'damage_received',
      'resource_changed', // fúria do guerreiro após atacar
      'resource_changed', // mana gasta pelo mago
      'fireball',
      'damage_received',
      'attack',
      'damage_received',
      'resource_changed', // fúria do guerreiro ao ser atingido
    ]);
  });

  it('o ataque emitido informa o dano real calculado pelo domínio', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Mike', 40, 8);
    const alvo = new Inimigo('Goblin', 25, 5);
    heroi.atacar(alvo, notifier);
    const [ataque] = notifier.doTipo('attack');
    const [dano] = notifier.doTipo('damage_received');
    expect(ataque?.dano).toBe(8);
    expect(dano).toMatchObject({ alvoId: 'goblin', valor: 8, restante: 17, maximo: 25 });
  });

  it('a vida nunca fica negativa e o personagem é derrotado ao chegar a zero', () => {
    const notifier = new NotificadorDeTeste();
    const goblin = new Inimigo('Goblin', 10, 3);
    goblin.receberDano(999, notifier);
    expect(goblin.getVida()).toBe(0);
    expect(goblin.estaDestruido()).toBe(true);
    expect(goblin.foiDerrotadoDefinitivamente()).toBe(true);
    expect(notifier.chaves()).toEqual(['damage_received', 'defeated']);
  });

  it('dano em quem já foi derrotado é ignorado (sem eventos duplicados)', () => {
    const notifier = new NotificadorDeTeste();
    const goblin = new Inimigo('Goblin', 5, 3);
    goblin.receberDano(5, notifier);
    notifier.limpar();
    goblin.receberDano(5, notifier);
    expect(notifier.eventos).toEqual([]);
    expect(goblin.getVida()).toBe(0);
  });

  it('personagem derrotado não pode atacar', () => {
    const notifier = new NotificadorDeTeste();
    const goblin = new Inimigo('Goblin', 5, 3);
    const heroi = new Guerreiro('Mike', 40, 8);
    goblin.receberDano(5, notifier);
    expect(() => goblin.atacar(heroi, notifier)).toThrow(AcaoInvalidaError);
    expect(heroi.getVida()).toBe(40);
  });

  it('rejeita valores de dano inválidos e construções inconsistentes', () => {
    const notifier = new NotificadorDeTeste();
    const goblin = new Inimigo('Goblin', 10, 3);
    expect(() => goblin.receberDano(Number.NaN, notifier)).toThrow(RangeError);
    expect(() => new Inimigo('Goblin', 0, 3)).toThrow(RangeError);
    expect(() => new Inimigo('', 10, 3)).toThrow(RangeError);
    expect(() => new Mago('Luna', 30, 6, -1)).toThrow(RangeError);
    goblin.receberDano(-5, notifier); // valor negativo é tratado como zero, nunca como cura
    expect(goblin.getVida()).toBe(10);
  });

  it('a armadura reduz o dano seguindo a regra max(1, valor - defesa)', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Mike', 40, 8);
    heroi.equiparArmadura(new Armadura('a1', 'cota-de-malha', 'Cota de Malha', 2), notifier);
    heroi.receberDano(5, notifier);
    expect(heroi.getVida()).toBe(37);
    heroi.receberDano(1, notifier);
    expect(heroi.getVida()).toBe(36); // nunca menos de 1 de dano
    const danos = notifier.doTipo('damage_received');
    expect(danos[0]).toMatchObject({ valor: 3, absorvido: 2 });
  });

  it('mostrarStatus notifica a vida atual em vez de imprimir no console (SRP)', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Mike', 40, 8);
    heroi.mostrarStatus(notifier);
    expect(notifier.eventos).toEqual([{ key: 'status', alvoId: 'mike', alvo: 'Mike', vida: 40 }]);
  });

  it('getStatus expõe uma cópia do estado, sem permitir alteração interna', () => {
    const heroi = new Guerreiro('Mike', 40, 8);
    const status = heroi.getStatus() as { vida: number };
    status.vida = 999;
    expect(heroi.getVida()).toBe(40);
  });

  it('cura respeita o máximo e não pode ser aplicada em derrotados', () => {
    const notifier = new NotificadorDeTeste();
    const heroi = new Guerreiro('Mike', 40, 8);
    heroi.receberDano(10, notifier);
    expect(heroi.receberCura(50, notifier)).toBe(10);
    expect(heroi.getVida()).toBe(40);
    expect(() => heroi.receberCura(-1, notifier)).toThrow(AcaoInvalidaError);
    const goblin = new Inimigo('Goblin', 5, 3);
    goblin.receberDano(5, notifier);
    expect(() => goblin.receberCura(5, notifier)).toThrow(AcaoInvalidaError);
  });
});
