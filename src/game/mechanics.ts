// Механики уровней: у каждого уровня своя фишка, которая меняет, как на нём играть.
import { P } from '../content/palette';
import type { MechanicId } from '../content/levels';
import { random, rnd, pick } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner, burst, ring } from './fx';
import { spawnPoint, scatter, pushOut } from './arena';
import { isBoss } from './body';
import { hitEnemy, checkDeath } from './combat';
import { addEnemy, spawnPortal } from './spawn';
import { levelDef } from './levels';
import { WW } from './state';

/** Состояние механики текущего уровня (сбрасывается при входе на уровень). */
export interface MechState { t: number; warn: number; active: number; aux: number }
export const freshMech = (): MechState => ({ t: 0, warn: 0, active: 0, aux: 0 });

// ---------- опенспейс: стендап ----------
export const STANDUP_EVERY = 50, STANDUP_LEN = 3;
function standup(dt: number): void {
  const m = G.mech;
  if (m.active > 0) { m.active -= dt; return; }
  m.t += dt;
  if (m.t >= STANDUP_EVERY - 3 && m.warn === 0) { m.warn = 1; banner('СТЕНДАП ЧЕРЕЗ 3…', 'все замирают и отчитываются. стрелять нельзя', 2.5, P.cyan); }
  if (m.t < STANDUP_EVERY) return;
  m.t = 0; m.warn = 0; m.active = STANDUP_LEN;
  for (const e of G.enemies) if (!isBoss(e)) { e.stun = Math.max(e.stun, STANDUP_LEN); e.stunKind = 'standup'; }
  const lines = ['вчера генерировал руки', 'сегодня тоже руки', 'блокеров нет', 'синкнемся после', 'я на созвоне'];
  for (const e of G.enemies.slice(0, 4)) say(e.x, e.y - 24, pick(lines), P.paper);
  banner('СТЕНДАП', 'что делал вчера? что будешь делать сегодня?', STANDUP_LEN, P.cyan);
  sfx('level');
}
/** Во время стендапа стрелять нельзя. */
export const inStandup = (): boolean => levelDef().mechanic === 'standup' && G.mech.active > 0;

// ---------- дача: баня, дядя Вася по-соседски ----------
function garden(dt: number): void {
  const m = G.mech, banya = G.props.find(pr => pr.kind === 'banya');
  // пар у бани лечит (зона живёт, пока жива баня)
  if (banya) {
    const z = G.zones.find(q => q.kind === 'steam');
    if (!z) G.zones.push({ x: banya.x + banya.w / 2, y: banya.y + banya.h + 22, r: 30, t: 1, max: 1, kind: 'steam', heal: 7 });
    else z.t = 1;
  }
  m.t += dt;
  if (m.t >= 70) {
    m.t = 0;
    const p = G.p;
    G.allies.push({ kind: 'vasya', x: p.x - 16, y: p.y + 6, t: 10, fire: 0, ang: 0, face: 1, talk: .5, shotgun: true });
    say(p.x - 16, p.y - 30, pick(['Гена, я по-соседски', 'картошку потом докопаю', 'дай пострелять']), P.paper, true);
    sfx('ally');
  }
}

// ---------- канализация: течения и смыв ----------
/** Мостки: во время смыва тут сухо. Пол рисует их по этим же прямоугольникам. */
export const BRIDGES: readonly [number, number, number, number][] = [[180, 40, 40, 480], [580, 40, 40, 480], [360, 240, 80, 80]];
/** Каналы с течением: [y0, y1, скорость по x]. */
export const CHANNELS: readonly [number, number, number][] = [[138, 168, 45], [392, 422, -45]];
export const FLUSH_EVERY = 45, FLUSH_LEN = 4;
const onBridge = (x: number, y: number): boolean => BRIDGES.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh);
function flush(dt: number): void {
  const m = G.mech, p = G.p;
  for (const [y0, y1, vx] of CHANNELS) {
    if (p.y > y0 && p.y < y1 && p.dashT <= 0 && !onBridge(p.x, p.y)) { p.x += vx * dt; pushOut(p); }
    for (const e of G.enemies) if (!e.alt && !e.heavy && e.y > y0 && e.y < y1) e.x += vx * dt;
  }
  if (m.active > 0) {
    m.active -= dt;
    if (!onBridge(p.x, p.y) && p.dashT <= 0) { p.hp -= 12 * dt; if (random() < dt * 2) say(p.x, p.y - 22, 'НА МОСТКИ!', P.cyan); checkDeath(); }
    for (const e of G.enemies) if (!e.alt && !isBoss(e) && !onBridge(e.x, e.y)) { e.aux = (e.aux ?? 0) - dt; if (e.aux <= 0) { e.aux = .5; hitEnemy(e, 6, 0, 0, { noCrit: true }); } }
    return;
  }
  m.t += dt;
  if (m.t >= FLUSH_EVERY - 3 && m.warn === 0) { m.warn = 1; banner('СМЫВ ЧЕРЕЗ 3…', 'беги на мостки', 2.5, P.cyan); sfx('whistle'); }
  if (m.t >= FLUSH_EVERY) { m.t = 0; m.warn = 0; m.active = FLUSH_LEN; banner('СМЫВ', 'ес ес ес ес ес', FLUSH_LEN, P.cyan); sfx('flush'); }
}
export const flooding = (): boolean => levelDef().mechanic === 'flush' && G.mech.active > 0;

