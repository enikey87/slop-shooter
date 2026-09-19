// Поведение обычных врагов. Каждое — функция: смотрит на игрока, выставляет желаемую скорость, атакует.
import { P } from '../../content/palette';
import { TAU, clamp } from '../../engine/math';
import { random, rnd, pick } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, burst, ring, later } from '../fx';
import { bodyY } from '../body';
import { hurt, explode, damageProp, dropBomb } from '../combat';
import { spawnPortal, addEnemy, absurdity } from '../spawn';
import { spawnPoint } from '../arena';
import { stealGun } from '../bosses/floppa';
import { WW, WH, type Enemy } from '../state';
import { aimAt, eshot, radial, lob } from './shots';
import type { Behavior, Steer } from './types';

/** Держать дистанцию: пятиться и обходить по кругу. */
function keepAway(s: Steer, back: number, side: number): void {
  s.vx = -s.vx * back + (-s.dy / s.d) * s.spd * side; s.vy = -s.vy * back + (s.dx / s.d) * s.spd * side;
}
/** Змейка поперёк направления на игрока. */
function wiggle(s: Steer, t: number, amp: number): void {
  s.vx += -s.dy / s.d * Math.sin(t) * amp; s.vy += s.dx / s.d * Math.sin(t) * amp;
}
function chatter(e: Enemy, s: Steer, rate: number, lines: readonly string[], color: string, dy = 30): void {
  // чем абсурднее уровень, тем болтливее слоп
  if (random() < s.dt * rate * (1 + (absurdity() - 1) * .25)) say(e.x, e.y - dy, pick(lines), color);
}
/** Рывок: замах (wind) → разгон по прямой (charge) → walk. Возвращает true, пока рывок идёт. */
export function chargeStep(e: Enemy, s: Steer, speed: number, dur: number, onEnd: () => void): boolean {
  if (e.state === 'wind') {
    s.vx = s.vy = 0; e.st -= s.dt; e.cdx = s.dx / s.d; e.cdy = s.dy / s.d;
    if (e.st <= 0) { e.state = 'charge'; e.st = dur; }
    return true;
  }
  if (e.state === 'charge') {
    s.vx = (e.cdx ?? 0) * speed; s.vy = (e.cdy ?? 0) * speed; e.st -= s.dt;
    if (e.st <= 0) { e.state = 'walk'; onEnd(); }
    return true;
  }
  return false;
}
/** Прыжок по параболе в точку (ltx, lty). k — прогресс 0..1. */
function leapStep(e: Enemy, dt: number, height: number): number {
  e.st -= dt;
  const k = 1 - Math.max(0, e.st) / (e.lmax ?? 1);
  e.x = e.lx0! + (e.ltx! - e.lx0!) * k; e.y = e.ly0! + (e.lty! - e.ly0!) * k; e.z = Math.sin(k * Math.PI) * height;
  return k;
}
function startLeap(e: Enemy, dur: number): void {
  const p = G.p;
  e.state = 'leap'; e.st = e.lmax = dur; e.lx0 = e.x; e.ly0 = e.y; e.ltx = p.x; e.lty = p.y;
}

export const hand: Behavior = (e, s) => {
  wiggle(s, e.t * 4, 22);
  // финал и выше: стреляет ногтем
  if (e.tier >= 1 && e.cd <= 0 && s.d < 160) { e.cd = 3 + random() * 1.5; eshot('ebullet', e.x, e.y - e.hy, aimAt(e.x, e.y - e.hy), 110, 4, 2, { r: 2 }); }
};

export const spag: Behavior = (e, s) => {
  if (s.d < 85) keepAway(s, .6, .5);
  if (e.cd <= 0 && s.d < 190) {
    e.cd = 1.8 + random(); e.atk = .3;
    const sx = e.x + e.face * 6, sy = e.y - 13;
    // макароны медленно доворачивают на игрока (почерк спагетти); со ступенью — злее
    eshot('noodle', sx, sy, Math.atan2(G.p.y - 9 - sy, G.p.x - sx) + rnd(.08), 85, 9, 3.2, { home: true, turn: e.tier >= 1 ? 1.4 : .7 });
    sfx('spit', .1);
  }
};

