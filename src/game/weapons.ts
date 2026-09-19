// Стрельба: основной огонь каждой пушки, альт-огонь и механики уровней 3 и 5. Слоты и уровни — в inventory.ts.
import { P } from '../content/palette';
import { WEAPONS, GUN_SPECS, levelDmg, levelRate, type WeaponId } from '../content/weapons';
import { clamp, angDiff } from '../engine/math';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, later, ring } from './fx';
import { propAt } from './arena';
import { bodyY, isBoss } from './body';
import { hitEnemy, explode, damageProp } from './combat';
import { activeGunId, curSlot, cycleGun, gunLevel, isEvolved } from './inventory';
import { hitStop, casing } from './juice';
import { inStandup } from './mechanics';
import { WW, WH, type Bullet, type BulletKind, type Enemy, type Player } from './state';

export { curSlot, activeGunId, selectGun, cycleGun } from './inventory';

// ---------- примитивы ----------
export const gunPivot = (p: Player): { x: number; y: number } => ({ x: p.x + p.face * 3, y: p.y - 9 });
export function muzzle(a: number): { x: number; y: number } {
  const gp = gunPivot(G.p), len = GUN_SPECS[WEAPONS[activeGunId()].sprite][0] - 3;
  return { x: gp.x + Math.cos(a) * len, y: gp.y + Math.sin(a) * len };
}
/** Точка вылета снарядов и лучей: у рукояти, а не у среза ствола — иначе враг вплотную оказывается «за» пулей. */
function origin(a: number): { x: number; y: number } {
  const gp = gunPivot(G.p);
  return { x: gp.x + Math.cos(a) * 2, y: gp.y + Math.sin(a) * 2 };
}
interface ProjOpts { life?: number; pierce?: number; slow?: number; knock?: number; src?: WeaponId }
export function bullet(kind: BulletKind, x: number, y: number, a: number, spd: number, dmg: number, o: ProjOpts = {}): Bullet {
  const b: Bullet = { kind, x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: o.life ?? .9, dmg, pierce: o.pierce ?? 0, hits: new Set(), slow: o.slow ?? 0, knock: o.knock ?? 40, rot: 0, src: o.src };
  G.bullets.push(b);
  return b;
}
/** Снаряд из ствола пушки в руках. Пули и скобы получают пробитие от перка. */
function proj(kind: BulletKind, a: number, spd: number, dmg: number, o: ProjOpts = {}): Bullet {
  const m = origin(a);
  return bullet(kind, m.x, m.y, a, spd, dmg, { src: activeGunId(), ...o, pierce: (o.pierce ?? 0) + (kind === 'b' || kind === 'staple' ? G.mods.pierce : 0) });
}
function grenade(tx: number, ty: number, dur: number, dmg: number): void {
  const m = muzzle(G.p.ang);
  G.bullets.push({ kind: 'grenade', x0: m.x, y0: m.y, x: m.x, y: m.y, tx, ty, t: 0, dur, dmg, life: 9, vx: 0, vy: 0, pierce: 0, hits: new Set(), slow: 0, knock: 0, rot: 0, src: 'captcha' });
}
const shake = (v: number): void => { G.shake = Math.max(G.shake, v); };

/** Луч от (x, y) по направлению (ux, uy). Возвращает задетых врагов, ближний — первый. */
function beamSeg(x: number, y: number, ux: number, uy: number, len: number, type: 'laser' | 'rail', dmg: (e: Enemy, first: boolean) => number, src: WeaponId, bounces = 0): Enemy[] {
  let L = len, stopAt: { x: number; y: number } | null = null;
  const burnt = new Set();
  for (let s = 3; s < len; s += 3) {
    const pr = propAt(x + ux * s, y + uy * s + 9);
    if (pr && !burnt.has(pr)) {
      burnt.add(pr);
      damageProp(pr, type === 'rail' ? 20 : .5);
      if (type === 'laser') { L = s; stopAt = { x: x + ux * s, y: y + uy * s }; break; }
    }
  }
  const knock = type === 'rail' ? 140 : 70;
  const hit: { e: Enemy; t: number }[] = [];
  for (const e of G.enemies) {
    if (e.dead) continue;
    const bx = e.x - x, by = bodyY(e) - y, t = bx * ux + by * uy;
    // враг вплотную (даже чуть позади точки вылета) тоже задет
    if (t < -e.hr || t > L) continue;
    if (Math.abs(bx * uy - by * ux) < e.hr) hit.push({ e, t });
  }
  hit.sort((a, b) => a.t - b.t);
  hit.forEach(({ e }, i) => hitEnemy(e, dmg(e, i === 0), ux * knock, uy * knock, { src }));
  const life = type === 'rail' ? .3 : .06;
  // рисуем от среза ствола, а бьём от рукояти
  G.beams.push({ x0: x + ux * 6, y0: y + uy * 6, x1: x + ux * L, y1: y + uy * L, t: life, max: life, type });
  // лазер ур. 3: одно отражение от укрытия
  if (stopAt && bounces > 0) {
    const flipX = !!propAt(stopAt.x - ux * 3, stopAt.y + 9);
    const nx = flipX ? ux : -ux, ny = flipX ? -uy : uy;
    beamSeg(stopAt.x - ux * 2, stopAt.y - uy * 2, nx, ny, len - L, type, e => dmg(e, false), src, bounces - 1);
  }
  return hit.map(h => h.e);
}

