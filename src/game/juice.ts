// Отдача от попаданий: стоп-кадр, серии убийств с «диктором», искры и гильзы.
import { P } from '../content/palette';
import { vrnd } from '../engine/rng';
import { G, sfx } from './world';
import { say, banner } from './fx';

/** Заморозить мир на sec секунд (не больше 0,3). */
export function hitStop(sec: number): void { G.hitStop = Math.min(.3, Math.max(G.hitStop, sec)); }

/** Сколько держится серия после последнего убийства. */
export const COMBO_WINDOW = 2.5;
const CALLS: [number, string][] = [
  [5, 'ПАКЕТНАЯ ГЕНЕРАЦИЯ'], [10, 'ПЕРЕОБУЧЕНИЕ'], [20, 'ГАЛЛЮЦИНАЦИЯ ×20'], [35, 'МОДЕЛЬ СЛОМАНА'],
  [50, 'AGI ДОСТИГНУТ'], [75, 'СИНГУЛЯРНОСТЬ'], [100, 'ТЕПЛОВАЯ СМЕРТЬ ДАТАЦЕНТРА']
];
/** Убийство в серию. Возвращает множитель лайков за серию (до +50%). */
export function comboKill(): number {
  const c = G.combo;
  c.n++; c.t = COMBO_WINDOW; c.best = Math.max(c.best, c.n);
  const call = CALLS.find(([n]) => n === c.n);
  if (call) { banner(call[1], `серия ×${c.n} · лайки +${Math.min(50, c.n)}%`, 1.4, c.n >= 50 ? P.red : c.n >= 20 ? P.vest : P.gold); sfx('level', .1); }
  return 1 + Math.min(.5, c.n * .01);
}
export function tickCombo(dt: number): void {
  const c = G.combo;
  if (c.n && (c.t -= dt) <= 0) { if (c.n >= 10) say(G.p.x, G.p.y - 34, `серия ×${c.n}`, P.muted); c.n = 0; }
}

/** Искра в точке попадания. */
export function spark(x: number, y: number, crit = false): void {
  G.parts.push({ x, y, vx: 0, vy: 0, life: .05, max: .05, color: crit ? P.gold : P.white, size: crit ? 3 : 2, flash: true });
}
/** Гильза вылетает вбок от ствола (визуальная случайность — не сбивает симуляцию). */
export function casing(x: number, y: number, a: number, face: number): void {
  const side = a - Math.PI / 2 * face;
  G.parts.push({ x, y, vx: Math.cos(side) * (30 + vrnd(10)), vy: Math.sin(side) * 30 - 25, life: .45, max: .45, color: P.gold, size: 1 });
}
