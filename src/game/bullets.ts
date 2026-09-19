// Полёт и попадания снарядов игрока и врагов.
import { P } from '../content/palette';
import { SPLAT } from '../content/enemies';
import { TAU, clamp } from '../engine/math';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, burst } from './fx';
import { bulletProp } from './arena';
import { bodyY, isBoss } from './body';
import { hitEnemy, explode, damageProp, hurt } from './combat';
import { rocketBoom, bullet, ignite } from './weapons';
import { gunLevel } from './inventory';
import { hitPrompt } from './bosses/mama';
import { eshot } from './enemies/shots';
import { WW, WH, type Bullet, type EBullet, type Enemy } from './state';

/** Поворот вектора скорости к цели не быстрее turn рад/с. */
function steer(b: { vx: number; vy: number }, want: number, turn: number, spd: number): void {
  const cur = Math.atan2(b.vy, b.vx);
  const na = cur + clamp(((want - cur + Math.PI * 3) % TAU) - Math.PI, -turn, turn);
  b.vx = Math.cos(na) * spd; b.vy = Math.sin(na) * spd;
}

function grenade(b: Bullet, dt: number): void {
  b.t! += dt; const k = Math.min(1, b.t! / b.dur!);
  b.x = b.x0! + (b.tx! - b.x0!) * k; b.y = b.y0! + (b.ty! - 9 - b.y0!) * k; b.z = Math.sin(k * Math.PI) * 26;
  if (k < 1) return;
  b.life = 0;
  explode(b.tx!, b.ty! - 9, 36, b.dmg, { colors: [P.white, P.green, P.cyan], src: 'captcha' });
  const L = gunLevel('captcha');
  let n = 0;
  for (const e of G.enemies) if (Math.hypot(e.x - b.tx!, e.y - b.ty!) < 40) {
    e.stun = isBoss(e) ? .8 : 3; e.stunKind = n++ < 3 ? 'captcha' : '';
    // оглушённые получают +30% урона; ур. 3 — ещё 2 с не атакуют
    e.vulnT = e.stun;
    if (L >= 3) { e.cd = Math.max(e.cd, e.stun + 2); e.hitCd = Math.max(e.hitCd, e.stun + 2); }
  }
  // ур. 5: «выберите все светофоры» стирает вражеские снаряды
  if (L >= 5) G.ebullets = G.ebullets.filter(eb => Math.hypot(eb.x - b.tx!, eb.y - b.ty!) > 45);
  sfx('captcha');
}

