/**
 * Geração procedural determinística de formas para os cenários (serras,
 * árvores, castelos, estrelas). Uma semente fixa garante que o cenário seja
 * sempre o mesmo, como uma ilustração, mas sem arquivos de imagem.
 */

export function aleatorioComSemente(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** Serra de montanhas: picos irregulares entre baseY e baseY - amplitude. */
export function serra(semente: number, largura: number, altura: number, baseY: number, amplitude: number, passos: number): string {
  const r = aleatorioComSemente(semente);
  const pontos: string[] = [`M0 ${altura}`, `L0 ${f(baseY - r() * amplitude * 0.5)}`];
  const passo = largura / passos;
  for (let i = 1; i <= passos; i++) {
    const x = i * passo;
    const pico = baseY - (0.25 + r() * 0.75) * amplitude;
    const vale = baseY - r() * amplitude * 0.35;
    pontos.push(`L${f(x - passo / 2)} ${f(pico)}`, `L${f(x)} ${f(vale)}`);
  }
  pontos.push(`L${largura} ${altura}`, 'Z');
  return pontos.join(' ');
}

/** Colinas suaves com curvas quadráticas. */
export function colinas(semente: number, largura: number, altura: number, baseY: number, amplitude: number, passos: number): string {
  const r = aleatorioComSemente(semente);
  const passo = largura / passos;
  let caminho = `M0 ${altura} L0 ${f(baseY)}`;
  for (let i = 0; i < passos; i++) {
    const x0 = i * passo;
    const topo = baseY - r() * amplitude;
    caminho += ` Q${f(x0 + passo / 2)} ${f(topo)} ${f(x0 + passo)} ${f(baseY - r() * amplitude * 0.3)}`;
  }
  return `${caminho} L${largura} ${altura} Z`;
}

/** Pinheiro estilizado (silhueta), com base em (x, y). */
export function pinheiro(x: number, y: number, altura: number, largura: number, r: () => number): string {
  const camadas = 4 + Math.floor(r() * 3);
  let caminho = `M${f(x - largura * 0.06)} ${f(y)} L${f(x - largura * 0.06)} ${f(y - altura * 0.18)} L${f(x + largura * 0.06)} ${f(
    y - altura * 0.18,
  )} L${f(x + largura * 0.06)} ${f(y)} Z`;
  for (let i = 0; i < camadas; i++) {
    const base = y - altura * 0.12 - (i * altura * 0.82) / camadas;
    const meia = (largura / 2) * (1 - i / (camadas + 0.6)) * (0.85 + r() * 0.3);
    const topo = base - (altura * 0.95) / camadas - altura * 0.08;
    caminho += ` M${f(x - meia)} ${f(base)} L${f(x - meia * 0.35)} ${f(base - (base - topo) * 0.45)} L${f(x)} ${f(topo)} L${f(
      x + meia * 0.35,
    )} ${f(base - (base - topo) * 0.45)} L${f(x + meia)} ${f(base)} Z`;
  }
  return caminho;
}

/** Árvore morta retorcida (galhos recursivos). */
export function arvoreMorta(x: number, y: number, altura: number, r: () => number): string {
  const galhos: string[] = [];
  const crescer = (x0: number, y0: number, angulo: number, comprimento: number, espessura: number, nivel: number) => {
    const x1 = x0 + Math.cos(angulo) * comprimento;
    const y1 = y0 + Math.sin(angulo) * comprimento;
    const nx = Math.cos(angulo + Math.PI / 2) * espessura;
    const ny = Math.sin(angulo + Math.PI / 2) * espessura;
    const fim = espessura * 0.55;
    const fx = Math.cos(angulo + Math.PI / 2) * fim;
    const fy = Math.sin(angulo + Math.PI / 2) * fim;
    galhos.push(
      `M${f(x0 - nx)} ${f(y0 - ny)} L${f(x1 - fx)} ${f(y1 - fy)} L${f(x1 + fx)} ${f(y1 + fy)} L${f(x0 + nx)} ${f(y0 + ny)} Z`,
    );
    if (nivel <= 0 || comprimento < 8) return;
    const filhos = 2 + (r() > 0.6 ? 1 : 0);
    for (let i = 0; i < filhos; i++) {
      crescer(x1, y1, angulo + (r() - 0.5) * 1.3, comprimento * (0.55 + r() * 0.2), fim, nivel - 1);
    }
  };
  crescer(x, y, -Math.PI / 2 + (r() - 0.5) * 0.2, altura * 0.42, altura * 0.035, 4);
  return galhos.join(' ');
}

/** Torre com ameias e telhado cônico opcional. */
export function torre(x: number, y: number, largura: number, altura: number, telhado: boolean): string {
  const topo = y - altura;
  const ameia = largura / 5;
  let caminho = `M${f(x)} ${f(y)} L${f(x)} ${f(topo)}`;
  if (telhado) {
    caminho += ` L${f(x - largura * 0.12)} ${f(topo)} L${f(x + largura / 2)} ${f(topo - altura * 0.45)} L${f(x + largura * 1.12)} ${f(
      topo,
    )} L${f(x + largura)} ${f(topo)}`;
  } else {
    for (let i = 0; i < 5; i++) {
      const xi = x + i * ameia;
      caminho += i % 2 === 0 ? ` L${f(xi)} ${f(topo - ameia)} L${f(xi + ameia)} ${f(topo - ameia)} L${f(xi + ameia)} ${f(topo)}` : ` L${f(xi + ameia)} ${f(topo)}`;
    }
  }
  return `${caminho} L${f(x + largura)} ${f(y)} Z`;
}

export interface Estrela {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly atraso: number;
}

export function estrelas(semente: number, quantidade: number, largura: number, alturaMaxima: number): Estrela[] {
  const r = aleatorioComSemente(semente);
  return Array.from({ length: quantidade }, () => ({
    x: r() * largura,
    y: r() * alturaMaxima,
    r: 0.4 + r() * 1.4,
    atraso: r() * 6,
  }));
}

/** Janelas acesas em uma torre (pequenos retângulos). */
export function janelas(semente: number, x: number, y: number, largura: number, altura: number, quantidade: number) {
  const r = aleatorioComSemente(semente);
  return Array.from({ length: quantidade }, () => ({
    x: x + largura * 0.2 + r() * largura * 0.6,
    y: y - altura * 0.15 - r() * altura * 0.7,
    l: 3 + r() * 3,
    a: 6 + r() * 5,
  }));
}
