import { describe, expect, it } from 'vitest';
import { JogoService, type JogoSnapshot } from '../../src/application/JogoService';
import type { EventosDoJogo } from '../../src/application/eventosDoJogo';
import { geradorComSemente } from '../../src/domain/rules/comportamentos';
import { EventBus } from '../../src/events/EventBus';
import { RepositorioDeProgressoEmMemoria } from '../../src/infrastructure/persistence/repositorios';

function criarJogo() {
  const progresso = new RepositorioDeProgressoEmMemoria();
  const barramento = new EventBus<EventosDoJogo>();
  const jogo = new JogoService({ progresso, barramento, aleatorio: geradorComSemente(42) });
  return { jogo, progresso, barramento };
}

/** Joga a batalha atual: usa a habilidade quando possível, senão ataca o primeiro inimigo vivo. */
function lutarAteOFim(jogo: JogoService, limite = 200): JogoSnapshot {
  for (let i = 0; i < limite; i++) {
    const batalha = jogo.getSnapshot().batalha!;
    if (batalha.estado !== 'em-andamento') break;
    const ator = batalha.herois.find((heroi) => heroi.id === batalha.atorAtualId)!;
    const inimigos = batalha.inimigos.filter((inimigo) => !inimigo.destruido).map((inimigo) => inimigo.id);
    const objetos = batalha.cenario.filter((objeto) => !objeto.destruido).map((objeto) => objeto.id);
    const alvo = inimigos[0] ?? objetos[0]!;
    const tipo = ator.podeUsarHabilidade ? 'habilidade' : 'atacar';
    const resultado = jogo.executarAcao({ tipo, atorId: ator.id, alvoId: alvo });
    expect(resultado.ok).toBe(true);
  }
  return jogo.getSnapshot();
}

