// Всё состояние забега в одном объекте. Симуляция меняет только его; рендер и UI только читают.
import type { EnemyId } from '../content/enemies';
import type { AffixId } from '../content/affixes';
import type { Mods, AbilityLevels, PerkDef } from '../content/perks';
import type { PropKind } from '../content/props';
import type { MamaPrompt } from '../content/bosses';
import { WEAPON_IDS, type WeaponId } from '../content/weapons';
import { baseMods } from '../content/perks';
import type { LevelId, EndlessMod } from '../content/levels';

export const WW = 800, WH = 560;

export type RunState = 'attract' | 'play' | 'perk' | 'pause' | 'dead' | 'victory' | 'transit';

// ---------- игрок ----------
export interface GunSlot {
  id: WeaponId;
  ammo: number;
  altCd?: number;
  /** пушку отобрала Шлёпа, лежит на карте */
  stolen?: boolean;
}
export interface Ghost { x: number; y: number; t: number; face: number; f: number }
export interface Player {
  x: number; y: number;
  /** радиус коллизии, высота и радиус хитбокса тела */
  r: number; hy: number; hr: number;
  hp: number;
  ang: number; face: number;
  /** точка прицела в координатах мира */
  aimX: number; aimY: number;
  /** последнее направление движения — для кувырка */
  dx: number; dy: number;
  moving: boolean; anim: number; recoil: number;
  fireT: number; inv: number; hit: number;
  dashT: number; dashCd: number; dashId: number;
  trail: Ghost[];
  level: number;
  /** 6 слотов, пустой — null. Слот 0 — всегда Макаров. */
  guns: (GunSlot | null)[]; cur: number;
  // состояние отдельных пушек
  /** Макаров: попаданий подряд */
  streak: number;
  /** пулемёт: раскрутка 0..1 и сколько ещё держится после отпускания; счётчик пуль для скоб */
  spin: number; spinHold: number; mgN: number;
  /** рельса: сколько секунд заряжается (0 — не заряжается) */
  charge: number;
  /** лазер: нагрев 0..2 с и цель */
  heat: number; heatTarget: Enemy | null;
  /** пылесос: всосано снарядов */
  vacEaten: number;
  /** дробовик: счётчик выстрелов для жакана */
  shotN: number;
  cdQ: number; cdE: number; cdC: number; cdV: number; cdG: number;
  /** заряд блэкаута, 0..100 */
  ult: number;
  /** история позиций для CTRL+Z */
  hist: { x: number; y: number; hp: number }[]; histT: number;
  auraT: number;
  // дебаффы от врагов
  invert: number; noGun: number; scramble: number; slip: number; sdx: number; sdy: number;
  cling: number; sugar: number;
  /** через сколько секунд лабубу надоест и один отвалится сам */
  clingT: number;
  guilt: boolean; wobble: boolean; mogged: boolean; timeSlow: boolean;
  rooted: false | 'roots' | 'foam';
}

