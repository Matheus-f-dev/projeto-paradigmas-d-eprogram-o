# Crônicas da Cidadela

RPG medieval por turnos desenvolvido como trabalho acadêmico da disciplina de Paradigmas de Programação. O jogo implementa, com código real e testado, os conceitos do material **`RPG.pdf` — "RPG (POO + SOLID + outros paradigmas)"**: classes `Personagem`/`Guerreiro`/`Mago`/`Inimigo`, os cinco princípios SOLID, agregação e composição, e os paradigmas estruturado, funcional e lógico.

## Objetivo acadêmico

Demonstrar, num jogo jogável, cada conceito do PDF:

- **POO**: classe abstrata `Personagem`, herança, polimorfismo, encapsulamento e invariantes.
- **SOLID**: SRP, OCP, LSP, ISP e DIP aplicados aos problemas que o próprio PDF aponta (`System.out.println` no domínio, mecânicas de derrota com `if`, `usarHabilidade` em inimigo sem habilidade, `atacar(Personagem)`).
- **"TOTAL SOLID"**: `MessageProvider` (português, inglês e mandarim), `OutputChannel` e `CombatNotifier`.
- **Associações**: agregação (`Arma`, `Armadura`, `Inventario`, `Bau`, `GrupoDeBatalha`) e composição (`Membro`).
- **Paradigmas**: `curarEFortificar` (funcional), `BaseDeConhecimento` (lógico) e `ModuloEstruturado` (estruturado, como contraexemplo).

O mapeamento completo está em [`docs/MAPEAMENTO_ACADEMICO.md`](docs/MAPEAMENTO_ACADEMICO.md).

## Resumo do jogo

O jogador forma um grupo de **dois heróis** (Guerreiro, Maga ou Arqueiro) e atravessa três capítulos:

1. **Floresta Sombria**: dois goblins e um baú que guarda itens.
2. **Portão da Cidadela**: uma sentinela morta-viva que se reergue uma vez, um goblin e um portão (`Fortaleza`) que precisa ser derrubado.
3. **Covil do Demogorgon**: um chefe que muda de fase ao zerar a vida e é fraco a fogo. Dart, um `Inimigo` domado, luta ao lado dos heróis.

Entre as batalhas, o grupo descansa no acampamento, recebe espólios, gerencia equipamentos e salva a jornada.

## Tecnologias

React 18 · TypeScript 5.9 · Vite 7 · Electron 43 · Framer Motion 11 · Canvas 2D (partículas próprias) · Web Audio (sons sintetizados) · Mermaid 11 (diagrama UML no Laboratório) · Vitest 4. As fontes Cinzel, Cinzel Decorative e EB Garamond (licença OFL) são empacotadas localmente. O jogo não usa nenhum recurso de rede.

## Pré-requisitos

- Windows 10 ou 11 (também funciona em Linux e macOS)
- Node.js 20 ou superior (testado com Node 22.14) e npm 10

## Instalação

```bash
npm install
```

O arquivo `.npmrc` ativa `legacy-peer-deps`. Ele contorna uma falha do npm 10.9 com dependências opcionais do Vitest 4.

## Comandos

| Comando | O que faz |
|---|---|
| `npm start` | Faz o build de produção e abre o jogo no Electron |
| `npm run dev:electron` | Desenvolvimento: Vite com HMR mais Electron |
| `npm run dev` | Somente o navegador (`http://localhost:5173`); usa localStorage no lugar do disco |
| `npm test` | Executa os testes automatizados (Vitest) |
| `npm run typecheck` | Verificação de tipos do TypeScript |
| `npm run build` | Typecheck, build do renderer (`dist/`) e compilação do Electron (`dist-electron/`) |
| `npx electron scripts/capturar.cjs [completo\|chefe\|derrota\|idiomas]` | Inspeção visual automatizada: abre o jogo, navega pela interface e salva as capturas em `captures/` (exige `npm run build` antes) |

### Como executar no Windows

1. Abra o PowerShell ou o Prompt de Comando na pasta do projeto.
2. Execute `npm install` (somente na primeira vez).
3. Execute `npm start`. A janela do jogo abre depois do build, que leva cerca de 20 s.

