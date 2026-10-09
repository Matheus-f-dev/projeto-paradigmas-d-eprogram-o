# Diagrama UML de classes

Os diagramas abaixo descrevem as classes **realmente implementadas** em `src/`. A notação segue a usada no PDF:

| Relação | Mermaid | Significado no projeto |
|---|---|---|
| Herança | `<\|--` | `Guerreiro`, `Mago`, `Arqueiro` e `Inimigo` **são um** `Personagem` |
| Realização de interface | `<\|..` | `Personagem`, `Membro`, `Bau` e `Fortaleza` **assinam** `Destrutivel` |
| Composição | `*--` (losango cheio) | `Personagem` **contém** `Membro`: cria no construtor e destrói na derrota definitiva |
| Agregação | `o--` (losango vazio) | `Personagem` **possui** `Arma`/`Armadura`; `Inventario` e `Bau` agregam itens; `GrupoDeBatalha` agrega personagens |
| Associação | `-->` | referência mantida para colaborar (ex.: `Inimigo --> AvaliadorDeAfinidade`) |
| Dependência | `..>` | uso temporário, só durante uma chamada (ex.: `Personagem ..> CombatNotifier`) |

> Este arquivo é lido em tempo de execução pelo **Laboratório de Programação** (`src/presentation/lab/trechos.ts`), que renderiza os blocos Mermaid abaixo. Alterar o diagrama aqui altera o diagrama do jogo.

## 1. Núcleo do domínio: herança, contratos, agregação e composição

```mermaid
classDiagram
    direction TB
    class Destrutivel {
        <<interface>>
        +id string
        +receberDano(valor, notifier, elemento) void
        +estaDestruido() boolean
        +getNome() string
        +getVida() number
        +getVidaMaxima() number
    }
    class ComHabilidadeEspecial {
        <<interface>>
        +usarHabilidade(alvo, notifier) boolean
        +podeUsarHabilidade() boolean
        +getHabilidade() Habilidade
    }
    class ComRecurso {
        <<interface>>
        +getRecurso() Recurso
    }
    class PossuiMana {
        <<interface>>
        +getMana() number
        +restaurarMana(quantidade, notifier) number
    }
    class ContemItens {
        <<interface>>
        +getItens() Item[]
        +retirarItens() Item[]
    }
    class Personagem {
        <<abstract>>
        -nome string
        -vida number
        -vidaMaxima number
        -ataqueBase number
        -membros Membro[]
        -armaEquipada Arma
        -armaduraEquipada Armadura
        +atacar(alvo, notifier) void
        +receberDano(valor, notifier, elemento) void
        +mostrarStatus(notifier) void
        +receberCura(quantidade, notifier) number
        +equiparArma(arma, notifier) Arma
        +droparArmaAoMorrer(notifier) Arma
        +descansar() void
        #calcularDanoRecebido(valor, elemento, notifier) number
    }
    class Guerreiro {
        -furia number
        +usarHabilidade(alvo, notifier) boolean
    }
    class Mago {
        -mana number
        +usarHabilidade(alvo, notifier) boolean
        +restaurarMana(quantidade, notifier) number
    }
    class Arqueiro {
        -flechas number
        +usarHabilidade(alvo, notifier) boolean
    }
    class Inimigo {
        +tipoCriatura string
        #calcularDanoRecebido(valor, elemento, notifier) number
    }
    class Zumbi
    class Chefe {
        +usarHabilidade(alvo, notifier) boolean
    }
    class Membro {
        -integridade number
        -penalidadeDeAtaque number
        +getPenalidadeAtiva() number
    }
    class ItemBase {
        <<interface>>
        +id string
        +catalogoId string
        +getNome() string
    }
    class Arma {
        -bonusAtaque number
        +tipo TipoDeArma
        +getBonusAtaque() number
    }
    class Armadura {
        -defesa number
        +getDefesa() number
    }
    class Consumivel {
        +efeito EfeitoDeConsumivel
    }
    class Inventario {
        -itens Item[]
        +adicionar(item) void
        +retirar(itemId) Item
    }
    class Bau {
        -durabilidade number
    }
    class Fortaleza {
        -blindagem number
    }
    class GrupoDeBatalha {
        +realizarInvestida(alvo, notifier) void
        +desfazer() Personagem[]
    }

    Destrutivel <|.. Personagem : implementa
    Destrutivel <|.. Membro : implementa
    Destrutivel <|.. Bau : implementa
    Destrutivel <|.. Fortaleza : implementa
    ContemItens <|.. Bau : implementa

    Personagem <|-- Guerreiro : herda
    Personagem <|-- Mago : herda
    Personagem <|-- Arqueiro : herda
    Personagem <|-- Inimigo : herda
    Inimigo <|-- Zumbi : herda
    Inimigo <|-- Chefe : herda

    ComHabilidadeEspecial <|.. Guerreiro : implementa
    ComHabilidadeEspecial <|.. Mago : implementa
    ComHabilidadeEspecial <|.. Arqueiro : implementa
    ComHabilidadeEspecial <|.. Chefe : implementa
    ComRecurso <|.. Guerreiro : implementa
    ComRecurso <|.. Mago : implementa
    ComRecurso <|.. Arqueiro : implementa
    PossuiMana <|.. Mago : implementa

    ItemBase <|.. Arma : implementa
    ItemBase <|.. Armadura : implementa
    ItemBase <|.. Consumivel : implementa

    Personagem "1" *-- "1..*" Membro : compõe
    Personagem "1" o-- "0..1" Arma : agrega
    Personagem "1" o-- "0..1" Armadura : agrega
    Inventario "1" o-- "0..*" ItemBase : agrega
    Bau "1" o-- "0..*" ItemBase : agrega
    GrupoDeBatalha "1" o-- "1..*" Personagem : agrega

    Personagem ..> Destrutivel : ataca
```

