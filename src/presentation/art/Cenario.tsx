import { memo, useEffect, useId, useMemo, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { AMBIENTES, type TipoDeCenario } from '../effects/presets';
import { CanvasDeParticulas } from '../effects/CanvasDeParticulas';
import { useMovimentoReduzido } from '../store/ContextoDoJogo';
import { aleatorioComSemente, arvoreMorta, colinas, estrelas, janelas, pinheiro, serra, torre } from './gerador';

const L = 1600;
const A = 900;

/** Camada de paralaxe: quanto maior a profundidade, mais ela acompanha o ponteiro. */
function Camada({ profundidade, children, className }: { profundidade: number; children: ReactNode; className?: string }) {
  return (
    <div className={`cenario__camada ${className ?? ''}`} style={{ '--p': profundidade } as CSSProperties}>
      <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="xMidYMax slice" className="cenario__svg">
        {children}
      </svg>
    </div>
  );
}

function Tocha({ x, y, escala = 1, id }: { x: number; y: number; escala?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <circle r="120" fill={`url(#${id}-luz-tocha)`} className="cenario__luz-tocha" />
      <path d="M-6 0 L6 0 L9 -10 L-9 -10 Z M-2 0 L2 0 L2 40 L-2 40 Z" fill="#1d1511" stroke="#3a2b20" strokeWidth="1" />
      <g className="cenario__chama">
        <path d="M0 -58 C10 -42 14 -30 10 -18 C7 -10 -7 -10 -10 -18 C-14 -30 -8 -40 0 -58 Z" fill="#ff7a2f" />
        <path d="M0 -46 C6 -36 8 -27 5 -19 C3 -14 -3 -14 -5 -19 C-8 -27 -4 -35 0 -46 Z" fill="#ffc06a" />
        <path d="M0 -34 C3 -28 4 -23 2 -19 C1 -17 -1 -17 -2 -19 C-4 -23 -2 -28 0 -34 Z" fill="#fff3c4" />
      </g>
    </g>
  );
}

function DefinicoesComuns({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-luz-tocha`}>
        <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
        <stop offset="0.4" stopColor="#ff7a2f" stopOpacity="0.18" />
        <stop offset="1" stopColor="#ff7a2f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-halo-lua`}>
        <stop offset="0" stopColor="#f6e7c8" stopOpacity="0.55" />
        <stop offset="0.35" stopColor="#d9c7a8" stopOpacity="0.12" />
        <stop offset="1" stopColor="#d9c7a8" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-desfoque`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={`${id}-desfoque-forte`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="22" />
      </filter>
    </defs>
  );
}

function CeuEstrelado({ semente, quantidade, altura }: { semente: number; quantidade: number; altura: number }) {
  const lista = useMemo(() => estrelas(semente, quantidade, L, altura), [semente, quantidade, altura]);
  return (
    <g className="cenario__estrelas">
      {lista.map((estrela, i) => (
        <circle
          key={i}
          cx={estrela.x}
          cy={estrela.y}
          r={estrela.r}
          fill="#f3e6c8"
          style={{ animationDelay: `${estrela.atraso}s` }}
          className={i % 3 === 0 ? 'cenario__estrela-pisca' : undefined}
        />
      ))}
    </g>
  );
}

function Castelo({ x, y, escala, cor, semente, comLuzes = true }: { x: number; y: number; escala: number; cor: string; semente: number; comLuzes?: boolean }) {
  const pecas = useMemo(() => {
    const r = aleatorioComSemente(semente);
    const torres = [
      { dx: -170, l: 46, a: 210, t: true },
      { dx: -110, l: 70, a: 150, t: false },
      { dx: -40, l: 64, a: 300, t: true },
      { dx: 30, l: 90, a: 190, t: false },
      { dx: 120, l: 52, a: 250, t: true },
      { dx: 175, l: 40, a: 140, t: false },
    ];
    return torres.map((t, i) => ({
      caminho: torre(t.dx, 0, t.l, t.a, t.t),
      janelas: janelas(semente + i, t.dx, 0, t.l, t.a, 2 + Math.floor(r() * 3)),
      bandeira: t.t ? { x: t.dx + t.l / 2, y: -t.a - t.a * 0.45 } : null,
    }));
  }, [semente]);
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-200 0 L-200 -90 L210 -90 L210 0 Z" fill={cor} />
      {pecas.map((peca, i) => (
        <g key={i}>
          <path d={peca.caminho} fill={cor} />
          {comLuzes &&
            peca.janelas.map((janela, j) => (
              <rect
                key={j}
                x={janela.x}
                y={janela.y}
                width={janela.l}
                height={janela.a}
                rx="1.5"
                fill="#ffb347"
                className="cenario__janela"
                style={{ animationDelay: `${(i + j) * 0.7}s` }}
              />
            ))}
          {peca.bandeira && (
            <g transform={`translate(${peca.bandeira.x} ${peca.bandeira.y})`}>
              <path d="M0 0 L0 -26" stroke={cor} strokeWidth="2" />
              <path d="M0 -26 L22 -22 L16 -17 L22 -12 L0 -14 Z" fill="#7a2025" className="cenario__bandeira" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

function Floresta({ semente, quantidade, base, alturas, cor }: { semente: number; quantidade: number; base: number; alturas: [number, number]; cor: string }) {
  const caminho = useMemo(() => {
    const r = aleatorioComSemente(semente);
    return Array.from({ length: quantidade }, (_, i) => {
      const x = (i / quantidade) * L + r() * (L / quantidade);
      const altura = alturas[0] + r() * (alturas[1] - alturas[0]);
      return pinheiro(x, base + r() * 30, altura, altura * 0.42, r);
    }).join(' ');
  }, [semente, quantidade, base, alturas]);
  return <path d={caminho} fill={cor} />;
}

function ArvoresMortas({ semente, posicoes, base, cor }: { semente: number; posicoes: number[]; base: number; cor: string }) {
  const caminho = useMemo(() => {
    const r = aleatorioComSemente(semente);
    return posicoes.map((x) => arvoreMorta(x, base, 260 + r() * 160, r)).join(' ');
  }, [semente, posicoes, base]);
  return <path d={caminho} fill={cor} />;
}

function RaiosDeLuz({ cor, x, opacidade = 0.12 }: { cor: string; x: number; opacidade?: number }) {
  return (
    <g className="cenario__raios" opacity={opacidade}>
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${x + i * 70} -40 L${x + i * 70 + 60} -40 L${x + i * 110 + 260} ${A} L${x + i * 110 + 120} ${A} Z`} fill={cor} />
      ))}
    </g>
  );
}

