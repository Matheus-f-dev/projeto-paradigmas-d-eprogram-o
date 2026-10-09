import { memo, useId, type ReactElement } from 'react';

/**
 * Ilustrações vetoriais dos combatentes (viewBox 200×260, pés em y≈250).
 * Todos são desenhados olhando para a direita; inimigos são espelhados pelo CSS.
 * Partes com classe "sprite__*" recebem animações próprias (capa, chama, olhos).
 */

const CONTORNO = '#0c0806';

type Desenho = (props: { p: string }) => ReactElement;

function Sombra() {
  return <ellipse cx="100" cy="250" rx="58" ry="9" fill="#000" opacity="0.45" />;
}

const Guerreiro: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-aco`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9dde3" />
        <stop offset="0.45" stopColor="#8d949e" />
        <stop offset="1" stopColor="#3a3f47" />
      </linearGradient>
      <linearGradient id={`${p}-capa`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8f2b30" />
        <stop offset="1" stopColor="#3a0f13" />
      </linearGradient>
      <linearGradient id={`${p}-ouro`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff0c2" />
        <stop offset="0.5" stopColor="#c9a25a" />
        <stop offset="1" stopColor="#7a5424" />
      </linearGradient>
      <linearGradient id={`${p}-lamina`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f4f6f8" />
        <stop offset="1" stopColor="#8d949e" />
      </linearGradient>
    </defs>
    <Sombra />
    {/* Capa */}
    <path className="sprite__capa" d="M70 82 C46 120 40 190 46 238 L104 240 L112 90 Z" fill={`url(#${p}-capa)`} stroke={CONTORNO} strokeWidth="2.5" />
    {/* Pernas */}
    <path d="M78 168 L72 244 L92 246 L98 172 Z M108 170 L112 246 L132 244 L124 168 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M70 236 L96 236 L98 248 L66 248 Z M108 236 L136 236 L138 248 L106 248 Z" fill="#2b2420" stroke={CONTORNO} strokeWidth="2" />
    {/* Tronco */}
    <path d="M70 92 L132 92 L138 150 L126 176 L76 176 L64 150 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M86 108 L116 108 L112 140 L101 152 L90 140 Z" fill={`url(#${p}-ouro)`} stroke={CONTORNO} strokeWidth="1.5" />
    <path d="M101 114 L101 144 M92 124 L110 124" stroke="#5e1a20" strokeWidth="3" />
    <path d="M66 156 L136 156 L134 166 L68 166 Z" fill="#3a2618" stroke={CONTORNO} strokeWidth="2" />
    <rect x="96" y="155" width="10" height="12" fill={`url(#${p}-ouro)`} stroke={CONTORNO} strokeWidth="1.5" />
    {/* Escudo no braço esquerdo (frente) */}
    <g>
      <path d="M38 110 L78 104 L80 150 C78 176 60 190 46 196 C34 184 26 168 30 140 Z" fill="#5e1a20" stroke={CONTORNO} strokeWidth="3" />
      <path d="M38 110 L78 104 L80 150 C78 176 60 190 46 196 C34 184 26 168 30 140 Z" fill="none" stroke={`url(#${p}-ouro)`} strokeWidth="4" strokeLinejoin="round" transform="translate(2 2) scale(0.97)" />
      <path d="M54 124 L58 138 L72 140 L60 148 L64 164 L54 154 L44 162 L48 148 L38 140 L50 138 Z" fill={`url(#${p}-ouro)`} />
    </g>
    {/* Ombreiras */}
    <path d="M60 86 C66 72 88 74 92 88 L88 104 L62 104 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M110 88 C116 74 138 72 144 86 L142 104 L114 104 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M62 96 L90 96 M112 96 L142 96" stroke={`url(#${p}-ouro)`} strokeWidth="3" />
    {/* Braço da espada */}
    <path d="M134 98 L150 128 L144 136 L126 110 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    {/* Espada erguida */}
    <g className="sprite__arma">
      <path d="M150 128 L190 36 L196 40 L158 132 Z" fill={`url(#${p}-lamina)`} stroke={CONTORNO} strokeWidth="2" />
      <path d="M190 36 L196 24 L197 40 Z" fill="#f4f6f8" stroke={CONTORNO} strokeWidth="1.5" />
      <path d="M138 122 L166 138 L162 144 L134 128 Z" fill={`url(#${p}-ouro)`} stroke={CONTORNO} strokeWidth="2" />
      <path d="M148 132 L140 150 L146 152 L154 134 Z" fill="#3a2618" stroke={CONTORNO} strokeWidth="1.5" />
      <circle cx="139" cy="153" r="5" fill={`url(#${p}-ouro)`} stroke={CONTORNO} strokeWidth="1.5" />
      <path d="M168 88 L186 46" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" className="sprite__reflexo" />
    </g>
    {/* Elmo */}
    <path d="M78 44 C78 22 124 22 124 44 L126 78 C118 90 84 90 76 78 Z" fill={`url(#${p}-aco)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M84 56 L120 56 L118 62 L86 62 Z" fill="#120c0a" />
    <path d="M101 30 L101 82" stroke={`url(#${p}-ouro)`} strokeWidth="3" />
    <path d="M100 24 C110 6 132 4 146 16 C130 14 118 20 110 32 Z" fill="#8f2b30" stroke={CONTORNO} strokeWidth="2" className="sprite__penacho" />
    <circle cx="96" cy="59" r="1.8" fill="#bfe3ff" className="sprite__olho" />
    <circle cx="109" cy="59" r="1.8" fill="#bfe3ff" className="sprite__olho" />
  </>
);

const Mago: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-manto`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2a6e" />
        <stop offset="0.6" stopColor="#24184a" />
        <stop offset="1" stopColor="#120c26" />
      </linearGradient>
      <linearGradient id={`${p}-ouro`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff0c2" />
        <stop offset="1" stopColor="#a87a34" />
      </linearGradient>
      <radialGradient id={`${p}-orbe`}>
        <stop offset="0" stopColor="#fff6dc" />
        <stop offset="0.35" stopColor="#ffc06a" />
        <stop offset="0.7" stopColor="#ff7a2f" />
        <stop offset="1" stopColor="#ff7a2f" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-madeira`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6b4426" />
        <stop offset="1" stopColor="#3a2414" />
      </linearGradient>
    </defs>
    <Sombra />
    {/* Manto */}
    <path className="sprite__capa" d="M72 86 C58 140 44 200 36 246 L164 246 C152 200 140 140 128 86 Z" fill={`url(#${p}-manto)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M40 236 C80 228 120 228 160 236 L164 246 L36 246 Z" fill="none" stroke={`url(#${p}-ouro)`} strokeWidth="4" />
    <path d="M100 96 L100 244" stroke={`url(#${p}-ouro)`} strokeWidth="3" />
    <path d="M86 110 L114 110 L108 150 L92 150 Z" fill="#1b1238" stroke={`url(#${p}-ouro)`} strokeWidth="1.5" />
    <path d="M100 118 L104 128 L100 138 L96 128 Z" fill="#ffc06a" className="sprite__runa" />
    {/* Cinto e livro */}
    <path d="M70 158 L130 158 L128 168 L72 168 Z" fill="#3a2618" stroke={CONTORNO} strokeWidth="2" />
    <rect x="58" y="160" width="20" height="26" rx="2" fill="#5e1a20" stroke={CONTORNO} strokeWidth="2" transform="rotate(-12 68 173)" />
    {/* Braço com cajado */}
    <path d="M124 96 C140 110 146 126 146 138 L136 142 C134 130 124 118 114 110 Z" fill={`url(#${p}-manto)`} stroke={CONTORNO} strokeWidth="2.5" />
    <g className="sprite__arma">
      <path d="M150 248 L164 40" stroke={`url(#${p}-madeira)`} strokeWidth="7" strokeLinecap="round" />
      <path d="M150 248 L164 40" stroke={CONTORNO} strokeWidth="9" strokeLinecap="round" opacity="0.35" />
      <path d="M156 56 C150 40 158 26 166 24 C176 28 178 44 170 58" fill="none" stroke={`url(#${p}-madeira)`} strokeWidth="5" />
      <circle cx="164" cy="38" r="26" fill={`url(#${p}-orbe)`} className="sprite__orbe" />
      <path d="M164 26 L171 38 L164 50 L157 38 Z" fill="#ffe2a0" stroke="#ff7a2f" strokeWidth="1.5" />
    </g>
    <circle cx="144" cy="140" r="8" fill="#e8c9a8" stroke={CONTORNO} strokeWidth="2" />
    {/* Mão livre com chama */}
    <path d="M78 98 C62 112 56 128 58 140 L68 140 C70 128 76 118 86 110 Z" fill={`url(#${p}-manto)`} stroke={CONTORNO} strokeWidth="2.5" />
    <circle cx="62" cy="142" r="7" fill="#e8c9a8" stroke={CONTORNO} strokeWidth="2" />
    {/* Capuz e rosto */}
    <path d="M66 92 C60 50 80 18 104 14 C124 18 140 48 134 92 C124 100 76 100 66 92 Z" fill={`url(#${p}-manto)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M80 86 C78 56 88 38 102 36 C116 38 124 56 122 86 Z" fill="#120c1c" />
    <path d="M86 70 C86 54 94 46 102 46 C112 46 118 56 116 70 C114 82 106 88 100 88 C92 88 86 80 86 70 Z" fill="#e2c2a0" stroke={CONTORNO} strokeWidth="1.5" />
    <path d="M86 58 C92 44 112 42 118 60 C112 52 104 50 98 52 C94 54 90 58 86 58 Z" fill="#4a2a1a" />
    <path d="M92 66 L98 66 M106 66 L112 66" stroke="#2a1a14" strokeWidth="2" strokeLinecap="round" />
    <path d="M97 78 C100 80 104 80 106 78" stroke="#8a4a3a" strokeWidth="1.5" fill="none" />
    <path d="M104 14 C112 4 126 0 134 6 C124 8 116 14 112 22 Z" fill={`url(#${p}-manto)`} stroke={CONTORNO} strokeWidth="2" />
  </>
);

const Arqueiro: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-capa`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3f5a34" />
        <stop offset="1" stopColor="#1c2a18" />
      </linearGradient>
      <linearGradient id={`${p}-couro`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a8743f" />
        <stop offset="1" stopColor="#4a2e18" />
      </linearGradient>
      <linearGradient id={`${p}-arco`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9a25a" />
        <stop offset="1" stopColor="#6b4426" />
      </linearGradient>
    </defs>
    <Sombra />
    {/* Aljava nas costas */}
    <g transform="rotate(-18 70 100)">
      <rect x="56" y="70" width="22" height="70" rx="4" fill={`url(#${p}-couro)`} stroke={CONTORNO} strokeWidth="2" />
      <path d="M60 70 L58 50 M66 70 L66 46 M72 70 L74 50" stroke="#d9c08a" strokeWidth="2" />
      <path d="M55 52 L58 44 L61 52 M63 48 L66 40 L69 48 M71 52 L74 44 L77 52" fill="#e8e0d0" stroke={CONTORNO} strokeWidth="1" />
    </g>
    {/* Capa */}
    <path className="sprite__capa" d="M70 84 C54 130 50 190 56 236 L96 238 L104 90 Z" fill={`url(#${p}-capa)`} stroke={CONTORNO} strokeWidth="2.5" />
    {/* Pernas */}
    <path d="M82 168 L76 244 L94 246 L98 172 Z M106 170 L110 246 L128 244 L122 168 Z" fill="#3a2a1c" stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M74 220 L96 220 L98 248 L70 248 Z M108 220 L130 220 L132 248 L106 248 Z" fill={`url(#${p}-couro)`} stroke={CONTORNO} strokeWidth="2" />
    {/* Tronco */}
    <path d="M74 90 L126 90 L130 150 L120 176 L80 176 L70 150 Z" fill={`url(#${p}-couro)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M78 100 L122 140 M122 100 L78 140" stroke="#3a2414" strokeWidth="2" opacity="0.6" />
    <path d="M72 152 L128 152 L127 162 L73 162 Z" fill="#2a1c12" stroke={CONTORNO} strokeWidth="2" />
    {/* Braços estendidos segurando o arco */}
    <path d="M122 96 L162 112 L160 122 L118 110 Z" fill={`url(#${p}-capa)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M80 98 L134 122 L130 130 L76 108 Z" fill={`url(#${p}-capa)`} stroke={CONTORNO} strokeWidth="2.5" />
    <g className="sprite__arma">
      <path d="M166 40 C196 80 196 160 166 200" fill="none" stroke={`url(#${p}-arco)`} strokeWidth="6" strokeLinecap="round" />
      <path d="M166 40 C196 80 196 160 166 200" fill="none" stroke={CONTORNO} strokeWidth="8" strokeLinecap="round" opacity="0.3" />
      <path d="M166 40 L132 120 L166 200" fill="none" stroke="#efe6d2" strokeWidth="1.2" />
      <path d="M132 120 L196 118" stroke="#d9c08a" strokeWidth="2.5" />
      <path d="M196 118 L188 113 L190 118 L188 123 Z" fill="#e8e0d0" stroke={CONTORNO} strokeWidth="1" />
    </g>
    <circle cx="164" cy="118" r="7" fill="#d8b48a" stroke={CONTORNO} strokeWidth="2" />
    <circle cx="132" cy="122" r="7" fill="#d8b48a" stroke={CONTORNO} strokeWidth="2" />
    {/* Capuz */}
    <path d="M72 92 C66 54 84 24 104 22 C124 24 138 54 132 92 C120 100 82 100 72 92 Z" fill={`url(#${p}-capa)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M86 84 C84 60 92 44 104 42 C116 44 124 60 122 84 Z" fill="#0f140c" />
    <path d="M92 70 C92 56 98 50 106 50 C114 50 120 58 118 70 C116 80 110 86 104 86 C98 86 92 80 92 70 Z" fill="#d8b48a" stroke={CONTORNO} strokeWidth="1.5" />
    <path d="M104 66 L118 66" stroke="#2a1a14" strokeWidth="2" strokeLinecap="round" />
    <path d="M88 84 C96 92 116 92 124 84 L122 96 C112 102 96 102 86 96 Z" fill="#5e1a20" stroke={CONTORNO} strokeWidth="1.5" />
  </>
);

function Goblin({ p, pele, roupa, chapeu }: { p: string; pele: [string, string]; roupa: string; chapeu?: 'capuz' | 'elmo' }) {
  return (
    <>
      <defs>
        <linearGradient id={`${p}-pele`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pele[0]} />
          <stop offset="1" stopColor={pele[1]} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="250" rx="44" ry="8" fill="#000" opacity="0.45" />
      {/* Pernas */}
      <path d="M82 196 L74 244 L92 246 L94 200 Z M108 198 L112 246 L128 244 L120 194 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      {/* Corpo curvado */}
      <path d="M70 140 C68 118 84 106 104 108 C126 110 136 128 132 152 C130 180 120 204 100 206 C80 206 72 180 70 140 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      <path d="M72 170 C82 176 120 178 130 168 L126 200 C116 210 86 210 76 200 Z" fill={roupa} stroke={CONTORNO} strokeWidth="2" />
      <path d="M78 186 L86 210 M96 190 L98 212 M114 188 L112 210" stroke={CONTORNO} strokeWidth="2" />
      {/* Braço com adaga */}
      <path d="M124 126 C140 136 148 150 150 162 L140 166 C136 154 128 144 118 138 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      <g className="sprite__arma">
        <path d="M146 162 L180 132 L184 136 L152 168 Z" fill="#9a8e7e" stroke={CONTORNO} strokeWidth="2" />
        <path d="M160 148 L172 140" stroke="#6b5a48" strokeWidth="2" />
        <path d="M140 160 L154 172" stroke="#3a2614" strokeWidth="6" strokeLinecap="round" />
      </g>
      <path d="M76 128 C62 140 58 156 60 170 L70 170 C70 158 76 146 84 138 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      {/* Cabeça */}
      <path d="M70 92 C66 66 84 50 104 50 C126 50 140 66 136 92 C134 110 120 120 102 120 C84 120 72 110 70 92 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      {/* Orelhas pontudas */}
      <path d="M74 78 L28 58 L72 96 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" className="sprite__orelha" />
      <path d="M132 76 L176 50 L136 96 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" className="sprite__orelha sprite__orelha--d" />
      <path d="M70 76 L42 64 L70 88 Z M136 76 L162 60 L134 88 Z" fill="#00000033" />
      {/* Olhos e boca */}
      <path d="M88 82 L100 86 L88 90 Z M124 82 L112 86 L124 90 Z" fill="#ffd23a" className="sprite__olho" />
      <path d="M86 100 C96 110 112 110 122 100 L118 106 C110 114 98 114 90 106 Z" fill="#2a0a08" stroke={CONTORNO} strokeWidth="1.5" />
      <path d="M92 102 L95 108 L98 103 L101 109 L104 103 L107 109 L110 103 L113 108 L116 102" fill="#efe6c8" />
      <path d="M100 88 L104 98 L98 98 Z" fill="#00000044" />
      {chapeu === 'capuz' && (
        <path d="M66 86 C62 54 84 36 104 36 C126 36 144 56 140 86 C132 70 120 62 104 62 C88 62 76 70 66 86 Z" fill="#3a2a1c" stroke={CONTORNO} strokeWidth="2.5" />
      )}
      {chapeu === 'elmo' && (
        <g>
          <path d="M68 78 C66 52 86 40 104 40 C124 40 142 52 138 78 Z" fill="#6f665d" stroke={CONTORNO} strokeWidth="2.5" />
          <path d="M104 40 L108 16 L114 42 Z M78 48 L64 30 L86 44 Z" fill="#a59a8c" stroke={CONTORNO} strokeWidth="2" />
        </g>
      )}
    </>
  );
}

const Zumbi: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-ferrugem`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7d7468" />
        <stop offset="0.5" stopColor="#4f463c" />
        <stop offset="1" stopColor="#2a241f" />
      </linearGradient>
      <linearGradient id={`${p}-osso`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e8e0c8" />
        <stop offset="1" stopColor="#8a8270" />
      </linearGradient>
      <radialGradient id={`${p}-brilho`}>
        <stop offset="0" stopColor="#c8ffc0" />
        <stop offset="0.5" stopColor="#4fcf6c" />
        <stop offset="1" stopColor="#4fcf6c" stopOpacity="0" />
      </radialGradient>
    </defs>
    <Sombra />
    {/* Capa rasgada */}
    <path className="sprite__capa" d="M68 84 C50 130 48 190 52 240 L62 226 L70 242 L82 228 L92 244 L104 90 Z" fill="#26302a" stroke={CONTORNO} strokeWidth="2.5" />
    {/* Pernas ósseas */}
    <path d="M84 170 L80 244 M116 170 L122 244" stroke={`url(#${p}-osso)`} strokeWidth="10" strokeLinecap="round" />
    <path d="M84 170 L80 244 M116 170 L122 244" stroke={CONTORNO} strokeWidth="12" strokeLinecap="round" opacity="0.25" />
    <path d="M70 234 L94 234 L94 248 L68 248 Z M108 234 L134 234 L136 248 L108 248 Z" fill={`url(#${p}-ferrugem)`} stroke={CONTORNO} strokeWidth="2" />
    {/* Peitoral enferrujado */}
    <path d="M72 92 L130 92 L134 146 L122 172 L80 172 L68 146 Z" fill={`url(#${p}-ferrugem)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M90 104 L84 140 M110 104 L116 140 M100 100 L100 150" stroke="#2a241f" strokeWidth="3" />
    <path d="M118 120 L126 128 L120 134 Z" fill="#000" opacity="0.5" />
    {/* Braço com espada */}
    <path d="M128 98 L146 130" stroke={`url(#${p}-osso)`} strokeWidth="9" strokeLinecap="round" />
    <g className="sprite__arma">
      <path d="M146 130 L186 52 L192 56 L154 134 Z" fill="#8d949e" stroke={CONTORNO} strokeWidth="2" />
      <path d="M176 70 L184 58" stroke="#3a3f47" strokeWidth="3" />
      <path d="M136 124 L162 140 L158 146 L132 130 Z" fill="#4f463c" stroke={CONTORNO} strokeWidth="2" />
    </g>
    <path d="M74 98 L58 140" stroke={`url(#${p}-osso)`} strokeWidth="9" strokeLinecap="round" />
    <path d="M60 86 C66 72 88 74 92 88 L88 104 L62 104 Z M110 88 C116 74 138 72 144 86 L142 104 L114 104 Z" fill={`url(#${p}-ferrugem)`} stroke={CONTORNO} strokeWidth="2.5" />
    {/* Crânio com elmo quebrado */}
    <path d="M80 50 C80 28 122 28 122 50 L122 74 C116 86 86 86 80 74 Z" fill={`url(#${p}-osso)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M76 48 C76 22 126 22 126 48 L118 46 L112 54 L104 44 L96 52 L88 44 Z" fill={`url(#${p}-ferrugem)`} stroke={CONTORNO} strokeWidth="2.5" />
    <ellipse cx="92" cy="60" rx="7" ry="6" fill="#0a0c08" />
    <ellipse cx="111" cy="60" rx="7" ry="6" fill="#0a0c08" />
    <circle cx="92" cy="60" r="9" fill={`url(#${p}-brilho)`} className="sprite__olho" />
    <circle cx="111" cy="60" r="9" fill={`url(#${p}-brilho)`} className="sprite__olho" />
    <path d="M90 76 L114 76 M94 72 L94 80 M100 72 L100 80 M106 72 L106 80" stroke={CONTORNO} strokeWidth="1.5" />
  </>
);

const Demogorgon: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-pele`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a6a70" />
        <stop offset="0.5" stopColor="#5a4048" />
        <stop offset="1" stopColor="#2a1c22" />
      </linearGradient>
      <radialGradient id={`${p}-boca`}>
        <stop offset="0" stopColor="#2a0006" />
        <stop offset="0.6" stopColor="#8a1a2a" />
        <stop offset="1" stopColor="#ff6a6a" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="252" rx="62" ry="8" fill="#000" opacity="0.5" />
    {/* Pernas longas */}
    <path d="M86 160 C80 190 70 214 66 248 L82 248 C88 220 96 196 100 170 Z M110 160 C116 192 120 218 126 248 L142 248 C136 216 130 188 122 158 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    {/* Tronco esguio */}
    <path d="M78 96 C76 80 90 70 102 70 C116 70 128 80 126 98 L122 168 C110 176 92 176 82 168 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M90 100 C94 110 110 110 114 100 M88 120 C94 128 110 128 116 120 M90 140 C96 146 108 146 114 140" stroke="#2a1c22" strokeWidth="2" fill="none" />
    {/* Braços longos com garras */}
    <path d="M122 92 C146 110 160 140 166 178 L156 182 C150 150 138 124 116 108 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <g className="sprite__arma">
      <path d="M156 180 L150 214 M160 182 L162 218 M164 180 L174 210" stroke="#e8dcc4" strokeWidth="3" strokeLinecap="round" />
      <path d="M156 180 L150 214 M160 182 L162 218 M164 180 L174 210" stroke={CONTORNO} strokeWidth="5" strokeLinecap="round" opacity="0.3" />
    </g>
    <path d="M82 92 C60 112 48 142 44 178 L54 180 C58 150 70 126 88 108 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M46 178 L36 210 M50 180 L48 216 M54 178 L60 208" stroke="#e8dcc4" strokeWidth="3" strokeLinecap="round" />
    {/* Cabeça em pétalas abertas */}
    <g className="sprite__cabeca" style={{ transformOrigin: '102px 52px' }}>
      <circle cx="102" cy="52" r="24" fill={`url(#${p}-boca)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M102 52 C92 30 92 6 102 -6 C112 6 112 30 102 52 Z"
          fill={`url(#${p}-pele)`}
          stroke={CONTORNO}
          strokeWidth="2.5"
          transform={`rotate(${i * 72 - 10} 102 52)`}
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const angulo = (i / 14) * Math.PI * 2;
        const x = 102 + Math.cos(angulo) * 16;
        const y = 52 + Math.sin(angulo) * 16;
        const x2 = 102 + Math.cos(angulo) * 9;
        const y2 = 52 + Math.sin(angulo) * 9;
        return <path key={i} d={`M${x} ${y} L${x2} ${y2}`} stroke="#f4ead2" strokeWidth="2.5" strokeLinecap="round" />;
      })}
      <circle cx="102" cy="52" r="6" fill="#ff3a3a" className="sprite__olho" />
    </g>
  </>
);

const Dart: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-pele`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a7a62" />
        <stop offset="1" stopColor="#3a2e24" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="250" rx="54" ry="7" fill="#000" opacity="0.45" />
    <path className="sprite__cauda" d="M52 200 C30 196 18 178 22 160 C30 176 42 186 60 188 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M58 182 C60 160 84 150 112 154 C136 158 148 172 146 192 C144 210 120 218 96 216 C72 214 56 204 58 182 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M70 206 L64 246 L76 246 L82 210 Z M88 212 L88 248 L100 248 L100 214 Z M120 210 L124 248 L136 246 L132 206 Z M134 200 L144 244 L156 242 L144 196 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
    <path d="M80 160 C90 168 110 168 124 162" stroke="#2a201a" strokeWidth="2" fill="none" />
    <g className="sprite__cabeca" style={{ transformOrigin: '160px 166px' }}>
      <path d="M140 170 C142 152 156 144 170 148 C184 152 188 168 182 180 C176 192 156 194 146 186 Z" fill={`url(#${p}-pele)`} stroke={CONTORNO} strokeWidth="2.5" />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d="M172 166 C180 156 190 154 196 158 C192 166 184 170 172 166 Z"
          fill="#a08a6e"
          stroke={CONTORNO}
          strokeWidth="1.8"
          transform={`rotate(${i * 30 - 45} 172 166)`}
        />
      ))}
      <circle cx="166" cy="164" r="3.5" fill="#9dff9a" className="sprite__olho" />
    </g>
  </>
);

const Bau: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-madeira`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8a5a32" />
        <stop offset="1" stopColor="#3a2414" />
      </linearGradient>
      <linearGradient id={`${p}-ferro`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8d8378" />
        <stop offset="1" stopColor="#3a332c" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="250" rx="64" ry="8" fill="#000" opacity="0.5" />
    <path d="M40 176 L160 176 L160 246 L40 246 Z" fill={`url(#${p}-madeira)`} stroke={CONTORNO} strokeWidth="3" />
    <path d="M40 176 C40 140 160 140 160 176 Z" fill={`url(#${p}-madeira)`} stroke={CONTORNO} strokeWidth="3" />
    <path d="M40 190 L160 190 M40 218 L160 218" stroke="#2a1a0e" strokeWidth="2" />
    <path d="M60 148 L60 246 M140 148 L140 246" stroke={`url(#${p}-ferro)`} strokeWidth="10" />
    <path d="M40 176 L160 176" stroke={`url(#${p}-ferro)`} strokeWidth="7" />
    <rect x="88" y="168" width="24" height="30" rx="3" fill="#c9a25a" stroke={CONTORNO} strokeWidth="2" />
    <circle cx="100" cy="182" r="4" fill="#2a1a0e" />
    <path d="M100 184 L100 192" stroke="#2a1a0e" strokeWidth="3" />
    <path d="M44 175 L156 175" stroke="#ffc06a" strokeWidth="1.5" opacity="0.7" className="sprite__fresta" />
  </>
);

const Portao: Desenho = ({ p }) => (
  <>
    <defs>
      <linearGradient id={`${p}-pedra`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5a524a" />
        <stop offset="1" stopColor="#24201c" />
      </linearGradient>
      <linearGradient id={`${p}-madeira`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a2e18" />
        <stop offset="0.5" stopColor="#6b4426" />
        <stop offset="1" stopColor="#3a2414" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="252" rx="96" ry="8" fill="#000" opacity="0.5" />
    <path d="M2 252 L2 30 L198 30 L198 252 L172 252 L172 110 C172 60 28 60 28 110 L28 252 Z" fill={`url(#${p}-pedra)`} stroke={CONTORNO} strokeWidth="3" />
    {Array.from({ length: 6 }, (_, i) => (
      <path key={i} d={`M2 ${60 + i * 34} L28 ${60 + i * 34} M172 ${60 + i * 34} L198 ${60 + i * 34}`} stroke="#1a1714" strokeWidth="2" />
    ))}
    <path d="M28 110 C28 64 172 64 172 110 L172 252 L28 252 Z" fill={`url(#${p}-madeira)`} stroke={CONTORNO} strokeWidth="3" />
    {[52, 76, 100, 124, 148].map((x) => (
      <path key={x} d={`M${x} 82 L${x} 252`} stroke="#2a1a0e" strokeWidth="2.5" />
    ))}
    {[130, 190].map((y) => (
      <g key={y}>
        <rect x="28" y={y - 7} width="144" height="14" fill="#3a332c" stroke={CONTORNO} strokeWidth="2" />
        {[40, 70, 100, 130, 160].map((x) => (
          <circle key={x} cx={x} cy={y} r="3.5" fill="#8d8378" stroke={CONTORNO} strokeWidth="1" />
        ))}
      </g>
    ))}
    <circle cx="100" cy="226" r="9" fill="none" stroke="#8d8378" strokeWidth="4" />
    <path d="M70 30 L70 8 L84 8 L84 30 M116 30 L116 8 L130 8 L130 30" fill={`url(#${p}-pedra)`} stroke={CONTORNO} strokeWidth="2" />
  </>
);

const DESENHOS: Readonly<Record<string, Desenho>> = {
  guerreiro: Guerreiro,
  mago: Mago,
  arqueiro: Arqueiro,
  goblin: ({ p }) => <Goblin p={p} pele={['#8fbf5a', '#3f6a2a']} roupa="#5a3a20" />,
  'goblin-batedor': ({ p }) => <Goblin p={p} pele={['#a3c46a', '#4a6e30']} roupa="#3a2a1c" chapeu="capuz" />,
  'goblin-saqueador': ({ p }) => <Goblin p={p} pele={['#7aa85a', '#2f5a24']} roupa="#5e1a20" chapeu="elmo" />,
  zumbi: Zumbi,
  demogorgon: Demogorgon,
  dart: Dart,
  bau: Bau,
  portao: Portao,
};

export type AparenciaDeSprite = keyof typeof DESENHOS;

/** Escolhe a ilustração a partir do id/classe do combatente. */
export function aparenciaPara(id: string, classe: string): string {
  if (DESENHOS[id]) return id;
  if (id.startsWith('heroi-')) return classe;
  if (classe === 'zumbi') return 'zumbi';
  if (id === 'demogorgon' || classe === 'chefe') return 'demogorgon';
  if (id.includes('bau')) return 'bau';
  if (id.includes('portao')) return 'portao';
  return DESENHOS[classe] ? classe : 'goblin';
}

/** Enquadramento de cada ilustração (objetos ocupam só parte da área padrão). */
const ENQUADRAMENTOS: Readonly<Record<string, string>> = {
  bau: '24 136 152 124',
  portao: '-4 0 208 262',
};

export const SpriteDePersonagem = memo(function SpriteDePersonagem({
  aparencia,
  className,
}: {
  aparencia: string;
  className?: string;
}) {
  const p = useId().replace(/:/g, '');
  const Desenho = DESENHOS[aparencia] ?? DESENHOS.goblin!;
  return (
    <svg
      viewBox={ENQUADRAMENTOS[aparencia] ?? '-10 -14 220 274'}
      preserveAspectRatio="xMidYMax meet"
      className={['sprite', `sprite--${aparencia}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <Desenho p={p} />
    </svg>
  );
});
