// Вражеские снаряды: общие конструкторы, чтобы поведения читались как «что делает», а не «какие поля».
import { G } from '../world';
import type { EBullet, EBulletKind } from '../state';

/** Угол от точки на грудь игрока. */
export const aimAt = (x: number, y: number): number => Math.atan2(G.p.y - 9 - y, G.p.x - x);

export function eshot(kind: EBulletKind, x: number, y: number, a: number, spd: number, dmg: number, life: number, extra: Partial<EBullet> = {}): EBullet {
  const b: EBullet = { kind, x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life, dmg, r: 3, t: 0, ...extra };
  G.ebullets.push(b);
  return b;
}
/** Кольцо из n снарядов со сдвигом off. */
export function radial(kind: EBulletKind, x: number, y: number, n: number, off: number, spd: number, dmg: number, life: number): void {
  for (let i = 0; i < n; i++) eshot(kind, x, y, off + i / n * Math.PI * 2, spd, dmg, life);
}
/** Веер букв DELVE. */
export function delve(x: number, y: number, spread: number, spd: number, dmg: number, home = false): void {
  const a0 = aimAt(x, y);
  [...'DELVE'].forEach((ch, i) => eshot('letter', x, y, a0 + (i - 2) * spread, spd, dmg, 4, { ch, home }));
}
/** Брошенный по дуге предмет: падает в (tx, ty) через dur секунд. */
export function lob(kind: 'peel' | 'bottle', x: number, y: number, tx: number, ty: number, dur: number, z: number): void {
  G.ebullets.push({ kind, x, gy: y, x0: x, gy0: y, tx, ty, t: 0, dur, life: 9, r: 3, dmg: 0, z, y, vx: 0, vy: 0 });
}
