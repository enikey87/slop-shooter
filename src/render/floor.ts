// Пол арены — один заранее нарисованный холст. Пятна от взрывов и обломки рисуются прямо в него и остаются навсегда.
import { TAU, R } from '../engine/math';
import { vrnd, vpick } from '../engine/rng';
import { SPR } from './sprites';
import { WW, WH, type Prop } from '../game/state';
import type { LevelId } from '../content/levels';
import { BRIDGES, CHANNELS } from '../game/mechanics';

let floor: HTMLCanvasElement | null = null, fctx: CanvasRenderingContext2D | null = null;
export const floorCanvas = (): HTMLCanvasElement | null => floor;

function hash(x: number, y: number): number { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const rand = (): number => (vrnd(1) + 1) / 2;
export function pxEll(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string): void {
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) c.fillRect(cx + x, cy + y, 1, 1);
}

/** Пол уровня. Рисуется один раз при входе на уровень, дальше в него «впечатываются» пятна и обломки. */
export function buildFloor(level: LevelId = 'parking'): void {
  floor = document.createElement('canvas'); floor.width = WW; floor.height = WH;
  const f = fctx = floor.getContext('2d')!;
  FLOORS[level](f);
}

/** Попиксельная заливка: base — цвет, pat(x, y) — сдвиг яркости или свой цвет. */
function paint(f: CanvasRenderingContext2D, pat: (x: number, y: number, n: number) => [number, number, number]): void {
  const img = f.createImageData(WW, WH), d = img.data;
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = (y * WW + x) * 4, [r, g, b] = pat(x, y, hash(x, y));
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  f.putImageData(img, 0, 0);
}
const jit = (n: number, a: number): number => (n < .08 ? -a : n > .94 ? a : 0);
function label(f: CanvasRenderingContext2D, txt: string, x: number, y: number, color: string, size = 8): void {
  f.font = `${size}px 'Press Start 2P', monospace`; f.textAlign = 'center'; f.fillStyle = color; f.fillText(txt, x, y);
}

/** Опенспейс: ковролин плиткой, цветные ковры, лозунги на полу. */
function floorOffice(f: CanvasRenderingContext2D): void {
  paint(f, (x, y, n) => { const t = ((x / 40 | 0) + (y / 40 | 0)) % 2 ? 6 : 0, v = jit(n, 5) + t; return x < 6 || y < 6 || x >= WW - 6 || y >= WH - 6 ? [70, 60, 90] : [52 + v, 58 + v, 78 + v]; });
  for (const [x, y, w, h, c] of [[60, 250, 120, 70, 'rgba(255,143,199,.18)'], [620, 250, 120, 70, 'rgba(127,214,255,.18)'], [330, 40, 140, 70, 'rgba(95,191,90,.16)']] as const) { f.fillStyle = c; f.fillRect(x, y, w, h); }
  label(f, 'WE ♥ SYNERGY', 400, 360, 'rgba(255,248,236,.18)'); label(f, 'MOVE FAST', 400, 210, 'rgba(255,248,236,.12)');
  f.fillStyle = 'rgba(20,16,28,.5)';
  for (let i = 0; i < 5; i++) { let x = rand() * WW, y = rand() * WH; for (let k = 0; k < 120; k++) { x += vrnd(1.5) + .6; y += vrnd(1); f.fillRect(R(x), R(y), 1, 1); } }
}

/** Дача: трава, тропинки, цветы, забор по периметру. */
function floorDacha(f: CanvasRenderingContext2D): void {
  const path = (x: number, y: number): boolean => Math.abs(y - 280 - Math.sin(x / 60) * 20) < 10 || Math.abs(x - 400 - Math.sin(y / 50) * 16) < 9;
  paint(f, (x, y, n) => {
    if (x < 6 || y < 6 || x >= WW - 6 || y >= WH - 6) return ((x + y) >> 3) % 2 ? [110, 74, 42] : [80, 52, 30];
    if (path(x, y)) { const v = jit(n, 8); return [120 + v, 92 + v, 60 + v]; }
    const v = jit(n, 10) + ((x * 7 + y * 3) % 11 === 0 ? 12 : 0); return [58 + v, 104 + v, 48 + v];
  });
  for (let i = 0; i < 140; i++) { f.fillStyle = vpick(['#ff8fc7', '#f7c948', '#fff8ec', '#9b8cff']); f.fillRect(R(rand() * WW), R(rand() * WH), 1, 1); }
  label(f, 'ПРОДАЁТСЯ', 700, 540, 'rgba(26,20,35,.3)');
}

