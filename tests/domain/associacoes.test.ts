import { describe, expect, it } from 'vitest';
import { AcaoInvalidaError } from '../../src/domain/combat/erros';
import { Arma } from '../../src/domain/equipment/Arma';
import { Inventario } from '../../src/domain/equipment/Inventario';
import { CatalogoDeItens } from '../../src/domain/equipment/catalogoDeItens';
import { Bau } from '../../src/domain/model/Bau';
import { GrupoDeBatalha } from '../../src/domain/model/GrupoDeBatalha';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { NotificadorDeTeste } from '../helpers';

describe('Composição — Personagem contém Membros', () => {
  it('cria os próprios membros no construtor (Braço e Perna, como no PDF)', () => {
    const demogorgon = new Inimigo('Demogorgon', 50, 15);
    const membros = demogorgon.getMembros();
    expect(membros.map((m) => m.getNome())).toEqual(['Braço de Demogorgon', 'Perna de Demogorgon']);
    expect(membros.map((m) => m.getVida())).toEqual([12, 18]);
    expect(membros.every((m) => m.donoId === demogorgon.id)).toBe(true);
  });

  it('reproduz o Main do PDF: agregação da arma e composição dos membros', () => {
    const notifier = new NotificadorDeTeste();
    const mike = new Guerreiro('Mike', 30, 6);
    const dustin = new Guerreiro('Dustin', 25, 4);
    const demogorgon = new Inimigo('Demogorgon', 50, 15);

    // 1. Agregação: a arma existe antes de pertencer a alguém.
    const espadaLendaria = new Arma('vorpal', 'espada-vorpal', 'Espada Vorpal', 10, 'lamina');
    mike.equiparArma(espadaLendaria, notifier);

    // 2. Composição: Mike ataca o braço do monstro (6 + 10 = 16 decepa o braço de 12).
    const bracoDoMonstro = demogorgon.getMembros()[0]!;
    mike.atacar(bracoDoMonstro, notifier);
    expect(bracoDoMonstro.estaDestruido()).toBe(true);
    expect(notifier.doTipo('limb_severed')[0]).toMatchObject({ donoId: 'demogorgon', penalidade: 3 });
    expect(demogorgon.getVida()).toBe(50); // o golpe no membro não atinge a vida do corpo
    expect(demogorgon.getAtaque()).toBe(12); // braço perdido reduz o ataque

    // 3. Morte do portador e queda da arma. No PDF bastam dois golpes de 15;
    // aqui o braço decepado reduziu o ataque para 12, então são necessários três.
    demogorgon.atacar(mike, notifier);
    demogorgon.atacar(mike, notifier);
    expect(mike.estaDestruido()).toBe(false);
    demogorgon.atacar(mike, notifier);
    expect(mike.estaDestruido()).toBe(true);
    const armaNoChao = mike.droparArmaAoMorrer(notifier);
    expect(armaNoChao).toBe(espadaLendaria);
    expect(mike.getArma()).toBeNull();

    // 4. Reutilização do objeto agregado.
    dustin.equiparArma(armaNoChao!, notifier);
    dustin.atacar(demogorgon, notifier);
    expect(demogorgon.getVida()).toBe(50 - 14);
  });

  it('a derrota definitiva encerra o ciclo de vida de todos os membros', () => {
    const notifier = new NotificadorDeTeste();
    const goblin = new Inimigo('Goblin', 10, 3);
    expect(goblin.getMembros().some((m) => !m.estaDestruido())).toBe(true);
    goblin.receberDano(10, notifier);
    expect(goblin.getMembros().every((m) => m.estaDestruido())).toBe(true);
  });

  it('membros não podem ser adicionados ou removidos por fora do Personagem', () => {
    const goblin = new Inimigo('Goblin', 10, 3);
    const membros = goblin.getMembros() as unknown[];
    expect(() => membros.push('intruso')).toThrow(TypeError);
    expect(() => membros.pop()).toThrow(TypeError);
    expect(goblin.getMembros()).toHaveLength(2);
  });
});

