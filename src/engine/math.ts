export const TAU = Math.PI * 2;
export const R = Math.round;
export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
/** Модуль разницы углов в [0, π]. */
export const angDiff = (a: number, b: number): number => Math.abs(((a - b + Math.PI * 3) % TAU) - Math.PI);
