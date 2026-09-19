// Пикапы, снаряды и разрушаемые объекты.
import { Grid, sign } from '../../engine/gfx/pixel';
import type { Drawer } from '../../engine/gfx/sheet';
import { P } from '../palette';

export function sBomb(g: Grid): void { g.ell(3, 5, 2.5, 2.5, P.metal); g.rect(2, 0, 3, 2, P.metalL); g.px(2, 4, P.greyL); g.px(3, 2, P.red); }

export function sBarrel(g: Grid): void {
  g.rect(1, 3, 9, 11, P.cyanD); g.ell(5, 3, 4, 1, P.cyan); g.rect(1, 6, 9, 1, P.metal); g.rect(1, 11, 9, 1, P.metal);
  g.rect(3, 7, 5, 3, P.white); g.px(5, 8, P.cyan); g.px(4, 8, P.cyanD); g.px(6, 8, P.cyanD); g.rect(1, 3, 1, 11, '#2d6f90');
}

export function sVend(g: Grid, f: number): void {
  g.rect(1, 1, 15, 27, P.red); g.rect(1, 1, 2, 27, P.redD); g.rect(1, 1, 15, 1, '#ff6b5e');
  g.rect(4, 3, 10, 12, P.ink);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.px(5 + c * 2 + (r % 2), 5 + r * 4, [P.white, P.coffeeL, P.gold, P.cyan][(r + c) % 4]);
  g.rect(6, 18, 4, 4, P.white); g.px(10, 19, P.white); g.px(10, 20, P.white); g.rect(6, 18, 4, 1, P.coffee);
  g.px(7, 16 - (f % 2), P.greyL); g.px(8, 15 + (f % 2), P.greyL);
  g.rect(5, 24, 7, 1, P.ink); g.px(14, 18, f % 2 ? P.led : P.gold);
}

export function sCab(g: Grid, f: number): void {
  g.rect(1, 1, 16, 5, '#57526a'); g.rect(1, 1, 16, 1, '#6d6784');
  g.rect(1, 6, 16, 23, '#2f2b3a'); g.rect(1, 6, 16, 1, '#6a6480'); g.rect(1, 6, 1, 23, '#3a3548');
  for (let r = 0; r < 4; r++) {
    const y = 9 + r * 3; g.rect(3, y, 9, 1, '#221f2b'); g.rect(3, y + 1, 9, 1, '#3a3548');
    g.px(14, y, (r + f) % 3 !== 0 ? (r === 2 ? P.red : P.led) : '#24222c');
  }
  sign(g, 'GPU', 3, 21, P.metalL); g.rect(2, 27, 14, 1, '#221f2b');
}

// ---------- pickups & projectiles ----------
export function sAmmo(g: Grid): void { g.rect(1, 4, 11, 6, P.brown); g.rect(1, 4, 11, 2, P.brownL); g.rect(5, 6, 3, 1, P.gold); for (const x of [3, 5, 7, 9]) { g.rect(x, 1, 1, 3, P.gold); g.px(x, 0, P.paper); } }

export function sGrass(g: Grid, f: number): void {
  g.rect(2, 9, 9, 2, P.brown); g.rect(3, 8, 7, 1, P.brownL);
  for (let i = 0; i < 6; i++) { const x = 3 + i, tip = 2 + ((i * 3) % 4); g.line(x, 8, x + (f ? (i % 2 ? 1 : 0) : (i % 2 ? 0 : -1)), tip, i % 2 ? P.green : P.greenD); }
}

export function sDisk(g: Grid, f: number): void { g.rect(1, 1, 10, 10, P.cyanD); g.rect(3, 1, 6, 4, P.greyL); g.rect(6, 2, 2, 2, P.metal); g.rect(3, 7, 6, 4, P.white); g.rect(4, 8, 4, 1, P.pink); if (f) g.px(10, 10, P.led); }

export function sGunBox(g: Grid, f: number): void {
  g.rect(1, 3, 12, 8, P.metal); g.rect(1, 3, 12, 2, P.metalL); g.rect(3, 6, 7, 2, P.gold); g.rect(4, 8, 2, 2, P.gold); g.px(10, 6, P.goldD);
  sign(g, '?', 9, f ? -1 : 0, P.pink);
}

export function sCoffee(g: Grid, f: number): void { g.rect(2, 4, 5, 5, P.white); g.rect(2, 4, 5, 1, P.coffee); g.px(7, 5, P.white); g.px(7, 6, P.white); g.px(3 + f, 2, P.greyL); g.px(5 - f, 1, P.greyL); }

