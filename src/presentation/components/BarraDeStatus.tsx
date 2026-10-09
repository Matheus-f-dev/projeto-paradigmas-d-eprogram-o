import type { CSSProperties } from 'react';

export type TipoDeBarra = 'vida' | 'mana' | 'furia' | 'flechas' | 'estrutura';

interface Propriedades {
  readonly tipo: TipoDeBarra;
  readonly atual: number;
  readonly maximo: number;
  readonly rotulo?: string;
  readonly compacta?: boolean;
  readonly mostrarNumeros?: boolean;
}

/**
 * Barra de recurso com "rastro" de dano: a parte preenchida reage na hora e
 * uma camada clara acompanha com atraso, deixando visível quanto foi perdido.
 * Os valores exibidos vêm sempre do estado do domínio.
 */
export function BarraDeStatus({ tipo, atual, maximo, rotulo, compacta, mostrarNumeros = true }: Propriedades) {
  const fracao = maximo > 0 ? Math.max(0, Math.min(1, atual / maximo)) : 0;
  const critica = tipo === 'vida' && fracao > 0 && fracao <= 0.3;
  return (
    <div
      className={['barra', `barra--${tipo}`, compacta && 'barra--compacta', critica && 'barra--critica'].filter(Boolean).join(' ')}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={atual}
      aria-label={rotulo}
      style={{ '--fracao': fracao } as CSSProperties}
    >
      <div className="barra__trilho">
        <div className="barra__rastro" />
        <div className="barra__preenchimento" />
        {tipo === 'flechas' || tipo === 'furia' ? (
          <div className="barra__marcas" style={{ '--divisoes': maximo } as CSSProperties} />
        ) : null}
      </div>
      {mostrarNumeros && (
        <span className="barra__numeros">
          {rotulo && <span className="barra__rotulo">{rotulo}</span>}
          <span className="barra__valor">
            {atual}
            <span className="barra__maximo">/{maximo}</span>
          </span>
        </span>
      )}
    </div>
  );
}
