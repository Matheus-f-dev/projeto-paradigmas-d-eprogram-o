import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { BatalhaSnapshot, CombatenteSnapshot, ItemSnapshot, ObjetoSnapshot } from '../../application/snapshots';
import type { AcaoDoJogador } from '../../domain/combat/Batalha';
import type { CombatEvent } from '../../domain/events/CombatEvent';
import { formatarEvento, type ResolvedorDeNome } from '../../i18n/formatarEvento';
import { Cenario } from '../art/Cenario';
import { IlustracaoDeItem } from '../art/itens';
import { SpriteDePersonagem, aparenciaPara } from '../art/personagens';
import { BarraDeStatus } from '../components/BarraDeStatus';
import { Botao } from '../components/Botao';
import { Icone, type NomeDoIcone } from '../components/Icone';
import { Ornamento } from '../components/Painel';
import { CanvasDeParticulas } from '../effects/CanvasDeParticulas';
import { construirRoteiro, type Cue } from '../effects/CombatDirector';
import { ExecutorDeRoteiro, type Caixa, type Palco } from '../effects/ExecutorDeRoteiro';
import type { ParticleSystem } from '../effects/ParticleSystem';
import type { TipoDeCenario } from '../effects/presets';
import { useAvisos, useConfiguracoes, useI18n, useJogo, useNavegacao, useServicos, useSom } from '../store/ContextoDoJogo';

type ModoDeAlvo =
  | { readonly tipo: 'atacar' | 'habilidade' | 'investida' }
  | { readonly tipo: 'item'; readonly itemId: string };

interface Exibicao {
  readonly vida?: number;
  readonly recurso?: number;
  readonly destruido?: boolean;
  readonly definitivo?: boolean;
}

interface EntradaDoRegistro {
  readonly id: number;
  readonly texto: string;
  readonly tipo: string;
}

const ICONE_DA_HABILIDADE: Readonly<Record<string, NomeDoIcone>> = {
  'golpe-brutal': 'punho',
  'bola-de-fogo': 'chama',
  'flecha-perfurante': 'flecha',
};

/** Posições dos pés de cada combatente no campo (frações da largura/altura). */
const POSICOES_HEROIS = [
  { x: 0.25, y: 0.72 },
  { x: 0.13, y: 0.8 },
];
const POSICOES_ALIADOS = [{ x: 0.42, y: 0.87 }];
const POSICOES_INIMIGOS = [
  { x: 0.72, y: 0.72 },
  { x: 0.85, y: 0.8 },
];
const POSICOES_OBJETOS: Readonly<Record<string, { x: number; y: number; escala: number }>> = {
  bau: { x: 0.56, y: 0.76, escala: 0.5 },
  fortaleza: { x: 0.9, y: 0.64, escala: 1.55 },
  objeto: { x: 0.6, y: 0.8, escala: 0.8 },
};

