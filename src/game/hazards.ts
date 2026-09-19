// Всё, что лежит на полу: зоны (трава, огонь, корни, пена), лужи, бомбы, мины-cookies, кожура.
import { P } from '../content/palette';
import { TAU } from '../engine/math';
import { random } from '../engine/rng';
import { G, sfx } from './world';
import { say } from './fx';
import { explode, checkDeath } from './combat';
import { detonateMine } from './weapons';

/** Эллипс «на полу»: по Y сжат в 1.6 раза. */
const onFloor = (x: number, y: number, cx: number, cy: number, r: number): boolean => Math.hypot(x - cx, (y - cy) * 1.6) < r;

export function updateHazards(dt: number): void {
  const p = G.p, m = G.mods;
  p.rooted = false;
  for (const z of G.zones) {
    z.t -= dt;
    const inside = onFloor(p.x, p.y, z.x, z.y, z.r), grounded = p.dashT <= 0;
    if (z.kind === 'gas') { if (inside && grounded) { p.hp -= 12 * dt; if (random() < dt * 2) say(p.x, p.y - 22, 'ВОНЯЕТ', P.greenL); checkDeath(); } }
    else if (z.kind === 'fire' || z.kind === 'pfire') { if (inside && grounded) { p.hp -= 14 * dt; if (random() < dt * 2) say(p.x, p.y - 22, 'ГОРЯЧО', P.vest); checkDeath(); } }
    else if (z.kind === 'roots' || z.kind === 'foam') { if (inside && grounded) p.rooted = z.kind; }
    else if (inside) p.hp = Math.min(m.maxHp, p.hp + (z.heal ?? 6) * m.heal * dt);
  }
  G.zones = G.zones.filter(z => z.t > 0);

  for (const pd of G.puddles) {
    pd.t -= dt;
    if (onFloor(p.x, p.y, pd.x, pd.y, pd.r) && p.dashT <= 0) {
      p.hp -= 10 * dt;
      // надпись раз в четверть секунды
      if (((G.t * 4) | 0) !== ((G.t * 4 - dt * 4) | 0)) say(p.x, p.y - 22, pd.col === 'holy' ? 'святая вода' : pd.col === 'sewage' ? 'фу' : 'вирусно', pd.col === 'holy' ? P.gold : P.green);
      checkDeath();
    }
  }
  G.puddles = G.puddles.filter(pd => pd.t > 0);

  for (const b of G.bombs) {
    b.t -= dt;
    if (b.t <= 0) explode(b.x, b.y - 4, b.r, 4, { pdmg: b.dmg, colors: [P.vest, P.gold, P.red, P.white] });
  }
  G.bombs = G.bombs.filter(b => b.t > 0);

  for (const mn of G.mines) {
    mn.arm -= dt;
    if (mn.arm > 0) continue;
    // срабатывает и под низко летящими (крокодилы, тролль), но не под боссом-бомбардировщиком
    if (G.enemies.some(e => (!e.alt || e.alt < 20) && !(e.charm > 0) && !e.disguised && Math.hypot(e.x - mn.x, e.y - mn.y) < 12)) {
      detonateMine(mn);
      if (random() < .3) say(mn.x, mn.y - 20, 'cookies приняты', P.brownL);
    }
  }
  G.mines = G.mines.filter(mn => !mn.dead);

  for (const pl of G.peels) {
    pl.t -= dt;
    if (p.slip <= 0 && p.dashT <= 0 && Math.hypot(p.x - pl.x, p.y - pl.y) < 6) {
      pl.t = 0; p.slip = .8;
      if (p.moving) { const l = Math.hypot(p.dx, p.dy) || 1; p.sdx = p.dx / l; p.sdy = p.dy / l; }
      else { const a = random() * TAU; p.sdx = Math.cos(a); p.sdy = Math.sin(a); }
      say(p.x, p.y - 24, 'ПОСКОЛЬЗНУЛСЯ', P.banana); sfx('peel');
    }
  }
  G.peels = G.peels.filter(pl => pl.t > 0);
}
