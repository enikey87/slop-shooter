// Активные способности Геннадия: кувырок, Q/E/R/C/V/G и «поздравить деда».
import { P } from '../content/palette';
import { WEAPONS } from '../content/weapons';
import { R, clamp } from '../engine/math';
import { rnd } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner, burst, later, ring } from './fx';
import { isBoss } from './body';
import { hitEnemy, explode, damageProp, killEnemy } from './combat';
import { addEnemy } from './spawn';
import { curSlot, reflectBullet } from './weapons';
import { WW, WH } from './state';

/** Базовые перезарядки, до множителя перка. */
export const CD = { q: 16, e: 20, c: 24, v: 18, g: 26 } as const;
const lv = <T>(L: number, arr: readonly T[]): T => arr[L - 1];

export function dash(): void {
  const p = G.p;
  if (p.dashCd > 0) return;
  p.dashT = .2; p.dashCd = 1.1 * G.mods.dashCd; p.dashId++;
  if (p.cling) {
    for (let i = 0; i < p.cling; i++) { const e = addEnemy('labubu', p.x + rnd(10), p.y + rnd(6)); e.stun = 1; e.kx = rnd(160); e.ky = rnd(160); }
    say(p.x, p.y - 28, 'СТРЯХНУЛ ЛАБУБУ', P.labP); p.cling = 0;
  }
  burst(p.x, p.y, P.paper, 8, 40); sfx('dash');
}

/** Q: Wi-Fi — оглушает всех вокруг; на 3 ур. бьёт и разворачивает пули. */
export function abilityQ(): void {
  const p = G.p, L = G.ab.q, rad = lv(L, [170, 220, 240]);
  if (p.cdQ > 0) return;
  p.cdQ = CD.q * G.mods.cd;
  let n = 0;
  for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < rad) {
    e.stun = isBoss(e) ? 1 + L * .3 : lv(L, [2.6, 3.5, 4]); e.stunKind = n++ < 4 ? 'wifi' : '';
    if (L >= 3) hitEnemy(e, 20 * G.mods.dmg, 0, 0, { noCrit: true });
  }
  if (L >= 3) for (const b of G.ebullets) if (Math.hypot(b.x - p.x, b.y - p.y) < rad && b.kind !== 'peel' && b.kind !== 'bottle') reflectBullet(b.x, b.y, Math.atan2(b.y - p.y, b.x - p.x), 2 * G.mods.dmg, 1, 40);
  G.ebullets = G.ebullets.filter(b => Math.hypot(b.x - p.x, b.y - p.y) > rad);
  ring(p.x, p.y - 8, P.cyan, rad, .5);
  say(p.x, p.y - 30, L >= 3 ? 'WI-FI 6E: ОТРАЖЕНИЕ' : 'WI-FI ОТКЛЮЧЁН', P.cyan, true); sfx('emp');
}

/** E: трава — лечащая зона; на 3 ур. жжёт врагов. */
export function abilityE(): void {
  const p = G.p, L = G.ab.e;
  if (p.cdE > 0) return;
  p.cdE = CD.e * G.mods.cd;
  const t = lv(L, [6, 8, 9]);
  G.zones.push({ x: p.x, y: p.y, r: lv(L, [40, 55, 60]), t, max: t, heal: lv(L, [6, 10, 12]), burn: L >= 3 });
  say(p.x, p.y - 30, L >= 3 ? 'СОРНЯКИ ПРОСНУЛИСЬ' : 'ПОТРОГАЛ ТРАВУ', P.green, true); sfx('grass');
}

/** R: блэкаут — урон всему на экране. Копится убийствами. */
export function abilityR(): void {
  const p = G.p, c = G.cam, v = G.view, L = G.ab.r;
  if (p.ult < 100) return;
  p.ult = 0;
  for (const e of G.enemies.slice()) {
    if (e.x < c.x - 10 || e.x > c.x + v.w + 10 || e.y < c.y - 10 || e.y > c.y + v.h + 30) continue;
    hitEnemy(e, lv(L, [40, 60, 80]) * G.mods.dmg + (isBoss(e) ? e.max * lv(L, [.12, .15, .18]) : 0), 0, 0, { noCrit: true });
    if (L >= 3 && !e.dead) e.stun = isBoss(e) ? 1.2 : 3;
  }
  for (const pr of G.props.slice()) if (pr.x > c.x && pr.x < c.x + v.w && pr.y > c.y && pr.y < c.y + v.h && pr.kind !== 'couch') damageProp(pr, 12);
  G.ebullets = []; G.blackout = .7; G.shake = 8;
  banner('БЛЭКАУТ', L >= 3 ? 'весь район без света' : 'выдернул шнур из датацентра', 1.8, P.white); sfx('ult');
}