// ---------- враги ----------
export type EnemyState = 'walk' | 'wind' | 'charge' | 'hop' | 'smack' | 'stomp' | 'spin' | 'air' | 'fall' | 'leap' | 'crouch';
export type StunKind = '' | 'wifi' | 'captcha' | 'bonk' | 'standup';
export interface Enemy {
  type: EnemyId;
  x: number; y: number;
  r: number; hy: number; hr: number;
  hp: number; max: number;
  /** высота полёта, 0 — на земле */
  alt: number;
  /** высота прыжка (визуальная, но неуязвимость от контакта) */
  z: number;
  spd: number; dmg: number; score: number;
  heavy: boolean;
  t: number; face: number;
  hitCd: number; cd: number; atk: number; flash: number;
  /** отброс */
  kx: number; ky: number;
  variant: number;
  elite: boolean; aff: AffixId | null; affT: number; shield: number;
  stun: number; stunKind?: StunKind;
  /** босс: сколько ещё нельзя оглушить (после предыдущего оглушения) */
  stunGuard?: number; stunFor?: number;
  slowT: number; calm: number; charm: number; charmBoom?: boolean;
  /** сколько ещё нельзя переманить капчей (чтобы не держать врага «своим» вечно) */
  charmImmune?: number;
  /** прозрачность (троллфейс) */
  vis: number;
  state: EnemyState; st: number;
  orbit: number;
  trail: Ghost[];
  phase: number;
  /** ступень: 0 черновик, 1 финал, 2 8K, 3 PRO (content/tiers.ts) */
  tier: number;
  dead?: boolean;
  /** вторая фаза обычного врага: у голема отвалилась вывеска, у сигмы слетели очки */
  broken?: boolean;
  /** мутация абсурда: шапка, лунная походка, двойник-призрак, крошка */
  mut?: 'hat' | 'moonwalk' | 'twin' | 'tiny';
  /** стример: запал горит, взрыв уже назначен */
  fused?: boolean;
  /** джоконда: зафиксированная точка выстрела */
  aimX?: number; aimY?: number;
  /** горение: стаки (до 3) и сколько ещё горит */
  burnS?: number; burnDur?: number; burnTick?: number;
  /** капча: получает +30% урона */
  vulnT?: number;
  /** таймер общего назначения для механик уровня */
  aux?: number;
  // флаги
  disguised?: boolean;
  noSep?: boolean;
  /** неуязвим в прыжке (OIIA в воздухе) */
  air?: boolean;
  marked?: boolean;
  dashHit?: number;
  burnT?: number;
  saidMonster?: boolean;
  // босс
  bossName?: string;
  /** неуязвимость при смене фазы */
  trans?: number;
  decoy?: boolean;
  // таймеры и состояние конкретных поведений (названы по смыслу, живут только у своих типов)
  cdx?: number; cdy?: number;           // направление рывка
  hx?: number; hy2?: number;            // тун: направление прыжка
  spin?: number;                        // балерина
  dt2?: number;                         // амогус: сколько притворяется
  sp?: number;                          // OIIA: угол вращения
  lx0?: number; ly0?: number; ltx?: number; lty?: number; lmax?: number; // прыжок
  bite?: number;
  life2?: number;                       // злой Вася
  chain?: number; leaps?: number;       // шлёпа
  /** апостол: вокруг кого кружит; сегмент: голова */
  master?: Enemy | null;
  oa?: number;
  // уроборос
  segs?: Enemy[]; segMax?: number; head?: Enemy; leader?: Enemy | null;
  skin?: EnemyId; free?: boolean;
  eating?: boolean; eatCd?: number; eatHp?: number;
  // общие таймеры спецатак боссов
  spec?: number; specN?: number; spT?: number; sa?: number; sw?: number; ring?: number; flush?: number; vol?: number;
  // иисус-босс
  dashCd?: number; dashT?: number; dx0?: number; dy0?: number;
  // мама
  prompt?: (MamaPrompt & { t: number; dur: number; edited?: boolean; hits?: number }) | null;
  // крокодил-босс
  grounded?: boolean; dive?: number; diveCd?: number; ddx?: number; ddy?: number; bt?: number; gcd?: number; ft?: number; cn?: number;
  // скуф
  intro?: boolean; wifiCd?: number; zUsed?: boolean; couch?: Prop | null; couchUsed?: boolean; enraged?: boolean; tv?: number;
}

// ---------- снаряды ----------
export type BulletKind = 'b' | 'rocket' | 'grenade' | 'staple' | 'flame' | 'book' | 'kb' | 'slipper' | 'token' | 'sonic' | 'nyan' | 'orbit';
export interface Bullet {
  kind: BulletKind;
  x: number; y: number; vx: number; vy: number;
  life: number; dmg: number;
  pierce: number; hits: Set<Enemy | Prop>;
  slow: number; knock: number; rot: number;
  /** из какой пушки — для опыта пушки */
  src?: WeaponId;
  /** сколько летит */
  age?: number;
  cluster?: boolean; mega?: boolean;
  /** Макаров: контрольный (×2); жакан дробовика */
  crit?: boolean;
  /** пуля участвует в серии Макарова */
  streak?: boolean;
  /** нян: отскоков */
  bounces?: number;
  /** клавиатура: MIDI-волна уже была */
  midi?: boolean;
  /** тапок: рикошет уже был */
  ricochet?: boolean;
  /** клавиатура-бумеранг */
  t0?: number; ret?: boolean;
  /** звуковая волна: полуширина */
  w?: number;
  /** тапок-вертолёт */
  oa?: number; hitT?: number;
  /** граната: полёт по дуге */
  x0?: number; y0?: number; tx?: number; ty?: number; t?: number; dur?: number; z?: number;
}
export type EBulletKind = 'noodle' | 'amen' | 'letter' | 'word' | 'digit' | 'drop' | 'fur' | 'reflect' | 'grain' | 'ebullet' | 'erocket' | 'eslipper' | 'peel' | 'bottle';
export interface EBullet {
  kind: EBulletKind;
  x: number; y: number; vx: number; vy: number;
  life: number; dmg: number; r: number; t: number;
  home?: boolean;
  /** скорость доворота самонаводящихся, рад/с */
  turn?: number;
  /** буква, цифра, слово для отрисовки */
  ch?: string; w?: string;
  /** брошенные по дуге (кожура, бутылка) */
  gy?: number; x0?: number; gy0?: number; tx?: number; ty?: number; dur?: number; z?: number;
}