> Se o Electron abrir como Node puro (erro `Cannot read properties of undefined (reading 'whenReady')`), a variável `ELECTRON_RUN_AS_NODE` está definida no terminal. Isso acontece, por exemplo, em terminais iniciados por algumas extensões do VS Code. Remova-a antes de executar: `Remove-Item Env:ELECTRON_RUN_AS_NODE` no PowerShell, ou `unset ELECTRON_RUN_AS_NODE` no Git Bash.

O progresso fica em `%APPDATA%\Crônicas da Cidadela\jornada.json` (pasta definida pelo `productName`) e as preferências em `configuracoes.json`, na mesma pasta.

## Controles e funcionalidades

- **Menu**: nova jornada, continuar (habilitado apenas com save válido), Laboratório, configurações, créditos e sair.
- **Seleção**: clique numa classe para ver os detalhes e use **Recrutar** (ou dê um clique duplo). São dois heróis.
- **Acampamento**: equipamentos e itens (equipar, guardar, passar a arma ou armadura para o outro herói, usar consumíveis), salvar e marchar.
- **Combate**:
  - `1` ataca, `2` usa a habilidade, `3` abre os itens e `4` faz a investida coordenada (uma vez por batalha).
  - Depois de escolher a ação, clique no alvo. Também é possível mirar no **braço** ou na **perna** de um inimigo.
  - `Esc` cancela a mira. `Espaço` ou `Enter` aceleram a animação em andamento.
- **Configurações**: idioma (PT/EN/中文), volume, intensidade dos efeitos, redução de movimento e velocidade do combate. Todas são persistidas.
- **Laboratório de Programação**: cada conceito com explicação, aplicação no jogo, trecho do código **real**, testes, referência ao PDF e uma demonstração executável.

## Estrutura do projeto

```
electron/            processo principal (main.ts) e preload seguro (preload.ts)
src/domain/          regras puras do jogo (sem React/Electron)
  contracts/         interfaces: Destrutivel, ComHabilidadeEspecial, CombatNotifier, PoliticaDeDerrota...
  model/             Personagem, Guerreiro, Mago, Arqueiro, Inimigo, Zumbi, Chefe, Membro, Bau, Fortaleza, GrupoDeBatalha
  equipment/         Arma, Armadura, Consumivel, Inventario, catálogo
  abilities/         GolpeBrutal, BolaDeFogo, FlechaPerfurante, InvestidaSombria
  combat/            Batalha, condições de vitória, erros
  rules/             funções puras, políticas de derrota, comportamentos de IA
  paradigms/         ModuloFuncional, ModuloLogico, ModuloEstruturado
  world/             heróis e estágios da campanha
  events/            eventos tipados do combate
src/application/     JogoService (casos de uso), snapshots, estatísticas (reduce), portas
src/events/          EventBus tipado
src/i18n/            MessageProvider e dicionários pt/en/zh
src/infrastructure/  repositórios (Electron, localStorage, memória)
src/shared/          contratos e validação de dados entre processos
src/presentation/    React: telas, componentes, arte SVG, efeitos, áudio, laboratório
tests/               testes automatizados
docs/                documentação acadêmica e técnica
scripts/             roteiro de inspeção visual
```

## Documentação

- [`docs/MAPEAMENTO_ACADEMICO.md`](docs/MAPEAMENTO_ACADEMICO.md): conceitos do PDF, onde estão no código e como verificá-los
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md): camadas, eventos, persistência, segurança e efeitos
- [`docs/DIAGRAMA_UML.md`](docs/DIAGRAMA_UML.md): diagramas de classes em Mermaid (renderizados também no Laboratório)
- [`docs/ROTEIRO_APRESENTACAO.md`](docs/ROTEIRO_APRESENTACAO.md): roteiro de demonstração para o professor
- [`docs/CHECKLIST_FINAL.md`](docs/CHECKLIST_FINAL.md): requisitos, status e evidências

## Limitações conhecidas

- Não há instalador `.exe`; o jogo é executado com `npm start`. Ver o checklist.
- A arte é vetorial (SVG) e procedural, criada para o projeto. Não há ilustrações pintadas nem animações quadro a quadro.
- O áudio é sintetizado em tempo real (Web Audio). Não há trilha musical.
- O bundle do renderer tem cerca de 1 MB, mais o Mermaid, que é carregado sob demanda e só no Laboratório.
- `npm audit` aponta 2 vulnerabilidades de severidade baixa no `katex`, dependência transitiva do Mermaid, sem correção disponível na linha 11.
