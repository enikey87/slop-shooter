// Пол арены — один заранее нарисованный холст. Пятна от взрывов и обломки рисуются прямо в него и остаются навсегда.
import { TAU, R } from '../engine/math';
import { vrnd, vpick } from '../engine/rng';
import { SPR } from './sprites';
import { WW, WH, type Prop } from '../game/state';

let floor: HTMLCanvasElement | null = null, fctx: CanvasRenderingContext2D | null = null;
export const floorCanvas = (): HTMLCanvasElement | null => floor;

function hash(x: number, y: number): number { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const rand = (): number => (vrnd(1) + 1) / 2;
export function pxEll(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, col: string): void {
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) c.fillRect(cx + x, cy + y, 1, 1);
}

export function buildFloor(): void {
  floor = document.createElement('canvas'); floor.width = WW; floor.height = WH;
  const f = fctx = floor.getContext('2d')!;
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
