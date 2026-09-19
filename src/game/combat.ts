// Урон: по врагам, игроку и укрытиям. Взрывы, смерть врагов и дроп.
import { P } from '../content/palette';
import { enemyDef, SPLAT } from '../content/enemies';
import { KILL_TEXT } from '../content/texts.ru';
import { TAU, R, clamp } from '../engine/math';
import { random, rnd, pick } from '../engine/rng';
import { G, hooks, sfx } from './world';
import { say, banner, burst, later, ring } from './fx';
import { bodyY } from './body';
import { addEnemy } from './spawn';
import { mkPickup } from './pickups';
import { xpNeed, WW, WH, type Enemy, type Prop } from './state';
import type { WeaponId } from '../content/weapons';
import { gunKill, gunLevel, offerWeapons, evolvable } from './inventory';
import { comboKill, hitStop } from './juice';
import { streamerBoom, gas } from './enemies/behaviors';

export interface HitOpts {
  /** без критов и «несерьёзного» урона (взрывы, ауры, способности) */
  noCrit?: boolean;
  /** из какой пушки — для опыта пушки */
  src?: WeaponId;
  /** мимо водяного знака (синее пламя) */
  pierceShield?: boolean;
}
export function hitEnemy(e: Enemy, dmg: number, kx = 0, ky = 0, o: HitOpts = {}): void {
  const noCrit = !!o.noCrit;
  if (e.dead || e.charm > 0) return;
  if (e.disguised) { e.disguised = false; say(e.x, e.y - 20, 'SUS!', P.red, true); sfx('sus'); }
  if (e.type === 'ouro' && !e.eating && e.segs?.some(sg => !sg.dead)) { dmg *= .25; if (random() < .04) say(e.x, e.y - 30, 'сначала хвост', P.purple); }
  if (e.air) return;
  if (e.trans && e.trans > 0) { if (random() < .1) { sfx('ting', .1); say(e.x, e.y - 50, 'НЕУЯЗВИМ', P.white); } return; }
  if (e.type === 'jboss' && G.enemies.some(a => a.type === 'apostle' && a.master === e && !a.dead)) { dmg *= .2; if (random() < .04) say(e.x, e.y - 70, 'СВЯТОЙ ЩИТ: СНАЧАЛА АПОСТОЛЫ', P.gold); }
  if (e.type === 'skboss' && G.props.some(q => q.kind === 'toiletprop')) { dmg *= .15; if (random() < .04) say(e.x, e.y - 60, 'ЗАЩИЩЁН САНТЕХНИКОЙ', P.cyan); }
  if (e.type === 'cboss' && !(e.dive && e.dive > 0) && !e.grounded) { dmg *= .35; if (random() < .04) say(e.x, e.y - 50, 'СЛИШКОМ ВЫСОКО — ЖДИ ПИКЕ', P.grey); }
  // сигма без очков уже впечатлена
  if (e.type === 'sigma' && !e.broken && dmg < 3 && !noCrit) { dmg *= .2; if (random() < .05) say(e.x, e.y - 34, 'не впечатлён', P.greyL); }
  if (e.type === 'capy' && random() < .06) say(e.x, e.y - 22, pick(['ок', 'ок я подъезжаю', 'спокойно']), P.capy);
  let d = dmg;
  if (!noCrit && G.mods.crit && random() < G.mods.crit) { d *= 3; burst(e.x, bodyY(e), P.gold, 4, 50); }
  if (G.mods.mark) { if (e.marked) d *= 1.25; e.marked = true; }
  // капча: оглушённые получают +30%
  if (e.vulnT && e.vulnT > 0) d *= 1.3;
  if (e.shield > 0 && !o.pierceShield) {
    e.shield -= d; e.flash = .07; sfx('ting', .05);
    if (e.shield <= 0) { e.shield = 0; say(e.x, bodyY(e) - 14, 'водяной знак снят', P.white); burst(e.x, bodyY(e), P.white, 16, 60); }
    return;
  }
  e.hp -= d; e.flash = .07;
  const k = e.heavy ? .25 : 1; e.kx += kx * k; e.ky += ky * k;
  sfx('hit', .03);
  if (e.type === 'grandpa' && !e.saidMonster) { e.saidMonster = true; say(e.x, e.y - 30, 'ты монстр', P.pink); }
  if (e.hp <= 0) killEnemy(e, false, o.src);
}