## 2. Estratégias (OCP) e paradigma lógico

```mermaid
classDiagram
    direction LR
    class Habilidade {
        <<interface>>
        +id string
        +elemento Elemento
        +custo number
        +calcularDano(ataque) number
        +executar(usuario, alvo, notifier) void
    }
    class GolpeBrutal
    class BolaDeFogo
    class FlechaPerfurante
    class InvestidaSombria
    Habilidade <|.. GolpeBrutal
    Habilidade <|.. BolaDeFogo
    Habilidade <|.. FlechaPerfurante
    Habilidade <|.. InvestidaSombria
    Guerreiro --> GolpeBrutal : usa
    Mago --> BolaDeFogo : usa
    Arqueiro --> FlechaPerfurante : usa
    Chefe --> InvestidaSombria : usa

    class PoliticaDeDerrota {
        <<interface>>
        +aoZerarVida(alvo, notifier) DesfechoDaDerrota
    }
    class DerrotaDefinitiva
    class Inconsciencia
    class ReerguerUmaVez
    class MudancaDeFase
    PoliticaDeDerrota <|.. DerrotaDefinitiva
    PoliticaDeDerrota <|.. Inconsciencia
    PoliticaDeDerrota <|.. ReerguerUmaVez
    PoliticaDeDerrota <|.. MudancaDeFase
    Personagem --> PoliticaDeDerrota : delega a derrota

    class AvaliadorDeAfinidade {
        <<interface>>
        +inferirMultiplicadorDano(elemento, tipo) number
    }
    class BaseDeConhecimento {
        -fatos Map
        -regras RegraDeAfinidade[]
        +declararFato(predicado, arg1, arg2) void
        +declararRegra(condicao, efeito) void
        +consultar(predicado, arg1, arg2) boolean
    }
    AvaliadorDeAfinidade <|.. BaseDeConhecimento
    Inimigo --> AvaliadorDeAfinidade : consulta fraquezas

    class ComportamentoDeCombate {
        <<interface>>
        +decidir(situacao) DecisaoDeCombate
    }
    class AtacarMaisFraco
    class AtacarAleatorio
    class Implacavel
    ComportamentoDeCombate <|.. AtacarMaisFraco
    ComportamentoDeCombate <|.. AtacarAleatorio
    ComportamentoDeCombate <|.. Implacavel
    Inimigo --> ComportamentoDeCombate : decide

    class CondicaoDeVitoria {
        <<interface>>
        +foiAtendida(campo) boolean
    }
    class DerrotarTodosOsInimigos
    class DerrotarInimigosEDestruir
    CondicaoDeVitoria <|.. DerrotarTodosOsInimigos
    CondicaoDeVitoria <|.. DerrotarInimigosEDestruir
    class Batalha {
        +executarAcaoDoJogador(acao, notifier) void
        +executarTurnosAutomaticos(notifier) void
    }
    Batalha --> CondicaoDeVitoria : verifica
    Batalha --> GrupoDeBatalha : heróis
    Batalha --> Inventario : espólio
```

