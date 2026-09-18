// Скибиди-босс: неуязвим, пока стоят унитазы; периодический смыв затягивает игрока.
import { P } from '../../content/palette';
import { TAU } from '../../engine/math';
import { random, rnd, pick } from '../../engine/rng';
import { G, sfx } from '../world';
import { say } from '../fx';
import { spawnPoint } from '../arena';
import { hurt } from '../combat';
import { spawnPortal, spawnToilets } from '../spawn';
import { eshot, radial } from '../enemies/shots';
import type { Behavior } from '../enemies/types';

export const skboss: Behavior = (e, s) => {
  const p = G.p, ph = e.phase, dt = s.dt;
  if (ph >= 2) {
    e.sw = (e.sw ?? 0) - dt;
    if (e.sw <= 0) { e.sw = .4; G.puddles.push({ x: e.x + rnd(6), y: e.y + rnd(4), r: 10, t: 5, col: 'sewage' }); }
    e.spT = (e.spT ?? 0) - dt;
    if (e.spT <= 0) { e.spT = .1; e.sa = (e.sa ?? 0) + .45; eshot('drop', e.x, e.y - 20, e.sa, 80, 7, 3); }
  }
  if (e.flush && e.flush > 0) {
    e.flush -= dt; s.vx = s.vy = 0;
    const pull = [58, 75, 95][ph];
    p.x -= s.dx / s.d * pull * dt; p.y -= s.dy / s.d * pull * dt;
    for (let i = 0; i < 2; i++) {
      const a = G.t * 6 + i * Math.PI + random(), r = 20 + random() * 90;
      G.parts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r * .6, vx: -Math.sin(a) * 60 - Math.cos(a) * 40, vy: Math.cos(a) * 40 - Math.sin(a) * 30, life: .4, max: .4, color: pick([P.cyan, P.white, P.cyanD]), size: 1 });
    }
    e.ring = (e.ring ?? 0) - dt;
    if (e.ring <= 0) { e.ring = [.45, .35, .25][ph]; radial('drop', e.x, e.y - 20, 10 + ph * 2, random() * TAU, 70, 9, 3); }
    if (s.d < 24) hurt(e.dmg, 'СМЫТ');
  } else {
    e.spec = (e.spec ?? 5) - dt;
    if (e.spec <= 0) { e.spec = [7, 5, 3.8][ph]; e.flush = 2.2 + ph * .4; say(e.x, e.y - 60, ph >= 2 ? 'ЗАСОР! СМЫВ!' : 'СМЫВ!', P.cyan, true); sfx('flush'); }
    const toilets = G.props.filter(q => q.kind === 'toiletprop');
    for (const q of toilets) { q.sp = (q.sp ?? 0) - dt; if (q.sp <= 0) { q.sp = 6 - ph; spawnPortal('skibidi', q.x + 6 + rnd(10), q.y + 14, .6, ph >= 2 && random() < .3); } }
    if (e.cd <= 0 && !toilets.length) { e.cd = 4; for (let i = 0; i < 3 + ph * 2; i++) { const sp = spawnPoint(40, { x: e.x, y: e.y, r: 70 }); spawnPortal('skibidi', sp.x, sp.y, .6, ph >= 1 && i === 0); } }
    s.vx += -s.dy / s.d * Math.sin(e.t * 3) * 30; s.vy += s.dx / s.d * Math.sin(e.t * 3) * 30;
  }
  if (random() < dt * .5) sfx('skibidi', .5);
};

export function skbossPhase(): void { spawnToilets(3); }
