// Общий цикл врагов: оглушение, очарование, фазы боссов, поведение, аффиксы, движение и расталкивание.
import { P } from '../../content/palette';
import { SPLAT, TYPES } from '../../content/enemies';
import { TAU, clamp } from '../../engine/math';
import { random, rnd, pick } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, burst, later, ring } from '../fx';
import { bodyY, scaleOf, isBoss } from '../body';
import { propAt, pushOut } from '../arena';
import { hitEnemy, hurt, explode, damageProp } from '../combat';
import { checkPhase } from '../bosses/phases';
import { gunLevel, isEvolved } from '../inventory';
import { levelDmg } from '../../content/weapons';
import { TIERS } from '../../content/tiers';
import { BEHAVIORS } from './registry';
import { SpatialHash } from './spatial';
import type { Auras, Steer } from './types';
import { WW, WH, type Enemy } from '../state';

const HIT_TEXT: Partial<Record<string, string>> = { sixseven: 'SIX SEVEN', shark: 'ТРАЛАЛЕРО!', troll: 'problem?', skibidi: 'скибиди!', amogus: 'SUS', capy: 'ок' };
const RAMMERS = new Set(['shark', 'skuf', 'cboss']);
/** Ячейка = две максимальные «толщины» врага: пары дальше друг от друга не толкаются. */
const grid = new SpatialHash<Enemy>(2 * Math.max(...Object.values(TYPES).map(t => t.r)));

/** Горение от огнемёта: 1,5 урона за стак раз в полсекунды, перекидывается на соседей. */
function burn(e: Enemy, dt: number): void {
  e.burnDur! -= dt; e.burnTick = (e.burnTick ?? .5) - dt;
  if (e.burnTick > 0) return;
  const evo = isEvolved('flame');
  e.burnTick = evo ? .35 : .5;
  const L = gunLevel('flame');
  hitEnemy(e, 1.5 * (e.burnS ?? 1) * levelDmg(L) * G.mods.dmg, 0, 0, { noCrit: true, src: 'flame', pierceShield: L >= 5 });
  G.parts.push({ x: e.x + rnd(e.hr), y: bodyY(e) - e.hr * .5, vx: rnd(6), vy: -20, life: .4, max: .4, color: pick([P.red, P.vest, P.gold]), size: 1 });
  for (const o of G.enemies) if (o !== e && !o.dead && !o.alt && !(o.burnDur && o.burnDur > 1) && Math.hypot(o.x - e.x, o.y - e.y) < e.r + o.r + (evo ? 15 : 3)) { o.burnS = Math.max(o.burnS ?? 0, 1); o.burnDur = 1.5; o.burnTick ??= .5; }
  if (e.burnDur! <= 0) { e.burnS = 0; e.burnDur = 0; }
}
function breakArmor(e: Enemy): void {
  e.broken = true;
  if (e.type === 'golem') { e.spd *= 1.8; e.dmg *= 1.3; say(e.x, e.y - 34, 'ВЫВЕСКА ОТВАЛИЛАСЬ', P.red, true); burst(e.x, e.y - 20, [P.paper, P.red, P.gold], 24, 70); }
  else { say(e.x, e.y - 34, '…ладно, впечатлён', P.greyL, true); burst(e.x, e.y - 26, [P.ink, P.white], 10, 50); }
  sfx('ting', .1);
}
/** Мины ур. 3: «Принять cookies?» — враги рядом идут к мине. */
function lure(e: Enemy, s: Steer): void {
  for (const mn of G.mines) {
    if (mn.arm > 0) continue;
    const dx = mn.x - e.x, dy = mn.y - e.y, d = Math.hypot(dx, dy);
    if (d < 60 && d > 1) { s.vx = dx / d * s.spd; s.vy = dy / d * s.spd; return; }
  }
}
/** Затухание отброса за dt. */
function decayKnock(e: Enemy, dt: number): void { const k = Math.pow(.02, dt); e.kx *= k; e.ky *= k; }

