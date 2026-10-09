import { JogoService } from '../../application/JogoService';
import { AcaoInvalidaError } from '../../domain/combat/erros';
import { possuiHabilidadeEspecial } from '../../domain/contracts/ComHabilidadeEspecial';
import { Arma } from '../../domain/equipment/Arma';
import { RestauracaoDeMana } from '../../domain/equipment/Consumivel';
import { Bau } from '../../domain/model/Bau';
import { Chefe } from '../../domain/model/Chefe';
import { Fortaleza } from '../../domain/model/Fortaleza';
import { GrupoDeBatalha } from '../../domain/model/GrupoDeBatalha';
import { Guerreiro } from '../../domain/model/Guerreiro';
import { Inimigo } from '../../domain/model/Inimigo';
import { Mago } from '../../domain/model/Mago';
import type { Personagem } from '../../domain/model/Personagem';
import { Zumbi } from '../../domain/model/Zumbi';
import { BatalhaFuncional, ModuloEstruturado } from '../../domain/paradigms/ModuloEstruturado';
import { curarEFortificar } from '../../domain/paradigms/ModuloFuncional';
import { BaseDeConhecimento } from '../../domain/paradigms/ModuloLogico';
import { geradorComSemente } from '../../domain/rules/comportamentos';
import type { MessageProvider } from '../../i18n/MessageProvider';
import { criarMessageProvider } from '../../i18n/provedores';
import { RepositorioDeProgressoEmMemoria } from '../../infrastructure/persistence/repositorios';
import { construirRoteiro } from '../effects/CombatDirector';
import { LogInMemoryOutputChannel, TextCombatNotifier } from '../output/OutputChannel';
import type { IdDeDemonstracao } from './conceitos';

/**
 * Demonstrações executadas com as classes REAIS do jogo. A saída é escrita
 * num LogInMemoryOutputChannel por um TextCombatNotifier — o mesmo arranjo
 * do "TOTAL SOLID" do PDF — no idioma escolhido pelo jogador.
 */
type Demonstracao = (m: MessageProvider) => string[];

function ambiente(m: MessageProvider) {
  const canal = new LogInMemoryOutputChannel();
  const notifier = new TextCombatNotifier(canal, m);
  const escrever = (chave: string, ...args: (string | number)[]) => canal.print(m.getMessage(chave, ...args));
  return { canal, notifier, escrever };
}

