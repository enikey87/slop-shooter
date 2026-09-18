// Арена: расстановка укрытий, столкновения с ними и поиск точек спавна.
import { PROPDEF, type PropKind } from '../content/props';
import { clamp } from '../engine/math';
import { random, rnd } from '../engine/rng';
import { G } from './world';
import { WW, WH, type Prop } from './state';

export function makeProp(kind: PropKind, x: number, y: number, hpMul = 1): Prop {
  const d = PROPDEF[kind], hp = d.hp * hpMul;
  return { kind, x, y, w: d.w, h: d.h, hp, max: hp, seed: random() * 10, flash: 0 };
}

export function layoutProps(): Prop[] {
  const out: Prop[] = [];
  const groups: [number, number, 'h' | 'v', number][] = [[120, 110, 'h', 3], [560, 96, 'h', 2], [300, 190, 'v', 2], [180, 350, 'h', 2], [630, 300, 'v', 3], [300, 470, 'h', 3], [690, 480, 'h', 1], [80, 480, 'h', 1], [470, 380, 'h', 1], [470, 180, 'v', 1]];
  for (const [x, y, o, k] of groups) for (let i = 0; i < k; i++) out.push(makeProp('cab', o === 'h' ? x + i * 16 : x, o === 'v' ? y + i * 8 : y));
  for (const [x, y] of [[172, 108], [182, 116], [540, 100], [330, 270], [340, 276], [520, 300], [250, 420], [700, 200], [150, 250], [610, 470], [420, 520], [60, 90]]) out.push(makeProp('barrel', x, y));
  for (const [x, y] of [[240, 100], [720, 380], [100, 300]]) out.push(makeProp('vend', x, y));
  return out;
}

export const propAt = (x: number, y: number, m = 0): Prop | undefined =>
  G.props.find(r => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m);
/** Пули летят на высоте груди, а укрытие — по «ногам»: сдвиг на 9 px. */
export const bulletProp = (x: number, y: number): Prop | undefined => propAt(x, y + 9);

/** Выталкивает круг из укрытий и за стены. Возвращает укрытие, в которое упёрлись. */
export function pushOut(o: { x: number; y: number; r?: number }): Prop | null {
  const r = o.r ?? 0;
  let hit: Prop | null = null;
  for (const pr of G.props) {
    const cx = clamp(o.x, pr.x, pr.x + pr.w), cy = clamp(o.y, pr.y, pr.y + pr.h);
    const dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      hit = pr;
      if (d2 === 0) { o.y = pr.y + pr.h + r; continue; }
      const d = Math.sqrt(d2);
      o.x += dx / d * (r - d); o.y += dy / d * (r - d);
    }
  }
  o.x = clamp(o.x, 7 + r, WW - 7 - r); o.y = clamp(o.y, 10 + r, WH - 7 - r);
  return hit;
}

export function spawnPoint(minD: number, near?: { x: number; y: number; r: number }): { x: number; y: number } {
  const p = G.p;
  for (let i = 0; i < 60; i++) {
    const x = near ? near.x + rnd(near.r) : 20 + random() * (WW - 40);
    const y = near ? near.y + rnd(near.r) : 24 + random() * (WH - 40);
    if (x < 16 || y < 20 || x > WW - 16 || y > WH - 16) continue;
    if (Math.hypot(x - p.x, y - p.y) < minD) continue;
    if (propAt(x, y, 12)) continue;
    return { x, y };
  }
  return { x: p.x < WW / 2 ? WW - 30 : 30, y: p.y < WH / 2 ? WH - 30 : 30 };
}
