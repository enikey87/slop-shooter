import { newGame, step } from '../src/game/sim';
import { G } from '../src/game/world';
import { STEP } from '../src/engine/loop';
import { botInput, type BotOpts } from '../src/game/bot';
import { choosePerk } from '../src/game/perks';
import { idleInput } from '../src/game/input';

export function start(seed = 1): void {
  newGame(seed);
  G.view.w = 427; G.view.h = 254;
}
/** Прогнать n секунд игры ботом; перки выбираются первым вариантом. */
export function run(seconds: number, bot: BotOpts | null = { abilities: true, dash: true }): void {
  for (let i = 0; i < seconds / STEP; i++) {
    if (G.state === 'perk') choosePerk(0);
    if (G.state === 'dead' || G.state === 'victory') return;
    step(STEP, bot ? botInput(bot) : idleInput());
  }
}
/** Отпечаток состояния — для проверки детерминизма. */
export function fingerprint(): string {
  const r = (v: number): number => Math.round(v * 1000) / 1000;
  return JSON.stringify({
    t: r(G.t), wave: G.wave, score: G.score, kills: G.kills, hp: r(G.p.hp), px: r(G.p.x), py: r(G.p.y),
    enemies: G.enemies.map(e => [e.type, r(e.x), r(e.y), r(e.hp)]), props: G.props.length, pickups: G.pickups.length
  });
}
