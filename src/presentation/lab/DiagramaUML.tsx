import { useEffect, useId, useMemo, useState } from 'react';
import { useI18n } from '../store/ContextoDoJogo';
import { obterBlocosDoDiagrama } from './trechos';

const TEMA = {
  theme: 'base' as const,
  themeVariables: {
    background: '#120e0c',
    primaryColor: '#221a15',
    primaryTextColor: '#ecdfc4',
    primaryBorderColor: '#c9a25a',
    lineColor: '#c9a25a',
    secondaryColor: '#1a1411',
    tertiaryColor: '#1a1411',
    fontFamily: 'EB Garamond, Georgia, serif',
    fontSize: '15px',
  },
};

/** Largura natural informada pelo Mermaid (style="max-width: Npx"). */
function larguraNatural(svg: string): number {
  const correspondencia = svg.match(/max-width:\s*([\d.]+)px/);
  return correspondencia ? Number(correspondencia[1]) : 1200;
}

/** Renderiza os diagramas Mermaid de docs/DIAGRAMA_UML.md (carregamento sob demanda). */
export function DiagramaUML() {
  const { t } = useI18n();
  const blocos = useMemo(() => obterBlocosDoDiagrama(), []);
  const [indice, definirIndice] = useState(0);
  const [svg, definirSvg] = useState<string | null>(null);
  const [zoom, definirZoom] = useState(0.8);
  const [erro, definirErro] = useState<string | null>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    let ativo = true;
    definirSvg(null);
    definirErro(null);
    void import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', ...TEMA });
        const { svg: desenho } = await mermaid.render(`uml-${id}-${indice}`, blocos[indice] ?? '');
        if (ativo) definirSvg(desenho);
      })
      .catch((falha: unknown) => ativo && definirErro(falha instanceof Error ? falha.message : String(falha)));
    return () => {
      ativo = false;
    };
  }, [indice, id, blocos]);

  return (
    <div className="diagrama">
      <div className="abas" role="tablist">
        {blocos.map((_, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === indice} className={i === indice ? 'aba aba--ativa' : 'aba'} onClick={() => definirIndice(i)}>
            {i + 1}. {t(`lab.uml.tab${i + 1}`)}
          </button>
        ))}
        <span className="diagrama__zoom">
          {[0.6, 0.8, 1, 1.3].map((nivel) => (
            <button key={nivel} type="button" className={nivel === zoom ? 'aba aba--ativa' : 'aba'} onClick={() => definirZoom(nivel)} aria-pressed={nivel === zoom}>
              {Math.round(nivel * 100)}%
            </button>
          ))}
        </span>
      </div>
      <div className="diagrama__area">
        {erro ? (
          <p className="diagrama__erro">{t('lab.diagramError', erro)}</p>
        ) : svg ? (
          // O SVG é produzido pelo Mermaid em modo "strict" a partir de um arquivo do próprio projeto.
          <div className="diagrama__svg" style={{ width: `${larguraNatural(svg) * zoom}px` }} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <p className="diagrama__carregando">{t('lab.diagramLoading')}</p>
        )}
      </div>
    </div>
  );
}
