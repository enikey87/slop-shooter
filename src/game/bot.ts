// Простой бот для тестов и симулятора баланса: кружит вокруг центра, стреляет в ближайшего, жмёт способности.
import { G } from './world';
import { bodyY, isBoss } from './body';
import { WEAPONS, type WeaponId } from '../content/weapons';
import { activeGunId, slotFor } from './inventory';

/** Комфортная дистанция для ближнебойных пушек. */
const KEEP: Partial<Record<WeaponId, number>> = { flame: 40, shotgun: 45, vacuum: 60 };
import type { Action, TickInput } from './input';
import { WW, WH } from './state';

export interface BotOpts { abilities?: boolean; dash?: boolean }
/** Где бот был недавно — чтобы заметить, что он упёрся. */
const stuck = { x: 0, y: 0, t: 0, side: 0 };

export function botInput(o: BotOpts = {}): TickInput {
  const p = G.p;
  let tg = null, td = 1e9;
  for (const e of G.enemies) {
    if (e.dead || e.charm > 0 || e.disguised) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < td) { td = d; tg = e; }
  }
  // гнёзда и снайперы — в приоритете, если вплотную никого
  if (td > 60) for (const e of G.enemies) if ((e.type === 'printer' || e.type === 'mona') && !e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 250) { tg = e; break; }
  // последние враги волны — идём искать, а не кружим в центре
  const hunt = tg && !G.boss && !G.queue.length && G.enemies.length <= 3 && td > 150;
  // держим дистанцию под пушку в руках и не липнем к стенам
  // к боссам и толстым вплотную не лезем даже с огнемётом
  const keep = tg && (isBoss(tg) || tg.heavy) ? 90 : KEEP[activeGunId()] ?? 90;
  let mx = WW / 2 - p.x, my = WH / 2 - p.y;
  if (tg && td < keep) { mx = p.x - tg.x; my = p.y - tg.y; }
  else if (tg && ((keep < 90 && td > keep * 1.4) || hunt)) { mx = (tg.x - p.x) * 2; my = (tg.y - p.y) * 2; }
  const t = G.t * .7;
  mx += Math.cos(t) * 60; my += Math.sin(t) * 60;
  const actions: Action[] = [];
  if (o.dash && tg && td < 30 && p.dashCd <= 0) actions.push('dash');
  if (o.abilities) {
    if (p.cdQ <= 0 && G.enemies.length > 6) actions.push('q');
    if (p.cdE <= 0 && p.hp < G.mods.maxHp * .6) actions.push('e');
    if (p.ult >= 100) actions.push('r');
    if (p.cdC <= 0 && G.enemies.length > 3) actions.push('c');
    if (p.cdV <= 0 && p.hp < G.mods.maxHp * .3) actions.push('v');
    if (p.cdG <= 0 && G.enemies.length > 8) actions.push('g');
    if (p.guilt) actions.push('f');
  }
  // пушки на полу: подходим, если рядом спокойно; берём, если своя в этом слоте почти пустая
  const w = G.pickups.find(k => k.type === 'weapon');
  if (w && (!tg || td > 70)) { mx = w.x - p.x; my = w.y - p.y; }
  if (w && Math.hypot(w.x - p.x, w.y - p.y) < 14) {
    const own = p.guns[slotFor(w.gun!)];
    if (own && own.ammo < WEAPONS[own.id].box * .25) actions.push('take');
  }
  // портал на следующий уровень открыт — идём в него
  if (G.exit && (!tg || td > 50)) { mx = G.exit.x - p.x; my = G.exit.y - p.y; }
  // самый тяжёлый слот с патронами
  for (let i = p.guns.length - 1; i >= 0; i--) { const s = p.guns[i]; if (s && s.ammo > 0 && !s.stolen) { if (i !== p.cur) actions.push({ slot: i }); break; } }
  // застрял об укрытие — полсекунды обходим его вбок
  if (G.t < stuck.t) { stuck.t = G.t; stuck.side = 0; } // новый забег
  const moved = Math.hypot(p.x - stuck.x, p.y - stuck.y);
  if (G.t - stuck.t > .8) { if (moved < 4) stuck.side = G.t + .6; stuck.x = p.x; stuck.y = p.y; stuck.t = G.t; }
  if (G.t < stuck.side) { const t2 = mx; mx = -my; my = t2; }
  const ml2 = Math.hypot(mx, my) || 1;
  const aim = tg ? { x: tg.x - G.cam.x, y: bodyY(tg) - G.cam.y } : null;
  // рельса стреляет на отпускании: держим до полного заряда
  const fire = !!tg && !(p.guns[p.cur]?.id === 'rail' && p.charge >= 1.2);
  return { mx: mx / ml2, my: my / ml2, aim, fire, actions };
}
