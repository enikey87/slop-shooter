// Уроборос из мемов: голова неуязвима, пока жив хвост; ест собственный хвост, чтобы подлечиться.
import { P } from '../../content/palette';
import { random } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, burst, later } from '../fx';
import { bodyY } from '../body';
import { aimAt, eshot, delve } from '../enemies/shots';
import type { Behavior } from '../enemies/types';
import type { Enemy } from '../state';

export const ouro: Behavior = (e, s) => {
  const p = G.p, dt = s.dt;
  const tailSegs = e.segs ? e.segs.filter(sg => !sg.dead && !sg.free) : [];
  e.eatCd = (e.eatCd ?? 9) - dt;
  if (!e.eating && e.eatCd <= 0 && tailSegs.length > 3) { e.eating = true; e.eatHp = e.hp; say(e.x, e.y - 40, 'ОБУЧАЮСЬ НА СЕБЕ', P.purple, true); sfx('inject'); }
  if (e.eating) {
    const tip = tailSegs[tailSegs.length - 1];
    if (!tip) e.eating = false;
    else {
      const tdx = tip.x - e.x, tdy = tip.y - e.y, td = Math.hypot(tdx, tdy) || 1;
      s.vx = tdx / td * s.spd * 1.7; s.vy = tdy / td * s.spd * 1.7; e.face = s.vx < 0 ? -1 : 1;
      if ((e.eatHp ?? e.hp) - e.hp >= 30) { e.eating = false; e.eatCd = 12; e.stun = 2; e.stunKind = 'bonk'; say(e.x, e.y - 40, 'ПЕРЕОБУЧЕНИЕ ПРЕРВАНО', P.cyan, true); sfx('ting'); }
      else if (td < 12) {
        tip.dead = true; burst(tip.x, bodyY(tip), [P.purple, P.gold], 20, 60);
        e.hp = Math.min(e.max, e.hp + e.max * .12); e.eating = false; e.eatCd = 12;
        say(e.x, e.y - 40, '+1 ЭПОХА: ОН ПОДЛЕЧИЛСЯ', P.purple, true); sfx('die');
      }
      return;
    }
  }
  const alive = !!e.segs?.some(sg => !sg.dead);
  e.orbit += dt * (alive ? .7 : 1.1);
  const lunge = Math.sin(e.t * .9) > .85, R1 = lunge ? 10 : 95;
  const tx = p.x + Math.cos(e.orbit) * R1, ty = p.y + Math.sin(e.orbit) * R1 * .7, tdx = tx - e.x, tdy = ty - e.y, td = Math.hypot(tdx, tdy) || 1;
  const ph = e.phase, sp2 = s.spd * (alive ? 1.2 : 1.8) * (lunge ? 1.4 : 1);
  s.vx = tdx / td * sp2; s.vy = tdy / td * sp2; e.face = s.vx < 0 ? -1 : 1;
  if (e.cd <= 0) {
    e.cd = (alive ? 2.6 : 1.4) * [1, .8, .65][ph];
    const volley = (): void => { if (!e.dead) delve(e.x, bodyY(e), .2, 75, 10, ph >= 2); };
    volley(); if (ph >= 1) later(.35, volley);
  }
  if (ph >= 2) {
    e.spT = (e.spT ?? 0) - dt;
    if (e.spT <= 0) { e.spT = .22; e.sa = (e.sa ?? 0) + .5; eshot('letter', e.x, bodyY(e), e.sa, 65, 8, 3.5, { ch: 'DELVE'[((e.sa * 2) | 0) % 5] }); }
  }
};

/** Сегмент хвоста: тянется за предыдущим; после 3 фазы — сам по себе. */
export const oseg: Behavior = (e, s) => {
  if (e.free) {
    e.face = s.dx < 0 ? -1 : 1; s.vx = s.dx / s.d * 50; s.vy = s.dy / s.d * 50;
    if (e.cd <= 0) { e.cd = 2 + random() * 2; eshot('amen', e.x, bodyY(e), aimAt(e.x, bodyY(e)), 75, 8, 3.5); }
    return;
  }
  let L = e.leader; while (L && L.dead) L = L.leader; e.leader = L;
  s.vx = s.vy = 0;
  if (L) {
    const lx0 = L.x - e.x, ly0 = L.y - e.y, ld = Math.hypot(lx0, ly0) || 1;
    if (ld > 11) { e.x += lx0 / ld * (ld - 11); e.y += ly0 / ld * (ld - 11); }
    e.face = lx0 < 0 ? -1 : 1;
  }
  if (e.cd <= 0) { e.cd = (e.head && e.head.phase >= 1 ? 1.8 : 3) + random() * 3; eshot('amen', e.x, bodyY(e), aimAt(e.x, bodyY(e)), 65, 8, 3.5); }
};

export function ouroPhase(e: Enemy, n: number): void {
  if (n !== 2 || !e.segs) return;
  for (const sg of e.segs) if (!sg.dead) { sg.free = true; sg.noSep = false; sg.cd = random() * 2; }
  say(e.x, e.y - 40, 'ХВОСТ РАЗБЕЖАЛСЯ', P.purple, true);
}