## 3. Internacionalização, saída e aplicação (TOTAL SOLID)

```mermaid
classDiagram
    direction LR
    class CombatNotifier {
        <<interface>>
        +notify(evento) void
    }
    class MessageProvider {
        <<interface>>
        +getMessage(key, args) string
        +has(key) boolean
    }
    class MapBasedMessageProvider {
        <<abstract>>
        #messages Record
        +getMessage(key, args) string
    }
    class PortugueseMessageProvider
    class EnglishMessageProvider
    class ChineseMessageProvider
    class OutputChannel {
        <<interface>>
        +print(message) void
    }
    class ConsoleOutputChannel
    class LogInMemoryOutputChannel {
        +getLog() string
    }
    class TextCombatNotifier {
        -output OutputChannel
        -messages MessageProvider
        +notify(evento) void
    }
    class ColetorDeEventos {
        +eventos CombatEvent[]
        +notify(evento) void
    }
    class JogoService {
        +novaPartida(classes) ResultadoDeAcao
        +iniciarBatalha() ResultadoDeAcao
        +executarAcao(acao) ResultadoDeAcao
        +seguirParaAcampamento() Promise
        +equipar(personagemId, itemId) ResultadoDeAcao
        +transferir(deId, paraId, espaco) ResultadoDeAcao
    }
    class RepositorioDeProgresso {
        <<interface>>
        +carregar() Promise
        +salvar(dados) Promise
        +limpar() Promise
    }
    class RepositorioDeProgressoElectron
    class RepositorioDeProgressoLocalStorage
    class RepositorioDeProgressoEmMemoria

    MessageProvider <|.. MapBasedMessageProvider
    MapBasedMessageProvider <|-- PortugueseMessageProvider
    MapBasedMessageProvider <|-- EnglishMessageProvider
    MapBasedMessageProvider <|-- ChineseMessageProvider
    OutputChannel <|.. ConsoleOutputChannel
    OutputChannel <|.. LogInMemoryOutputChannel
    CombatNotifier <|.. TextCombatNotifier
    CombatNotifier <|.. ColetorDeEventos
    TextCombatNotifier --> OutputChannel : usa
    TextCombatNotifier --> MessageProvider : usa
    RepositorioDeProgresso <|.. RepositorioDeProgressoElectron
    RepositorioDeProgresso <|.. RepositorioDeProgressoLocalStorage
    RepositorioDeProgresso <|.. RepositorioDeProgressoEmMemoria
    JogoService --> RepositorioDeProgresso : persiste via porta
    JogoService ..> ColetorDeEventos : cria por ação
    JogoService ..> Batalha : orquestra
    Personagem ..> CombatNotifier : notifica
```

## Observações de fidelidade ao código

- Em TypeScript, `ComHabilidadeEspecial` não existe em tempo de execução; o `instanceof` do PDF é substituído pelo *type guard* `possuiHabilidadeEspecial()` (`src/domain/contracts/ComHabilidadeEspecial.ts`).
- `Item` é o tipo união `Arma | Armadura | Consumivel`; no diagrama ele aparece pelo contrato comum `ItemBase`.
- As habilidades são instanciadas pela própria classe (`private readonly golpeBrutal = new GolpeBrutal()`), mas são objetos sem estado; por isso são representadas como **associação**, e não como composição.
- `CombatNotifier` é uma **interface** no domínio (no PDF era uma classe concreta). A classe do PDF corresponde a `TextCombatNotifier`, na camada de apresentação.
