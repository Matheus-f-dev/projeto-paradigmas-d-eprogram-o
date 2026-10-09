/**
 * Sistema de partículas em Canvas 2D.
 *
 * Um único laço requestAnimationFrame atualiza e desenha milhares de
 * partículas sem criar componentes React. As partículas vivem em um pool
 * reaproveitado (sem alocação por quadro) e há um teto configurável para
 * preservar o desempenho. Além das partículas, o sistema desenha "efeitos"
 * vetoriais: ondas de choque, círculos mágicos, cortes, clarões e projéteis.
 */

export type Mistura = 'source-over' | 'lighter';

export interface ConfiguracaoDeEmissao {
  /** Quantidade base (multiplicada pela intensidade global). */
  readonly quantidade: number;
  readonly cores: readonly string[];
  readonly velocidade: readonly [number, number];
  /** Direção central em radianos e abertura do cone. */
  readonly angulo?: number;
  readonly abertura?: number;
  readonly vida: readonly [number, number];
  readonly tamanho: readonly [number, number];
  readonly gravidade?: number;
  readonly arrasto?: number;
  readonly encolher?: boolean;
  readonly mistura?: Mistura;
  readonly forma?: 'brilho' | 'faisca' | 'quadrado' | 'fumaca';
  readonly raioDeOrigem?: number;
  readonly cintilar?: boolean;
  /** Vento horizontal aplicado continuamente. */
  readonly vento?: number;
}

interface Particula {
  ativa: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaTotal: number;
  tamanho: number;
  cor: string;
  gravidade: number;
  arrasto: number;
  encolher: boolean;
  mistura: Mistura;
  forma: 'brilho' | 'faisca' | 'quadrado' | 'fumaca';
  cintilar: boolean;
  vento: number;
  rotacao: number;
}

type Efeito =
  | { tipo: 'onda'; x: number; y: number; raio: number; vida: number; total: number; cor: string; espessura: number }
  | { tipo: 'clarao'; x: number; y: number; raio: number; vida: number; total: number; cor: string }
  | { tipo: 'circulo'; x: number; y: number; raio: number; vida: number; total: number; cor: string; giro: number }
  | {
      tipo: 'corte';
      x: number;
      y: number;
      raio: number;
      vida: number;
      total: number;
      cor: string;
      inicio: number;
      fim: number;
      espessura: number;
    }
  | {
      tipo: 'projetil';
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      vida: number;
      total: number;
      arco: number;
      rastro: ConfiguracaoDeEmissao;
      nucleo: string;
      raio: number;
      x: number;
      y: number;
    };

export interface EmissorAmbiente {
  readonly config: ConfiguracaoDeEmissao;
  /** Partículas por segundo. */
  readonly taxa: number;
  /** Região de nascimento, em frações da tela (0–1). */
  readonly regiao: { readonly x: readonly [number, number]; readonly y: readonly [number, number] };
}

const aleatorio = (min: number, max: number) => min + Math.random() * (max - min);
const escolher = <T,>(itens: readonly T[]): T => itens[Math.floor(Math.random() * itens.length)]!;