export const shark: Behavior = (e, s) => {
  if (e.state === 'walk' && s.d < 130 && e.cd <= 0) { e.state = 'wind'; e.st = .5; sfx('charge', .1); }
  // финал и выше: сразу второй рывок
  chargeStep(e, s, 230, .5, () => { if (e.tier >= 1 && !e.chain) { e.chain = 1; e.state = 'wind'; e.st = .25; } else { e.chain = 0; e.cd = 2.5; } });
  if (e.state === 'charge' && random() < .5) G.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: .2, max: .2, color: P.white, size: 1 });
};

export const croc: Behavior = (e, s) => {
  const p = G.p;
  e.orbit += s.dt * .6;
  const tx = p.x + Math.cos(e.orbit) * 90, ty = p.y + Math.sin(e.orbit) * 60, tdx = tx - e.x, tdy = ty - e.y, td = Math.hypot(tdx, tdy) || 1;
  s.vx = tdx / td * s.spd; s.vy = tdy / td * s.spd;
  e.face = s.vx < 0 ? -1 : 1;
  if (e.cd <= 0 && s.d < 200) {
    e.cd = 2.2 + random(); const lead = p.moving ? 20 : 0;
    // финал и выше: дорожка из трёх бомб
    for (let i = e.tier >= 1 ? -1 : 0; i <= (e.tier >= 1 ? 1 : 0); i++) dropBomb(p.x + p.dx * lead + i * 18, p.y + p.dy * lead, e.alt);
  }
};

/** Тун-тун: подходит и бьёт дубиной с разворота по кругу. Замах виден — можно отойти (как ящерица в Alien Shooter). */
export const tung: Behavior = (e, s) => {
  if (e.state === 'walk') {
    if (s.d < 36 && e.cd <= 0) { e.state = 'wind'; e.st = .45; sfx('tung', .4); }
    return;
  }
  s.vx = s.vy = 0; e.st -= s.dt;
  if (e.st > 0) return;
  e.state = 'walk'; e.cd = e.tier >= 2 ? 1 : 1.5; e.atk = .25;
  ring(e.x, e.y, P.woodL, 30, .25);
  if (Math.hypot(G.p.x - e.x, G.p.y - e.y) < 30) hurt(e.dmg, 'ТУН!');
  sfx('book', .1);
};

export const ballerina: Behavior = (e, s) => {
  s.vx = s.dx / s.d * s.spd + Math.cos(e.t * 3) * 30; s.vy = s.dy / s.d * s.spd + Math.sin(e.t * 3) * 30;
  if (e.spin && e.spin > 0) { e.spin -= s.dt; s.vx *= .4; s.vy *= .4; e.face = ((e.t * 16) | 0) % 2 ? 1 : -1; }
  else if (e.cd <= 0 && s.d < 170) { e.spin = 1.6; e.cd = 4.5; }
};

export const grandpa: Behavior = (e, s, auras) => {
  if (s.d < 55) s.vx = s.vy = 0;
  if (s.d < 75) auras.guilt = true;
  chatter(e, s, .25, ['никто не поздравил', 'мне 100 лет', 'лайкните деда'], P.greyL);
};

export const horseFree: Behavior = (e, s) => { s.vx += Math.sin(e.t * 7) * 40; s.vy += Math.cos(e.t * 5) * 40; };

export const skibidi: Behavior = (e, s) => {
  wiggle(s, e.t * 9, 55);
  if (e.tier >= 1 && e.cd <= 0 && s.d < 150) { e.cd = 3 + random(); eshot('drop', e.x, e.y - 14, aimAt(e.x, e.y - 14), 90, 6, 2.5); }
  if (random() < s.dt * .25) { sfx('skibidi', .6); if (random() < .4) say(e.x, e.y - 26, pick(['скибиди доп доп', 'ес ес', 'скибиди']), P.white); }
};

export const chimp: Behavior = (e, s) => {
  const p = G.p;
  if (s.d < 90) { s.vx = -s.vx * .5; s.vy = -s.vy * .5; }
  if (e.cd <= 0 && s.d < 180) {
    e.cd = 2.6 + random(); e.atk = .3;
    for (let i = 0; i < (e.tier >= 1 ? 2 : 1); i++) lob('peel', e.x, e.y, clamp(p.x + rnd(10 + i * 20), 12, WW - 12), clamp(p.y + rnd(6 + i * 14), 16, WH - 10), .7 + i * .1, 12);
    sfx('spit', .1);
  }
};