/** Особое движение по типу снаряда. Возвращает false, если снаряд уже отработал. */
function fly(b: Bullet, dt: number): boolean {
  const p = G.p;
  switch (b.kind) {
    case 'kb':
      b.t0 = (b.t0 ?? 0) + dt;
      if (!b.ret && b.t0 > .45) { b.ret = true; b.hits = new Set(); }
      if (b.ret && !b.midi && gunLevel('keyboard') >= 3) {
        // MIDI: разворот клавиатуры бьёт звуковыми волнами
        b.midi = true;
        for (let i = 0; i < 6; i++) bullet('sonic', b.x, b.y, i / 6 * TAU, 140, b.dmg * .6, { pierce: 999, life: .4, knock: 60, src: 'keyboard' });
      }
      if (b.ret) {
        const dx = p.x - b.x, dy = p.y - 9 - b.y, d = Math.hypot(dx, dy) || 1; b.vx = dx / d * 230; b.vy = dy / d * 230;
        if (d < 8) {
          // ур. 5: вернулась — кружит щитом
          if (gunLevel('keyboard') >= 5) { b.kind = 'orbit'; b.oa = Math.atan2(-dy, -dx); b.hitT = .3; b.life = 3; b.hits = new Set(); b.vx = b.vy = 0; return true; }
          b.life = 0; return false;
        }
      }
      if (random() < .2) G.parts.push({ x: b.x, y: b.y, vx: rnd(20), vy: rnd(20), life: .3, max: .3, color: P.greyL, size: 1 });
      break;
    case 'slipper': {
      let tg: Enemy | null = null, td = 170;
      for (const e of G.enemies) { if (e.dead || e.charm > 0 || e.disguised || b.hits.has(e)) continue; const d = Math.hypot(e.x - b.x, bodyY(e) - b.y); if (d < td) { td = d; tg = e; } }
      if (tg) steer(b, Math.atan2(bodyY(tg) - b.y, tg.x - b.x), 6 * dt, 170);
      break;
    }
    case 'nyan': {
      const pc = [P.red, P.vest, P.gold, P.green, P.cyan, P.purple];
      for (let k = 0; k < 3; k++) G.parts.push({ x: b.x - b.vx * .03, y: b.y - 1 + k, vx: 0, vy: 0, life: .35, max: .35, color: pc[(((G.t * 20) | 0) + k) % 6], size: 1 });
      // отскакивает от стен и укрытий
      const L = gunLevel('nyan'), bounce = (): void => { b.hits = new Set(); if (L >= 5) b.pierce++; };
      if (b.x < 8 || b.x > WW - 8) { b.vx = -b.vx; b.x = clamp(b.x, 8, WW - 8); bounce(); }
      if (b.y < 10 || b.y > WH - 8) { b.vy = -b.vy; b.y = clamp(b.y, 10, WH - 8); bounce(); }
      const prn = bulletProp(b.x, b.y);
      if (prn) {
        if (bulletProp(b.x - b.vx * dt, b.y)) b.vy = -b.vy; else b.vx = -b.vx;
        b.x += b.vx * dt * 2; b.y += b.vy * dt * 2; damageProp(prn, 1); sfx('ting', .1); bounce();
      }
      // ур. 3: радуга замедляет
      if (L >= 3) for (const e of G.enemies) if (Math.abs(e.x - b.x) < 10 && Math.abs(bodyY(e) - b.y) < 10) e.slowT = Math.max(e.slowT, .6);
      break;
    }
    case 'sonic': b.w = 3 + (.6 - b.life) * 22; break;
    case 'orbit':
      b.oa! += dt * 7; b.x = p.x + Math.cos(b.oa!) * 26; b.y = p.y - 8 + Math.sin(b.oa!) * 18;
      b.hitT! -= dt; if (b.hitT! <= 0) { b.hitT = .3; b.hits = new Set(); }
      break;
    case 'rocket':
      G.parts.push({ x: b.x - b.vx * .02, y: b.y - b.vy * .02, vx: rnd(8), vy: rnd(8), life: .3, max: .3, color: pick([P.cyan, P.pink, P.white]), size: 2 });
      if (b.life <= 0) { rocketBoom(b); return false; }
      // ур. 5: доворачивает к ближайшему врагу
      if (b.src === 'rocket' && gunLevel('rocket') >= 5) {
        let tg: Enemy | null = null, td = 160;
        for (const e of G.enemies) { if (e.dead || e.charm > 0 || e.disguised) continue; const d = Math.hypot(e.x - b.x, bodyY(e) - b.y); if (d < td) { td = d; tg = e; } }
        if (tg) steer(b, Math.atan2(bodyY(tg) - b.y, tg.x - b.x), 2.5 * dt, Math.hypot(b.vx, b.vy));
      }
      break;
  }
  return true;
}

/** Попадание в укрытие. Возвращает false, если снаряд уничтожен. */
function hitProps(b: Bullet): boolean {
  if (b.kind === 'nyan' || b.kind === 'orbit') return true;
  const pr = bulletProp(b.x, b.y);
  if (!pr) return true;
  if (b.kind === 'kb') { if (!b.ret) { b.ret = true; b.hits = new Set(); damageProp(pr, 2); } return true; }
  if (b.kind === 'sonic') { if (!b.hits.has(pr)) { b.hits.add(pr); damageProp(pr, b.dmg); } return true; }
  if (b.kind === 'flame') { damageProp(pr, b.dmg * .3); return true; }
  b.life = 0;
  if (b.kind === 'rocket') rocketBoom(b);
  else { damageProp(pr, b.dmg); burst(b.x, b.y, P.gold, 2, 40); }
  return false;
}

