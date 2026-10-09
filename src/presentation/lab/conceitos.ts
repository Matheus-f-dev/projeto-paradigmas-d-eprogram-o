import type { NomeDoIcone } from '../components/Icone';

export type GrupoDoLaboratorio = 'poo' | 'solid' | 'relacoes' | 'paradigmas' | 'arquitetura';

export type IdDeDemonstracao =
  | 'batalha-do-pdf'
  | 'encapsulamento'
  | 'idiomas'
  | 'ocp'
  | 'lsp'
  | 'isp'
  | 'dip'
  | 'associacoes'
  | 'funcional'
  | 'logico'
  | 'estruturado'
  | 'eventos';

export interface Trecho {
  /** Caminho relativo à raiz do projeto. */
  readonly arquivo: string;
  /** Nome da região marcada no código com `// #region lab:<nome>`. */
  readonly regiao: string;
}

export interface Conceito {
  readonly id: string;
  readonly grupo: GrupoDoLaboratorio;
  readonly icone: NomeDoIcone;
  readonly trechos: readonly Trecho[];
  readonly classes: readonly string[];
  readonly testes: readonly string[];
  readonly demonstracao?: IdDeDemonstracao;
  readonly diagrama?: boolean;
}

const D = 'src/domain';

/**
 * Registro dos conceitos do Laboratório. Os trechos apontam para regiões
 * reais do código-fonte (um teste automatizado garante que cada uma existe),
 * de modo que os exemplos exibidos nunca ficam desatualizados.
 */