// ---------- механики отдельных пушек ----------
/** Лазер: нагрев цели, урон до ×3. */
function laser(a: number, dm: number, L: number): void {
  const p = G.p, m = origin(a), rate = WEAPONS.laser.rate;
  beamSeg(m.x, m.y, Math.cos(a), Math.sin(a), 170, 'laser', (e, first) => {
    if (!first) return .6 * dm;
    // нагрев до максимума за 1,25 с на одной цели
    if (p.heatTarget === e) p.heat = Math.min(2, p.heat + rate * 1.6);
    else { p.heat = L >= 5 ? p.heat * .8 : 0; p.heatTarget = e; }
    return .6 * dm * (1 + p.heat);
  }, 'laser', L >= 3 ? 1 : 0);
}

/** Рельса: заряд c секунд → урон 12…40. */
function rail(a: number, dm: number, L: number, c: number, spread = 0): void {
  const m = origin(a), k = clamp((c - .3) / .9, 0, 1), dmg = (12 + 28 * k) * dm;
  const hit = beamSeg(m.x, m.y, Math.cos(a + spread), Math.sin(a + spread), 420, 'rail', () => dmg, 'rail');
  for (const e of hit) {
    if (L >= 5 && k >= 1) { e.stun = Math.max(e.stun, isBoss(e) ? .4 : 1); e.stunKind = 'bonk'; }
    if (k >= 1) hitStop(.06);
    // эволюция: попадание бьёт молнией двух ближайших
    if (isEvolved('rail')) { let n = 0; for (const o of G.enemies) { if (n >= 2 || o === e || o.dead || Math.hypot(o.x - e.x, o.y - e.y) > 70) continue; n++; G.beams.push({ x0: e.x, y0: bodyY(e), x1: o.x, y1: bodyY(o), t: .12, max: .12, type: 'link' }); hitEnemy(o, dmg * .4, 0, 0, { src: 'rail' }); } }
    // ур. 3: токенизация — три осколка от каждого попадания
    if (L >= 3) for (let i = -1; i <= 1; i++) { const aa = a + spread + i * .5; bullet('token', e.x + Math.cos(aa) * 6, bodyY(e) + Math.sin(aa) * 6, aa, 300, 2 * dm, { life: .35, knock: 30, src: 'rail' }).hits.add(e); }
  }
  shake(2 + 3 * k);
}

/** Молния: ищет цель в конусе и прыгает по ближайшим. */
function link(a: number, dmg: number, jumps: number, stun: boolean): void {
  const m = origin(a);
  let best: Enemy | null = null, bs = 1e9;
  for (const e of G.enemies) {
    if (e.dead || e.charm > 0) continue;
    const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy);
    if (d > 150) continue;
    const da = angDiff(Math.atan2(dy, dx), a);
    if (da > .6) continue;
    if (d + da * 80 < bs) { bs = d + da * 80; best = e; }
  }
  if (!best) { G.beams.push({ x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * 50, y1: m.y + Math.sin(a) * 50, t: .08, max: .08, type: 'link' }); return; }
  const hit = new Set<Enemy>();
  let from = { x: m.x, y: m.y }, target: Enemy | null = best;
  for (let k = 0; k <= jumps && target; k++) {
    const ty = bodyY(target);
    G.beams.push({ x0: from.x, y0: from.y, x1: target.x, y1: ty, t: .12, max: .12, type: 'link' });
    hit.add(target); hitEnemy(target, dmg, 0, 0, { src: 'link' }); from = { x: target.x, y: ty };
    if (stun && !target.dead) target.stun = Math.max(target.stun, .3);
    let nb: Enemy | null = null, nd = 75;
    for (const e of G.enemies) { if (e.dead || hit.has(e) || e.charm > 0) continue; const d = Math.hypot(e.x - from.x, bodyY(e) - from.y); if (d < nd) { nd = d; nb = e; } }
    target = nb;
  }
}

