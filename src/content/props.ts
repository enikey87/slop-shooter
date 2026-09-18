// Разрушаемые объекты: размеры подножия, прочность, смещение спрайта.
export interface PropDef { readonly w: number; readonly h: number; readonly hp: number; readonly ox: number; readonly oy: number }

export const PROPDEF = {
  cab: { w: 16, h: 8, hp: 25, ox: -1, oy: -21 },
  barrel: { w: 8, h: 5, hp: 5, ox: -1, oy: -9 },
  vend: { w: 14, h: 7, hp: 16, ox: -1, oy: -21 },
  couch: { w: 20, h: 6, hp: 30, ox: -1, oy: -11 },
  toiletprop: { w: 12, h: 6, hp: 45, ox: -2, oy: -13 }
} as const satisfies Record<string, PropDef>;
export type PropKind = keyof typeof PROPDEF;