// ------------------------------------------------------------- cenários

function CenaMenu({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#07070b" />
            <stop offset="0.45" stopColor="#1d0f15" />
            <stop offset="0.75" stopColor="#4a1a1c" />
            <stop offset="1" stopColor="#7a3320" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <CeuEstrelado semente={11} quantidade={140} altura={420} />
        <circle cx="1180" cy="210" r="260" fill={`url(#${id}-halo-lua)`} />
        <circle cx="1180" cy="210" r="74" fill="#efe1c2" />
        <circle cx="1158" cy="196" r="14" fill="#d8c8a6" opacity="0.6" />
        <circle cx="1205" cy="232" r="9" fill="#d8c8a6" opacity="0.5" />
      </Camada>
      <Camada profundidade={0.12}>
        <path d={serra(3, L, A, 640, 260, 9)} fill="#1a1016" />
        <path d={serra(7, L, A, 700, 180, 14)} fill="#150c10" />
      </Camada>
      <Camada profundidade={0.25}>
        <path d="M760 690 C820 560 960 540 1040 600 L1120 690 Z" fill="#100a0c" />
        <Castelo x={930} y={580} escala={1.05} cor="#0e080a" semente={21} />
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--baixa" />
      <Camada profundidade={0.5}>
        <path d={colinas(5, L, A, 790, 90, 6)} fill="#0b0708" />
        <ArvoresMortas semente={8} posicoes={[90, 260, 1420, 1540]} base={800} cor="#080506" />
      </Camada>
      <Camada profundidade={0.85}>
        <DefinicoesComuns id={`${id}-p`} />
        <path d="M0 900 L0 820 Q200 790 420 830 L380 900 Z M1600 900 L1600 815 Q1400 790 1180 835 L1230 900 Z" fill="#050304" />
        <Tocha x={150} y={720} escala={1.3} id={`${id}-p`} />
        <Tocha x={1450} y={720} escala={1.3} id={`${id}-p`} />
      </Camada>
    </>
  );
}