describe('Agregação — Arma, Armadura, Inventário, Baú e Grupo', () => {
  it('equipar devolve a arma anterior, que continua existindo', () => {
    const notifier = new NotificadorDeTeste();
    const catalogo = new CatalogoDeItens();
    const mike = new Guerreiro('Mike', 40, 8);
    const espada = catalogo.criarArma('espada-longa');
    const vorpal = catalogo.criarArma('espada-vorpal');
    expect(mike.equiparArma(espada, notifier)).toBeNull();
    expect(mike.equiparArma(vorpal, notifier)).toBe(espada);
    expect(mike.getAtaque()).toBe(8 + 6);
  });

  it('restringe armas por classe', () => {
    const notifier = new NotificadorDeTeste();
    const catalogo = new CatalogoDeItens();
    const mike = new Guerreiro('Mike', 40, 8);
    expect(() => mike.equiparArma(catalogo.criarArma('cajado-de-carvalho'), notifier)).toThrow(AcaoInvalidaError);
    const eleven = new Mago('Eleven', 30, 6, 20);
    expect(() => eleven.equiparArma(catalogo.criarArma('cajado-de-carvalho'), notifier)).not.toThrow();
  });

  it('transferência: a arma sai de um personagem e vai para outro sem ser recriada', () => {
    const notifier = new NotificadorDeTeste();
    const catalogo = new CatalogoDeItens();
    const inventario = new Inventario();
    const mike = new Guerreiro('Mike', 40, 8);
    const dustin = new Guerreiro('Dustin', 25, 4);
    const espada = catalogo.criarArma('espada-longa');
    mike.equiparArma(espada, notifier);

    const retirada = mike.desequiparArma()!;
    inventario.adicionar(retirada);
    dustin.equiparArma(inventario.retirar(retirada.id) as Arma, notifier);

    expect(dustin.getArma()).toBe(espada);
    expect(mike.getArma()).toBeNull();
    expect(inventario.listar()).toHaveLength(0);
  });

  it('itens de um baú sobrevivem à destruição do baú', () => {
    const notifier = new NotificadorDeTeste();
    const catalogo = new CatalogoDeItens();
    const pocao = catalogo.criar('pocao-de-vida');
    const bau = new Bau('bau', 'Baú Antigo', 5, [pocao]);
    bau.receberDano(5, notifier);
    expect(bau.estaDestruido()).toBe(true);
    expect(notifier.doTipo('chest_broken')[0]?.catalogoIds).toEqual(['pocao-de-vida']);
    const itens = bau.retirarItens();
    expect(itens).toEqual([pocao]);
    expect(bau.getItens()).toHaveLength(0);
  });

  it('desfazer o grupo não destrói os personagens', () => {
    const mike = new Guerreiro('Mike', 40, 8);
    const eleven = new Mago('Eleven', 30, 6, 20);
    const grupo = new GrupoDeBatalha([mike, eleven]);
    const membros = grupo.desfazer();
    expect(grupo.getMembros()).toHaveLength(0);
    expect(membros).toEqual([mike, eleven]);
    expect(mike.getVida()).toBe(40);
  });

  it('inventário rejeita retirada de item inexistente e conta por modelo com reduce', () => {
    const catalogo = new CatalogoDeItens();
    const inventario = new Inventario();
    inventario.adicionar(catalogo.criar('pocao-de-vida'));
    inventario.adicionar(catalogo.criar('pocao-de-vida'));
    inventario.adicionar(catalogo.criar('pocao-de-mana'));
    expect(inventario.contarPorModelo()).toEqual({ 'pocao-de-vida': 2, 'pocao-de-mana': 1 });
    expect(() => inventario.retirar('nao-existe')).toThrow(AcaoInvalidaError);
  });
});