/** Очарованный промпт-инъекцией враг атакует ближайшего сородича. */
function charmed(e: Enemy, dt: number): void {
  e.charm -= dt;
  let tg: Enemy | null = null, td = 1e9;
  for (const o of G.enemies) { if (o === e || o.dead || o.charm > 0 || o.alt > 10 || o.disguised) continue; const dd = Math.hypot(o.x - e.x, o.y - e.y); if (dd < td) { td = dd; tg = o; } }
  if (tg) {
    const ddx = tg.x - e.x, ddy = tg.y - e.y, dd = td || 1, sp = Math.max(e.spd, 40);
    e.face = ddx < 0 ? -1 : 1;
    e.x += (ddx / dd * sp + e.kx) * dt; e.y += (ddy / dd * sp + e.ky) * dt;
    if (dd < e.r + tg.r + 2 && e.hitCd <= 0) { e.hitCd = .5; e.charm += .001; hitEnemy(tg, 3 + e.dmg * .4, ddx / dd * 60, ddy / dd * 60, { noCrit: true }); }
  }
  decayKnock(e, dt);
  if (e.charm <= 0) {
    say(e.x, e.y - 24, 'контекст сброшен', P.purple);
    if (e.charmBoom) { e.charmBoom = false; later(.05, () => { if (!e.dead) { explode(e.x, e.y - 6, 26, 8 * G.mods.dmg, { colors: [P.purple, P.pink, P.white] }); hitEnemy(e, 999, 0, 0, { noCrit: true }); } }); }
  }
}

/** Возвращает false, если босс в неуязвимой смене фазы и сегодня не ходит. */
function bossTick(e: Enemy, dt: number): boolean {
  checkPhase(e);
  if (e.trans && e.trans > 0) {
    e.trans -= dt; e.flash = ((G.t * 16) | 0) % 2 ? .05 : 0;
    if (random() < .5) G.parts.push({ x: e.x + rnd(e.hr), y: bodyY(e) + rnd(e.hr), vx: rnd(40), vy: -30, life: .5, max: .5, color: pick(SPLAT[e.type] || [P.pink]), size: 2 });
    return false;
  }
  // дым и огонь — босс «разрушается» с каждой фазой
  const sc = scaleOf(e);
  if (e.phase >= 1 && random() < dt * 8) G.parts.push({ x: e.x + rnd(e.hr), y: bodyY(e) - e.hr * .5, vx: rnd(6), vy: -16, life: .9, max: .9, color: pick(['#6f6780', '#4a4458', '#8a82a0']), size: sc });
  if (e.phase >= 2 && random() < dt * 14) G.parts.push({ x: e.x + rnd(e.hr), y: bodyY(e) + rnd(e.hr * .6), vx: rnd(8), vy: -26, life: .45, max: .45, color: pick([P.red, P.vest, P.gold]), size: sc });
  return true;
}

function affixes(e: Enemy, s: Steer): void {
  const p = G.p, dt = s.dt;
  e.affT -= dt;
  switch (e.aff) {
    case 'toxic': if (e.affT <= 0) { e.affT = .5; G.puddles.push({ x: e.x, y: e.y, r: 8, t: 4 }); } break;
    case 'blink': if (e.affT <= 0) {
      e.affT = 3 + random();
      const a = random() * TAU, dd = 45 + random() * 25, nx = clamp(p.x + Math.cos(a) * dd, 16, WW - 16), ny = clamp(p.y + Math.sin(a) * dd * .7, 20, WH - 16);
      if (!propAt(nx, ny, 6)) { burst(e.x, e.y - e.hy, [P.purple, P.cyan, P.pink], 14, 60); e.x = nx; e.y = ny; burst(e.x, e.y - e.hy, [P.purple, P.cyan], 14, 60); sfx('blink', .1); }
    } break;
    case 'magnet': if (s.d < 130) { p.x -= s.dx / s.d * 26 * dt; p.y -= s.dy / s.d * 26 * dt; } break;
    case 'bless': if (e.affT <= 0) {
      e.affT = 1;
      for (const o of G.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 60) o.hp = Math.min(o.max, o.hp + o.max * .06);
      ring(e.x, e.y - e.hy, P.pink, 60, .4);
    } break;
    case 'fast': if (e.affT <= 0) { e.affT = .06; e.trail.push({ x: e.x, y: e.y, t: .2, f: ((e.t * 10) | 0) % 4, face: e.face }); } break;
  }
  for (const tr of e.trail) tr.t -= dt;
  e.trail = e.trail.filter(tr => tr.t > 0);
}