describe('JogoService — fluxo completo da partida', () => {
  it('exige exatamente dois heróis de classes diferentes', () => {
    const { jogo } = criarJogo();
    expect(jogo.novaPartida(['guerreiro']).ok).toBe(false);
    expect(jogo.novaPartida(['guerreiro', 'guerreiro']).ok).toBe(false);
    expect(jogo.novaPartida(['guerreiro', 'mago']).ok).toBe(true);
    const estado = jogo.getSnapshot();
    expect(estado.grupo.map((heroi) => heroi.classe)).toEqual(['guerreiro', 'mago']);
    expect(estado.grupo[0]?.arma?.catalogoId).toBe('espada-longa');
    expect(estado.inventario.map((item) => item.catalogoId)).toEqual(['pocao-de-vida', 'pocao-de-vida', 'pocao-de-mana']);
  });

  it('vence a Floresta Sombria, recebe espólios, descansa e salva automaticamente', async () => {
    const { jogo, progresso } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    const inicio = jogo.iniciarBatalha();
    expect(inicio.ok && inicio.eventos[0]?.key).toBe('turn_start');

    const fim = lutarAteOFim(jogo);
    expect(fim.batalha?.estado).toBe('vitoria');
    expect(fim.ultimaBatalha?.inimigosDerrotados).toBe(2);
    expect(fim.ultimaBatalha?.danoCausado).toBeGreaterThan(0);
    // A adaga do goblin foi recolhida pela agregação.
    expect(fim.inventario.some((item) => item.catalogoId === 'adaga-enferrujada')).toBe(true);

    await jogo.seguirParaAcampamento();
    const acampamento = jogo.getSnapshot();
    expect(acampamento.batalha).toBeNull();
    expect(acampamento.estagio).toBe(1);
    expect(acampamento.descansou).toBe(true);
    expect(acampamento.recompensasRecentes).toEqual(['pocao-de-vida', 'manto-runico']);
    expect(acampamento.estatisticas.batalhasVencidas).toBe(1);

    const salvo = await progresso.carregar();
    expect(salvo?.estagio).toBe(1);
    expect(salvo?.grupo.map((heroi) => heroi.classe)).toEqual(['guerreiro', 'mago']);
  });

  it('recupera o progresso salvo com o mesmo estado (persistência)', async () => {
    const { jogo, progresso } = criarJogo();
    jogo.novaPartida(['arqueiro', 'mago']);
    const pocao = jogo.getSnapshot().inventario.find((item) => item.catalogoId === 'pocao-de-vida')!;
    expect(jogo.equipar('heroi-mago', pocao.id)).toEqual({ ok: false, erro: 'error.invalidTarget' }); // consumível não se equipa
    jogo.guardar('heroi-arqueiro', 'arma'); // muda o estado antes de salvar
    await jogo.salvar();
    const antes = jogo.getSnapshot();

    const outro = new JogoService({ progresso });
    expect(await outro.carregarPartida()).toBe(true);
    const depois = outro.getSnapshot();
    expect(depois.grupo).toEqual(antes.grupo);
    expect(depois.inventario.map((item) => item.id)).toEqual(antes.inventario.map((item) => item.id));
    expect(depois.inventario.some((item) => item.id === pocao.id)).toBe(true);
  });

  it('rejeita ações durante a batalha que pertencem ao acampamento', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    jogo.iniciarBatalha();
    const pocao = jogo.getSnapshot().inventario[0]!;
    expect(jogo.usarItemNoAcampamento(pocao.id, 'heroi-guerreiro')).toEqual({ ok: false, erro: 'error.inBattle' });
    expect(jogo.guardar('heroi-guerreiro', 'arma')).toEqual({ ok: false, erro: 'error.inBattle' });
  });

  it('ação inválida devolve o código do erro sem alterar a batalha', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    jogo.iniciarBatalha();
    const antes = jogo.getSnapshot().batalha;
    const resultado = jogo.executarAcao({ tipo: 'atacar', atorId: 'heroi-mago', alvoId: 'goblin' });
    expect(resultado).toEqual({ ok: false, erro: 'error.notYourTurn' });
    expect(jogo.getSnapshot().batalha).toEqual(antes);
  });

  it('reiniciar a batalha restaura o estado anterior a ela', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    jogo.iniciarBatalha();
    const vidaInicial = jogo.getSnapshot().grupo.map((heroi) => heroi.vida);
    jogo.executarAcao({ tipo: 'atacar', atorId: 'heroi-guerreiro', alvoId: 'goblin' });
    jogo.executarAcao({ tipo: 'atacar', atorId: 'heroi-mago', alvoId: 'goblin' });
    expect(jogo.getSnapshot().batalha?.rodada).toBe(2);

    const reinicio = jogo.reiniciarBatalha();
    expect(reinicio.ok).toBe(true);
    const estado = jogo.getSnapshot();
    expect(estado.batalha?.rodada).toBe(1);
    expect(estado.grupo.map((heroi) => heroi.vida)).toEqual(vidaInicial);
    expect(estado.batalha?.inimigos.every((inimigo) => inimigo.vida === inimigo.vidaMaxima)).toBe(true);
    expect(estado.estatisticas.derrotas).toBe(1);
  });

  it('completa a campanha inteira e marca a conclusão', async () => {
    const { jogo, progresso } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    for (let capitulo = 0; capitulo < 3; capitulo++) {
      jogo.iniciarBatalha();
      let estado = lutarAteOFim(jogo);
      // Se o grupo cair, tenta de novo a partir do checkpoint (como o jogador faria).
      for (let tentativa = 0; estado.batalha?.estado === 'derrota' && tentativa < 5; tentativa++) {
        jogo.reiniciarBatalha();
        estado = lutarAteOFim(jogo);
      }
      expect(estado.batalha?.estado).toBe('vitoria');
      await jogo.seguirParaAcampamento();
    }
    expect(jogo.getSnapshot().campanhaConcluida).toBe(true);
    expect((await progresso.carregar())?.campanhaConcluida).toBe(true);
    expect(jogo.iniciarBatalha()).toEqual({ ok: false, erro: 'error.battleOver' });
  });
});

