// Всплывающие надписи, баннеры, отложенные события и частицы.
import { P } from '../content/palette';
import { G } from './world';
import { random, pick } from '../engine/rng';
import { TAU } from '../engine/math';

export function banner(title: string, sub: string, t = 2.6, color: string = P.gold): void { G.banner = { title, sub, t, max: t, color }; }
export function say(x: number, y: number, txt: string, color: string = P.paper, big = false): void { G.texts.push({ x, y, txt, color, big, t: 1.3, max: 1.3 }); }
/** Выполнить fn через t секунд игрового времени (на паузе не тикает). */
export function later(t: number, fn: () => void): void { G.timers.push({ t, fn }); }

export function burst(x: number, y: number, colors: string | readonly string[], n: number, spd = 70, size = 1): void {
  for (let i = 0; i < n; i++) {
    const a = random() * TAU, s = spd * (.3 + random());
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .7, life: .3 + random() * .5, max: .8, color: typeof colors === 'string' ? colors : pick(colors), size });
  }
}
export function ring(x: number, y: number, color: string, size: number, life: number): void {
  G.parts.push({ x, y, vx: 0, vy: 0, life, max: life, color, size, ring: true });
}

export function tickTimers(dt: number): void {
  for (const tm of G.timers) { tm.t -= dt; if (tm.t <= 0) tm.fn(); }
  G.timers = G.timers.filter(tm => tm.t > 0);
}

export function tickFx(dt: number): void {
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= Math.pow(.04, dt); q.vy *= Math.pow(.04, dt); q.life -= dt; }
  G.parts = G.parts.filter(q => q.life > 0);
  if (G.parts.length > 3000) G.parts.splice(0, G.parts.length - 3000);
  for (const t of G.texts) { t.t -= dt; t.y -= 12 * dt; }
  G.texts = G.texts.filter(t => t.t > 0);
  if (G.texts.length > 40) G.texts.splice(0, G.texts.length - 40);
  G.shake = Math.max(0, G.shake - dt * 16);
  if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
  G.flash = Math.max(0, G.flash - dt);
}
