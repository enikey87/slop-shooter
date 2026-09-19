// Разрушаемые объекты: размеры подножия, прочность, смещение спрайта.
export interface PropDef { readonly w: number; readonly h: number; readonly hp: number; readonly ox: number; readonly oy: number }

export const PROPDEF = {
  cab: { w: 16, h: 8, hp: 25, ox: -1, oy: -21 },
  barrel: { w: 8, h: 5, hp: 5, ox: -1, oy: -9 },
  vend: { w: 14, h: 7, hp: 16, ox: -1, oy: -21 },
  couch: { w: 20, h: 6, hp: 30, ox: -1, oy: -11 },
  toiletprop: { w: 12, h: 6, hp: 45, ox: -2, oy: -13 },
  // опенспейс
  desk: { w: 22, h: 8, hp: 20, ox: -1, oy: -9 },
  beanbag: { w: 12, h: 6, hp: 999, ox: -1, oy: -5 },
  keg: { w: 8, h: 5, hp: 6, ox: -1, oy: -8 },
  // дача
  bed: { w: 24, h: 6, hp: 3, ox: -1, oy: -5 },
  hive: { w: 8, h: 5, hp: 6, ox: -1, oy: -9 },
  banya: { w: 24, h: 10, hp: 80, ox: -1, oy: -15 },
  outhouse: { w: 10, h: 7, hp: 20, ox: -1, oy: -16 },
  // канализация
  pipe: { w: 26, h: 8, hp: 50, ox: -1, oy: -5 },
  // музей
  painting: { w: 16, h: 4, hp: 10, ox: -1, oy: -16 },
  statue: { w: 10, h: 6, hp: 40, ox: -1, oy: -19 },
  // латентное пространство
  cube: { w: 12, h: 10, hp: 30, ox: -1, oy: -8 },
  // квартира скуфа
  gsofa: { w: 70, h: 14, hp: 400, ox: -1, oy: -20 },
  gbottle: { w: 10, h: 7, hp: 40, ox: -1, oy: -27 },
  tv: { w: 36, h: 8, hp: 150, ox: -1, oy: -21 }
} as const satisfies Record<string, PropDef>;
export type PropKind = keyof typeof PROPDEF;
