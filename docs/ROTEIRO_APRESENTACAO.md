# Roteiro de apresentação (cerca de 15 a 20 minutos)

Preparação: `npm install`, depois `npm test` e `npm start`. Deixe abertos no editor os arquivos citados abaixo.

## 1. Abertura (1 min)

- **Mostrar**: o menu principal (cenário com castelo, lua, tochas e brasas).
- **Dizer**: "O jogo implementa o material RPG.pdf: POO, SOLID, associações e os paradigmas funcional, lógico e estruturado."

## 2. Do enunciado às classes (2 min)

- **Abrir**: Laboratório → "Do enunciado às classes" → **Executar demonstração**. É a batalha Aragorn × Luna × Goblin do PDF.
- **Arquivo**: `src/domain/model/Personagem.ts` (classe abstrata, atributos privados, `atacar(Destrutivel)`).
- **Explicar**: a técnica de Abbott; `Personagem` é abstrata porque representa uma abstração incompleta (p. 10 do PDF).

## 3. Jogo: seleção e combate (4 min)

1. Nova jornada → selecionar **Guerreiro** e **Maga** (atributos e habilidade vêm das classes do domínio).
2. Acampamento → **Equipamentos e itens**: mostrar o inventário compartilhado (agregação).
3. Marchar → Floresta Sombria:
   - **Golpe Brutal** no Goblin: fúria, salto, corte e impacto pesado. Dano = ataque + 5.
   - **Bola de Fogo**: círculo rúnico, projétil e explosão. Dano = ataque + 10; a mana cai 5.
   - **Mirar membro**: atacar o **braço** de um goblin (chips "Mirar membro"); ao ser decepado, o ataque dele cai (composição).
   - Quebrar o **Baú Antigo** com o mesmo `atacar()` (DIP); os itens vão para o inventário (agregação).
   - Mostrar a **Crônica da batalha** em sincronia com as animações.
- **Dizer**: "As animações apenas reagem aos eventos do domínio; o número 16 na tela é o campo `valor` do evento `damage_received`."
- **Arquivos**: `src/domain/combat/Batalha.ts`, `src/presentation/effects/CombatDirector.ts`.

## 4. SOLID (5 min)

| Princípio | O que mostrar | Arquivo |
|---|---|---|
| SRP | Trocar o idioma para 中文 nas Configurações e voltar ao combate: o texto muda e o domínio não | `src/presentation/output/OutputChannel.ts` |
| OCP | Laboratório → OCP → demonstração (Zumbi que se reergue, Chefe que muda de fase) | `src/domain/rules/politicasDeDerrota.ts`, `src/domain/model/Zumbi.ts` |
| LSP | Laboratório → LSP: aliados com o monstrinho domado. No capítulo 3, Dart luta ao lado dos heróis | `src/domain/model/GrupoDeBatalha.ts` |
| ISP | Laboratório → ISP → demonstração (`podeAplicar(Guerreiro) → false`). No jogo, a Poção de Mana nunca habilita o Guerreiro como alvo | `src/domain/contracts/ComHabilidadeEspecial.ts`, `ComRecurso.ts` |
| DIP | Baú e Portão da Cidadela atacados com o mesmo método; repositórios por interface | `src/domain/contracts/Destrutivel.ts`, `src/application/portas.ts` |

## 5. Associações (2 min)

- Laboratório → **Agregação** → demonstração: Mike equipa a Espada Vorpal, cai e larga a arma; Dustin a equipa.
- Laboratório → **Composição**: os membros são criados no construtor e destruídos na derrota definitiva.
- **Testes**: `tests/domain/associacoes.test.ts`.

## 6. Paradigmas (3 min)

- **Funcional**: Laboratório → demonstração de `curarEFortificar` (a lista original fica intacta). No jogo, é o Elixir do Santuário. As estatísticas da tela de resultado são um `reduce`.
- **Lógico**: Laboratório → inferência. No capítulo 3, a Bola de Fogo mostra "FRAQUEZA ×2" no Demogorgon.
- **Estruturado × POO × funcional**: as três versões da investida produzem o mesmo resultado. Justificar por que o jogo usa a versão POO (pp. 57–58 do PDF).

## 7. Arquitetura, testes e UML (2 min)

- Laboratório → **Diagrama de classes**: os três diagramas são lidos de `docs/DIAGRAMA_UML.md`.
- Executar `npm test`; o resultado esperado é **12 arquivos e 111 testes passando**.
- Citar a segurança do Electron (`electron/main.ts`: `contextIsolation`, `sandbox`, IPC validado).

## Perguntas prováveis

- **"Onde está o `instanceof` do PDF?"** No TypeScript interfaces não existem em tempo de execução; `possuiHabilidadeEspecial()` é o *type guard* equivalente.
- **"Por que o CombatNotifier é interface?"** Para que o domínio dependa só da abstração (DIP). A classe do PDF é o `TextCombatNotifier`.
- **"A animação pode errar o dano?"** Não: o roteiro é construído a partir dos eventos, e há teste garantindo isso.
- **"Por que fichas imutáveis no funcional?"** Para não criar uma segunda fonte de verdade; a regra de cura é a mesma função pura usada pelas entidades.
