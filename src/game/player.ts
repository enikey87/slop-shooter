// Геннадий: движение, кувырок, дебаффы, прицел и стрельба, камера.
import { P } from '../content/palette';
import { R, clamp } from '../engine/math';
import { random, rnd } from '../engine/rng';
import { G } from './world';
import { pushOut } from './arena';
import { hitEnemy, checkDeath } from './combat';
import { addEnemy } from './spawn';
import { gunPivot, updateTrigger } from './weapons';
import type { TickInput } from './input';
import { WW, WH } from './state';

const BASE_SPEED = 78, DASH_SPEED = 225, SLIP_SPEED = 150;

function tickCooldowns(dt: number): void {
  const p = G.p;
  p.noGun -= dt; p.dashCd -= dt; p.inv -= dt; p.hit -= dt; p.recoil = Math.max(0, p.recoil - dt * 20);
  p.cdQ = Math.max(0, p.cdQ - dt); p.cdE = Math.max(0, p.cdE - dt); p.cdC = Math.max(0, p.cdC - dt); p.cdV = Math.max(0, p.cdV - dt); p.cdG = Math.max(0, p.cdG - dt);
  for (const sl of p.guns) if (sl?.altCd && sl.altCd > 0) sl.altCd -= dt;
  p.scramble = Math.max(0, p.scramble - dt);
}

function move(dt: number, input: TickInput): void {
  const p = G.p, m = G.mods;
  let mx = input.mx, my = input.my;
  if (p.invert > 0) { p.invert -= dt; mx = -mx; my = -my; }
  if (G.mod === 'mirror') mx = -mx;
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  p.moving = ml > 0;
  if (p.moving) { p.dx = mx; p.dy = my; }
  if (m.regen) p.hp = Math.min(m.maxHp, p.hp + m.regen * dt);
  let spd = BASE_SPEED * m.speed;
  if (p.rooted) spd *= p.rooted === 'foam' ? .6 : .5;
  if (p.timeSlow) spd *= .55;
  if (p.cling) {
    spd *= 1 - .08 * p.cling; p.hp -= p.cling * .8 * dt; checkDeath();
    // лабубу надоедает: раз в 5 секунд один отваливается сам (кувырок стряхивает всех сразу)
    p.clingT -= dt;
    if (p.clingT <= 0) { p.cling--; p.clingT = 5; addEnemy('labubu', p.x + rnd(10), p.y + rnd(6)).stun = 1; }
  }
  if (p.sugar > 0) { p.sugar -= dt; spd *= 1.25; }
  if (p.slip > 0) {
    p.slip -= dt; mx = p.sdx; my = p.sdy; spd = SLIP_SPEED;
    if (random() < .4) G.parts.push({ x: p.x, y: p.y, vx: rnd(10), vy: rnd(10), life: .3, max: .3, color: P.banana, size: 1 });
  }
  if (p.dashT > 0) {
    p.dashT -= dt; spd = DASH_SPEED; mx = p.dx; my = p.dy;
    p.trail.push({ x: p.x, y: p.y, t: .18, face: p.face, f: (p.anim | 0) % 4 });
    if (m.dashDmg) for (const e of G.enemies) if (e.dashHit !== p.dashId && !e.alt && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 10) { e.dashHit = p.dashId; hitEnemy(e, m.dashDmg * m.dmg, p.dx * 80, p.dy * 80); }
  }
  p.anim += dt * (p.moving || p.dashT > 0 ? 10 : 2);
  p.x += mx * spd * dt; p.y += my * spd * dt;
  pushOut(p);
  p.histT -= dt;
  if (p.histT <= 0) { p.histT = .1; p.hist.push({ x: p.x, y: p.y, hp: p.hp }); if (p.hist.length > 50) p.hist.shift(); }
  for (const tr of p.trail) tr.t -= dt;
  p.trail = p.trail.filter(tr => tr.t > 0);
}

export function followCamera(): void {
  const p = G.p, c = G.cam, v = G.view;
  c.x = R(v.w < WW ? clamp(p.x - v.w / 2, 0, WW - v.w) : (WW - v.w) / 2);
  c.y = R(v.h < WH ? clamp(p.y - 8 - v.h / 2, 0, WH - v.h) : (WH - v.h) / 2);
}

function aimAndFire(dt: number, input: TickInput): void {
  const p = G.p, c = G.cam, gp = gunPivot(p);
  if (input.aim) {
    p.aimX = input.aim.x + c.x; p.aimY = input.aim.y + c.y;
    p.ang = Math.atan2(p.aimY - gp.y, p.aimX - gp.x);
  }
  if (p.wobble) p.ang += Math.sin(G.t * 9) * .35;
  p.face = Math.cos(p.ang) >= 0 ? 1 : -1;
  updateTrigger(dt, input.fire);
}

function aura(dt: number): void {
  const p = G.p, m = G.mods;
  if (!m.aura) return;
  p.auraT -= dt;
  if (p.auraT <= 0) { p.auraT = .5; for (const e of G.enemies.slice()) if (!e.alt && Math.hypot(e.x - p.x, e.y - p.y) < 28) hitEnemy(e, m.aura * .5 * m.dmg, 0, 0, { noCrit: true }); }
}

export function updatePlayer(dt: number, input: TickInput): void {
  tickCooldowns(dt);
  move(dt, input);
  followCamera();
  aimAndFire(dt, input);
  aura(dt);
}
