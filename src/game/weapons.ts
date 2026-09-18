// Оружие игрока: слоты, основной огонь каждой пушки и альт-огонь.
import { P } from '../content/palette';
import { WEAPONS, ALT, GUN_SPECS } from '../content/weapons';
import { TAU, R, clamp, angDiff } from '../engine/math';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner, burst, later, ring } from './fx';
import { propAt } from './arena';
import { bodyY } from './body';
import { hitEnemy, explode, damageProp } from './combat';
import { WW, WH, type Bullet, type BulletKind, type GunSlot, type Player } from './state';

// ---------- слоты ----------
export const curSlot = (): GunSlot => G.p.guns[G.p.cur];
/** Реально стреляющая пушка: без пушек (дебафф мамы) или без отобранной — Макаров. */
export function activeGunId(): number { const p = G.p; return p.noGun > 0 || curSlot().stolen ? 0 : curSlot().id; }
export function selectGun(i: number): void { const p = G.p; if (i === p.cur || !p.guns[i]) return; p.cur = i; sfx('click'); }
export function cycleGun(dir: number): void {
  const p = G.p, n = p.guns.length;
  for (let k = 1; k <= n; k++) { const i = (p.cur + dir * k + n * 3) % n; if (p.guns[i].ammo > 0 && !p.guns[i].stolen) { selectGun(i); return; } }
}
export function giveGun(id: number): void {
  const p = G.p;
  let slot = p.guns.find(s => s.id === id);
  const amt = R(WEAPONS[id].pick * G.mods.ammo);
  if (slot) { slot.ammo += amt; say(p.x, p.y - 26, `+${amt} ${WEAPONS[id].short}`, P.cyan); }
  else { slot = { id, ammo: amt, lvl: 0 }; p.guns.push(slot); banner('НОВАЯ ПУШКА', `${WEAPONS[id].name} · клавиша ${p.guns.length === 10 ? 0 : p.guns.length}`, 2.2, P.cyan); }
  p.cur = p.guns.indexOf(slot);
  sfx('gun');
}

