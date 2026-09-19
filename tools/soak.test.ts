// Прогон на выносливость: много длинных забегов ботом, ловим исключения, NaN и волны, которые не заканчиваются.
// Запуск: npm run soak  (SEEDS=60 MINUTES=20)
import { it } from 'vitest';
import { G } from '../src/game/world';
import { newGame, step } from '../src/game/sim';
import { choosePerk } from '../src/game/perks';
import { startNextLevel } from '../src/game/levels';
import { botInput } from '../src/game/bot';
import { startingOffer } from '../src/game/inventory';
import { STEP } from '../src/engine/loop';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.SEEDS ?? 30), MINUTES = Number(process.env.MINUTES ?? 15);

const bad = (v: number): boolean => !Number.isFinite(v);

it('выносливость', { timeout: 3_600_000 }, () => {
  const problems: string[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) for (const lazy of [false, true]) {
    newGame(seed); G.view.w = 427; G.view.h = 254; startingOffer();
    let lastProgress = 0, lastKills = 0, lastWave = 0, lastBossHp = -1;
    const tag = `seed ${seed}${lazy ? ' lazy' : ''}`;
    try {
      for (let i = 0; i < MINUTES * 60 / STEP && G.state !== 'dead'; i++) {
        if (G.state === 'perk') choosePerk(0);
      if (G.state === 'transit') startNextLevel();
        if (G.state === 'victory') G.state = 'play';
        if (lazy) { G.mods.maxHp = Math.max(G.mods.maxHp, 1e6); G.p.hp = 1e6; }
        step(STEP, botInput(lazy ? {} : { abilities: true, dash: true }));
        const p = G.p;
        if (bad(p.x) || bad(p.y) || bad(p.hp)) { problems.push(`${tag} t=${G.t.toFixed(1)}: игрок NaN`); break; }
        const nanE = G.enemies.find(e => bad(e.x) || bad(e.y) || bad(e.hp));
        if (nanE) { problems.push(`${tag} t=${G.t.toFixed(1)} w${G.wave}: враг ${nanE.type} NaN`); break; }
        // прогресс — убийство, новая волна или урон по боссу (босс может жить долго, но должен терять здоровье)
        const bossHp = G.boss ? Math.round(G.boss.hp) : -1;
        if (G.kills !== lastKills || G.wave !== lastWave || bossHp !== lastBossHp) { lastKills = G.kills; lastWave = G.wave; lastBossHp = bossHp; lastProgress = G.t; }
        if (G.t - lastProgress > 120) {
          problems.push(`${tag} t=${G.t.toFixed(0)} w${G.wave} phase=${G.phase} queue=${G.queue.length} portals=${G.portals.length}: 120 с без прогресса, живы ${G.enemies.map(e => `${e.type}@${Math.round(e.x)},${Math.round(e.y)}${e.alt ? '^' + e.alt : ''}${e.disguised ? 'D' : ''}${e.charm > 0 ? 'C' : ''} hp${Math.round(e.hp)}`).slice(0, 5).join(' ')}`);
          break;
        }
        if (G.enemies.length > 250 || G.ebullets.length > 1500 || G.bullets.length > 1500) { problems.push(`${tag} w${G.wave}: взрыв сущностей e=${G.enemies.length} eb=${G.ebullets.length} b=${G.bullets.length}`); break; }
      }
    } catch (err) {
      problems.push(`${tag} t=${G.t.toFixed(1)} w${G.wave}: ИСКЛЮЧЕНИЕ ${(err as Error).message} ${((err as Error).stack ?? '').split('\n').slice(1, 3).join(' ')}`);
    }
  }
  console.log(problems.length ? problems.join('\n') : 'проблем не найдено');
});
