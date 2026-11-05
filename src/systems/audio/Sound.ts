// Tiny WebAudio synth: sound effects and procedural looping music.
// Everything is generated; no audio assets are loaded.

type Wave = OscillatorType;

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Track {
  bpm: number;
  steps: number;
  detune: number;
  play: (s: Sound, step: number, t: number, stepDur: number) => void;
}

function pick<T>(arr: T[], i: number): T {
  const k = Math.floor(i);
  return arr[((k % arr.length) + arr.length) % arr.length];
}

const TRACKS: Record<string, Track> = {
  town: {
    bpm: 84, steps: 64, detune: -12,
    play: (s, i, t, d) => {
      const roots = [50, 50, 46, 45]; // D, D, Bb, A (low)
      const root = roots[Math.floor(i / 16) % 4];
      if (i % 4 === 0) s.note(midi(root - 12), t, d * 3.5, 'triangle', 0.16);
      const arp = [0, 3, 7, 10, 12, 10, 7, 3];
      if (i % 2 === 0) s.note(midi(root + 12 + pick(arp, i / 2)), t, d * 1.6, 'sine', 0.05, 6);
      if (i % 16 === 14) s.note(midi(root + 24 + 1), t, d * 4, 'sine', 0.025, 14); // wrong note shimmer
    },
  },
  plaza: {
    bpm: 96, steps: 64, detune: -38,
    play: (s, i, t, d) => {
      const chords = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 53]];
      const ch = chords[Math.floor(i / 16) % 4];
      if (i % 8 === 0) s.note(midi(ch[0] - 12), t, d * 6, 'triangle', 0.12);
      if (i % 2 === 0) s.note(midi(ch[Math.floor(i / 2) % 4] + 12), t, d * 1.8, 'square', 0.022);
      if (i % 16 === 6) s.note(midi(ch[3] + 24), t, d * 3, 'sine', 0.03, 8);
    },
  },
  dread: {
    bpm: 60, steps: 32, detune: 0,
    play: (s, i, t, d) => {
      if (i % 16 === 0) s.note(midi(31), t, d * 16, 'sawtooth', 0.05);
      if (i % 16 === 0) s.note(midi(37), t, d * 16, 'sine', 0.05, 3);
      if (i % 8 === 4) s.note(midi(pick([67, 73, 66, 72], i / 8)), t, d * 2, 'sine', 0.035, 10);
    },
  },
  battle: {
    bpm: 148, steps: 32, detune: 0,
    play: (s, i, t, d) => {
      const bass = [38, 38, 50, 38, 41, 38, 49, 38];
      s.note(midi(pick(bass, i) - 12 + (Math.floor(i / 16) % 2 ? 3 : 0)), t, d * 0.8, 'sawtooth', 0.07);
      const lead = [62, -1, 65, -1, 69, 68, -1, 65, 62, -1, 61, -1, 62, -1, -1, -1];
      const n = pick(lead, i);
      if (n > 0) s.note(midi(n + (Math.floor(i / 16) % 2 ? 3 : 0)), t, d * 0.9, 'square', 0.035);
      if (i % 4 === 0) s.noise(t, 0.05, 0.05);
    },
  },
  boss: {
    bpm: 156, steps: 32, detune: -20,
    play: (s, i, t, d) => {
      s.note(midi(31 + (i % 8 === 7 ? 6 : 0) + Math.floor(i / 8) % 4), t, d * 0.8, 'sawtooth', 0.08);
      const lead = [74, 73, 70, 69, 74, 73, 67, 66];
      if (i % 2 === 0) s.note(midi(pick(lead, i / 2)), t, d * 1.6, 'square', 0.03);
      if (i % 2 === 1) s.noise(t, 0.03, 0.04);
      if (i % 8 === 0) s.noise(t, 0.12, 0.08);
    },
  },
  ending: {
    bpm: 70, steps: 64, detune: 0,
    play: (s, i, t, d) => {
      const roots = [53, 50, 46, 48];
      const root = roots[Math.floor(i / 16) % 4];
      if (i % 8 === 0) s.note(midi(root - 12), t, d * 7, 'triangle', 0.14);
      const arp = [0, 4, 7, 12, 16, 12, 7, 4];
      if (i % 2 === 0) s.note(midi(root + 12 + pick(arp, i / 2)), t, d * 2, 'sine', 0.05, 4);
    },
  },
};

