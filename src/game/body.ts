// Геометрия врагов, нужная и симуляции, и рендеру.
import { enemyDef } from '../content/enemies';
import type { Enemy } from './state';

/** Y центра тела (куда целятся пули). */
export const bodyY = (e: Enemy): number => e.y - (e.alt ? e.alt + Math.sin(e.t * 3) * 2 : e.hy);
const BIG = new Set(['jboss', 'cboss', 'skboss', 'fboss', 'skuf']);
export const scaleOf = (e: Enemy): number => (BIG.has(e.type) ? 2 : 1);
export const isBoss = (e: Enemy): boolean => !!enemyDef(e.type).boss;
/** Доля здоровья босса с учётом сегментов хвоста. */
export const bossFrac = (e: Enemy): number =>
  e.segs && e.segMax ? (e.hp + e.segs.reduce((a, sg) => a + (sg.dead ? 0 : Math.max(0, sg.hp)), 0)) / (e.max + e.segMax) : e.hp / e.max;