export const CONCEITOS: readonly Conceito[] = [
  {
    id: 'abbott',
    grupo: 'poo',
    icone: 'pergaminho',
    trechos: [
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'personagem' },
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'atacar' },
    ],
    classes: ['Personagem', 'Guerreiro', 'Mago', 'Inimigo'],
    testes: ['tests/domain/personagem.test.ts › reproduz a batalha do PDF (Aragorn, Luna e Goblin)'],
    demonstracao: 'batalha-do-pdf',
  },
  {
    id: 'encapsulamento',
    grupo: 'poo',
    icone: 'escudo',
    trechos: [
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'personagem' },
      { arquivo: `${D}/rules/calculos.ts`, regiao: 'funcoes-puras' },
    ],
    classes: ['Personagem (abstract)', 'AcaoInvalidaError', 'calcularDanoAposDefesa', 'calcularCura'],
    testes: [
      'tests/domain/personagem.test.ts › a vida nunca fica negativa e o personagem é derrotado ao chegar a zero',
      'tests/domain/personagem.test.ts › personagem derrotado não pode atacar',
      'tests/domain/personagem.test.ts › getStatus expõe uma cópia do estado, sem permitir alteração interna',
    ],
    demonstracao: 'encapsulamento',
  },
  {
    id: 'heranca',
    grupo: 'poo',
    icone: 'camadas',
    trechos: [
      { arquivo: `${D}/model/Guerreiro.ts`, regiao: 'guerreiro' },
      { arquivo: `${D}/model/Mago.ts`, regiao: 'mago' },
      { arquivo: `${D}/model/Inimigo.ts`, regiao: 'inimigo' },
    ],
    classes: ['Guerreiro extends Personagem', 'Mago extends Personagem', 'Arqueiro extends Personagem', 'Inimigo extends Personagem', 'Zumbi/Chefe extends Inimigo'],
    testes: ['tests/domain/habilidades.test.ts › Golpe Brutal (Guerreiro)', 'tests/domain/habilidades.test.ts › Bola de Fogo (Mago)'],
    demonstracao: 'batalha-do-pdf',
  },
  {
    id: 'srp',
    grupo: 'solid',
    icone: 'runa',
    trechos: [
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'atacar' },
      { arquivo: 'src/presentation/output/OutputChannel.ts', regiao: 'output-channel' },
    ],
    classes: ['Personagem', 'CombatNotifier', 'MessageProvider', 'OutputChannel', 'CombatDirector'],
    testes: ['tests/domain/personagem.test.ts › mostrarStatus notifica a vida atual em vez de imprimir no console (SRP)'],
    demonstracao: 'idiomas',
  },
  {
    id: 'ocp',
    grupo: 'solid',
    icone: 'mais',
    trechos: [
      { arquivo: `${D}/contracts/PoliticaDeDerrota.ts`, regiao: 'politica-de-derrota' },
      { arquivo: `${D}/rules/politicasDeDerrota.ts`, regiao: 'politicas' },
      { arquivo: `${D}/abilities/Habilidade.ts`, regiao: 'habilidade' },
    ],
    classes: ['PoliticaDeDerrota', 'ReerguerUmaVez (Zumbi)', 'MudancaDeFase (Chefe)', 'Habilidade', 'Arqueiro'],
    testes: [
      'tests/domain/solid.test.ts › o Zumbi se reergue uma única vez',
      'tests/domain/solid.test.ts › o Chefe muda de fase ao zerar a vida pela primeira vez',
    ],
    demonstracao: 'ocp',
  },
  {
    id: 'lsp',
    grupo: 'solid',
    icone: 'espadasCruzadas',
    trechos: [
      { arquivo: `${D}/model/GrupoDeBatalha.ts`, regiao: 'grupo' },
      { arquivo: `${D}/model/Inimigo.ts`, regiao: 'inimigo' },
    ],
    classes: ['Personagem', 'Inimigo (Dart, aliado domado)', 'GrupoDeBatalha.realizarInvestida'],
    testes: [
      'tests/domain/solid.test.ts › trata Guerreiro, Mago e Inimigo de modo uniforme sem erro',
      'tests/domain/solid.test.ts › todas as especializações respeitam o contrato de Personagem',
    ],
    demonstracao: 'lsp',
  },
  {
    id: 'isp',
    grupo: 'solid',
    icone: 'diagrama',
    trechos: [
      { arquivo: `${D}/contracts/ComHabilidadeEspecial.ts`, regiao: 'com-habilidade-especial' },
      { arquivo: `${D}/contracts/ComRecurso.ts`, regiao: 'possui-mana' },
    ],
    classes: ['ComHabilidadeEspecial', 'ComRecurso', 'PossuiMana', 'ContemItens', 'Destrutivel'],
    testes: [
      'tests/domain/solid.test.ts › Inimigo comum não é obrigado a implementar a habilidade especial (ISP)',
      'tests/domain/batalha.test.ts › a Poção de Mana só pode ser usada em quem possui mana (ISP)',
    ],
    demonstracao: 'isp',
  },
  {
    id: 'dip',
    grupo: 'solid',
    icone: 'alvo',
    trechos: [
      { arquivo: `${D}/contracts/Destrutivel.ts`, regiao: 'destrutivel' },
      { arquivo: `${D}/model/Bau.ts`, regiao: 'bau' },
      { arquivo: `${D}/model/Fortaleza.ts`, regiao: 'fortaleza' },
      { arquivo: 'src/application/portas.ts', regiao: 'portas' },
    ],
    classes: ['Destrutivel', 'Bau', 'Fortaleza', 'Membro', 'RepositorioDeProgresso', 'CombatNotifier'],
    testes: ['tests/domain/solid.test.ts › o mesmo atacar() funciona contra baú e fortaleza (exemplo do PDF)', 'tests/infrastructure/persistencia.test.ts › escolhe a implementação conforme o ambiente'],
    demonstracao: 'dip',
  },
  {
    id: 'i18n',
    grupo: 'solid',
    icone: 'globo',
    trechos: [
      { arquivo: 'src/i18n/MessageProvider.ts', regiao: 'message-provider' },
      { arquivo: 'src/i18n/provedores.ts', regiao: 'provedores' },
      { arquivo: 'src/presentation/output/OutputChannel.ts', regiao: 'output-channel' },
    ],
    classes: ['MessageProvider', 'MapBasedMessageProvider', 'Portuguese/English/ChineseMessageProvider', 'OutputChannel', 'TextCombatNotifier'],
    testes: ['tests/i18n/i18n.test.ts › a mesma batalha produz textos nos três idiomas (Main do PDF)', 'tests/i18n/i18n.test.ts › inglês e chinês cobrem todas as chaves do português'],
    demonstracao: 'idiomas',
  },
  {
    id: 'agregacao',
    grupo: 'relacoes',
    icone: 'espada',
    trechos: [
      { arquivo: `${D}/equipment/Arma.ts`, regiao: 'arma' },
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'equipar' },
      { arquivo: `${D}/equipment/Inventario.ts`, regiao: 'inventario' },
      { arquivo: 'src/application/JogoService.ts', regiao: 'transferir' },
    ],
    classes: ['Arma', 'Armadura', 'Inventario', 'Bau (ContemItens)', 'GrupoDeBatalha'],
    testes: [
      'tests/domain/associacoes.test.ts › transferência: a arma sai de um personagem e vai para outro sem ser recriada',
      'tests/domain/associacoes.test.ts › itens de um baú sobrevivem à destruição do baú',
      'tests/application/jogoService.test.ts › transfere a arma entre heróis respeitando a classe',
    ],
    demonstracao: 'associacoes',
  },
  {
    id: 'composicao',
    grupo: 'relacoes',
    icone: 'coracao',
    trechos: [
      { arquivo: `${D}/model/Membro.ts`, regiao: 'membro' },
      { arquivo: `${D}/model/Personagem.ts`, regiao: 'personagem' },
    ],
    classes: ['Personagem *-- Membro'],
    testes: [
      'tests/domain/associacoes.test.ts › a derrota definitiva encerra o ciclo de vida de todos os membros',
      'tests/domain/associacoes.test.ts › membros não podem ser adicionados ou removidos por fora do Personagem',
      'tests/domain/batalha.test.ts › é possível mirar nos membros do inimigo (composição como alvo)',
    ],
    demonstracao: 'associacoes',
  },
  {
    id: 'funcional',
    grupo: 'paradigmas',
    icone: 'raio',
    trechos: [
      { arquivo: `${D}/paradigms/ModuloFuncional.ts`, regiao: 'cura-funcional' },
      { arquivo: `${D}/equipment/Consumivel.ts`, regiao: 'bencao' },
      { arquivo: 'src/application/estatisticas.ts', regiao: 'reduce' },
      { arquivo: `${D}/rules/calculos.ts`, regiao: 'funcoes-puras' },
    ],
    classes: ['curarEFortificar', 'comVida', 'BencaoDoSantuario', 'calcularEstatisticas (reduce)'],
    testes: [
      'tests/domain/paradigmas.test.ts › filtra quem está abaixo do corte e multiplica a vida (exemplo do PDF)',
      'tests/domain/paradigmas.test.ts › não altera a lista nem as fichas originais (imutabilidade)',
    ],
    demonstracao: 'funcional',
  },
  {
    id: 'logico',
    grupo: 'paradigmas',
    icone: 'livro',
    trechos: [
      { arquivo: `${D}/paradigms/ModuloLogico.ts`, regiao: 'logico' },
      { arquivo: `${D}/model/Inimigo.ts`, regiao: 'inimigo' },
    ],
    classes: ['Fato', 'RegraDeAfinidade', 'BaseDeConhecimento', 'AvaliadorDeAfinidade'],
    testes: [
      'tests/domain/paradigmas.test.ts › infere os multiplicadores do exemplo do PDF',
      'tests/domain/paradigmas.test.ts › o inimigo consulta a base: a Bola de Fogo causa dano dobrado no Demogorgon',
    ],
    demonstracao: 'logico',
  },
  {
    id: 'estruturado',
    grupo: 'paradigmas',
    icone: 'ampulheta',
    trechos: [
      { arquivo: `${D}/paradigms/ModuloEstruturado.ts`, regiao: 'estruturado' },
      { arquivo: `${D}/paradigms/ModuloEstruturado.ts`, regiao: 'batalha-funcional' },
      { arquivo: `${D}/model/GrupoDeBatalha.ts`, regiao: 'grupo' },
    ],
    classes: ['ModuloEstruturado', 'BatalhaFuncional', 'GrupoDeBatalha'],
    testes: ['tests/domain/paradigmas.test.ts › as três versões param quando o alvo é destruído e produzem o mesmo resultado'],
    demonstracao: 'estruturado',
  },
  {
    id: 'arquitetura',
    grupo: 'arquitetura',
    icone: 'camadas',
    trechos: [
      { arquivo: 'src/application/JogoService.ts', regiao: 'executar-acao' },
      { arquivo: `${D}/combat/Batalha.ts`, regiao: 'batalha' },
      { arquivo: 'src/presentation/effects/CombatDirector.ts', regiao: 'diretor' },
      { arquivo: 'src/infrastructure/persistence/repositorios.ts', regiao: 'repositorios' },
    ],
    classes: ['JogoService', 'Batalha', 'CombatDirector', 'ExecutorDeRoteiro', 'Repositórios'],
    testes: [
      'tests/presentation/combatDirector.test.ts › cada número de dano exibido corresponde a um evento damage_received real',
      'tests/presentation/combatDirector.test.ts › sem dano no domínio, não há número de dano nem impacto inventado',
    ],
    demonstracao: 'eventos',
  },
  {
    id: 'uml',
    grupo: 'arquitetura',
    icone: 'diagrama',
    trechos: [],
    classes: ['docs/DIAGRAMA_UML.md'],
    testes: ['tests/presentation/laboratorio.test.ts › o diagrama UML cita apenas classes que existem no código'],
    diagrama: true,
  },
];

export const GRUPOS: readonly GrupoDoLaboratorio[] = ['poo', 'solid', 'relacoes', 'paradigmas', 'arquitetura'];