/** Канализация: мокрая плитка, каналы с течением, мостки. */
function floorSewer(f: CanvasRenderingContext2D): void {
  const inCh = (y: number): boolean => CHANNELS.some(([y0, y1]) => y > y0 && y < y1);
  paint(f, (x, y, n) => {
    if (inCh(y)) { const w = Math.sin(x / 9 + y) > .7 ? 18 : 0; return [30 + w, 90 + w, 80 + w]; }
    const t = x % 24 === 0 || y % 24 === 0 ? -8 : 0, v = jit(n, 6) + t; return [40 + v, 48 + v, 44 + v];
  });
  for (const [bx, by, bw, bh] of BRIDGES) {
    f.fillStyle = '#6e4a2a'; f.fillRect(bx, by, bw, bh);
    f.fillStyle = '#5a3a24'; for (let y = by; y < by + bh; y += 5) f.fillRect(bx, y, bw, 1);
    f.fillStyle = 'rgba(255,248,236,.25)'; f.fillRect(bx, by, 1, bh); f.fillRect(bx + bw - 1, by, 1, bh);
  }
  label(f, 'МОСТКИ', 200, 30, 'rgba(255,248,236,.35)'); label(f, 'МОСТКИ', 600, 30, 'rgba(255,248,236,.35)');
  for (let i = 0; i < 20; i++) pxEll(f, R(rand() * WW), R(rand() * WH), 5 + R(rand() * 8), 2 + R(rand() * 3), 'rgba(120,160,60,.18)');
}

/** Музей: паркет ёлочкой, мраморная кайма, красная ковровая дорожка. */
function floorMuseum(f: CanvasRenderingContext2D): void {
  paint(f, (x, y, n) => {
    if (x < 14 || y < 14 || x >= WW - 14 || y >= WH - 14) { const v = jit(n, 10); return [210 + v, 206 + v, 198 + v]; }
    if (Math.abs(x - 400) < 26 || Math.abs(y - 280) < 20) { const v = jit(n, 6); return [150 + v, 34 + v, 40 + v]; }
    const k = ((x >> 3) + (y >> 3)) % 2, v = jit(n, 6) + (k ? 10 : 0); return [120 + v, 78 + v, 44 + v];
  });
  f.fillStyle = 'rgba(247,201,72,.6)';
  for (let x = 30; x < WW - 30; x += 10) { f.fillRect(x, 40, 2, 2); f.fillRect(x, WH - 44, 2, 2); }
  label(f, 'РУКАМИ НЕ ТРОГАТЬ', 400, 30, 'rgba(26,20,35,.45)');
}

/** Латентное пространство: шум, съезжающая сетка, глитч-плашки. */
function floorLatent(f: CanvasRenderingContext2D): void {
  paint(f, (x, y, n) => {
    const w = Math.sin(x / 70) + Math.cos(y / 55) + Math.sin((x + y) / 90), v = jit(n, 20);
    const grid = (x + R(Math.sin(y / 30) * 6)) % 32 === 0 || (y + R(Math.cos(x / 40) * 6)) % 32 === 0 ? 25 : 0;
    return [40 + w * 12 + v + grid, 28 + v + grid, 70 + w * 16 + v + grid];
  });
  for (let i = 0; i < 40; i++) { f.fillStyle = vpick(['rgba(127,214,255,.35)', 'rgba(255,143,199,.35)', 'rgba(155,140,255,.35)']); f.fillRect(R(rand() * WW), R(rand() * WH), R(8 + rand() * 50), R(1 + rand() * 3)); }
  label(f, 'loss: NaN', 120, 60, 'rgba(255,248,236,.2)'); label(f, 'temperature: 2.0', 660, 520, 'rgba(255,248,236,.2)');
}

/** Квартира скуфа: гигантский линолеум «под паркет», крошки, пятна. */
function floorApartment(f: CanvasRenderingContext2D): void {
  paint(f, (x, y, n) => {
    const d = (Math.abs((x % 120) - 60) + Math.abs((y % 80) - 40)) < 40 ? 14 : 0, v = jit(n, 8);
    return x < 6 || y < 6 || x >= WW - 6 || y >= WH - 6 ? [60, 40, 30] : [150 + d + v, 96 + d + v, 54 + v];
  });
  for (let i = 0; i < 6; i++) pxEll(f, R(rand() * WW), R(rand() * WH), 14 + R(rand() * 20), 6 + R(rand() * 8), 'rgba(90,60,20,.25)');
  for (let i = 0; i < 300; i++) { f.fillStyle = vpick(['#7a4b2e', '#b07a3f', '#e8c890']); f.fillRect(R(rand() * WW), R(rand() * WH), 2, 1); }
  label(f, 'МАСШТАБ 1:100', 400, 545, 'rgba(26,20,35,.35)');
}

const FLOORS: Record<LevelId, (f: CanvasRenderingContext2D) => void> = {
  parking: floorParking, office: floorOffice, dacha: floorDacha, sewer: floorSewer, museum: floorMuseum, latent: floorLatent, apartment: floorApartment
};