export const amogus: Behavior = (e, s) => {
  if (!e.disguised) return;
  s.vx = s.vy = 0; e.dt2 = (e.dt2 ?? 0) + s.dt;
  if (s.d < 30 || e.dt2 > 14) { e.disguised = false; say(e.x, e.y - 20, 'SUS!', P.red, true); sfx('sus'); }
};

export const doge: Behavior = (e, s) => {
  if (s.d < 110) keepAway(s, .6, .4);
  if (e.cd <= 0 && s.d < 200) {
    e.cd = 2.8 + random();
    const w = pick(['WOW', 'SUCH', 'MUCH', 'VERY', 'AMAZE']), sy = e.y - 8;
    // веер слов: 3, со ступени — 5
    const n = e.tier >= 1 ? 5 : 3, a0 = aimAt(e.x, sy);
    for (let i = 0; i < n; i++) eshot('word', e.x, sy, a0 + (i - (n - 1) / 2) * .22, 70, 7, 3, { w: i % 2 ? pick(['WOW', 'SUCH', 'MUCH', 'VERY', 'AMAZE']) : w, r: 5 });
    sfx('wow', .1);
  }
};

export const capy: Behavior = (e, s) => {
  for (const o of G.enemies) if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < (e.tier >= 1 ? 80 : 50)) o.calm = .2;
  chatter(e, s, .12, ['ок я подъезжаю', 'спокойствие', 'ок'], P.capy, 22);
};

export const troll: Behavior = (e, s) => { e.vis = clamp((85 - s.d) / 40, .06, 1); };

export const patapim: Behavior = (e, s) => {
  if (e.state === 'stomp') {
    s.vx = s.vy = 0; e.st -= s.dt;
    if (e.st <= 0) {
      e.state = 'walk';
      G.zones.push({ x: e.x, y: e.y, r: 34, t: 3.5, max: 3.5, kind: 'roots' });
      ring(e.x, e.y, P.woodL, 34, .3);
      G.shake = Math.max(G.shake, 2); sfx('stomp', .1);
      if (s.d < 28) hurt(e.dmg, 'ПАТАПИМ!');
      if (random() < .5) say(e.x, e.y - 32, 'бррр бррр', P.green);
    }
  } else if (e.cd <= 0 && s.d < 110) { e.state = 'stomp'; e.st = .45; e.cd = 3.2; }
};

export const lirili: Behavior = (_e, s, auras) => { if (s.d < 75) auras.timeSlow = true; };

export const apostle: Behavior = (e, s) => {
  const B = e.master;
  if (!B || B.dead) { e.master = null; e.noSep = false; s.vx = s.dx / s.d * 40; s.vy = s.dy / s.d * 40; return; }
  e.oa = (e.oa ?? 0) + s.dt * 1.1;
  e.x = B.x + Math.cos(e.oa) * 48; e.y = B.y + Math.sin(e.oa) * 48 * .6; s.vx = s.vy = 0; e.face = Math.cos(e.oa) > 0 ? 1 : -1;
  if (e.cd <= 0) { e.cd = 4.5 + random(); eshot('amen', e.x, bodyY(e), aimAt(e.x, bodyY(e)), 65, 5, 3.5); }
};

