// Симулятор баланса: бот играет несколько забегов, печатаем, до какой волны доживает и что его убивает.
// Запуск: npm run balance  (SEEDS=20 MINUTES=15 npm run balance — больше и дольше)
import { it } from 'vitest';
import { G } from '../src/game/world';
import { newGame, step } from '../src/game/sim';
import { choosePerk } from '../src/game/perks';
import { botInput } from '../src/game/bot';
import { startingOffer } from '../src/game/inventory';
import { STEP } from '../src/engine/loop';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SEEDS ?? 8), MINUTES = Number(process.env.MINUTES ?? 10);
/** LAZY=1 — бот без способностей и кувырка: ближе к новичку. */
const LAZY = process.env.LAZY === '1';

it(`баланс: ${SEEDS} забегов по ${MINUTES} мин`, { timeout: 600_000 }, () => {
  const rows = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const hits = new Map<string, number>();
    newGame(seed); G.view.w = 427; G.view.h = 254; startingOffer();
    let lastHp = G.p.hp, bossTime = 0;
    const ticks = MINUTES * 60 / STEP;
    for (let i = 0; i < ticks && G.state !== 'dead' && G.state !== 'victory'; i++) {
      if (G.state === 'perk') choosePerk(0);
      step(STEP, botInput(LAZY ? {} : { abilities: true, dash: true }));
      if (G.boss) bossTime += STEP;
      if (G.p.hp < lastHp - .5) {
        // кто ранил: ближайший враг или последний текст урона
        const src = G.texts.at(-1)?.txt ?? '?';
        hits.set(src, (hits.get(src) ?? 0) + (lastHp - G.p.hp));
      }
      lastHp = G.p.hp;
    }
    const top = [...hits].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${Math.round(v)}`).join(', ');
    rows.push({ seed, result: G.state, wave: G.wave, level: G.p.level, kills: G.kills, min: +(G.t / 60).toFixed(1), bossMin: +(bossTime / 60).toFixed(1), guns: G.p.guns.filter(Boolean).map(s => `${s!.id}:${G.gunLvl[s!.id].lvl}`).join(' '), topDamage: top });
  }
  console.table(rows);
  const waves = rows.map(r => r.wave).sort((a, b) => a - b);
  console.log(`медиана волны: ${waves[waves.length >> 1]}, мин ${waves[0]}, макс ${waves.at(-1)}`);
});
