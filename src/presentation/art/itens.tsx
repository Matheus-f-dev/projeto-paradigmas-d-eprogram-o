import { memo, useId, type ReactElement } from 'react';

const C = '#0c0806';

function Lamina({ p, comprimento, cor, guarda, gema }: { p: string; comprimento: number; cor: [string, string]; guarda: string; gema?: string }) {
  const topo = 44 - comprimento;
  return (
    <g transform="rotate(45 32 32)">
      <defs>
        <linearGradient id={`${p}-l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={cor[0]} />
          <stop offset="1" stopColor={cor[1]} />
        </linearGradient>
      </defs>
      <path d={`M29 44 L29 ${topo + 6} L32 ${topo} L35 ${topo + 6} L35 44 Z`} fill={`url(#${p}-l)`} stroke={C} strokeWidth="1.5" />
      <path d={`M32 ${topo + 4} L32 42`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
      <rect x="22" y="43" width="20" height="4" rx="1.5" fill={guarda} stroke={C} strokeWidth="1.2" />
      <rect x="30" y="47" width="4" height="9" fill="#3a2618" stroke={C} strokeWidth="1" />
      <circle cx="32" cy="58" r="3" fill={guarda} stroke={C} strokeWidth="1" />
      {gema && <circle cx="32" cy="45" r="2" fill={gema} />}
    </g>
  );
}

function Cajado({ p, gema, brilho }: { p: string; gema: string; brilho: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${p}-g`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.4" stopColor={gema} />
          <stop offset="1" stopColor={brilho} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M14 56 L44 14" stroke="#6b4426" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 56 L44 14" stroke={C} strokeWidth="6" strokeLinecap="round" opacity="0.3" />
      <path d="M40 22 C36 14 40 6 46 6 C52 8 54 16 48 22" fill="none" stroke="#6b4426" strokeWidth="3" />
      <circle cx="46" cy="14" r="11" fill={`url(#${p}-g)`} />
      <path d="M46 8 L50 14 L46 20 L42 14 Z" fill={gema} stroke={C} strokeWidth="1" />
    </g>
  );
}

function Arco({ cor }: { cor: string }) {
  return (
    <g>
      <path d="M16 8 C44 18 50 44 40 58" fill="none" stroke={cor} strokeWidth="4" strokeLinecap="round" />
      <path d="M16 8 C44 18 50 44 40 58" fill="none" stroke={C} strokeWidth="6" strokeLinecap="round" opacity="0.25" />
      <path d="M16 8 L40 58" stroke="#efe6d2" strokeWidth="1" />
      <path d="M12 46 L44 20" stroke="#d9c08a" strokeWidth="2" />
      <path d="M44 20 L38 21 L41 24 Z" fill="#e8e0d0" stroke={C} strokeWidth="0.8" />
    </g>
  );
}

function Armadura({ p, cor, detalhe }: { p: string; cor: [string, string]; detalhe: 'couro' | 'malha' | 'runas' }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${p}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cor[0]} />
          <stop offset="1" stopColor={cor[1]} />
        </linearGradient>
        <pattern id={`${p}-m`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="none" stroke="#2a241f" strokeWidth="0.7" />
        </pattern>
      </defs>
      <path d="M22 10 L12 16 L12 28 L18 30 L18 56 L46 56 L46 30 L52 28 L52 16 L42 10 C40 16 36 19 32 19 C28 19 24 16 22 10 Z" fill={`url(#${p}-a)`} stroke={C} strokeWidth="1.5" />
      {detalhe === 'malha' && <path d="M18 30 L46 30 L46 56 L18 56 Z" fill={`url(#${p}-m)`} />}
      {detalhe === 'couro' && <path d="M24 28 L40 28 M24 36 L40 36 M24 44 L40 44" stroke="#2a1a0e" strokeWidth="1.5" />}
      {detalhe === 'runas' && <path d="M32 26 L32 48 M26 32 L38 40 M38 32 L26 40" stroke="#c7b8ff" strokeWidth="1.5" />}
    </g>
  );
}

function Pocao({ p, cor, brilho }: { p: string; cor: string; brilho: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${p}-f`} cx="0.4" cy="0.35">
          <stop offset="0" stopColor={brilho} />
          <stop offset="1" stopColor={cor} />
        </radialGradient>
      </defs>
      <path d="M27 8 L37 8 L37 20 C46 23 52 31 52 40 C52 51 43 58 32 58 C21 58 12 51 12 40 C12 31 18 23 27 20 Z" fill="#d9e4ec" fillOpacity="0.15" stroke={C} strokeWidth="1.5" />
      <path d="M14 38 C20 34 44 34 50 38 C50 50 42 56 32 56 C22 56 14 50 14 38 Z" fill={`url(#${p}-f)`} />
      <rect x="25" y="4" width="14" height="6" rx="1.5" fill="#6b4426" stroke={C} strokeWidth="1.2" />
      <path d="M19 30 C21 26 24 24 27 23" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="46" r="2" fill="#fff" fillOpacity="0.5" />
      <circle cx="36" cy="42" r="1.4" fill="#fff" fillOpacity="0.4" />
    </g>
  );
}

const DESENHOS: Readonly<Record<string, (p: string) => ReactElement>> = {
  'espada-longa': (p) => <Lamina p={p} comprimento={30} cor={['#eef1f4', '#7d848e']} guarda="#c9a25a" />,
  'espada-vorpal': (p) => <Lamina p={p} comprimento={34} cor={['#e9f3ff', '#7aa8d8']} guarda="#e8cc8a" gema="#5aa8ff" />,
  'adaga-enferrujada': (p) => <Lamina p={p} comprimento={18} cor={['#b8a890', '#6b5a48']} guarda="#5a4c42" />,
  'cajado-de-carvalho': (p) => <Cajado p={p} gema="#9fd1ff" brilho="#5aa8ff" />,
  'cajado-das-brasas': (p) => <Cajado p={p} gema="#ff6a1f" brilho="#ffb347" />,
  'arco-curto': () => <Arco cor="#a8743f" />,
  'arco-de-teixo': () => <Arco cor="#c9a25a" />,
  'gibao-de-couro': (p) => <Armadura p={p} cor={['#a8743f', '#4a2e18']} detalhe="couro" />,
  'cota-de-malha': (p) => <Armadura p={p} cor={['#a5a9b0', '#4a4e56']} detalhe="malha" />,
  'manto-runico': (p) => <Armadura p={p} cor={['#4a3a7a', '#1b1238']} detalhe="runas" />,
  'pocao-de-vida': (p) => <Pocao p={p} cor="#a8141f" brilho="#ff6a6a" />,
  'pocao-de-mana': (p) => <Pocao p={p} cor="#1a4aa8" brilho="#9fd1ff" />,
  'elixir-do-santuario': (p) => <Pocao p={p} cor="#a87a14" brilho="#fff0c2" />,
};

export const IlustracaoDeItem = memo(function IlustracaoDeItem({ catalogoId, tamanho = 48 }: { catalogoId: string; tamanho?: number }) {
  const p = useId().replace(/:/g, '');
  const desenho = DESENHOS[catalogoId];
  return (
    <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} className="ilustracao-item" aria-hidden="true">
      {desenho ? desenho(p) : <circle cx="32" cy="32" r="14" fill="#c9a25a" />}
    </svg>
  );
});
