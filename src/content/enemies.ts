// Данные врагов и боссов: размеры, здоровье, урон, стоимость в волнах. Поведение — в game/.
import { P } from './palette';

export interface EnemyDef {
  /** радиус коллизии, px мира */
  readonly r: number;
  /** высота центра тела над «ногами» */
  readonly hy: number;
  /** радиус хитбокса для пуль */
  readonly hr: number;
  readonly hp: number;
  readonly spd: number;
  readonly dmg: number;
  readonly score: number;
  /** для генератора волн: стоимость, с какой волны, вес */
  readonly cost?: number;
  readonly from?: number;
  readonly w?: number;
  readonly heavy?: 1;
  /** высота полёта; летающие игнорируют стены */
  readonly fly?: number;
  /** имя для полосы здоровья — есть только у боссов */
  readonly boss?: string;
  /** пороги фаз по доле здоровья */
  readonly phases?: readonly number[];
}

export const TYPES = {
  hand:      { r: 4,  hy: 5,  hr: 5,  hp: 2,   spd: 62, dmg: 5,  score: 1,   cost: 1,  from: 1, w: 6 },
  cat:       { r: 7,  hy: 7,  hr: 8,  hp: 6,   spd: 34, dmg: 10, score: 3,   cost: 3,  from: 2, w: 3 },
  kitten:    { r: 5,  hy: 5,  hr: 5,  hp: 2,   spd: 54, dmg: 6,  score: 1 },
  spag:      { r: 5,  hy: 12, hr: 7,  hp: 5,   spd: 30, dmg: 10, score: 4,   cost: 4,  from: 3, w: 2 },
  shark:     { r: 6,  hy: 9,  hr: 8,  hp: 8,   spd: 40, dmg: 14, score: 5,   cost: 4,  from: 3, w: 2.4 },
  ballerina: { r: 5,  hy: 12, hr: 7,  hp: 7,   spd: 44, dmg: 9,  score: 5,   cost: 4,  from: 4, w: 2 },
  golem:     { r: 9,  hy: 15, hr: 11, hp: 22,  spd: 17, dmg: 18, score: 6,   cost: 6,  from: 4, w: 1.6, heavy: 1 },
  tung:      { r: 6,  hy: 13, hr: 8,  hp: 14,  spd: 30, dmg: 14, score: 6,   cost: 5,  from: 5, w: 2 },
  grandpa:   { r: 6,  hy: 11, hr: 8,  hp: 12,  spd: 16, dmg: 0,  score: 4,   cost: 5,  from: 5, w: 1 },
  croc:      { r: 8,  hy: 0,  hr: 10, hp: 10,  spd: 38, dmg: 0,  score: 7,   cost: 6,  from: 6, w: 1.8, fly: 18 },
  horse:     { r: 9,  hy: 15, hr: 11, hp: 25,  spd: 20, dmg: 18, score: 8,   cost: 8,  from: 7, w: 1.4, heavy: 1 },
  horseFree: { r: 7,  hy: 8,  hr: 8,  hp: 6,   spd: 75, dmg: 10, score: 3 },
  jesus:     { r: 10, hy: 16, hr: 13, hp: 45,  spd: 14, dmg: 18, score: 15,  cost: 12, from: 8, w: .8, heavy: 1 },
  jboss:     { r: 20, hy: 32, hr: 26, hp: 320, spd: 12, dmg: 30, score: 150, boss: 'ВЕЛИКИЙ КРЕВЕТОЧНЫЙ ИИСУС', heavy: 1 },
  mama:      { r: 20, hy: 22, hr: 24, hp: 420, spd: 14, dmg: 30, score: 200, boss: 'МАМА ПРОМПТ', heavy: 1 },
  cboss:     { r: 14, hy: 0,  hr: 22, hp: 380, spd: 30, dmg: 0,  score: 200, boss: 'БОМБАРДИРО КРОКОДИЛО MEGA', fly: 30, heavy: 1 },
  skibidi:   { r: 5,  hy: 12, hr: 7,  hp: 6,   spd: 70, dmg: 10, score: 5,   cost: 3,  from: 3, w: 2.2 },
  chimp:     { r: 5,  hy: 11, hr: 7,  hp: 7,   spd: 36, dmg: 9,  score: 5,   cost: 4,  from: 4, w: 1.8 },
  amogus:    { r: 5,  hy: 8,  hr: 7,  hp: 9,   spd: 80, dmg: 14, score: 8,   cost: 4,  from: 4, w: 1.2 },
  doge:      { r: 6,  hy: 8,  hr: 8,  hp: 9,   spd: 34, dmg: 8,  score: 6,   cost: 5,  from: 5, w: 1.6 },
  capy:      { r: 8,  hy: 8,  hr: 10, hp: 40,  spd: 22, dmg: 10, score: 10,  cost: 6,  from: 5, w: .9, heavy: 1 },
  troll:     { r: 6,  hy: 0,  hr: 8,  hp: 10,  spd: 48, dmg: 12, score: 6,   cost: 4,  from: 5, w: 1.2, fly: 7 },
  patapim:   { r: 8,  hy: 14, hr: 10, hp: 20,  spd: 26, dmg: 16, score: 7,   cost: 6,  from: 6, w: 1.4, heavy: 1 },
  floppa:    { r: 7,  hy: 9,  hr: 9,  hp: 16,  spd: 30, dmg: 18, score: 8,   cost: 6,  from: 6, w: 1.4 },
  lirili:    { r: 7,  hy: 13, hr: 9,  hp: 18,  spd: 20, dmg: 12, score: 7,   cost: 6,  from: 7, w: 1.1 },
  apostle:   { r: 5,  hy: 9,  hr: 7,  hp: 18,  spd: 0,  dmg: 0,  score: 4 },
  oiia:      { r: 5,  hy: 9,  hr: 7,  hp: 14,  spd: 26, dmg: 10, score: 8,   cost: 5,  from: 4, w: 1.4 },
  sigma:     { r: 6,  hy: 14, hr: 8,  hp: 22,  spd: 30, dmg: 14, score: 9,   cost: 6,  from: 5, w: 1.2 },
  quadro:    { r: 5,  hy: 6,  hr: 7,  hp: 7,   spd: 74, dmg: 9,  score: 4,   cost: 5,  from: 4, w: 1.4 },
  labubu:    { r: 4,  hy: 7,  hr: 6,  hp: 4,   spd: 62, dmg: 0,  score: 3,   cost: 2,  from: 5, w: 1.2 },
  evasya:    { r: 5,  hy: 9,  hr: 7,  hp: 20,  spd: 0,  dmg: 0,  score: 5 },
  skuf:      { r: 14, hy: 28, hr: 22, hp: 900, spd: 20, dmg: 30, score: 500, boss: 'СКУФ: ГЕННАДИЙ ЧЕРЕЗ 10 ЛЕТ', heavy: 1, phases: [.7, .4] },
  sixseven:  { r: 5,  hy: 12, hr: 7,  hp: 8,   spd: 45, dmg: 8,  score: 6,   cost: 4,  from: 3, w: 1.8 },
  skboss:    { r: 16, hy: 26, hr: 20, hp: 400, spd: 22, dmg: 25, score: 220, boss: 'СКИБИДИ-УНИТАЗ ПРАЙМ', heavy: 1 },
  fboss:     { r: 18, hy: 20, hr: 22, hp: 420, spd: 26, dmg: 30, score: 220, boss: 'ВЕЛИКАЯ ШЛЁПА', heavy: 1 },
  ouro:      { r: 10, hy: 9,  hr: 13, hp: 300, spd: 44, dmg: 25, score: 300, boss: 'МОДЕЛЬ-КОЛЛАПС: УРОБОРОС', heavy: 1 },
  oseg:      { r: 7,  hy: 8,  hr: 9,  hp: 28,  spd: 0,  dmg: 15, score: 4,   heavy: 1 },
  // архетипы, которых не хватало (по бестиарию Alien Shooter)
  streamer:  { r: 5,  hy: 11, hr: 7,  hp: 5,   spd: 68, dmg: 0,  score: 5,   cost: 3,  from: 6, w: 1.6 },
  mona:      { r: 6,  hy: 14, hr: 9,  hp: 14,  spd: 26, dmg: 0,  score: 8,   cost: 6,  from: 8, w: 1 },
  printer:   { r: 9,  hy: 10, hr: 11, hp: 60,  spd: 0,  dmg: 0,  score: 12,  cost: 8,  from: 7, w: .7, heavy: 1 },
  shawa:     { r: 6,  hy: 9,  hr: 8,  hp: 16,  spd: 22, dmg: 10, score: 6,   cost: 4,  from: 6, w: 1.2 }
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof TYPES;
export const enemyDef = (id: string): EnemyDef => (TYPES as Record<string, EnemyDef>)[id];

/** Цвета брызг слопа при смерти. */
export const SPLAT: Record<EnemyId, readonly string[]> = {
  hand: [P.skin, P.skinD, P.pink], cat: [P.grey, P.pink], kitten: [P.grey, P.pink], spag: [P.noodle, P.red], golem: [P.paper, P.red],
  jesus: [P.shrimp, P.gold], jboss: [P.shrimp, P.gold, P.pink], shark: [P.shark, P.white, P.red], ballerina: [P.coffee, P.coffeeL, P.pink],
  tung: [P.wood, P.woodL], grandpa: [P.pink, P.white, P.gold], croc: [P.croc, P.grey], cboss: [P.croc, P.grey, P.red],
  horse: [P.suit, P.horse], horseFree: [P.horse, P.hair], mama: [P.pink, P.pinkD, P.white],
  skibidi: [P.toilet, P.skin, P.cyan], chimp: [P.banana, P.monkey], amogus: [P.sus, P.visor], doge: [P.doge, P.dogeL],
  capy: [P.capy, P.orange], troll: [P.troll, P.greyL], patapim: [P.wood, P.green, P.tan], floppa: [P.floppa, P.floppaD],
  lirili: [P.cactus, P.grey], apostle: [P.shrimp, P.gold], oiia: [P.grey, P.oiiaW, P.pink], sigma: [P.skin, P.turtle], quadro: [P.white, P.brownL, P.orange, P.pink], labubu: [P.lab, P.labP], evasya: [P.track, P.white], skuf: [P.tank, P.skin, P.bottle, P.vest], sixseven: [P.green, P.skin, P.white], skboss: [P.toilet, P.cyan, P.skin], fboss: [P.floppa, P.floppaD, P.pink], ouro: [P.purple, P.pink, P.gold], oseg: [P.purple, P.gold],
  streamer: [P.vest, P.gold, P.white], mona: [P.brown, P.gold, P.skin], printer: [P.greyL, P.paper, P.skin], shawa: [P.tan, P.green, P.white]
};

/** Скорость анимации, кадров в секунду. */
export const FPS: Partial<Record<EnemyId, number>> = { hand: 14, cat: 9, kitten: 12, spag: 7, golem: 5, jesus: 6, jboss: 5, shark: 10, croc: 12, ballerina: 8, horse: 7, horseFree: 14, grandpa: 4, mama: 4, cboss: 12, skibidi: 10, chimp: 8, amogus: 12, doge: 8, capy: 5, lirili: 5, skboss: 8, oseg: 8, sixseven: 8, sigma: 6, quadro: 14, skuf: 4, streamer: 14, mona: 3, printer: 6, shawa: 5 };

/** Из кого собирается хвост Уробороса. */
export const SEG_SKINS: readonly EnemyId[] = ['sixseven', 'hand', 'cat', 'spag', 'shark', 'ballerina', 'doge', 'capy', 'skibidi', 'amogus', 'grandpa', 'tung', 'chimp', 'golem'];