export function sCone(g: Grid): void { g.rect(1, 7, 7, 2, P.vestD); g.rect(3, 1, 3, 6, P.vest); g.rect(3, 3, 3, 1, P.white); g.rect(2, 5, 5, 2, P.vest); g.rect(2, 5, 5, 1, P.white); }

export function sBook(g: Grid): void { g.rect(1, 1, 7, 5, P.brown); g.rect(1, 1, 1, 5, P.brownL); g.rect(7, 1, 1, 5, P.paper); g.rect(3, 3, 3, 1, P.gold); }

export function sCaptcha(g: Grid): void { g.rect(1, 1, 5, 5, P.white); g.px(2, 3, P.green); g.px(3, 4, P.green); g.px(4, 3, P.green); g.px(5, 2, P.green); }

export function sLetter(ch: string): Drawer { return g => sign(g, ch, 1, 1, P.pink); }

export function sKb(g: Grid): void { g.rect(1, 1, 9, 4, P.greyD); for (let x = 2; x < 9; x += 2) { g.px(x, 2, P.greyL); g.px(x + 1, 3, P.greyL); } }

export function sSlipper(g: Grid): void { g.rect(1, 2, 7, 2, P.pinkD); g.rect(2, 1, 5, 1, P.pink); g.px(7, 1, P.pink); g.rect(3, 1, 2, 1, P.cyan); }

export function sNyan(g: Grid, f: number): void { g.rect(3, 1, 7, 5, P.floppa); g.rect(4, 2, 5, 3, P.pinkL); g.px(5, 3, P.pinkD); g.rect(9, 2, 3, 3, P.grey); g.px(10, 3, P.ink); g.px(4 + f, 6, P.grey); g.px(8 - f, 6, P.grey); }

export function sMine(g: Grid, f: number): void { g.rect(1, 1, 9, 6, P.white); g.rect(1, 1, 9, 1, P.greyL); g.ell(4, 4, 1.5, 1.5, P.brownL); g.px(4, 4, P.coffee); g.rect(7, 3, 2, 2, f ? P.red : P.green); }

export function sPeel(g: Grid): void { g.rect(3, 3, 3, 2, P.banana); g.px(1, 4, P.banana); g.px(2, 3, P.banana); g.px(7, 4, P.banana); g.px(6, 3, P.banana); g.px(4, 2, P.bananaD); }

export function sWord(w: string): Drawer { return g => sign(g, w, 1, 1, P.gold); }

export function sBlindbox(g: Grid, f: number): void { g.rect(1, 2, 11, 10, P.labP); g.rect(1, 2, 11, 2, P.pinkL); g.rect(6, 2, 1, 10, P.white); sign(g, '?', 3, 5, P.white); sign(g, '?', 8, 5, P.white); if (f) g.px(11, 1, P.gold); }

export function sDubai(g: Grid, f: number): void {
  g.rect(1, 2, 11, 5, P.choc); g.rect(1, 2, 11, 1, P.chocL); g.px(4, 4, P.chocL); g.px(7, 4, P.chocL);
  g.rect(9, 3, 3, 3, P.pist); g.px(10, 4, P.gold); g.px(11, 3, P.gold); g.px(9, 5, P.greenD);
  if (f) { g.px(2, 1, P.white); g.px(12, 7, P.gold); }
}

export function sCouch(g: Grid): void {
  g.rect(2, 2, 18, 7, P.couch); g.rect(2, 2, 18, 1, '#b04a3b'); g.rect(10, 3, 1, 5, P.couchD);
  g.rect(1, 9, 20, 5, P.couchD); g.rect(1, 9, 20, 1, P.couch); g.rect(0, 6, 3, 9, P.couch); g.rect(19, 6, 3, 9, P.couch);
  g.px(1, 15, P.ink); g.px(20, 15, P.ink); g.px(6, 11, P.stain); g.px(14, 12, P.stain);
}

export function sBottle(g: Grid): void { g.rect(1, 2, 3, 5, P.bottle); g.px(2, 1, P.bottle); g.px(2, 0, P.gold); g.px(2, 4, P.paper); }

