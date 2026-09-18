// Свойства устройства, общие для ввода, UI и HUD.
export const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`нет элемента #${id}`);
  return el as T;
};
export const PIX_FONT = "'Press Start 2P', 'Courier New', monospace";