function CenaSelecao({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-salao`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0a0b" />
            <stop offset="0.6" stopColor="#1e1412" />
            <stop offset="1" stopColor="#2c1a14" />
          </linearGradient>
          <linearGradient id={`${id}-vitral`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a4f7a" />
            <stop offset="0.5" stopColor="#6b2a3a" />
            <stop offset="1" stopColor="#c9a25a" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-salao)`} />
        <path d="M680 560 L680 230 Q800 90 920 230 L920 560 Z" fill={`url(#${id}-vitral)`} opacity="0.55" />
        <path d="M680 560 L680 230 Q800 90 920 230 L920 560 Z M800 120 L800 560 M680 330 L920 330 M680 440 L920 440" fill="none" stroke="#120c0a" strokeWidth="9" />
        <RaiosDeLuz cor="#c9b8ff" x={690} opacidade={0.07} />
      </Camada>
      <Camada profundidade={0.25}>
        {[120, 420, 1180, 1480].map((x) => (
          <g key={x}>
            <rect x={x - 50} y="0" width="100" height="900" fill="#140e0c" />
            <rect x={x - 62} y="0" width="124" height="40" fill="#1c1411" />
            <rect x={x - 62} y="780" width="124" height="120" fill="#1c1411" />
            <path d={`M${x - 40} 120 L${x + 40} 120 L${x + 40} 420 L${x} 390 L${x - 40} 420 Z`} fill="#5e1a20" className="cenario__estandarte" />
            <path d={`M${x - 14} 200 L${x} 172 L${x + 14} 200 L${x} 230 Z`} fill="#c9a25a" opacity="0.8" />
          </g>
        ))}
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--baixa" />
      <Camada profundidade={0.6}>
        <DefinicoesComuns id={`${id}-p`} />
        <rect y="800" width={L} height="100" fill="#0a0706" />
        <Tocha x={270} y={560} escala={1.1} id={`${id}-p`} />
        <Tocha x={1330} y={560} escala={1.1} id={`${id}-p`} />
      </Camada>
    </>
  );
}

function CenaFloresta({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#050a0b" />
            <stop offset="0.6" stopColor="#0e1d1c" />
            <stop offset="1" stopColor="#1a2b22" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <CeuEstrelado semente={31} quantidade={60} altura={260} />
        <circle cx="420" cy="150" r="200" fill={`url(#${id}-halo-lua)`} />
        <circle cx="420" cy="150" r="46" fill="#e7ecd8" opacity="0.9" />
      </Camada>
      <Camada profundidade={0.1}>
        <Floresta semente={41} quantidade={34} base={640} alturas={[220, 360]} cor="#14221f" />
      </Camada>
      <Camada profundidade={0.22}>
        <RaiosDeLuz cor="#cfe8d0" x={300} opacidade={0.06} />
        <Floresta semente={42} quantidade={22} base={700} alturas={[300, 480]} cor="#0d1714" />
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--media cenario__nevoa--verde" />
      <Camada profundidade={0.4}>
        <path d={colinas(43, L, A, 760, 50, 5)} fill="#0a120f" />
        <ellipse cx="800" cy="790" rx="620" ry="70" fill="#1e2b1d" opacity="0.65" />
      </Camada>
      <Camada profundidade={0.9}>
        <Floresta semente={44} quantidade={5} base={940} alturas={[620, 820]} cor="#040706" />
        <path d="M0 900 L0 860 Q260 830 520 870 L480 900 Z M1600 900 L1600 850 Q1380 840 1180 880 L1200 900 Z" fill="#030504" />
      </Camada>
    </>
  );
}

