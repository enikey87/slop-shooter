// Фиксированный шаг симуляции: логика всегда тикает по STEP секунд, независимо от частоты экрана.
// Одинаковый seed + одинаковый ввод = одинаковый результат (нужно для тестов и симулятора баланса).
export const TICK_HZ = 60;
export const STEP = 1 / TICK_HZ;
/** Больше этого за кадр не догоняем: после сворачивания вкладки игра не «проматывается». */
const MAX_FRAME = 0.25;

export interface LoopHooks {
  /** Один тик симуляции длиной STEP. */
  tick(dt: number): void;
  /** Раз в кадр: реальный dt (для UI) и доля до следующего тика (для интерполяции). */
  frame(dt: number, alpha: number): void;
}

export function startLoop(h: LoopHooks): () => void {
  let last = performance.now(), acc = 0, raf = 0;
  const run = (now: number) => {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) { h.tick(STEP); acc -= STEP; }
    h.frame(dt, acc / STEP);
    raf = requestAnimationFrame(run);
  };
  raf = requestAnimationFrame(run);
  return () => cancelAnimationFrame(raf);
}
