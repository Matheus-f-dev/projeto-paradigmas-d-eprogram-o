import type { HTMLAttributes, ReactNode } from 'react';

interface PropriedadesDoPainel extends HTMLAttributes<HTMLDivElement> {
  readonly titulo?: ReactNode;
  readonly acao?: ReactNode;
  readonly variante?: 'pedra' | 'pergaminho' | 'vidro';
  readonly children?: ReactNode;
}

/** Painel com moldura de cantos dourados e textura de pedra. */
export function Painel({ titulo, acao, variante = 'pedra', className, children, ...resto }: PropriedadesDoPainel) {
  return (
    <section className={['painel', `painel--${variante}`, className].filter(Boolean).join(' ')} {...resto}>
      <span className="painel__canto painel__canto--se" aria-hidden="true" />
      <span className="painel__canto painel__canto--sd" aria-hidden="true" />
      <span className="painel__canto painel__canto--ie" aria-hidden="true" />
      <span className="painel__canto painel__canto--id" aria-hidden="true" />
      {(titulo || acao) && (
        <header className="painel__cabecalho">
          {titulo && <h2 className="painel__titulo">{titulo}</h2>}
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

/** Divisor ornamental com losango central. */
export function Ornamento({ className }: { className?: string }) {
  return (
    <div className={['ornamento', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="ornamento__linha" />
      <svg viewBox="0 0 40 16" width="40" height="16">
        <path d="M20 1 27 8 20 15 13 8Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M20 5 23 8 20 11 17 8Z" fill="currentColor" />
        <path d="M2 8h9M29 8h9" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="ornamento__linha" />
    </div>
  );
}