function CenaPortao({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#090b10" />
            <stop offset="0.55" stopColor="#1a1d27" />
            <stop offset="1" stopColor="#2c2a2c" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <g filter={`url(#${id}-desfoque-forte)`} opacity="0.75">
          <ellipse cx="300" cy="140" rx="380" ry="90" fill="#2a2e3a" />
          <ellipse cx="1100" cy="110" rx="460" ry="110" fill="#262a35" />
          <ellipse cx="760" cy="230" rx="420" ry="80" fill="#1f222c" />
        </g>
        <rect width={L} height={A} fill="#dfe8ff" className="cenario__relampago" />
      </Camada>
      <Camada profundidade={0.15}>
        <path d={serra(51, L, A, 600, 160, 10)} fill="#15161c" />
      </Camada>
      <Camada profundidade={0.3}>
        <DefinicoesComuns id={`${id}-m`} />
        <path d="M0 640 L0 330 L1600 330 L1600 640 Z" fill="#1b1a1d" />
        {Array.from({ length: 33 }, (_, i) => (
          <rect key={i} x={i * 50} y="300" width="30" height="34" fill="#1b1a1d" />
        ))}
        {Array.from({ length: 9 }, (_, linha) => (
          <path
            key={linha}
            d={`M0 ${360 + linha * 32} L1600 ${360 + linha * 32}`}
            stroke="#141316"
            strokeWidth="2"
            strokeDasharray={linha % 2 ? '70 6' : '40 6 70 6'}
          />
        ))}
        <path d={torre(140, 640, 170, 460, true)} fill="#161518" />
        <path d={torre(1290, 640, 170, 460, true)} fill="#161518" />
        <Tocha x={420} y={430} escala={0.9} id={`${id}-m`} />
        <Tocha x={1180} y={430} escala={0.9} id={`${id}-m`} />
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--baixa cenario__nevoa--fria" />
      <Camada profundidade={0.55}>
        <rect y="640" width={L} height="260" fill="#121114" />
        <path d="M0 700 L1600 700" stroke="#1d1c20" strokeWidth="3" />
        {Array.from({ length: 14 }, (_, i) => (
          <ellipse key={i} cx={80 + i * 115} cy={760 + (i % 3) * 40} rx={40 + (i % 4) * 12} ry="5" fill="#5f6c80" opacity="0.18" />
        ))}
      </Camada>
    </>
  );
}

