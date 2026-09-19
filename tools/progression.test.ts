// Как пушки раскрываются по ходу забега: сколько новых пушек игрок получил и какого уровня его пушки к волнам 3, 5, 8, 10, 15.
// Запуск: npm run progression
import { it } from 'vitest';
import { G } from '../src/game/world';
import { newGame, step } from '../src/game/sim';
import { choosePerk } from '../src/game/perks';
import { botInput } from '../src/game/bot';
import { startingOffer, ownedSlots } from '../src/game/inventory';
import { STEP } from '../src/engine/loop';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SEEDS ?? 8);
const MARKS = [3, 5, 8, 10, 15];

it('прогрессия пушек', { timeout: 600_000 }, () => {
  const rows = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    newGame(seed); G.view.w = 427; G.view.h = 254; startingOffer();
    const seen = new Set<string>(), row: Record<string, string | number> = { seed };
    let got = 0;
    for (let i = 0; i < 14 * 60 / STEP && G.state !== 'dead'; i++) {
      if (G.state === 'perk') choosePerk(0);
      G.mods.maxHp = Math.max(G.mods.maxHp, 1e6); G.p.hp = 1e6; // бессмертие: меряем прогрессию, а не выживание
      step(STEP, botInput({ abilities: true, dash: true }));
      for (const s of ownedSlots()) if (s.id !== 'makarov' && !seen.has(s.id)) { seen.add(s.id); got++; }
      if (MARKS.includes(G.wave) && row[`w${G.wave}`] === undefined && G.phase === 'wave') {
        const lv = ownedSlots().filter(s => s.id !== 'makarov').map(s => G.gunLvl[s.id].lvl).sort((a, b) => b - a);
        row[`w${G.wave}`] = `${got} пуш · ур ${lv.join('')}`;
      }
    }
    rows.push(row);
  }
  console.table(rows);
});
