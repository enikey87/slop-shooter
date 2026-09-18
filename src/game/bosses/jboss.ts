// Иисус из креветок: апостолы-щит, ходьба по воде, спираль «аминь» в последней фазе.
import { P } from '../../content/palette';
import { random, rnd } from '../../engine/rng';
import { G, sfx } from '../world';
import { say } from '../fx';
import { bodyY } from '../body';
import { spawnApostles } from '../spawn';
import { jesus } from '../enemies/behaviors';
import { eshot } from '../enemies/shots';
import type { Behavior } from '../enemies/types';
import type { Enemy } from '../state';

export const jboss: Behavior = (e, s, auras) => {
  const ph = e.phase;
  if (ph >= 1) {
    e.dashCd = (e.dashCd ?? 4) - s.dt;
    if (e.dashCd <= 0 && !(e.dashT && e.dashT > 0)) { e.dashT = .8; e.dx0 = s.dx / s.d; e.dy0 = s.dy / s.d; e.dashCd = ph >= 2 ? 4.5 : 6.5; say(e.x, e.y - 70, 'ХОЖУ ПО ВОДЕ', P.cyan, true); sfx('charge'); }
  }
  if (e.dashT && e.dashT > 0) {
    e.dashT -= s.dt; s.vx = (e.dx0 ?? 0) * 150; s.vy = (e.dy0 ?? 0) * 150;
    if (random() < .5) G.puddles.push({ x: e.x + rnd(6), y: e.y + rnd(4), r: 9, t: 3.5, col: 'holy' });
  }
  if (ph >= 2) {
    e.spT = (e.spT ?? 0) - s.dt;
    if (e.spT <= 0) { e.spT = .14; e.sa = (e.sa ?? 0) + .33; for (const k of [0, Math.PI]) eshot('amen', e.x, bodyY(e), e.sa + k, 70, 9, 3.5); }
  }
  jesus(e, s, auras);
};

export function jbossPhase(e: Enemy, n: number): void {
  if (n === 2) spawnApostles(e);
}
