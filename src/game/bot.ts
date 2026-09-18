// Простой бот для тестов и симулятора баланса: кружит вокруг центра, стреляет в ближайшего, жмёт способности.
import { G } from './world';
import { bodyY } from './body';
import type { Action, TickInput } from './input';
import { WW, WH } from './state';

export interface BotOpts { abilities?: boolean; dash?: boolean }

export function botInput(o: BotOpts = {}): TickInput {
  const p = G.p;
  let tg = null, td = 1e9;
  for (const e of G.enemies) {
    if (e.dead || e.charm > 0 || e.disguised) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < td) { td = d; tg = e; }
  }
  // держимся на дистанции от ближайшего и не липнем к стенам
  let mx = WW / 2 - p.x, my = WH / 2 - p.y;
  if (tg && td < 90) { mx = p.x - tg.x; my = p.y - tg.y; }
  const t = G.t * .7;
  mx += Math.cos(t) * 60; my += Math.sin(t) * 60;
  const ml = Math.hypot(mx, my) || 1;
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
  // лучшая пушка с патронами
  for (let i = p.guns.length - 1; i > 0; i--) if (p.guns[i].ammo > 0 && !p.guns[i].stolen) { if (i !== p.cur) actions.push({ slot: i }); break; }
  const aim = tg ? { x: tg.x - G.cam.x, y: bodyY(tg) - G.cam.y } : null;
  return { mx: mx / ml, my: my / ml, aim, fire: !!tg, actions };
}