// ---------- примитивы выстрела ----------
export const gunPivot = (p: Player): { x: number; y: number } => ({ x: p.x + p.face * 3, y: p.y - 9 });
export function muzzle(a: number): { x: number; y: number } {
  const gp = gunPivot(G.p), len = GUN_SPECS[activeGunId()][0] - 3;
  return { x: gp.x + Math.cos(a) * len, y: gp.y + Math.sin(a) * len };
}
interface ProjOpts { life?: number; pierce?: number; slow?: number; knock?: number; ox?: number }
export function bullet(kind: BulletKind, x: number, y: number, a: number, spd: number, dmg: number, o: ProjOpts = {}): Bullet {
  const b: Bullet = { kind, x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: o.life ?? .9, dmg, pierce: o.pierce ?? 0, hits: new Set(), slow: o.slow ?? 0, knock: o.knock ?? 40, rot: 0 };
  G.bullets.push(b);
  return b;
}
function proj(kind: BulletKind, a: number, spd: number, dmg: number, o: ProjOpts = {}): Bullet {
  const m = muzzle(a), ox = o.ox ? -Math.sin(a) * o.ox : 0, oy = o.ox ? Math.cos(a) * o.ox : 0;
  return bullet(kind, m.x + ox, m.y + oy, a, spd, dmg, { ...o, pierce: (o.pierce ?? 0) + (kind === 'b' || kind === 'staple' ? G.mods.pierce : 0) });
}
function grenade(tx: number, ty: number, dur: number, dmg: number): void {
  const m = muzzle(G.p.ang);
  G.bullets.push({ kind: 'grenade', x0: m.x, y0: m.y, x: m.x, y: m.y, tx, ty, t: 0, dur, dmg, life: 9, vx: 0, vy: 0, pierce: 0, hits: new Set(), slow: 0, knock: 0, rot: 0 });
}
function beam(a: number, len: number, dmg: number, type: 'laser' | 'rail'): void {
  const m = muzzle(a), ux = Math.cos(a), uy = Math.sin(a);
  let L = len;
  const burnt = new Set();
  for (let s = 0; s < len; s += 3) {
    const pr = propAt(m.x + ux * s, m.y + uy * s + 9);
    if (pr && !burnt.has(pr)) {
      burnt.add(pr);
      damageProp(pr, type === 'rail' ? 20 : .5);
      if (type === 'laser') { L = s; break; }
    }
  }
  const knock = type === 'rail' ? 140 : 70;
  for (const e of G.enemies.slice()) {
    if (e.dead) continue;
    const bx = e.x - m.x, by = bodyY(e) - m.y, t = bx * ux + by * uy;
    if (t < 0 || t > L) continue;
    if (Math.abs(bx * uy - by * ux) < e.hr) hitEnemy(e, dmg, ux * knock, uy * knock);
  }
  const life = type === 'rail' ? .3 : .06;
  G.beams.push({ x0: m.x, y0: m.y, x1: m.x + ux * L, y1: m.y + uy * L, t: life, max: life, type });
  if (type === 'rail') G.shake = Math.max(G.shake, 3);
}
/** Молния: ищет цель в конусе и прыгает по ближайшим. */
function link(a: number, dmg: number, jumps: number): void {
  const m = muzzle(a);
  let best = null, bs = 1e9;
  for (const e of G.enemies) {
    if (e.dead || e.charm > 0) continue;
    const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy);
    if (d > 150) continue;
    const da = angDiff(Math.atan2(dy, dx), a);
    if (da > .6) continue;
    if (d + da * 80 < bs) { bs = d + da * 80; best = e; }
  }
  if (!best) { G.beams.push({ x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * 50, y1: m.y + Math.sin(a) * 50, t: .08, max: .08, type: 'link' }); return; }
  const hit = new Set();
  let from = { x: m.x, y: m.y }, target: typeof best | null = best;
  for (let k = 0; k <= jumps && target; k++) {
    const ty = bodyY(target);
    G.beams.push({ x0: from.x, y0: from.y, x1: target.x, y1: ty, t: .12, max: .12, type: 'link' });
    hit.add(target); hitEnemy(target, dmg, 0, 0); from = { x: target.x, y: ty };
    let nb = null, nd = 75;
    for (const e of G.enemies) { if (e.dead || hit.has(e) || e.charm > 0) continue; const d = Math.hypot(e.x - from.x, bodyY(e) - from.y); if (d < nd) { nd = d; nb = e; } }
    target = nb;
  }
}
function vacuum(a: number, dmg: number): void {
  const m = muzzle(a), p = G.p;
  for (const e of G.enemies.slice()) {
    if (e.dead || e.charm > 0) continue;
    const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy) || 1;
    if (d > 95 || angDiff(Math.atan2(dy, dx), a) > .55) continue;
    if (!e.heavy) { e.x -= dx / d * 3; e.y -= dy / d * 3; }
    hitEnemy(e, dmg, 0, 0, true);
  }
  for (const k of G.pickups) { const dx = k.x - p.x, dy = k.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 150) { k.x -= dx / d * 6; k.y -= dy / d * 6; } }
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
export function rocketBoom(b: Bullet): void {
  explode(b.x, b.y, 30, b.dmg + 1);
  if (b.cluster) for (let i = 0; i < 6; i++) { const x = b.x + rnd(30), y = b.y + rnd(20); later(.06 + i * .05, () => explode(x, y, 18, b.dmg * .8, { colors: [P.cyan, P.pink, P.white] })); }
}
const shake = (v: number): void => { G.shake = Math.max(G.shake, v); };
/** Точка прицела, но не дальше 160 px (дальность броска капчи). */
function throwTarget(): { x: number; y: number } {
  const p = G.p; let tx = p.aimX, ty = p.aimY;
  const d = Math.hypot(tx - p.x, ty - p.y); if (d > 160) { tx = p.x + (tx - p.x) / d * 160; ty = p.y + (ty - p.y) / d * 160; }
  return { x: tx, y: ty };
}