export interface ExplodeOpts { pdmg?: number; colors?: readonly string[]; props?: boolean; src?: WeaponId }
export function explode(x: number, y: number, rad: number, dmg: number, o: ExplodeOpts = {}): void {
  const colors = o.colors ?? [P.cyan, P.pink, P.gold, P.purple, P.white];
  G.shake = Math.max(G.shake, rad > 30 ? 6 : 4);
  if (rad >= 36) hitStop(.03);
  for (let i = 0; i < 30; i++) {
    const a = random() * TAU, s = 30 + random() * 90;
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .7, life: .3 + random() * .5, max: .8, color: pick(colors), size: 2 + ((random() * 3) | 0) });
  }
  ring(x, y, colors[0], rad, .2);
  hooks.splat(x, y + 4, 8, ['#241d2e', '#1a1423']);
  sfx('boom', .05);
  for (const e of G.enemies.slice()) {
    if (e.air) continue;
    // летающих считаем по земле под ними и задеваем вполсилы
    const d = e.alt ? Math.hypot(e.x - x, e.y - y) : Math.hypot(e.x - x, bodyY(e) - y);
    if (d < rad + e.hr) hitEnemy(e, dmg * (1 - d / (rad + e.hr) * .5) * (e.alt ? .5 : 1), (e.x - x) / (d || 1) * 90, (e.y - y) / (d || 1) * 90, { noCrit: true, src: o.src });
  }
  if (o.pdmg) { const p = G.p; if (Math.hypot(p.x - x, p.y - 6 - y) < rad) hurt(o.pdmg, 'бабах'); }
  if (o.props !== false) for (const pr of G.props.slice()) if (Math.hypot(pr.x + pr.w / 2 - x, pr.y + pr.h / 2 - y - 6) < rad + 6) damageProp(pr, dmg * 2);
}

export function damageProp(pr: Prop, dmg: number): void {
  if (pr.dead) return;
  pr.hp -= dmg; pr.flash = .08;
  if (random() < .5) { burst(pr.x + pr.w / 2, pr.y - 4, pr.kind === 'cab' ? [P.gold, P.cyan] : pr.kind === 'barrel' ? [P.cyan, P.white] : [P.red, P.gold], 2, 40); sfx('prop', .05); }
  if (pr.hp <= 0) destroyProp(pr);
}

export function destroyProp(pr: Prop): void {
  pr.dead = true;
  G.props = G.props.filter(q => q !== pr);
  const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2 - 6;
  switch (pr.kind) {
    case 'cab':
      hooks.rubble(pr, ['#2f2b3a', '#57526a', P.metalL, P.led, P.red]);
      later(.05, () => explode(cx, cy, 26, 3, { pdmg: 10, colors: [P.cyan, P.led, P.gold, P.white] }));
      if (random() < .35) G.pickups.push(mkPickup(cx, cy + 10, pick(['ammo', 'up', 'ammo'] as const)));
      if (random() < .4) say(cx, cy - 20, pick(['−1 датацентр', 'GPU сгорел', 'обучение прервано']), P.cyan);
      break;
    case 'barrel':
      hooks.rubble(pr, [P.cyanD, P.cyan, P.metal]);
      later(.12, () => explode(cx, cy, 42, 7, { pdmg: 16, colors: [P.cyan, P.white, P.cyanD] }));
      break;
    case 'toiletprop':
      hooks.rubble(pr, [P.toilet, P.toiletD, P.cyan]);
      burst(cx, cy, [P.cyan, P.white, P.toiletD], 30, 80, 2); say(cx, cy - 20, 'ЗАСОР УСТРАНЁН', P.cyan, true); sfx('flush');
      if (!G.props.some(q => q.kind === 'toiletprop') && G.boss && G.boss.type === 'skboss') say(G.boss.x, G.boss.y - 60, 'БЕЗ САНТЕХНИКИ Я НИКТО', P.red, true);
      break;
    case 'couch':
      hooks.rubble(pr, [P.couch, P.couchD, P.stain, P.white]);
      burst(cx, cy, [P.couch, P.white, P.stain], 40, 80, 2); say(cx, cy - 20, 'ДИВАН СЛОМАН', P.red, true); sfx('boom');
      break;
    case 'vend':
      hooks.rubble(pr, [P.red, P.redD, P.white, P.coffeeL]);
      burst(cx, cy, [P.red, P.white, P.coffeeL], 30, 70, 2);
      G.pickups.push(mkPickup(cx - 8, cy + 12, random() < .3 ? 'dubai' : 'coffee'), mkPickup(cx + 8, cy + 12, 'coffee'), mkPickup(cx, cy + 20, 'ammo'));
      say(cx, cy - 20, 'КОФЕ!', P.gold); sfx('boom');
      break;
  }
}