// ---------- мир ----------
export interface Prop {
  kind: PropKind;
  x: number; y: number; w: number; h: number;
  hp: number; max: number;
  seed: number; flash: number;
  dead?: boolean;
  /** унитаз: таймер спавна */
  sp?: number;
}
export type PickupType = 'ammo' | 'hp' | 'up' | 'gun' | 'coffee' | 'carrot' | 'blindbox' | 'dubai' | 'remote' | 'stolen' | 'weapon' | 'evo';
export interface Pickup {
  x: number; y: number; type: PickupType; t: number; bob: number;
  /** пушка на полу (weapon) или отобранная (stolen) */
  gun?: WeaponId; ammo?: number;
  /** пушки из одного ящика: взял одну — остальные исчезают; reroll — можно перегенерировать */
  group?: number; reroll?: boolean;
}
export interface Portal { x: number; y: number; type: EnemyId; t: number; max: number; elite: boolean; mama?: boolean; charm?: boolean }
/** lava — гречка, invert — управление наоборот, noise — враги невидимы, steam — пар бани (лечит) */
export type ZoneKind = 'fire' | 'pfire' | 'roots' | 'foam' | 'jpeg' | 'gas' | 'lava' | 'invert' | 'noise' | 'steam';
/** без kind — лечащая трава игрока */
export interface Zone { x: number; y: number; r: number; t: number; max: number; kind?: ZoneKind; heal?: number; burn?: boolean }
export interface Puddle { x: number; y: number; r: number; t: number; col?: 'holy' | 'sewage' }
export interface Bomb { x: number; y: number; t: number; max: number; alt: number; dmg: number; r: number }
export interface Mine { x: number; y: number; arm: number; dmg: number; dead?: boolean }
export interface Peel { x: number; y: number; t: number }
export type AllyKind = 'vasya' | 'dog' | 'turret' | 'robovac';
export interface Ally { kind: AllyKind; x: number; y: number; r?: number; t: number; fire: number; ang: number; face: number; talk: number; shotgun?: boolean; moving?: boolean }
export interface Beam { x0: number; y0: number; x1: number; y1: number; t: number; max: number; type: 'laser' | 'rail' | 'link' | 'sniper' }

// ---------- эффекты ----------
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; ring?: boolean; flash?: boolean }
export interface FloatText { x: number; y: number; txt: string; color: string; big: boolean; t: number; max: number }
export interface Banner { title: string; sub: string; t: number; max: number; color: string }
export interface Timer { t: number; fn: () => void }

