// Скуф — злой Геннадий через 10 лет. Ф1: гречка и пенное. Ф2: твой же арсенал. Ф3: ложится на диван, после — ярость.
import { P } from '../../content/palette';
import { clamp } from '../../engine/math';
import { random, rnd, pick } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, banner, later } from '../fx';
import { spawnPoint, makeProp } from '../arena';
import { addEnemy, spawnPortal } from '../spawn';
import { mkPickup } from '../pickups';
import { chargeStep } from '../enemies/behaviors';
import { aimAt, eshot, lob } from '../enemies/shots';
import { CD } from '../abilities';
import type { Behavior } from '../enemies/types';
import { WW, WH, type Enemy } from '../state';

function grain(e: Enemy): void {
  const sy = e.y - 30, a0 = aimAt(e.x, sy);
  for (let i = 0; i < 12; i++) eshot('grain', e.x + e.face * 10, sy, a0 + rnd(.5), 70 + random() * 60, 4, 1.8, { r: 2 });
  say(e.x, e.y - 70, 'ГРЕЧКА!', P.brownL); sfx('shotgun', .2);
}
function bottle(e: Enemy): void {
  const p = G.p;
  for (let i = 0; i < 2; i++) lob('bottle', e.x, e.y, clamp(p.x + rnd(20), 12, WW - 12), clamp(p.y + rnd(14), 16, WH - 10), .8 + i * .15, 28);
  say(e.x, e.y - 70, pick(['ЛОВИ ПЕННОЕ', 'ДЕРЖИ, МОЛОДЁЖЬ']), P.gold); sfx('spit', .1);
}
/** Фаза 2: скуф пользуется твоим же арсеналом. */
function mirror(e: Enemy): void {
  const p = G.p, sy = e.y - 30, a0 = aimAt(e.x, sy);
  const eb = (a: number, sp = 150, dmg = 5): void => { eshot('ebullet', e.x + e.face * 12, sy, a, sp, dmg, 2, { r: 2 }); };
  const move = pick(['makarov', 'shotgun', 'rocket', 'slipper', 'makarov', 'shotgun', (e.wifiCd ?? 0) > 0 ? 'rocket' : 'wifi', e.zUsed ? 'slipper' : 'ctrlz', G.enemies.some(x => x.type === 'evasya') ? 'makarov' : 'vasya']);
  switch (move) {
    case 'makarov':
      for (let i = 0; i < 5; i++) later(i * .12, () => { if (!e.dead) { eb(aimAt(e.x, sy) + rnd(.06)); sfx('pistol', .05); } });
      say(e.x, e.y - 70, 'У МЕНЯ ТОЖЕ МАКАРОВ', P.paper); break;
    case 'shotgun':
      for (let i = 0; i < 4; i++) eb(a0 + (i - 1.5) * .16, 130, 7);
      eb(a0 + Math.PI, 130, 7); say(e.x, e.y - 70, 'ПЯТЫЙ СТВОЛ ТОЖЕ НАЗАД', P.paper); sfx('shotgun'); break;
    case 'rocket':
      eshot('erocket', e.x, sy, a0, 90, 14, 3);
      say(e.x, e.y - 70, 'JPEG ДЛЯ ТЕБЯ', P.cyan); sfx('rocket'); break;
    case 'slipper':
      for (let i = 0; i < 3; i++) eshot('eslipper', e.x, sy, a0 + (i - 1) * .6, 110, 8, 3);
      say(e.x, e.y - 70, 'ТАПКОМ ЕГО', P.pink); sfx('slip'); break;
    case 'wifi': {
      e.wifiCd = 12; const m = G.mods;
      p.cdQ = CD.q * m.cd; p.cdE = CD.e * m.cd; p.cdC = CD.c * m.cd; p.cdV = CD.v * m.cd; p.cdG = CD.g * m.cd;
      banner('ОН ОТКЛЮЧИЛ ТЕБЕ WI-FI', 'все способности на перезарядке', 1.8, P.cyan); sfx('emp'); break;
    }
    case 'ctrlz':
      e.zUsed = true; e.hp = Math.min(e.max, e.hp + e.max * .1);
      say(e.x, e.y - 70, 'CTRL+Z (МОЙ)', P.cyan, true); sfx('rewind'); break;
    case 'vasya': {
      const v = addEnemy('evasya', clamp(e.x + e.face * 30, 20, WW - 20), clamp(e.y + 10, 24, WH - 16));
      say(v.x, v.y - 30, 'ЗЛОЙ ДЯДЯ ВАСЯ', P.red, true); sfx('ally'); break;
    }
  }
}