const DEATH_LINE: Partial<Record<string, [string, string, number]>> = {
  golem: ['СПАСИБО ЗА ПОСЕЩЕНИЕ', P.paper, 34], jesus: ['креветка в кляре, 400 г', P.gold, 38], shark: ['тралалело…', P.cyan, 24],
  tung: ['сахур отменяется', P.woodL, 30], ballerina: ['капучино остыл', P.coffeeL, 30]
};

export function killEnemy(e: Enemy, peaceful = false, src?: WeaponId): void {
  if (e.dead) return;
  e.dead = true;
  const T = enemyDef(e.type), boss = !!T.boss && !e.decoy;
  if (e.decoy) say(e.x, e.y - 40, 'ГАЛЛЮЦИНАЦИЯ', P.purple);
  const gain = e.score * G.mods.likes * (peaceful ? 2 : 1) * comboKill();
  // стоп-кадр и хлопок: босс — долгий, элитка и 8K — короткий
  if (boss) hitStop(.3); else if (e.elite || e.tier >= 2) hitStop(.04);
  if (!peaceful && !boss) ring(e.x, bodyY(e), P.white, 6 + e.r, .12);
  G.kills++; G.score += R(gain); G.xp += gain;
  if (src) gunKill(src, e.score);
  // наградной Макаров: убийства им заряжают блэкаут вдвое быстрее
  const ultMul = src === 'makarov' && gunLevel('makarov') >= 5 ? 2 : 1;
  G.p.ult = Math.min(100, G.p.ult + (boss ? 40 : 1.6) * ultMul / G.mods.cd * [1, 1.35, 1.6][G.ab.r - 1]);
  // огнемёт ур. 3: сгоревшие взрываются
  if (e.burnDur && e.burnDur > 0 && gunLevel('flame') >= 3) later(.05, () => explode(e.x, e.y - 4, 18, 3 * G.mods.dmg, { colors: [P.vest, P.gold, P.red], props: false, src: 'flame' }));
  while (G.xp >= xpNeed(G.p.level)) { G.xp -= xpNeed(G.p.level); G.p.level++; G.pendingPerks++; }
  if (!peaceful) {
    hooks.enemyDied(e);
    hooks.splat(e.x, e.y, e.r, SPLAT[e.type] || [P.pink]);
    sfx(boss ? 'death' : 'die', .02);
  } else burst(e.x, e.y - 10, [P.pink, P.gold], 10, 40);
  const line = DEATH_LINE[e.type];
  if (line) say(e.x, e.y - line[2], line[0], line[1]);
  else if (!boss && random() < .2) say(e.x, e.y - e.hy * 2 - 4, pick(KILL_TEXT), pick([P.paper, P.pink, P.gold]));
  const scatter = (k: Enemy, v: number) => { k.kx = rnd(v); k.ky = rnd(v); };
  if (e.type === 'cat') for (let i = 0; i < (e.tier >= 1 ? 3 : 2); i++) scatter(addEnemy('kitten', e.x + rnd(4), e.y + rnd(4)), 110);
  if (e.type === 'horse') { addEnemy('horseFree', e.x, e.y); say(e.x, e.y - 34, 'лошадь свободна', P.horse); }
  if (e.type === 'capy') { for (let i = 0; i < 3; i++) G.pickups.push(mkPickup(e.x + rnd(14), e.y + rnd(8), pick(['ammo', 'hp', 'ammo', 'up'] as const))); say(e.x, e.y - 24, 'ок я уезжаю', P.capy); }
  if (e.type === 'amogus') say(e.x, e.y - 22, 'был импостором', P.red);
  if (e.type === 'streamer' && !e.fused) later(.08, () => streamerBoom(e, .6));
  if (e.type === 'shawa') gas(e.x, e.y, 30, 5);
  if (e.type === 'ouro') for (const sg of G.enemies) if (sg.type === 'oseg' && !sg.dead) killEnemy(sg);
  if (e.aff === 'split') for (let i = 0; i < 2; i++) { const k = addEnemy(e.type, e.x + rnd(6), e.y + rnd(6)); k.hp = k.max = k.max * .5; scatter(k, 90); }
  if (boss) {
    G.boss = null; hooks.bossMusic(false);
    if (e.type === 'skuf') later(2, victory);
    if (e.type === 'mama') for (const dd of G.enemies) if (dd.decoy && !dd.dead) killEnemy(dd);
    if (e.type === 'jboss') for (const a of G.enemies) if (a.type === 'apostle' && a.master === e && !a.dead) killEnemy(a);
    if (e.type === 'skboss') for (const q of G.props.slice()) if (q.kind === 'toiletprop') destroyProp(q);
    G.pickups.push(mkPickup(e.x - 14, e.y, 'up'), mkPickup(e.x + 14, e.y, 'ammo'), mkPickup(e.x, e.y - 12, 'hp'));
    offerWeapons(e.x, e.y + 24, 3);
    // сундук эволюции, если есть пушка 5-го уровня с нужным перком
    const evo = evolvable()[0];
    if (evo) G.pickups.push({ ...mkPickup(e.x, e.y - 26, 'evo'), gun: evo, t: 9999 });
    banner('БОСС ПОВЕРЖЕН', pick(['I’m sorry, I can’t continue', 'модель снята с продакшена', 'ошибка 500: босс не найден']), 2.4, P.gold);
    G.shake = 10;
    return;
  }
  if (e.type === 'grandpa' && peaceful) { G.pickups.push(mkPickup(e.x, e.y, 'hp')); return; }
  dropLoot(e);
}

