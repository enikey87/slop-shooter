// Бомбардиро-крокодило: кружит в небе и бомбит; пикирует (тогда уязвим); в 3 фазе падает и таранит по земле.
import { P } from '../../content/palette';
import { TAU } from '../../engine/math';
import { random } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, later } from '../fx';
import { spawnPoint } from '../arena';
import { explode, dropBomb } from '../combat';
import { spawnPortal } from '../spawn';
import { chargeStep } from '../enemies/behaviors';
import type { Behavior } from '../enemies/types';
import type { Enemy } from '../state';

function bombRing(alt: number, dmg: number): void {
  const p = G.p;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; dropBomb(p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 28, alt, dmg, 18); }
}
function fireTrail(e: Enemy, dt: number, every: number): void {
  e.ft = (e.ft ?? 0) - dt;
  if (e.ft <= 0) { e.ft = every; G.zones.push({ x: e.x, y: e.y, r: 12, t: 3, max: 3, kind: 'fire' }); }
}

export const cboss: Behavior = (e, s) => {
  const p = G.p, ph = e.phase;
  if (e.grounded) {
    e.face = s.dx < 0 ? -1 : 1;
    if (!chargeStep(e, s, 190, .8, () => { e.gcd = 2.5; })) {
      s.vx = s.dx / s.d * s.spd * 1.1; s.vy = s.dy / s.d * s.spd * 1.1;
      e.gcd = (e.gcd ?? 2) - s.dt;
      if (e.gcd <= 0) { e.state = 'wind'; e.st = .5; say(e.x, e.y - 40, 'ТАРАН!', P.red, true); sfx('charge'); }
    }
    fireTrail(e, s.dt, .25);
    if (e.cd <= 0) { e.cd = 3.2; bombRing(30, 14); say(e.x, e.y - 40, 'АВИАПОДДЕРЖКА!', P.grey); }
    return;
  }
  if (e.dive && e.dive > 0) {
    e.dive -= s.dt; s.vx = (e.ddx ?? 0) * 170; s.vy = (e.ddy ?? 0) * 170; e.alt = 12; e.face = s.vx < 0 ? -1 : 1;
    e.bt = (e.bt ?? 0) - s.dt;
    if (e.bt <= 0) { e.bt = .15; dropBomb(e.x, e.y, 12, 10, 14); }
    if (e.dive <= 0) { e.alt = 30; e.diveCd = ph >= 2 ? 4.5 : 6.5; }
  } else {
    e.orbit += s.dt * [.45, .55, .7][ph];
    const tx = p.x + Math.cos(e.orbit) * 110, ty = p.y + Math.sin(e.orbit) * 70, tdx = tx - e.x, tdy = ty - e.y, td = Math.hypot(tdx, tdy) || 1;
    s.vx = tdx / td * s.spd * 1.4; s.vy = tdy / td * s.spd * 1.4; e.face = s.vx < 0 ? -1 : 1;
    if (ph >= 1) {
      e.diveCd = (e.diveCd ?? 2) - s.dt;
      if (e.diveCd <= 0) { e.dive = 1.3; e.ddx = s.dx / s.d; e.ddy = s.dy / s.d; say(e.x, e.y - 50, 'ПИКИРУЮ', P.red, true); sfx('whistle'); }
    }
  }
  if (ph >= 2) fireTrail(e, s.dt, .3);
  if (e.cd <= 0 && !(e.dive && e.dive > 0)) {
    e.cd = [3, 2.5, 2.1][ph];
    if (ph >= 2 && (e.cn = (e.cn ?? 0) + 1) % 2) bombRing(e.alt, 16);
    else { const a = random() * TAU, nx = -Math.sin(a), ny = Math.cos(a); for (let i = -3; i <= 3; i++) dropBomb(p.x + nx * i * 16, p.y + ny * i * 12, e.alt, 16, 20); }
  }
  e.spec = (e.spec || 8) - s.dt;
  if (e.spec <= 0) { e.spec = 9; for (let i = 0; i < 2; i++) { const sp = spawnPoint(80); spawnPortal('croc', sp.x, sp.y, .8, false); } }
};

export function cbossPhase(e: Enemy, n: number): void {
  if (n !== 2) return;
  e.grounded = true; e.alt = 0; e.hy = 20; e.dive = 0; e.dmg = 25 * (1 + G.wave * .012); e.state = 'walk';
  later(.05, () => explode(e.x, e.y - 6, 44, 5, { pdmg: 12, colors: [P.vest, P.red, P.gold, P.grey] }));
  say(e.x, e.y - 50, 'ПОДБИТ! ПАДАЮ!', P.red, true);
}
