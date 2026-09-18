// Какой лист и кадр рисовать для врага.
import { FPS, type EnemyId } from '../content/enemies';
import type { Sheet } from '../engine/gfx/sheet';
import type { Enemy } from '../game/state';
import { SPR } from './sprites';

/** Боссы и двойники используют листы обычных врагов (увеличенные). */
const ALIAS: Partial<Record<EnemyId, string>> = { jboss: 'jesus', cboss: 'croc', skboss: 'skibidi', fboss: 'floppa', evasya: 'vasya' };

export function sprOf(e: Enemy): Sheet {
  const t = e.type === 'oseg' ? e.skin ?? 'hand' : e.type;
  if (t === 'hand') return SPR.hand[e.variant];
  if (t === 'quadro') return SPR.quadro[e.variant % 3];
  return (SPR as unknown as Record<string, Sheet>)[ALIAS[t] ?? t];
}

const cycle = (t: number, fps: number, n: number): number => ((t * fps) | 0) % n;
const PINGPONG = [0, 1, 2, 1];

export function enemyFrame(e: Enemy): number {
  switch (e.type) {
    case 'spag': if (e.atk > 0) return 4; break;
    case 'shark': if (e.state === 'wind') return 4; break;
    case 'floppa': case 'fboss': return e.state === 'crouch' ? 2 : e.state === 'leap' ? 3 : cycle(e.t, 3, 2);
    case 'patapim': return e.state === 'stomp' ? 3 : PINGPONG[cycle(e.t, 6, 4)];
    case 'oiia': return ((e.sp ?? 0) | 0) % 8;
    case 'apostle': return cycle(e.t, 3, 2);
    case 'labubu': return e.bite && e.bite > 0 ? 3 : PINGPONG[cycle(e.t, 10, 4)];
    case 'evasya': return cycle(e.t, 2, 2);
    case 'troll': case 'ouro': return cycle(e.t, 4, 2);
    case 'tung': return e.state === 'hop' ? 1 : e.state === 'smack' ? 2 : e.atk > 0 ? 3 : cycle(e.t, 3, 2);
  }
  return cycle(e.t, (FPS[e.type] ?? 6) * (e.aff === 'fast' ? 1.8 : 1), 4);
}
