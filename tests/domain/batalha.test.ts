import { describe, expect, it } from 'vitest';
import { Batalha } from '../../src/domain/combat/Batalha';
import { DerrotarInimigosEDestruir, DerrotarTodosOsInimigos } from '../../src/domain/combat/condicoesDeVitoria';
import { AcaoInvalidaError } from '../../src/domain/combat/erros';
import { CatalogoDeItens } from '../../src/domain/equipment/catalogoDeItens';
import { Inventario } from '../../src/domain/equipment/Inventario';
import { Bau } from '../../src/domain/model/Bau';
import { Fortaleza } from '../../src/domain/model/Fortaleza';
import { GrupoDeBatalha } from '../../src/domain/model/GrupoDeBatalha';
import { Guerreiro } from '../../src/domain/model/Guerreiro';
import { Inimigo } from '../../src/domain/model/Inimigo';
import { Mago } from '../../src/domain/model/Mago';
import { Inconsciencia } from '../../src/domain/rules/politicasDeDerrota';
import { NotificadorDeTeste } from '../helpers';

function montar(opcoes: { vidaGoblin?: number; ataqueGoblin?: number; comBau?: boolean; comPortao?: boolean } = {}) {
  const catalogo = new CatalogoDeItens();
  const inventario = new Inventario();
  const mike = new Guerreiro('Mike', 40, 8, { id: 'mike', politicaDeDerrota: new Inconsciencia() });
  const eleven = new Mago('Eleven', 30, 6, 20, { id: 'eleven', politicaDeDerrota: new Inconsciencia() });
  const goblin = new Inimigo('Goblin', opcoes.vidaGoblin ?? 25, opcoes.ataqueGoblin ?? 5, { id: 'goblin' });
  const cenario = [];
  if (opcoes.comBau) cenario.push(new Bau('bau', 'Baú Antigo', 5, [catalogo.criar('pocao-de-vida')]));
  if (opcoes.comPortao) cenario.push(new Fortaleza('portao', 'Portão', 4));
  const batalha = new Batalha({
    herois: new GrupoDeBatalha([mike, eleven]),
    inimigos: [goblin],
    cenario,
    inventario,
    condicaoDeVitoria: opcoes.comPortao ? new DerrotarInimigosEDestruir('portao') : new DerrotarTodosOsInimigos(),
  });
  const notifier = new NotificadorDeTeste();
  batalha.iniciar(notifier);
  return { batalha, notifier, mike, eleven, goblin, inventario, catalogo };
}

