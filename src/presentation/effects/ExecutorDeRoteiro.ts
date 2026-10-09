import type { NomeDoSom } from '../audio/SoundEngine';
import type { Cue, Roteiro } from './CombatDirector';
import type { ParticleSystem } from './ParticleSystem';
import { PRESETS } from './presets';

export interface Ponto {
  readonly x: number;
  readonly y: number;
}

export interface Caixa extends Ponto {
  readonly largura: number;
  readonly altura: number;
}

/**
 * O que o executor precisa da tela de combate. A tela fornece posições,
 * elementos e o estado exibido; o executor só os manipula visualmente.
 */
export interface Palco {
  readonly reduzido: boolean;
  caixa(id: string): Caixa | null;
  sprite(id: string): HTMLElement | null;
  direcao(id: string): 1 | -1;
  camera(): HTMLElement | null;
  camadaDeTextos(): HTMLElement | null;
  clarao(): HTMLElement | null;
  particulas(): ParticleSystem | null;
  /** Aplica a cue ao estado exibido (barras, quedas, registro). */
  aplicar(cue: Cue): void;
  som(nome: NomeDoSom): void;
  traduzir(chave: string, args: readonly (string | number)[]): string;
}

const CORES_DO_CORTE = {
  aco: '#ffe9b0',
  brutal: '#ff6a3a',
  sombra: '#b688ff',
  garra: '#f4ead2',
} as const;

/**
 * Executa um roteiro do CombatDirector: agenda cada cue no tempo certo e
 * produz animações (Web Animations API), partículas (Canvas) e textos
 * flutuantes (DOM criado e removido imperativamente).
 */
export class ExecutorDeRoteiro {
  private temporizadores: number[] = [];
  private pendentes: Cue[] = [];
  private concluir: (() => void) | null = null;

  constructor(private readonly palco: Palco) {}

  reproduzir(roteiro: Roteiro): Promise<void> {
    this.cancelar();
    this.pendentes = roteiro.cues.map((agendada) => agendada.cue);
    return new Promise((resolver) => {
      this.concluir = resolver;
      roteiro.cues.forEach((agendada) => {
        const id = window.setTimeout(() => {
          this.pendentes.splice(this.pendentes.indexOf(agendada.cue), 1);
          this.executar(agendada.cue);
        }, agendada.t);
        this.temporizadores.push(id);
      });
      this.temporizadores.push(window.setTimeout(() => this.finalizar(), roteiro.duracao + 120));
    });
  }

  /** Pula as animações: aplica imediatamente o estado das cues restantes. */
  acelerar(): void {
    this.temporizadores.forEach((id) => window.clearTimeout(id));
    this.temporizadores = [];
    const restantes = this.pendentes;
    this.pendentes = [];
    restantes.forEach((cue) => this.palco.aplicar(cue));
    this.finalizar();
  }

  cancelar(): void {
    this.temporizadores.forEach((id) => window.clearTimeout(id));
    this.temporizadores = [];
    this.pendentes = [];
    this.concluir = null;
  }

  private finalizar(): void {
    const concluir = this.concluir;
    this.concluir = null;
    concluir?.();
  }

  // ---------------------------------------------------------------- cues