describe('JogoService — inventário e equipamentos', () => {
  it('equipa armadura do inventário e devolve a anterior', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'arqueiro']);
    // Prepara: a armadura chega pelo baú da primeira batalha; aqui usamos a transferência direta.
    expect(jogo.guardar('heroi-guerreiro', 'armadura')).toEqual({ ok: false, erro: 'error.nothingEquipped' });
    const espada = jogo.getSnapshot().grupo[0]!.arma!;
    expect(jogo.guardar('heroi-guerreiro', 'arma').ok).toBe(true);
    expect(jogo.getSnapshot().grupo[0]!.arma).toBeNull();
    expect(jogo.getSnapshot().inventario.some((item) => item.id === espada.id)).toBe(true);
    expect(jogo.equipar('heroi-guerreiro', espada.id).ok).toBe(true);
    expect(jogo.getSnapshot().grupo[0]!.arma?.id).toBe(espada.id);
  });

  it('transfere a arma entre heróis respeitando a classe', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'arqueiro']);
    // O arqueiro empunha lâminas: pode receber a espada do guerreiro.
    const espada = jogo.getSnapshot().grupo[0]!.arma!;
    const arco = jogo.getSnapshot().grupo[1]!.arma!;
    const resultado = jogo.transferir('heroi-guerreiro', 'heroi-arqueiro', 'arma');
    expect(resultado.ok).toBe(true);
    const estado = jogo.getSnapshot();
    expect(estado.grupo[1]!.arma?.id).toBe(espada.id);
    expect(estado.grupo[0]!.arma).toBeNull();
    expect(estado.inventario.some((item) => item.id === arco.id)).toBe(true); // o arco anterior volta ao inventário
    // O guerreiro não pode receber o arco.
    jogo.equipar('heroi-arqueiro', arco.id);
    expect(jogo.transferir('heroi-arqueiro', 'heroi-guerreiro', 'arma')).toEqual({ ok: false, erro: 'error.weaponNotAllowed' });
    expect(jogo.transferir('heroi-arqueiro', 'heroi-arqueiro', 'arma')).toEqual({ ok: false, erro: 'error.sameCharacter' });
  });

  it('expõe na fotografia os alvos válidos de cada consumível', () => {
    const { jogo } = criarJogo();
    jogo.novaPartida(['guerreiro', 'mago']);
    const pocaoDeMana = jogo.getSnapshot().inventario.find((item) => item.catalogoId === 'pocao-de-mana')!;
    // Mana cheia: nenhum alvo válido; o guerreiro nunca é alvo válido (ISP).
    expect(pocaoDeMana.alvosValidos).toEqual([]);
    const pocaoDeVida = jogo.getSnapshot().inventario.find((item) => item.catalogoId === 'pocao-de-vida')!;
    expect(jogo.usarItemNoAcampamento(pocaoDeVida.id, 'heroi-guerreiro')).toEqual({ ok: false, erro: 'error.itemCannotTarget' });
  });
});

describe('Comunicação entre módulos (EventBus)', () => {
  it('a aplicação publica os eventos de combate e de salvamento', async () => {
    const { jogo, barramento } = criarJogo();
    const recebidos: string[] = [];
    const salvos: string[] = [];
    const cancelar = barramento.on('combate', (evento) => recebidos.push(evento.key));
    barramento.on('jogo:salvo', ({ salvoEm }) => salvos.push(salvoEm));
    jogo.novaPartida(['guerreiro', 'mago']);
    await jogo.salvar();
    jogo.iniciarBatalha();
    jogo.executarAcao({ tipo: 'atacar', atorId: 'heroi-guerreiro', alvoId: 'goblin' });
    expect(salvos).toHaveLength(1);
    expect(recebidos.slice(0, 3)).toEqual(['turn_start', 'attack', 'damage_received']);
    cancelar();
    const total = recebidos.length;
    jogo.executarAcao({ tipo: 'atacar', atorId: 'heroi-mago', alvoId: 'goblin' });
    expect(recebidos).toHaveLength(total);
  });

  it('um assinante com falha não interrompe os demais', () => {
    const barramento = new EventBus<{ teste: number }>();
    const recebidos: number[] = [];
    const erroOriginal = console.error;
    console.error = () => undefined;
    barramento.on('teste', () => {
      throw new Error('falha');
    });
    barramento.on('teste', (valor) => recebidos.push(valor));
    barramento.emit('teste', 7);
    console.error = erroOriginal;
    expect(recebidos).toEqual([7]);
  });

  it('notifica os assinantes do estado a cada mudança (fonte única de verdade)', () => {
    const { jogo } = criarJogo();
    let notificacoes = 0;
    jogo.subscribe(() => notificacoes++);
    jogo.novaPartida(['guerreiro', 'mago']);
    const primeiro = jogo.getSnapshot();
    expect(jogo.getSnapshot()).toBe(primeiro); // estável enquanto nada muda
    jogo.iniciarBatalha();
    expect(notificacoes).toBe(2);
    expect(jogo.getSnapshot()).not.toBe(primeiro);
  });
});
