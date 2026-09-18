// Синтезатор: шины эффектов и музыки, компрессор, секвенсор. Что играть — решает content/.
export type Wave = OscillatorType;

/** Голос: тон с глиссандо и шум через фильтр. delay — от текущего момента, сек. */
export interface Voice {
  tone(f0: number, f1: number, dur: number, type?: Wave, vol?: number, delay?: number): void;
  noise(dur: number, vol?: number, freq?: number, type?: BiquadFilterType, delay?: number, f1?: number): void;
}
export interface SfxVoice extends Voice {
  arp(notes: readonly number[], gap: number, type?: Wave, vol?: number, dur?: number): void;
}
export type SfxTable = Record<string, (v: SfxVoice) => void>;
export interface Song { readonly name: string; readonly bpm: number; play(step: number, t: number, spb: number): void }

export interface Playlist { readonly regular: readonly string[]; readonly boss: readonly string[] }

export class Synth {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private readonly last = new Map<string, number>();
  private songs: Record<string, Song> = {};
  private song = 'main';
  private playing = false;
  private nextT = 0;
  private step = 0;
  private regIdx = 0;
  private bossIdx = 0;
  private inBoss = false;
  private enabled = true;
  private trackCb: ((name: string) => void) | null = null;

  constructor(private readonly sfx: SfxTable, private readonly makeSongs: (v: Voice) => Record<string, Song>, private readonly playlist: Playlist) {}

  init(): void {
    if (this.ac) { if (this.ac.state === 'suspended') void this.ac.resume(); return; }
    try {
      const ac = new AudioContext();
      this.ac = ac;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
      comp.connect(ac.destination);
      this.master = ac.createGain(); this.master.gain.value = this.enabled ? .9 : 0; this.master.connect(comp);
      this.sfxBus = ac.createGain(); this.sfxBus.gain.value = .34; this.sfxBus.connect(this.master);
      this.musicBus = ac.createGain(); this.musicBus.gain.value = .55; this.musicBus.connect(this.master);
      this.noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.songs = this.makeSongs(this.voice(this.musicBus));
      setInterval(() => this.schedule(), 25);
    } catch { this.ac = null; }
  }

  private voice(out: AudioNode): SfxVoice {
    const tone: Voice['tone'] = (f0, f1, dur, type = 'square', vol = .1, delay = 0) => {
      const ac = this.ac!, t = ac.currentTime + Math.max(0, delay), o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
      o.connect(g).connect(out); o.start(t); o.stop(t + dur + .03);
    };
    const noise: Voice['noise'] = (dur, vol = .2, freq = 2000, type = 'lowpass', delay = 0, f1) => {
      const ac = this.ac!, t = ac.currentTime + Math.max(0, delay);
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.noiseBuf; fl.type = type; fl.frequency.setValueAtTime(freq, t);
      if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
      s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * .5); s.stop(t + dur + .03);
    };
    const arp: SfxVoice['arp'] = (notes, gap, type = 'square', vol = .08, dur = .1) => notes.forEach((f, i) => tone(f, f, dur, type, vol, i * gap));
    return { tone, noise, arp };
  }

  /** Эффект по имени; gap — не чаще раза в gap секунд (защита от «пулемётного» наложения). */
  play(name: string, gap = .03): void {
    const ac = this.ac, fx = this.sfx[name];
    if (!ac || !this.enabled || !fx) return;
    const now = ac.currentTime, l = this.last.get(name);
    if (l !== undefined && now - l < gap) return;
    this.last.set(name, now);
    fx(this.sfxVoice ??= this.voice(this.sfxBus));
  }
  private sfxVoice: SfxVoice | undefined;

  music(on: boolean): void {
    this.playing = on;
    if (on && this.ac) { if (this.ac.state === 'suspended') void this.ac.resume(); this.nextT = this.ac.currentTime + .05; }
  }
  bossMode(on: boolean, idx = 0, name?: string | null): void {
    this.inBoss = on;
    if (on) this.bossIdx = idx;
    const { regular, boss } = this.playlist;
    this.setSong(on ? (name || boss[this.bossIdx % boss.length]) : regular[this.regIdx % regular.length]);
  }
  regular(i: number): void { this.regIdx = i; if (!this.inBoss) this.setSong(this.playlist.regular[i % this.playlist.regular.length]); }
  next(): void {
    const { regular, boss } = this.playlist;
    if (this.inBoss) this.setSong(boss[++this.bossIdx % boss.length]); else this.setSong(regular[++this.regIdx % regular.length]);
  }
  set onTrack(fn: ((name: string) => void) | null) { this.trackCb = fn; }
  get track(): string { return this.songs[this.song]?.name ?? ''; }
  toggle(): boolean { this.enabled = !this.enabled; if (this.master) this.master.gain.value = this.enabled ? .9 : 0; return this.enabled; }
  get on(): boolean { return this.enabled; }
  get debug(): { state: string | null; playing: boolean; song: string; step: number } { return { state: this.ac && this.ac.state, playing: this.playing, song: this.song, step: this.step }; }

  private setSong(name: string): void {
    if (name === this.song) return;
    this.song = name; this.step = 0;
    this.trackCb?.(this.songs[name]?.name ?? name);
  }
  private schedule(): void {
    const ac = this.ac;
    if (!ac) return;
    if (!this.playing || !this.enabled) { this.nextT = ac.currentTime + .05; return; }
    const S = this.songs[this.song], spb = 60 / S.bpm / 4;
    if (this.nextT < ac.currentTime) this.nextT = ac.currentTime + .02;
    while (this.nextT < ac.currentTime + .15) { S.play(this.step, this.nextT - ac.currentTime, spb); this.nextT += spb; this.step++; }
  }
}