export function Combate() {
  const estado = useJogo();
  const { jogo } = useServicos();
  const { t, messages } = useI18n();
  const { config } = useConfiguracoes();
  const { navegar } = useNavegacao();
  const { avisar } = useAvisos();
  const tocar = useSom();

  const [congelado, definirCongelado] = useState<BatalhaSnapshot | null>(null);
  const [exibicao, definirExibicao] = useState<Readonly<Record<string, Exibicao>>>({});
  const [reproduzindo, definirReproduzindo] = useState(false);
  const [modo, definirModo] = useState<ModoDeAlvo | null>(null);
  const [menuDeItens, definirMenuDeItens] = useState(false);
  const [registro, definirRegistro] = useState<EntradaDoRegistro[]>(() =>
    (estado.batalha?.eventos ?? []).flatMap((evento, i) => {
      const texto = formatarEvento(evento, messages);
      return texto ? [{ id: -1000 + i, texto, tipo: evento.key }] : [];
    }),
  );
  const [registroAberto, definirRegistroAberto] = useState(true);
  const [turnoExibido, definirTurnoExibido] = useState<string | null>(null);
  const [faixa, definirFaixa] = useState<{ texto: string; tipo: 'vitoria' | 'derrota' | 'grito' } | null>(null);
  const [introducao, definirIntroducao] = useState(true);
  const [confirmandoRecuo, definirConfirmandoRecuo] = useState(false);
  const [focoDeAlvo, definirFocoDeAlvo] = useState<string | null>(null);

  const palcoRef = useRef<HTMLDivElement>(null);
  const textosRef = useRef<HTMLDivElement>(null);
  const claraoRef = useRef<HTMLDivElement>(null);
  const particulasRef = useRef<ParticleSystem | null>(null);
  const elementos = useRef(new Map<string, HTMLElement>());
  const proximoRegistro = useRef(1);

  const batalhaViva = estado.batalha;
  const b = congelado ?? batalhaViva;

  // ---------------------------------------------------------- nomes (i18n)
  const nomes = useMemo(() => {
    const mapa = new Map<string, string>();
    if (!b) return mapa;
    const traduzir = (id: string, nome: string) => (messages.has(`name.${id}`) ? messages.getMessage(`name.${id}`) : nome);
    [...b.herois, ...b.aliados, ...b.inimigos].forEach((c) => {
      mapa.set(c.id, traduzir(c.id, c.nome));
      c.membros.forEach((m) => mapa.set(m.id, t(`limb.${m.parte}`, traduzir(c.id, c.nome))));
    });
    b.cenario.forEach((o) => mapa.set(o.id, traduzir(o.id, o.nome)));
    return mapa;
  }, [b, messages, t]);
  const resolverNome = useCallback<ResolvedorDeNome>((id, nome) => nomes.get(id) ?? nome, [nomes]);

  // ----------------------------------------------------------- o palco
  const lados = useRef(new Map<string, 1 | -1>());
  const caixa = useCallback((id: string): Caixa | null => {
    const palco = palcoRef.current;
    if (!palco) return null;
    const [donoId, parte] = id.split(':');
    const elemento = elementos.current.get(donoId!);
    if (!elemento) return null;
    const base = palco.getBoundingClientRect();
    const r = elemento.getBoundingClientRect();
    const centro = { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height * 0.5 };
    if (parte === 'braco') return { x: centro.x, y: centro.y - r.height * 0.1, largura: r.width * 0.5, altura: r.height * 0.5 };
    if (parte === 'perna') return { x: centro.x, y: centro.y + r.height * 0.28, largura: r.width * 0.5, altura: r.height * 0.5 };
    return { ...centro, largura: r.width, altura: r.height };
  }, []);

  const registrar = useCallback(
    (evento: CombatEvent) => {
      const texto = formatarEvento(evento, messages, resolverNome);
      if (!texto) return;
      const id = proximoRegistro.current++;
      definirRegistro((lista) => [...lista.slice(-59), { id, texto, tipo: evento.key }]);
    },
    [messages, resolverNome],
  );
  const registrarRef = useRef(registrar);
  registrarRef.current = registrar;

  const aplicar = useCallback(
    (cue: Cue) => {
      const mudar = (id: string, parcial: Exibicao) => definirExibicao((atual) => ({ ...atual, [id]: { ...atual[id], ...parcial } }));
      switch (cue.tipo) {
        case 'log':
          return registrarRef.current(cue.evento);
        case 'turno':
          return definirTurnoExibido(cue.atorId);
        case 'dano':
          return mudar(cue.alvoId, { vida: cue.restante });
        case 'cura':
          return mudar(cue.alvoId, { vida: cue.restante });
        case 'mana':
          return mudar(cue.alvoId, { recurso: cue.restante });
        case 'recurso':
          return mudar(cue.atorId, { recurso: cue.restante });
        case 'derrota':
          return mudar(cue.alvoId, { destruido: true, definitivo: cue.definitiva });
        case 'reerguer':
          return mudar(cue.alvoId, { vida: cue.vida, destruido: false });
        case 'fase':
          return mudar(cue.alvoId, { vida: cue.vida });
        case 'quebra':
          return mudar(cue.alvoId, { destruido: true });
        case 'grito':
          definirFaixa({ texto: t(cue.chave), tipo: 'grito' });
          window.setTimeout(() => definirFaixa((f) => (f?.tipo === 'grito' ? null : f)), 1100);
          return;
        case 'fim':
          return definirFaixa({ texto: t(cue.vitoria ? 'result.victory.title' : 'result.defeat.title'), tipo: cue.vitoria ? 'vitoria' : 'derrota' });
        default:
          return;
      }
    },
    [t],
  );
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  const executor = useMemo(() => {
    const palco: Palco = {
      get reduzido() {
        return document.documentElement.dataset.movimento === 'reduzido';
      },
      caixa,
      sprite: (id) => elementos.current.get(id.split(':')[0]!)?.querySelector<HTMLElement>('.combatente__corpo') ?? null,
      direcao: (id) => lados.current.get(id.split(':')[0]!) ?? 1,
      camera: () => palcoRef.current,
      camadaDeTextos: () => textosRef.current,
      clarao: () => claraoRef.current,
      particulas: () => particulasRef.current,
      aplicar: (cue) => aplicarRef.current(cue),
      som: (nome) => tocar(nome),
      traduzir: (chave, args) => messages.getMessage(chave, ...args),
    };
    return new ExecutorDeRoteiro(palco);
  }, [caixa, tocar, messages]);

  useEffect(() => () => executor.cancelar(), [executor]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => definirIntroducao(false), 2400);
    return () => window.clearTimeout(temporizador);
  }, []);

  // ------------------------------------------------------- reprodução
  const escala = (config.velocidade === 'rapida' ? 0.6 : 1) * (config.reduzirMovimento ? 0.6 : 1);
  const herois = useMemo(() => new Set(b?.herois.map((h) => h.id) ?? []), [b]);

  const reproduzir = useCallback(
    async (antes: BatalhaSnapshot, eventos: readonly CombatEvent[]) => {
      definirCongelado(antes);
      definirExibicao({});
      definirReproduzindo(true);
      definirModo(null);
      definirMenuDeItens(false);
      const roteiro = construirRoteiro(eventos, { escala, ehDoJogador: (id) => herois.has(id) });
      await executor.reproduzir(roteiro);
      definirCongelado(null);
      definirExibicao({});
      definirReproduzindo(false);
      definirTurnoExibido(null);
      const final = jogo.getSnapshot().batalha?.estado;
      if (final === 'vitoria' || final === 'derrota') window.setTimeout(() => navegar('resultado'), 1500);
    },
    [escala, executor, herois, jogo, navegar],
  );

  const agir = (acao: AcaoDoJogador) => {
    if (reproduzindo || !batalhaViva) return;
    const antes = batalhaViva;
    const resultado = jogo.executarAcao(acao);
    if (!resultado.ok) {
      tocar('erro');
      avisar(t(resultado.erro), 'erro');
      return;
    }
    void reproduzir(antes, resultado.eventos);
  };

  // ------------------------------------------------------------ teclado
  const atorAtual = b && b.turnoDoJogador && !reproduzindo ? b.herois.find((h) => h.id === b.atorAtualId) ?? null : null;
  const consumiveis = useMemo(() => estado.inventario.filter((item) => item.categoria === 'consumivel'), [estado.inventario]);

  const escolherAcao = (tipo: 'atacar' | 'habilidade' | 'itens' | 'investida') => {
    if (!atorAtual || !b) return;
    if (tipo === 'habilidade' && !atorAtual.podeUsarHabilidade) {
      tocar('erro');
      avisar(t('combat.noResource'), 'erro');
      return;
    }
    if (tipo === 'investida' && !b.investidaDisponivel) return;
    if (tipo === 'itens') {
      definirMenuDeItens((aberto) => !aberto);
      definirModo(null);
      return;
    }
    tocar('clique');
    definirMenuDeItens(false);
    definirModo({ tipo });
  };

  const escolherItem = (item: ItemSnapshot) => {
    if (!atorAtual) return;
    if (item.alcance === 'grupo') {
      agir({ tipo: 'item', atorId: atorAtual.id, itemId: item.id, alvoId: atorAtual.id });
      return;
    }
    definirMenuDeItens(false);
    definirModo({ tipo: 'item', itemId: item.id });
  };

  const escolherAlvo = (alvoId: string) => {
    if (!modo || !atorAtual) return;
    if (modo.tipo === 'item') agir({ tipo: 'item', atorId: atorAtual.id, itemId: modo.itemId, alvoId });
    else agir({ tipo: modo.tipo, atorId: atorAtual.id, alvoId });
  };

  useEffect(() => {
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        definirModo(null);
        definirMenuDeItens(false);
      } else if ((evento.key === ' ' || evento.key === 'Enter') && reproduzindo) {
        evento.preventDefault();
        executor.acelerar();
      } else if (!reproduzindo && ['1', '2', '3', '4'].includes(evento.key)) {
        escolherAcao((['atacar', 'habilidade', 'itens', 'investida'] as const)[Number(evento.key) - 1]!);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  if (!b || !estado.estagioId) {
    return (
      <div className="tela-simples">
        <div className="tela-simples__conteudo">
          <Botao variante="primario" onClick={() => navegar('menu')}>
            {t('camp.menu')}
          </Botao>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------ alvos válidos
  const alvosValidos = new Set<string>(
    modo === null
      ? []
      : modo.tipo === 'item'
        ? estado.inventario.find((item) => item.id === modo.itemId)?.alvosValidos ?? []
        : b.alvosHostis,
  );
  const atorDestacado = reproduzindo ? turnoExibido : b.atorAtualId;

  const valor = (c: CombatenteSnapshot | ObjetoSnapshot) => {
    const sobreposto = exibicao[c.id];
    return {
      vida: sobreposto?.vida ?? c.vida,
      destruido: sobreposto?.destruido ?? c.destruido,
      definitivo: sobreposto?.definitivo ?? ('derrotaDefinitiva' in c ? c.derrotaDefinitiva : c.destruido),
      recurso: sobreposto?.recurso ?? ('recurso' in c ? c.recurso?.atual : undefined),
    };
  };

  const registrarElemento = (id: string, lado: 1 | -1) => (elemento: HTMLElement | null) => {
    if (elemento) {
      elementos.current.set(id, elemento);
      lados.current.set(id, lado);
    } else {
      elementos.current.delete(id);
    }
  };

  const renderizarCombatente = (c: CombatenteSnapshot, posicao: { x: number; y: number }, lado: 1 | -1, escalaDoSprite = 1) => {
    const v = valor(c);
    const alvo = alvosValidos.has(c.id);
    const membrosAlvo = modo && modo.tipo !== 'item' && lado === -1 ? c.membros.filter((m) => alvosValidos.has(m.id)) : [];
    const classes = [
      'combatente',
      lado === -1 ? 'combatente--inimigo' : 'combatente--aliado',
      atorDestacado === c.id && 'combatente--ativo',
      alvo && 'combatente--alvo',
      focoDeAlvo === c.id && 'combatente--mirado',
      v.destruido && (v.definitivo ? 'combatente--derrotado' : 'combatente--inconsciente'),
      c.classe === 'chefe' && 'combatente--chefe',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <div
        key={c.id}
        ref={registrarElemento(c.id, lado)}
        className={classes}
        style={{ left: `${posicao.x * 100}%`, top: `${posicao.y * 100}%`, '--escala': escalaDoSprite, zIndex: Math.round(posicao.y * 100) } as CSSProperties}
      >
        <div className="combatente__plaqueta">
          <span className="combatente__nome">
            {nomes.get(c.id) ?? c.nome}
            {c.lado === 'aliado' && <em className="combatente__tag">{t('combat.ally')}</em>}
            {c.bonusTemporario > 0 && <em className="combatente__tag combatente__tag--bencao">+{c.bonusTemporario}</em>}
          </span>
          <BarraDeStatus tipo="vida" atual={v.vida} maximo={c.vidaMaxima} compacta mostrarNumeros />
        </div>
        <button
          type="button"
          className="combatente__corpo"
          disabled={!alvo}
          onClick={() => escolherAlvo(c.id)}
          onMouseEnter={() => alvo && definirFocoDeAlvo(c.id)}
          onMouseLeave={() => definirFocoDeAlvo(null)}
          aria-label={nomes.get(c.id) ?? c.nome}
        >
          <SpriteDePersonagem aparencia={aparenciaPara(c.id, c.classe)} className={lado === -1 ? 'sprite--espelhado' : undefined} />
        </button>
        <div className="combatente__anel" aria-hidden="true" />
        {membrosAlvo.length > 0 && (
          <div className="combatente__membros">
            <span>{t('combat.limbs')}</span>
            {membrosAlvo.map((m) => (
              <button key={m.id} type="button" className="chip-membro" onClick={() => escolherAlvo(m.id)}>
                {t(`limb.part.${m.parte}`)}
                <small>
                  {m.vida}/{m.vidaMaxima}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderizarObjeto = (o: ObjetoSnapshot) => {
    const v = valor(o);
    const posicao = POSICOES_OBJETOS[o.tipo] ?? POSICOES_OBJETOS.objeto!;
    const alvo = alvosValidos.has(o.id);
    return (
      <div
        key={o.id}
        ref={registrarElemento(o.id, -1)}
        className={['combatente', 'combatente--objeto', `combatente--${o.tipo}`, alvo && 'combatente--alvo', v.destruido && 'combatente--quebrado'].filter(Boolean).join(' ')}
        style={{ left: `${posicao.x * 100}%`, top: `${posicao.y * 100}%`, '--escala': posicao.escala, zIndex: o.tipo === 'fortaleza' ? 5 : 70 } as CSSProperties}
      >
        <div className="combatente__plaqueta">
          <span className="combatente__nome">{nomes.get(o.id) ?? o.nome}</span>
          <BarraDeStatus tipo="estrutura" atual={v.vida} maximo={o.vidaMaxima} compacta />
        </div>
        <button type="button" className="combatente__corpo" disabled={!alvo} onClick={() => escolherAlvo(o.id)} aria-label={nomes.get(o.id) ?? o.nome}>
          <SpriteDePersonagem aparencia={o.tipo === 'bau' ? 'bau' : 'portao'} />
        </button>
      </div>
    );
  };

  const ordem = reproduzindo ? [] : b.ordemDeTurnos;
  const todos = [...b.herois, ...b.aliados, ...b.inimigos];

  return (
    <div className={`combate combate--${estado.estagioId}`}>
      <Cenario tipo={estado.estagioId as TipoDeCenario} />

      <div className="combate__palco" ref={palcoRef}>
        {b.cenario.map(renderizarObjeto)}
        {b.herois.map((c, i) => renderizarCombatente(c, POSICOES_HEROIS[i] ?? POSICOES_HEROIS[0]!, 1))}
        {b.aliados.map((c, i) => renderizarCombatente(c, POSICOES_ALIADOS[i] ?? POSICOES_ALIADOS[0]!, 1, 0.75))}
        {b.inimigos.map((c, i) =>
          renderizarCombatente(c, c.classe === 'chefe' ? { x: 0.75, y: 0.76 } : (POSICOES_INIMIGOS[i] ?? POSICOES_INIMIGOS[0]!), -1, c.classe === 'chefe' ? 1.45 : c.classe === 'zumbi' ? 1.05 : 0.82),
        )}
        <CanvasDeParticulas className="combate__particulas" aoCriar={(sistema) => (particulasRef.current = sistema)} />
        <div className="combate__textos" ref={textosRef} aria-hidden="true" />
      </div>
      {/* Fora da "câmera": o clarão cobre a tela inteira mesmo durante tremores e zoom. */}
      <div className="combate__clarao" ref={claraoRef} aria-hidden="true" />

      {/* Topo: capítulo, rodada, objetivo e ordem dos turnos */}
      <header className="combate__topo">
        <div className="combate__capitulo">
          <span>{t('stage.label', estado.estagio + 1, estado.totalDeEstagios)}</span>
          <strong>{t(`stage.${estado.estagioId}.name`)}</strong>
        </div>
        <div className="combate__rodada">
          <span className="combate__rodada-numero">{t('combat.round', b.rodada)}</span>
          <span className="combate__objetivo">
            <Icone nome="alvo" tamanho={15} /> {t(b.objetivo)}
          </span>
        </div>
        <div className="ordem-de-turnos" aria-label={t('combat.turnOrder')}>
          <AnimatePresence initial={false}>
            {ordem.map((id, i) => {
              const c = todos.find((x) => x.id === id);
              if (!c) return null;
              return (
                <motion.span
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className={['ordem-de-turnos__item', i === 0 && 'ordem-de-turnos__item--atual', c.lado === 'inimigo' && 'ordem-de-turnos__item--inimigo'].filter(Boolean).join(' ')}
                  title={nomes.get(c.id) ?? c.nome}
                >
                  <SpriteDePersonagem aparencia={aparenciaPara(c.id, c.classe)} />
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="combate__botoes-topo">
          {reproduzindo && (
            <Botao variante="fantasma" icone="ampulheta" onClick={() => executor.acelerar()}>
              {t('combat.skip')}
            </Botao>
          )}
          <Botao variante="fantasma" icone="porta" onClick={() => definirConfirmandoRecuo(true)} disabled={reproduzindo}>
            {t('combat.retreat')}
          </Botao>
        </div>
      </header>

      {/* Crônica da batalha */}
      <aside className={registroAberto ? 'registro registro--aberto' : 'registro'}>
        <button type="button" className="registro__titulo" onClick={() => definirRegistroAberto((a) => !a)} aria-expanded={registroAberto}>
          <Icone nome="pergaminho" tamanho={16} /> {t('combat.log')}
        </button>
        {registroAberto && (
          <ol className="registro__lista" aria-live="polite">
            {registro.slice(-14).map((entrada) => (
              <li key={entrada.id} className={`registro__entrada registro__entrada--${entrada.tipo}`}>
                {entrada.texto}
              </li>
            ))}
          </ol>
        )}
      </aside>

      {/* HUD inferior: grupo e ações */}
      <footer className="combate__hud">
        <div className="hud__grupo">
          {[...b.herois, ...b.aliados].map((c) => {
            const v = valor(c);
            return (
              <div
                key={c.id}
                className={['hud-heroi', atorDestacado === c.id && 'hud-heroi--ativo', v.destruido && 'hud-heroi--caido', alvosValidos.has(c.id) && 'hud-heroi--alvo']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button type="button" className="hud-heroi__retrato" disabled={!alvosValidos.has(c.id)} onClick={() => escolherAlvo(c.id)} aria-label={nomes.get(c.id) ?? c.nome}>
                  <SpriteDePersonagem aparencia={aparenciaPara(c.id, c.classe)} />
                </button>
                <div className="hud-heroi__dados">
                  <span className="hud-heroi__nome">
                    {nomes.get(c.id) ?? c.nome}
                    <small>
                      <Icone nome="espada" tamanho={13} /> {c.ataque} <Icone nome="escudo" tamanho={13} /> {c.defesa}
                    </small>
                  </span>
                  <BarraDeStatus tipo="vida" atual={v.vida} maximo={c.vidaMaxima} compacta />
                  {c.recurso && <BarraDeStatus tipo={c.recurso.tipo} atual={v.recurso ?? c.recurso.atual} maximo={c.recurso.maximo} compacta />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hud__acoes">
          <AnimatePresence mode="wait">
            {atorAtual ? (
              <motion.div key={atorAtual.id} className="menu-de-acoes" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <span className="menu-de-acoes__turno">{t('combat.turnOf', atorAtual.nome)}</span>
                {modo ? (
                  <div className="menu-de-acoes__mira">
                    <Icone nome="alvo" tamanho={20} />
                    <span>{t(modo.tipo === 'item' ? 'combat.chooseAlly' : 'combat.chooseTarget')}</span>
                    <Botao variante="fantasma" icone="fechar" onClick={() => definirModo(null)}>
                      {t('combat.cancel')}
                    </Botao>
                  </div>
                ) : (
                  <div className="menu-de-acoes__botoes">
                    <BotaoDeAcao atalho="1" icone="espada" titulo={t('combat.attack')} detalhe={t('combat.attackDesc', atorAtual.ataque)} onClick={() => escolherAcao('atacar')} />
                    {atorAtual.habilidade && (
                      <BotaoDeAcao
                        atalho="2"
                        icone={ICONE_DA_HABILIDADE[atorAtual.habilidade.id] ?? 'estrela'}
                        titulo={t(`ability.${atorAtual.habilidade.id}.name`)}
                        detalhe={
                          atorAtual.habilidade.recurso
                            ? t('combat.cost', atorAtual.habilidade.custo, t(`resource.${atorAtual.habilidade.recurso}`))
                            : t(`ability.${atorAtual.habilidade.id}.desc`)
                        }
                        valor={atorAtual.habilidade.dano}
                        destaque={atorAtual.habilidade.id}
                        desabilitado={!atorAtual.podeUsarHabilidade}
                        onClick={() => escolherAcao('habilidade')}
                      />
                    )}
                    <BotaoDeAcao
                      atalho="3"
                      icone="pocao"
                      titulo={t('combat.items')}
                      detalhe={`${consumiveis.length}`}
                      desabilitado={consumiveis.length === 0}
                      ativo={menuDeItens}
                      onClick={() => escolherAcao('itens')}
                    />
                    <BotaoDeAcao
                      atalho="4"
                      icone="espadasCruzadas"
                      titulo={t('combat.assault')}
                      detalhe={t('combat.assaultDesc')}
                      desabilitado={!b.investidaDisponivel}
                      onClick={() => escolherAcao('investida')}
                    />
                  </div>
                )}
                <AnimatePresence>
                  {menuDeItens && !modo && (
                    <motion.ul className="menu-de-itens" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                      {consumiveis.length === 0 && <li className="menu-de-itens__vazio">{t('combat.noItems')}</li>}
                      {consumiveis.map((item) => (
                        <li key={item.id}>
                          <button type="button" className="menu-de-itens__item" disabled={(item.alvosValidos?.length ?? 0) === 0} onClick={() => escolherItem(item)}>
                            <IlustracaoDeItem catalogoId={item.catalogoId} tamanho={36} />
                            <span>
                              <strong>{t(`item.${item.catalogoId}.name`)}</strong>
                              <small>{t(`item.${item.catalogoId}.desc`)}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="espera" className="menu-de-acoes menu-de-acoes--espera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {b.estado === 'em-andamento' && (
                  <span className="menu-de-acoes__espera">
                    {reproduzindo && turnoExibido ? t('combat.turnOf', nomes.get(turnoExibido) ?? turnoExibido) : t('combat.enemyTurn')}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>

      {/* Introdução do capítulo */}
      <AnimatePresence>
        {introducao && (
          <motion.div className="introducao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="introducao__capitulo">
              {t('stage.label', estado.estagio + 1, estado.totalDeEstagios)}
            </motion.span>
            <motion.h1
              className="introducao__nome"
              initial={{ opacity: 0, letterSpacing: '0.5em', filter: 'blur(8px)' }}
              animate={{ opacity: 1, letterSpacing: '0.08em', filter: 'blur(0px)' }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {t(`stage.${estado.estagioId}.name`)}
            </motion.h1>
            <Ornamento />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="introducao__objetivo">
              {t(b.objetivo)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Faixas: investida, vitória e derrota */}
      <AnimatePresence>
        {faixa && (
          <motion.div
            key={faixa.texto}
            className={`faixa faixa--${faixa.tipo}`}
            initial={{ opacity: 0, scale: 1.4, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Ornamento />
            <span className="faixa__texto">{faixa.texto}</span>
            <Ornamento />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmandoRecuo && (
          <motion.div className="dialogo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="painel painel--pedra dialogo__painel" role="alertdialog" aria-modal="true">
              <p className="dialogo__texto">{t('combat.retreatConfirm')}</p>
              <div className="dialogo__acoes">
                <Botao variante="fantasma" onClick={() => definirConfirmandoRecuo(false)}>
                  {t('menu.confirmNo')}
                </Botao>
                <Botao
                  variante="perigo"
                  icone="porta"
                  onClick={() => {
                    jogo.encerrarPartida();
                    navegar('menu');
                  }}
                >
                  {t('combat.retreat')}
                </Botao>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BotaoDeAcao({
  atalho,
  icone,
  titulo,
  detalhe,
  valor,
  destaque,
  desabilitado,
  ativo,
  onClick,
}: {
  atalho: string;
  icone: NomeDoIcone;
  titulo: string;
  detalhe?: string;
  valor?: number;
  destaque?: string;
  desabilitado?: boolean;
  ativo?: boolean;
  onClick: () => void;
}) {
  const tocar = useSom();
  return (
    <button
      type="button"
      className={['botao-acao', destaque && `botao-acao--${destaque}`, ativo && 'botao-acao--ativo'].filter(Boolean).join(' ')}
      aria-disabled={desabilitado}
      onClick={() => (desabilitado ? tocar('erro') : onClick())}
      onMouseEnter={() => !desabilitado && tocar('foco')}
    >
      <span className="botao-acao__atalho">{atalho}</span>
      <span className="botao-acao__icone">
        <Icone nome={icone} tamanho={26} />
      </span>
      <span className="botao-acao__texto">
        <strong>{titulo}</strong>
        {detalhe && <small>{detalhe}</small>}
      </span>
      {valor !== undefined && <span className="botao-acao__valor">{valor}</span>}
    </button>
  );
}