/** Пылесос: тянет врагов и лут, ест вражеские снаряды. */
function vacuum(a: number, dm: number, L: number): void {
  const m = origin(a), p = G.p;
  const inCone = (x: number, y: number, r: number): boolean => { const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy); return d < 12 || (d < r && angDiff(Math.atan2(dy, dx), a) < .55); };
  for (const e of G.enemies.slice()) {
    if (e.dead || e.charm > 0 || !inCone(e.x, bodyY(e), 95)) continue;
    const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy) || 1;
    if (!e.heavy) { e.x -= dx / d * 3; e.y -= dy / d * 3; }
    hitEnemy(e, .4 * dm, 0, 0, { noCrit: true, src: 'vacuum' });
  }
  const reach = L >= 3 ? 400 : 150;
  for (const k of G.pickups) { const dx = k.x - p.x, dy = k.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < reach && k.type !== 'weapon') { k.x -= dx / d * 6; k.y -= dy / d * 6; } }
  let eaten = 0;
  G.ebullets = G.ebullets.filter(b => {
    if (b.kind === 'peel' || b.kind === 'bottle' || !inCone(b.x, b.y, 95)) return true;
    eaten++;
    // ур. 5: всосанное летит обратно
    if (L >= 5) bullet('b', m.x, m.y, a + rnd(.25), 300, 4 * dm, { life: .8, src: 'vacuum' });
    return false;
  });
  if (eaten) {
    p.vacEaten += eaten;
    const heavy = p.guns.find(s => s && WEAPONS[s.id].cls === 3) ?? null;
    while (p.vacEaten >= 5) { p.vacEaten -= 5; if (heavy) heavy.ammo += 1; }
    sfx('ting', .05);
  }
  for (let i = 0; i < 3; i++) {
    const aa = a + rnd(.5), r = 40 + random() * 55;
    G.parts.push({ x: m.x + Math.cos(aa) * r, y: m.y + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 3, vy: -Math.sin(aa) * r * 3, life: .3, max: .3, color: pick([P.greyL, P.purple, P.white]), size: 1 });
  }
}

function placeMine(dmg: number): void {
  const p = G.p;
  if (G.mines.length >= 10) G.mines.shift();
  G.mines.push({ x: clamp(p.x + p.face * 8, 12, WW - 12), y: clamp(p.y + 3, 16, WH - 10), arm: .4, dmg });
}
/** Подрыв мины; ур. 5 — цепная реакция на соседние. */
export function detonateMine(mn: { x: number; y: number; dmg: number; dead?: boolean }, mult = 1): void {
  if (mn.dead) return;
  mn.dead = true;
  explode(mn.x, mn.y - 4, 32, mn.dmg * mult, { colors: [P.brownL, P.white, P.gold, P.coffee], src: 'mines' });
  if (gunLevel('mines') >= 5) for (const o of G.mines) if (!o.dead && Math.hypot(o.x - mn.x, o.y - mn.y) < 45) later(.08, () => detonateMine(o, 1.5));
}

export function rocketBoom(b: Bullet): void {
  explode(b.x, b.y, isEvolved('rocket') ? 38 : 30, b.dmg + 1, { src: 'rocket' });
  if (gunLevel('rocket') >= 3) G.zones.push({ x: b.x, y: b.y + 4, r: 26, t: 2, max: 2, kind: 'jpeg' });
  if (b.cluster) for (let i = 0; i < 6; i++) { const x = b.x + rnd(30), y = b.y + rnd(20); later(.06 + i * .05, () => explode(x, y, 18, b.dmg * .8, { colors: [P.cyan, P.pink, P.white], src: 'rocket' })); }
}

/** Точка прицела, но не дальше 160 px (дальность броска капчи). */
function throwTarget(): { x: number; y: number } {
  const p = G.p; let tx = p.aimX, ty = p.aimY;
  const d = Math.hypot(tx - p.x, ty - p.y); if (d > 160) { tx = p.x + (tx - p.x) / d * 160; ty = p.y + (ty - p.y) / d * 160; }
  return { x: tx, y: ty };
}