export interface GameState {
  seed: number;
  state: RunState;
  t: number;
  wave: number;
  /** inter — передышка, wave — волна, exit — босс убит, скоро портал на следующий уровень */
  phase: 'inter' | 'wave' | 'exit';
  /** номер уровня в забеге (0 — первый), какой это уровень и модификатор бесконечного режима */
  level: number; levelId: LevelId; mod: EndlessMod['id'] | null;
  /** портал на следующий уровень и через сколько он откроется */
  exit: { x: number; y: number } | null; exitT: number;
  /** состояние механики уровня (game/mechanics.ts) */
  mech: { t: number; warn: number; active: number; aux: number };
  /** статистика уровня для экрана перехода */
  levelStart: { t: number; kills: number; score: number };
  interT: number;
  queue: EnemyId[];
  spawnT: number;
  score: number; kills: number; xp: number;
  shake: number; flash: number; blackout: number;
  /** сторож волны: сколько секунд нет прогресса (game/guard.ts) */
  stuckT: number;
  /** стоп-кадр: мир замирает на долю секунды от тяжёлых попаданий */
  hitStop: number;
  /** серия убийств: сколько, сколько секунд ещё держится, лучшая за забег */
  combo: { n: number; t: number; best: number };
  pendingPerks: number; perkChoices: PerkDef[]; taken: Record<string, number>;
  /** уровень и опыт каждой пушки в этом забеге — хранится у типа, а не у слота */
  gunLvl: Record<WeaponId, { lvl: number; xp: number }>;
  /** счётчик групп пушек из ящиков */
  offerN: number;
  /** какие пушки эволюционировали (content/evolutions.ts) */
  evolved: Partial<Record<WeaponId, boolean>>;
  mods: Mods;
  ab: AbilityLevels;
  p: Player;
  cam: { x: number; y: number };
  /** размер видимой области в пикселях мира — задаёт рендер, нужен блэкауту и камере */
  view: { w: number; h: number };
  props: Prop[];
  enemies: Enemy[]; bullets: Bullet[]; ebullets: EBullet[]; portals: Portal[]; pickups: Pickup[];
  parts: Particle[]; texts: FloatText[]; beams: Beam[]; bombs: Bomb[]; zones: Zone[]; puddles: Puddle[];
  timers: Timer[]; mines: Mine[]; peels: Peel[]; allies: Ally[];
  banner: Banner | null;
  boss: Enemy | null;
  intro: { name: string; sub: string; t: number; max: number } | null;
  toast: { txt: string; t: number } | null;
}

export function createPlayer(): Player {
  return {
    x: WW / 2, y: WH / 2, r: 5, hy: 9, hr: 6, hp: 100, ang: 0, face: 1, aimX: WW / 2 + 40, aimY: WH / 2,
    dx: 1, dy: 0, moving: false, anim: 0, recoil: 0,
    fireT: 0, inv: 0, hit: 0, dashT: 0, dashCd: 0, dashId: 0, trail: [], level: 1,
    guns: [{ id: 'makarov', ammo: Infinity }, null, null, null, null, null], cur: 0,
    streak: 0, spin: 0, spinHold: 0, mgN: 0, charge: 0, heat: 0, heatTarget: null, vacEaten: 0, shotN: 0,
    cdQ: 0, cdE: 0, cdC: 0, cdV: 0, cdG: 0, ult: 0,
    hist: [], histT: 0, auraT: 0,
    invert: 0, noGun: 0, scramble: 0, slip: 0, sdx: 0, sdy: 0, cling: 0, clingT: 0, sugar: 0,
    guilt: false, wobble: false, mogged: false, timeSlow: false, rooted: false
  };
}

export function createState(seed: number): GameState {
  return {
    seed, state: 'play', t: 0, wave: 0, phase: 'inter', interT: 1.2, queue: [], spawnT: 0,
    level: 0, levelId: 'parking', mod: null, exit: null, exitT: 0, mech: { t: 0, warn: 0, active: 0, aux: 0 }, levelStart: { t: 0, kills: 0, score: 0 },
    score: 0, kills: 0, xp: 0, shake: 0, flash: 0, blackout: 0, stuckT: 0, hitStop: 0, combo: { n: 0, t: 0, best: 0 },
    pendingPerks: 0, perkChoices: [], taken: {},
    gunLvl: Object.fromEntries(WEAPON_IDS.map(id => [id, { lvl: 1, xp: 0 }])) as GameState['gunLvl'], offerN: 0, evolved: {},
    mods: baseMods(), ab: { q: 1, e: 1, r: 1, c: 1, v: 1, g: 1 },
    p: createPlayer(),
    cam: { x: 0, y: 0 }, view: { w: 320, h: 200 },
    props: [],
    enemies: [], bullets: [], ebullets: [], portals: [], pickups: [], parts: [], texts: [], beams: [], bombs: [],
    zones: [], puddles: [], timers: [], mines: [], peels: [], allies: [],
    banner: null, boss: null, intro: null, toast: null
  };
}

export const xpNeed = (l: number): number => 10 + l * 9;
