// Стенд оружия: бот с одной пушкой (бесконечные патроны, бессмертие) проходит одинаковые сценарии.
// Запуск: npm run weapons  (LVL=1,5 — какие уровни мерить)
import { it } from 'vitest';
import { WEAPONS, WEAPON_IDS, type WeaponId } from '../src/content/weapons';
import type { EnemyId } from '../src/content/enemies';
import { G } from '../src/game/world';
import { newGame, step } from '../src/game/sim';
import { startWave } from '../src/game/waves';
import { addEnemy } from '../src/game/spawn';
import { spawnPoint } from '../src/game/arena';
import { botInput } from '../src/game/bot';
import { STEP } from '../src/engine/loop';

declare const process: { env: Record<string, string | undefined> };
const LVLS = (process.env.LVL ?? '1,5').split(',').map(Number);
const LIMIT = 120;

/** Сценарий: волна по номеру или фиксированный набор врагов (номер волны задаёт их здоровье). */
type Scen = { name: string; wave: number; pack?: [EnemyId, number][] };
const SCEN: Scen[] = [
  { name: 'рой', wave: 8, pack: [['hand', 30], ['kitten', 10], ['labubu', 6]] },
  { name: 'танки', wave: 10, pack: [['golem', 4], ['horse', 2], ['capy', 2]] },
  { name: 'летун', wave: 8, pack: [['croc', 4], ['troll', 5]] },
  { name: 'стрелки', wave: 8, pack: [['doge', 4], ['spag', 4], ['sixseven', 4]] },
  { name: 'в8', wave: 8 },
  { name: 'в14', wave: 14 }
];

function trial(id: WeaponId, lvl: number, sc: Scen, seed: number): { t: number; ok: boolean } {
  newGame(seed); G.view.w = 427; G.view.h = 254;
  const HP = 1e6; G.mods.maxHp = HP;
  G.gunLvl[id].lvl = lvl;
  // уровень героя как в обычном забеге к этой волне (по симулятору баланса ≈ 1,5 × волна)
  G.p.level = Math.round(1.5 * sc.wave);
  // одна пушка в своём слоте + Макаров (он всегда есть)
  G.p.guns = [{ id: 'makarov', ammo: Infinity }, null, null, null];
  const c = WEAPONS[id].cls - 1;
  if (id !== 'makarov') G.p.guns[c] = { id, ammo: 1e9 };
  G.p.cur = c;
  G.wave = sc.wave;
  if (sc.pack) { G.phase = 'wave'; G.queue = []; for (const [t, n] of sc.pack) for (let i = 0; i < n; i++) { const sp = spawnPoint(120); addEnemy(t, sp.x, sp.y).disguised = false; } }
  else { G.wave = sc.wave - 1; startWave(sc.wave); }
  let t = 0;
  for (; t < LIMIT; t += STEP) {
    G.p.hp = HP; G.pendingPerks = 0; G.pickups = [];
    const inp = botInput({});
    inp.actions = inp.actions.filter(a => typeof a !== 'object');
    step(STEP, inp);
    G.gunLvl[id].lvl = lvl; G.gunLvl[id].xp = 0;
    if (G.state === 'perk') G.state = 'play';
    if (G.state !== 'play') break;
    const done = sc.pack ? !G.enemies.length && !G.portals.length : G.phase === 'inter';
    if (done) return { t, ok: true };
  }
  return { t, ok: false };
}

it('стенд оружия', { timeout: 900_000 }, () => {
  const rows: Record<string, string | number>[] = [];
  for (const id of WEAPON_IDS) for (const lvl of LVLS) {
    const row: Record<string, string | number> = { gun: id, lvl };
    let sum = 0;
    for (const sc of SCEN) {
      let t = 0, ok = 0;
      for (const seed of [1, 2]) { const r = trial(id, lvl, sc, seed); t += r.t; ok += +r.ok; }
      row[sc.name] = `${Math.round(t / 2)}${ok < 2 ? '!' : ''}`;
      sum += t / 2;
    }
    row.sum = Math.round(sum);
    rows.push(row);
  }
  console.table(rows);
});