/** Парковка: асфальт, разметка, трещины, кабели, люки, конусы. */
function floorParking(f: CanvasRenderingContext2D): void {
  const img = f.createImageData(WW, WH), d = img.data;
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = (y * WW + x) * 4, n = hash(x, y);
    let v = n < .07 ? -7 : n > .95 ? 8 : 0;
    if (x % 40 === 0 || y % 40 === 0) v -= 5;
    if (x < 6 || y < 6 || x >= WW - 6 || y >= WH - 6) {
      // жёлто-чёрная разметка по краю
      const on = ((x + y) >> 2) % 2;
      d[i] = on ? 247 : 26; d[i + 1] = on ? 201 : 20; d[i + 2] = on ? 72 : 35;
    } else { d[i] = 44 + v; d[i + 1] = 39 + v; d[i + 2] = 54 + v; }
    d[i + 3] = 255;
  }
  f.putImageData(img, 0, 0);
  f.fillStyle = 'rgba(239,230,210,.2)';
  for (let x = 30; x < WW - 20; x += 44) { f.fillRect(x, 14, 2, 46); f.fillRect(x, WH - 60, 2, 46); }
  f.fillRect(14, 60, WW - 28, 2); f.fillRect(14, WH - 62, WW - 28, 2);
  for (let i = 0; i < 18; i++) pxEll(f, R(20 + rand() * (WW - 40)), R(20 + rand() * (WH - 40)), 6 + R(rand() * 14), 3 + R(rand() * 6), 'rgba(18,14,24,.35)');
  for (let i = 0; i < 9; i++) {
    const x = R(40 + rand() * (WW - 80)), y = R(40 + rand() * (WH - 80)), c = vpick(['255,143,199', '127,214,255', '247,201,72']);
    pxEll(f, x, y, 8 + R(rand() * 10), 4 + R(rand() * 4), `rgba(${c},.13)`);
    f.fillStyle = `rgba(${c},.45)`; f.fillRect(x - 3, y - 1, 2, 1);
  }
  // трещины
  f.fillStyle = 'rgba(15,11,20,.55)';
  for (let i = 0; i < 26; i++) {
    let x = rand() * WW, y = rand() * WH, a = rand() * TAU;
    for (let k = 0; k < 18 + rand() * 30; k++) { a += vrnd(.6); x += Math.cos(a); y += Math.sin(a); f.fillRect(R(x), R(y), 1, 1); }
  }
  // кабели
  for (let i = 0; i < 6; i++) {
    let x = rand() * WW, y = rand() * WH, a = rand() * TAU;
    for (let k = 0; k < 160; k++) {
      a += vrnd(.18); x += Math.cos(a); y += Math.sin(a);
      f.fillStyle = '#15111c'; f.fillRect(R(x), R(y), 2, 2);
      f.fillStyle = i % 2 ? 'rgba(255,122,26,.5)' : 'rgba(127,214,255,.35)'; f.fillRect(R(x), R(y), 1, 1);
    }
  }
  // люки
  for (const [mx, my] of [[400, 150], [250, 290], [560, 420]]) {
    pxEll(f, mx, my, 7, 4, '#231d2b'); pxEll(f, mx, my, 5, 3, '#3a3446');
    f.fillStyle = '#231d2b'; for (let k = -4; k <= 4; k += 2) f.fillRect(mx + k, my - 1, 1, 3);
  }
  for (let i = 0; i < 12; i++) f.drawImage(SPR.cone.frames[0], R(30 + rand() * (WW - 60)), R(30 + rand() * (WH - 60)));
}


export function splat(x: number, y: number, r: number, colors: readonly string[]): void {
  const f = fctx; if (!f) return;
  for (let i = 0; i < 10 + r * 2; i++) {
    const a = rand() * TAU, d = rand() * r * 1.6;
    f.fillStyle = vpick(colors); f.globalAlpha = .35 + rand() * .3;
    f.fillRect(R(x + Math.cos(a) * d), R(y + Math.sin(a) * d * .6), 1 + +(rand() < .3), 1);
  }
  f.globalAlpha = 1;
}

export function rubble(pr: Prop, colors: readonly string[]): void {
  const f = fctx; if (!f) return;
  const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
  f.globalAlpha = .55; pxEll(f, R(cx), R(cy), R(pr.w / 2 + 5), R(pr.h / 2 + 3), '#120e18'); f.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    f.fillStyle = vpick(colors);
    f.fillRect(R(cx + vrnd(pr.w / 2 + 6)), R(cy + vrnd(pr.h / 2 + 4)), 1 + +(rand() < .4), 1 + +(rand() < .2));
  }
}
