// Попиксельное рисование спрайтов. Grid не зависит от DOM (кроме toCanvas) — рисование можно тестировать в Node.
import { R } from '../math';

export type PixelColor = string;
export interface Pixel { x: number; y: number; c: PixelColor }

export class Grid {
  readonly d: (PixelColor | null)[];
  constructor(readonly w: number, readonly h: number) { this.d = new Array<PixelColor | null>(w * h).fill(null); }

  px(x: number, y: number, c: PixelColor): void {
    x = R(x); y = R(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  get(x: number, y: number): PixelColor | null {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null;
  }
  rect(x: number, y: number, w: number, h: number, c: PixelColor): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: PixelColor): void {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x - cx) / (rx + .5), dy = (y - cy) / (ry + .5);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  }
  ring(cx: number, cy: number, rx: number, ry: number, c: PixelColor): void {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x - cx) / (rx + .5), dy = (y - cy) / (ry + .5), d = dx * dx + dy * dy;
        if (d <= 1 && d >= .5) this.px(x, y, c);
      }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: PixelColor, t = 1): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      if (t === 1) this.px(x, y, c); else this.rect(R(x - (t - 1) / 2), R(y - (t - 1) / 2), t, t, c);
    }
  }
  /** Контур в 1 пиксель вокруг непрозрачных пикселей. */
  outline(c: PixelColor): void {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(x, y);
    }
    for (let i = 0; i < add.length; i += 2) this.px(add[i], add[i + 1], c);
  }
  /** Все непрозрачные пиксели — для эффекта «рассыпания» при смерти. */
  pixels(): Pixel[] {
    const out: Pixel[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.get(x, y); if (c) out.push({ x, y, c }); }
    return out;
  }
  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const x = c.getContext('2d')!;
    for (let i = 0; i < this.d.length; i++) {
      const col = this.d[i]; if (!col) continue;
      x.fillStyle = col; x.fillRect(i % this.w, (i / this.w) | 0, 1, 1);
    }
    return c;
  }
}

const GLYPH: Readonly<Record<string, readonly string[]>> = {
  'О': ['111', '101', '101', '101', '111'], 'Т': ['111', '010', '010', '010', '010'], 'К': ['101', '101', '110', '101', '101'],
  'Р': ['111', '101', '111', '100', '100'], 'Ь': ['100', '100', '111', '101', '111'], 'І': ['010', '010', '010', '010', '010'],
  'G': ['111', '100', '101', '101', '111'], 'P': ['111', '101', '111', '100', '100'], 'U': ['101', '101', '101', '101', '111'],
  'D': ['110', '101', '101', '101', '110'], 'E': ['111', '100', '111', '100', '111'], 'L': ['100', '100', '100', '100', '111'],
  'V': ['101', '101', '101', '101', '010'], '?': ['111', '001', '011', '000', '010'],
  'W': ['101', '101', '101', '111', '101'], 'O': ['111', '101', '101', '101', '111'], 'S': ['111', '100', '111', '001', '111'],
  'C': ['111', '100', '100', '100', '111'], 'H': ['101', '101', '111', '101', '101'], 'M': ['101', '111', '111', '101', '101'],
  'R': ['110', '101', '110', '101', '101'], 'Y': ['101', '101', '010', '010', '010'], 'A': ['010', '101', '111', '101', '101'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010']
};

/** Пиксельный шрифт 3×5 для вывесок и снарядов-букв. */
export function sign(g: Grid, str: string, x: number, y: number, c: PixelColor): void {
  for (const ch of str) {
    const gl = GLYPH[ch];
    if (gl) gl.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '1') g.px(x + i, y + j, c); });
    x += 4;
  }
}
