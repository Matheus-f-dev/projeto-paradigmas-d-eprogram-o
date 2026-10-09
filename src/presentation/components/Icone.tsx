import type { SVGProps } from 'react';

/**
 * Conjunto de ícones vetoriais próprios (grade 24×24, traço de 1,6px), com
 * a mesma linguagem gráfica: lâminas, runas e metal gravado.
 */
const CAMINHOS = {
  espada: (
    <>
      <path d="M14.5 3.5 20.5 3.5 20.5 9.5 10 20" />
      <path d="M20.5 3.5 9 15" />
      <path d="M6.5 13.5l4 4M4 20l3.2-3.2M5.2 15.8l3 3" />
    </>
  ),
  espadasCruzadas: (
    <>
      <path d="M4 4l9.5 9.5M4 4h3.5l9 9M4 4v3.5l9 9" />
      <path d="M20 4l-9.5 9.5M20 4h-3.5l-3 3M20 4v3.5l-3 3" />
      <path d="M13 16.5l3.5-3.5M7.5 13l3.5 3.5M16 19l2-2 2.5 2.5-2 2zM8 19l-2-2-2.5 2.5 2 2z" />
    </>
  ),
  punho: (
    <>
      <path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V10M10 9V6.5a1.5 1.5 0 0 1 3 0V10M13 9.5V7a1.5 1.5 0 0 1 3 0v3.5" />
      <path d="M16 10a1.5 1.5 0 0 1 3 0v3.5c0 3.6-2.4 6.5-6 6.5h-1.2c-2.6 0-4.8-2-4.8-4.6V11a1.5 1.5 0 0 1 3 0v1.5" />
      <path d="M3 6l2 1M4 2.5l1.8 2.2M8.5 1.5v2.6" />
    </>
  ),
  chama: (
    <path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.3-5.2 3.6-7.6.4 1.6 1.3 2.7 2.4 3.3C11.2 7 12.6 4.6 15 3c-.4 2.9.8 5 2.2 6.9 1 1.4 1.8 2.9 1.8 4.9C19 18.3 16 21 12 21Z M12 21c-1.7 0-2.9-1.2-2.9-2.9 0-1.9 1.6-2.8 2.4-4.4.8 1.2 3.4 2.4 3.4 4.6 0 1.6-1.2 2.7-2.9 2.7Z" />
  ),
  flecha: (
    <>
      <path d="M4 20 18.5 5.5" />
      <path d="M14 4.5h5.5V10" />
      <path d="M4 20l1-4M4 20l4-1M6.5 17.5l-1-3.5M6.5 17.5l3.5 1" />
    </>
  ),
  arco: (
    <>
      <path d="M6 3c7 2 12 8 15 15" />
      <path d="M6 3l15 15" strokeDasharray="1.5 1.8" />
      <path d="M3 13l8-2M9 9l2 2-2 2" />
    </>
  ),
  cajado: (
    <>
      <path d="M8 21 15.5 8.5" />
      <circle cx="17" cy="6" r="3" />
      <path d="M17 1.5v1.2M21.5 6h-1.2M20.2 2.8l-.8.8M13.8 2.8l.8.8" />
    </>
  ),
  escudo: <path d="M12 3 19.5 6v5.4c0 4.6-3.2 8.3-7.5 9.6-4.3-1.3-7.5-5-7.5-9.6V6L12 3Z M12 3v18M4.5 11h15" />,
  coracao: (
    <path d="M12 20.3s-7.8-4.7-7.8-10.3a4.3 4.3 0 0 1 7.8-2.5 4.3 4.3 0 0 1 7.8 2.5c0 5.6-7.8 10.3-7.8 10.3Z" />
  ),
  gota: <path d="M12 3.2s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z M9.2 14.5a3 3 0 0 0 2.6 2.9" />,
  aljava: (
    <>
      <path d="M8 9h8l-1.2 12H9.2L8 9Z" />
      <path d="M10 9V3.5M12 9V2.5M14 9V3.5M9 3.5l1-1.4 1 1.4M13 3.5l1-1.4 1 1.4M11 2.5l1-1.2 1 1.2" />
    </>
  ),
  pocao: (
    <>
      <path d="M10 3h4M10.5 3v4.2L6.6 13a5.7 5.7 0 1 0 10.8 0L13.5 7.2V3" />
      <path d="M7.6 14.5h8.8" />
      <circle cx="10.5" cy="17" r=".8" />
      <circle cx="13.6" cy="16.2" r=".6" />
    </>
  ),
  mochila: (
    <>
      <path d="M7 8a5 5 0 0 1 10 0v12H7V8Z" />
      <path d="M9.5 5.2V4a2.5 2.5 0 0 1 5 0v1.2M7 13h10M10.5 13v2.5h3V13" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.8M12 18.7v2.8M21.5 12h-2.8M5.3 12H2.5M18.7 5.3l-2 2M7.3 16.7l-2 2M18.7 18.7l-2-2M7.3 7.3l-2-2" />
      <circle cx="12" cy="12" r="6.6" />
    </>
  ),
  livro: (
    <>
      <path d="M4 5.2C6.8 4.2 9.6 4.4 12 6c2.4-1.6 5.2-1.8 8-.8V19c-2.8-1-5.6-.8-8 .8-2.4-1.6-5.2-1.8-8-.8V5.2Z" />
      <path d="M12 6v13.8M6.5 9h3M6.5 12h3M14.5 9h3M14.5 12h3" />
    </>
  ),
  pergaminho: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v11" />
      <path d="M6 4a2 2 0 0 0-2 2v1h3M6 4a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1H12v1a2 2 0 0 1-2 2" />
      <path d="M11 8.5h5M11 11.5h5M11 14.5h3" />
    </>
  ),
  porta: (
    <>
      <path d="M6 21V8a6 6 0 0 1 12 0v13" />
      <path d="M3.5 21h17M12 3v18M14 13.5h.01M10 13.5h.01" />
    </>
  ),
  coroa: <path d="M4 18h16M4.5 18 3 7.5l5 4L12 4l4 7.5 5-4L19.5 18M8 15h.01M12 15h.01M16 15h.01" />,
  caveira: (
    <>
      <path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.5 3 5.6V19h9v-2.9c1.7-1.1 3-3 3-5.6A7.5 7.5 0 0 0 12 3Z" />
      <circle cx="9" cy="11" r="1.8" />
      <circle cx="15" cy="11" r="1.8" />
      <path d="M11.2 14.8 12 13.4l.8 1.4M10 19v2M14 19v2" />
    </>
  ),
  bau: (
    <>
      <path d="M3.5 10a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v9h-17v-9Z" />
      <path d="M3.5 11h17M10.5 10h3v3.5h-3zM7 5.5V19M17 5.5V19" />
    </>
  ),
  voltar: <path d="M10 6 4 12l6 6M4.5 12H20" />,
  avancar: <path d="M14 6l6 6-6 6M19.5 12H4" />,
  selo: (
    <>
      <circle cx="12" cy="10" r="6" />
      <path d="M9 15.2 7.5 21l4.5-2.2 4.5 2.2-1.5-5.8M12 7v6M9 10h6" />
    </>
  ),
  mapa: (
    <>
      <path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5V6.5Z" />
      <path d="M9 4v13.5M15 6.5V20" />
      <path d="M11.2 10.6l2.4 2.4M13.6 10.6l-2.4 2.4" />
    </>
  ),
  ampulheta: (
    <>
      <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
      <path d="M9.5 18.5h5" />
    </>
  ),
  alvo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M3.2 12h17.6M12 3.2c2.6 2.6 3.6 5.6 3.6 8.8s-1 6.2-3.6 8.8M12 3.2C9.4 5.8 8.4 8.8 8.4 12s1 6.2 3.6 8.8" />
    </>
  ),
  som: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  estrela: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" />,
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  raio: <path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6l1.5-8Z" />,
  runa: (
    <>
      <path d="M12 2.5v19M7 6.5l10 5M17 6.5l-10 5M8 17l4 2.5 4-2.5" />
    </>
  ),
  armadura: (
    <>
      <path d="M8 3.5 4 6v4.5l2.5 1V20h11v-8.5l2.5-1V6l-4-2.5c-.6 1.8-2.2 3-4 3s-3.4-1.2-4-3Z" />
      <path d="M9 12h6M9 15.5h6" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  mais: <path d="M12 5v14M5 12h14" />,
  dado: (
    <>
      <path d="M12 2.5 20.5 7.2v9.6L12 21.5 3.5 16.8V7.2L12 2.5Z" />
      <path d="M3.5 7.2 12 12l8.5-4.8M12 12v9.5" />
    </>
  ),
  codigo: <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />,
  diagrama: (
    <>
      <rect x="8.5" y="2.5" width="7" height="5" rx="1" />
      <rect x="2.5" y="16.5" width="7" height="5" rx="1" />
      <rect x="14.5" y="16.5" width="7" height="5" rx="1" />
      <path d="M12 7.5v4.5M6 16.5V12h12v4.5" />
    </>
  ),
  camadas: <path d="M12 3 21 8l-9 5-9-5 9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5" />,
  teste: (
    <>
      <path d="M9 3h6M10 3v6.5L4.8 18.5A1.7 1.7 0 0 0 6.3 21h11.4a1.7 1.7 0 0 0 1.5-2.5L14 9.5V3" />
      <path d="M7.5 14.5h9" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5-12-7.5Z" />,
} as const;

export type NomeDoIcone = keyof typeof CAMINHOS;

interface PropriedadesDoIcone extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  readonly nome: NomeDoIcone;
  readonly tamanho?: number | string;
  readonly titulo?: string;
}

export function Icone({ nome, tamanho = 22, titulo, className, ...resto }: PropriedadesDoIcone) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['icone', className].filter(Boolean).join(' ')}
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
      {...resto}
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
