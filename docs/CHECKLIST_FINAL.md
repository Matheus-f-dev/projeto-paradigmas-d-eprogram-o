# Checklist final

Data da verificação: 09/10/2026.

**Legenda de evidência**: **T** = teste automatizado · **B** = build ou typecheck · **E** = executado no Electron · **V** = inspecionado visualmente por captura de tela (`captures/`, gerada por `scripts/capturar.cjs`).
**Status**: Aprovado · Pendente · Não aplicável.

## Requisitos acadêmicos

| Item | Status | Evidência |
|---|---|---|
| PDF lido e conceitos mapeados | Aprovado | `docs/MAPEAMENTO_ACADEMICO.md` (32 linhas) |
| Personagem abstrata, encapsulamento, invariantes | Aprovado | T: `personagem.test.ts`; B: o construtor `protected` impede `new Personagem` |
| Herança e polimorfismo (Guerreiro, Mago, Inimigo, Arqueiro, Zumbi, Chefe) | Aprovado | T: `solid.test.ts`, `habilidades.test.ts` |
| Golpe Brutal (ataque + 5) e Bola de Fogo (ataque + 10, −5 de mana) | Aprovado | T: `habilidades.test.ts`; V: `completo-15…20` |
| SRP, OCP, LSP, ISP e DIP | Aprovado | T: `solid.test.ts`, `batalha.test.ts`, `i18n.test.ts`, `persistencia.test.ts` |
| TOTAL SOLID (MessageProvider PT/EN/ZH, OutputChannel, CombatNotifier) | Aprovado | T: `i18n.test.ts`; V: `idiomas-*` |
| Agregação (Arma, Armadura, Inventário, Baú, Grupo) | Aprovado | T: `associacoes.test.ts`, `jogoService.test.ts`; V: `completo-11` |
| Composição (Membro) | Aprovado | T: `associacoes.test.ts`, `batalha.test.ts` |
| Paradigma funcional (filter, map, reduce, funções puras, imutabilidade, `curarEFortificar`) | Aprovado | T: `paradigmas.test.ts`; V: `completo-23` (estatísticas) |
| Paradigma lógico | Aprovado | T: `paradigmas.test.ts`; V: maior golpe de 40 (×2) em `chefe-05` |
| Paradigma estruturado (comparação) | Aprovado | T: `paradigmas.test.ts` |
| Diagrama UML fiel ao código | Aprovado | T: `laboratorio.test.ts` (classes existem; `extends`/`implements` conferidos); V: `completo-07` |
| Laboratório com código real, testes e demonstrações | Aprovado | T: `laboratorio.test.ts` (regiões existem, testes citados existem, demos executam); V: `completo-04/05`, `idiomas-04/05` |
| Roteiro de apresentação | Aprovado | `docs/ROTEIRO_APRESENTACAO.md` |

## Fluxos do jogo

| Item | Status | Evidência |
|---|---|---|
| Iniciar pela interface gráfica | Aprovado | E e V: `completo-01` |
| Seleção de classes (2 de 3) | Aprovado | T: `jogoService.test.ts`; V: `completo-08/09` |
| Combate por turnos com validação | Aprovado | T: `batalha.test.ts` (10 testes); V: `completo-13…21` |
| Vida, mana, fúria e flechas atualizadas corretamente | Aprovado | T; V: barras com rastro em `completo-17` |
| Derrota (heróis inconscientes) e vitória | Aprovado | T; V: `completo-23`, `derrota-05` |
| Inventário: equipar, guardar, transferir, consumir | Aprovado | T: `jogoService.test.ts`; V: `completo-11` |
| Reiniciar a batalha e voltar ao menu | Aprovado | T: `jogoService.test.ts › reiniciar a batalha...`; V: botões em `derrota-05` |
| Campanha completa (3 capítulos) e epílogo | Aprovado (lógica) / Pendente (visual) | T: `jogoService.test.ts › completa a campanha inteira`; a tela de epílogo **não foi capturada** |
| Persistência (save automático, continuar, dados inválidos rejeitados) | Aprovado | T: `jogoService.test.ts`, `persistencia.test.ts`; E: "Continuar" carregou o save em `chefe-01`/`derrota-01` (IPC simulado pelo script de captura) |
| Gravação real em disco pelo `electron/main.ts` | Pendente | O código e a validação estão testados por inspeção estática (`electron.test.ts`); a gravação em `%APPDATA%` não foi verificada lendo o arquivo gerado |
| Idiomas nas telas principais | Aprovado | T: chaves completas; V: menu, configurações e laboratório em EN e ZH (`idiomas-*`). Combate em chinês não foi capturado |
| Configurações persistidas | Aprovado | T: `persistencia.test.ts › configurações persistidas...` |