  private executar(cue: Cue): void {
    const p = this.palco;
    const ps = p.particulas();
    p.aplicar(cue);
    switch (cue.tipo) {
      case 'preparo':
        return this.preparo(cue.atorId, cue.estilo, cue.duracao, ps);
      case 'avanco':
        return this.avanco(cue.atorId, cue.alvoId, cue.pesado, cue.duracao);
      case 'corte': {
        const alvo = p.caixa(cue.alvoId);
        if (!alvo || !ps) return;
        const dir = p.direcao(cue.atorId);
        const cor = CORES_DO_CORTE[cue.estilo];
        const raio = cue.estilo === 'brutal' ? alvo.altura * 0.42 : alvo.altura * 0.32;
        // Arco do canto superior "de trás" até o canto inferior "da frente" (espelhado para inimigos).
        const [inicio, fim] = dir === 1 ? [-2.4, 0.6] : [-0.74, -3.74];
        const sentido = Math.sign(fim - inicio);
        ps.corte(alvo.x, alvo.y, raio, cor, inicio, fim, 0.32, cue.estilo === 'brutal' ? 16 : 9);
        if (cue.estilo === 'brutal' || cue.estilo === 'sombra') {
          ps.corte(alvo.x, alvo.y, raio * 0.75, '#ffffff', inicio + 0.2 * sentido, fim - 0.3 * sentido, 0.28, 5);
        }
        if (cue.estilo === 'garra') {
          ps.corte(alvo.x - 12, alvo.y, raio * 0.9, cor, inicio, fim - 1.2 * sentido, 0.25, 4);
          ps.corte(alvo.x + 12, alvo.y, raio * 0.9, cor, inicio, fim - 1.2 * sentido, 0.25, 4);
        }
        p.som('golpe');
        return;
      }
      case 'projetil': {
        const origem = p.caixa(cue.atorId);
        const destino = p.caixa(cue.alvoId);
        if (!origem || !destino || !ps) return;
        const dir = p.direcao(cue.atorId);
        const inicio = { x: origem.x + dir * origem.largura * 0.35, y: origem.y - origem.altura * 0.3 };
        if (cue.estilo === 'fogo') {
          ps.projetil(inicio, destino, { duracao: cue.duracao / 1000, arco: 70, rastro: PRESETS.rastroDeFogo, nucleo: '#ff8a3c', raio: 20 });
          p.som('golpe');
        } else {
          ps.projetil({ x: origem.x + dir * origem.largura * 0.4, y: origem.y - origem.altura * 0.05 }, destino, {
            duracao: cue.duracao / 1000,
            arco: 10,
            rastro: PRESETS.rastroDeFlecha,
            nucleo: '#fff1c9',
            raio: 4,
          });
          p.som('flecha');
        }
        return;
      }
      case 'impacto':
        return this.impacto(cue.alvoId, cue.elemento, cue.forca, ps);
      case 'dano': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          if (cue.material === 'madeira') {
            ps.emitir(alvo.x, alvo.y, PRESETS.lascasDeMadeira, 0.6);
            p.som('madeira');
          } else if (cue.material === 'pedra') {
            ps.emitir(alvo.x, alvo.y, PRESETS.escombros, 0.5);
            p.som('pedra');
          }
        }
        this.recuo(cue.alvoId);
        const classe = cue.elemento === 'fogo' ? 'fogo' : cue.elemento === 'sombrio' ? 'sombrio' : cue.valor >= 15 ? 'pesado' : 'fisico';
        this.numero(cue.alvoId, `${cue.valor}`, `numero--${classe}`);
        if (cue.absorvido > 0) this.numero(cue.alvoId, p.traduzir('combat.blocked', [cue.absorvido]), 'numero--bloqueio', 22, 300);
        return;
      }
      case 'cura': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          ps.emitir(alvo.x, alvo.y + alvo.altura * 0.3, PRESETS.cura);
          ps.circuloMagico(alvo.x, alvo.y + alvo.altura * 0.48, alvo.largura * 0.55, '#9dff9a', 0.9);
        }
        this.brilho(cue.alvoId, 'rgba(127, 224, 138, 0.9)');
        this.numero(cue.alvoId, `+${cue.quantidade}`, 'numero--cura');
        p.som('cura');
        return;
      }
      case 'mana': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) ps.emitir(alvo.x, alvo.y + alvo.altura * 0.3, PRESETS.mana);
        this.brilho(cue.alvoId, 'rgba(90, 168, 255, 0.9)');
        this.numero(cue.alvoId, `+${cue.quantidade}`, 'numero--mana');
        p.som('mana');
        return;
      }
      case 'fortificar': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          ps.emitir(alvo.x, alvo.y + alvo.altura * 0.3, PRESETS.bencao);
          ps.onda(alvo.x, alvo.y + alvo.altura * 0.48, alvo.largura * 1.4, '#e8cc8a', 0.8, 5);
        }
        this.brilho(cue.alvoId, 'rgba(232, 204, 138, 0.95)');
        this.numero(cue.alvoId, p.traduzir('combat.fortified', [cue.bonus]), 'numero--bencao', 24);
        p.som('bencao');
        return;
      }
      case 'texto':
        this.numero(cue.alvoId, p.traduzir(cue.chave, cue.args), `numero--texto numero--${cue.estilo}`, 26, 120);
        return;
      case 'derrota': {
        const alvo = p.caixa(cue.alvoId);
        if (cue.definitiva && alvo && ps) {
          ps.emitir(alvo.x, alvo.y, PRESETS.dissolver);
          ps.emitir(alvo.x, alvo.y + alvo.altura * 0.45, PRESETS.poeiraNoChao);
        }
        p.som(cue.definitiva ? 'derrota' : 'desmaio');
        return;
      }
      case 'reerguer': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          ps.emitir(alvo.x, alvo.y + alvo.altura * 0.3, PRESETS.necrotico);
          ps.circuloMagico(alvo.x, alvo.y + alvo.altura * 0.48, alvo.largura * 0.7, '#6fdc86', 1.4);
        }
        this.brilho(cue.alvoId, 'rgba(111, 220, 134, 1)', 900);
        p.som('ressurgir');
        return;
      }
      case 'fase': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          ps.emitir(alvo.x, alvo.y, PRESETS.explosaoSombria, 1.4);
          ps.onda(alvo.x, alvo.y + alvo.altura * 0.4, alvo.largura * 2.4, '#ff3a3a', 1.1, 10);
          ps.clarao(alvo.x, alvo.y, alvo.altura, '#ff3a3a', 0.8);
        }
        this.tremer(14, 900);
        this.lampejo('rgba(160, 20, 30, 0.45)', 900);
        this.brilho(cue.alvoId, 'rgba(255, 58, 58, 1)', 1200);
        p.som('fase');
        return;
      }
      case 'quebra': {
        const alvo = p.caixa(cue.alvoId);
        if (alvo && ps) {
          if (cue.material === 'madeira') {
            ps.emitir(alvo.x, alvo.y, PRESETS.lascasDeMadeira, 1.4);
            ps.emitir(alvo.x, alvo.y - alvo.altura * 0.1, PRESETS.brilhoDeEspolio);
          } else {
            ps.emitir(alvo.x, alvo.y, PRESETS.escombros, 2);
            ps.emitir(alvo.x, alvo.y + alvo.altura * 0.35, PRESETS.poeiraNoChao, 2.5);
            this.tremer(16, 800);
          }
        }
        p.som(cue.material === 'madeira' ? 'madeira' : 'desmoronar');
        return;
      }
      case 'membro': {
        const dono = p.caixa(cue.donoId);
        if (dono && ps) {
          const parteY = cue.membroId.endsWith(':perna') ? dono.altura * 0.3 : -dono.altura * 0.08;
          ps.emitir(dono.x, dono.y + parteY, PRESETS.sangueDeMembro);
          ps.corte(dono.x, dono.y + parteY, dono.largura * 0.4, '#ff3a2a', -0.4, 0.9, 0.3, 8);
        }
        p.som('decepar');
        return;
      }
      case 'espolio': {
        const centro = p.camera()?.getBoundingClientRect();
        if (centro && ps) ps.emitir(centro.width * 0.62, centro.height * 0.55, PRESETS.brilhoDeEspolio);
        p.som('espolio');
        return;
      }
      case 'item':
        this.brilho(cue.atorId, 'rgba(232, 204, 138, 0.7)', 400);
        p.som('equipar');
        return;
      case 'grito':
        p.som('furia');
        return;
      case 'fim':
        p.som(cue.vitoria ? 'vitoria' : 'fanfarraDerrota');
        return;
      default:
        return;
    }
  }

  private preparo(atorId: string, estilo: string, duracao: number, ps: ParticleSystem | null): void {
    const p = this.palco;
    const caixa = p.caixa(atorId);
    const sprite = p.sprite(atorId);
    const dir = p.direcao(atorId);
    if (estilo === 'furia') {
      if (caixa && ps) {
        ps.emitir(caixa.x, caixa.y + caixa.altura * 0.2, PRESETS.auraDeFuria);
        ps.emitir(caixa.x, caixa.y + caixa.altura * 0.45, PRESETS.poeiraNoChao);
        ps.onda(caixa.x, caixa.y + caixa.altura * 0.48, caixa.largura * 1.3, '#ff5a3a', duracao / 1000, 6);
      }
      this.animar(sprite, [
        { transform: 'translateY(0) scale(1)', filter: 'drop-shadow(0 0 0 rgba(255,80,40,0))' },
        { transform: `translate(${-dir * 10}px, 6px) scale(1.04, 0.95)`, filter: 'drop-shadow(0 0 18px rgba(255,80,40,0.95))', offset: 0.7 },
        { transform: `translate(${-dir * 12}px, 6px) scale(1.05, 0.94)`, filter: 'drop-shadow(0 0 22px rgba(255,120,40,1))' },
      ], duracao, 'ease-out');
      p.som('furia');
    } else if (estilo === 'arcano') {
      if (caixa && ps) {
        ps.circuloMagico(caixa.x, caixa.y + caixa.altura * 0.48, caixa.largura * 0.75, '#ff9a3c', (duracao + 400) / 1000);
        const cajado = { x: caixa.x + dir * caixa.largura * 0.35, y: caixa.y - caixa.altura * 0.3 };
        ps.emitir(cajado.x, cajado.y, PRESETS.energiaConvergente);
        window.setTimeout(() => ps.clarao(cajado.x, cajado.y, 60, '#ffb347', 0.5), duracao * 0.6);
      }
      this.animar(sprite, [
        { filter: 'drop-shadow(0 0 0 rgba(255,140,60,0))', transform: 'translateY(0)' },
        { filter: 'drop-shadow(0 0 20px rgba(255,140,60,1))', transform: 'translateY(-8px)' },
        { filter: 'drop-shadow(0 0 6px rgba(255,140,60,0.4))', transform: 'translateY(0)' },
      ], duracao + 300, 'ease-in-out');
      p.som('conjurar');
    } else if (estilo === 'mira') {
      if (caixa && ps) ps.clarao(caixa.x + dir * caixa.largura * 0.4, caixa.y - caixa.altura * 0.05, 26, '#fff1c9', 0.4);
      this.animar(sprite, [{ transform: 'translateX(0)' }, { transform: `translateX(${-dir * 8}px)`, offset: 0.8 }, { transform: 'translateX(0)' }], duracao + 120, 'ease-out');
      p.som('equipar');
    } else if (estilo === 'sombra') {
      if (caixa && ps) {
        ps.emitir(caixa.x, caixa.y, PRESETS.explosaoSombria, 0.6);
        ps.circuloMagico(caixa.x, caixa.y + caixa.altura * 0.48, caixa.largura * 0.8, '#a26bff', (duracao + 300) / 1000);
      }
      this.lampejo('rgba(30, 0, 50, 0.35)', duracao);
      this.animar(sprite, [
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(162,107,255,0))' },
        { transform: 'scale(1.08)', filter: 'drop-shadow(0 0 24px rgba(162,107,255,1))' },
      ], duracao, 'ease-in');
      p.som('sombra');
    }
  }

  private avanco(atorId: string, alvoId: string, pesado: boolean, duracao: number): void {
    const p = this.palco;
    const ator = p.caixa(atorId);
    const alvo = p.caixa(alvoId);
    const sprite = p.sprite(atorId);
    if (!ator || !alvo || !sprite) return;
    const dir = p.direcao(atorId);
    const distancia = alvo.x - ator.x - dir * (alvo.largura * 0.55 + ator.largura * 0.25);
    const dx = p.reduzido ? distancia * 0.25 : distancia;
    const salto = pesado ? -38 : -10;
    this.animar(sprite, [
      { transform: 'translate(0, 0) rotate(0deg)' },
      { transform: `translate(${dx * 0.55}px, ${salto}px) rotate(${dir * (pesado ? -6 : -3)}deg)`, offset: 0.3 },
      { transform: `translate(${dx}px, 0) rotate(${dir * 4}deg)`, offset: 0.46 },
      { transform: `translate(${dx}px, 0) rotate(${dir * 2}deg)`, offset: 0.58 },
      { transform: 'translate(0, 0) rotate(0deg)' },
    ], duracao, 'cubic-bezier(.3,.1,.2,1)');
  }

  private impacto(alvoId: string, elemento: string, forca: 1 | 2 | 3, ps: ParticleSystem | null): void {
    const p = this.palco;
    const alvo = p.caixa(alvoId);
    if (!alvo || !ps) return;
    if (elemento === 'fogo') {
      ps.emitir(alvo.x, alvo.y, PRESETS.explosaoDeFogo, 1.2);
      ps.emitir(alvo.x, alvo.y, PRESETS.fumacaDeFogo);
      ps.emitir(alvo.x, alvo.y, PRESETS.brasasPersistentes);
      ps.clarao(alvo.x, alvo.y, alvo.altura * 1.3, '#ff8a3c', 0.6);
      ps.clarao(alvo.x, alvo.y, alvo.altura * 0.5, '#fff1c9', 0.3);
      ps.onda(alvo.x, alvo.y + alvo.altura * 0.4, alvo.largura * 2.2, '#ffb347', 0.6, 8);
      this.lampejo('rgba(255, 140, 50, 0.32)', 380);
      this.tremer(10, 420);
      p.som('explosao');
      return;
    }
    if (elemento === 'sombrio') {
      ps.emitir(alvo.x, alvo.y, PRESETS.explosaoSombria);
      ps.onda(alvo.x, alvo.y + alvo.altura * 0.4, alvo.largura * 1.8, '#a26bff', 0.6, 8);
      ps.clarao(alvo.x, alvo.y, alvo.altura * 0.7, '#7b3fe0', 0.45);
      this.tremer(12, 450);
      p.som('impactoPesado');
      return;
    }
    if (elemento === 'perfurante') {
      ps.emitir(alvo.x, alvo.y, { ...PRESETS.perfuracao, angulo: p.direcao(alvoId) === 1 ? Math.PI : 0 });
      ps.clarao(alvo.x, alvo.y, 40, '#fff1c9', 0.25);
      this.tremer(4, 200);
      p.som('impacto');
      return;
    }
    ps.emitir(alvo.x, alvo.y, forca === 3 ? PRESETS.impactoPesado : PRESETS.faiscasMetalicas);
    ps.clarao(alvo.x, alvo.y, forca === 3 ? alvo.altura * 0.8 : 50, '#ffe2a0', forca === 3 ? 0.45 : 0.22);
    if (forca === 3) {
      ps.onda(alvo.x, alvo.y + alvo.altura * 0.45, alvo.largura * 2.4, '#ffd27a', 0.55, 10);
      ps.emitir(alvo.x, alvo.y + alvo.altura * 0.45, PRESETS.detritos);
      ps.emitir(alvo.x, alvo.y + alvo.altura * 0.45, PRESETS.poeiraNoChao);
      this.lampejo('rgba(255, 236, 200, 0.4)', 260);
      this.tremer(14, 480);
      this.aproximar(alvo);
      p.som('impactoPesado');
    } else {
      this.tremer(forca === 2 ? 6 : 3, 220);
      p.som('impacto');
    }
  }

  // --------------------------------------------------------- utilidades

  private animar(elemento: HTMLElement | null, quadros: Keyframe[], duracao: number, easing: string): void {
    if (!elemento || typeof elemento.animate !== 'function') return;
    elemento.animate(quadros, { duration: Math.max(1, duracao), easing });
  }

  private recuo(id: string): void {
    const sprite = this.palco.sprite(id);
    const dir = this.palco.direcao(id);
    this.animar(sprite, [
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: `translateX(${-dir * 16}px)`, filter: 'brightness(2.6) saturate(0.3)', offset: 0.18 },
      { transform: `translateX(${-dir * 6}px)`, filter: 'brightness(1.2)', offset: 0.5 },
      { transform: 'translateX(0)', filter: 'brightness(1)' },
    ], 360, 'ease-out');
  }

  private brilho(id: string, cor: string, duracao = 700): void {
    this.animar(this.palco.sprite(id), [
      { filter: `drop-shadow(0 0 0 ${cor})` },
      { filter: `drop-shadow(0 0 22px ${cor}) brightness(1.25)`, offset: 0.4 },
      { filter: `drop-shadow(0 0 0 ${cor})` },
    ], duracao, 'ease-out');
  }

  private tremer(intensidade: number, duracao: number): void {
    if (this.palco.reduzido) return;
    const camera = this.palco.camera();
    if (!camera) return;
    const quadros: Keyframe[] = [];
    const passos = 10;
    for (let i = 0; i <= passos; i++) {
      const fator = (1 - i / passos) * intensidade;
      const x = i === passos ? 0 : (Math.random() * 2 - 1) * fator;
      const y = i === passos ? 0 : (Math.random() * 2 - 1) * fator * 0.6;
      quadros.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` });
    }
    camera.animate(quadros, { duration: duracao, easing: 'linear' });
  }

  private aproximar(alvo: Caixa): void {
    if (this.palco.reduzido) return;
    const camera = this.palco.camera();
    if (!camera) return;
    camera.animate(
      [
        { transform: 'scale(1)', transformOrigin: `${alvo.x}px ${alvo.y}px` },
        { transform: 'scale(1.045)', transformOrigin: `${alvo.x}px ${alvo.y}px`, offset: 0.25 },
        { transform: 'scale(1)', transformOrigin: `${alvo.x}px ${alvo.y}px` },
      ],
      { duration: 620, easing: 'cubic-bezier(.2,.7,.2,1)', composite: 'add' },
    );
  }

  private lampejo(cor: string, duracao: number): void {
    const clarao = this.palco.clarao();
    if (!clarao) return;
    clarao.style.background = cor;
    clarao.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: duracao, easing: 'ease-out' });
  }

  private numero(id: string, texto: string, classe: string, deslocamentoY = 0, atraso = 0): void {
    const camada = this.palco.camadaDeTextos();
    const caixa = this.palco.caixa(id);
    if (!camada || !caixa) return;
    const exibir = () => {
      const elemento = document.createElement('div');
      elemento.className = `numero ${classe}`;
      elemento.textContent = texto;
      const desvio = (Math.random() - 0.5) * caixa.largura * 0.4;
      elemento.style.left = `${caixa.x + desvio}px`;
      elemento.style.top = `${caixa.y - caixa.altura * 0.42 - deslocamentoY}px`;
      camada.appendChild(elemento);
      const subida = this.palco.reduzido ? 18 : 70;
      const animacao = elemento.animate(
        [
          { opacity: 0, transform: 'translate(-50%, 10px) scale(0.4)' },
          { opacity: 1, transform: 'translate(-50%, -8px) scale(1.25)', offset: 0.14 },
          { opacity: 1, transform: `translate(-50%, ${-subida * 0.5}px) scale(1)`, offset: 0.55 },
          { opacity: 0, transform: `translate(-50%, ${-subida}px) scale(0.9)` },
        ],
        { duration: 1300, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
      animacao.onfinish = () => elemento.remove();
    };
    if (atraso > 0) window.setTimeout(exibir, atraso);
    else exibir();
  }
}