function CenaCovil({ id }: { id: string }) {
  const estalactites = useMemo(() => {
    const r = aleatorioComSemente(61);
    return Array.from({ length: 26 }, (_, i) => {
      const x = (i / 26) * L + r() * 40;
      const comprimento = 60 + r() * 220;
      const largura = 26 + r() * 40;
      return `M${x} 0 L${x + largura / 2} ${comprimento} L${x + largura} 0 Z`;
    }).join(' ');
  }, []);
  const fissuras = useMemo(() => {
    const r = aleatorioComSemente(62);
    return Array.from({ length: 7 }, () => {
      let x = r() * L;
      let y = 720 + r() * 160;
      let caminho = `M${x.toFixed(0)} ${y.toFixed(0)}`;
      for (let i = 0; i < 6; i++) {
        x += 30 + r() * 60;
        y += (r() - 0.5) * 40;
        caminho += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
      }
      return caminho;
    });
  }, []);
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <radialGradient id={`${id}-brilho`} cx="0.5" cy="0.62" r="0.65">
            <stop offset="0" stopColor="#7a1f2a" />
            <stop offset="0.45" stopColor="#2b0c18" />
            <stop offset="1" stopColor="#07040a" />
          </radialGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-brilho)`} />
        <ellipse cx="800" cy="520" rx="420" ry="260" fill="#b0303a" opacity="0.18" filter={`url(#${id}-desfoque-forte)`} className="cenario__pulso" />
      </Camada>
      <Camada profundidade={0.15}>
        <path d={serra(63, L, A, 620, 260, 12)} fill="#14070f" />
        <path d="M600 620 Q800 380 1000 620 Z" fill="#0b0409" />
      </Camada>
      <Camada profundidade={0.3}>
        <path d={estalactites} fill="#0e0610" />
        {[180, 520, 1120, 1420].map((x, i) => (
          <path
            key={x}
            d={`M${x} 0 C${x + 40} 160 ${x - 60} 260 ${x + 20} ${380 + i * 30}`}
            stroke="#2a0f1e"
            strokeWidth={10 - i}
            fill="none"
            className="cenario__cipo"
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--media cenario__nevoa--rubra" />
      <Camada profundidade={0.5}>
        <rect y="700" width={L} height="200" fill="#0c050a" />
        {fissuras.map((caminho, i) => (
          <g key={i}>
            <path d={caminho} stroke="#ff5a2a" strokeWidth="8" fill="none" opacity="0.35" filter={`url(#${id}-desfoque)`} className="cenario__fissura" />
            <path d={caminho} stroke="#ffb347" strokeWidth="2" fill="none" opacity="0.8" />
          </g>
        ))}
      </Camada>
      <Camada profundidade={0.85}>
        <path d="M0 900 L0 640 L60 700 L110 600 L170 760 L240 900 Z M1600 900 L1600 620 L1530 700 L1480 590 L1410 780 L1360 900 Z" fill="#050206" />
      </Camada>
    </>
  );
}

function CenaAcampamento({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#04050a" />
            <stop offset="0.7" stopColor="#0f1220" />
            <stop offset="1" stopColor="#1c1617" />
          </linearGradient>
          <radialGradient id={`${id}-fogueira`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#ff7a2f" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ff7a2f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <CeuEstrelado semente={71} quantidade={220} altura={560} />
        <path d="M0 260 Q400 180 800 240 T1600 200" stroke="#c7b8ff" strokeWidth="60" opacity="0.04" fill="none" filter={`url(#${id}-desfoque-forte)`} />
      </Camada>
      <Camada profundidade={0.12}>
        <path d={serra(72, L, A, 640, 150, 11)} fill="#0e101a" />
        <Castelo x={1250} y={600} escala={0.45} cor="#0a0b12" semente={73} />
      </Camada>
      <Camada profundidade={0.3}>
        <Floresta semente={74} quantidade={26} base={700} alturas={[160, 280]} cor="#090b10" />
      </Camada>
      <Camada profundidade={0.55}>
        <rect y="690" width={L} height="210" fill="#0d0a0a" />
        <ellipse cx="800" cy="760" rx="520" ry="180" fill={`url(#${id}-fogueira)`} className="cenario__luz-tocha" />
        <path d="M250 760 L380 560 L510 760 Z" fill="#2c1e18" />
        <path d="M380 560 L380 760 M330 760 L380 640 L430 760" stroke="#120c0a" strokeWidth="5" fill="none" />
        <path d="M1110 770 L1230 590 L1350 770 Z" fill="#2a1c17" />
        <path d="M1230 590 L1230 770" stroke="#120c0a" strokeWidth="5" />
        <g transform="translate(800 770)">
          <path d="M-70 10 L70 -6 M-60 -8 L66 12" stroke="#3a2618" strokeWidth="16" strokeLinecap="round" />
          <g className="cenario__chama" style={{ transformOrigin: '0 0' }}>
            <path d="M0 -150 C34 -100 50 -60 34 -24 C22 0 -22 0 -34 -24 C-50 -60 -26 -100 0 -150 Z" fill="#ff6a1f" />
            <path d="M6 -112 C26 -80 32 -52 20 -26 C12 -12 -12 -12 -18 -26 C-28 -52 -14 -82 6 -112 Z" fill="#ffb347" />
            <path d="M2 -74 C12 -56 14 -40 8 -26 C4 -20 -4 -20 -8 -26 C-12 -40 -6 -56 2 -74 Z" fill="#fff3c4" />
          </g>
        </g>
      </Camada>
      <Camada profundidade={0.9}>
        <path d="M0 900 L0 840 Q240 820 460 860 L420 900 Z M1600 900 L1600 830 Q1360 820 1150 870 L1180 900 Z" fill="#050404" />
      </Camada>
    </>
  );
}

function CenaVitoria({ id }: { id: string }) {
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b1530" />
            <stop offset="0.4" stopColor="#7a3a3a" />
            <stop offset="0.7" stopColor="#e09a52" />
            <stop offset="1" stopColor="#ffe2a0" />
          </linearGradient>
          <radialGradient id={`${id}-sol`}>
            <stop offset="0" stopColor="#fff6dc" />
            <stop offset="0.3" stopColor="#ffd27a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <g className="cenario__raios-sol" style={{ transformOrigin: '800px 640px' }}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M800 640 L780 -200 L820 -200 Z" fill="#fff0c2" opacity="0.08" transform={`rotate(${i * 22.5 - 90} 800 640)`} />
          ))}
        </g>
        <circle cx="800" cy="640" r="360" fill={`url(#${id}-sol)`} />
        <g filter={`url(#${id}-desfoque-forte)`} opacity="0.6">
          <ellipse cx="300" cy="330" rx="300" ry="50" fill="#f1b07a" />
          <ellipse cx="1260" cy="290" rx="340" ry="60" fill="#e9a072" />
        </g>
      </Camada>
      <Camada profundidade={0.2}>
        <path d={serra(81, L, A, 700, 120, 10)} fill="#5a2e2e" opacity="0.8" />
        <Castelo x={800} y={680} escala={1} cor="#2a1517" semente={21} comLuzes={false} />
      </Camada>
      <Camada profundidade={0.5}>
        <path d={colinas(82, L, A, 790, 60, 5)} fill="#1e1012" />
      </Camada>
    </>
  );
}

