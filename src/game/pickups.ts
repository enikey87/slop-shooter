// Лут: создание, притяжение и подбор.
import { P } from '../content/palette';
import { WEAPONS } from '../content/weapons';
import { TAU, R, clamp } from '../engine/math';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner, burst, later } from './fx';
import { propAt, spawnPoint } from './arena';
import { destroyProp } from './combat';
import { addEnemy, spawnPortal } from './spawn';
import { curSlot, giveGun } from './weapons';
import { WW, WH, type Pickup, type PickupType } from './state';

export function mkPickup(x: number, y: number, type: PickupType): Pickup {
  x = clamp(x, 16, WW - 16); y = clamp(y, 20, WH - 16);
  if (propAt(x, y, 6)) { const sp = spawnPoint(0); x = sp.x; y = sp.y; }
  return { x, y, type, t: 18, bob: random() * TAU };
}

export function updatePickups(dt: number): void {
  const p = G.p;
  for (const k of G.pickups) {
    k.t -= dt; k.bob += dt * 4;
    const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy);
    if (d < 40 * G.mods.magnet) { k.x += dx / d * 130 * dt; k.y += dy / d * 130 * dt; }
    if (d < p.r + 6) { k.t = 0; collect(k); }
  }
  G.pickups = G.pickups.filter(k => k.t > 0);
}

function collect(k: Pickup): void {
  const p = G.p, m = G.mods;
  switch (k.type) {
    case 'ammo': {
      const owned = p.guns.filter(s => s.id !== 0);
      if (!owned.length) { G.score += 5; say(p.x, p.y - 26, '+5 лайков (нет пушек под патроны)', P.brownL); }
      else {
        const s = curSlot().id !== 0 ? curSlot() : pick(owned);
        const amt = R(WEAPONS[s.id].pick * .7 * m.ammo); s.ammo += amt;
        say(p.x, p.y - 26, `+${amt} ${WEAPONS[s.id].short}`, P.brownL);
      }
      sfx('pickup');
      break;
    }
    case 'hp': case 'coffee': {
      const v = (k.type === 'hp' ? 25 : 18) * m.heal;
      p.hp = Math.min(m.maxHp, p.hp + v);
      say(p.x, p.y - 26, k.type === 'hp' ? `потрогал траву +${R(v)}%` : `кофе 3 в 1 +${R(v)}%`, P.green); sfx('pickup');
      break;
    }
    case 'gun': {
      const notOwned = WEAPONS.map((_, i) => i).filter(i => i && !p.guns.some(s => s.id === i));
      giveGun(notOwned.length && random() < .75 ? pick(notOwned) : pick(p.guns.filter(s => s.id).map(s => s.id).concat(notOwned).concat([1])));
      break;
    }
    case 'stolen': {
      const sl = p.guns.find(q => q.id === k.gun);
      if (sl) { sl.stolen = false; p.cur = p.guns.indexOf(sl); }
      say(p.x, p.y - 30, `ВЕРНУЛ ${WEAPONS[k.gun ?? 0].short}`, P.cyan, true); sfx('gun');
      break;
    }
    case 'remote': {
      const sk = G.enemies.find(e => e.type === 'skuf' && e.couch && !e.couch.dead);
      if (sk && sk.couch) { destroyProp(sk.couch); sk.stun = 3; sk.stunKind = 'bonk'; say(sk.x, sk.y - 70, 'ТЕЛЕК ВЫКЛЮЧЕН?!', P.red, true); sfx('skuf'); }
      else say(p.x, p.y - 30, 'пульт от телека. бесполезен', P.paper);
      break;
    }
    case 'blindbox': {
      say(p.x, p.y - 30, 'РАСПАКОВКА…', P.labP, true); sfx('unbox');
      const kx = k.x, ky = k.y;
      later(.7, () => {
        if (random() < .3) {
          banner('СЕКРЕТНАЯ ФИГУРКА', '+50 лайков, апскейл и патроны', 2, P.gold); G.score += 50;
          G.pickups.push(mkPickup(kx + 10, ky, 'up'), mkPickup(kx - 10, ky, 'ammo')); sfx('secret');
          burst(kx, ky - 6, [P.gold, P.labP, P.white], 30, 70, 2);
        } else {
          say(kx, ky - 30, pick(['ДУБЛИКАТ', 'обычная серия', 'опять не та', 'ЛАБУБУ ПРОСНУЛИСЬ']), P.labP, true);
          for (let i = 0; i < 3; i++) { const e = addEnemy('labubu', kx + rnd(12), ky + rnd(8)); e.kx = rnd(140); e.ky = rnd(140); }
          sfx('meow');
        }
      });
      break;
    }
    case 'dubai': {
      p.hp = Math.min(m.maxHp, p.hp + 40 * m.heal); p.sugar = 6;
      banner('ДУБАЙСКИЙ ШОКОЛАД', '1500 руб за 100 г · сахарный раш · за тобой очередь', 2.4, P.pist);
      const ex = p.x < WW / 2 ? 24 : WW - 24;
      for (let i = 0; i < 8; i++) later(i * .25, () => spawnPortal(pick(['hand', 'hand', 'skibidi', 'sixseven', 'quadro', 'labubu'] as const), ex, clamp(G.p.y + (i - 4) * 12, 24, WH - 16), .5, false));
      say(p.x, p.y - 30, 'ОЧЕРЕДЬ ЗА ШОКОЛАДОМ', P.pist, true); sfx('sugar');
      break;
    }
    case 'up': {
      const s = curSlot();
      if (s.lvl < 5) { s.lvl++; if (s.id) s.ammo += R(WEAPONS[s.id].pick * .5); banner(`АПСКЕЙЛ x${2 ** s.lvl}`, WEAPONS[s.id].name, 2, P.cyan); }
      else { G.score += 20; say(p.x, p.y - 26, 'пушка на максимуме. она пишет тебе письма', P.cyan); }
      sfx('gun');
      break;
    }
  }
  burst(k.x, k.y - 5, k.type === 'up' || k.type === 'gun' ? P.cyan : k.type === 'ammo' ? P.gold : P.green, 14, 60);
}
