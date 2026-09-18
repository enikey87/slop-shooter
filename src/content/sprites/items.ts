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
