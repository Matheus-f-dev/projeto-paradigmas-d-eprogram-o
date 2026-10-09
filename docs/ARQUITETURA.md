# Arquitetura

## Camadas

```
┌─────────────────────────── electron/ ───────────────────────────┐
│ main.ts: janela, IPC validado, gravação atômica em userData     │
│ preload.ts: contextBridge expõe só window.rpg                   │
└───────────────────────────────▲──────────────────────────────────┘
                                │ IPC (canais fixos)
┌─────────────── src/presentation (React) ────────────────────────┐
│ telas, componentes, arte SVG, efeitos (Canvas/WAAPI), áudio,    │
│ Laboratório. Lê JogoSnapshot; age apenas via JogoService.        │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────── src/application ────────────────────────────────┐
│ JogoService (casos de uso) · snapshots · estatísticas · portas   │
└──────────────┬────────────────────────────────┬──────────────────┘
               ▼                                ▼ (interfaces)
┌──────── src/domain ────────────┐   ┌──── src/infrastructure ───────┐
│ modelo, contratos, regras,     │   │ repositórios Electron,        │
│ batalha, paradigmas, eventos   │   │ localStorage e memória        │
└────────────────────────────────┘   └────────────────────────────────┘
       src/i18n (MessageProvider)  ·  src/events (EventBus)  ·  src/shared (contratos de dados validados)
```

**Regras de dependência**

- `domain` não importa nada de fora de `domain`: nem React, nem Electron, nem i18n, nem animação. Os testes do domínio rodam em Node puro.
- `application` depende de `domain` e das **portas** que ela mesma declara (`RepositorioDeProgresso`, `RepositorioDeConfiguracoes`).
- `infrastructure` implementa as portas. `presentation` depende de `application` (e dos tipos do domínio para exibição).
- `src/shared` contém apenas tipos e validadores, sem dependências. Ele é compilado tanto para o renderer quanto para o processo principal.
- A *composition root* é `src/presentation/main.tsx`, onde as implementações concretas são escolhidas e injetadas.

## Fonte única de verdade

O `JogoService` mantém a sessão: grupo, inventário, batalha, estatísticas e checkpoint. A cada mudança ele produz um `JogoSnapshot` imutável e notifica os assinantes. O React o lê com `useSyncExternalStore` (`useJogo`). A interface nunca altera entidades diretamente: toda intenção passa por um caso de uso (`executarAcao`, `equipar`, `transferir`, `usarItemNoAcampamento`...), que devolve `{ ok: true, eventos } | { ok: false, erro }`. Os códigos de erro são chaves de tradução.

## Comunicação por eventos e sincronização com os efeitos

1. O jogador escolhe uma ação (por exemplo, Golpe Brutal no Goblin).
2. `JogoService.executarAcao` cria um `ColetorDeEventos` (implementa `CombatNotifier`).
3. `Batalha.executarAcaoDoJogador` **valida** a ação (turno, alvo, recurso, item) e aplica as regras. As entidades emitem `CombatEvent`s tipados (`brutal_strike`, `damage_received` com `valor`/`restante`, `defeated`, `loot_collected`...). Em seguida, `executarTurnosAutomaticos` resolve os turnos da IA.
4. O resultado volta com a lista de eventos. Os eventos também são publicados no `EventBus` (`combate`). Em modo de desenvolvimento, um `TextCombatNotifier` com `ConsoleOutputChannel` imprime no console o "System.out.println" do PDF.
5. A tela de combate congela a fotografia anterior e entrega os eventos ao `CombatDirector` (`construirRoteiro`). Essa **função pura** gera um roteiro de *cues* temporizadas: preparo, avanço, corte, projétil, impacto, número de dano, derrota e registro.
6. O `ExecutorDeRoteiro` toca o roteiro com Web Animations, o sistema de partículas em Canvas, textos flutuantes no DOM e sons. As barras são atualizadas com os valores **dos eventos**.
7. Ao final, a fotografia congelada é descartada e a tela passa a exibir o estado autoritativo.

Consequência: nenhuma animação calcula dano, gasta mana ou decide vitória. O teste `combatDirector.test.ts` garante que cada número exibido corresponde a um `damage_received` real e que não há impacto sem evento.

## Persistência

