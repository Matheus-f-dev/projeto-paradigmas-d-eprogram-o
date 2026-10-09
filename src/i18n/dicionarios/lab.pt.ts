/** Textos do Laboratório de Programação (português). */
export const LAB_PT = {
  'lab.title': 'Laboratório de Programação',
  'lab.subtitle': 'Os conceitos da disciplina, demonstrados com o próprio código do jogo',
  'lab.back': 'Voltar ao menu',
  'lab.explain': 'Explicação',
  'lab.game': 'Aplicação no jogo',
  'lab.files': 'Arquivos e classes',
  'lab.code': 'Código real do projeto',
  'lab.why': 'Por que foi feito assim',
  'lab.evidence': 'Comportamento observável',
  'lab.tests': 'Testes automatizados',
  'lab.pdf': 'Referência no documento',
  'lab.run': 'Executar demonstração',
  'lab.rerun': 'Executar novamente',
  'lab.output': 'Saída (OutputChannel em memória, idioma atual)',
  'lab.diagram': 'Diagrama de classes (gerado a partir de docs/DIAGRAMA_UML.md)',
  'lab.diagramLoading': 'Desenhando o diagrama…',
  'lab.diagramError': 'Não foi possível renderizar o diagrama: {0}',
  'lab.group.poo': 'Orientação a objetos',
  'lab.group.solid': 'SOLID',
  'lab.group.relacoes': 'Associações',
  'lab.group.paradigmas': 'Paradigmas',
  'lab.group.arquitetura': 'Arquitetura',

  'lab.abbott.title': 'Do enunciado às classes (Técnica de Abbott)',
  'lab.abbott.explain':
    'Substantivos comuns viram classes ou atributos, substantivos próprios viram objetos e verbos viram métodos. "Cada personagem possui um nome, vida e ataque" sugere a classe Personagem; "atacar", "receber dano" e "mostrar status" sugerem métodos; "três tipos especiais de combatentes" sugere herança.',
  'lab.abbott.game':
    'Personagem, Guerreiro, Mago e Inimigo existem exatamente como extraídos do enunciado, com atacar, receberDano e mostrarStatus. Mike, Eleven, Dart e Demogorgon são objetos (substantivos próprios).',
  'lab.abbott.why': 'Partir do vocabulário do problema mantém o código reconhecível para quem leu o enunciado.',
  'lab.abbott.evidence': 'Execute a demonstração: é a batalha "Aragorn × Luna × Goblin" do PDF, agora sem System.out.println.',
  'lab.abbott.pdf': 'Págs. 1–3: Descrição, técnica de Abbott e primeiro diagrama de classes.',

  'lab.encapsulamento.title': 'Classe abstrata, encapsulamento e invariantes',
  'lab.encapsulamento.explain':
    'Encapsular é esconder o estado e expor apenas operações que preservam as regras. Personagem é abstrata porque "conceitualmente representa uma abstração incompleta": não existe um personagem que não seja Guerreiro, Mago, Inimigo…',
  'lab.encapsulamento.game':
    'A vida é privada: só muda por receberDano, receberCura ou pela política de derrota. Ela nunca fica negativa nem passa do máximo, e um personagem derrotado não age.',
  'lab.encapsulamento.why':
    'Se a interface pudesse escrever a vida diretamente, a regra de dano poderia ser contornada e existiriam duas fontes de verdade.',
  'lab.encapsulamento.evidence': 'Teste "a vida nunca fica negativa…" e a tentativa de atacar com um personagem derrotado, que lança AcaoInvalidaError.',
  'lab.encapsulamento.pdf': 'Págs. 10–11: "Personagem pode ser instanciada diretamente…" → abstract class Personagem.',

  'lab.heranca.title': 'Herança e polimorfismo',
  'lab.heranca.explain':
    'Guerreiro, Mago e Inimigo "são um" Personagem e herdam vida, ataque e o método atacar. A habilidade especial tem o mesmo nome e comportamentos diferentes: no guerreiro consome fúria, no mago consome mana — isso é polimorfismo.',
  'lab.heranca.game':
    'O combate chama usarHabilidade sem saber qual classe está agindo. O descanso no acampamento também é polimórfico: o Mago recupera mana, o Guerreiro recompõe a fúria e o Arqueiro reabastece flechas.',
  'lab.heranca.why': 'O código de combate depende do tipo base e não precisa de um if por classe.',
  'lab.heranca.evidence': 'Na batalha, Golpe Brutal e Bola de Fogo têm custos e efeitos diferentes acionados pelo mesmo comando "Habilidade".',
  'lab.heranca.pdf': 'Pág. 2: "usar habilidade especial… aparece com nomes diferentes… Isso sugere um polimorfismo."',

  'lab.srp.title': 'S — Responsabilidade Única',
  'lab.srp.explain':
    'Uma classe deve ter um, e apenas um, motivo para mudar. No código original do PDF, receberDano atualizava a vida, formatava texto em português, imprimia no console e decidia a derrota.',
  'lab.srp.game':
    'Personagem apenas altera o próprio estado e emite eventos. A tradução fica no MessageProvider, o destino do texto no OutputChannel, as animações no CombatDirector e a derrota em uma PoliticaDeDerrota.',
  'lab.srp.why': 'Trocar o idioma, a interface ou a mecânica de morte não exige abrir a classe Personagem.',
  'lab.srp.evidence': 'Mude o idioma nas configurações: as mensagens da batalha mudam sem nenhuma alteração no domínio.',
  'lab.srp.pdf': 'Pág. 9: "Violações do SRP" — as quatro responsabilidades de receberDano.',

  'lab.ocp.title': 'O — Aberto/Fechado',
  'lab.ocp.explain':
    'Entidades devem estar abertas para extensão e fechadas para modificação. O PDF pergunta: e se surgir um Zumbi que não morre na primeira vez, ou um Boss que muda de fase aos 0 HP?',
  'lab.ocp.game':
    'Zumbi (Sentinela Morta) e Chefe (Demogorgon) foram adicionados com novas estratégias ReerguerUmaVez e MudancaDeFase. O Arqueiro também entrou sem alterar Guerreiro, Mago ou o combate.',
  'lab.ocp.why': 'Cada nova mecânica é uma nova classe; receberDano continua igual.',
  'lab.ocp.evidence': 'No capítulo 2 a Sentinela se reergue; no capítulo 3 o Demogorgon desperta a fase 2. Execute a demonstração.',
  'lab.ocp.pdf': 'Págs. 9–10: "Violações do OCP", Problemas 1 e 2; pág. 13: Arqueiro e Zumbi como extensões.',

  'lab.lsp.title': 'L — Substituição de Liskov',
  'lab.lsp.explain':
    'Objetos de uma classe derivada devem poder substituir os da classe base sem quebrar o programa. No PDF, chamar usarHabilidade num Inimigo domado gerava erro porque ele não tinha habilidade.',
  'lab.lsp.game':
    'Dart, um Inimigo, luta ao lado dos heróis no capítulo 3. A investida coordenada percorre o grupo tratando todos como Personagem: quem tem habilidade a usa, os demais atacam.',
  'lab.lsp.why': 'Nenhuma subclasse é obrigada a fingir uma habilidade que não possui, então nenhuma quebra o contrato da base.',
  'lab.lsp.evidence': 'Teste "trata Guerreiro, Mago e Inimigo de modo uniforme sem erro" e "todas as especializações respeitam o contrato".',
  'lab.lsp.pdf': 'Págs. 10–13: "Violações do LSP" e a lista de aliados com o monstrinho.',

  'lab.isp.title': 'I — Segregação de Interfaces',
  'lab.isp.explain':
    'É melhor ter várias interfaces específicas do que uma interface genérica gigante. ComHabilidadeEspecial é separada de Personagem, e só quem domina técnicas a implementa.',
  'lab.isp.game':
    'Contratos pequenos: Destrutivel, ComHabilidadeEspecial, ComRecurso, PossuiMana, ContemItens. A Poção de Mana só pode ser usada em quem implementa PossuiMana.',
  'lab.isp.why': 'O Inimigo comum fica enxuto, sem métodos vazios; regras de itens dependem só do que precisam.',
  'lab.isp.evidence': 'Tente usar a Poção de Mana no Guerreiro: a ação é rejeitada pelo domínio.',
  'lab.isp.pdf': 'Págs. 11–13: interface ComHabilidadeEspecial e o uso de instanceof.',

  'lab.dip.title': 'D — Inversão de Dependência',
  'lab.dip.explain':
    'Dependa de abstrações, não de implementações concretas. atacar(Personagem) foi trocado por atacar(Destrutivel), e o domínio passou a depender da interface CombatNotifier.',
  'lab.dip.game':
    'Os heróis atacam baús, o Portão da Cidadela e até membros dos inimigos com o mesmo método. A persistência é acessada pela interface RepositorioDeProgresso (Electron, localStorage ou memória).',
  'lab.dip.why': 'Novos alvos e novos meios de armazenamento entram sem tocar no código de combate.',
  'lab.dip.evidence': 'Quebre o Baú Antigo na Floresta Sombria; derrube o portão no capítulo 2.',
  'lab.dip.pdf': 'Págs. 14–18: interface Destrutivel, Bau e Fortaleza.',

  'lab.i18n.title': 'TOTAL SOLID — idiomas e canais de saída',
  'lab.i18n.explain':
    'MessageProvider traduz chaves para textos; OutputChannel decide o destino; CombatNotifier liga os dois. O PDF demonstra a mesma batalha em português, inglês e mandarim.',
  'lab.i18n.game':
    'As três classes Portuguese/English/ChineseMessageProvider estendem MapBasedMessageProvider. O registro da batalha e toda a interface usam essas traduções; a demonstração escreve num LogInMemoryOutputChannel.',
  'lab.i18n.why': 'Um novo idioma é uma nova classe e um novo dicionário; nenhuma regra do jogo muda.',
  'lab.i18n.evidence': 'A demonstração executa a mesma batalha nos três idiomas, como o Main do PDF.',
  'lab.i18n.pdf': 'Págs. 19–31: "TOTAL SOLID" e "Arquitetura da Solução".',

  'lab.agregacao.title': 'Agregação — o todo possui a parte',
  'lab.agregacao.explain':
    'A parte existe independentemente do todo. Uma arma pode ser adquirida, deixada ou transferida; quando o portador cai, ela continua existindo.',
  'lab.agregacao.game':
    'Armas e armaduras ficam no inventário compartilhado ou equipadas em um herói, nunca nos dois. Inimigos derrotados largam a arma, que vai para o inventário; baús quebrados liberam itens; o GrupoDeBatalha agrega heróis.',
  'lab.agregacao.why': 'O ciclo de vida dos equipamentos é gerido pelo inventário, não pelo personagem.',
  'lab.agregacao.evidence': 'Derrote o Goblin na Floresta: a Adaga Enferrujada aparece no inventário e pode ser equipada.',
  'lab.agregacao.pdf': 'Págs. 32–37: "Acrescentando associações", classe Arma e losango vazio (o--).',

  'lab.composicao.title': 'Composição — o todo contém a parte',
  'lab.composicao.explain':
    'O ciclo de vida da parte depende do todo. Personagem cria os próprios membros (braço e perna) no construtor; quando é derrotado definitivamente, os membros também deixam de existir.',
  'lab.composicao.game':
    'Na batalha é possível mirar no braço ou na perna de um inimigo. Um membro decepado reduz o ataque do dono. Não há como transferir um membro para outro personagem.',
  'lab.composicao.why': 'A lista de membros é privada e congelada: só o próprio Personagem a cria e a destrói.',
  'lab.composicao.evidence': 'Use o Golpe Brutal no braço do Goblin e observe o ataque dele cair.',
  'lab.composicao.pdf': 'Págs. 32–37: classe Membro e losango preenchido (*--).',

  'lab.funcional.title': 'Paradigma funcional',
  'lab.funcional.explain':
    'Declara-se o que se quer (filter, map, reduce) em vez de como iterar. Funções puras não têm efeitos colaterais, e a imutabilidade cria novos valores em vez de alterar os antigos.',
  'lab.funcional.game':
    'curarEFortificar é o efeito do Elixir do Santuário: filtra quem está abaixo do corte, multiplica a vida e soma o bônus, devolvendo fichas novas. As estatísticas da tela de resultados são um reduce sobre os eventos da batalha.',
  'lab.funcional.why': 'O pipeline é testável isoladamente e não duplica regras: usa calcularCura, a mesma função pura usada pelas entidades.',
  'lab.funcional.evidence': 'A demonstração mostra a lista original intacta e as novas fichas curadas.',
  'lab.funcional.pdf': 'Págs. 46–53: ModuloFuncional e a discussão sobre imutabilidade.',

  'lab.logico.title': 'Paradigma lógico',
  'lab.logico.explain':
    'Declaram-se fatos e regras, e um motor de consulta deduz a resposta por casamento de padrões. Evita classes como InimigoVulneravelAFogo e cadeias de if/else.',
  'lab.logico.game':
    'Cada inimigo consulta a BaseDeConhecimento: fogo contra o Demogorgon é CRÍTICO (×2), dano físico contra mortos-vivos é RESISTENTE (×0,5).',
  'lab.logico.why': 'Novas afinidades são novos fatos, sem novas classes nem condicionais.',
  'lab.logico.evidence': 'Lance a Bola de Fogo no Demogorgon: aparece "FRAQUEZA ×2".',
  'lab.logico.pdf': 'Págs. 50–58: ModuloLogico, fatos, regras e o veredito "neutro/questionável".',

  'lab.estruturado.title': 'Paradigma estruturado × POO × funcional',
  'lab.estruturado.explain':
    'O estruturado diz à máquina como agir passo a passo: contadores, while e índices. O PDF conclui que, num domínio orientado a objetos, ele é um contraexemplo (modelo anêmico).',
  'lab.estruturado.game':
    'ModuloEstruturado existe para comparação. No jogo, a investida usa GrupoDeBatalha.realizarInvestida (POO); a versão funcional usa takeWhile.',
  'lab.estruturado.why': 'Mostra as três soluções para o mesmo problema e por que o jogo adota a orientada a objetos.',
  'lab.estruturado.evidence': 'O teste "as três versões… produzem o mesmo resultado" e a demonstração ao lado.',
  'lab.estruturado.pdf': 'Págs. 49, 53–57: gerarPelotao, executarAtaqueEmGrupo, Pelotao e takeWhile.',

  'lab.arquitetura.title': 'Pacotes, camadas e eventos',
  'lab.arquitetura.explain':
    'O PDF sugere separar domain, i18n, presentation e app. O projeto segue essa ideia: o domínio não conhece React, Electron, animações nem idiomas.',
  'lab.arquitetura.game':
    'O jogador escolhe uma ação → o JogoService valida → a Batalha aplica as regras e emite eventos → o CombatDirector transforma eventos em animações, partículas e sons → as barras exibem o estado autoritativo.',
  'lab.arquitetura.why': 'Nenhuma animação calcula dano: a apresentação apenas reage ao que o domínio decidiu.',
  'lab.arquitetura.evidence': 'Os números flutuantes vêm do campo "valor" do evento damage_received emitido pelo domínio.',
  'lab.arquitetura.pdf': 'Pág. 45: "Pacotes (packages) java — uma ideia de reestruturação".',

  'lab.uml.title': 'Diagrama de classes',
  'lab.uml.explain':
    'Herança (<|--), realização de interfaces (<|..), dependência (..>), agregação (o--) e composição (*--), conforme a notação do PDF.',
  'lab.uml.game': 'O diagrama descreve as classes reais do diretório src/domain.',
  'lab.uml.why': 'O mesmo arquivo Markdown é lido pela documentação e por esta tela, evitando cópias desatualizadas.',
  'lab.uml.evidence': 'Compare as setas com os "extends" e "implements" do código.',
  'lab.uml.pdf': 'Págs. 3, 14, 27–31 e 36–37: diagramas mermaid.',
  'lab.uml.tab1': 'Domínio',
  'lab.uml.tab2': 'Estratégias',
  'lab.uml.tab3': 'i18n e aplicação',

  'lab.demo.pdfBattle': '=== Batalha do PDF (versão 01) ===',
  'lab.demo.lspTitle': '=== Aliados: herói, feiticeira e monstrinho domado ===',
  'lab.demo.dipTitle': '=== Testando alvos do cenário ===',
  'lab.demo.ocpTitle': '=== Novas mecânicas de derrota ===',
  'lab.demo.i18nTitle': '=== {0} ===',
  'lab.demo.aggTitle': '=== 1. Agregação: equipar a arma ===',
  'lab.demo.compTitle': '=== 2. Composição: atacando um membro ===',
  'lab.demo.dropTitle': '=== 3. Morte do portador e queda da arma ===',
  'lab.demo.reuseTitle': '=== 4. Reutilização do objeto agregado ===',
  'lab.demo.before': 'Antes da cura funcional:',
  'lab.demo.after': 'Novas fichas geradas pelo pipeline (originais intactas):',
  'lab.demo.line': '- {0} (Vida: {1})',
  'lab.demo.inference': 'Modificador inferido [{0} contra {1}]: {2}x',
  'lab.demo.structured': 'Estruturado (while + índice):',
  'lab.demo.functional': 'Funcional (takeWhile):',
  'lab.demo.oop': 'POO (GrupoDeBatalha.realizarInvestida):',
  'lab.demo.result': '→ alvo com {0} de vida após {1} ataques',
  'lab.demo.platoon': 'Pelotão estruturado gerado com {0} combatentes.',
} as const;
