/**
 * Efeitos sonoros sintetizados com Web Audio (sem arquivos externos).
 * Cada som é uma pequena receita de osciladores, ruído filtrado e envelopes.
 */
export type NomeDoSom =
  | 'clique'
  | 'foco'
  | 'golpe'
  | 'impacto'
  | 'impactoPesado'
  | 'conjurar'
  | 'explosao'
  | 'flecha'
  | 'cura'
  | 'mana'
  | 'bencao'
  | 'derrota'
  | 'desmaio'
  | 'vitoria'
  | 'fanfarraDerrota'
  | 'madeira'
  | 'pedra'
  | 'desmoronar'
  | 'fase'
  | 'erro'
  | 'espolio'
  | 'equipar'
  | 'ressurgir'
  | 'sombra'
  | 'decepar'
  | 'furia';

export class SoundEngine {
  private contexto: AudioContext | null = null;
  private mestre: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  private volume = 0.6;

  definirVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.mestre) this.mestre.gain.value = this.volume * 0.55;
  }

  /** O navegador só libera áudio após um gesto do usuário. */
  private garantirContexto(): AudioContext | null {
    if (this.volume <= 0) return null;
    if (!this.contexto) {
      try {
        this.contexto = new AudioContext();
      } catch {
        return null;
      }
      this.mestre = this.contexto.createGain();
      this.mestre.gain.value = this.volume * 0.55;
      const compressor = this.contexto.createDynamicsCompressor();
      this.mestre.connect(compressor).connect(this.contexto.destination);
      const duracao = this.contexto.sampleRate * 1.5;
      this.ruido = this.contexto.createBuffer(1, duracao, this.contexto.sampleRate);
      const dados = this.ruido.getChannelData(0);
      for (let i = 0; i < duracao; i++) dados[i] = Math.random() * 2 - 1;
    }
    if (this.contexto.state === 'suspended') void this.contexto.resume();
    return this.contexto;
  }

  tocar(nome: NomeDoSom): void {
    const ctx = this.garantirContexto();
    if (!ctx || !this.mestre) return;
    const t = ctx.currentTime + 0.005;
    RECEITAS[nome](this, t);
  }

  // ---------------------------------------------------- blocos de síntese

  tom(t: number, opcoes: { freq: number; freqFinal?: number; dur: number; tipo?: OscillatorType; ganho?: number; ataque?: number }): void {
    const ctx = this.contexto!;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = opcoes.tipo ?? 'sine';
    osc.frequency.setValueAtTime(opcoes.freq, t);
    if (opcoes.freqFinal) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opcoes.freqFinal), t + opcoes.dur);
    const pico = opcoes.ganho ?? 0.3;
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(pico, t + (opcoes.ataque ?? 0.01));
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + opcoes.dur);
    osc.connect(ganho).connect(this.mestre!);
    osc.start(t);
    osc.stop(t + opcoes.dur + 0.05);
  }

  sopro(
    t: number,
    opcoes: { dur: number; freq: number; freqFinal?: number; q?: number; tipo?: BiquadFilterType; ganho?: number; ataque?: number },
  ): void {
    const ctx = this.contexto!;
    const fonte = ctx.createBufferSource();
    fonte.buffer = this.ruido;
    const filtro = ctx.createBiquadFilter();
    filtro.type = opcoes.tipo ?? 'bandpass';
    filtro.Q.value = opcoes.q ?? 1;
    filtro.frequency.setValueAtTime(opcoes.freq, t);
    if (opcoes.freqFinal) filtro.frequency.exponentialRampToValueAtTime(opcoes.freqFinal, t + opcoes.dur);
    const ganho = ctx.createGain();
    const pico = opcoes.ganho ?? 0.4;
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(pico, t + (opcoes.ataque ?? 0.01));
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + opcoes.dur);
    fonte.connect(filtro).connect(ganho).connect(this.mestre!);
    fonte.start(t);
    fonte.stop(t + opcoes.dur + 0.05);
  }

  arpejo(t: number, notas: readonly number[], passo: number, opcoes: { tipo?: OscillatorType; dur?: number; ganho?: number } = {}): void {
    notas.forEach((freq, indice) =>
      this.tom(t + indice * passo, { freq, dur: opcoes.dur ?? 0.5, tipo: opcoes.tipo ?? 'triangle', ganho: opcoes.ganho ?? 0.18 }),
    );
  }
}

