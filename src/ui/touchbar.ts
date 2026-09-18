// Кнопки способностей на тач-экране.
import { isTouch, $ } from '../platform';
import { R } from '../engine/math';
import { G } from '../game/world';
import { curSlot } from '../game/weapons';
import type { Action } from '../game/input';
import { pushAction } from './input';

const BTN: Record<string, Action> = { alt: 'alt', q: 'q', e: 'e', r: 'r', c: 'c', v: 'v', g: 'g', f: 'f', swap: 'next', dash: 'dash' };

export function initTouchbar(): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('#touchbar button')) {
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      const a = BTN[b.dataset.a ?? ''];
      if (a && G.state === 'play') pushAction(a);
    });
  }
}

let refreshT = 0;
export function updateTouchbar(dt: number): void {
  if (!isTouch) return;
  const bar = $('touchbar');
  bar.hidden = G.state !== 'play';
  if (bar.hidden || (refreshT -= dt) > 0) return;
  refreshT = .2;
  const p = G.p, slot = curSlot(), altCd = slot.altCd ?? 0;
  const set = (a: string, ready: boolean, label: string): void => {
    const b = bar.querySelector<HTMLElement>(`[data-a="${a}"]`);
    if (b) { b.dataset.ready = ready ? '1' : '0'; b.textContent = label; }
  };
  const cd = (a: string, left: number, name: string): void => set(a, left <= 0, left > 0 ? `${name} ${Math.ceil(left)}` : name);
  cd('q', p.cdQ, 'WI-FI'); cd('e', p.cdE, 'ТРАВА'); cd('c', p.cdC, 'ВАСЯ'); cd('v', p.cdV, 'CTRL+Z'); cd('g', p.cdG, 'ИНЪЕКЦИЯ');
  set('r', p.ult >= 100, p.ult >= 100 ? 'БЛЭКАУТ' : `БЛЭКАУТ ${R(p.ult)}%`);
  set('f', p.guilt, 'ПОЗДРАВИТЬ');
  set('dash', p.dashCd <= 0, 'КУВЫРОК');
  set('alt', altCd <= 0, altCd > 0 ? `АЛЬТ ${altCd.toFixed(1)}` : 'АЛЬТ');
  set('swap', p.guns.length > 1, 'ПУШКА');
}
