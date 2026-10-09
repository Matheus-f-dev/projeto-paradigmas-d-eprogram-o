import { useEffect, useRef } from 'react';
import type { IntensidadeDeEfeitos } from '../../shared/contratosDePersistencia';
import { useConfiguracoes } from '../store/ContextoDoJogo';
import { ParticleSystem, type EmissorAmbiente } from './ParticleSystem';

/** Limites e multiplicadores por intensidade escolhida nas configurações. */
export const ORCAMENTO_DE_EFEITOS: Readonly<Record<IntensidadeDeEfeitos, { intensidade: number; limite: number }>> = {
  completo: { intensidade: 1, limite: 1600 },
  reduzido: { intensidade: 0.5, limite: 700 },
  minimo: { intensidade: 0.2, limite: 220 },
};

interface Propriedades {
  readonly ambiente?: readonly EmissorAmbiente[];
  readonly className?: string;
  /** Recebe o sistema quando ele é criado (e null quando é destruído). */
  readonly aoCriar?: (sistema: ParticleSystem | null) => void;
}

/**
 * Canvas de partículas que ocupa o elemento pai. Entrega o ParticleSystem
 * por callback para que o diretor de combate dispare efeitos sem passar por
 * estado React (nenhuma re-renderização por partícula).
 */
export function CanvasDeParticulas({ ambiente = [], className, aoCriar }: Propriedades) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sistema = useRef<ParticleSystem | null>(null);
  const aoCriarRef = useRef(aoCriar);
  aoCriarRef.current = aoCriar;
  const { config } = useConfiguracoes();
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const elemento = canvas.current;
    if (!elemento) return;
    const instancia = new ParticleSystem(elemento);
    sistema.current = instancia;
    const pai = elemento.parentElement ?? elemento;
    const observador = new ResizeObserver(() => {
      const caixa = pai.getBoundingClientRect();
      instancia.redimensionar(caixa.width, caixa.height);
    });
    observador.observe(pai);
    const caixa = pai.getBoundingClientRect();
    instancia.redimensionar(caixa.width, caixa.height);
    instancia.configurar(ORCAMENTO_DE_EFEITOS[configRef.current.efeitos]);
    instancia.iniciar();
    aoCriarRef.current?.(instancia);
    // Pausa quando a janela está oculta para não gastar CPU.
    const visibilidade = () => (document.hidden ? instancia.parar() : instancia.iniciar());
    document.addEventListener('visibilitychange', visibilidade);
    return () => {
      document.removeEventListener('visibilitychange', visibilidade);
      observador.disconnect();
      instancia.parar();
      instancia.limpar();
      sistema.current = null;
      aoCriarRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    sistema.current?.configurar(ORCAMENTO_DE_EFEITOS[config.efeitos]);
  }, [config.efeitos]);

  useEffect(() => {
    sistema.current?.definirAmbiente(config.reduzirMovimento ? ambiente.map((e) => ({ ...e, taxa: e.taxa * 0.3 })) : ambiente);
  }, [ambiente, config.reduzirMovimento]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