function hitEnemies(b: Bullet): void {
  const p = G.p;
  for (const e of G.enemies) {
    if (e.dead || e.air || b.hits.has(e) || e.charm > 0) continue;
    const dx = e.x - b.x, dy = bodyY(e) - b.y, hrr = e.hr + (b.kind === 'sonic' ? b.w ?? 0 : b.mega ? 6 : b.kind === 'orbit' ? 3 : 0);
    if (dx * dx + dy * dy >= hrr * hrr) continue;
    // OIIA в раскрутке ест пули
    if (e.type === 'oiia' && e.state === 'spin' && b.kind !== 'rocket') {
      b.life = 0; e.sp = (e.sp ?? 0) + 2;
      if (random() < .2) say(e.x, e.y - 22, pick(['OIIA', 'ням', 'i-i-a']), P.white);
      return;
    }
    // балерина в пируэте отражает
    if (e.type === 'ballerina' && e.spin && e.spin > 0 && b.kind !== 'rocket' && b.kind !== 'flame') {
      eshot('reflect', b.x, b.y, Math.atan2(p.y - 9 - b.y, p.x - b.x), 150, 6, 1.5, { r: 2 });
      b.life = 0; sfx('ting', .05);
      if (random() < .15) say(e.x, e.y - 30, 'па-де-де', P.pink);
      return;
    }
    // ракета: прямое попадание ×2 плюс взрыв
    if (b.kind === 'rocket') { b.life = 0; hitEnemy(e, b.dmg, 0, 0, { src: b.src }); rocketBoom(b); return; }
    const n = Math.hypot(b.vx, b.vy) || 1;
    let dmg = b.dmg;
    if (b.streak) {
      // Макаров: каждое 3-е попадание подряд — контрольный
      p.streak++;
      if (b.crit || p.streak % 3 === 0) { dmg *= 2; burst(b.x, b.y, P.gold, 3, 40); }
    }
    if (b.src === 'shotgun' && (b.age ?? 0) < .12) dmg *= 1.5; // в упор
    hitEnemy(e, dmg, b.vx / n * b.knock, b.vy / n * b.knock, { src: b.src });
    if (b.slow) e.slowT = b.slow;
    b.hits.add(e);
    if (b.kind === 'flame') ignite(e);
    if (b.kind === 'slipper') {
      if (random() < .25) say(e.x, e.y - 22, 'ШЛЁП', P.pink);
      const L = gunLevel('slipper');
      if (L >= 5) { e.cd = Math.max(e.cd, 2); e.hitCd = Math.max(e.hitCd, 2); }
      if (L >= 3 && !b.ricochet) { b.ricochet = true; b.pierce++; b.life = Math.max(b.life, 1); }
    }
    if (b.kind === 'token') {
      // токен рассыпается на три осколка
      const a0 = Math.atan2(b.vy, b.vx);
      for (let k = -1; k <= 1; k++) { const a = a0 + k * .5; bullet('b', b.x + Math.cos(a) * 6, b.y + Math.sin(a) * 6, a, 300, 2 * G.mods.dmg, { life: .35, knock: 30 }).hits.add(e); }
      if (random() < .2) say(e.x, e.y - 24, pick(['токенизирован', '3 токена', '<|endoftext|>']), P.green);
    }
    if (b.kind !== 'flame') burst(b.x, b.y, SPLAT[e.type] || [P.pink], 2, 40);
    if (b.pierce-- <= 0) { b.life = 0; return; }
  }
}

