// Волны: бюджет врагов по номеру, босс каждые 5 волн, передышка с лутом между волнами.
import { P } from '../content/palette';
import { TYPES, enemyDef, type EnemyId } from '../content/enemies';
import { BOSSES } from '../content/bosses';
import { PROMPTS } from '../content/texts.ru';
import { random, rnd } from '../engine/rng';
import { G, hooks, sfx } from './world';
import { say, banner } from './fx';
import { spawnPoint } from './arena';
import { addEnemy, spawnPortal, spawnFromPortal, eliteChance } from './spawn';
import { mkPickup } from './pickups';

export const bossOfWave = (n: number): EnemyId | null => (n % 5 === 0 ? BOSSES[(n / 5 - 1) % BOSSES.length] : null);

/** Состав волны: набираем врагов по весам, пока не кончится бюджет. */
export function composition(n: number): EnemyId[] {
  const list: EnemyId[] = [];
  let budget = 5 + n * 4.2;
  const pool = (Object.keys(TYPES) as EnemyId[]).map(id => [id, enemyDef(id)] as const).filter(([, t]) => t.cost && n >= (t.from ?? 1));
  const total = pool.reduce((s, [, t]) => s + (t.w ?? 0), 0);
  while (budget > 0) {
    let r = random() * total, k: EnemyId = 'hand';
    for (const [name, t] of pool) { r -= t.w ?? 0; if (r <= 0) { k = name; break; } }
    if (k === 'quadro') list.push('quadro', 'quadro'); // стая
    list.push(k); budget -= enemyDef(k).cost ?? 1;
  }
  for (let i = list.length - 1; i > 0; i--) { const j = (random() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
  const boss = bossOfWave(n);
  if (boss) list.splice(Math.min(3, list.length), 0, boss);
  return list;
}

export function startWave(n: number): void {
  G.wave = n; G.phase = 'wave'; G.queue = composition(n); G.spawnT = .5;
  if (n % 5 === 1) hooks.regularMusic(Math.floor((n - 1) / 5));
  sfx('wave');
  const bt = bossOfWave(n);
  if (bt) banner(bt === 'skuf' ? `ВОЛНА ${n} · ФИНАЛЬНЫЙ БОСС` : `ВОЛНА ${n} · БОСС`, enemyDef(bt).boss ?? '', 3.5, bt === 'skuf' ? P.vest : P.pink);
  else banner(`ВОЛНА ${n}`, `промпт: ${PROMPTS[(n - 1) % PROMPTS.length]}`, 2.8);
}

function waveCleared(): void {
  const p = G.p, m = G.mods;
  G.phase = 'inter'; G.interT = 3.5;
  G.score += 10 * G.wave;
  p.hp = Math.min(m.maxHp, p.hp + m.maxHp * .1); say(p.x, p.y - 30, 'передышка +10%', P.green);
  banner('ВОЛНА ЗАЧИЩЕНА', `+${10 * G.wave} лайков · дядя Вася сбросил лут`, 2.4, P.green);
  const lx = p.x + rnd(50), ly = p.y + rnd(50);
  // ящик пушки — только после 2-й волны (вторая пушка); новые дальше приносят боссы. Диск апскейла — через волну
  G.pickups.push(mkPickup(lx, ly, G.wave === 2 ? 'gun' : G.wave % 2 ? 'ammo' : 'up'), mkPickup(lx + 14, ly + 6, 'ammo'));
  // перед боссом аптечка всегда, иначе — если реальности меньше 60%
  if (p.hp < m.maxHp * .6 || bossOfWave(G.wave + 1)) G.pickups.push(mkPickup(lx - 14, ly, 'hp'));
  if (G.wave % 3 === 0) G.pickups.push(mkPickup(lx, ly + 16, 'blindbox'));
}

export function updateWaves(dt: number): void {
  if (G.phase === 'inter') {
    G.interT -= dt;
    if (G.interT <= 0) startWave(G.wave + 1);
  } else {
    G.spawnT -= dt;
    const cap = 45 + G.wave * 2;
    if (G.queue.length && G.spawnT <= 0 && G.enemies.length + G.portals.length < cap) {
      const type = G.queue.shift()!, boss = !!enemyDef(type).boss;
      const sp = spawnPoint(boss ? 190 : 140);
      // амогус приходит без портала — он же маскируется
      if (type === 'amogus') addEnemy('amogus', sp.x, sp.y, random() < eliteChance());
      else spawnPortal(type, sp.x, sp.y, boss ? 2 : .9, boss ? false : undefined);
      G.spawnT = Math.max(.18, 1 - G.wave * .05) * (random() * .6 + .7);
    }
    if (!G.queue.length && !G.enemies.length && !G.portals.length) waveCleared();
  }
  for (const po of G.portals) {
    po.t -= dt;
    if (po.t <= 0) spawnFromPortal(po);
  }
  G.portals = G.portals.filter(po => po.t > 0);
}