// ---------- основной огонь: индекс = id пушки из WEAPONS ----------
type Fire = (a: number, dm: number, multi: (fn: (a: number) => void, spread: number) => void) => void;
const RANDOM_POOL = [0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18];
const FIRE: Fire[] = [
  /* 0 Макаров */ (_a, dm, multi) => multi(x => proj('b', x + rnd(.05), 330, 1 * dm), .12),
  /* 1 дробовик */ (a, dm) => {
    for (let i = 0; i < 4; i++) proj('b', a + (i - 1.5) * .15 + rnd(.04), 330, 1.5 * dm);
    proj('b', a + Math.PI + rnd(.1), 330, 1.5 * dm); // пятый ствол смотрит назад. так сгенерировалось
    shake(1.5);
  },
  /* 2 пулемёт */ (_a, dm, multi) => multi(x => proj('b', x + rnd(.13), 330, 1 * dm), .08),
  /* 3 ракетница */ (_a, dm, multi) => { multi(x => proj('rocket', x + rnd(.03), 190, 3 * dm, { life: 1.4 }), .15); shake(1.5); },
  /* 4 лазер */ (a, dm) => beam(a, 170, .7 * dm, 'laser'),
  /* 5 капча */ (_a, dm) => { const t = throwTarget(); grenade(t.x, t.y + 9, .55, 2 * dm); },
  /* 6 степлер */ (_a, dm, multi) => multi(x => proj('staple', x + rnd(.06), 300, .8 * dm, { pierce: 1, slow: 1.2 }), .1),
  /* 7 огнемёт */ (a, dm) => { for (let k = 0; k < 2; k++) proj('flame', a + rnd(.3), 140 + rnd(30), .3 * dm, { pierce: 2, life: .35 }); },
  /* 8 книга */ (_a, dm, multi) => multi(x => proj('book', x, 170, 6 * dm, { pierce: 99, knock: 160, life: 1.4 }), .2),
  /* 9 рельса */ (a, dm) => beam(a, 420, 14 * dm, 'rail'),
  /* 10 рандом */ (a, dm) => {
    const id2 = pick(RANDOM_POOL);
    fireWeapon(id2, a, dm * 1.2); sfx(WEAPONS[id2].sfx);
    if (random() < .08) say(G.p.x, G.p.y - 26, pick(['перегенерировал', 'вот другой вариант', 'ещё вариант!']), P.pink);
  },
  /* 11 молния */ (a, dm) => link(a, 1.7 * dm, 3),
  /* 12 клавиатура */ (a, dm) => { proj('kb', a, 190, 2 * dm, { pierce: 999, life: 2, knock: 60 }); },
  /* 13 пылесос */ (a, dm) => vacuum(a, .4 * dm),
  /* 14 cookies */ (_a, dm) => placeMine(5 * dm),
  /* 15 тапок */ (_a, dm, multi) => multi(x => proj('slipper', x + rnd(.2), 170, 4 * dm, { life: 2.2, knock: 120 }), .3),
  /* 16 токен */ (a, dm) => { proj('token', a, 520, 8 * dm, { life: .8, knock: 80 }); shake(2); },
  /* 17 гитара */ (a, dm) => { proj('sonic', a, 170, 2.5 * dm, { pierce: 999, life: .6, knock: 110 }); },
  /* 18 нян */ (_a, dm, multi) => multi(x => proj('nyan', x + rnd(.1), 150, 2 * dm, { pierce: 3, life: 3.5, knock: 50 }), .2)
];
function fireWeapon(id: number, a: number, dm: number): void {
  const n = 1 + G.mods.proj;
  FIRE[id](a, dm, (fn, spread) => { for (let i = 0; i < n; i++) fn(a + (i - (n - 1) / 2) * spread); });
}

