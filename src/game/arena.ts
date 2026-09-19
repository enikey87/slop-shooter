// Арена: расстановка укрытий, столкновения с ними и поиск точек спавна.
import { PROPDEF, type PropKind } from '../content/props';
import { clamp } from '../engine/math';
import { random, rnd } from '../engine/rng';
import { G } from './world';
import { WW, WH, type Prop } from './state';
import type { LevelId } from '../content/levels';

export function makeProp(kind: PropKind, x: number, y: number, hpMul = 1): Prop {
  const d = PROPDEF[kind], hp = d.hp * hpMul;
  return { kind, x, y, w: d.w, h: d.h, hp, max: hp, seed: random() * 10, flash: 0 };
}

type Place = [PropKind, number, number];
/** Расстановка укрытий по уровням. Центр (портал и старт героя) оставляем свободным. */
const LAYOUTS: Record<LevelId, () => Place[]> = {
  parking: () => {
    const out: Place[] = [];
    const groups: [number, number, 'h' | 'v', number][] = [[120, 110, 'h', 3], [560, 96, 'h', 2], [300, 190, 'v', 2], [180, 350, 'h', 2], [630, 300, 'v', 3], [300, 470, 'h', 3], [690, 480, 'h', 1], [80, 480, 'h', 1], [470, 380, 'h', 1], [470, 180, 'v', 1]];
    for (const [x, y, o, k] of groups) for (let i = 0; i < k; i++) out.push(['cab', o === 'h' ? x + i * 16 : x, o === 'v' ? y + i * 8 : y]);
    for (const [x, y] of [[172, 108], [182, 116], [540, 100], [330, 270], [340, 276], [520, 300], [250, 420], [700, 200], [150, 250], [610, 470], [420, 520], [60, 90]]) out.push(['barrel', x, y]);
    for (const [x, y] of [[240, 100], [720, 380], [100, 300]]) out.push(['vend', x, y]);
    return out;
  },
  // ряды столов, островки пуфиков, кеги комбучи у кухни
  office: () => {
    const out: Place[] = [];
    for (const y of [110, 190, 380, 460]) for (const x of [90, 170, 560, 640]) out.push(['desk', x, y]);
    for (const [x, y] of [[300, 120], [316, 128], [470, 440], [486, 432], [120, 290], [660, 290]]) out.push(['beanbag', x, y]);
    for (const [x, y] of [[380, 90], [392, 94], [404, 90], [380, 480], [396, 484]]) out.push(['keg', x, y]);
    out.push(['vend', 720, 120], ['vend', 60, 460]);
    return out;
  },
  // грядки, баня, улей, туалет в углу огорода
  dacha: () => {
    const out: Place[] = [];
    for (const y of [360, 390, 420, 450]) out.push(['bed', 90, y], ['bed', 130, y]);
    for (const y of [120, 150]) out.push(['bed', 560, y], ['bed', 600, y], ['bed', 640, y]);
    out.push(['banya', 110, 110], ['hive', 700, 230], ['hive', 720, 244], ['outhouse', 700, 470], ['barrel', 250, 110], ['barrel', 520, 470]);
    return out;
  },
  // трубы вдоль каналов (каналы и мостки рисует пол и считает механика смыва)
  sewer: () => {
    const out: Place[] = [];
    for (const x of [60, 260, 470, 660]) out.push(['pipe', x, 118], ['pipe', x, 430]);
    out.push(['barrel', 100, 280], ['barrel', 700, 280], ['barrel', 300, 300], ['barrel', 500, 260]);
    return out;
  },
  // картины вдоль стен, аллея статуй, сувенирная лавка
  museum: () => {
    const out: Place[] = [];
    for (const x of [90, 190, 290, 490, 590, 690]) out.push(['painting', x, 70], ['painting', x, 500]);
    for (const y of [180, 380]) for (const x of [200, 320, 470, 590]) out.push(['statue', x, y]);
    out.push(['vend', 50, 280], ['vend', 736, 280]);
    return out;
  },
  // кубы стоят где попало — и потом переставляются (механика «перестройка»)
  latent: () => scatter('cube', 14),
  // гигантская мебель: диван-хребет, телевизор, бутылки-колонны
  apartment: () => [['gsofa', 360 - 35, 60], ['tv', 382, 480], ['gbottle', 150, 180], ['gbottle', 640, 180], ['gbottle', 180, 400], ['gbottle', 610, 400], ['keg', 90, 90], ['keg', 700, 90]]
};
/** Случайная, но детерминированная расстановка (от seed забега), подальше от центра. */
export function scatter(kind: PropKind, n: number): Place[] {
  const out: Place[] = [];
  for (let i = 0; i < n * 10 && out.length < n; i++) {
    const x = 40 + random() * (WW - 100), y = 50 + random() * (WH - 110);
    if (Math.hypot(x - WW / 2, y - WH / 2) < 90) continue;
    if (out.some(([, ox, oy]) => Math.hypot(ox - x, oy - y) < 50)) continue;
    out.push([kind, Math.round(x), Math.round(y)]);
  }
  return out;
}

export function layoutProps(level: LevelId = 'parking'): Prop[] {
  return LAYOUTS[level]().map(([k, x, y]) => makeProp(k, x, y));
}

export const propAt = (x: number, y: number, m = 0): Prop | undefined =>
  G.props.find(r => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m);
/** Пули летят на высоте груди, а укрытие — по «ногам»: сдвиг на 9 px. */
export const bulletProp = (x: number, y: number): Prop | undefined => propAt(x, y + 9);

/** Выталкивает круг из укрытий и за стены. Возвращает укрытие, в которое упёрлись. */
export function pushOut(o: { x: number; y: number; r?: number }): Prop | null {
  const r = o.r ?? 0;
  let hit: Prop | null = null;
  for (const pr of G.props) {
    const cx = clamp(o.x, pr.x, pr.x + pr.w), cy = clamp(o.y, pr.y, pr.y + pr.h);
    const dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      hit = pr;
      if (d2 === 0) { o.y = pr.y + pr.h + r; continue; }
      const d = Math.sqrt(d2);
      o.x += dx / d * (r - d); o.y += dy / d * (r - d);
    }
  }
  o.x = clamp(o.x, 7 + r, WW - 7 - r); o.y = clamp(o.y, 10 + r, WH - 7 - r);
  return hit;
}

export function spawnPoint(minD: number, near?: { x: number; y: number; r: number }): { x: number; y: number } {
  const p = G.p;
  for (let i = 0; i < 60; i++) {
    const x = near ? near.x + rnd(near.r) : 20 + random() * (WW - 40);
    const y = near ? near.y + rnd(near.r) : 24 + random() * (WH - 40);
    if (x < 16 || y < 20 || x > WW - 16 || y > WH - 16) continue;
    if (Math.hypot(x - p.x, y - p.y) < minD) continue;
    if (propAt(x, y, 12)) continue;
    return { x, y };
  }
  return { x: p.x < WW / 2 ? WW - 30 : 30, y: p.y < WH / 2 ? WH - 30 : 30 };
}
