// Ступени одного вида (как цвета в Alien Shooter): с волнами враг не только толстеет, но и учится трюку.
import { P } from './palette';

export interface TierDef {
  readonly name: string;
  readonly hp: number; readonly spd: number; readonly dmg: number;
  /** доля здоровья в секунду */
  readonly regen: number;
  /** подсветка спрайта; null — без подсветки */
  readonly color: string | null;
}
/** 0 черновик · 1 финал · 2 8K · 3 PRO-подписка. С 1-й ступени у вида включается свой трюк. */
export const TIERS: readonly TierDef[] = [
  { name: 'черновик', hp: 1, spd: 1, dmg: 1, regen: 0, color: null },
  { name: 'финал', hp: 1.3, spd: 1.1, dmg: 1, regen: 0, color: P.gold },
  { name: '8K', hp: 1.6, spd: 1.35, dmg: 1.25, regen: 0, color: P.red },
  { name: 'PRO', hp: 3, spd: 1.1, dmg: 1.25, regen: .03, color: P.cyan }
];

/** Шансы ступеней [финал, 8K, PRO] на волне n. Волны 1–5 — только черновики. */
export function tierOdds(n: number): [number, number, number] {
  if (n < 6) return [0, 0, 0];
  const f = Math.min(.45, .15 + (n - 6) * .03);
  const k = n < 12 ? 0 : Math.min(.35, .1 + (n - 12) * .025);
  const pro = n < 18 ? 0 : Math.min(.12, .03 + (n - 18) * .01);
  return [f, k, pro];
}