/** OIIA-кот: раскручивается, взлетает и падает на игрока. */
export const oiia: Behavior = (e, s) => {
  const p = G.p;
  let rate = 5;
  if (e.state === 'walk') { if (e.cd <= 0 && s.d < 150) { e.state = 'spin'; e.st = 3.5; say(e.x, e.y - 24, 'OIIA OIIA', P.white, true); } }
  else if (e.state === 'spin') {
    e.st -= s.dt; const k = 1 - e.st / 3.5; rate = 10 + k * 34;
    s.vx = s.dx / s.d * s.spd * (1 + k * 3) + Math.cos(e.t * 9) * 40 * k; s.vy = s.dy / s.d * s.spd * (1 + k * 3) + Math.sin(e.t * 11) * 40 * k;
    if (random() < s.dt * (3 + k * 8)) sfx('oiia', .12);
    if (random() < .4) G.parts.push({ x: e.x + rnd(8), y: e.y - random() * 10, vx: rnd(40), vy: -20, life: .3, max: .3, color: pick([P.white, P.grey]), size: 1 });
    if (e.st <= 0) { e.state = 'air'; e.st = .6; e.air = true; sfx('oiia'); say(e.x, e.y - 24, 'OIIAAAAA', P.white, true); }
  } else if (e.state === 'air') {
    rate = 40; s.vx = s.vy = 0; e.st -= s.dt; e.z = (1 - Math.max(0, e.st) / .6) * 160;
    if (e.st <= 0) { e.state = 'fall'; e.st = 1.1; e.x = clamp(p.x + p.dx * 18, 16, WW - 16); e.y = clamp(p.y + p.dy * 18, 24, WH - 16); }
  } else if (e.state === 'fall') {
    rate = 40; s.vx = s.vy = 0; e.st -= s.dt; e.z = Math.max(0, e.st / 1.1) * 160;
    if (e.st <= 0) {
      e.state = 'walk'; e.air = false; e.z = 0; e.cd = 4 + random() * 2;
      explode(e.x, e.y - 4, 30, 3, { pdmg: 16, colors: [P.white, P.grey, P.pink] });
      say(e.x, e.y - 30, 'OIIA!!!', P.white, true);
    }
  }
  e.sp = (e.sp ?? 0) + s.dt * rate;
};

export const sigma: Behavior = (e, s, auras) => {
  if (s.d < 110 && !e.broken) auras.mogged = true;
  if (s.d < 60) { s.vx *= .3; s.vy *= .3; }
  if (random() < s.dt * .15) { say(e.x, e.y - 34, pick(['сигма бой', '*мьюинг*', 'не впечатлён', 'гриндсет', 'я не такой, как все']), P.greyL); sfx('sigma', 2); }
};

/** Квадроберы: стая заходит с флангов и прыгает. */
/** Квадроберы: стая заходит с флангов и кусает. Без прыжка — прыгунов у нас и так много. */
export const quadro: Behavior = (e, s) => {
  const p = G.p;
  const side = (e.variant % 3 - 1) * 1.2, base = Math.atan2(-s.dy, -s.dx) + side, off = s.d > 50 ? 40 : 0;
  const tdx = p.x + Math.cos(base) * off - e.x, tdy = p.y + Math.sin(base) * off * .7 - e.y, td = Math.hypot(tdx, tdy) || 1;
  // вблизи — рывок на укус
  const burstSpd = s.d < 40 ? 1.5 : 1;
  s.vx = tdx / td * s.spd * burstSpd; s.vy = tdy / td * s.spd * burstSpd;
  if (s.d < 30 && e.cd <= 0) { e.cd = 1.2; sfx(e.variant % 3 === 1 ? 'woof' : 'meow', .15); }
  chatter(e, s, .1, ['мяу', 'гав', 'я квадробер', 'фыр', 'не трогай хвост', 'у меня хвост'], P.paper, 20);
};

/** Лабубу прыгает и цепляется на игрока; стряхнуть — кувырком. */
export const labubu: Behavior = (e, s) => {
  const p = G.p, hop = Math.sin(e.t * 8) > 0 ? 1.6 : .25;
  s.vx *= hop; s.vy *= hop;
  e.bite = (e.bite ?? 0) - s.dt;
  if (s.d < 16) e.bite = .2;
  if (s.d < e.r + p.r + 2 && p.dashT <= 0 && p.cling < 5) {
    e.dead = true; p.cling++; if (p.cling === 1) p.clingT = 5;
    say(p.x, p.y - 26, p.cling > 2 ? `ЛАБУБУ x${p.cling}` : 'ЛАБУБУ ПРИЦЕПИЛСЯ', P.labP); sfx('meow', .1);
  }
};

