import { MotionConfig } from 'framer-motion';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { EventosDoJogo } from '../../application/eventosDoJogo';
import type { JogoService, JogoSnapshot } from '../../application/JogoService';
import type { EventBus } from '../../events/EventBus';
import type { ArgumentoDeMensagem, Idioma, MessageProvider } from '../../i18n/MessageProvider';
import { criarMessageProvider } from '../../i18n/provedores';
import type { Repositorios } from '../../infrastructure/persistence/repositorios';
import { CONFIGURACOES_PADRAO, type Configuracoes } from '../../shared/contratosDePersistencia';
import type { NomeDoSom, SoundEngine } from '../audio/SoundEngine';

export type Tela =
  | 'menu'
  | 'selecao'
  | 'acampamento'
  | 'combate'
  | 'resultado'
  | 'epilogo'
  | 'configuracoes'
  | 'creditos'
  | 'laboratorio';

export interface Servicos {
  readonly jogo: JogoService;
  readonly barramento: EventBus<EventosDoJogo>;
  readonly repositorios: Repositorios;
  readonly som: SoundEngine;
}

interface ContextoDeConfiguracoes {
  readonly config: Configuracoes;
  readonly carregado: boolean;
  atualizar(parcial: Partial<Configuracoes>): void;
}

interface ContextoDeIdioma {
  readonly idioma: Idioma;
  readonly messages: MessageProvider;
  t(chave: string, ...args: ArgumentoDeMensagem[]): string;
}

interface ContextoDeNavegacao {
  readonly tela: Tela;
  readonly anterior: Tela | null;
  navegar(tela: Tela): void;
}

export interface Aviso {
  readonly id: number;
  readonly texto: string;
  readonly tipo: 'info' | 'sucesso' | 'erro';
}

interface ContextoDeAvisos {
  readonly avisos: readonly Aviso[];
  avisar(texto: string, tipo?: Aviso['tipo']): void;
}

const ServicosContexto = createContext<Servicos | null>(null);
const ConfiguracoesContexto = createContext<ContextoDeConfiguracoes | null>(null);
const IdiomaContexto = createContext<ContextoDeIdioma | null>(null);
const NavegacaoContexto = createContext<ContextoDeNavegacao | null>(null);
const AvisosContexto = createContext<ContextoDeAvisos | null>(null);

function exigir<T>(valor: T | null, nome: string): T {
  if (!valor) throw new Error(`${nome} usado fora do ProvedorDoJogo.`);
  return valor;
}

export const useServicos = () => exigir(useContext(ServicosContexto), 'useServicos');
export const useConfiguracoes = () => exigir(useContext(ConfiguracoesContexto), 'useConfiguracoes');
export const useI18n = () => exigir(useContext(IdiomaContexto), 'useI18n');
export const useNavegacao = () => exigir(useContext(NavegacaoContexto), 'useNavegacao');
export const useAvisos = () => exigir(useContext(AvisosContexto), 'useAvisos');

/** Estado autoritativo do jogo, lido da aplicação via useSyncExternalStore. */
export function useJogo(): JogoSnapshot {
  const { jogo } = useServicos();
  return useSyncExternalStore(jogo.subscribe, jogo.getSnapshot);
}

export function useSom(): (nome: NomeDoSom) => void {
  const { som } = useServicos();
  return useCallback((nome: NomeDoSom) => som.tocar(nome), [som]);
}

/** Movimento reduzido efetivo (preferência do jogador). */
export function useMovimentoReduzido(): boolean {
  return useConfiguracoes().config.reduzirMovimento;
}

const prefereMovimentoReduzido = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function ProvedorDoJogo({ servicos, children }: { servicos: Servicos; children: ReactNode }) {
  const [config, definirConfig] = useState<Configuracoes>(CONFIGURACOES_PADRAO);
  const [carregado, definirCarregado] = useState(false);
  const [tela, definirTela] = useState<Tela>('menu');
  const [anterior, definirAnterior] = useState<Tela | null>(null);
  const [avisos, definirAvisos] = useState<Aviso[]>([]);
  const proximoAviso = useRef(1);

  useEffect(() => {
    let ativo = true;
    void servicos.repositorios.configuracoes.carregar().then((salvas) => {
      if (!ativo) return;
      const primeiraVez = JSON.stringify(salvas) === JSON.stringify(CONFIGURACOES_PADRAO);
      definirConfig(primeiraVez ? { ...salvas, reduzirMovimento: prefereMovimentoReduzido() } : salvas);
      definirCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, [servicos]);

  useEffect(() => {
    servicos.som.definirVolume(config.volume);
    document.documentElement.lang = config.idioma === 'zh' ? 'zh-CN' : config.idioma === 'en' ? 'en' : 'pt-BR';
    document.documentElement.dataset.efeitos = config.efeitos;
    document.documentElement.dataset.movimento = config.reduzirMovimento ? 'reduzido' : 'completo';
  }, [config, servicos]);

  const atualizar = useCallback(
    (parcial: Partial<Configuracoes>) => {
      definirConfig((atual) => {
        const nova = { ...atual, ...parcial };
        void servicos.repositorios.configuracoes.salvar(nova);
        return nova;
      });
    },
    [servicos],
  );

  const messages = useMemo(() => criarMessageProvider(config.idioma), [config.idioma]);
  const idioma = useMemo<ContextoDeIdioma>(
    () => ({ idioma: config.idioma, messages, t: (chave, ...args) => messages.getMessage(chave, ...args) }),
    [config.idioma, messages],
  );

  const navegar = useCallback(
    (destino: Tela) => {
      definirAnterior(tela);
      definirTela(destino);
    },
    [tela],
  );

  const avisar = useCallback((texto: string, tipo: Aviso['tipo'] = 'info') => {
    const id = proximoAviso.current++;
    definirAvisos((lista) => [...lista.slice(-3), { id, texto, tipo }]);
    window.setTimeout(() => definirAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), 3200);
  }, []);

  return (
    <ServicosContexto.Provider value={servicos}>
      <ConfiguracoesContexto.Provider value={{ config, carregado, atualizar }}>
        <IdiomaContexto.Provider value={idioma}>
          <NavegacaoContexto.Provider value={{ tela, anterior, navegar }}>
            <AvisosContexto.Provider value={{ avisos, avisar }}>
              <MotionConfig reducedMotion={config.reduzirMovimento ? 'always' : 'never'}>{children}</MotionConfig>
            </AvisosContexto.Provider>
          </NavegacaoContexto.Provider>
        </IdiomaContexto.Provider>
      </ConfiguracoesContexto.Provider>
    </ServicosContexto.Provider>
  );
}