// ---------- основной огонь ----------
interface FireCtx {
  a: number;
  /** множитель урона: уровень пушки × перки × дебаффы */
  dm: number;
  /** уровень пушки */
  L: number;
  /** рельса: секунд заряда */
  charge: number;
  /** несколько снарядов веером (перк «Двойной промпт») */
  multi: (fn: (a: number) => void, spread: number) => void;
}
const FIRE: Record<WeaponId, (c: FireCtx) => void> = {
  makarov: ({ dm, L, multi }) => multi(x => { proj('b', x + rnd(.04), 330, 1.5 * dm, { pierce: (L >= 3 ? 1 : 0) + (isEvolved('makarov') ? 1 : 0) }).streak = true; }, .12),
  mg: ({ dm, L, multi }) => {
    const p = G.p, n = ++p.mgN, spread = .13 * (1 - .6 * p.spin) * (p.moving ? 1.6 : 1);
    multi(x => {
      if (L >= 3 && n % 4 === 0) proj('staple', x + rnd(spread * .5), 300, 1 * dm, { pierce: 1, slow: 1.2 });
      else proj('b', x + rnd(spread), 330, 1 * dm);
    }, .08);
  },
  flame: ({ a, dm }) => { for (let k = 0; k < 2; k++) proj('flame', a + rnd(.3), 140 + rnd(30), .2 * dm, { pierce: 2, life: .35 }); },
  laser: ({ a, dm, L }) => laser(a, dm, L),
  vacuum: ({ a, dm, L }) => vacuum(a, dm, L),
  shotgun: ({ a, dm, L }) => {
    const p = G.p, slug = L >= 3 && ++p.shotN % 3 === 0;
    if (slug) proj('b', a, 420, 8 * dm, { pierce: 4, knock: 220, life: 1 }).crit = true;
    else for (let i = 0; i < 4; i++) proj('b', a + (i - 1.5) * .13 + rnd(.04), 330, 1.8 * dm, { knock: 90 });
    // пятый ствол смотрит назад. так сгенерировалось. на ур. 5 — полная дробь назад
    const back = L >= 5 ? 4 : 1;
    for (let i = 0; i < back; i++) proj('b', a + Math.PI + (i - (back - 1) / 2) * .13 + rnd(.1), 330, 1.8 * dm, { knock: 90 });
    shake(slug ? 3 : 1.5);
  },
  rocket: ({ dm, multi }) => { multi(x => { proj('rocket', x + rnd(.03), 190, 3 * dm, { life: 1.4 }).cluster = isEvolved('rocket'); }, .15); shake(1.5); },
  rail: ({ a, dm, L, charge }) => rail(a, dm, L, charge),
  captcha: ({ dm }) => { const t = throwTarget(); grenade(t.x, t.y + 9, .55, 4 * dm); },
  slipper: ({ dm, multi }) => multi(x => proj('slipper', x + rnd(.2), 170, 4 * dm, { life: 2.2, knock: 120 }), .3),
  link: ({ a, dm, L }) => link(a, 1.7 * dm, L >= 3 ? 5 : 3, L >= 5),
  keyboard: ({ a, dm }) => { proj('kb', a, 190, 3 * dm, { pierce: 999, life: 2, knock: 60 }); },
  nyan: ({ dm, multi }) => multi(x => proj('nyan', x + rnd(.1), 150, 3 * dm, { pierce: 3, life: 3.5, knock: 50 }), .2),
  mines: ({ dm }) => placeMine(15 * dm)
};

/** Множитель урона пушки: уровень, перки, дебаффы; Макаров ещё растёт с уровнем Геннадия. */
export function gunDmg(id: WeaponId): number {
  const p = G.p;
  return levelDmg(gunLevel(id)) * G.mods.dmg * (p.mogged ? .7 : 1) * (id === 'makarov' ? 1 + .06 * (p.level - 1) : 1) * (G.mod === 'glass' ? 2 : 1);
}

const NO_FLASH = new Set<WeaponId>(['laser', 'rail', 'link', 'vacuum', 'mines']);
const HEAVY_RECOIL = new Set<WeaponId>(['rocket', 'rail', 'shotgun']);
const LOOP_SFX = new Set<WeaponId>(['laser', 'flame', 'vacuum']);
/** У кого вылетают гильзы. */
const CASINGS = new Set<WeaponId>(['makarov', 'mg', 'shotgun']);

