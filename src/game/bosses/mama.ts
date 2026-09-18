// Мама-нейросеть: печатает промпты, из которых вылезают враги. Если попасть в промпт — он переписывается в лут.
import { P } from '../../content/palette';
import { MAMA_PROMPTS, MAMA_EDITS } from '../../content/bosses';
import { clamp } from '../../engine/math';
import { random, rnd, pick } from '../../engine/rng';
import { G, sfx } from '../world';
import { say, banner } from '../fx';
import { bodyY } from '../body';
import { spawnPoint } from '../arena';
import { makeEnemy, spawnPortal } from '../spawn';
import { mkPickup } from '../pickups';
import { delve } from '../enemies/shots';
import type { Behavior } from '../enemies/types';
import { WW, type Enemy } from '../state';

export const mama: Behavior = (e, s) => {
  const p = G.p, ph = e.phase;
  if (s.d < 120) { s.vx = -s.vx * .5; s.vy = -s.vy * .5; }
  if (e.decoy) {
    // галлюцинация из 3 фазы: только стреляет
    s.vx += Math.sin(e.t * 2 + e.x) * 20;
    e.vol = (e.vol || 2) - s.dt;
    if (e.vol <= 0) { e.vol = 2.4; delve(e.x, bodyY(e), .2, 60, 7); }
    return;
  }
  if (!e.prompt && e.cd <= 0) { e.prompt = { ...pick(MAMA_PROMPTS), t: 0, dur: [2.6, 2.2, 1.8][ph] }; e.cd = [4.5, 3.6, 2.8][ph]; }
  if (e.prompt) {
    e.prompt.t += s.dt; if (random() < .5) sfx('type', .05);
    if (e.prompt.t >= e.prompt.dur) {
      const P0 = e.prompt;
      if (P0.loot) for (let i = 0; i < P0.n; i++) G.pickups.push(mkPickup(e.x + rnd(40), e.y + 24 + rnd(16), P0.loot));
      else if (P0.type) for (let i = 0; i < P0.n + (P0.edited ? 0 : ph); i++) {
        const sp = spawnPoint(40, { x: e.x, y: e.y, r: 60 });
        spawnPortal(P0.type, sp.x, sp.y, .7, !P0.edited && ph >= 2 && i === 0);
        if (P0.charm) G.portals[G.portals.length - 1].charm = true;
      }
      e.prompt = null;
    }
  }
  e.vol = (e.vol || 2) - s.dt;
  if (e.vol <= 0) { e.vol = [2.2, 1.6, 1.3][ph]; delve(e.x, bodyY(e), .18, 70, 10, ph >= 2); }
  if (ph >= 1) {
    e.spec = (e.spec || 6) - s.dt;
    if (e.spec <= 0) {
      e.spec = ph >= 2 ? 6.5 : 9;
      if ((e.specN = (e.specN ?? 0) + 1) % 2) { p.invert = 3; banner('TEMPERATURE = 2.0', 'управление перепуталось', 1.6, P.pink); }
      else { p.noGun = 3.5; banner('NEGATIVE PROMPT: NO GUNS', 'только Макаров', 1.6, P.pink); }
      sfx('blink');
    }
  }
};

/** Попадание пули в текст промпта: 4 попадания — промпт переписан. Возвращает true, если пуля поглощена. */
export function hitPrompt(x: number, y: number): boolean {
  const mm = G.boss;
  if (!mm || mm.type !== 'mama' || !mm.prompt || mm.prompt.edited || Math.hypot(x - mm.x, y - (mm.y - 50)) >= 18) return false;
  mm.prompt.hits = (mm.prompt.hits ?? 0) + 1;
  if (mm.prompt.hits >= 4) {
    mm.prompt = { ...pick(MAMA_EDITS), edited: true, t: mm.prompt.dur * .2, dur: mm.prompt.dur };
    say(mm.x, mm.y - 70, 'ПРОМПТ ОТРЕДАКТИРОВАН', P.cyan, true); sfx('inject');
  }
  return true;
}

export function mamaPhase(e: Enemy, n: number): void {
  if (n !== 2) return;
  for (let i = 0; i < 2; i++) {
    const keep = G.boss, dc = makeEnemy('mama', clamp(e.x + (i ? 80 : -80), 30, WW - 30), e.y);
    G.boss = keep; dc.decoy = true; dc.hp = dc.max = 40; dc.phase = 2; dc.vol = 1 + i;
    G.enemies.push(dc);
  }
  say(e.x, e.y - 60, 'ГАЛЛЮЦИНАЦИИ', P.purple, true);
}
