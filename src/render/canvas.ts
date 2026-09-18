// Два холста: мир рисуется в низком разрешении (low) и растягивается целыми пикселями, HUD — в полном.
import { clamp, R } from '../engine/math';
import { $ } from '../platform';

export const cv = $<HTMLCanvasElement>('c');
export const ctx = cv.getContext('2d')!;
export const low = document.createElement('canvas');
export const lx = low.getContext('2d')!;

/** W×H — окно в CSS-пикселях; S — во сколько раз растянут пиксель мира; VW×VH — видимая область мира. */
export const view = { W: 0, H: 0, DPR: 1, S: 3, VW: 0, VH: 0 };

export function resize(): void {
  const v = view;
  v.DPR = Math.min(2, devicePixelRatio || 1);
  v.W = innerWidth; v.H = innerHeight;
  cv.width = R(v.W * v.DPR); cv.height = R(v.H * v.DPR);
  cv.style.width = v.W + 'px'; cv.style.height = v.H + 'px';
  v.S = clamp(Math.floor(Math.min(v.W, v.H) / 190), 2, 5);
  v.VW = Math.ceil(v.W / v.S); v.VH = Math.ceil(v.H / v.S);
  low.width = v.VW; low.height = v.VH;
}
