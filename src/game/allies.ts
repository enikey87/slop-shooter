// Союзники: дядя Вася (с дробовиком), пёс Шарик, турель от альт-огня пулемёта.
import { P } from '../content/palette';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, burst } from './fx';
import { pushOut } from './arena';
import { bodyY } from './body';
import { hitEnemy } from './combat';
import { bullet, gunDmg } from './weapons';
import { ownedSlots } from './inventory';
import type { Ally, Enemy } from './state';

function target(al: Ally): Enemy | null {
  let tg: Enemy | null = null, td = al.kind === 'dog' ? 200 : 150;
  for (const e of G.enemies) {
    if (e.dead || e.charm > 0 || e.disguised || e.air || (al.kind === 'dog' && e.alt > 10)) continue;
    const d = Math.hypot(e.x - al.x, e.y - al.y); if (d < td) { td = d; tg = e; }
  }
  return tg;
}

function dog(al: Ally, tg: Enemy | null, dt: number): void {
  const p = G.p;
  const tx = tg ? tg.x : p.x - p.face * 14, ty = tg ? tg.y : p.y + 6, dx = tx - al.x, dy = ty - al.y, d = Math.hypot(dx, dy) || 1;
  if (d > 6) { al.x += dx / d * 95 * dt; al.y += dy / d * 95 * dt; al.face = dx < 0 ? -1 : 1; al.moving = true; } else al.moving = false;
  if (tg && d < tg.r + 6 && al.fire <= 0) { al.fire = .45; hitEnemy(tg, 6 * G.mods.dmg, dx / d * 60, dy / d * 60); if (random() < .3) say(al.x, al.y - 16, 'ГАВ', P.doge); sfx('woof', .2); }
  al.r = 4; pushOut(al);
}

function gunner(al: Ally, tg: Enemy): void {
  al.ang = Math.atan2(bodyY(tg) - (al.y - 9), tg.x - al.x); al.face = Math.cos(al.ang) >= 0 ? 1 : -1;
  if (al.fire > 0) return;
  const shotgun = !!al.shotgun, turret = al.kind === 'turret';
  al.fire = turret ? .07 : shotgun ? .5 : .22;
  const n = shotgun ? 5 : 1;
  for (let i = 0; i < n; i++) {
    const a = al.ang + (shotgun ? (i - 2) * .14 : 0) + rnd(turret ? .12 : .06);
    bullet('b', al.x + al.face * 3 + Math.cos(a) * 8, al.y - (turret ? 6 : 9) + Math.sin(a) * 8, a, 330, (shotgun ? 1.3 : turret ? 1 : 1.5) * G.mods.dmg);
  }
  sfx(turret ? 'minigun' : shotgun ? 'shotgun' : 'pistol', .08);
}

/** Робот-пылесос (эволюция пылесоса): сам ездит к слопу, бьёт наездом, жрёт вражеские пули, подвозит лут. */
function robovac(al: Ally, dt: number): void {
  const p = G.p;
  if (!ownedSlots().some(s => s.id === 'vacuum')) { al.t = 0; return; }
  let tg: Enemy | null = null, td = 160;
  for (const e of G.enemies) { if (e.dead || e.charm > 0 || e.alt > 10 || e.disguised) continue; const d = Math.hypot(e.x - al.x, e.y - al.y); if (d < td) { td = d; tg = e; } }
  const tx = tg ? tg.x : p.x + 14, ty = tg ? tg.y : p.y + 10, dx = tx - al.x, dy = ty - al.y, d = Math.hypot(dx, dy) || 1;
  if (d > 4) { al.x += dx / d * 75 * dt; al.y += dy / d * 75 * dt; al.face = dx < 0 ? -1 : 1; }
  if (tg && d < tg.r + 6 && al.fire <= 0) { al.fire = .3; hitEnemy(tg, 5 * gunDmg('vacuum'), dx / d * 40, dy / d * 40, { src: 'vacuum' }); }
  G.ebullets = G.ebullets.filter(b => b.kind === 'peel' || b.kind === 'bottle' || Math.hypot(b.x - al.x, b.y - al.y) > 18);
  for (const k of G.pickups) if (k.type !== 'weapon' && k.type !== 'evo' && Math.hypot(k.x - al.x, k.y - al.y) < 50) { const kx = p.x - k.x, ky = p.y - k.y, kd = Math.hypot(kx, ky) || 1; k.x += kx / kd * 90 * dt; k.y += ky / kd * 90 * dt; }
  al.r = 4; pushOut(al);
}

export function updateAllies(dt: number): void {
  for (const al of G.allies) {
    al.t -= dt; al.fire -= dt; al.talk -= dt;
    if (al.kind === 'robovac') { robovac(al, dt); continue; }
    const tg = target(al);
    if (al.kind === 'dog') dog(al, tg, dt);
    else if (tg) gunner(al, tg);
    if (al.kind === 'vasya') {
      if (al.talk <= 0) { al.talk = 3 + random() * 3; say(al.x, al.y - 28, pick(['Гена, держись!', 'в наше время слоп был натуральный', 'я на пять минут', 'эх, молодёжь', 'Шарик, фас!']), P.paper); }
      if (al.t <= 0) { say(al.x, al.y - 28, 'всё, мне на дачу', P.paper); burst(al.x, al.y - 10, [P.track, P.white], 20, 60); }
    } else if (al.t <= 0) burst(al.x, al.y - 6, al.kind === 'dog' ? [P.doge, P.white] : [P.metal, P.gold], 14, 50);
  }
  G.allies = G.allies.filter(al => al.t > 0);
}