/** Злой дядя Вася (его зовёт скуф): стоит и стреляет 15 секунд. */
export const evasya: Behavior = (e, s) => {
  s.vx = s.vy = 0; e.life2 = (e.life2 ?? 15) - s.dt;
  // очередь из трёх, потом пауза
  if (e.cd <= 0 && s.d < 200) {
    e.cd = 1.4;
    for (let i = 0; i < 3; i++) later(i * .1, () => { if (e.dead) return; const sy = e.y - 9; eshot('ebullet', e.x + e.face * 6, sy, aimAt(e.x, sy) + rnd(.06), 140, 5, 1.8, { r: 2 }); sfx('pistol', .1); });
  }
  chatter(e, s, .2, ['Гена, сдавайся', 'я теперь за него', 'мне обещали дачу'], P.red, 28);
  if (e.life2 <= 0) { e.dead = true; burst(e.x, e.y - 10, [P.track, P.white], 20, 60); say(e.x, e.y - 28, 'ушёл на дачу', P.paper); }
};

export const sixseven: Behavior = (e, s, auras) => {
  if (s.d < 70) keepAway(s, .5, .5);
  if (s.d < 90) auras.wobble = true;
  if (e.cd <= 0 && s.d < 190) {
    e.cd = 2 + random();
    const sy = e.y - 12, a0 = aimAt(e.x, sy);
    ['6', '7'].forEach((ch, i) => eshot('digit', e.x, sy, a0 + (i ? .12 : -.12), 85, 6, 3, { ch }));
    sfx('sixseven', .3);
    if (random() < .6) say(e.x, e.y - 30, pick(['SIX SEVEN!', '6… 7…', 'СИКС СЕВЕН']), P.green, random() < .3);
  }
};

/** Шлёпа и её босс-версия: присесть → прыжок → удар по площади. */
export const floppa: Behavior = (e, s) => {
  const p = G.p, boss = e.type === 'fboss', ph = e.phase;
  if (boss && e.state === 'walk') {
    // босс ест твой лут
    let food = null, fd = 90;
    for (const k of G.pickups) { if (k.type === 'stolen' || k.type === 'remote') continue; const kd = Math.hypot(k.x - e.x, k.y - e.y); if (kd < fd) { fd = kd; food = k; } }
    if (food) {
      s.vx = (food.x - e.x) / (fd || 1) * s.spd * 1.5; s.vy = (food.y - e.y) / (fd || 1) * s.spd * 1.5;
      if (fd < 12) { food.t = 0; e.hp = Math.min(e.max, e.hp + e.max * .04); say(e.x, e.y - 50, 'НЯМ (ЭТО БЫЛ ТВОЙ ЛУТ)', P.floppa); sfx('die', .1); }
    }
  }
  if (e.state === 'walk' && s.d < (boss ? 170 : 120) && e.cd <= 0) { e.state = 'crouch'; e.st = boss ? .7 : .6; sfx('charge', .1); }
  if (e.state === 'crouch') {
    s.vx = s.vy = 0; e.st -= s.dt;
    if (e.st <= 0) startLeap(e, boss ? .7 : .5);
    return;
  }
  if (e.state !== 'leap') return;
  s.vx = s.vy = 0;
  leapStep(e, s.dt, boss ? 40 : 22);
  if (e.st > 0) return;
  e.state = 'walk'; e.z = 0; e.cd = boss ? [1.8, 1.4, 1.1][ph] : 2.8;
  const R0 = boss ? 48 : 24;
  ring(e.x, e.y, P.floppa, R0, .3);
  G.shake = Math.max(G.shake, boss ? 7 : 3); sfx('stomp', .05);
  if (Math.hypot(p.x - e.x, p.y - e.y) < R0) hurt(e.dmg, 'ШЛЁП');
  if (boss && Math.hypot(p.x - e.x, p.y - e.y) < 38) stealGun();
  for (const pr of G.props.slice()) if (Math.hypot(pr.x + pr.w / 2 - e.x, pr.y + pr.h / 2 - e.y) < R0) damageProp(pr, boss ? 12 : 4);
  if (!boss) return;
  const n = [10, 14, 16][ph], off = random() * TAU;
  for (const sp of ph >= 2 ? [60, 90, 120] : [75]) for (let i = 0; i < n; i++) eshot('fur', e.x, e.y - 10, off + (i + (sp === 90 ? .5 : 0)) / n * TAU, sp, 10, 3);
  e.chain = (e.chain ?? 0) + 1;
  if (e.chain <= ph) { e.state = 'crouch'; e.st = .25; } else e.chain = 0;
  if ((e.leaps = (e.leaps ?? 0) + 1) % 3 === 0) for (let i = 0; i < 2; i++) { const sp = spawnPoint(50, { x: e.x, y: e.y, r: 60 }); spawnPortal('floppa', sp.x, sp.y, .7, false); }
  say(e.x, e.y - 60, pick(['ШЛЁП', 'ПОЛНЫЙ ШЛЁП', 'шлёпа не одобряет']), P.floppa, true);
};

