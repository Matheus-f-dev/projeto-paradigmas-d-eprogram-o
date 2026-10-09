/**
 * Extrai do código-fonte o trecho entre `// #region lab:<nome>` e o
 * `// #endregion` correspondente, removendo a indentação comum.
 */
export function extrairRegiao(fonte: string, regiao: string): string | null {
  const linhas = fonte.split(/\r?\n/);
  const inicio = linhas.findIndex((linha) => linha.trim() === `// #region lab:${regiao}`);
  if (inicio < 0) return null;
  let profundidade = 0;
  let fim = -1;
  for (let i = inicio + 1; i < linhas.length; i++) {
    const texto = linhas[i]!.trim();
    if (texto.startsWith('// #region')) profundidade++;
    if (texto === '// #endregion') {
      if (profundidade === 0) {
        fim = i;
        break;
      }
      profundidade--;
    }
  }
  if (fim < 0) return null;
  const trecho = linhas.slice(inicio + 1, fim).filter((linha) => !/^\s*\/\/ #(end)?region/.test(linha));
  const indentacao = Math.min(...trecho.filter((linha) => linha.trim()).map((linha) => linha.match(/^\s*/)![0].length));
  return trecho.map((linha) => linha.slice(Number.isFinite(indentacao) ? indentacao : 0)).join('\n').trim();
}

/** Blocos ```mermaid de um documento Markdown. */
export function extrairBlocosMermaid(markdown: string): string[] {
  return [...markdown.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map((correspondencia) => correspondencia[1]!.trim());
}
