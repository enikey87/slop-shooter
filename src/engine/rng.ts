// Детерминированная случайность: одинаковый seed — одинаковая игра. Нужна для тестов, реплеев и симуляции баланса.
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Случайность симуляции. Пересоздаётся на каждую игру через reseed(). */
let simRng: Rng = mulberry32(1);
export function reseed(seed: number): void { simRng = mulberry32(seed); }
export const random = (): number => simRng();
/** Равномерно в (-a, a). */
export const rnd = (a: number): number => (simRng() * 2 - 1) * a;
export function pick<T>(arr: readonly T[]): T { return arr[Math.floor(simRng() * arr.length)]; }

/** Случайность только для визуала (тряска, мерцание): не влияет на исход игры и не сбивает симуляцию. */
export const vrnd = (a: number): number => (Math.random() * 2 - 1) * a;
export function vpick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