function CenaDerrota({ id }: { id: string }) {
  const espadas = useMemo(() => {
    const r = aleatorioComSemente(91);
    return Array.from({ length: 9 }, (_, i) => ({ x: 80 + i * 180 + r() * 60, y: 800 + r() * 50, angulo: (r() - 0.5) * 40, escala: 0.7 + r() * 0.6 }));
  }, []);
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#060404" />
            <stop offset="0.55" stopColor="#2a0a0c" />
            <stop offset="1" stopColor="#4a1410" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-ceu)`} />
        <circle cx="800" cy="300" r="110" fill="#7a1b16" opacity="0.6" filter={`url(#${id}-desfoque-forte)`} />
        <circle cx="800" cy="300" r="62" fill="#5a120f" />
      </Camada>
      <Camada profundidade={0.2}>
        <path d={serra(92, L, A, 680, 140, 12)} fill="#140606" />
        <Castelo x={800} y={650} escala={0.8} cor="#0e0404" semente={93} comLuzes={false} />
      </Camada>
      <div className="cenario__nevoa cenario__nevoa--media cenario__nevoa--cinza" />
      <Camada profundidade={0.55}>
        <rect y="760" width={L} height="140" fill="#0a0404" />
        {espadas.map((espada, i) => (
          <g key={i} transform={`translate(${espada.x} ${espada.y}) rotate(${espada.angulo}) scale(${espada.escala})`}>
            <path d="M-4 0 L-4 -110 L0 -124 L4 -110 L4 0 Z" fill="#2a2420" />
            <path d="M-22 -10 L22 -10 L22 -4 L-22 -4 Z M-3 -4 L3 -4 L3 22 L-3 22 Z" fill="#1a1412" />
          </g>
        ))}
      </Camada>
    </>
  );
}