function shoot(charge = 0): void {
  const p = G.p, slot = curSlot(), id = activeGunId(), d = WEAPONS[id], L = gunLevel(id);
  p.fireT = d.rate / levelRate(L) / G.mods.rate * (p.guilt ? 2 : 1) * (p.timeSlow ? 1.4 : 1) / (p.sugar > 0 ? 1.6 : 1) / (id === 'mg' ? 1 + p.spin * (isEvolved('mg') ? 2 : 1) : 1);
  if (id !== 'makarov' && id === slot.id) {
    slot.ammo -= d.perShot;
    if (slot.ammo <= 0) { slot.ammo = 0; say(p.x, p.y - 26, 'ПАТРОНЫ КОНЧИЛИСЬ', P.pink); cycleGun(1); }
  }
  const n = 1 + G.mods.proj, a = p.ang;
  FIRE[id]({ a, dm: gunDmg(id), L, charge, multi: (fn, spread) => { for (let i = 0; i < n; i++) fn(a + (i - (n - 1) / 2) * spread); } });
  sfx(d.sfx, LOOP_SFX.has(id) ? .06 : .025);
  p.recoil = HEAVY_RECOIL.has(id) ? 3 : 1.5;
  if (!NO_FLASH.has(id)) { const m = muzzle(a); G.parts.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: .05, max: .05, color: P.white, size: HEAVY_RECOIL.has(id) ? 5 : 3, flash: true }); }
  if (CASINGS.has(id)) { const gp = gunPivot(p); casing(gp.x, gp.y, a, p.face); }
}

/** Курок на этом тике: раскрутка пулемёта, нагрев лазера, заряд рельсы, обычная стрельба. */
export function updateTrigger(dt: number, held: boolean): void {
  const p = G.p, id = activeGunId(), canFire = p.dashT <= 0 && !inStandup();
  if (id === 'mg' && held && canFire) { p.spin = Math.min(1, p.spin + dt / .6); p.spinHold = isEvolved('mg') ? 1e9 : gunLevel('mg') >= 5 ? 2 : 0; }
  else if (p.spinHold > 0) p.spinHold -= dt;
  else p.spin = Math.max(0, p.spin - dt * 2);
  if (!(id === 'laser' && held)) p.heat = Math.max(0, p.heat - dt * (gunLevel('laser') >= 5 ? .5 : 2));
  p.fireT -= dt;
  if (id === 'rail') {
    if (held && canFire && p.fireT <= 0) {
      p.charge = Math.min(1.2, p.charge + dt * (isEvolved('rail') ? 2 : 1));
      if (random() < .5) { const m = muzzle(p.ang); G.parts.push({ x: m.x + rnd(3), y: m.y + rnd(3), vx: 0, vy: 0, life: .15, max: .15, color: p.charge >= 1.2 ? P.white : P.purple, size: 1 }); }
    } else if (!held && p.charge > 0) { shoot(Math.max(.3, p.charge)); p.charge = 0; }
    return;
  }
  p.charge = 0;
  if (held && canFire && p.fireT <= 0) shoot();
}