// ---------- музей: лазерная сигнализация и оживающие картины ----------
/** Лучи: [x0, y0, x1, y1, сдвиг фазы]. Горят 2,5 с, гаснут на 2 с. */
export const LASERS: readonly [number, number, number, number, number][] = [[250, 60, 250, 500, 0], [550, 60, 550, 500, 2.2], [100, 150, 700, 150, 1.1], [100, 420, 700, 420, 3.3]];
const LASER_ON = 2.5, LASER_CYCLE = 4.5;
/** Горит ли луч i (и сколько до включения, чтобы мигнуть предупреждением). */
export function laserState(i: number): { on: boolean; soon: boolean } {
  const c = (G.t + LASERS[i][4]) % LASER_CYCLE;
  return { on: c < LASER_ON, soon: c > LASER_CYCLE - .5 };
}
function lasers(dt: number): void {
  const m = G.mech, p = G.p;
  m.warn -= dt; // кулдаун тревоги
  if (m.warn <= 0) for (let i = 0; i < LASERS.length; i++) {
    if (!laserState(i).on) continue;
    const [x0, y0, x1, y1] = LASERS[i];
    const near = x0 === x1 ? Math.abs(p.x - x0) < 3 && p.y > y0 && p.y < y1 : Math.abs(p.y - y0) < 3 && p.x > x0 && p.x < x1;
    if (!near) continue;
    m.warn = 6;
    banner('ТРЕВОГА!', 'ТИШЕ! НЕ ТРОГАТЬ ЭКСПОНАТЫ!', 2, P.red); sfx('boss');
    for (let k = 0; k < 2; k++) { const sp = spawnPoint(70, { x: p.x, y: p.y, r: 130 }); spawnPortal('guard', sp.x, sp.y, .5, false); }
    break;
  }
  // картины оживают Джокондами (не больше двух живых из картин)
  m.t += dt;
  if (m.t >= 25) {
    m.t = 0;
    const alive = G.enemies.filter(e => e.type === 'mona' && e.master === null).length;
    const paintings = G.props.filter(pr => pr.kind === 'painting');
    if (paintings.length && alive < 2) {
      const pr = pick(paintings), e = addEnemy('mona', pr.x + pr.w / 2, pr.y + pr.h + 8);
      e.master = null; say(e.x, e.y - 34, 'КАРТИНА ОЖИЛА', P.gold, true);
    }
  }
}

// ---------- латентное пространство: перестройка карты ----------
export const RESHUFFLE_EVERY = 30;
function placeLatentZones(): void {
  G.zones = G.zones.filter(z => z.kind !== 'invert' && z.kind !== 'noise');
  for (const [i, [, x, y]] of scatter('cube', 4).entries()) G.zones.push({ x, y, r: 40, t: Infinity, max: 1, kind: i < 2 ? 'invert' : 'noise' });
}
function reshuffle(dt: number): void {
  const m = G.mech;
  if (!m.aux) { m.aux = 1; placeLatentZones(); }
  // в зоне шума враги почти невидимы
  for (const e of G.enemies) {
    if (e.type === 'troll') continue;
    e.vis = G.zones.some(z => z.kind === 'noise' && Math.hypot(e.x - z.x, (e.y - z.y) * 1.6) < z.r) ? .15 : 1;
  }
  m.t += dt;
  if (m.t >= RESHUFFLE_EVERY - 2 && m.warn === 0) { m.warn = 1; banner('ПЕРЕОБУЧЕНИЕ ЧЕРЕЗ 2…', 'карта сейчас сменит веса', 1.8, P.purple); }
  if (m.t < RESHUFFLE_EVERY) return;
  m.t = 0; m.warn = 0;
  const spots = scatter('cube', G.props.length);
  G.props.forEach((pr, i) => {
    const s = spots[i]; if (!s) return;
    burst(pr.x + pr.w / 2, pr.y, [P.purple, P.cyan, P.pink], 8, 50);
    pr.x = s[1]; pr.y = s[2];
    // не ставить укрытие на героя
    if (Math.hypot(pr.x - G.p.x, pr.y - G.p.y) < 30) pr.x = (pr.x + 200) % (WW - 60) + 30;
  });
  placeLatentZones();
  banner('РЕАЛЬНОСТЬ ПЕРЕОБУЧЕНА', pick(['эпоха 43', 'loss: NaN', 'веса перемешаны']), 2, P.purple);
  sfx('inject');
}

// ---------- квартира скуфа: гречневая лава и реклама из телевизора ----------
/** Реки гречки: цепочки кругов. Центр — сухой. */
export function buckwheatRivers(): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= 8; i++) { out.push([60 + i * 30, 180 + i * 8]); out.push([740 - i * 30, 380 - i * 8]); }
  return out;
}
function buckwheat(dt: number): void {
  const m = G.mech;
  if (!m.aux) { m.aux = 1; for (const [x, y] of buckwheatRivers()) G.zones.push({ x, y, r: 20, t: Infinity, max: 1, kind: 'lava' }); }
  m.t += dt;
  const tv = G.props.find(pr => pr.kind === 'tv');
  if (tv && m.t >= 18) {
    m.t = 0;
    for (let i = 0; i < 3; i++) spawnPortal(pick(['hand', 'streamer', 'skibidi', 'labubu'] as const), tv.x + 6 + i * 12, tv.y - 30 + rnd(8), .6, false);
    ring(tv.x + tv.w / 2, tv.y - 10, P.pink, 40, .4);
    banner('РЕКЛАМНАЯ ПАУЗА', pick(['купи слоп — второй в подарок', 'подпишись на скуфа', 'гречка «Геннадий» — вкус детства']), 2, P.pink);
    sfx('portal');
  }
}

const MECHANICS: Record<MechanicId, (dt: number) => void> = { standup, garden, flush, lasers, reshuffle, buckwheat };
export function updateMechanic(dt: number): void {
  const id = levelDef().mechanic;
  if (id) MECHANICS[id](dt);
}
