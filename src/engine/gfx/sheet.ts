// Лист анимации: кадры-холсты, точка привязки, кэши перекрашенных и «повреждённых» вариантов.
import { TAU, R } from '../math';
import { Grid, type Pixel } from './pixel';

export type Drawer = (g: Grid, f: number) => void;

export interface Sheet {
  readonly w: number;
  readonly h: number;
  readonly n: number;
  /** точка привязки: центр по X, «ноги» по Y */
  readonly ax: number;
  readonly ay: number;
  readonly frames: HTMLCanvasElement[];
  /** пиксели первого кадра — для рассыпания при смерти */
  readonly pix: readonly Pixel[];
  readonly tints: Map<string, HTMLCanvasElement[]>;
  readonly damagedCache: Map<string, HTMLCanvasElement>;
}

const OUTLINE = '#1a1423';

export function sheet(w: number, h: number, n: number, draw: Drawer, ax: number, ay: number, noOutline = false): Sheet {
  const frames: HTMLCanvasElement[] = [];
  let pix: Pixel[] = [];
  for (let f = 0; f < n; f++) {
    const g = new Grid(w, h);
    draw(g, f);
    if (!noOutline) g.outline(OUTLINE);
    frames.push(g.toCanvas());
    if (f === 0) pix = g.pixels();
  }
  return { w, h, n, ax, ay, frames, pix, tints: new Map(), damagedCache: new Map() };
}

/** Одноцветный силуэт кадра: вспышка попадания, контуры элиток. */
export function tint(spr: Sheet, f: number, color: string): HTMLCanvasElement {
  let arr = spr.tints.get(color);
  if (!arr) spr.tints.set(color, arr = []);
  if (!arr[f]) {
    const c = document.createElement('canvas'); c.width = spr.w; c.height = spr.h;
    const x = c.getContext('2d')!;
    x.drawImage(spr.frames[f], 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, spr.w, spr.h);
    arr[f] = c;
  }
  return arr[f];
}

/** Поломанные кадры босса: трещины (фаза 2) и трещины с красным накалом (фаза 3). Узор трещин одинаков во всех кадрах. */
export function damaged(spr: Sheet, f: number, lvl: number): HTMLCanvasElement {
  const key = lvl + ':' + f, hit = spr.damagedCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas'); c.width = spr.w; c.height = spr.h;
  const x = c.getContext('2d')!;
  x.drawImage(spr.frames[f], 0, 0);
  x.globalCompositeOperation = 'source-atop';
  let seed = (spr.w * 131 + spr.h * 71 + lvl * 997) | 0;
  const rng = (): number => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < (lvl === 1 ? 6 : 13); i++) {
    let cx = rng() * spr.w, cy = rng() * spr.h, a = rng() * TAU;
    x.fillStyle = i % 3 ? '#1a1423' : '#4a0f1e';
    for (let k = 0; k < 4 + rng() * 7; k++) { x.fillRect(cx | 0, cy | 0, 1, 1); a += (rng() - .5) * 1.4; cx += Math.cos(a); cy += Math.sin(a); }
  }
  if (lvl >= 2) {
    x.fillStyle = 'rgba(224,65,58,.3)'; x.fillRect(0, 0, spr.w, spr.h);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#2a1414' : '#ff7a1a'; x.fillRect((rng() * spr.w) | 0, (rng() * spr.h) | 0, 2, 1); }
  }
  spr.damagedCache.set(key, c);
  return c;
}

const SHADOWS = new Map<number, HTMLCanvasElement>();
/** Пиксельная тень-эллипс радиуса rx. */
export function shadow(rx: number): HTMLCanvasElement {
  let c = SHADOWS.get(rx);
  if (!c) {
    const g = new Grid(rx * 2 + 3, Math.max(3, R(rx * .8) + 2));
    g.ell(rx + 1, (g.h - 1) / 2, rx, Math.max(1, R(rx * .35)), '#000');
    SHADOWS.set(rx, c = g.toCanvas());
  }
  return c;
}