/** Иисус-креветка и босс: кольца «аминь», лечит соседей. */
export const jesus: Behavior = (e) => {
  if (e.cd > 0) return;
  const boss = e.type === 'jboss', ph = e.phase;
  e.cd = boss ? [2.2, 1.9, 1.7][ph] : 3;
  const n = boss ? [10, 12, 14][ph] : 8, off = random() * TAU, sy = bodyY(e);
  // первый босс — не стена для новичка: в 1-й фазе кольца реже и мягче, злее к 3-й
  radial('amen', e.x, sy, n, off, 60, boss ? [7, 9, 11][ph] : 8, 3.5);
  if ((boss && ph >= 1) || (!boss && e.tier >= 1)) later(.3, () => { if (!e.dead) radial('amen', e.x, bodyY(e), n, off + .5 / n * TAU, 75, 12, 3.5); });
  for (const o of G.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 70) { o.hp = Math.min(o.max, o.hp + o.max * .35); say(o.x, o.y - o.hy * 2 - 4, '+благословение', P.gold); }
  ring(e.x, sy, P.gold, 70, .5);
  sfx('amen', .2);
  if (boss) for (let i = 0; i < 3 + (G.wave / 5 | 0); i++) spawnPortal('hand', clamp(e.x + rnd(50), 20, WW - 20), clamp(e.y + rnd(50), 24, WH - 20), .6, false);
};

// ---------- архетипы, которых не хватало ----------
/** Стример ради хайпа (камикадзе): добегает, полсекунды мигает и взрывается. */
export const streamer: Behavior = (e, s) => {
  wiggle(s, e.t * 6, 20);
  if (e.state === 'walk') {
    if (s.d < 20) { e.state = 'wind'; e.st = e.tier >= 2 ? .35 : .5; sfx('charge', .1); say(e.x, e.y - 24, pick(['ЧАТ, СМОТРИТЕ', 'ДОНАТ НА ВЗРЫВ', 'ЭТО ДЛЯ ХАЙПА']), P.vest); }
    return;
  }
  s.vx *= .3; s.vy *= .3; e.st -= s.dt;
  if (e.st <= 0) streamerBoom(e, 1);
};
/** Взрыв стримера: при запале — полный, при смерти от пули — поменьше. Задевает и других врагов. */
export function streamerBoom(e: Enemy, k: number): void {
  if (e.fused) return;
  e.fused = true; e.dead = true;
  explode(e.x, e.y - 6, 26 + 6 * k, 6 * k, { pdmg: 14 * k * (e.tier >= 2 ? 1.25 : 1), colors: [P.vest, P.gold, P.white, P.pink] });
}

/** Джоконда (снайпер): держит дистанцию, ведёт красную линию прицела, фиксирует её и стреляет сквозь всё. */
export const mona: Behavior = (e, s) => {
  const p = G.p;
  if (e.state === 'walk') {
    if (s.d < 120) { s.vx = -s.vx; s.vy = -s.vy; } else if (s.d < 190) { s.vx *= .2; s.vy *= .2; }
    if (e.cd <= 0 && s.d < 260) { e.state = 'wind'; e.st = e.tier >= 2 ? 1.1 : 1.4; sfx('charge', .2); }
    return;
  }
  s.vx = s.vy = 0; e.st -= s.dt;
  // за 0,35 с до выстрела прицел фиксируется: успей уйти с линии
  if (e.st > .35) { e.aimX = p.x; e.aimY = p.y - 9; }
  if (e.st > 0) return;
  e.state = 'walk'; e.cd = e.tier >= 1 ? 2.6 : 3.5; e.atk = .3;
  const x0 = e.x, y0 = e.y - e.hy, ax = (e.aimX ?? p.x) - x0, ay = (e.aimY ?? p.y) - y0, L = Math.hypot(ax, ay) || 1, ux = ax / L, uy = ay / L;
  G.beams.push({ x0, y0, x1: x0 + ux * 500, y1: y0 + uy * 500, t: .25, max: .25, type: 'sniper' });
  // попали, если игрок у линии
  const px = p.x - x0, py = p.y - 9 - y0, t = px * ux + py * uy;
  if (t > 0 && Math.abs(px * uy - py * ux) < p.hr + 2) hurt(20 * (e.tier >= 2 ? 1.25 : 1), 'ШЕСТЬ ПАЛЬЦЕВ');
  sfx('rail', .1); G.shake = Math.max(G.shake, 2);
};

