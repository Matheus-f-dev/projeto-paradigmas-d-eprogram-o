import { describe, expect, it } from 'vitest';
import { JogoService } from '../../src/application/JogoService';
import type { CombatEvent } from '../../src/domain/events/CombatEvent';
import { geradorComSemente } from '../../src/domain/rules/comportamentos';
import { RepositorioDeProgressoEmMemoria } from '../../src/infrastructure/persistence/repositorios';
import { construirRoteiro, type Cue } from '../../src/presentation/effects/CombatDirector';

const opcoes = { escala: 1, ehDoJogador: (id: string) => id.startsWith('heroi-') };

function jogar(tipo: 'atacar' | 'habilidade', classes: ['guerreiro', 'mago'] | ['mago', 'guerreiro'] = ['guerreiro', 'mago']) {
  const jogo = new JogoService({ progresso: new RepositorioDeProgressoEmMemoria(), aleatorio: geradorComSemente(3) });
  jogo.novaPartida(classes);
  jogo.iniciarBatalha();
  const ator = jogo.getSnapshot().batalha!.atorAtualId!;
  const resultado = jogo.executarAcao({ tipo, atorId: ator, alvoId: 'goblin' });
  if (!resultado.ok) throw new Error(resultado.erro);
  return resultado.eventos;
}

const doTipo = <T extends Cue['tipo']>(cues: readonly { cue: Cue }[], tipo: T) =>
  cues.map((c) => c.cue).filter((cue): cue is Extract<Cue, { tipo: T }> => cue.tipo === tipo);

describe('CombatDirector — efeitos sincronizados com o domínio', () => {
  it('cada número de dano exibido corresponde a um evento damage_received real', () => {
    const eventos = jogar('habilidade');
    const roteiro = construirRoteiro(eventos, opcoes);
    const danosDoDominio = eventos.filter((e) => e.key === 'damage_received').map((e) => (e as Extract<CombatEvent, { key: 'damage_received' }>).valor);
    expect(doTipo(roteiro.cues, 'dano').map((cue) => cue.valor)).toEqual(danosDoDominio);
    expect(doTipo(roteiro.cues, 'dano').length).toBeGreaterThan(0);
  });

  it('sem dano no domínio, não há número de dano nem impacto inventado', () => {
    const eventos: CombatEvent[] = [
      { key: 'turn_start', atorId: 'heroi-mago', ator: 'Eleven', rodada: 1 },
      { key: 'no_mana', atorId: 'heroi-mago', ator: 'Eleven' },
    ];
    const roteiro = construirRoteiro(eventos, opcoes);
    expect(doTipo(roteiro.cues, 'dano')).toEqual([]);
    expect(doTipo(roteiro.cues, 'impacto')).toEqual([]);
  });

  it('Golpe Brutal e Bola de Fogo têm sequências visuais diferentes', () => {
    const golpe = construirRoteiro(jogar('habilidade', ['guerreiro', 'mago']), opcoes);
    const bola = construirRoteiro(jogar('habilidade', ['mago', 'guerreiro']), opcoes);
    expect(doTipo(golpe.cues, 'preparo')[0]?.estilo).toBe('furia');
    expect(doTipo(golpe.cues, 'avanco')[0]?.pesado).toBe(true);
    expect(doTipo(golpe.cues, 'projetil')).toHaveLength(0);
    expect(doTipo(bola.cues, 'preparo')[0]?.estilo).toBe('arcano');
    expect(doTipo(bola.cues, 'projetil')[0]?.estilo).toBe('fogo');
    expect(doTipo(bola.cues, 'impacto')[0]).toMatchObject({ elemento: 'fogo', forca: 3 });
  });

  it('o impacto acontece antes do número de dano, e o ataque comum é mais leve que a habilidade', () => {
    const roteiro = construirRoteiro(jogar('atacar'), opcoes);
    const impacto = roteiro.cues.find((c) => c.cue.tipo === 'impacto')!;
    const dano = roteiro.cues.find((c) => c.cue.tipo === 'dano')!;
    expect(impacto.t).toBeLessThanOrEqual(dano.t);
    expect((impacto.cue as Extract<Cue, { tipo: 'impacto' }>).forca).toBe(1);
  });

  it('a vida exibida após a reprodução é a vida autoritativa do domínio', () => {
    const eventos = jogar('atacar');
    const roteiro = construirRoteiro(eventos, opcoes);
    const ultimoDanoNoGoblin = doTipo(roteiro.cues, 'dano').filter((cue) => cue.alvoId === 'goblin').at(-1);
    const eventoFinal = eventos.filter((e) => e.key === 'damage_received' && e.alvoId === 'goblin').at(-1) as Extract<
      CombatEvent,
      { key: 'damage_received' }
    >;
    expect(ultimoDanoNoGoblin?.restante).toBe(eventoFinal.restante);
  });

  it('a velocidade rápida encurta o roteiro sem remover nenhuma cue', () => {
    const eventos = jogar('habilidade');
    const normal = construirRoteiro(eventos, opcoes);
    const rapido = construirRoteiro(eventos, { ...opcoes, escala: 0.5 });
    expect(rapido.cues).toHaveLength(normal.cues.length);
    expect(rapido.duracao).toBeLessThan(normal.duracao);
  });

  it('todo evento com texto gera exatamente uma entrada de registro, na ordem do domínio', () => {
    const eventos = jogar('habilidade');
    const roteiro = construirRoteiro(eventos, opcoes);
    const registrados = doTipo(roteiro.cues, 'log').map((cue) => cue.evento);
    const esperados = eventos.filter((e) => e.key !== 'resource_changed');
    expect(registrados).toEqual(esperados);
  });
});