const NO_FLASH = new Set([4, 9, 11, 13, 14]);
const HEAVY_RECOIL = new Set([3, 8, 9, 16]);
const LOOP_SFX = new Set([4, 7, 13]);
export function shoot(): void {
  const p = G.p, slot = curSlot(), id = activeGunId();
  const lvl = id === slot.id ? slot.lvl : 0;
  p.fireT = WEAPONS[id].rate / (1 + .12 * lvl) / G.mods.rate * (p.guilt ? 2 : 1) * (p.timeSlow ? 1.4 : 1) / (p.sugar > 0 ? 1.6 : 1);
  if (id !== 0 && id === slot.id) {
    slot.ammo--;
    if (slot.ammo <= 0) { slot.ammo = 0; say(p.x, p.y - 26, 'ПАТРОНЫ КОНЧИЛИСЬ', P.pink); cycleGun(1); if (curSlot().ammo <= 0) p.cur = 0; }
  }
  fireWeapon(id, p.ang, (1 + .25 * lvl) * G.mods.dmg * (p.mogged ? .7 : 1));
  if (id !== 10) sfx(WEAPONS[id].sfx, LOOP_SFX.has(id) ? .06 : .025);
  p.recoil = HEAVY_RECOIL.has(id) ? 3 : 1.5;
  if (!NO_FLASH.has(id)) { const m = muzzle(p.ang); G.parts.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: .05, max: .05, color: P.white, size: 3, flash: true }); }
}