// ---------- альт-огонь ----------
interface AltCtx { a: number; dm: number; ux: number; uy: number; m: { x: number; y: number } }
/** Вражеская пуля, развёрнутая против врагов. */
export const reflectBullet = (x: number, y: number, a: number, dmg: number, pierce: number, knock: number): Bullet => bullet('b', x, y, a, 260, dmg, { life: .8, pierce, knock });
const ALT_FIRE: Record<WeaponId, (c: AltCtx) => void> = {
  makarov: ({ dm }) => { for (let i = 0; i < 3; i++) later(i * .06, () => { const b = proj('b', G.p.ang + rnd(.02), 420, 3 * dm, { pierce: 1, src: 'makarov' }); b.streak = true; b.crit = true; sfx('pistol', .01); }); },
  mg: ({ a, ux }) => { const p = G.p; G.allies.push({ kind: 'turret', x: clamp(p.x + ux * 12, 12, WW - 12), y: clamp(p.y + 4, 16, WH - 10), t: 6, fire: 0, ang: a, face: ux >= 0 ? 1 : -1, talk: 99 }); sfx('ally'); },
  flame: ({ ux, uy }) => { const p = G.p; for (let i = 0; i < 6; i++) G.zones.push({ x: clamp(p.x + ux * (20 + i * 14), 10, WW - 10), y: clamp(p.y + uy * (20 + i * 14), 14, WH - 8), r: 12, t: 4, max: 4, kind: 'pfire' }); sfx('flame'); },
  laser: ({ a, dm }) => { const m = origin(a); beamSeg(m.x, m.y, Math.cos(a), Math.sin(a), 260, 'rail', () => 6 * dm, 'laser'); sfx('rewind'); },
  vacuum: ({ a, dm, m }) => {
    const p = G.p;
    for (const e of G.enemies.slice()) { const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy) || 1; if (d < 110 && angDiff(Math.atan2(dy, dx), a) < .8) hitEnemy(e, 3 * dm, dx / d * 260, dy / d * 260, { src: 'vacuum' }); }
    for (let i = 0; i < 8; i++) proj('b', a + rnd(.35), 280, 2 * dm, { life: .6 });
    say(p.x, p.y - 30, 'ВЫДУВ МУСОРА', P.greyL); sfx('shotgun');
  },
  shotgun: ({ dm }) => {
    const p = G.p;
    for (const e of G.enemies.slice()) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 75) hitEnemy(e, 8 * dm, dx / d * 240, dy / d * 240, { src: 'shotgun' }); }
    ring(p.x, p.y - 8, P.paper, 75, .4); say(p.x, p.y - 30, 'ЗНАНИЕ — СИЛА', P.paper, true); sfx('book');
  },
  rocket: ({ a, dm }) => { proj('rocket', a, 190, 3 * dm, { life: .7 }).cluster = true; sfx('rocket'); },
  rail: ({ a, dm }) => { for (const k of [-.15, 0, .15]) rail(a, dm, gunLevel('rail'), .75, k); sfx('rail'); },
  captcha: ({ a, dm }) => {
    const p = G.p, d = Math.min(160, Math.hypot(p.aimX - p.x, p.aimY - p.y));
    for (let i = -2; i <= 2; i++) { const aa = a + i * .25; grenade(p.x + Math.cos(aa) * d, p.y + Math.sin(aa) * d + 9, .55 + Math.abs(i) * .05, 1 * dm); }
    sfx('captcha');
  },
  slipper: ({ a, dm }) => { const p = G.p; const b = bullet('orbit', p.x, p.y, 0, 0, 3 * dm, { life: 4, pierce: 999, knock: 90, src: 'slipper' }); b.oa = a; b.hitT = .3; say(p.x, p.y - 30, 'БАБУШКИН ВЕРТОЛЁТ', P.pink, true); sfx('slip'); },
  link: ({ a, dm }) => { link(a, 1.2 * dm, 10, gunLevel('link') >= 5); sfx('zap'); },
  keyboard: ({ a, dm }) => { for (const k of [-.3, 0, .3]) proj('kb', a + k, 190, 2 * dm, { pierce: 999, life: 2, knock: 60 }); sfx('kbd'); },
  nyan: ({ a, dm }) => { proj('nyan', a, 130, 5 * dm, { pierce: 14, life: 7, knock: 80 }).mega = true; sfx('nyan'); },
  mines: () => {
    const p = G.p;
    G.mines.forEach((mn, i) => later(i * .05, () => detonateMine(mn)));
    say(p.x, p.y - 30, 'ВСЕ COOKIES ПРИНЯТЫ', P.brownL, true);
  }
};
/** Пушки, у которых своя надпись. */
const ALT_SILENT = new Set<WeaponId>(['shotgun', 'vacuum', 'mines', 'slipper']);
export function altFire(): void {
  const p = G.p, slot = curSlot(), id = activeGunId();
  if (id !== slot.id || p.dashT > 0) return;
  const A = WEAPONS[id].alt;
  if ((slot.altCd ?? 0) > 0) return;
  if (id !== 'makarov' && slot.ammo < A.cost) { say(p.x, p.y - 26, `нужно ${A.cost} патронов`, P.pink); return; }
  slot.altCd = A.cd; if (id !== 'makarov') slot.ammo -= A.cost;
  const a = p.ang;
  ALT_FIRE[id]({ a, dm: gunDmg(id), ux: Math.cos(a), uy: Math.sin(a), m: muzzle(a) });
  if (!ALT_SILENT.has(id)) say(p.x, p.y - 26, A.name, P.cyan);
}

/** Поджечь врага (огнемёт): +1 стак горения, до 3. */
export function ignite(e: Enemy, stacks = 1, dur = 3): void {
  e.burnS = Math.min(isEvolved('flame') ? 5 : 3, (e.burnS ?? 0) + stacks);
  e.burnDur = Math.max(e.burnDur ?? 0, dur);
  e.burnTick ??= .5;
}
