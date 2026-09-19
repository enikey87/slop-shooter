import { describe, expect, it } from 'vitest';
import { G } from '../src/game/world';
import { addEnemy } from '../src/game/spawn';
import { startLoop, STEP } from '../src/engine/loop';
import { tickTimers, later } from '../src/game/fx';
import { STUCK_NUDGE, STUCK_CLEAR } from '../src/game/guard';
import { start, run } from './helpers';

describe('защита от зависаний', () => {
  it('исключение в тике не останавливает игровой цикл', () => {
    const frames: ((t: number) => void)[] = [];
    (globalThis as unknown as { requestAnimationFrame: (f: (t: number) => void) => number }).requestAnimationFrame = f => { frames.push(f); return frames.length; };
    (globalThis as unknown as { cancelAnimationFrame: () => void }).cancelAnimationFrame = () => {};
    let ticks = 0, errors = 0;
    startLoop({ tick: () => { ticks++; if (ticks === 3) throw new Error('бум'); }, frame: () => {}, onError: () => { errors++; } });
    let t = performance.now();
    for (let i = 0; i < 10; i++) { t += 1000 / 60; frames[frames.length - 1](t); }
    expect(errors).toBe(1);
    expect(ticks).toBeGreaterThan(5);
  });
  it('упавшее отложенное событие не роняет тик', () => {
    start(1);
    let ok = false;
    later(0, () => { throw new Error('бум'); });
    later(0, () => { ok = true; });
    expect(() => tickTimers(STEP)).not.toThrow();
    expect(ok).toBe(true);
  });
  it('враг с NaN удаляется, игрок с NaN возвращается на место', () => {
    start(2);
    const e = addEnemy('hand', 100, 100); e.x = NaN;
    run(.1, null);
    const x = G.p.x;
    G.p.x = NaN;
    run(.1, null);
    expect(G.enemies.includes(e)).toBe(false);
    expect(Math.abs(G.p.x - x)).toBeLessThan(5);
  });
  it('сторож: враг, который не умирает, телепортируется к игроку, потом волна закрывается', () => {
    start(3);
    G.mods.maxHp = G.p.hp = 1e6;
    G.wave = 3; G.phase = 'wave'; G.queue = [];
    const e = addEnemy('capy', 780, 540); e.charm = 999; // «свой» навсегда: сам не умрёт и не даст убить себя
    run(STUCK_NUDGE + 1, null);
    expect(Math.hypot(e.x - G.p.x, e.y - G.p.y)).toBeLessThan(150);
    e.charm = 999; e.hp = 1e9; e.max = 1e9;
    run(STUCK_CLEAR - STUCK_NUDGE + 1, null);
    expect(G.phase).toBe('inter');
  });
});
