import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useSom } from '../store/ContextoDoJogo';
import { Icone, type NomeDoIcone } from './Icone';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'menu' | 'perigo';

interface PropriedadesDoBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: Variante;
  readonly icone?: NomeDoIcone;
  readonly children?: ReactNode;
  readonly detalhe?: ReactNode;
  readonly silencioso?: boolean;
}

/** Botão do jogo: placa gravada com brilho ao focar e som de confirmação. */
export function Botao({
  variante = 'secundario',
  icone,
  children,
  detalhe,
  className,
  onClick,
  onMouseEnter,
  silencioso,
  type = 'button',
  ...resto
}: PropriedadesDoBotao) {
  const tocar = useSom();
  const ultimoFoco = useRef(0);
  return (
    <button
      type={type}
      className={['botao', `botao--${variante}`, className].filter(Boolean).join(' ')}
      onClick={(evento) => {
        if (!silencioso) tocar(resto.disabled ? 'erro' : 'clique');
        onClick?.(evento);
      }}
      onMouseEnter={(evento) => {
        const agora = performance.now();
        if (!resto.disabled && agora - ultimoFoco.current > 90) {
          ultimoFoco.current = agora;
          tocar('foco');
        }
        onMouseEnter?.(evento);
      }}
      {...resto}
    >
      <span className="botao__brilho" aria-hidden="true" />
      {icone && <Icone nome={icone} className="botao__icone" />}
      <span className="botao__texto">
        {children}
        {detalhe && <span className="botao__detalhe">{detalhe}</span>}
      </span>
    </button>
  );
}
