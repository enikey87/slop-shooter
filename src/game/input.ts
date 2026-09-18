// Ввод, приведённый к одному тику симуляции. Источник — клавиатура/мышь/тач (ui/input.ts), бот или запись реплея.
export type Action = 'dash' | 'q' | 'e' | 'r' | 'c' | 'v' | 'g' | 'f' | 'alt' | 'next' | 'prev' | { slot: number };

export interface TickInput {
  /** направление движения, длина ≤ 1 */
  mx: number; my: number;
  /** прицел в пикселях видимой области (не мира); null — угол не меняется */
  aim: { x: number; y: number } | null;
  fire: boolean;
  /** нажатия за этот тик, по порядку */
  actions: Action[];
}

export const idleInput = (): TickInput => ({ mx: 0, my: 0, aim: null, fire: false, actions: [] });
