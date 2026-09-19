// Фиксированный шаг симуляции: логика всегда тикает по STEP секунд, независимо от частоты экрана.
// Одинаковый seed + одинаковый ввод = одинаковый результат (нужно для тестов и симулятора баланса).
export const TICK_HZ = 60;
export const STEP = 1 / TICK_HZ;
/** Больше этого за кадр не догоняем: после сворачивания вкладки игра не «проматывается». */
const MAX_FRAME = 0.25;
/** Если тик стал тяжелее кадра, не копим долг бесконечно (иначе «спираль смерти» и зависание). */
const MAX_TICKS_PER_FRAME = 8;

export interface LoopHooks {
  /** Один тик симуляции длиной STEP. */
  tick(dt: number): void;
  /** Раз в кадр: реальный dt (для UI) и доля до следующего тика (для интерполяции). */
  frame(dt: number, alpha: number): void;
  /** Ошибка в тике или кадре. Цикл после неё продолжается — игра не замирает. */
  onError?(err: unknown, where: 'tick' | 'frame'): void;
}

export function startLoop(h: LoopHooks): () => void {
  let last = performance.now(), acc = 0, raf = 0;
  const safe = (where: 'tick' | 'frame', fn: () => void): void => {
    try { fn(); } catch (err) { h.onError?.(err, where); }
  };
  const run = (now: number) => {
    // следующий кадр заказываем первым: что бы ни случилось ниже, цикл не остановится
    raf = requestAnimationFrame(run);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n++ < MAX_TICKS_PER_FRAME) { safe('tick', () => h.tick(STEP)); acc -= STEP; }
    if (acc > STEP) acc = 0;
    safe('frame', () => h.frame(dt, acc / STEP));
  };
  raf = requestAnimationFrame(run);
  return () => cancelAnimationFrame(raf);
}