export class ParticleSystem {
  private readonly contexto: CanvasRenderingContext2D;
  private readonly pool: Particula[] = [];
  private readonly efeitos: Efeito[] = [];
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private ambientes: EmissorAmbiente[] = [];
  private quadro = 0;
  private ultimoTempo = 0;
  private largura = 0;
  private altura = 0;
  private escalaDePixel = 1;
  private intensidade = 1;
  private limite: number;
  private ativo = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    limite = 1500,
  ) {
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Canvas 2D indisponível.');
    this.contexto = contexto;
    this.limite = limite;
  }

  configurar(opcoes: { intensidade: number; limite: number }): void {
    this.intensidade = opcoes.intensidade;
    this.limite = opcoes.limite;
  }

  definirAmbiente(emissores: readonly EmissorAmbiente[]): void {
    this.ambientes = [...emissores];
  }

  redimensionar(largura: number, altura: number, escalaDePixel = Math.min(2, window.devicePixelRatio || 1)): void {
    this.largura = largura;
    this.altura = altura;
    this.escalaDePixel = escalaDePixel;
    this.canvas.width = Math.round(largura * escalaDePixel);
    this.canvas.height = Math.round(altura * escalaDePixel);
    this.canvas.style.width = `${largura}px`;
    this.canvas.style.height = `${altura}px`;
  }

  iniciar(): void {
    if (this.ativo) return;
    this.ativo = true;
    this.ultimoTempo = performance.now();
    const laco = (agora: number) => {
      if (!this.ativo) return;
      const dt = Math.min(0.05, (agora - this.ultimoTempo) / 1000);
      this.ultimoTempo = agora;
      this.atualizar(dt);
      this.desenhar();
      this.quadro = requestAnimationFrame(laco);
    };
    this.quadro = requestAnimationFrame(laco);
  }

  parar(): void {
    this.ativo = false;
    cancelAnimationFrame(this.quadro);
  }

  limpar(): void {
    this.pool.forEach((particula) => (particula.ativa = false));
    this.efeitos.length = 0;
  }

  quantidadeAtiva(): number {
    return this.pool.reduce((total, particula) => total + (particula.ativa ? 1 : 0), 0);
  }

  // ------------------------------------------------------------- emissão

  emitir(x: number, y: number, config: ConfiguracaoDeEmissao, escala = 1): void {
    const quantidade = Math.round(config.quantidade * this.intensidade * escala);
    for (let i = 0; i < quantidade; i++) {
      const particula = this.obterParticula();
      if (!particula) return;
      const angulo = (config.angulo ?? -Math.PI / 2) + aleatorio(-(config.abertura ?? Math.PI), config.abertura ?? Math.PI);
      const velocidade = aleatorio(config.velocidade[0], config.velocidade[1]);
      const raio = config.raioDeOrigem ?? 0;
      const desvio = aleatorio(0, Math.PI * 2);
      particula.ativa = true;
      particula.x = x + Math.cos(desvio) * aleatorio(0, raio);
      particula.y = y + Math.sin(desvio) * aleatorio(0, raio);
      particula.vx = Math.cos(angulo) * velocidade;
      particula.vy = Math.sin(angulo) * velocidade;
      particula.vidaTotal = aleatorio(config.vida[0], config.vida[1]);
      particula.vida = particula.vidaTotal;
      particula.tamanho = aleatorio(config.tamanho[0], config.tamanho[1]);
      particula.cor = escolher(config.cores);
      particula.gravidade = config.gravidade ?? 0;
      particula.arrasto = config.arrasto ?? 0.9;
      particula.encolher = config.encolher ?? true;
      particula.mistura = config.mistura ?? 'lighter';
      particula.forma = config.forma ?? 'brilho';
      particula.cintilar = config.cintilar ?? false;
      particula.vento = config.vento ?? 0;
      particula.rotacao = aleatorio(0, Math.PI * 2);
    }
  }

  onda(x: number, y: number, raio: number, cor: string, duracao = 0.5, espessura = 6): void {
    this.efeitos.push({ tipo: 'onda', x, y, raio, vida: duracao, total: duracao, cor, espessura });
  }

  clarao(x: number, y: number, raio: number, cor: string, duracao = 0.35): void {
    this.efeitos.push({ tipo: 'clarao', x, y, raio, vida: duracao, total: duracao, cor });
  }

  circuloMagico(x: number, y: number, raio: number, cor: string, duracao = 1): void {
    this.efeitos.push({ tipo: 'circulo', x, y, raio, vida: duracao, total: duracao, cor, giro: 0 });
  }

  corte(x: number, y: number, raio: number, cor: string, inicio: number, fim: number, duracao = 0.3, espessura = 10): void {
    this.efeitos.push({ tipo: 'corte', x, y, raio, vida: duracao, total: duracao, cor, inicio, fim, espessura });
  }

  projetil(
    origem: { x: number; y: number },
    destino: { x: number; y: number },
    opcoes: { duracao: number; arco: number; rastro: ConfiguracaoDeEmissao; nucleo: string; raio: number },
  ): void {
    this.efeitos.push({
      tipo: 'projetil',
      x0: origem.x,
      y0: origem.y,
      x1: destino.x,
      y1: destino.y,
      vida: opcoes.duracao,
      total: opcoes.duracao,
      arco: opcoes.arco,
      rastro: opcoes.rastro,
      nucleo: opcoes.nucleo,
      raio: opcoes.raio,
      x: origem.x,
      y: origem.y,
    });
  }

  // --------------------------------------------------------- simulação

  private obterParticula(): Particula | null {
    const livre = this.pool.find((particula) => !particula.ativa);
    if (livre) return livre;
    if (this.pool.length >= this.limite) return null;
    const nova: Particula = {
      ativa: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      vida: 0,
      vidaTotal: 1,
      tamanho: 1,
      cor: '#fff',
      gravidade: 0,
      arrasto: 1,
      encolher: true,
      mistura: 'lighter',
      forma: 'brilho',
      cintilar: false,
      vento: 0,
      rotacao: 0,
    };
    this.pool.push(nova);
    return nova;
  }

  private atualizar(dt: number): void {
    this.emitirAmbiente(dt);
    const arrastoPorQuadro = (arrasto: number) => Math.pow(arrasto, dt * 60);
    for (const p of this.pool) {
      if (!p.ativa) continue;
      p.vida -= dt;
      if (p.vida <= 0 || p.y > this.altura + 60 || p.x < -80 || p.x > this.largura + 80) {
        p.ativa = false;
        continue;
      }
      const fator = arrastoPorQuadro(p.arrasto);
      p.vx = p.vx * fator + p.vento * dt;
      p.vy = p.vy * fator + p.gravidade * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotacao += dt * 2;
    }
    for (let i = this.efeitos.length - 1; i >= 0; i--) {
      const efeito = this.efeitos[i]!;
      efeito.vida -= dt;
      if (efeito.tipo === 'circulo') efeito.giro += dt * 1.6;
      if (efeito.tipo === 'projetil') {
        const progresso = 1 - Math.max(0, efeito.vida) / efeito.total;
        const suave = progresso * progresso * (3 - 2 * progresso);
        efeito.x = efeito.x0 + (efeito.x1 - efeito.x0) * suave;
        efeito.y = efeito.y0 + (efeito.y1 - efeito.y0) * suave - Math.sin(progresso * Math.PI) * efeito.arco;
        this.emitir(efeito.x, efeito.y, efeito.rastro, dt * 60);
      }
      if (efeito.vida <= 0) this.efeitos.splice(i, 1);
    }
  }

  private emitirAmbiente(dt: number): void {
    if (this.ambientes.length === 0) return;
    for (const emissor of this.ambientes) {
      const esperado = emissor.taxa * this.intensidade * dt;
      const inteiro = Math.floor(esperado) + (Math.random() < esperado % 1 ? 1 : 0);
      for (let i = 0; i < inteiro; i++) {
        const x = aleatorio(emissor.regiao.x[0], emissor.regiao.x[1]) * this.largura;
        const y = aleatorio(emissor.regiao.y[0], emissor.regiao.y[1]) * this.altura;
        this.emitir(x, y, { ...emissor.config, quantidade: 1 / this.intensidade });
      }
    }
  }

  // ------------------------------------------------------------ desenho

  private spriteDeBrilho(cor: string): HTMLCanvasElement {
    const existente = this.sprites.get(cor);
    if (existente) return existente;
    const tamanho = 64;
    const sprite = document.createElement('canvas');
    sprite.width = tamanho;
    sprite.height = tamanho;
    const ctx = sprite.getContext('2d')!;
    const gradiente = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradiente.addColorStop(0, cor);
    gradiente.addColorStop(0.25, cor);
    gradiente.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, tamanho, tamanho);
    this.sprites.set(cor, sprite);
    return sprite;
  }

  private desenhar(): void {
    const ctx = this.contexto;
    ctx.setTransform(this.escalaDePixel, 0, 0, this.escalaDePixel, 0, 0);
    ctx.clearRect(0, 0, this.largura, this.altura);

    for (const efeito of this.efeitos) this.desenharEfeito(efeito);

    for (const p of this.pool) {
      if (!p.ativa) continue;
      const vida = p.vida / p.vidaTotal;
      const alfa = Math.min(1, vida * 2.2) * (p.cintilar ? 0.55 + 0.45 * Math.sin(p.vida * 22 + p.rotacao) : 1);
      const tamanho = p.encolher ? p.tamanho * (0.35 + 0.65 * vida) : p.tamanho;
      ctx.globalCompositeOperation = p.mistura;
      ctx.globalAlpha = Math.max(0, alfa);
      switch (p.forma) {
        case 'faisca': {
          ctx.strokeStyle = p.cor;
          ctx.lineWidth = Math.max(1, tamanho * 0.35);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
          ctx.stroke();
          break;
        }
        case 'quadrado': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotacao);
          ctx.fillStyle = p.cor;
          ctx.fillRect(-tamanho / 2, -tamanho / 2, tamanho, tamanho * 0.7);
          ctx.restore();
          break;
        }
        case 'fumaca': {
          ctx.globalAlpha = Math.max(0, alfa * 0.35);
          const sprite = this.spriteDeBrilho(p.cor);
          const t = tamanho * (1.6 - vida * 0.6) * 2;
          ctx.drawImage(sprite, p.x - t / 2, p.y - t / 2, t, t);
          break;
        }
        default: {
          const sprite = this.spriteDeBrilho(p.cor);
          const t = tamanho * 2;
          ctx.drawImage(sprite, p.x - t / 2, p.y - t / 2, t, t);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private desenharEfeito(efeito: Efeito): void {
    const ctx = this.contexto;
    const progresso = 1 - Math.max(0, efeito.vida) / efeito.total;
    ctx.globalCompositeOperation = 'lighter';
    switch (efeito.tipo) {
      case 'onda': {
        ctx.globalAlpha = (1 - progresso) * 0.9;
        ctx.strokeStyle = efeito.cor;
        ctx.lineWidth = efeito.espessura * (1 - progresso) + 1;
        ctx.beginPath();
        ctx.ellipse(efeito.x, efeito.y, efeito.raio * (0.2 + progresso), efeito.raio * (0.2 + progresso) * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'clarao': {
        const sprite = this.spriteDeBrilho(efeito.cor);
        ctx.globalAlpha = Math.pow(1 - progresso, 1.5);
        const t = efeito.raio * 2 * (0.6 + progresso * 0.6);
        ctx.drawImage(sprite, efeito.x - t / 2, efeito.y - t / 2, t, t);
        break;
      }
      case 'circulo': {
        const entrada = Math.min(1, progresso * 5);
        const saida = Math.min(1, (1 - progresso) * 4);
        ctx.globalAlpha = Math.min(entrada, saida) * 0.95;
        ctx.save();
        ctx.translate(efeito.x, efeito.y);
        ctx.scale(1, 0.38);
        ctx.strokeStyle = efeito.cor;
        ctx.shadowColor = efeito.cor;
        ctx.shadowBlur = 18;
        const raio = efeito.raio * (0.7 + 0.3 * entrada);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, raio, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, raio * 0.78, 0, Math.PI * 2);
        ctx.stroke();
        // Runas: pequenos glifos geométricos girando entre os anéis.
        ctx.rotate(efeito.giro);
        for (let i = 0; i < 12; i++) {
          ctx.save();
          ctx.rotate((i / 12) * Math.PI * 2);
          ctx.translate(raio * 0.89, 0);
          ctx.beginPath();
          const variante = i % 3;
          if (variante === 0) {
            ctx.moveTo(-5, -6);
            ctx.lineTo(0, 6);
            ctx.lineTo(5, -6);
          } else if (variante === 1) {
            ctx.moveTo(-5, 0);
            ctx.lineTo(5, 0);
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
          } else {
            ctx.moveTo(-4, -5);
            ctx.lineTo(4, -5);
            ctx.lineTo(-4, 5);
            ctx.lineTo(4, 5);
          }
          ctx.stroke();
          ctx.restore();
        }
        // Estrela interna
        ctx.rotate(-efeito.giro * 2);
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const angulo = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(angulo) * raio * 0.72;
          const py = Math.sin(angulo) * raio * 0.72;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
        break;
      }
      case 'corte': {
        const avanco = Math.min(1, progresso * 2.4);
        const desvanecer = 1 - Math.max(0, (progresso - 0.35) / 0.65);
        ctx.globalAlpha = desvanecer;
        ctx.save();
        ctx.translate(efeito.x, efeito.y);
        ctx.shadowColor = efeito.cor;
        ctx.shadowBlur = 22;
        const fimAtual = efeito.inicio + (efeito.fim - efeito.inicio) * avanco;
        const segmentos = 18;
        for (let i = 0; i < segmentos; i++) {
          const a0 = efeito.inicio + ((fimAtual - efeito.inicio) * i) / segmentos;
          const a1 = efeito.inicio + ((fimAtual - efeito.inicio) * (i + 1)) / segmentos;
          ctx.strokeStyle = i > segmentos * 0.7 ? '#ffffff' : efeito.cor;
          ctx.lineWidth = efeito.espessura * Math.sin(((i + 0.5) / segmentos) * Math.PI);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, efeito.raio, a0, a1, a1 < a0);
          ctx.stroke();
        }
        ctx.restore();
        ctx.shadowBlur = 0;
        break;
      }
      case 'projetil': {
        const brilho = this.spriteDeBrilho(efeito.nucleo);
        ctx.globalAlpha = 1;
        const t = efeito.raio * 4;
        ctx.drawImage(brilho, efeito.x - t / 2, efeito.y - t / 2, t, t);
        const branco = this.spriteDeBrilho('#fff6dc');
        ctx.drawImage(branco, efeito.x - t / 4, efeito.y - t / 4, t / 2, t / 2);
        break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