export function updateEnemies(dt: number): void {
  const p = G.p;
  const auras: Auras = { guilt: false, timeSlow: false, wobble: false, mogged: false };
  const mineLure = G.mines.length > 0 && gunLevel('mines') >= 3;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.t += dt; e.hitCd -= dt; e.cd -= dt; e.flash -= dt; e.atk -= dt; e.slowT -= dt;
    if (e.vulnT) e.vulnT -= dt;
    if (e.burnDur && e.burnDur > 0) burn(e, dt);
    if (e.dead) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.stun > 0) { e.stun -= dt; e.x += e.kx * dt; e.y += e.ky * dt; decayKnock(e, dt); continue; }
    if (e.charm > 0) { charmed(e, dt); continue; }
    if (isBoss(e) && !e.decoy && !bossTick(e, dt)) continue;
    // PRO-подписка лечится; голем и сигма на половине здоровья переходят во вторую фазу
    const regen = TIERS[e.tier].regen;
    if (regen && e.hp < e.max) e.hp = Math.min(e.max, e.hp + e.max * regen * dt);
    if (!e.broken && e.hp < e.max / 2 && (e.type === 'golem' || e.type === 'sigma')) breakArmor(e);
    if (e.type !== 'ballerina' || !(e.spin && e.spin > 0)) e.face = dx < 0 ? -1 : 1;
    let slow = e.slowT > 0 ? .5 : 1;
    if (e.calm > 0) { slow *= .5; e.calm -= dt; }
    for (const z of G.zones) if ((!z.kind || z.kind === 'pfire' || z.kind === 'jpeg') && !e.alt && Math.hypot(e.x - z.x, (e.y - z.y) * 1.6) < z.r) {
      if (!z.kind) slow *= .4;
      if (z.kind === 'jpeg') slow *= .5;
      if (z.burn || z.kind === 'pfire') { e.burnT = (e.burnT ?? 0) - dt; if (e.burnT <= 0) { e.burnT = .25; hitEnemy(e, (z.kind === 'pfire' ? 3 : 2) * G.mods.dmg, 0, 0, { noCrit: true }); } }
    }
    const spd = e.spd * slow;
    const s: Steer = { dt, dx, dy, d, spd, slow, vx: dx / d * spd, vy: dy / d * spd };
    BEHAVIORS[e.type]?.(e, s, auras);
    if (mineLure && !isBoss(e) && !e.alt) lure(e, s);
    if (e.aff) affixes(e, s);

    e.x += (s.vx + e.kx) * dt; e.y += (s.vy + e.ky) * dt;
    decayKnock(e, dt);
    if ((!e.alt || e.alt < 10) && e.dmg && !e.disguised && !(e.z > 6) && d < e.r + p.r + 1 && e.hitCd <= 0) {
      e.hitCd = .6;
      hurt(e.dmg * (e.elite ? 1.4 : 1) * (e.state === 'charge' ? 1.5 : 1), HIT_TEXT[e.type] ?? null);
    }
  }
  p.guilt = auras.guilt; p.timeSlow = auras.timeSlow; p.wobble = auras.wobble; p.mogged = auras.mogged;
  separate();
  for (const e of G.enemies) {
    if (e.alt || e.noSep) { e.x = clamp(e.x, 16, WW - 16); e.y = clamp(e.y, 30, WH - 10); continue; }
    const pr = pushOut(e);
    if (pr && RAMMERS.has(e.type) && e.state === 'charge') {
      damageProp(pr, 12); e.state = 'walk'; e.cd = 2.5; e.stun = 1; e.stunKind = 'bonk';
      say(e.x, e.y - 22, 'БОНК', P.white); G.shake = Math.max(G.shake, 3); sfx('book');
    }
  }
  G.enemies = G.enemies.filter(e => !e.dead);
}

/** Расталкивание: враги не слипаются в одну точку. Соседей ищем через пространственный хеш — O(n) вместо O(n²). */
function separate(): void {
  const es = G.enemies;
  grid.rebuild(es);
  for (let i = 0; i < es.length; i++) {
    const a = es[i];
    grid.near(a.x, a.y, (b, j) => {
      // каждую пару — один раз; летающие толкаются только с летающими
      if (j <= i || !!a.alt !== !!b.alt || (a.noSep && b.noSep)) return;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
      if (Math.abs(dx) > rr || Math.abs(dy) > rr) return;
      const d = Math.hypot(dx, dy);
      if (d < rr && d > 0) { const push = (rr - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push; }
    });
  }
}
