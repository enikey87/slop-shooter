// Клавиатура, мышь и тач → TickInput. Нажатия копятся в очередь и отдаются симуляции на ближайшем тике.
import { isTouch, $ } from '../platform';
import { view } from '../render/canvas';
import type { Action, TickInput } from '../game/input';

export const keys: Record<string, boolean> = {};
export const mouse = { x: innerWidth / 2 + 80, y: innerHeight / 2, down: false };
/** Тач: левый палец — стик, правый — прицел и огонь. */
export const touch: { stick: { id: number; ox: number; oy: number; x: number; y: number } | null; aim: { id: number; x: number; y: number } | null } = { stick: null, aim: null };

const queue: Action[] = [];

export interface InputHandlers {
  /** идёт ли сейчас бой (иначе игровые клавиши игнорируются) */
  playing(): boolean;
  sound(): void;
  nextTrack(): void;
  pause(): void;
  /** цифра на экране перков */
  perk(i: number): boolean;
  /** потеря фокуса окна */
  blur(): void;
}

const KEY_ACTION: Record<string, Action> = {
  Space: 'dash', KeyQ: 'q', KeyE: 'e', KeyR: 'r', KeyF: 'f', KeyC: 'c', KeyZ: 'alt', KeyV: 'v', KeyG: 'g'
};

export function initInput(h: InputHandlers): void {
  const cv = $('c');
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyM') { h.sound(); return; }
    if (e.code === 'KeyN') { h.nextTrack(); return; }
    if (e.code === 'KeyP' || e.code === 'Escape') { h.pause(); return; }
    if (/^Digit[1-3]$/.test(e.code) && h.perk(+e.code.slice(5) - 1)) return;
    if (!h.playing()) return;
    if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    const a = KEY_ACTION[e.code];
    if (a) queue.push(a);
    if (e.code === 'Tab') queue.push(e.shiftKey ? 'prev' : 'next');
    const dm = /^Digit(\d)$/.exec(e.code);
    if (dm) queue.push({ slot: dm[1] === '0' ? 9 : +dm[1] - 1 });
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('wheel', e => { if (h.playing()) queue.push(e.deltaY > 0 ? 'next' : 'prev'); }, { passive: true });
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      if (e.clientX < view.W / 2 && !touch.stick) touch.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
      else touch.aim = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (e.button === 2) { mouse.x = e.clientX; mouse.y = e.clientY; if (h.playing()) queue.push('alt'); }
    else { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; }
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') {
      if (touch.stick && e.pointerId === touch.stick.id) { touch.stick.x = e.clientX; touch.stick.y = e.clientY; }
      if (touch.aim && e.pointerId === touch.aim.id) { touch.aim.x = e.clientX; touch.aim.y = e.clientY; }
    } else { mouse.x = e.clientX; mouse.y = e.clientY; }
  });
  const up = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      if (touch.stick && e.pointerId === touch.stick.id) touch.stick = null;
      if (touch.aim && e.pointerId === touch.aim.id) touch.aim = null;
    } else mouse.down = false;
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  addEventListener('pointerup', e => { if (e.pointerType !== 'touch') mouse.down = false; });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', () => { mouse.down = false; for (const k in keys) keys[k] = false; h.blur(); });
}

/** Кнопка тачбара или UI нажала действие. */
export const pushAction = (a: Action): void => { queue.push(a); };
export const releaseFire = (): void => { mouse.down = false; };

/** Ввод на один тик. Очередь нажатий отдаётся один раз. */
export function readTick(): TickInput {
  let mx = 0, my = 0;
  if (keys.KeyW || keys.ArrowUp) my--;
  if (keys.KeyS || keys.ArrowDown) my++;
  if (keys.KeyA || keys.ArrowLeft) mx--;
  if (keys.KeyD || keys.ArrowRight) mx++;
  const st = touch.stick;
  if (st) { const sx = st.x - st.ox, sy = st.y - st.oy, sl = Math.hypot(sx, sy); if (sl > 8) { mx = sx / Math.max(sl, 50); my = sy / Math.max(sl, 50); } }
  const S = view.S;
  let aim: TickInput['aim'] = null, fire = false;
  if (touch.aim) { aim = { x: touch.aim.x / S, y: touch.aim.y / S }; fire = true; }
  else if (!isTouch) { aim = { x: mouse.x / S, y: mouse.y / S }; fire = mouse.down; }
  return { mx, my, aim, fire, actions: queue.splice(0) };
}