export class Sound {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private track: Track | null = null;
  private trackName = '';
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  muted = false;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.8;
      this.musicGain.connect(this.master);
      if (this.trackName) {
        const n = this.trackName;
        this.trackName = '';
        this.music(n);
      }
    } catch {
      this.ctx = null;
    }
  }

  note(freq: number, t: number, dur: number, type: Wave, vol: number, vibrato = 0, dest?: AudioNode): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (this.track && !dest) o.detune.value = this.track.detune;
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = vibrato;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest ?? this.musicGain!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(t: number, dur: number, vol: number, dest?: AudioNode): void {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g).connect(dest ?? this.musicGain!);
    src.start(t);
  }

  sfx(name: string): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    const m = this.master!;
    const seq = (notes: number[], step: number, type: Wave, vol: number, dur = step) =>
      notes.forEach((n, i) => n > 0 && this.note(midi(n), t + i * step, dur, type, vol, 0, m));
    switch (name) {
      case 'blip': this.note(midi(84 + Math.floor(Math.random() * 3)), t, 0.03, 'square', 0.02, 0, m); break;
      case 'move': this.note(midi(79), t, 0.04, 'square', 0.04, 0, m); break;
      case 'confirm': seq([76, 83], 0.05, 'square', 0.05); break;
      case 'cancel': seq([71, 64], 0.05, 'square', 0.05); break;
      case 'hit': this.noise(t, 0.12, 0.25, m); this.note(midi(45), t, 0.1, 'square', 0.1, 0, m); break;
      case 'crit': this.noise(t, 0.3, 0.35, m); seq([57, 45, 33], 0.05, 'sawtooth', 0.12); break;
      case 'hurt': this.noise(t, 0.18, 0.3, m); this.note(midi(38), t, 0.2, 'sawtooth', 0.12, 0, m); break;
      case 'miss': seq([72, 60], 0.06, 'triangle', 0.08); break;
      case 'heal': seq([72, 76, 79, 84], 0.06, 'sine', 0.08, 0.15); break;
      case 'ko': seq([60, 55, 50, 45, 40], 0.07, 'square', 0.07); break;
      case 'ring': for (let i = 0; i < 6; i++) this.note(i % 2 ? 1400 : 1200, t + i * 0.06, 0.05, 'square', 0.04, 0, m); break;
      case 'join': seq([67, 71, 74, 79, 83], 0.08, 'triangle', 0.1, 0.2); break;
      case 'win': seq([72, 72, 72, 76, 79, -1, 76, 79, 84], 0.09, 'square', 0.06, 0.12); break;
      case 'lose': seq([60, 59, 58, 57, 50], 0.25, 'triangle', 0.1, 0.4); break;
      case 'encounter': seq([84, 78, 72, 66, 60, 54, 48], 0.035, 'sawtooth', 0.06); this.noise(t, 0.4, 0.1, m); break;
      case 'door': this.noise(t, 0.15, 0.1, m); seq([50, 45], 0.08, 'triangle', 0.1); break;
      case 'item': seq([79, 84, 91], 0.07, 'square', 0.05); break;
      case 'buy': seq([84, 88], 0.05, 'square', 0.05); break;
      case 'levelup': seq([72, 76, 79, 84, 79, 84, 88], 0.07, 'square', 0.06); break;
      case 'murk': seq([60, 63, 67, 70], 0.04, 'sine', 0.08); break;
      case 'enemyAttack': seq([50, 56], 0.04, 'sawtooth', 0.05); break;
    }
  }

  music(name: string): void {
    if (name === this.trackName) return;
    this.trackName = name;
    this.track = TRACKS[name] ?? null;
    this.step = 0;
    if (!this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 50);
  }

  stopMusic(): void {
    this.trackName = '';
    this.track = null;
  }

  private schedule(): void {
    if (!this.ctx || !this.track || this.muted) return;
    const stepDur = 60 / this.track.bpm / 4;
    // Avoid a burst of catch-up notes after the tab was hidden.
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      this.track.play(this, this.step, this.nextTime, stepDur);
      this.step = (this.step + 1) % this.track.steps;
      this.nextTime += stepDur;
    }
  }
}

export const sound = new Sound();
