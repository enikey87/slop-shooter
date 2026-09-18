// Музыка: каждый трек — функция шага 16-й ноты. Синтезатор вызывает play() с опережением ~150 мс.
import type { Song, Voice, Wave } from '../engine/audio/synth';

interface ChipSong {
  readonly chords: readonly (readonly [number, number])[];
  readonly order: readonly string[];
  readonly lead: readonly number[];
  readonly hard?: boolean;
}

/** Обычные треки по кругу, каждые 5 волн следующий. */
export const REGULAR = ['main', 'disco', 'phonk', 'eurobeat', 'sigma', 'synthwave', 'polka', 'lofi', 'hardbass'] as const;
/** Треки боссов по умолчанию (у каждого босса может быть свой). */
export const BOSS_TRACKS = ['boss', 'bossMetal', 'bossPhonk', 'bossOrgan', 'bossGlitch', 'bossSkibidi'] as const;

export function makeSongs(vo: Voice): Record<string, Song> {
    const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
    const M = {
      n: (m: number, d: number, type: Wave, vol: number, t: number): void => vo.tone(mtof(m), mtof(m), d, type, vol, t),
      kick: (t: number, v = .9): void => { vo.tone(160, 45, .14, 'sine', v, t); vo.tone(900, 300, .012, 'square', .12 * v, t); },
      snare: (t: number, v = .45): void => { vo.noise(.12, v, 1800, 'bandpass', t, undefined); vo.tone(220, 160, .06, 'triangle', .22, t); },
      clap: (t: number, v = .3): void => { for (let i = 0; i < 3; i++) vo.noise(.05, v, 1500, 'bandpass', t + i * .012, undefined); },
      hat: (t: number, v = .08): void => vo.noise(.03, v, 8000, 'highpass', t, undefined),
      ohat: (t: number, v = .1): void => vo.noise(.14, v, 7000, 'highpass', t, undefined),
      cow: (m: number, t: number, d = .12): void => { const f = mtof(m); vo.tone(f, f, d, 'square', .07, t); vo.tone(f * 1.48, f * 1.48, d, 'square', .05, t); },
      b808: (m: number, t: number, d = .5): void => { const f = mtof(m); vo.tone(f * 1.6, f, d, 'sine', .85, t); vo.tone(f, f * .98, d, 'triangle', .3, t); },
      pad: (ms: readonly number[], d: number, t: number, v = .025): void => { for (const m of ms) { const f = mtof(m); vo.tone(f, f, d, 'sawtooth', v, t); vo.tone(f * 1.007, f * 1.007, d, 'sawtooth', v, t); } }
    };
    function lead(L: readonly number[], bar: number, s: number, t: number, spb: number, type: Wave, vol: number, shift = 0): void {
      const n = L[bar * 16 + s];
      if (!n) return;
      let dur = 1; while (dur < 4 && s + dur < 16 && L[bar * 16 + s + dur] === 0) dur++;
      M.n(n + shift, spb * dur * .95, type, vol, t);
    }
    const CH: Record<'main' | 'boss', ChipSong> = {
      main: {
        chords: [[45, 0], [41, 1], [48, 1], [43, 1]], order: ['A', 'B', 'B', 'C'],
        lead: [76, 0, 0, 74, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0, 72, 0, 0, 74, 72, 0, 69, 0, 72, 0, 74, 0, 77, 0, 0, 0,
          79, 0, 0, 77, 76, 0, 74, 0, 76, 0, 79, 0, 84, 0, 0, 0, 83, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 71, 0, 74, 0]
      },
      boss: {
        hard: true, chords: [[40, 0], [36, 1], [38, 1], [35, 1]], order: ['B', 'B', 'C', 'B'],
        lead: [76, 0, 76, 0, 79, 0, 76, 0, 83, 0, 81, 0, 79, 0, 76, 0, 72, 0, 72, 0, 76, 0, 72, 0, 79, 0, 77, 0, 76, 0, 72, 0,
          74, 0, 74, 0, 78, 0, 74, 0, 81, 0, 79, 0, 78, 0, 74, 0, 75, 0, 78, 0, 81, 0, 83, 0, 87, 0, 83, 0, 81, 0, 78, 0]
      }
    };
    function chip(S: ChipSong, step: number, t: number, spb: number): void {
      const bar = (step >> 4) % 4, s = step % 16, sec = S.order[(step >> 6) % S.order.length];
      const [root, maj] = S.chords[bar], ch = [root, root + (maj ? 4 : 3), root + 7, root + 12];
      if (s % 2 === 0) { const n = root + (s === 6 || s === 14 ? 12 : 0); M.n(n, spb * 1.7, 'square', .1, t); M.n(n, spb * 1.8, 'triangle', .3, t); }
      if (sec !== 'A' || s % 2 === 0) M.n(ch[s % 4] + 24, spb * .7, 'square', sec === 'A' ? .05 : .03, t);
      if (sec !== 'A') { lead(S.lead, bar, s, t, spb, 'square', .085, sec === 'C' ? -12 : 0); lead(S.lead, bar, s, t, spb, 'sawtooth', .025, sec === 'C' ? -12 : 0); }
      if (s % 4 === 0 || (S.hard && s === 10)) M.kick(t);
      if (s === 4 || s === 12) M.snare(t);
      if (sec === 'C' || S.hard || s % 2 === 0) M.hat(t, s % 4 === 2 ? .14 : .07);
    }
    function phonk(fast: boolean, step: number, t: number, spb: number): void {
      const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4, r = [37, 37, 33, 35][bar];
      const pat = bar % 2 ? [73, 0, 76, 0, 78, 0, 76, 0, 73, 0, 71, 0, 68, 0, 71, 0] : [73, 0, 73, 0, 76, 0, 73, 0, 71, 0, 68, 0, 71, 0, 73, 0];
      if ((sec > 0 || fast) && pat[s]) M.cow(pat[s] + (bar === 2 ? -4 : 0), t);
      if ([0, 3, 8, 11].includes(s)) M.b808(r, t, spb * 3.5);
      if (s === 0 || s === 10 || (fast && s === 6)) M.kick(t, 1);
      if (s === 8) { M.clap(t); M.snare(t, .3); }
      M.hat(t, s % 2 ? .05 : .09);
      if ((sec === 3 || fast) && s >= 14) { M.hat(t + spb / 3, .06); M.hat(t + spb * 2 / 3, .06); }
    }
    const hash01 = (x: number): number => { const v = Math.sin(x * 12.9898) * 43758.5453; return v - Math.floor(v); };
    const EURO_L = [81, 0, 79, 0, 76, 0, 79, 0, 81, 0, 84, 0, 83, 0, 79, 0, 77, 0, 76, 0, 72, 0, 76, 0, 77, 0, 81, 0, 79, 0, 77, 0,
      79, 0, 77, 0, 74, 0, 77, 0, 79, 0, 83, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 71, 0, 72, 0, 74, 0, 76, 0, 0, 0];
    const SYNTH_L = [76, 0, 0, 0, 0, 0, 74, 0, 72, 0, 0, 0, 71, 0, 0, 0, 69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      72, 0, 0, 0, 74, 0, 76, 0, 0, 0, 79, 0, 0, 0, 0, 0, 74, 0, 0, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const LOFI_L = [0, 0, 74, 0, 0, 0, 72, 0, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 0, 0, 67, 0, 0, 0,
      0, 0, 76, 0, 0, 0, 74, 0, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 0, 0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0];
    const POLKA_L = [72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 0, 0, 74, 0, 77, 0, 81, 0, 77, 0, 74, 0, 77, 0, 79, 0, 0, 0,
      72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 81, 0, 79, 0, 0, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0, 72, 0, 0, 0];
    const ORGAN_L = [81, 0, 0, 0, 79, 0, 77, 0, 76, 0, 0, 0, 0, 0, 0, 0, 77, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 0, 0, 0, 0,
      76, 0, 0, 0, 80, 0, 83, 0, 88, 0, 0, 0, 86, 0, 0, 0, 84, 0, 83, 0, 81, 0, 0, 0, 81, 0, 0, 0, 0, 0, 0, 0];
    const DISCO_L = [77, 0, 0, 76, 77, 0, 81, 0, 0, 0, 79, 0, 77, 0, 76, 0, 76, 0, 0, 74, 76, 0, 79, 0, 0, 0, 77, 0, 76, 0, 74, 0,
      74, 0, 0, 72, 74, 0, 77, 0, 0, 0, 76, 0, 74, 0, 72, 0, 72, 0, 74, 0, 76, 0, 77, 0, 79, 0, 81, 0, 84, 0, 0, 0];
    const SIGMA_L = [74, 0, 0, 0, 72, 0, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0, 69, 0, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      72, 0, 0, 0, 74, 0, 76, 0, 0, 0, 77, 0, 0, 0, 0, 0, 76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0];
    const SONGS: Record<string, Song> = {
      main: { name: 'СЛОП-ЧИПТЮН', bpm: 126, play: (st, t, spb) => chip(CH.main, st, t, spb) },
      disco: {
        name: 'ИТАЛО-БРЕЙНРОТ ДИСКО', bpm: 122, play(step, t, spb) {
          const bar = (step >> 4) % 4, s = step % 16, sec = (step >> 6) % 4;
          const r = [41, 40, 38, 36][bar], q = [[0, 4, 7, 11], [0, 3, 7, 10], [0, 3, 7, 10], [0, 4, 7, 11]][bar].map(x => x + r);
          if (s % 2 === 0) { const n = r + (s % 4 === 2 ? 12 : 0); M.n(n, spb * 1.6, 'square', .1, t); M.n(n, spb * 1.6, 'triangle', .28, t); }
          M.n(q[s % 4] + 24, spb * .6, 'square', sec ? .03 : .05, t);
          if (sec > 0) { lead(DISCO_L, bar, s, t, spb, 'square', .075); lead(DISCO_L, bar, s, t, spb, 'triangle', .06, 12); }
          if (s % 4 === 0) M.kick(t);
          if (s % 4 === 2) M.ohat(t);
          if (s === 4 || s === 12) M.clap(t);
          if (sec === 3) M.hat(t, .05);
        }
      },
      phonk: { name: 'ДРИФТ-ФОНК 67', bpm: 128, play: (st, t, spb) => phonk(false, st, t, spb) },
      sigma: {
        name: 'СИГМА-ГРИНДСЕТ', bpm: 100, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4;
          const r = [50, 46, 48, 45][bar], ch = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]][bar].map(x => x + r);
          if (s === 0) M.pad(ch.map(x => x + 12), spb * 16, t, .02);
          if (s === 0 || s === 6 || s === 10) { M.n(r - 12, spb * 3, 'triangle', .38, t); M.n(r - 12, spb * 3, 'square', .05, t); }
          if (s % 2 === 0) M.n(ch[[0, 1, 2, 1, 2, 0, 1, 2][(s / 2) % 8]] + 24, spb * 1.5, 'triangle', .07, t);
          if (sec >= 2) lead(SIGMA_L, bar, s, t, spb, 'sine', .08, 12);
          if (s === 0 || s === 10) M.kick(t, .8);
          if (s === 8) M.snare(t, .3);
          if (s % 2 === 0) M.hat(t, .04);
        }
      },
      hardbass: {
        name: 'ХАРДБАСС ДЛЯ СКУФА', bpm: 142, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4, r = [45, 45, 43, 41][bar];
          if (s % 4 === 0) M.kick(t, 1);
          if (s % 4 === 2) { M.n(r, spb * 1.5, 'sawtooth', .12, t); M.n(r + 12, spb * 1.5, 'square', .05, t); M.ohat(t, .08); }
          if (sec > 0 && [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0][s]) { M.n(r + 24, spb * .8, 'sawtooth', .05, t); M.n(r + 31, spb * .8, 'sawtooth', .04, t); M.n(r + 36, spb * .8, 'square', .03, t); }
          if (s === 4 || s === 12) M.clap(t);
          if (sec === 3) M.hat(t, .05);
        }
      },
      boss: { name: 'БОСС: ЧИПТЮН', bpm: 148, play: (st, t, spb) => chip(CH.boss, st, t, spb) },
      bossMetal: {
        name: 'БОСС: МЕТАЛ', bpm: 170, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, r = [40, 40, 43, 38][bar];
          if ([1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1][s]) { M.n(r, spb * .9, 'sawtooth', .1, t); M.n(r + 7, spb * .9, 'sawtooth', .07, t); M.n(r - 12, spb * .9, 'square', .08, t); }
          M.kick(t, s % 2 ? .55 : .9);
          if (s === 4 || s === 12) M.snare(t, .5);
          if (s % 2 === 0) M.hat(t, .06);
          const L = [76, 0, 79, 0, 83, 0, 82, 0, 79, 0, 76, 0, 74, 0, 76, 0][s];
          if ((step >> 6) % 2 && L) M.n(L + 12, spb * 1.8, 'square', .06, t);
        }
      },
      bossPhonk: { name: 'БОСС: ФОНК', bpm: 150, play: (st, t, spb) => phonk(true, st, t, spb) },
      eurobeat: {
        name: 'ЕВРОБИТ: ДРИФТ НА ПАРКОВКЕ', bpm: 155, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4, r = [45, 41, 43, 36][bar];
          if (s % 2 === 1) { M.n(r + (s % 4 === 3 ? 12 : 0), spb * .9, 'sawtooth', .09, t); M.n(r, spb * .9, 'triangle', .25, t); }
          if (s % 4 === 0) M.kick(t, 1);
          if (s === 4 || s === 12) M.clap(t, .35);
          if (s % 4 === 2) M.ohat(t, .09);
          if (sec > 0) { lead(EURO_L, bar, s, t, spb, 'sawtooth', .06); lead(EURO_L, bar, s, t, spb, 'square', .04, 12); }
          else if (s % 2 === 0) M.n([r, r + 7, r + 12, r + 16][(s / 2) % 4] + 24, spb * .8, 'square', .04, t);
        }
      },
      synthwave: {
        name: 'СИНТВЕЙВ: НЕОНОВЫЙ ДАТАЦЕНТР', bpm: 100, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4;
          const r = [45, 41, 48, 43][bar], ch = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]][bar].map(x => x + r);
          if (s === 0) M.pad(ch.map(x => x + 12), spb * 16, t, .018);
          if (s % 2 === 0) M.n(r - 12, spb * 1.8, 'sawtooth', .07, t);
          M.n([ch[0], ch[1], ch[2], ch[0] + 12][s % 4] + 24, spb * .9, s % 2 ? 'triangle' : 'square', .04, t);
          if (s === 0 || s === 8) M.kick(t);
          if (s === 4 || s === 12) { M.snare(t, .5); vo.noise(.4, .08, 1200, 'lowpass', t, undefined); }
          if (s % 2 === 0) M.hat(t, .05);
          if (sec >= 2) lead(SYNTH_L, bar, s, t, spb, 'sine', .09, 12);
        }
      },
      lofi: {
        name: 'ЛОУФАЙ ДЛЯ ТРОГАНИЯ ТРАВЫ', bpm: 78, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sw = s % 2 ? spb * .18 : 0, tt = t + sw;
          const r = [50, 43, 48, 45][bar], ch = [[0, 3, 7, 10, 14], [0, 4, 7, 10, 14], [0, 4, 7, 11, 14], [0, 4, 7, 10, 13]][bar].map(x => x + r);
          if (s === 0) for (const m of ch) M.n(m + 12, spb * 14, 'triangle', .035, tt);
          if (s === 0 || s === 7) M.n(r - 12, spb * 5, 'sine', .45, tt);
          if (s === 0 || s === 10) M.kick(tt, .6);
          if (s === 8) M.snare(tt, .18);
          M.hat(tt, s % 4 === 2 ? .05 : .025);
          if (Math.random() < .3) vo.noise(.02, .03, 3000, 'bandpass', tt, undefined);
          lead(LOFI_L, bar, s, tt, spb, 'sine', .06, 12);
        }
      },
      polka: {
        name: 'ПОЛЬКА «ОТКРЬІТО ЕЖЕДНВНО»', bpm: 168, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 4, r = [48, 43, 48, 43][bar];
          const ch = bar % 2 ? [55, 59, 62, 65] : [60, 64, 67];
          if (s % 8 === 0) M.n(s === 0 ? r : r + 7, spb * 2, 'triangle', .45, t);
          if (s % 8 === 4) for (const m of ch) M.n(m, spb * 1.5, 'square', .025, t);
          if (s % 8 === 0) M.kick(t, .7);
          if (s % 8 === 4) M.snare(t, .25);
          if (sec > 0) { lead(POLKA_L, bar, s, t, spb, 'square', .06, 12); lead(POLKA_L, bar, s, t, spb, 'sawtooth', .025, 12.1); }
        }
      },
      bossOrgan: {
        name: 'БОСС: ОРГАННЫЙ ХОРАЛ В КЛЯРЕ', bpm: 112, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, r = [45, 50, 52, 45][bar];
          const ch = [[0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7]][bar].map(x => x + r);
          if (s === 0) { for (const m of ch) { M.n(m, spb * 15, 'square', .03, t); M.n(m + 12, spb * 15, 'sine', .05, t); } M.pad(ch.map(x => x + 24), spb * 15, t, .012); M.n(r - 24, spb * 15, 'sawtooth', .06, t); }
          if (s % 2 === 0) M.n(ch[(s / 2) % 3] + 24, spb * 1.6, 'triangle', .06, t);
          if (s === 0 || s === 6 || s === 10) M.kick(t, 1);
          if (s === 8) { M.snare(t, .5); vo.noise(.6, .1, 900, 'lowpass', t, undefined); }
          if (s % 4 === 2) M.hat(t, .05);
          lead(ORGAN_L, bar, s, t, spb, 'square', .05, 12);
        }
      },
      bossGlitch: {
        name: 'БОСС: ГЛИТЧ ГАЛЛЮЦИНАЦИИ', bpm: 140, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, h = hash01(step * 7.13), r = [45, 44, 41, 43][bar], sc = [0, 1, 3, 5, 7, 8, 10];
          if (h < .7 || s % 4 === 0) M.n(r + (h < .2 ? 12 : 0), spb * .8, 'sawtooth', .09, t);
          if (hash01(step * 3.7) < .55) M.n(r + 24 + sc[(hash01(step * 1.31) * 7) | 0] + (hash01(step * 9.1) < .3 ? 12 : 0), spb * .5, 'square', .04, t);
          if (s % 4 === 0 || (hash01(step * 5.5) < .15)) M.kick(t, .9);
          if (s === 4 || s === 12 || hash01(step * 2.2) < .08) M.snare(t, .35);
          if (hash01(step * 4.4) < .12) vo.noise(spb * 2, .12, 400 + hash01(step) * 5000, 'bandpass', t, undefined);
          M.hat(t, s % 2 ? .04 : .08);
        }
      },
      bossSkibidi: {
        name: 'БОСС: СКИБИДИ-РЕМИКС', bpm: 132, play(step, t, spb) {
          const s = step % 16, bar = (step >> 4) % 4, sec = (step >> 6) % 2, r = [43, 43, 48, 46][bar];
          if (s % 2 === 0) M.n(r + (s % 4 === 2 ? 12 : 0), spb * 1.6, 'square', .09, t);
          if (s % 4 === 0) M.kick(t, 1);
          if (s === 4 || s === 12) M.clap(t, .35);
          M.hat(t, s % 2 ? .04 : .08);
          const hook = [67, 0, 67, 0, 72, 0, 0, 70, 0, 0, 67, 0, 65, 0, 67, 0];
          if (hook[s]) M.n(hook[s] + (bar === 2 ? 5 : 0) + (sec ? 12 : 0), spb * 1.5, 'square', .07, t);
          if (sec && (s === 13 || s === 15)) { M.n(79, spb * .5, 'square', .05, t); }
        }
      }
    };
  return SONGS;
}
