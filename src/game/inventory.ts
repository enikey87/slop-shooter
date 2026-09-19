// Инвентарь: 4 слота по классам, уровни пушек (у типа, не у слота), пушки на полу и ящики с выбором.
import { P } from '../content/palette';
import { WEAPONS, WEAPON_IDS, LEVEL_KILLS, MAX_GUN_LEVEL, type WeaponId } from '../content/weapons';
import { R, clamp } from '../engine/math';
import { random, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner } from './fx';
import { WW, WH, type GunSlot, type Pickup } from './state';

// ---------- слоты ----------
const MAKAROV: GunSlot = { id: 'makarov', ammo: Infinity };
/** Слот в руках. Слот 0 (Макаров) не бывает пустым. */
export const curSlot = (): GunSlot => G.p.guns[G.p.cur] ?? G.p.guns[0] ?? MAKAROV;
const usable = (s: GunSlot | null): s is GunSlot => !!s && s.ammo > 0 && !s.stolen;
/** Реально стреляющая пушка: под «NO GUNS» мамы, без патронов или отобранная — Макаров. */
export function activeGunId(): WeaponId { const p = G.p; return p.noGun > 0 || !usable(curSlot()) ? 'makarov' : curSlot().id; }
export function selectGun(i: number): void { const p = G.p; if (i === p.cur || !usable(p.guns[i] ?? null)) return; p.cur = i; sfx('click'); }
export function cycleGun(dir: number): void {
  const p = G.p, n = p.guns.length;
  for (let k = 1; k <= n; k++) { const i = (p.cur + dir * k + n * 3) % n; if (usable(p.guns[i])) { selectGun(i); return; } }
}
export const ownedSlots = (): GunSlot[] => G.p.guns.filter((s): s is GunSlot => !!s);

// ---------- уровни ----------
export const gunLevel = (id: WeaponId): number => G.gunLvl[id].lvl;
function levelUp(id: WeaponId): void {
  const gl = G.gunLvl[id], d = WEAPONS[id];
  gl.lvl++;
  const what = gl.lvl === 3 ? d.lv3 : gl.lvl === 5 ? d.lv5 : gl.lvl === 4 ? '+20% урона и скорострельность' : '+20% урона';
  banner(`${d.short} УР. ${gl.lvl}`, what, 2.2, gl.lvl % 2 ? P.gold : P.cyan);
  sfx('level');
}
/** Убийство этой пушкой. */
export function gunKill(id: WeaponId): void {
  const gl = G.gunLvl[id];
  gl.xp++;
  while (gl.lvl < MAX_GUN_LEVEL && gl.xp >= LEVEL_KILLS[gl.lvl]) levelUp(id);
}
/** Диск апскейла: +1 уровень пушке в руках. */
export function upgradeCurrent(): void {
  const s = curSlot(), gl = G.gunLvl[s.id];
  if (gl.lvl >= MAX_GUN_LEVEL) { G.score += 20; say(G.p.x, G.p.y - 26, 'пушка на максимуме. она пишет тебе письма', P.cyan); return; }
  gl.xp = Math.max(gl.xp, LEVEL_KILLS[gl.lvl]);
  levelUp(s.id);
  if (s.id !== 'makarov') s.ammo += R(WEAPONS[s.id].box * .5);
}

// ---------- пушки в руки и на пол ----------
/** Положить пушку в её слот. Старая из этого слота падает на пол на 15 секунд. */
export function takeWeapon(id: WeaponId, ammo?: number): void {
  const p = G.p, d = WEAPONS[id], idx = d.cls - 1, old = p.guns[idx];
  if (old && old.id === id) { old.ammo += ammo ?? d.box; say(p.x, p.y - 26, `+${R(ammo ?? d.box)} ${d.short}`, P.cyan); }
  else {
    if (old) G.pickups.push(weaponPickup(p.x - p.face * 10, p.y + 4, old.id, old.ammo, 15));
    p.guns[idx] = { id, ammo: ammo ?? d.box };
    banner(old ? `${d.short} ВМЕСТО ${WEAPONS[old.id].short}` : 'НОВАЯ ПУШКА', `${d.name} · слот ${idx + 1} · ${d.role}`, 2.4, P.cyan);
  }
  p.cur = idx;
  sfx('gun');
}
export function weaponPickup(x: number, y: number, gun: WeaponId, ammo: number, t = 30, group?: number): Pickup {
  return { x: clamp(x, 16, WW - 16), y: clamp(y, 20, WH - 16), type: 'weapon', t, bob: random() * 6, gun, ammo, group };
}

/** Какие пушки предложить: разные классы, в первую очередь те, которых нет и которые не качались. */
function rollOffer(n: number, exclude: WeaponId[] = []): WeaponId[] {
  const owned = new Set(ownedSlots().map(s => s.id));
  const pool = WEAPON_IDS.filter(id => id !== 'makarov' && !exclude.includes(id));
  const out: WeaponId[] = [];
  for (let tries = 0; out.length < n && tries < 60; tries++) {
    const id = pick(pool);
    if (out.includes(id)) continue;
    if (tries < 40 && out.some(o => WEAPONS[o].cls === WEAPONS[id].cls)) continue;
    if (tries < 20 && owned.has(id)) continue;
    out.push(id);
  }
  return out;
}
/** Ящик пушки: разложить n пушек на выбор. Взял одну — остальные исчезают. */
export function offerWeapons(x: number, y: number, n: number, reroll = true): void {
  const group = ++G.offerN, ids = rollOffer(n);
  ids.forEach((id, i) => G.pickups.push({ ...weaponPickup(x + (i - (ids.length - 1) / 2) * 20, y, id, WEAPONS[id].box, 30, group), reroll }));
  say(x, y - 22, n > 2 ? 'ВЫБЕРИ ПУШКУ' : 'ВЫБЕРИ ОДНУ', P.cyan);
}

/** Пушка на полу рядом с игроком. */
export function weaponNear(r = 16): Pickup | null {
  const p = G.p;
  let best: Pickup | null = null, bd = r;
  for (const k of G.pickups) { if (k.type !== 'weapon' || k.t <= 0) continue; const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bd) { bd = d; best = k; } }
  return best;
}
/** Поднять пушку с пола (T или наступить в пустой слот). */
export function pickUpWeapon(k: Pickup): void {
  if (!k.gun) return;
  k.t = 0;
  if (k.group) for (const o of G.pickups) if (o.group === k.group) o.t = 0;
  takeWeapon(k.gun, k.ammo);
}
/** Нажали «взять». */
export function takeNear(): void { const k = weaponNear(); if (k) pickUpWeapon(k); }
/** Нажали «перегенерировать»: один раз заменить пушки в ящике. */
export function rerollNear(): void {
  const k = weaponNear(24);
  if (!k || !k.group || !k.reroll) return;
  const group = G.pickups.filter(o => o.group === k.group && o.t > 0), ids = rollOffer(group.length, group.map(o => o.gun!));
  group.forEach((o, i) => { if (ids[i]) { o.gun = ids[i]; o.ammo = WEAPONS[ids[i]].box; } o.reroll = false; });
  say(k.x, k.y - 22, 'ПЕРЕГЕНЕРИРОВАНО', P.pink); sfx('inject');
}
