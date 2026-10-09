import { memo, useMemo } from 'react';

type TipoDeToken = 'comentario' | 'texto' | 'palavra' | 'tipo' | 'numero' | 'funcao' | 'pontuacao' | 'simples';

const PALAVRAS = new Set(
  (
    'abstract as async await break case catch class const constructor continue default do else export extends false finally for from ' +
    'function get if implements import in instanceof interface let new null of private protected public readonly return set static ' +
    'super switch this throw true try type typeof undefined void while yield keyof satisfies override'
  ).split(' '),
);

const PADRAO =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(\s*\()?|([{}()[\];,.<>:=+\-*/!?&|]+)/g;

/** Realce sintático leve para TypeScript (sem dependências externas). */
function tokenizar(codigo: string): { tipo: TipoDeToken; texto: string }[] {
  const tokens: { tipo: TipoDeToken; texto: string }[] = [];
  let ultimo = 0;
  for (const m of codigo.matchAll(PADRAO)) {
    if (m.index! > ultimo) tokens.push({ tipo: 'simples', texto: codigo.slice(ultimo, m.index) });
    if (m[1]) tokens.push({ tipo: 'comentario', texto: m[1] });
    else if (m[2]) tokens.push({ tipo: 'texto', texto: m[2] });
    else if (m[3]) tokens.push({ tipo: 'numero', texto: m[3] });
    else if (m[4]) {
      const palavra = m[4];
      const tipo: TipoDeToken = PALAVRAS.has(palavra) ? 'palavra' : m[5] ? 'funcao' : /^[A-Z]/.test(palavra) ? 'tipo' : 'simples';
      tokens.push({ tipo, texto: palavra });
      if (m[5]) tokens.push({ tipo: 'pontuacao', texto: m[5] });
    } else if (m[6]) tokens.push({ tipo: 'pontuacao', texto: m[6] });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < codigo.length) tokens.push({ tipo: 'simples', texto: codigo.slice(ultimo) });
  return tokens;
}

export const BlocoDeCodigo = memo(function BlocoDeCodigo({ codigo, arquivo }: { codigo: string; arquivo: string }) {
  const tokens = useMemo(() => tokenizar(codigo), [codigo]);
  const linhas = codigo.split('\n').length;
  return (
    <figure className="codigo">
      <figcaption className="codigo__arquivo">{arquivo}</figcaption>
      <div className="codigo__corpo">
        <pre className="codigo__numeros" aria-hidden="true">
          {Array.from({ length: linhas }, (_, i) => i + 1).join('\n')}
        </pre>
        <pre className="codigo__texto">
          <code>
            {tokens.map((token, i) =>
              token.tipo === 'simples' ? (
                token.texto
              ) : (
                <span key={i} className={`tk-${token.tipo}`}>
                  {token.texto}
                </span>
              ),
            )}
          </code>
        </pre>
      </div>
    </figure>
  );
});