/** Принтер нейрослопа (гнездо): стоит и печатает руки, пока его не сломают. */
export const printer: Behavior = (e, s) => {
  // стоит намертво: толпа его не сдвигает
  e.lx0 ??= e.x; e.ly0 ??= e.y; e.x = e.lx0; e.y = e.ly0;
  s.vx = s.vy = 0; e.kx = e.ky = 0; e.face = 1;
  // тонера хватает на 12 рук, потом принтер бесполезен (и волна может закончиться)
  e.leaps ??= 0;
  if (e.leaps >= 12) {
    if (e.leaps === 12) { e.leaps++; e.st = 5; say(e.x, e.y - 24, 'ЗАКОНЧИЛСЯ ТОНЕР', P.paper, true); }
    // без тонера через 5 секунд сгорает сам — чтобы волна не зависла
    e.st -= s.dt;
    if (e.st <= 0) { e.dead = true; burst(e.x, e.y - 8, [P.greyL, P.paper, P.ink], 30, 70, 2); say(e.x, e.y - 24, 'ПРИНТЕР СГОРЕЛ', P.red, true); sfx('boom'); }
    return;
  }
  const kids = G.enemies.filter(o => o.master === e && !o.dead).length;
  if (e.cd <= 0 && kids < (e.tier >= 1 ? 8 : 6)) {
    e.cd = e.tier >= 2 ? 2 : 3; e.leaps++;
    const h = addEnemy('hand', e.x + rnd(6), e.y + 8);
    h.master = e; h.ky = 60;
    if (random() < .3) say(e.x, e.y - 24, pick(['ПЕЧАТЬ…', 'ЗАМЯТИЕ БУМАГИ', 'ещё 5 рук, фотореализм']), P.paper);
    sfx('type', .1);
  }
};

/** Нейро-шаурма (облако): рядом с игроком пускает вонь, после смерти оставляет облако. */
export const shawa: Behavior = (e, s) => {
  if (s.d < 30 && e.cd <= 0) { e.cd = 3; gas(e.x, e.y, 20, 3); say(e.x, e.y - 20, 'ФУ', P.greenL); }
};
export function gas(x: number, y: number, r: number, t: number): void {
  G.zones.push({ x, y, r, t, max: t, kind: 'gas' });
}

/** Бабушка-смотрительница: «ТИШЕ!» — рядом с ней стреляешь вдвое реже. */
export const guard: Behavior = (e, s, auras) => {
  if (s.d < 70) auras.guilt = true;
  if (e.cd <= 0 && s.d < 90) { e.cd = 3; say(e.x, e.y - 26, pick(['ТИШЕ!', 'НЕ ТРОГАТЬ!', 'БАХИЛЫ НАДЕНЬ', 'ФОТОГРАФИРОВАТЬ НЕЛЬЗЯ']), P.purple, true); }
};
/** Пчела из улья: сначала жалит всех подряд (переманена), потом злится на героя и через 8 с улетает. */
export const bee: Behavior = (e, s) => {
  s.vx += Math.sin(e.t * 17) * 40; s.vy += Math.cos(e.t * 13) * 40;
  e.life2 = (e.life2 ?? 8) - s.dt;
  if (e.life2 <= 0) { e.dead = true; say(e.x, e.y - 8, 'улетела', P.gold); }
};
