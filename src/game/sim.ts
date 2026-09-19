// Один тик игры. Детерминирован: одинаковые seed и ввод дают одинаковый забег.
import { P } from '../content/palette';
import { PROPDEF } from '../content/props';
import { reseed, random, rnd } from '../engine/rng';
import { G, setGame } from './world';
import { createState, type GameState } from './state';
import { layoutProps, pushOut } from './arena';
import { tickTimers, tickFx } from './fx';
import { updatePlayer } from './player';
import { updateWaves } from './waves';
import { updateEnemies } from './enemies/ai';
import { updateHazards } from './hazards';
import { updateAllies } from './allies';
import { updateBullets } from './bullets';
import { updatePickups } from './pickups';
import { openPerks } from './perks';
import { dash, abilityQ, abilityE, abilityR, abilityC, abilityV, abilityG, congratulate } from './abilities';
import { altFire } from './weapons';
import { cycleGun, selectGun, takeNear, rerollNear } from './inventory';
import type { Action, TickInput } from './input';

export function newGame(seed: number): GameState {
  reseed(seed);
  const g = createState(seed);
  setGame(g);
  g.props = layoutProps();
  return g;
}

function act(a: Action): void {
  if (typeof a === 'object') { if (G.p.guns[a.slot]) selectGun(a.slot); return; }
  switch (a) {
    case 'dash': dash(); break;
    case 'q': abilityQ(); break;
    case 'e': abilityE(); break;
    case 'r': abilityR(); break;
    case 'c': abilityC(); break;
    case 'v': abilityV(); break;
    case 'g': abilityG(); break;
    case 'f': congratulate(); break;
    case 'alt': altFire(); break;
    case 'next': cycleGun(1); break;
    case 'prev': cycleGun(-1); break;
    case 'take': takeNear(); break;
    case 'reroll': rerollNear(); break;
  }
}

function update(dt: number, input: TickInput): void {
  G.t += dt;
  // заставка босса: мир замер
  if (G.intro) { G.intro.t -= dt; tickFx(dt); if (G.intro.t <= 0) G.intro = null; return; }
  tickTimers(dt);
  for (const a of input.actions) if (G.state === 'play') act(a);
  updatePlayer(dt, input);
  updateWaves(dt);
  updateEnemies(dt);
  updateHazards(dt);
  updateAllies(dt);
  updateBullets(dt);
  updatePickups(dt);
  for (const pr of G.props) {
    pr.flash -= dt;
    // повреждённые укрытия дымят, почти разбитые — искрят
    if (pr.hp < pr.max * .5 && random() < dt * 5) G.parts.push({ x: pr.x + random() * pr.w, y: pr.y + PROPDEF[pr.kind].oy + 4, vx: rnd(6), vy: -12, life: .7, max: .7, color: pr.hp < pr.max * .25 ? P.vest : '#6f6780', size: 1 });
  }
  for (const bm of G.beams) bm.t -= dt;
  G.beams = G.beams.filter(bm => bm.t > 0);
  G.blackout = Math.max(0, G.blackout - dt);
  tickFx(dt);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.pendingPerks > 0 && G.state === 'play') openPerks();
}

/** Главное меню: враги бродят на фоне. */
function attract(dt: number): void {
  G.t += dt;
  for (const e of G.enemies) {
    e.t += dt;
    const a = e.t * .4 + e.variant;
    e.x += Math.cos(a) * (e.spd || 30) * .3 * dt; e.y += Math.sin(a * 1.3) * (e.spd || 30) * .3 * dt;
    e.face = Math.cos(a) < 0 ? -1 : 1;
    if (!e.alt) pushOut(e);
  }
}

export function step(dt: number, input: TickInput): void {
  switch (G.state) {
    case 'play': update(dt, input); break;
    case 'dead': G.t += dt; tickFx(dt); break;
    case 'attract': attract(dt); break;
  }
}