/** C: дядя Вася (с 2 ур. с дробовиком, с 3 ур. с Шариком). */
export function abilityC(): void {
  const p = G.p, L = G.ab.c;
  if (p.cdC > 0) return;
  p.cdC = CD.c * G.mods.cd;
  const x = clamp(p.x - p.face * 16, 16, WW - 16), y = clamp(p.y + 4, 20, WH - 12), life = lv(L, [12, 16, 18]);
  G.allies.push({ kind: 'vasya', x, y, t: life, fire: 0, ang: 0, face: p.face, talk: 2, shotgun: L >= 2 });
  if (L >= 3) G.allies.push({ kind: 'dog', x: x + 10, y: y + 6, t: life, fire: 0, ang: 0, face: p.face, talk: 99 });
  burst(x, y - 10, [P.track, P.white, P.gold], 20, 60);
  say(x, y - 30, L >= 3 ? 'ВАСЯ И ШАРИК' : L >= 2 ? 'ВАСЯ С ДРОБОВИКОМ' : 'ДЯДЯ ВАСЯ НА МЕСТЕ', P.cyan, true); sfx('ally');
}

/** V: CTRL+Z — откат позиции и здоровья на 3–5 секунд назад. */
export function abilityV(): void {
  const p = G.p, L = G.ab.v;
  if (p.cdV > 0 || !p.hist.length) return;
  p.cdV = CD.v * G.mods.cd;
  const back = L >= 2 ? 50 : 30, from = Math.max(0, p.hist.length - back), h = p.hist[from];
  for (let i = from; i < p.hist.length; i += 2) G.parts.push({ x: p.hist[i].x, y: p.hist[i].y - 10, vx: 0, vy: -10, life: .6, max: .6, color: P.cyan, size: 2 });
  if (L >= 3) { const ox = p.x, oy = p.y; say(ox, oy - 20, 'ТОЧКА СОХРАНЕНИЯ', P.cyan); later(.35, () => explode(ox, oy - 6, 42, 12 * G.mods.dmg, { colors: [P.cyan, P.white, P.purple] })); }
  if (L >= 2) { const s = curSlot(); if (s.id !== 'makarov') s.ammo += R(WEAPONS[s.id].box * .5); }
  p.x = h.x; p.y = h.y; p.hp = Math.max(p.hp, h.hp); p.inv = .6; p.hist = [];
  say(p.x, p.y - 30, 'CTRL+Z', P.cyan, true); sfx('rewind');
}

/** G: промпт-инъекция — враги вокруг воюют за тебя. */
export function abilityG(): void {
  const p = G.p, L = G.ab.g, rad = lv(L, [120, 170, 190]);
  if (p.cdG > 0) return;
  p.cdG = CD.g * G.mods.cd;
  let n = 0;
  for (const e of G.enemies) if (!isBoss(e) && e.type !== 'oseg' && Math.hypot(e.x - p.x, e.y - p.y) < rad) { e.charm = lv(L, [7, 10, 11]); e.charmBoom = L >= 3; e.disguised = false; n++; }
  ring(p.x, p.y - 8, P.purple, rad, .5);
  say(p.x, p.y - 32, 'IGNORE PREVIOUS INSTRUCTIONS', P.purple, true);
  if (!n) say(p.x, p.y - 20, 'некого переубеждать', P.muted);
  sfx('inject');
}

export function congratulate(): void {
  const p = G.p;
  const g = G.enemies.find(e => e.type === 'grandpa' && !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 36);
  if (!g) return;
  say(g.x, g.y - 30, 'С ДНЁМ РОЖДЕНИЯ, ДЕД!', P.gold, true);
  burst(g.x, g.y - 14, [P.pink, P.gold, P.cyan, P.green, P.white], 40, 80, 2);
  sfx('cheer');
  killEnemy(g, true);
}