function CenaLaboratorio({ id }: { id: string }) {
  const livros = useMemo(() => {
    const r = aleatorioComSemente(101);
    const cores = ['#4a1a1c', '#2c3a4a', '#3a2a18', '#24301e', '#5e1a20', '#3a2440'];
    const prateleiras: { x: number; y: number; l: number; a: number; cor: string }[] = [];
    for (const lado of [0, 1]) {
      for (let p = 0; p < 6; p++) {
        let x = lado === 0 ? 40 : 1220;
        const fim = x + 340;
        while (x < fim) {
          const l = 12 + r() * 16;
          const a = 70 + r() * 40;
          prateleiras.push({ x, y: 150 + p * 120 - a, l, a, cor: cores[Math.floor(r() * cores.length)]! });
          x += l + 2;
        }
      }
    }
    return prateleiras;
  }, []);
  return (
    <>
      <Camada profundidade={0}>
        <DefinicoesComuns id={id} />
        <defs>
          <linearGradient id={`${id}-sala`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c0907" />
            <stop offset="1" stopColor="#1f1610" />
          </linearGradient>
        </defs>
        <rect width={L} height={A} fill={`url(#${id}-sala)`} />
        <path d="M640 620 L640 260 Q800 110 960 260 L960 620 Z" fill="#20283a" opacity="0.55" />
        <path d="M640 620 L640 260 Q800 110 960 260 L960 620 Z M800 150 L800 620 M640 400 L960 400" fill="none" stroke="#0e0b09" strokeWidth="10" />
        <RaiosDeLuz cor="#d6dcff" x={650} opacidade={0.05} />
      </Camada>
      <Camada profundidade={0.25}>
        <rect x="20" y="0" width="390" height="900" fill="#140e0a" />
        <rect x="1190" y="0" width="390" height="900" fill="#140e0a" />
        {livros.map((livro, i) => (
          <rect key={i} x={livro.x} y={livro.y} width={livro.l} height={livro.a} fill={livro.cor} stroke="#0a0705" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }, (_, p) => (
          <g key={p}>
            <rect x="30" y={150 + p * 120} width="370" height="10" fill="#2a1d14" />
            <rect x="1200" y={150 + p * 120} width="370" height="10" fill="#2a1d14" />
          </g>
        ))}
      </Camada>
      <Camada profundidade={0.5}>
        <DefinicoesComuns id={`${id}-p`} />
        <rect y="780" width={L} height="120" fill="#0a0705" />
        <Tocha x={520} y={700} escala={0.7} id={`${id}-p`} />
        <Tocha x={1080} y={700} escala={0.7} id={`${id}-p`} />
      </Camada>
    </>
  );
}

const CENAS: Readonly<Record<TipoDeCenario, (props: { id: string }) => ReactElement>> = {
  menu: CenaMenu,
  selecao: CenaSelecao,
  'floresta-sombria': CenaFloresta,
  'portao-da-cidadela': CenaPortao,
  'covil-do-demogorgon': CenaCovil,
  acampamento: CenaAcampamento,
  vitoria: CenaVitoria,
  derrota: CenaDerrota,
  laboratorio: CenaLaboratorio,
};

/**
 * Cenário atmosférico em camadas, com paralaxe ao mover o ponteiro, névoa
 * animada, luzes cintilantes e partículas ambientes específicas.
 */
export const Cenario = memo(function Cenario({ tipo, particulas = true }: { tipo: TipoDeCenario; particulas?: boolean }) {
  const id = useId().replace(/:/g, '');
  const raiz = useRef<HTMLDivElement>(null);
  const reduzido = useMovimentoReduzido();
  const Cena = CENAS[tipo];

  useEffect(() => {
    const elemento = raiz.current;
    if (!elemento || reduzido) {
      elemento?.style.setProperty('--mx', '0');
      elemento?.style.setProperty('--my', '0');
      return;
    }
    let quadro = 0;
    const mover = (evento: PointerEvent) => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        elemento.style.setProperty('--mx', ((evento.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        elemento.style.setProperty('--my', ((evento.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener('pointermove', mover);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('pointermove', mover);
    };
  }, [reduzido]);

  return (
    <div ref={raiz} className={`cenario cenario--${tipo}`} aria-hidden="true">
      <Cena id={id} />
      {particulas && <CanvasDeParticulas ambiente={AMBIENTES[tipo]} className="cenario__particulas" />}
      <div className="cenario__vinheta" />
    </div>
  );
});