export const skuf: Behavior = (e, s) => {
  const dt = s.dt;
  e.wifiCd = (e.wifiCd ?? 0) - dt;
  if (!e.intro) { e.intro = true; e.cd = 2; say(e.x, e.y - 70, 'ГЕНА, Я — ЭТО ТЫ ЧЕРЕЗ 10 ЛЕТ', P.vest, true); sfx('skuf'); }
  if (random() < dt * .12) say(e.x, e.y - 70, pick(['в наше время слоп был натуральный', 'гречка с сосиской — база', 'ща как дам', 'где мой пульт', 'ты тоже таким станешь']), P.paper);
  if (e.couch && !e.couch.dead) {
    // лежит на диване: лечится и смотрит телек, из которого лезет слоп
    s.vx = s.vy = 0; e.hp = Math.min(e.max, e.hp + e.max * .035 * dt); e.face = 1;
    e.tv = (e.tv ?? 2) - dt;
    if (e.tv <= 0) {
      e.tv = 3.2;
      for (let i = 0; i < 2; i++) { const sp = spawnPoint(30, { x: e.couch.x + 10, y: e.couch.y + 20, r: 50 }); spawnPortal(pick(['hand', 'skibidi', 'sixseven', 'quadro', 'labubu', 'doge'] as const), sp.x, sp.y, .7, false); }
      say(e.x, e.y - 70, 'по телеку опять слоп', P.paper);
    }
    if (random() < dt * 4) G.parts.push({ x: e.x + rnd(10), y: e.y - 50, vx: rnd(6), vy: -14, life: .7, max: .7, color: P.green, size: 1 });
    return;
  }
  if (e.couch && e.couch.dead && !e.enraged) { e.enraged = true; e.couch = null; e.spd *= 1.8; banner('ТЫ СЛОМАЛ МОЙ ДИВАН', 'скуф в ярости', 1.8, P.red); sfx('skuf'); }
  if (!e.couchUsed && e.phase >= 2) {
    e.couchUsed = true;
    const cx = clamp(e.x - 10, 24, WW - 44), cy = clamp(e.y - 30, 30, WH - 40);
    const c = makeProp('couch', cx, cy, 1 + G.wave / 35);
    G.props.push(c); e.couch = c; e.x = cx + 10; e.y = cy + c.h + e.r + 1;
    const sp = spawnPoint(140);
    G.pickups.push({ ...mkPickup(sp.x, sp.y, 'remote'), t: 9999 });
    later(1.5, () => say(sp.x, sp.y - 20, 'ГДЕ-ТО ТУТ ПУЛЬТ', P.gold, true));
    banner('СКУФ ЛЁГ НА ДИВАН', 'сломай диван, пока он не отлежался', 2, P.vest); sfx('skuf');
    return;
  }
  if (chargeStep(e, s, 240, .6, () => { e.cd = 1.2; grain(e); })) return;
  if (e.cd <= 0 && s.d < 260) {
    const phase = e.enraged ? 3 : e.phase + 1;
    if (phase === 1) { e.cd = 2.2; if (random() < .55) grain(e); else bottle(e); }
    else if (phase === 2) { e.cd = 1.7; mirror(e); }
    else { e.cd = 1.4; if (random() < .5) { e.state = 'wind'; e.st = .5; say(e.x, e.y - 70, 'ПУЗОМ!', P.red, true); sfx('charge'); } else grain(e); }
  }
};
