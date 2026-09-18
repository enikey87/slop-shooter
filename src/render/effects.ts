// Смерть в пиксели: спрайт рассыпается на частицы своих цветов. Чисто визуально — на случайность симуляции не влияет.
import { P } from '../content/palette';
import type { Sheet } from '../engine/gfx/sheet';
import { vrnd } from '../engine/rng';
import { G } from '../game/world';
import { scaleOf } from '../game/body';
import type { Enemy, Player } from '../game/state';
import { SPR } from './sprites';
import { sprOf } from './enemySprites';

function disintegrate(spr: Sheet, x: number, y: number, face: number, scale = 1): void {
  const pix = spr.pix, cy = y - spr.h * scale / 2, step = spr.w * spr.h > 900 ? 2 : 1;
  for (let i = 0; i < pix.length; i += step) {
    const c = pix[i].c;
    if (c === P.ink && Math.random() < .7) continue;
    const wx = x + (pix[i].x - spr.ax) * face * scale, wy = y + (pix[i].y - spr.ay) * scale;
    const dx = wx - x, dy = wy - cy, d = Math.hypot(dx, dy) || 1, s = 20 + Math.random() * 60;
    G.parts.push({ x: wx, y: wy, vx: dx / d * s + vrnd(15), vy: dy / d * s - 10 + vrnd(15), life: .4 + Math.random() * .6, max: 1, color: c, size: scale > 1 ? 2 : 1 });
  }
}
export const enemyDied = (e: Enemy): void => disintegrate(sprOf(e), e.x, e.y - e.alt, e.face, scaleOf(e));
export const heroDied = (p: Player): void => disintegrate(SPR.heroIdle, p.x, p.y, p.face, 1);