const DEMONSTRACOES: Readonly<Record<IdDeDemonstracao, Demonstracao>> = {
  'batalha-do-pdf': (m) => {
    const { canal, notifier, escrever } = ambiente(m);
    escrever('lab.demo.pdfBattle');
    const heroi = new Guerreiro('Aragorn', 40, 8);
    const feiticeiro = new Mago('Luna', 30, 6, 20);
    const monstro = new Inimigo('Goblin', 25, 5);
    heroi.atacar(monstro, notifier);
    feiticeiro.usarHabilidade(monstro, notifier);
    monstro.atacar(heroi, notifier);
    heroi.mostrarStatus(notifier);
    feiticeiro.mostrarStatus(notifier);
    monstro.mostrarStatus(notifier);
    return [...canal.getLinhas()];
  },

  encapsulamento: (m) => {
    const { canal, notifier } = ambiente(m);
    const goblin = new Inimigo('Goblin', 10, 3);
    goblin.receberDano(999, notifier);
    goblin.mostrarStatus(notifier); // vida limitada a 0, nunca negativa
    try {
      goblin.atacar(new Guerreiro('Mike', 40, 8), notifier);
    } catch (erro) {
      if (erro instanceof AcaoInvalidaError) canal.print(`AcaoInvalidaError: ${m.getMessage(erro.codigo)}`);
    }
    return [...canal.getLinhas()];
  },

  idiomas: (m) => {
    const linhas: string[] = [];
    (['pt', 'en', 'zh'] as const).forEach((idioma) => {
      const provedor = criarMessageProvider(idioma);
      const { canal, notifier } = ambiente(provedor);
      canal.print(m.getMessage('lab.demo.i18nTitle', provedor.constructor.name));
      const heroi = new Guerreiro('Mike', 40, 8);
      const feiticeira = new Mago('Eleven', 30, 6, 20);
      const monstrao = new Inimigo('Demogorgon', 45, 10);
      const bau = new Bau('bau-antigo', 'Baú Antigo', 10);
      heroi.atacar(bau, notifier);
      heroi.usarHabilidade(monstrao, notifier);
      feiticeira.usarHabilidade(monstrao, notifier);
      monstrao.mostrarStatus(notifier);
      linhas.push(...canal.getLinhas(), '');
    });
    return linhas;
  },

  ocp: (m) => {
    const { canal, notifier, escrever } = ambiente(m);
    escrever('lab.demo.ocpTitle');
    const zumbi = new Zumbi('Sentinela Morta', 20, 4, { id: 'sentinela-morta' });
    zumbi.receberDano(20, notifier);
    zumbi.receberDano(10, notifier);
    const chefe = new Chefe('Demogorgon', 30, 10, { id: 'demogorgon', vidaDaSegundaFase: 18, bonusDaSegundaFase: 4 });
    chefe.receberDano(30, notifier);
    chefe.mostrarStatus(notifier);
    return [...canal.getLinhas()];
  },

  lsp: (m) => {
    const { canal, notifier, escrever } = ambiente(m);
    escrever('lab.demo.lspTitle');
    const heroi: Personagem = new Guerreiro('Mike', 40, 8);
    const feiticeira: Personagem = new Mago('Eleven', 30, 6, 20);
    const monstrinho: Personagem = new Inimigo('Dart', 25, 5, { id: 'dart' });
    const monstrao: Personagem = new Inimigo('Demogorgon', 100, 50);
    for (const p of [heroi, feiticeira, monstrinho]) {
      if (possuiHabilidadeEspecial(p)) p.usarHabilidade(monstrao, notifier);
      else p.atacar(monstrao, notifier);
    }
    monstrao.mostrarStatus(notifier);
    return [...canal.getLinhas()];
  },

  isp: (m) => {
    const { canal } = ambiente(m);
    const pocao = new RestauracaoDeMana(10);
    const guerreiro = new Guerreiro('Mike', 40, 8);
    const maga = new Mago('Eleven', 30, 6, 20);
    maga.usarHabilidade(new Inimigo('Alvo', 99, 1), { notify: () => undefined });
    canal.print(`RestauracaoDeMana.podeAplicar(Guerreiro) → ${pocao.podeAplicar(guerreiro)}`);
    canal.print(`RestauracaoDeMana.podeAplicar(Mago) → ${pocao.podeAplicar(maga)}`);
    canal.print(`possuiHabilidadeEspecial(Inimigo) → ${possuiHabilidadeEspecial(new Inimigo('Goblin', 10, 2))}`);
    canal.print(`possuiHabilidadeEspecial(Mago) → ${possuiHabilidadeEspecial(maga)}`);
    return [...canal.getLinhas()];
  },

  dip: (m) => {
    const { canal, notifier, escrever } = ambiente(m);
    escrever('lab.demo.dipTitle');
    const heroi = new Guerreiro('Mike', 40, 8);
    const feiticeira = new Mago('Eleven', 30, 6, 20);
    const bauDeMadeira = new Bau('bau-antigo', 'Baú Antigo', 12);
    const portaoForte = new Fortaleza('portao-da-cidadela', 'Portão da Cidadela', 20);
    heroi.atacar(bauDeMadeira, notifier);
    feiticeira.atacar(portaoForte, notifier);
    heroi.usarHabilidade(portaoForte, notifier);
    heroi.atacar(bauDeMadeira, notifier);
    return [...canal.getLinhas()];
  },

  associacoes: (m) => {
    const { canal, notifier, escrever } = ambiente(m);
    const mike = new Guerreiro('Mike', 30, 6);
    const dustin = new Guerreiro('Dustin', 25, 4);
    const demogorgon = new Inimigo('Demogorgon', 50, 15);
    const espadaLendaria = new Arma('espada-vorpal#lab', 'espada-vorpal', 'Espada Vorpal', 10, 'lamina');
    escrever('lab.demo.aggTitle');
    mike.equiparArma(espadaLendaria, notifier);
    escrever('lab.demo.compTitle');
    mike.atacar(demogorgon.getMembros()[0]!, notifier);
    escrever('lab.demo.dropTitle');
    while (!mike.estaDestruido()) demogorgon.atacar(mike, notifier);
    const armaNoChao = mike.droparArmaAoMorrer(notifier);
    escrever('lab.demo.reuseTitle');
    if (armaNoChao) {
      dustin.equiparArma(armaNoChao, notifier);
      dustin.atacar(demogorgon, notifier);
    }
    return [...canal.getLinhas()];
  },

  funcional: (m) => {
    const { canal, escrever } = ambiente(m);
    const veteranos = [new Guerreiro('Thorin', 45, 10), new Mago('Gandalf', 40, 15, 20), new Guerreiro('Boromir', 45, 9)];
    veteranos[0]!.receberDano(30, { notify: () => undefined });
    veteranos[2]!.receberDano(37, { notify: () => undefined });
    const fichas = veteranos.map((v) => v.getFicha());
    escrever('lab.demo.before');
    fichas.forEach((f) => escrever('lab.demo.line', f.nome, f.vida));
    const fortificados = curarEFortificar(fichas, 25, 3);
    escrever('lab.demo.after');
    fortificados.forEach((f) => escrever('lab.demo.line', f.nome, f.vida));
    canal.print('');
    escrever('lab.demo.before');
    fichas.forEach((f) => escrever('lab.demo.line', f.nome, f.vida));
    return [...canal.getLinhas()];
  },

  logico: (m) => {
    const { escrever, canal } = ambiente(m);
    const base = new BaseDeConhecimento();
    base.declararFato('fraqueza', 'fogo', 'demogorgon');
    base.declararRegra({ predicado: 'fraqueza', arg1: 'fogo', arg2: 'demogorgon' }, 'CRITICO');
    base.declararFato('fraqueza', 'gelo', 'golem');
    base.declararRegra({ predicado: 'fraqueza', arg1: 'gelo', arg2: 'golem' }, 'RESISTENTE');
    escrever('lab.demo.inference', 'fogo', 'demogorgon', base.inferirMultiplicadorDano('fogo', 'demogorgon'));
    escrever('lab.demo.inference', 'raio', 'demogorgon', base.inferirMultiplicadorDano('raio', 'demogorgon'));
    escrever('lab.demo.inference', 'gelo', 'golem', base.inferirMultiplicadorDano('gelo', 'golem'));
    return [...canal.getLinhas()];
  },

  estruturado: (m) => {
    const { canal, escrever } = ambiente(m);
    const silencioso = { notify: () => undefined };
    const contar = (executar: (atacantes: Personagem[], alvo: Inimigo, n: { notify: (e: unknown) => void; total: number }) => void) => {
      const atacantes = ModuloEstruturado.gerarPelotao(2, 1);
      atacantes.forEach((a) => possuiHabilidadeEspecial(a) && a.usarHabilidade(new Inimigo('Saco', 999, 0), silencioso));
      atacantes.forEach((a) => possuiHabilidadeEspecial(a) && a.usarHabilidade(new Inimigo('Saco', 999, 0), silencioso));
      const alvo = new Inimigo('Demogorgon', 15, 10);
      const contador = { total: 0, notify: (e: unknown) => ((e as { key: string }).key === 'attack' ? contador.total++ : 0) };
      executar(atacantes, alvo, contador);
      return { vida: alvo.getVida(), ataques: contador.total };
    };
    escrever('lab.demo.platoon', ModuloEstruturado.gerarPelotao(2, 1).length);
    escrever('lab.demo.structured');
    const a = contar((atacantes, alvo, n) => ModuloEstruturado.executarAtaqueEmGrupo(atacantes, alvo, n));
    escrever('lab.demo.result', a.vida, a.ataques);
    escrever('lab.demo.functional');
    const b = contar((atacantes, alvo, n) => BatalhaFuncional.executarAtaqueEmGrupo(atacantes, alvo, n));
    escrever('lab.demo.result', b.vida, b.ataques);
    escrever('lab.demo.oop');
    const c = contar((atacantes, alvo, n) => new GrupoDeBatalha(atacantes).realizarInvestida(alvo, n));
    escrever('lab.demo.result', c.vida, c.ataques);
    return [...canal.getLinhas()];
  },

  eventos: (m) => {
    const { canal } = ambiente(m);
    const jogo = new JogoService({ progresso: new RepositorioDeProgressoEmMemoria(), aleatorio: geradorComSemente(7) });
    jogo.novaPartida(['guerreiro', 'mago']);
    jogo.iniciarBatalha();
    const resultado = jogo.executarAcao({ tipo: 'habilidade', atorId: 'heroi-guerreiro', alvoId: 'goblin' });
    if (!resultado.ok) return [m.getMessage(resultado.erro)];
    canal.print(`jogo.executarAcao(...) → ${resultado.eventos.length} eventos do domínio:`);
    resultado.eventos.forEach((evento) => canal.print(`  • ${evento.key}${'valor' in evento ? ` (valor: ${evento.valor})` : ''}`));
    const roteiro = construirRoteiro(resultado.eventos, { escala: 1, ehDoJogador: (id) => id.startsWith('heroi-') });
    const contagem = roteiro.cues.reduce<Record<string, number>>((acc, { cue }) => ({ ...acc, [cue.tipo]: (acc[cue.tipo] ?? 0) + 1 }), {});
    canal.print(`construirRoteiro(...) → ${roteiro.cues.length} cues em ${roteiro.duracao} ms:`);
    Object.entries(contagem).forEach(([tipo, total]) => canal.print(`  • ${tipo} × ${total}`));
    return [...canal.getLinhas()];
  },
};

export function executarDemonstracao(id: IdDeDemonstracao, messages: MessageProvider): string[] {
  return DEMONSTRACOES[id](messages);
}