export function updateBullets(dt: number): void {
  for (const b of G.bullets) {
    if (b.kind === 'grenade') { grenade(b, dt); continue; }
    // свежая пуля сначала проверяет попадание там, где родилась: враг мог стоять вплотную
    if (!b.age && b.kind !== 'orbit') hitEnemies(b);
    if (b.life <= 0) continue;
    b.age = (b.age ?? 0) + dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.rot += dt * 12;
    if (!fly(b, dt)) continue;
    if (hitPrompt(b.x, b.y)) { b.life = 0; burst(b.x, b.y, [P.white, P.cyan], 3, 40); sfx('type', .02); continue; }
    if (!hitProps(b)) continue;
    hitEnemies(b);
  }
  G.bullets = G.bullets.filter(b => {
    const alive = b.life > 0 && b.x > 0 && b.y > 0 && b.x < WW && b.y < WH;
    // Макаров: промах сбрасывает серию
    if (!alive && b.streak && !b.hits.size) G.p.streak = 0;
    return alive;
  });
  G.enemies = G.enemies.filter(e => !e.dead);
  updateEBullets(dt);
}

const HURT_TEXT: Partial<Record<string, string>> = { amen: 'аминь', noodle: 'лапша на ушах', letter: 'delve', reflect: 'па-де-де', drop: 'мокро', fur: 'шерсть', grain: 'гречка', ebullet: 'от себя не убежишь', eslipper: 'ТАПКОМ' };
const rocketBlast = (b: EBullet): void => explode(b.x, b.y, 24, 2, { pdmg: b.dmg, colors: [P.red, P.vest, P.gold] });

/** Брошенное по дуге (кожура, бутылка): приземляется и оставляет лужу или кожуру. */
function lobbed(b: EBullet, dt: number): void {
  b.t += dt; const k = Math.min(1, b.t / b.dur!), h0 = b.kind === 'bottle' ? 28 : 12;
  b.x = b.x0! + (b.tx! - b.x0!) * k; b.gy = b.gy0! + (b.ty! - b.gy0!) * k; b.z = h0 * (1 - k) + Math.sin(k * Math.PI) * 20; b.y = b.gy - b.z;
  if (k < 1) return;
  b.life = 0;
  if (b.kind === 'peel') G.peels.push({ x: b.tx!, y: b.ty!, t: 10 });
  else { G.zones.push({ x: b.tx!, y: b.ty!, r: 22, t: 5, max: 5, kind: 'foam' }); burst(b.tx!, b.ty! - 2, [P.bottle, P.white, P.gold], 14, 60); sfx('bottle', .05); }
}

function updateEBullets(dt: number): void {
  const p = G.p;
  for (const b of G.ebullets) {
    if (b.kind === 'peel' || b.kind === 'bottle') { lobbed(b, dt); continue; }
    if (b.home) steer(b, Math.atan2(p.y - 9 - b.y, p.x - b.x), 1.3 * dt, Math.hypot(b.vx, b.vy));
    if (b.kind === 'eslipper') steer(b, Math.atan2(p.y - 9 - b.y, p.x - b.x), 2.6 * dt, 110);
    if (b.kind === 'erocket') {
      G.parts.push({ x: b.x, y: b.y, vx: rnd(8), vy: rnd(8), life: .3, max: .3, color: pick([P.red, P.vest]), size: 2 });
      if (b.life <= dt) { b.life = 0; rocketBlast(b); continue; }
    }
    const sp = G.mods.ebs;
    b.x += b.vx * dt * sp; b.y += b.vy * dt * sp; b.life -= dt; b.t += dt;
    const pr = bulletProp(b.x, b.y);
    if (pr) { b.life = 0; if (b.kind === 'erocket') rocketBlast(b); else damageProp(pr, 1); }
    else if (Math.hypot(b.x - p.x, b.y - (p.y - p.hy)) < b.r + p.hr - 1) {
      b.life = 0;
      if (b.kind === 'erocket') { rocketBlast(b); continue; }
      if (b.kind === 'digit') p.scramble = 6.7;
      hurt(b.dmg, b.kind === 'word' ? b.w : b.kind === 'digit' ? (b.ch === '6' ? 'SIX' : 'SEVEN') : HURT_TEXT[b.kind]);
    }
  }
  G.ebullets = G.ebullets.filter(b => b.life > 0);
}