describe('Batalha por turnos', () => {
  it('heróis agem primeiro e o inimigo responde automaticamente', () => {
    const { batalha, notifier, mike, eleven, goblin } = montar();
    expect(batalha.getAtorAtual()).toBe(mike);
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    expect(batalha.getAtorAtual()).toBe(eleven);
    batalha.executarAcaoDoJogador({ tipo: 'habilidade', atorId: 'eleven', alvoId: 'goblin' }, notifier);
    // Agora é a vez do goblin, que é controlado pelo computador.
    expect(batalha.ehTurnoDoJogador()).toBe(false);
    batalha.executarTurnosAutomaticos(notifier);
    expect(batalha.getRodada()).toBe(2);
    expect(batalha.getAtorAtual()).toBe(mike);
    expect(goblin.getVida()).toBe(25 - 8 - 16);
    // O goblin ataca o mais fraco (AtacarMaisFraco): Eleven, com 30 de vida.
    expect(eleven.getVida()).toBe(25);
    expect(notifier.doTipo('turn_start').map((e) => e.atorId)).toEqual(['mike', 'eleven', 'goblin', 'mike']);
  });

  it('rejeita ações inválidas sem alterar o estado', () => {
    const { batalha, notifier, mike, goblin, inventario } = montar();
    const tentar = (fn: () => void) => {
      try {
        fn();
      } catch (erro) {
        return (erro as AcaoInvalidaError).codigo;
      }
      return null;
    };
    expect(tentar(() => batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'goblin' }, notifier))).toBe(
      'error.notYourTurn',
    );
    expect(tentar(() => batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'eleven' }, notifier))).toBe(
      'error.invalidTarget',
    );
    expect(tentar(() => batalha.executarAcaoDoJogador({ tipo: 'item', atorId: 'mike', itemId: 'x', alvoId: 'mike' }, notifier))).toBe(
      'error.itemUnavailable',
    );
    expect(goblin.getVida()).toBe(25);
    expect(batalha.getAtorAtual()).toBe(mike);
    expect(inventario.listar()).toHaveLength(0);
  });

  it('não permite habilidade sem recurso e não consome o turno', () => {
    const { batalha, notifier, mike } = montar({ vidaGoblin: 200 });
    batalha.executarAcaoDoJogador({ tipo: 'habilidade', atorId: 'mike', alvoId: 'goblin' }, notifier); // fúria 5 → 0
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'goblin' }, notifier);
    batalha.executarTurnosAutomaticos(notifier);
    // O goblin ataca Eleven (a mais fraca), então a fúria de Mike continua zerada.
    expect(mike.podeUsarHabilidade()).toBe(false);
    expect(() => batalha.executarAcaoDoJogador({ tipo: 'habilidade', atorId: 'mike', alvoId: 'goblin' }, notifier)).toThrow(
      AcaoInvalidaError,
    );
    expect(batalha.getAtorAtual()).toBe(mike);
  });

  it('a Poção de Mana só pode ser usada em quem possui mana (ISP)', () => {
    const { batalha, notifier, catalogo, inventario, eleven } = montar({ vidaGoblin: 200 });
    const pocao = catalogo.criar('pocao-de-mana');
    inventario.adicionar(pocao);
    expect(() => batalha.executarAcaoDoJogador({ tipo: 'item', atorId: 'mike', itemId: pocao.id, alvoId: 'mike' }, notifier)).toThrow(
      AcaoInvalidaError,
    );
    // Eleven gasta mana e depois recebe a poção usada por Mike.
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    batalha.executarAcaoDoJogador({ tipo: 'habilidade', atorId: 'eleven', alvoId: 'goblin' }, notifier);
    batalha.executarTurnosAutomaticos(notifier);
    batalha.executarAcaoDoJogador({ tipo: 'item', atorId: 'mike', itemId: pocao.id, alvoId: 'eleven' }, notifier);
    expect(eleven.getMana()).toBe(20);
    expect(inventario.contem(pocao.id)).toBe(false);
    expect(notifier.chaves()).toContain('item_used');
  });

  it('recolhe os itens do baú quebrado e a arma do inimigo derrotado', () => {
    const { batalha, notifier, goblin, inventario, catalogo } = montar({ vidaGoblin: 6, comBau: true });
    goblin.equiparArma(catalogo.criarArma('adaga-enferrujada'), notifier);
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'bau' }, notifier);
    expect(inventario.listar().map((i) => i.catalogoId)).toEqual(['pocao-de-vida']);
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'goblin' }, notifier);
    expect(goblin.getArma()).toBeNull();
    expect(inventario.listar().map((i) => i.catalogoId)).toEqual(['pocao-de-vida', 'adaga-enferrujada']);
    expect(notifier.doTipo('loot_collected')).toHaveLength(2);
    expect(batalha.getEstado()).toBe('vitoria');
  });

  it('vitória ao derrotar todos os inimigos encerra a batalha', () => {
    const { batalha, notifier } = montar({ vidaGoblin: 8 });
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    expect(batalha.getEstado()).toBe('vitoria');
    expect(notifier.chaves().at(-1)).toBe('battle_won');
    expect(() => batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'goblin' }, notifier)).toThrow(
      AcaoInvalidaError,
    );
  });

  it('com o portão como objetivo, derrotar o inimigo não basta', () => {
    const { batalha, notifier } = montar({ vidaGoblin: 8, comPortao: true });
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    expect(batalha.getEstado()).toBe('em-andamento');
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'portao' }, notifier); // max(1, 6-3) = 3
    expect(batalha.getEstado()).toBe('em-andamento');
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'portao' }, notifier);
    expect(batalha.getEstado()).toBe('vitoria');
  });

  it('derrota quando todos os heróis caem; heróis ficam inconscientes, não mortos', () => {
    const { batalha, notifier, mike, eleven } = montar({ vidaGoblin: 500, ataqueGoblin: 50 });
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'eleven', alvoId: 'goblin' }, notifier);
    batalha.executarTurnosAutomaticos(notifier); // derruba Eleven
    batalha.executarAcaoDoJogador({ tipo: 'atacar', atorId: 'mike', alvoId: 'goblin' }, notifier);
    batalha.executarTurnosAutomaticos(notifier); // derruba Mike
    expect(batalha.getEstado()).toBe('derrota');
    expect(notifier.chaves().at(-1)).toBe('battle_lost');
    expect(notifier.doTipo('unconscious').map((e) => e.alvoId)).toEqual(['eleven', 'mike']);
    expect(mike.foiDerrotadoDefinitivamente()).toBe(false);
    mike.descansar();
    eleven.descansar();
    expect(mike.estaDestruido()).toBe(false);
    expect(eleven.getVida()).toBe(9);
  });

  it('a investida coordenada usa o turno de todos os heróis e só pode ser usada uma vez', () => {
    const { batalha, notifier, goblin } = montar({ vidaGoblin: 200 });
    batalha.executarAcaoDoJogador({ tipo: 'investida', atorId: 'mike', alvoId: 'goblin' }, notifier);
    // Golpe Brutal (13) + Bola de Fogo (16)
    expect(goblin.getVida()).toBe(200 - 13 - 16);
    expect(batalha.ehTurnoDoJogador()).toBe(false);
    batalha.executarTurnosAutomaticos(notifier);
    expect(batalha.investidaDisponivel()).toBe(false);
    expect(() => batalha.executarAcaoDoJogador({ tipo: 'investida', atorId: 'mike', alvoId: 'goblin' }, notifier)).toThrow(
      AcaoInvalidaError,
    );
  });

  it('é possível mirar nos membros do inimigo (composição como alvo)', () => {
    const { batalha, notifier, goblin } = montar({ vidaGoblin: 200 });
    const braco = goblin.getMembros()[0]!;
    expect(batalha.getAlvosHostis().map((a) => a.id)).toContain(braco.id);
    batalha.executarAcaoDoJogador({ tipo: 'habilidade', atorId: 'mike', alvoId: braco.id }, notifier);
    expect(braco.estaDestruido()).toBe(true);
    expect(goblin.getAtaque()).toBe(2);
    expect(batalha.getAlvosHostis().map((a) => a.id)).not.toContain(braco.id);
  });
});

describe('Estágios da campanha', () => {
  it('o objetivo declarado em cada estágio corresponde à condição de vitória montada', async () => {
    const { ESTAGIOS } = await import('../../src/domain/world/estagios');
    const { criarBaseDeAfinidadesDoJogo } = await import('../../src/domain/paradigms/ModuloLogico');
    const { geradorComSemente } = await import('../../src/domain/rules/comportamentos');
    for (const estagio of ESTAGIOS) {
      const elenco = estagio.montar({
        catalogo: new CatalogoDeItens(),
        afinidades: criarBaseDeAfinidadesDoJogo(),
        aleatorio: geradorComSemente(1),
        preparacao: new NotificadorDeTeste(),
      });
      expect(elenco.condicaoDeVitoria.chave).toBe(estagio.objetivo);
      expect(elenco.inimigos.length).toBeGreaterThan(0);
    }
  });
});