export function sToiletProp(g: Grid, f: number): void {
  g.rect(5, 15, 6, 4, P.toiletD); g.rect(4, 18, 8, 1, P.toiletD);
  g.ell(8, 12, 6, 3, P.toilet); g.rect(3, 10, 11, 2, P.toilet); g.ell(8, 11, 4, 1.5, f ? P.cyan : P.cyanD);
  g.rect(1, 1, 4, 11, P.toilet); g.rect(1, 1, 4, 1, P.white); g.px(3, 3, P.metalL); g.rect(3, 10, 11, 1, P.white);
}

export function sRemote(g: Grid, f: number): void { g.rect(1, 1, 4, 8, P.metal); g.rect(1, 1, 4, 1, P.metalL); g.px(2, 2, f ? P.red : P.redD); g.px(3, 4, P.white); g.px(2, 5, P.white); g.px(3, 6, P.white); }

// ---------- пропсы уровней ----------
/** Опенспейс: стол с монитором и кружкой «я здесь случайно». */
export function sDesk(g: Grid, f: number): void {
  g.rect(1, 8, 22, 4, P.woodL); g.rect(1, 8, 22, 1, '#e0b27a'); g.rect(2, 12, 2, 5, P.metal); g.rect(20, 12, 2, 5, P.metal);
  g.rect(8, 1, 9, 6, P.ink); g.rect(9, 2, 7, 4, f ? P.cyanD : '#2d5f7a'); g.rect(12, 7, 1, 1, P.metal);
  sign(g, 'KPI', 9, 2, P.cyan); g.rect(3, 6, 3, 2, P.white); g.px(6, 6, P.white);
}
/** Пуфик: глотает пули. */
export function sBeanbag(g: Grid): void { g.ell(7, 7, 6, 4.5, P.purple); g.ell(6, 6, 4, 3, '#b3a8ff'); g.px(9, 9, P.purpleD); g.px(4, 9, P.purpleD); }
/** Кега комбучи: взрывается газировкой. */
export function sKeg(g: Grid, f: number): void {
  g.rect(1, 3, 8, 10, P.metalL); g.rect(1, 3, 8, 1, P.white); g.rect(1, 7, 8, 1, P.metal); g.rect(3, 5, 4, 5, P.green); sign(g, 'K', 3, 5, P.white);
  g.px(4, 1 + f, P.greenL); g.px(6, 2 - f, P.greenL);
}
/** Грядка с морковкой: выстрел — урожай. */
export function sBed(g: Grid, f: number): void {
  g.rect(1, 3, 24, 8, '#6b4a2a'); g.rect(1, 3, 24, 1, '#8a6238'); g.rect(1, 10, 24, 1, P.woodD);
  for (let i = 0; i < 5; i++) { const x = 3 + i * 5; g.px(x, 5, P.vest); g.px(x, 2 - (f + i) % 2, P.green); g.px(x + 1, 2, P.greenL); g.px(x - 1, 3, P.green); }
}
/** Улей: сломал — пчёлы злые на всех. */
export function sHive(g: Grid, f: number): void {
  g.rect(4, 11, 2, 3, P.woodD); g.rect(1, 3, 8, 8, P.gold); g.rect(1, 5, 8, 1, P.goldD); g.rect(1, 8, 8, 1, P.goldD); g.rect(0, 2, 10, 2, P.woodL);
  g.rect(4, 9, 2, 2, P.ink); g.px(2 + f * 5, 1, P.ink);
}
/** Баня: рядом пар, в пару лечишься. */
export function sBanya(g: Grid, f: number): void {
  g.rect(1, 9, 24, 16, P.wood); for (let y = 11; y < 25; y += 3) g.rect(1, y, 24, 1, P.woodD);
  g.rect(0, 5, 26, 5, '#5a3a24'); g.rect(3, 1, 20, 5, '#6e4a2a'); g.rect(18, 0, 3, 5, P.greyD);
  g.rect(10, 15, 6, 10, P.woodD); g.rect(4, 13, 4, 3, P.gold);
  for (let i = 0; i < 3; i++) g.px(19 + (i + f) % 2, -1 + i, P.white);
}
/** Туалет-скворечник: если сломать — облако. */
export function sOuthouse(g: Grid): void {
  g.rect(1, 4, 10, 19, P.woodL); for (let y = 6; y < 23; y += 3) g.rect(1, y, 10, 1, P.wood); g.rect(0, 1, 12, 4, P.woodD);
  g.rect(4, 8, 4, 3, P.ink); g.px(5, 9, P.gold); g.px(6, 9, P.gold); sign(g, 'М', 4, 13, P.woodD);
}
/** Труба канализации. */
export function sPipe(g: Grid, f: number): void {
  g.rect(1, 3, 26, 8, P.metal); g.rect(1, 3, 26, 2, P.metalL); g.rect(1, 10, 26, 1, P.greyD);
  g.rect(0, 2, 3, 10, P.greyD); g.rect(25, 2, 3, 10, P.greyD); g.rect(13, 1, 3, 12, P.greyD);
  g.px(20, 12, f ? P.cyan : P.cyanD); g.px(20, 13, P.cyan);
}
/** Картина на мольберте: иногда оживает Джокондой. */
export function sPainting(g: Grid, f: number): void {
  g.line(4, 12, 2, 19, P.woodD); g.line(13, 12, 15, 19, P.woodD); g.line(9, 12, 9, 19, P.woodD);
  g.rect(1, 1, 16, 12, P.goldD); g.rect(2, 2, 14, 10, '#4a5a3a'); g.ell(9, 6, 2.5, 3, P.pale); g.rect(6, 9, 6, 3, '#2a2418');
  g.px(8, 6, f ? P.red : P.ink); g.px(10, 6, f ? P.red : P.ink);
}
/** Статуя: у Давида шесть пальцев. */
export function sStatue(g: Grid): void {
  g.rect(1, 20, 10, 5, P.greyL); g.rect(1, 20, 10, 1, P.white);
  g.rect(4, 8, 4, 12, P.grey); g.rect(3, 9, 1, 6, P.greyL); g.rect(8, 9, 1, 6, P.greyL);
  for (let i = 0; i < 6; i++) g.px(i % 2 ? 9 : 2, 15 + (i >> 1), P.white);
  g.ell(6, 5, 2.5, 3, P.greyL); g.rect(4, 2, 4, 1, P.grey);
}
/** Глитч-куб латентного пространства. */
export function sCube(g: Grid, f: number): void {
  const c = [P.purple, P.cyan, P.pink][f % 3];
  g.rect(1, 5, 12, 12, P.purpleD); g.rect(1, 5, 12, 2, c); g.rect(11, 5, 2, 12, P.ink);
  for (let i = 0; i < 4; i++) g.rect(2 + ((i * 5 + f * 3) % 9), 8 + i * 2, 3, 1, i % 2 ? P.cyan : P.pink);
  g.rect(3, 1 + f % 2, 8, 3, c);
}
/** Диван скуфа в масштабе 1:100: горный хребет. */
export function sGiantSofa(g: Grid): void {
  g.rect(1, 6, 70, 18, P.couch); g.rect(1, 6, 70, 2, '#b0503f'); g.rect(1, 0, 70, 8, P.couchD);
  g.rect(0, 4, 8, 26, P.couchD); g.rect(64, 4, 8, 26, P.couchD);
  for (let x = 12; x < 60; x += 17) { g.rect(x, 9, 14, 13, '#a04535'); g.rect(x, 9, 14, 1, '#c05a48'); }
  g.ell(30, 16, 4, 2, P.stain); g.ell(48, 13, 3, 1.5, P.stain); g.rect(2, 30, 3, 3, P.woodD); g.rect(67, 30, 3, 3, P.woodD);
}
/** Бутылка пенного размером с колонну. */
export function sGiantBottle(g: Grid): void {
  g.rect(2, 12, 8, 21, P.bottle); g.rect(3, 12, 2, 21, '#5a9a56'); g.rect(4, 3, 4, 10, P.bottle); g.rect(4, 1, 4, 2, P.gold);
  g.rect(2, 18, 8, 7, P.paper); sign(g, 'ПВ', 3, 19, P.red);
}
/** Телевизор скуфа: крутит рекламу, из рекламы лезет слоп. */
export function sTv(g: Grid, f: number): void {
  g.rect(1, 1, 36, 22, P.ink); g.rect(3, 3, 32, 18, f ? '#3a8fb8' : '#b83a8f');
  sign(g, f ? 'SALE' : 'СЛОП', 9, 8, P.white); g.rect(16, 23, 6, 3, P.metal); g.rect(10, 26, 18, 2, P.metal); g.px(33, 20, P.red);
}
/** Морковка с грядки. */
export function sCarrot(g: Grid, f: number): void { g.line(3, 3, 6, 10, P.vest); g.line(4, 3, 7, 9, P.orange); g.px(2 + f, 1, P.green); g.px(4, 0, P.greenL); g.px(5, 1, P.green); }
