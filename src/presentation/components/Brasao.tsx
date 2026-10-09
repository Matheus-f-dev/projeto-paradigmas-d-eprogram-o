import { useId } from 'react';

/** Brasão do jogo: escudo com torre, espada e chama. */
export function Brasao({ tamanho = 120, className }: { tamanho?: number; className?: string }) {
  const p = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 140" width={tamanho} height={(tamanho * 140) / 120} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-ouro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0c2" />
          <stop offset="0.45" stopColor="#c9a25a" />
          <stop offset="1" stopColor="#6b4a1e" />
        </linearGradient>
        <linearGradient id={`${p}-campo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f2b30" />
          <stop offset="1" stopColor="#2a0a0d" />
        </linearGradient>
        <radialGradient id={`${p}-chama`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffb347" />
          <stop offset="1" stopColor="#ff7a2f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M60 4 L112 18 L112 64 C112 100 88 124 60 136 C32 124 8 100 8 64 L8 18 Z" fill={`url(#${p}-ouro)`} />
      <path d="M60 12 L104 24 L104 64 C104 95 84 116 60 127 C36 116 16 95 16 64 L16 24 Z" fill={`url(#${p}-campo)`} />
      <path d="M36 98 L36 60 L30 60 L30 48 L36 48 L36 54 L42 54 L42 48 L48 48 L48 54 L54 54 L54 48 L60 48 L60 60 L54 60 L54 98 Z" fill="#120a0a" opacity="0.9" />
      <path d="M66 98 L66 66 L60 66 L60 56 L66 56 L66 62 L72 62 L72 56 L78 56 L78 62 L84 62 L84 56 L90 56 L90 66 L84 66 L84 98 Z" fill="#120a0a" opacity="0.9" />
      <path d="M46 98 L46 84 C46 76 74 76 74 84 L74 98 Z" fill="#1e1010" />
      <circle cx="60" cy="40" r="18" fill={`url(#${p}-chama)`} className="brasao__chama" />
      <path d="M60 24 C66 32 68 38 64 44 C62 47 58 47 56 44 C52 38 54 32 60 24 Z" fill="#ffc06a" className="brasao__chama" />
      <path d="M57 108 L63 108 L63 20 L60 12 L57 20 Z" fill={`url(#${p}-ouro)`} />
      <path d="M46 104 L74 104 L74 110 L46 110 Z" fill={`url(#${p}-ouro)`} />
      <path d="M58 110 L62 110 L62 124 L58 124 Z" fill="#3a2618" />
    </svg>
  );
}