const RECEITAS: Readonly<Record<NomeDoSom, (s: SoundEngine, t: number) => void>> = {
  clique: (s, t) => s.tom(t, { freq: 880, freqFinal: 440, dur: 0.08, tipo: 'triangle', ganho: 0.12 }),
  foco: (s, t) => s.tom(t, { freq: 1320, dur: 0.05, tipo: 'sine', ganho: 0.04 }),
  golpe: (s, t) => s.sopro(t, { dur: 0.22, freq: 600, freqFinal: 2600, q: 0.8, ganho: 0.35, ataque: 0.05 }),
  impacto: (s, t) => {
    s.sopro(t, { dur: 0.16, freq: 1800, q: 0.7, ganho: 0.45 });
    s.tom(t, { freq: 180, freqFinal: 60, dur: 0.18, tipo: 'sine', ganho: 0.5 });
    s.tom(t, { freq: 2400, freqFinal: 1800, dur: 0.12, tipo: 'square', ganho: 0.05 });
  },
  impactoPesado: (s, t) => {
    s.sopro(t, { dur: 0.45, freq: 900, freqFinal: 200, q: 0.6, ganho: 0.7 });
    s.tom(t, { freq: 120, freqFinal: 35, dur: 0.55, tipo: 'sine', ganho: 0.9 });
    s.tom(t, { freq: 3000, freqFinal: 1600, dur: 0.2, tipo: 'sawtooth', ganho: 0.06 });
  },
  conjurar: (s, t) => {
    s.tom(t, { freq: 220, freqFinal: 880, dur: 0.7, tipo: 'sawtooth', ganho: 0.06, ataque: 0.3 });
    s.tom(t, { freq: 330, freqFinal: 1320, dur: 0.7, tipo: 'sine', ganho: 0.1, ataque: 0.3 });
    s.sopro(t, { dur: 0.7, freq: 400, freqFinal: 3000, q: 3, ganho: 0.12, ataque: 0.4 });
  },
  explosao: (s, t) => {
    s.sopro(t, { dur: 0.9, freq: 1200, freqFinal: 120, q: 0.5, tipo: 'lowpass', ganho: 0.9 });
    s.tom(t, { freq: 90, freqFinal: 30, dur: 0.7, tipo: 'sine', ganho: 0.8 });
  },
  flecha: (s, t) => {
    s.tom(t, { freq: 140, freqFinal: 90, dur: 0.12, tipo: 'triangle', ganho: 0.3 });
    s.sopro(t + 0.03, { dur: 0.2, freq: 3000, freqFinal: 6000, q: 2, ganho: 0.18 });
  },
  cura: (s, t) => s.arpejo(t, [523, 659, 784, 1046], 0.07, { tipo: 'sine', dur: 0.6, ganho: 0.13 }),
  mana: (s, t) => s.arpejo(t, [392, 587, 784], 0.06, { tipo: 'sine', dur: 0.5, ganho: 0.12 }),
  bencao: (s, t) => {
    s.arpejo(t, [523, 659, 784, 1046, 1318], 0.06, { tipo: 'triangle', dur: 0.8, ganho: 0.12 });
    s.sopro(t, { dur: 1, freq: 5000, q: 4, ganho: 0.05, ataque: 0.3 });
  },
  derrota: (s, t) => {
    s.tom(t, { freq: 300, freqFinal: 70, dur: 0.8, tipo: 'sawtooth', ganho: 0.12 });
    s.sopro(t, { dur: 0.9, freq: 700, freqFinal: 150, q: 0.7, ganho: 0.25 });
  },
  desmaio: (s, t) => s.tom(t, { freq: 400, freqFinal: 160, dur: 0.6, tipo: 'triangle', ganho: 0.14 }),
  vitoria: (s, t) => {
    s.arpejo(t, [392, 523, 659, 784], 0.12, { tipo: 'triangle', dur: 0.7, ganho: 0.18 });
    s.arpejo(t + 0.5, [523, 659, 784, 1046], 0, { tipo: 'sawtooth', dur: 1.4, ganho: 0.06 });
  },
  fanfarraDerrota: (s, t) => s.arpejo(t, [392, 349, 311, 262], 0.22, { tipo: 'triangle', dur: 0.9, ganho: 0.16 }),
  madeira: (s, t) => {
    s.sopro(t, { dur: 0.12, freq: 900, q: 3, ganho: 0.5 });
    s.tom(t, { freq: 240, freqFinal: 160, dur: 0.12, tipo: 'triangle', ganho: 0.35 });
  },
  pedra: (s, t) => {
    s.sopro(t, { dur: 0.22, freq: 500, q: 1.2, ganho: 0.6 });
    s.tom(t, { freq: 90, freqFinal: 50, dur: 0.25, tipo: 'sine', ganho: 0.6 });
  },
  desmoronar: (s, t) => {
    s.sopro(t, { dur: 1.4, freq: 600, freqFinal: 80, q: 0.4, tipo: 'lowpass', ganho: 0.9, ataque: 0.05 });
    s.tom(t, { freq: 70, freqFinal: 28, dur: 1.2, tipo: 'sine', ganho: 0.8 });
  },
  fase: (s, t) => {
    s.tom(t, { freq: 55, freqFinal: 110, dur: 1.4, tipo: 'sawtooth', ganho: 0.25, ataque: 0.4 });
    s.tom(t, { freq: 82, freqFinal: 165, dur: 1.4, tipo: 'sawtooth', ganho: 0.18, ataque: 0.4 });
    s.sopro(t, { dur: 1.4, freq: 200, freqFinal: 1200, q: 1, ganho: 0.3, ataque: 0.5 });
  },
  erro: (s, t) => s.tom(t, { freq: 180, freqFinal: 140, dur: 0.18, tipo: 'square', ganho: 0.06 }),
  espolio: (s, t) => s.arpejo(t, [1046, 1318, 1568], 0.05, { tipo: 'sine', dur: 0.35, ganho: 0.1 }),
  equipar: (s, t) => {
    s.sopro(t, { dur: 0.1, freq: 3500, q: 6, ganho: 0.15 });
    s.tom(t, { freq: 660, freqFinal: 990, dur: 0.12, tipo: 'triangle', ganho: 0.12 });
  },
  ressurgir: (s, t) => {
    s.tom(t, { freq: 110, freqFinal: 220, dur: 1, tipo: 'sawtooth', ganho: 0.12, ataque: 0.3 });
    s.sopro(t, { dur: 1, freq: 300, freqFinal: 900, q: 2, ganho: 0.2, ataque: 0.4 });
  },
  sombra: (s, t) => {
    s.tom(t, { freq: 70, freqFinal: 40, dur: 0.7, tipo: 'sawtooth', ganho: 0.25, ataque: 0.2 });
    s.sopro(t, { dur: 0.6, freq: 300, freqFinal: 120, q: 2, ganho: 0.3, ataque: 0.2 });
  },
  furia: (s, t) => {
    s.tom(t, { freq: 70, freqFinal: 140, dur: 0.55, tipo: 'sawtooth', ganho: 0.18, ataque: 0.25 });
    s.sopro(t, { dur: 0.55, freq: 200, freqFinal: 700, q: 1.5, ganho: 0.22, ataque: 0.3 });
  },
  decepar: (s, t) => {
    s.sopro(t, { dur: 0.18, freq: 4000, freqFinal: 1200, q: 1.5, ganho: 0.4 });
    s.tom(t, { freq: 200, freqFinal: 80, dur: 0.2, tipo: 'square', ganho: 0.1 });
  },
};