// ---------- альт-огонь ----------
interface AltCtx { a: number; dm: number; ux: number; uy: number; m: { x: number; y: number } }
/** Вражеская пуля, развёрнутая против врагов. */
export const reflectBullet = (x: number, y: number, a: number, dmg: number, pierce: number, knock: number): Bullet => bullet('b', x, y, a, 260, dmg, { life: .8, pierce, knock });
const ALT_FIRE: ((c: AltCtx) => void)[] = [
  /* 0 */ ({ dm }) => { for (let i = 0; i < 3; i++) later(i * .06, () => { proj('b', G.p.ang + rnd(.02), 420, 3 * dm, { pierce: 1 }); sfx('pistol', .01); }); },
  /* 1 */ ({ a, dm }) => { proj('b', a, 420, 12 * dm, { pierce: 4, knock: 220, life: 1 }); shake(4); sfx('shotgun'); },
  /* 2 */ ({ a, ux }) => { const p = G.p; G.allies.push({ kind: 'turret', x: clamp(p.x + ux * 12, 12, WW - 12), y: clamp(p.y + 4, 16, WH - 10), t: 6, fire: 0, ang: a, face: ux >= 0 ? 1 : -1, talk: 99 }); sfx('ally'); },
  /* 3 */ ({ a, dm }) => { proj('rocket', a, 190, 3 * dm, { life: .7 }).cluster = true; sfx('rocket'); },
  /* 4 */ ({ a, dm }) => { beam(a, 260, 6 * dm, 'rail'); sfx('rewind'); },
  /* 5 */ ({ a, dm }) => {
    const p = G.p, d = Math.min(160, Math.hypot(p.aimX - p.x, p.aimY - p.y));
    for (let i = -2; i <= 2; i++) { const aa = a + i * .25; grenade(p.x + Math.cos(aa) * d, p.y + Math.sin(aa) * d + 9, .55 + Math.abs(i) * .05, 2 * dm); }
    sfx('captcha');
  },
  /* 6 */ ({ a, dm }) => { for (let i = 0; i < 9; i++) proj('staple', a + (i - 4) * .17, 300, .9 * dm, { pierce: 1, slow: 1.5 }); sfx('staple'); },
  /* 7 */ ({ ux, uy }) => { const p = G.p; for (let i = 0; i < 6; i++) G.zones.push({ x: clamp(p.x + ux * (20 + i * 14), 10, WW - 10), y: clamp(p.y + uy * (20 + i * 14), 14, WH - 8), r: 12, t: 4, max: 4, kind: 'pfire' }); sfx('flame'); },
  /* 8 */ ({ dm }) => {
    const p = G.p;
    for (const e of G.enemies.slice()) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 75) hitEnemy(e, 8 * dm, dx / d * 240, dy / d * 240); }
    ring(p.x, p.y - 8, P.paper, 75, .4); say(p.x, p.y - 30, 'ЗНАНИЕ — СИЛА', P.paper, true); sfx('book');
  },
  /* 9 */ ({ a, dm }) => { for (const k of [-.15, 0, .15]) beam(a + k, 420, 14 * dm, 'rail'); sfx('rail'); },
  /* 10 */ ({ dm }) => {
    const p = G.p; let n = 0;
    for (const b of G.ebullets) if (Math.hypot(b.x - p.x, b.y - p.y) < 150 && b.kind !== 'peel' && b.kind !== 'bottle') { reflectBullet(b.x, b.y, Math.atan2(b.y - p.y, b.x - p.x), 2 * dm, 0, 30); n++; burst(b.x, b.y, [P.pink, P.gold, P.cyan], 3, 40); }
    G.ebullets = G.ebullets.filter(b => Math.hypot(b.x - p.x, b.y - p.y) >= 150);
    say(p.x, p.y - 30, n ? `ПЕРЕГЕНЕРИРОВАНО: ${n}` : 'нечего перегенерировать', P.pink, true); sfx('inject');
  },
  /* 11 */ ({ a, dm }) => { link(a, 1.2 * dm, 10); sfx('zap'); },
  /* 12 */ ({ a, dm }) => { for (const k of [-.3, 0, .3]) proj('kb', a + k, 190, 2 * dm, { pierce: 999, life: 2, knock: 60 }); sfx('kbd'); },
  /* 13 */ ({ a, dm, m }) => {
    const p = G.p;
    for (const e of G.enemies.slice()) { const dx = e.x - m.x, dy = bodyY(e) - m.y, d = Math.hypot(dx, dy) || 1; if (d < 110 && angDiff(Math.atan2(dy, dx), a) < .8) hitEnemy(e, 3 * dm, dx / d * 260, dy / d * 260); }
    for (let i = 0; i < 8; i++) proj('b', a + rnd(.35), 280, 2 * dm, { life: .6 });
    say(p.x, p.y - 30, 'ВЫДУВ МУСОРА', P.greyL); sfx('shotgun');
  },
  /* 14 */ () => {
    const p = G.p;
    G.mines.forEach((mn, i) => later(i * .05, () => { if (!mn.dead) { mn.dead = true; explode(mn.x, mn.y - 4, 32, mn.dmg, { colors: [P.brownL, P.white, P.gold] }); } }));
    say(p.x, p.y - 30, 'ВСЕ COOKIES ПРИНЯТЫ', P.brownL, true);
  },
  /* 15 */ ({ a, dm }) => { const p = G.p; const b = bullet('orbit', p.x, p.y, 0, 0, 3 * dm, { life: 4, pierce: 999, knock: 90 }); b.oa = a; b.hitT = .3; say(p.x, p.y - 30, 'БАБУШКИН ВЕРТОЛЁТ', P.pink, true); sfx('slip'); },
  /* 16 */ ({ a, dm }) => { proj('token', a, 520, 8 * dm, { life: 1, pierce: 6, knock: 60 }); shake(3); sfx('snipe'); },
  /* 17 */ ({ dm }) => { for (let i = 0; i < 12; i++) proj('sonic', i / 12 * TAU, 150, 2.5 * dm, { pierce: 999, life: .6, knock: 140 }); sfx('guitar'); },
  /* 18 */ ({ a, dm }) => { proj('nyan', a, 130, 5 * dm, { pierce: 14, life: 7, knock: 80 }).mega = true; sfx('nyan'); }
];
/** Пушки, у которых своя надпись (или она не нужна). */
const ALT_SILENT = new Set([8, 10, 13, 14, 15]);
export function altFire(): void {
  const p = G.p, slot = curSlot(), id = activeGunId();
  if (id !== slot.id || p.dashT > 0) return;
  const A = ALT[id];
  if ((slot.altCd ?? 0) > 0) return;
  if (id && slot.ammo < A.cost) { say(p.x, p.y - 26, `нужно ${A.cost} патронов`, P.pink); return; }
  slot.altCd = A.cd; if (id) slot.ammo -= A.cost;
  const a = p.ang;
  ALT_FIRE[id]({ a, dm: (1 + .25 * slot.lvl) * G.mods.dmg * (p.mogged ? .7 : 1), ux: Math.cos(a), uy: Math.sin(a), m: muzzle(a) });
  if (!ALT_SILENT.has(id)) say(p.x, p.y - 26, A.name, P.cyan);
}
