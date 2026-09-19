// Уровни: 4 волны + босс. Убил босса — остатки волны удаляются, через передышку открывается портал на следующий уровень.
import { P } from '../content/palette';
import { LEVELS, ENDLESS_MODS, WAVES_PER_LEVEL, type LevelDef, type LevelId } from '../content/levels';
import { pick } from '../engine/rng';
import { G, hooks, sfx } from './world';
import { say, banner, burst } from './fx';
import { layoutProps } from './arena';
import { isBoss } from './body';
import { WW, WH } from './state';

export const levelDef = (id: LevelId = G.levelId): LevelDef => LEVELS.find(l => l.id === id)!;
/** Уровень, к которому относится волна n (первые 7 — по порядку, дальше — текущий бесконечный). */
export const levelOfWave = (n: number): LevelDef => { const i = Math.floor((n - 1) / WAVES_PER_LEVEL); return i < LEVELS.length ? LEVELS[i] : levelDef(); };
/** Передышка между убийством босса и открытием портала — собрать лут. */
export const EXIT_DELAY = 8;

/** Босс уровня убит: остатки волны удаляются модерацией, скоро откроется портал. */
export function bossDefeated(): void {
  for (const e of G.enemies) {
    if (e.dead || isBoss(e)) continue;
    e.dead = true; hooks.enemyDied(e);
    if (e.type !== 'oseg' && e.type !== 'apostle') say(e.x, e.y - 16, 'удалено модерацией', P.muted);
  }
  G.enemies = G.enemies.filter(e => !e.dead);
  G.queue = []; G.portals = []; G.ebullets = []; G.bombs = [];
  G.phase = 'exit'; G.exitT = EXIT_DELAY;
  banner('УРОВЕНЬ ПРОЙДЕН', 'собери лут — скоро откроется портал', 3, P.gold);
}

/** Тик уровня: отсчёт до портала, вход в портал. */
export function updateLevel(dt: number): void {
  if (G.phase !== 'exit') return;
  if (!G.exit) {
    G.exitT -= dt;
    if (G.exitT <= 0) {
      // портал — в центре, но не под героем: иначе засосёт раньше, чем он соберёт лут
      const p = G.p, far = Math.hypot(p.x - WW / 2, p.y - WH / 2) > 70;
      G.exit = far ? { x: WW / 2, y: WH / 2 } : { x: WW / 2 + (p.x < WW / 2 ? 120 : -120), y: WH / 2 };
      const next = nextLevelDef();
      burst(G.exit.x, G.exit.y - 10, [P.pink, P.cyan, P.gold, P.white], 40, 90, 2);
      banner('ПОРТАЛ ОТКРЫТ', `следующий уровень: ${next.name}`, 3, P.cyan);
      sfx('portal');
    }
    return;
  }
  const p = G.p;
  if (Math.hypot(p.x - G.exit.x, p.y - G.exit.y) < 14) enterExit();
}

/** Какой уровень будет следующим: по порядку, после квартиры скуфа — случайный (бесконечный режим). */
/** Название следующего уровня — для подписи над порталом. */
export const nextLevelName = (): string => nextLevelDef().name;
export function nextLevelDef(): LevelDef {
  return G.level + 1 < LEVELS.length ? LEVELS[G.level + 1] : pendingEndless ?? (pendingEndless = pick(LEVELS));
}
let pendingEndless: LevelDef | null = null;

function enterExit(): void {
  G.state = 'transit'; G.exit = null;
  sfx('portal');
  hooks.transit();
}

/** После экрана загрузки: новый уровень. Пушки, уровни, перки и эволюции остаются. */
export function startNextLevel(): void {
  const next = nextLevelDef();
  pendingEndless = null;
  G.level++;
  G.levelId = next.id;
  G.mod = G.level >= LEVELS.length ? pick(ENDLESS_MODS).id : null;
  enterLevel();
}

/** Подготовить арену текущего уровня (и в начале забега). */
export function enterLevel(): void {
  const p = G.p, lv = levelDef();
  G.props = layoutProps(lv.id);
  G.enemies = []; G.bullets = []; G.ebullets = []; G.portals = []; G.pickups = []; G.zones = []; G.puddles = [];
  G.mines = []; G.peels = []; G.bombs = []; G.timers = []; G.beams = [];
  // союзники-однодневки уходят, робот-пылесос остаётся
  G.allies = G.allies.filter(a => a.kind === 'robovac');
  for (const a of G.allies) { a.x = p.x + 12; a.y = p.y + 8; }
  p.x = WW / 2; p.y = WH / 2; p.hist = []; p.cling = 0;
  p.hp = Math.min(G.mods.maxHp, p.hp + G.mods.maxHp * .3);
  G.boss = null; G.exit = null; G.phase = 'inter'; G.interT = 2.5; G.state = 'play';
  G.mech = { t: 0, warn: 0, active: 0, aux: 0 };
  G.levelStart = { t: G.t, kills: G.kills, score: G.score };
  hooks.levelStart(lv.id);
  const mod = ENDLESS_MODS.find(m => m.id === G.mod);
  banner(lv.name, mod ? `${mod.name} · ${mod.sub}` : lv.sub, 4, mod ? P.pink : P.gold);
}