## Efeitos visuais

| Item | Status | Evidência |
|---|---|---|
| Identidade visual própria (tokens, tipografia, molduras) | Aprovado | V: todas as capturas |
| Cenários atmosféricos distintos | Aprovado (7 de 9) / Pendente (2) | V: menu, seleção, floresta, covil, acampamento, vitória, derrota e laboratório. **Portão da Cidadela e epílogo não foram capturados** |
| Sistema de partículas reutilizável com limites | Aprovado | Código: `ParticleSystem.ts`; V: brasas, faíscas, explosão |
| Golpe Brutal e Bola de Fogo com sequências distintas | Aprovado | T: `combatDirector.test.ts`; V: `completo-15…20` |
| Dano, cura e derrota com feedback | Aprovado (dano/derrota) / Pendente (cura visual) | V: números flutuantes e dissolução; a cura não foi capturada (lógica testada) |
| Mudança de fase do chefe e Zumbi que se reergue | Pendente (visual) | T: lógica e roteiro; frames não capturados |
| Efeitos sincronizados ao domínio | Aprovado | T: `combatDirector.test.ts` (7 testes) |
| Tremor e flash sem artefatos | Aprovado | Corrigido o flash dentro da câmera (faixa escura na borda) após a inspeção |
| Redução de movimento e intensidade dos efeitos | Aprovado (código) / Pendente (visual) | Implementado (CSS `data-movimento`, escala dos roteiros, orçamento de partículas); não inspecionado com o modo ativo |
| Áudio | Aprovado (código) / Pendente (auditivo) | Síntese Web Audio sem erros; não é possível ouvir neste ambiente |
| Layout em 1424×861 e 1920×1009 | Aprovado | V: capturas nas duas resoluções; foram corrigidos o sprite da seleção, o acampamento, o baú e a posição de Dart |
| Imagens quebradas ou telas vazias | Aprovado | Nenhuma encontrada nas capturas; todos os recursos são locais |

## Técnicos

| Item | Status | Evidência |
|---|---|---|
| `npm test` | Aprovado | 12 arquivos, **111 testes passando** |
| `npm run build` (typecheck, Vite e Electron) | Aprovado | B: sem erros |
| Electron com `contextIsolation`, `nodeIntegration: false`, `sandbox`, preload e IPC validado | Aprovado | T: `electron.test.ts`; E: `electron .` iniciou sem erros |
| Domínio independente de React/Electron | Aprovado | Testes do domínio rodam em Node puro |
| Instalador `.exe` do Windows | Não aplicável | Fora do escopo pedido; o jogo é executado com `npm start` |
| `npm audit` | Aprovado com ressalva | 2 vulnerabilidades baixas (`katex`, via Mermaid), sem correção disponível |

## Documentação

| Item | Status |
|---|---|
| README.md | Aprovado |
| docs/MAPEAMENTO_ACADEMICO.md | Aprovado |
| docs/ARQUITETURA.md | Aprovado |
| docs/DIAGRAMA_UML.md | Aprovado |
| docs/ROTEIRO_APRESENTACAO.md | Aprovado |
| docs/CHECKLIST_FINAL.md | Aprovado |