function dropLoot(e: Enemy): void {
  const m = e.elite ? 3 : 1, r = random(), big = e.r > 7 ? 1.8 : 1;
  if (random() < .012 * m) { G.pickups.push(mkPickup(e.x, e.y, 'blindbox')); return; }
  if (random() < .007 * m) { G.pickups.push(mkPickup(e.x, e.y, 'dubai')); return; }
  // новые пушки из врагов не падают — только из ящиков после волн и с боссов, чтобы свои успели раскрыться
  if (r < .012 * m * big) G.pickups.push(mkPickup(e.x, e.y, 'up'));
  else if (r < (.055 * m + .11) * big) G.pickups.push(mkPickup(e.x, e.y, 'ammo'));
  else if (r < (.055 * m + .155) * big) G.pickups.push(mkPickup(e.x, e.y, 'hp'));
}

export function hurt(n: number, srcTxt?: string | null): void {
  const p = G.p;
  if (p.inv > 0 || p.dashT > 0 || G.state !== 'play') return;
  // полсекунды неуязвимости: толпа рук не «съедает» за один миг
  p.hp -= n; p.inv = .5; p.hit = .1;
  if (n >= 15) hitStop(.06); G.shake = Math.max(G.shake, 3.5); G.flash = .25;
  say(p.x, p.y - 22, srcTxt || `-${Math.round(n)}% реальности`, P.pink);
  sfx('hurt', .08);
  checkDeath();
}

export function checkDeath(): void {
  const p = G.p;
  if (p.hp > 0) return;
  if (G.mods.saves > 0) {
    G.mods.saves--; p.hp = G.mods.maxHp * .4; p.inv = 1.5;
    banner('CTRL+S', 'сохранение загружено', 1.8, P.cyan); sfx('level');
    return;
  }
  p.hp = 0;
  G.state = 'dead';
  hooks.heroDied(p);
  hooks.splat(p.x, p.y, 6, [P.vest, P.stripe, P.jeans]);
  sfx('death'); hooks.bossMusic(false);
  hooks.gameOver();
}

export function victory(): void {
  if (G.state !== 'play') return;
  G.state = 'victory';
  sfx('secret');
  hooks.victory();
}

export function dropBomb(x: number, y: number, alt: number, dmg = 14, r = 22): void {
  G.bombs.push({ x: clamp(x, 10, WW - 10), y: clamp(y, 14, WH - 10), t: .95, max: .95, alt, dmg, r });
  sfx('whistle', .15);
}