- `DadosDeSave` (versão 1) guarda o estágio, o grupo (memento de cada herói, armas e armaduras por `catalogoId`/`id`), o inventário e as estatísticas.
- O salvamento é automático após cada vitória (no acampamento) e também manual.
- Antes de cada batalha é criado um *checkpoint* em memória; "Tentar novamente" reconstrói a sessão a partir dele.
- A validação (`validarDadosDeSave`) roda **no processo principal**, antes de gravar e ao ler, e **no renderer**, ao receber. Dados inválidos são descartados.
- A gravação é atômica: escreve num arquivo temporário e depois renomeia.

## Segurança do Electron

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` e preload dedicado que expõe apenas `window.rpg` (progresso, configurações e sair) com canais fixos. Além disso:

- novas janelas são negadas e a navegação para fora da origem do jogo é bloqueada;
- todas as permissões (câmera, microfone etc.) são recusadas;
- o remetente das mensagens IPC é verificado e o tamanho do arquivo lido é limitado;
- uma CSP restritiva é injetada no build de produção (`script-src 'self'`, sem rede externa).

Esses pontos são verificados em `tests/infrastructure/electron.test.ts`.

## Internacionalização

As classes do PDF são reproduzidas: `MessageProvider` → `MapBasedMessageProvider` → `Portuguese/English/ChineseMessageProvider`, com idioma de reserva (zh → en → pt → chave). Os dicionários de inglês e chinês são tipados contra as chaves do português, então uma chave ausente não compila. `formatarEvento` converte eventos em texto com uma tabela de formatadores **exaustiva por tipo**. Nomes de criaturas, objetos e itens são traduzidos pelo `id`; nomes de classes e métodos exibidos como código não são traduzidos.

## Sistema de efeitos visuais

| Módulo | Responsabilidade |
|---|---|
| `effects/ParticleSystem.ts` | Pool de partículas (sem alocação por quadro) e efeitos vetoriais (onda, clarão, círculo rúnico, corte, projétil) em um único `requestAnimationFrame`; limite configurável e pausa quando a janela fica oculta |
| `effects/presets.ts` | Receitas de partículas (faíscas, fogo, cura, mana, sombra, lascas, escombros...) e emissores ambientes por cenário |
| `effects/CanvasDeParticulas.tsx` | Liga o sistema ao React (redimensionamento e intensidade das configurações) |
| `effects/CombatDirector.ts` | Eventos → roteiro de cues (função pura, testada) |
| `effects/ExecutorDeRoteiro.ts` | Executa as cues: câmera (tremor e zoom), avanço e recuo dos sprites, números flutuantes, clarões, sons |
| `art/Cenario.tsx` + `art/gerador.ts` | Cenários em camadas com paralaxe, névoa, tochas, relâmpagos e raios de luz, gerados proceduralmente com semente fixa |
| `art/personagens.tsx`, `art/itens.tsx` | Ilustrações SVG dos combatentes e itens, com partes animadas (capa, chama, olhos) |
| `animation/transicoes.ts` | Variantes do Framer Motion para telas e listas |
| `audio/SoundEngine.ts` | Sons sintetizados com Web Audio, controlados pelo volume configurado |

**Acessibilidade e desempenho**: o modo "Reduzir movimento" desliga tremor, zoom e paralaxe, encurta os roteiros e reduz as partículas ambientes. A intensidade dos efeitos (completa, reduzida ou mínima) controla a quantidade e o teto de partículas. As partículas não usam estado React. "Acelerar" (ou Espaço) aplica imediatamente o estado das cues restantes.

## Decisões e justificativas

- **Estratégias em vez de condicionais** para derrota, habilidades, IA, efeitos de consumíveis e condições de vitória: é o OCP pedido pelo PDF.
- **Fichas imutáveis no paradigma funcional**: mantêm as entidades como fonte única de verdade e evitam uma "segunda versão" das regras. A cura usa a mesma função pura `calcularCura`.
- **Paradigma estruturado apenas no Laboratório**: o próprio PDF o classifica como retrocesso em um domínio orientado a objetos.
- **Paradigma lógico no jogo**: a base de conhecimento resolve um problema real (afinidades), sem explosão de classes, como o PDF argumenta.
- **Arte vetorial procedural**: não depende de recursos externos nem de licenças de terceiros e mantém a identidade visual consistente.
