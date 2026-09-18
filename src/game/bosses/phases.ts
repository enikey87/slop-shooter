// Смена фазы босса: общая часть (рёв, отброс, неуязвимость) + особенности каждого.
import { P } from '../../content/palette';
import { enemyDef, SPLAT, type EnemyId } from '../../content/enemies';
import { PHASE_NAMES } from '../../content/bosses';
import { G, sfx } from '../world';
import { banner, burst, ring } from '../fx';
import { bodyY, bossFrac } from '../body';
import { pushOut } from '../arena';
import { hurt } from '../combat';
import type { Enemy } from '../state';
import { jbossPhase } from './jboss';
import { mamaPhase } from './mama';
import { cbossPhase } from './cboss';
import { skbossPhase } from './skboss';
import { ouroPhase } from './ouro';

const ON_PHASE: Partial<Record<EnemyId, (e: Enemy, n: number) => void>> = {
  jboss: jbossPhase, mama: mamaPhase, cboss: cbossPhase, skboss: skbossPhase, ouro: ouroPhase
};
export const DEFAULT_PHASES = [.66, .33] as const;

/** Номер фазы по текущему здоровью; вызывать каждый тик. */
export function checkPhase(e: Enemy): void {
  const th = enemyDef(e.type).phases ?? DEFAULT_PHASES, fr = bossFrac(e);
  let ph = 0; for (const t of th) if (fr <= t) ph++;
  if (ph > e.phase) startPhase(e, e.phase + 1);
}

export function startPhase(e: Enemy, n: number): void {
  e.phase = n; e.trans = 1.4; e.spd *= 1.2;
  const p = G.p, d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
  if (d < 70) { p.x += (p.x - e.x) / d * 30; p.y += (p.y - e.y) / d * 30; pushOut(p); hurt(6, 'РЁВ'); }
  G.ebullets = G.ebullets.filter(b => Math.hypot(b.x - e.x, b.y - e.y) > 80);
  G.shake = 10;
  ring(e.x, bodyY(e), n === 2 ? P.red : P.vest, 90, .5);
  burst(e.x, bodyY(e), SPLAT[e.type] || [P.pink], 40, 90, 2);
  banner(enemyDef(e.type).boss ?? '', `ФАЗА ${n + 1}: ${PHASE_NAMES[e.type]?.[n] ?? ''}`, 2.2, n === 2 ? P.red : P.vest);
  sfx('roar');
  ON_PHASE[e.type]?.(e, n);
}
