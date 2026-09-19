// Враги и боссы. Все спрайты смотрят вправо, зеркалит рендер.
import { Grid, sign } from '../../engine/gfx/pixel';
import { R, TAU } from '../../engine/math';
import { P } from '../palette';

// ---------- enemies ----------
export function sHand(g: Grid, f: number, n: number): void {
  const cx = 7, cy = 9;
  for (let i = 0; i < n; i++) {
    const a = -1.2 + 2.4 * i / (n - 1), len = 3 + ((i + f) % 2) + (i % 3 === 0 ? 1 : 0);
    const bx = cx + Math.cos(a) * 3.2, by = cy + Math.sin(a) * 2.6, wig = ((i + f) % 2 ? .3 : -.3);
    const ex = bx + Math.cos(a + wig) * len, ey = by + Math.sin(a + wig) * len * .85;
    g.line(bx, by, ex, ey, P.skin); g.px(ex, ey, P.nail);
  }
  g.rect(1, cy - 2, 3, 4, P.skinD); g.px(1, cy - 2, P.skin);
  g.ell(cx, cy, 4, 3, P.skin);
  g.px(cx - 1, cy - 2, P.skinL); g.px(cx, cy - 2, P.skinL); g.px(cx + 1, cy - 1, P.skinL);
  g.line(cx - 2, cy + 1, cx + 2, cy + 1, P.skinD);
}

export function sCat(g: Grid, f: number, k: number): void {
  const s = (v: number): number => R(v * k), sw = [1, 0, -1, 0][f], tw = [0, 1, 2, 1][f], th = k > .8 ? 2 : 1;
  g.line(s(6), s(10), s(3), s(7), P.grey, th); g.line(s(3), s(7), s(2) + (f % 2), s(3) - tw + 1, P.grey, th);
  for (const [lx, back] of [[8, 1], [10, 0], [15, 1], [17, 0]]) g.line(s(lx), s(12), s(lx) + (back ? -sw : sw), s(16), back ? P.greyD : P.grey, th);
  g.ell(s(12), s(10), s(6.5), s(3.5), P.grey);
  for (const x of [9, 11, 13]) g.line(s(x), s(7), s(x), s(9), P.greyD);
  g.rect(s(8), s(12), s(8), 1, P.greyL);
  for (const [hx, hy, bob] of [[19, 6, f % 2], [21, 11, (f + 1) % 2]]) {
    const X = s(hx), Y = s(hy) + bob;
    g.ell(X, Y, s(3.2), s(3), P.grey);
    g.px(X - s(2), Y - s(3.4), P.grey); g.px(X + s(2), Y - s(3.4), P.grey);
    g.px(X - s(2), Y - s(4.4), P.pinkD); g.px(X + s(2), Y - s(4.4), P.pinkD);
    g.px(X + 1, Y - 1, P.gold); g.px(X + s(2.5), Y - 1, P.gold); g.px(X + s(3), Y + 1, P.pink);
  }
}

export function sSpag(g: Grid, f: number, atk: boolean): void {
  const sw = atk ? 0 : [2, 0, -2, 0][f];
  g.line(7, 18, 7 + sw, 22, P.pants, 2); g.line(10, 18, 10 - sw, 22, P.pants, 2);
  g.rect(6 + sw, 23, 3, 1, P.boot); g.rect(9 - sw, 23, 3, 1, P.boot);
  g.rect(5, 12, 8, 7, P.shirt); g.rect(5, 12, 2, 7, P.shirtD);
  g.line(12, 14, 15, 12, P.tan); g.line(15, 12, 16, 5, P.greyL); g.px(15, 4, P.greyL); g.px(17, 4, P.greyL); g.px(16, 4, P.greyL);
  g.ell(9, 7, 5, 5, P.tan);
  for (let y = 1; y <= 4; y++) for (let x = 3; x <= 15; x++) if (g.get(x, y) === P.tan) g.px(x, y, '#2a1a14');
  g.rect(4, 3, 2, 5, '#2a1a14');
  g.px(11, 7, P.white); g.px(12, 7, P.ink);
  g.rect(11, 10, 3, atk ? 2 : 1, P.ink);
  if (atk) { for (let i = 0; i < 5; i++) g.px(14 + i, 10 + (i % 2), P.noodle); }
  else for (let i = 0; i < 3; i++) for (let y = 11; y < 16 + i; y++) g.px(11 + i + ((y + f + i) % 2), y, P.noodle);
}

export function sGolem(g: Grid, f: number): void {
  const b = f % 2, sw = [1, 0, -1, 0][f];
  g.rect(7, 24 - (sw > 0 ? 1 : 0), 3, 6, P.paperD); g.rect(14, 24 - (sw < 0 ? 1 : 0), 3, 6, P.paperD);
  g.line(3, 12 + b, 1, 18 + sw, P.paperD, 2); g.line(20, 12 + b, 22, 18 - sw, P.paperD, 2);
  g.rect(3, 4 + b, 18, 20, P.paper);
  g.rect(3, 4 + b, 18, 1, P.red); g.rect(3, 23 + b, 18, 1, P.red); g.rect(3, 4 + b, 1, 20, P.red); g.rect(20, 4 + b, 1, 20, P.red);
  sign(g, 'ОТКР', 5, 7 + b, P.red); sign(g, 'ЬІТО', 5, 14 + b, P.red);
  g.rect(5, 21 + b, 14, 1, P.paperD); g.rect(9, 1 + b, 6, 3, P.paper); g.px(10, 2 + b, P.red); g.px(13, 2 + b, P.red);
}

export function sJesus(g: Grid, f: number): void {
  const cx = 16, cy = 23, rr = 6.5;
  for (let i = 0; i < 6; i++) {
    const a = .2 + i * .5, x0 = cx + Math.cos(a) * (rr - 2), y0 = cy + Math.sin(a) * (rr - 2), fl = ((i + f) % 2) ? 1 : -1;
    g.line(x0, y0, x0 - Math.cos(a) * 3 + fl, y0 - Math.sin(a) * 3 + 1, P.shrimpD);
  }
  const pts = [];
  for (let i = 0; i < 9; i++) { const a = -1.4 + i * .52; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4.2 - i * .28]); }
  const tl = pts[8];
  g.line(tl[0], tl[1], tl[0] + 3, tl[1] - 4, P.shrimp, 2); g.line(tl[0], tl[1], tl[0] + 5, tl[1] - 1, P.shrimpD, 2);
  for (let i = 8; i >= 0; i--) { const [x, y, r] = pts[i]; g.ell(x, y, r, r, i % 2 ? P.shrimp : '#ffa27a'); g.px(x - 1, y - r + 1, P.white); }
  const up = f % 2;
  g.line(11, 15, 7, 10 - up, P.pale); g.px(7, 9 - up, P.pale); g.px(6, 10 - up, P.pale);
  g.line(21, 15, 25, 10 - up, P.pale); g.px(25, 9 - up, P.pale); g.px(26, 10 - up, P.pale);
  g.ell(16, 9, 5, 6, P.hair); g.ell(17, 9, 3, 4, P.pale);
  g.px(16, 8, P.ink); g.px(18, 8, P.ink); g.ell(17, 13, 3, 2, P.hair); g.px(17, 11, P.pinkD);
  g.line(13, 3, 12, 1, P.shrimp); g.line(19, 3, 21, 0, P.shrimp);
}

export function sHalo(g: Grid, f: number): void { g.ring(8, 3, 7, 2, f % 2 ? P.white : P.gold); }

// Тралалеро Тралала: акула на трёх ногах в найках
export function sShark(g: Grid, f: number): void {
  const wind = f === 4, sw = wind ? 0 : [2, 0, -2, 0][f], dy = wind ? 2 : 0;
  for (const [lx, back] of [[9, 1], [13, 0], [17, 1]]) {
    const o = back ? -sw : sw;
    g.line(lx, 11 + dy, lx + o, 15, back ? P.sharkD : P.shark, 2);
    g.rect(lx + o - 1, 16, 4, 2, P.white); g.px(lx + o, 16, P.cyan); g.px(lx + o + 1, 17, P.greyD);
  }
  g.line(5, 8 + dy, 1, 3 + dy, P.shark, 2); g.line(5, 8 + dy, 1, 12 + dy, P.sharkD, 2);
  g.ell(13, 8 + dy, 9, 4, P.shark); g.ell(14, 10 + dy, 7, 1.6, P.white);
  g.line(11, 4 + dy, 14, 0 + dy, P.shark, 2); g.px(15, 1 + dy, P.sharkD);
  g.px(19, 6 + dy, P.ink); g.px(18, 6 + dy, P.white);
  g.rect(17, 9 + dy, 5, 1, P.ink); for (let x = 17; x < 22; x += 2) g.px(x, 9 + dy, P.white);
  g.px(9, 8 + dy, P.sharkD); g.px(10, 9 + dy, P.sharkD); g.px(9, 10 + dy, P.sharkD);
}

// Бомбардиро Крокодило
export function sCroc(g: Grid, f: number): void {
  g.line(1, 10, 6, 10, P.croc, 2); g.px(1, 9, P.crocD); g.px(2, 8, P.croc);
  g.ell(14, 10, 10, 3, P.croc); for (let x = 6; x < 22; x += 3) g.px(x, 7, P.crocD);
  g.rect(8, 12, 12, 1, P.greenL);
  g.rect(23, 9, 6, 3, P.croc); g.rect(23, 11, 6, 1, P.crocD); for (let x = 24; x < 29; x += 2) g.px(x, 12, P.white);
  g.px(22, 7, P.gold); g.px(22, 6, P.croc); g.px(21, 6, P.croc);
  g.rect(11, 2, 6, 5, P.grey); g.rect(11, 2, 6, 1, P.greyL); g.rect(11, 13, 6, 5, P.greyD); g.rect(11, 17, 6, 1, P.metal);
  g.px(12, 4, P.red); g.px(13, 4, P.white); g.px(14, 4, P.red);
  if (f % 2) g.line(30, 5, 30, 15, P.greyL); else { g.line(30, 9, 30, 11, P.greyL); g.px(30, 5, P.greyD); g.px(30, 15, P.greyD); }
  g.px(29, 10, P.metal); g.rect(14, 13, 2, 2, P.metal);
}

// Тун Тун Тун Сахур
export function sTung(g: Grid, f: number): void {
  const crouch = f === 2, smack = f === 3, sw = f === 1 ? 1 : 0, top = crouch ? 7 : 4;
  g.line(6, 23, 6 - sw, 26, P.woodD); g.line(10, 23, 10 + sw, 26, P.woodD);
  g.rect(4, top, 8, 23 - top, P.wood); g.rect(4, top, 8, 1, P.woodL); g.rect(4, top, 1, 23 - top, P.woodD);
  for (let y = top + 11; y < 22; y += 3) g.rect(5, y, 6, 1, P.woodD);
  g.rect(5, top + 3, 2, 2, P.white); g.rect(9, top + 3, 2, 2, P.white); g.px(6, top + 4, P.ink); g.px(10, top + 4, P.ink);
  g.rect(6, top + 7, 4, 1, P.ink);
  g.line(4, top + 10, 2, top + 14, P.woodD);
  if (smack) { g.line(12, top + 10, 15, top + 10, P.woodD); g.line(14, top + 9, 21, top + 9, P.woodL, 2); }
  else { g.line(12, top + 10, 14, top + 8, P.woodD); g.line(14, top + 8, 17, top - 3, P.woodL, 2); }
}

// Балерина Капучина
export function sBallerina(g: Grid, f: number): void {
  const arm = [0, 1, 2, 1][f];
  g.line(7, 17, 6, 22, P.skin); g.line(9, 17, 10 + (f % 2), 22, P.skin); g.px(6, 23, P.pink); g.px(10 + (f % 2), 23, P.pink);
  g.ell(8, 15, 6, 1.5, P.pinkL); g.rect(3, 15, 11, 1, P.pink);
  g.rect(6, 9, 5, 6, P.pink); g.px(8, 8, P.skin);
  g.line(6, 10, 3, 5 - arm, P.skin); g.line(10, 10, 13, 5 - arm, P.skin);
  g.rect(4, 2, 9, 6, P.white); g.rect(5, 1, 7, 1, P.coffeeL); g.rect(4, 2, 9, 1, P.coffee); g.px(8, 2, P.paper);
  g.px(13, 3, P.white); g.px(14, 4, P.white); g.px(13, 5, P.white);
  g.px(6, 4, P.ink); g.px(10, 4, P.ink); g.px(6, 3, P.ink); g.px(10, 3, P.ink); g.px(8, 6, P.pinkD);
  g.rect(3, 8, 11, 1, P.greyL);
}

// астронавт, несущий лошадь
export function sHorse(g: Grid, f: number): void {
  const sw = [2, 0, -2, 0][f];
  g.line(9, 23, 9 + sw, 27, P.suitD, 2); g.line(13, 23, 13 - sw, 27, P.suit, 2);
  g.rect(8 + sw, 28, 3, 1, P.metal); g.rect(12 - sw, 28, 3, 1, P.metal);
  g.rect(7, 15, 9, 9, P.suit); g.rect(7, 15, 2, 9, P.suitD); g.rect(10, 18, 3, 2, P.red); g.px(13, 18, P.cyan);
  g.line(7, 16, 5, 9, P.suit, 2); g.line(16, 16, 18, 9, P.suit, 2);
  g.ell(12, 12, 4, 4, P.suit); g.rect(12, 11, 4, 3, P.gold); g.px(13, 11, P.white);
  for (const x of [3, 6, 16, 19]) g.line(x, 6, x + ((f + x) % 2 ? 1 : -1), 12, P.horseD);
  for (const x of [3, 6, 16, 19]) g.px(x + ((f + x) % 2 ? 1 : -1), 13, P.ink);
  g.ell(11, 5, 9, 3, P.horse); g.rect(4, 7, 14, 1, P.horseD); g.px(8, 3, P.white);
  g.line(18, 4, 20, 1, P.horse, 2); g.rect(19, 0, 4, 3, P.horse); g.px(22, 2, P.horseD); g.px(20, 0, P.ink); g.px(21, 1, P.white);
  g.line(16, 3, 18, 0, P.hair); g.line(2, 3, 0, 8, P.hair);
}

export function sHorseFree(g: Grid, f: number): void {
  const s = [3, 1, -3, -1][f];
  for (const [x, sg] of [[5, 1], [7, -1], [14, 1], [16, -1]]) { g.line(x, 9, x + s * sg * .7, 13, sg > 0 ? P.horseD : P.horse); g.px(x + s * sg * .7, 14, P.ink); }
  g.ell(10, 7, 7, 3, P.horse); g.rect(6, 9, 8, 1, P.horseD);
  g.line(15, 6, 18, 2, P.horse, 2); g.rect(18, 1, 3, 3, P.horse); g.px(20, 3, P.horseD); g.px(19, 1, P.ink);
  g.line(14, 5, 17, 1, P.hair); g.line(3, 6, 1, 10 - (f % 2), P.hair);
}

// грустный дед с тортом
export function sGrandpa(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(7, 17, 7 + sw, 21, P.pants, 2); g.line(10, 17, 10 - sw, 21, P.pants, 2);
  g.rect(6 + sw, 22, 3, 1, P.boot); g.rect(9 - sw, 22, 3, 1, P.boot);
  g.rect(5, 10, 8, 8, P.cardigan); g.px(9, 12, P.gold); g.px(9, 15, P.gold);
  g.ell(9, 6, 4, 4, P.skin); g.px(8, 3, P.white); g.rect(5, 5, 2, 3, P.greyL); g.rect(9, 9, 4, 2, P.greyL);
  g.px(10, 6, P.ink); g.px(11, 5, P.greyD); g.px(10, 7 + (f % 2), P.cyan);
  g.line(12, 12, 14, 13, P.cardigan);
  g.rect(13, 13, 6, 4, P.white); g.rect(13, 13, 6, 1, P.pink); g.px(14, 15, P.pink); g.px(17, 15, P.pink);
  g.rect(16, 10, 1, 3, P.cyan); g.px(16, 9 - (f % 2), P.gold); g.px(16, 8, f % 2 ? P.vest : P.gold);
}

// Мама Промпт
export function sMama(g: Grid, f: number): void {
  for (let i = 0; i < 6; i++) { const x = 8 + i * 6, wig = ((i + f) % 2) ? 1 : -1; g.line(x, 30, x + wig * 2, 39, i % 2 ? P.pinkD : P.metal, 2); }
  g.ell(23, 26, 19, 12, P.pinkD); g.ell(23, 23, 18, 11, P.pink); g.ell(15, 17, 4, 2, P.pinkL);
  const eyes = [[12, 22], [20, 19], [29, 21], [35, 26], [17, 28], [26, 29], [33, 16], [8, 27]];
  eyes.forEach(([x, y], i) => {
    if ((i + f) % 5 === 0) g.rect(x - 1, y, 3, 1, P.ink);
    else { g.rect(x - 1, y - 1, 3, 3, P.white); g.px(x + (f % 2), y, P.ink); }
  });
  g.rect(18, 33, 10, 2, P.ink); for (let x = 19; x < 28; x += 2) g.px(x, 33, P.white);
  g.rect(17, 3, 13, 9, P.metal); g.rect(18, 4, 11, 7, P.cyanD); g.rect(22, 12, 3, 1, P.metal);
  for (let k = 0; k < 3; k++) if (k <= f % 4) g.rect(20 + k * 3, 7, 2, 2, P.white);
}

// Бррр Бррр Патапим: дерево-обезьяна с огромными ступнями
export function sPatapim(g: Grid, f: number): void {
  const stomp = f === 3, sw = stomp ? 0 : [1, 0, -1, 0][f];
  g.line(8, 18, 8 + sw, 23, P.monkey); g.line(13, 18, 13 - sw, stomp ? 19 : 23, P.monkey);
  g.rect(4 + sw, 24, 7, 3, P.tan); g.rect(4 + sw, 24, 7, 1, P.skinL);
  if (stomp) { g.rect(12, 18, 7, 3, P.tan); g.rect(12, 18, 7, 1, P.skinL); } else { g.rect(11 - sw, 24, 7, 3, P.tan); g.rect(11 - sw, 24, 7, 1, P.skinL); }
  g.rect(7, 9, 8, 10, P.wood); g.rect(7, 9, 2, 10, P.woodD); g.px(11, 13, P.woodD); g.px(12, 15, P.woodD);
  g.line(7, 11, 3, 8 + (f % 2), P.woodD); g.line(15, 11, 19, 8 - (f % 2), P.woodD); g.px(3, 7 + (f % 2), P.green); g.px(19, 7 - (f % 2), P.green);
  g.ell(11, 4, 7, 4, P.greenD); g.ell(11, 3, 6, 3, P.green); g.px(7, 2, P.greenL); g.px(14, 1, P.greenL);
  g.ell(12, 7, 3, 2, P.tan); g.px(11, 6, P.ink); g.px(13, 6, P.ink); g.rect(11, 8, 3, 1, P.monkey);
}

// Чимпанзини Бананини
export function sChimp(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(7, 18, 7 + sw, 22, P.monkey); g.line(10, 18, 10 - sw, 22, P.monkey);
  g.ell(9, 13, 5, 6, P.banana); g.rect(5, 17, 8, 2, P.bananaD);
  g.line(4, 9, 1, 12 + (f % 2), P.banana, 2); g.line(14, 9, 17, 12 - (f % 2), P.banana, 2); g.px(1, 13, P.bananaD); g.px(17, 13, P.bananaD);
  g.ell(9, 10, 3, 3, P.monkey); g.ell(10, 11, 2, 1.5, P.tan); g.px(9, 9, P.ink); g.px(11, 9, P.ink); g.px(10, 12, P.ink);
  g.rect(8, 3, 2, 3, P.bananaD); g.px(9, 2, P.monkey);
}

// Лирили Ларила: кактус-слон в сандалиях
export function sLirili(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(8, 19, 8 + sw, 23, P.cactusD, 2); g.line(13, 19, 13 - sw, 23, P.cactusD, 2);
  g.rect(6 + sw, 24, 4, 1, P.brownL); g.rect(12 - sw, 24, 4, 1, P.brownL);
  g.rect(6, 9, 10, 11, P.cactus); g.rect(6, 9, 2, 11, P.cactusD);
  for (let y = 10; y < 19; y += 3) { g.px(9, y, P.white); g.px(13, y + 1, P.white); }
  g.rect(3, 11, 3, 2, P.cactus); g.rect(3, 7 + (f % 2), 2, 5, P.cactus); g.rect(16, 12, 3, 2, P.cactus); g.rect(17, 8 - (f % 2), 2, 5, P.cactus);
  g.ell(12, 5, 5, 4, P.grey); g.ell(8, 5, 2, 3, P.greyD);
  g.line(16, 6, 18, 10, P.grey, 2); g.px(19, 11, P.grey);
  g.px(14, 4, P.ink); g.px(15, 7, P.white);
  g.ell(11, 15, 2, 2, P.white); g.px(11, 14, P.ink); g.px(12, 15, P.ink);
}

export function sCapy(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  for (const [x, b] of [[6, 1], [9, 0], [15, 1], [18, 0]]) g.line(x, 11, x + (b ? -sw : sw), 14, b ? P.capyD : P.capy, 2);
  g.ell(11, 8, 8, 4, P.capy); g.rect(5, 11, 12, 1, P.capyD); g.px(8, 6, P.floppa); g.px(12, 5, P.floppa);
  g.rect(16, 4, 6, 6, P.capy); g.rect(21, 6, 2, 3, P.capyD);
  g.px(18, 5, P.ink); g.px(17, 3, P.capyD); g.px(16, 3, P.capyD); g.px(22, 7, P.ink);
  g.ell(18, 2, 1.6, 1.3, P.orange); g.px(19, 0, P.green);
}

// Шлёпа
export function sFloppa(g: Grid, f: number): void {
  const leap = f === 3, dy = f === 2 ? 2 : 0;
  if (!leap) { g.rect(6, 15, 2, 3, P.floppaD); g.rect(14, 15, 2, 3, P.floppaD); g.rect(9, 15, 2, 3, P.floppa); g.rect(16, 15, 2, 3, P.floppa); }
  else { g.line(4, 12, 1, 15, P.floppaD, 2); g.line(16, 12, 20, 14, P.floppa, 2); }
  g.ell(10, 11 + dy, 7, 4, P.floppa); g.rect(5, 14 + dy, 10, 1, P.floppaD);
  g.line(3, 10 + dy, 1, 6 + dy, P.floppaD);
  g.ell(16, 6 + dy, 4, 3.5, P.floppa); g.ell(17, 8 + dy, 2.5, 1.5, P.white);
  g.line(13, 3 + dy, 12, 0 + dy, P.floppaD, 2); g.px(12, dy, P.ink); g.px(11, dy, P.ink);
  g.line(18, 3 + dy, 19, 0 + dy, P.floppaD, 2); g.px(19, dy, P.ink); g.px(20, dy, P.ink);
  const eye = f === 1 ? P.floppaD : P.ink;
  g.px(15, 5 + dy, eye); g.px(18, 5 + dy, eye); g.px(16, 7 + dy, P.pinkD); g.px(14, 6 + dy, P.floppaD); g.px(19, 6 + dy, P.floppaD);
}

export function sDoge(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  for (const [x, b] of [[6, 1], [8, 0], [14, 1], [16, 0]]) g.line(x, 12, x + (b ? -sw : sw), 15, b ? P.dogeD : P.doge);
  g.ell(11, 10, 7, 3.5, P.doge); g.ell(11, 12, 5, 1.5, P.dogeL);
  g.line(4, 8, 2, 5 + (f % 2), P.doge, 2); g.px(2, 4 + (f % 2), P.dogeL);
  g.ell(16, 6, 4, 3.5, P.doge); g.ell(17, 8, 3, 1.8, P.dogeL);
  g.px(13, 2, P.doge); g.px(13, 1, P.dogeD); g.px(19, 2, P.doge); g.px(19, 1, P.dogeD);
  g.px(15, 5, P.white); g.px(16, 5, P.ink); g.px(17, 5, P.white); g.px(18, 5, P.ink);
  g.px(20, 7, P.ink); g.px(17, 9, P.dogeD);
}

export function sSkibidi(g: Grid, f: number): void {
  const bob = [0, -2, -3, -1][f];
  g.rect(5, 18, 6, 4, P.toiletD); g.rect(4, 21, 8, 1, P.toiletD);
  g.ell(8, 15, 6, 3, P.toilet); g.rect(3, 13, 11, 2, P.toilet);
  g.rect(1, 5, 3, 10, P.toilet); g.rect(1, 5, 3, 1, P.white); g.px(2, 7, P.metalL);
  g.ell(9, 9 + bob, 3.5, 4, P.skin); g.px(8, 6 + bob, P.white);
  g.px(10, 8 + bob, P.ink); g.px(12, 8 + bob, P.ink); g.rect(10, 11 + bob, 3, 1 + (f % 2), P.ink);
  g.rect(4, 13, 9, 1, P.white); g.rect(4, 14, 9, 1, P.toiletD);
}

export function sAmogus(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.rect(3 + sw, 12, 3, 3, P.susD); g.rect(8 - sw, 12, 3, 3, P.sus);
  g.rect(1, 5, 3, 6, P.susD);
  g.ell(7, 7, 4, 5, P.sus); g.rect(3, 7, 8, 5, P.sus); g.rect(3, 7, 2, 5, P.susD);
  g.rect(7, 4, 5, 3, P.visor); g.rect(8, 4, 3, 1, P.white); g.px(11, 6, P.cyanD);
}

export function sTroll(g: Grid, f: number): void {
  g.ell(8, 7, 6, 6, P.troll); g.ell(9, 8, 5, 4, P.white);
  g.line(4, 4, 7, 5, P.ink); g.line(10, 5, 13, 3, P.ink); g.px(6, 6, P.ink); g.px(11, 5, P.ink);
  g.line(3, 9, 13, 8, P.ink); g.line(4, 10, 12, 11 + (f % 2), P.ink); for (let x = 5; x < 12; x += 2) g.px(x, 10, P.white);
  g.px(8, 13, P.greyL); g.px(3, 7, P.greyL); g.px(13, 6, P.greyL);
}

export function sOuro(g: Grid, f: number): void {
  g.ell(11, 9, 9, 6, P.purpleD); g.ell(11, 8, 8, 5, P.purple);
  g.px(8, 5, P.gold); g.px(14, 5, P.gold); g.px(8, 4, P.white); g.px(14, 4, P.white);
  const open = f % 2;
  g.rect(17, 7, 6, 1 + open * 2, P.ink); g.px(18, 7, P.white); g.px(21, 7, P.white); if (open) { g.px(18, 9, P.white); g.px(21, 9, P.white); }
  for (let x = 4; x < 18; x += 3) g.px(x, 11, P.pink);
  g.px(6, 2, P.pink); g.px(10, 1, P.pink); g.px(14, 2, P.pink);
}

// Six Seven: школьник качает ладонями
export function sSixSeven(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f], up = f % 2;
  g.line(7, 17, 7 + sw, 21, P.jeansD, 2); g.line(10, 17, 10 - sw, 21, P.jeans, 2);
  g.rect(6 + sw, 22, 3, 1, P.white); g.rect(9 - sw, 22, 3, 1, P.white);
  g.rect(5, 10, 8, 8, P.green); g.rect(5, 10, 2, 8, P.greenD); sign(g, '67', 6, 12, P.white);
  const l = up ? 4 : 9, r = up ? 9 : 4;
  g.line(5, 11, 2, l + 2, P.greenD); g.rect(1, l, 3, 2, P.skin);
  g.line(12, 11, 15, r + 2, P.green); g.rect(14, r, 3, 2, P.skin);
  g.ell(9, 6, 3.5, 4, P.skin); g.rect(5, 2, 8, 2, P.hair); g.px(5, 4, P.hair);
  g.px(10, 5, P.ink); g.px(12, 5, P.ink); g.rect(10, 8, 2, 1 + up, P.ink);
}

// OIIA-кот: крутится на 360°, кадр = угол поворота
export function sOiia(g: Grid, f: number): void {
  const a = f / 8 * TAU, fc = Math.cos(a), sd = Math.sin(a);
  if (fc < .5) { const tx = 8 - sd * 5; g.line(8, 16, tx, 11, P.greyD, 2); g.px(tx, 10, P.greyD); }
  const bw = 4 + Math.abs(fc) * 1.5;
  g.ell(8, 15, bw, 4, P.grey); if (fc > 0) g.ell(8 + sd * 1.5, 16, bw * .6, 2.5, P.oiiaW);
  if (fc > -.3) { g.rect(R(6 + sd * 2), 18, 2, 1, P.oiiaW); g.rect(R(9 + sd * 2), 18, 2, 1, P.oiiaW); }
  const hx = 8 + sd * 1.5, ew = 3.5 * Math.max(.35, Math.abs(fc));
  g.ell(hx, 7, 5, 4.5, P.grey);
  g.line(hx - ew, 4, hx - ew - .5, 1, P.grey, 2); g.line(hx + ew, 4, hx + ew + .5, 1, P.grey, 2);
  if (fc > 0) { g.px(hx - ew, 2, P.pinkD); g.px(hx + ew, 2, P.pinkD); }
  if (fc > -.2) {
    g.ell(hx + sd * 2, 8, 3.5 * Math.max(.4, fc), 3, P.oiiaW);
    const es = 2.2 * Math.max(.3, fc), ex = hx + sd * 2.5;
    for (const k of [-1, 1]) { if (fc < .3 && k === -Math.sign(sd)) continue; g.rect(R(ex + k * es - 1), 5, 2, 2, P.white); g.px(R(ex + k * es), 6, P.ink); }
    const mx = hx + sd * 3;
    if (f % 2 === 0) { g.ell(mx, 9.5, 1.6, 1.8, P.ink); g.px(mx, 10, P.pinkD); }
    else { g.rect(R(mx - 2), 9, 4, 2, P.ink); g.px(R(mx - 1), 9, P.white); }
  } else g.ell(hx, 7, 3, 2.5, P.greyD);
}

// Сигма-бой: челюсть больше головы
export function sSigma(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(6, 19, 6 + sw, 23, P.hairBlk, 2); g.line(10, 19, 10 - sw, 23, P.hairBlk, 2);
  g.rect(5 + sw, 24, 3, 1, P.white); g.rect(9 - sw, 24, 3, 1, P.white);
  g.rect(4, 11, 9, 9, P.turtle); g.rect(4, 11, 2, 9, P.hairBlk); g.rect(4, 14, 9, 2, P.turtleL); g.px(5, 14, P.skin); g.px(12, 15, P.skin);
  g.rect(6, 9, 5, 2, P.turtle);
  g.rect(5, 2, 7, 5, P.skin); g.rect(3, 5, 11, 4, P.skin); g.rect(3, 8, 11, 1, P.skinD); g.px(9, 8, P.skinD); g.rect(3, 5, 1, 3, P.skinD);
  g.rect(5, 0, 7, 3, P.hairBlk); g.line(7, 3, 12, 4, P.hairBlk); g.px(12, 4, P.hairBlk);
  g.px(9, 5, P.ink); g.px(11, 5, P.ink); g.rect(10, 4, 2, 1, P.hairBlk);
  g.rect(10, 7, 3, 1, P.skinD);
  if (f === 0) g.px(13, 6, P.white);
}

// квадробер: человек в маске на четвереньках
export function sQuadro(g: Grid, f: number, v: number): void {
  const sw = [2, 0, -2, 0][f], bob = f % 2;
  const hood = ['#6b5bd6', '#3d8f6b', '#c24f7a'][v], hoodD = ['#4a3da0', '#2a6a4d', '#8e345a'][v];
  g.line(5, 9 + bob, 3 - sw, 13, P.jeansD, 2); g.rect(2 - sw, 13, 3, 1, P.white);
  g.line(8, 9 + bob, 7 + sw, 13, P.jeans, 2); g.rect(6 + sw, 13, 3, 1, P.white);
  g.line(3, 7 + bob, 0, 4 + bob + (f % 2), [P.white, P.brown, P.orange][v]);
  g.rect(4, 6 + bob, 11, 4, hood); g.rect(4, 9 + bob, 11, 1, hoodD);
  g.line(13, 9 + bob, 14 + sw, 13, hoodD, 2); g.rect(13 + sw, 13, 3, 1, P.skin);
  g.line(15, 9 + bob, 16 - sw, 13, hood, 2); g.rect(15 - sw, 13, 3, 1, P.skin);
  g.ell(17, 5 + bob, 3.5, 3.5, P.hair);
  const mc = [P.white, P.brownL, P.orange][v], mcD = [P.greyL, P.brown, P.vestD][v];
  g.ell(18, 5 + bob, 3, 3, mc); g.rect(19, 6 + bob, 3, 2, mc);
  if (v === 1) g.rect(15, 3 + bob, 2, 4, mcD);
  else { g.line(16, 3 + bob, 15, bob, mc, 2); g.line(19, 2 + bob, 20, bob, mc, 2); g.px(15, 1 + bob, P.pink); }
  g.px(18, 4 + bob, P.ink); g.px(20, 4 + bob, P.ink); g.px(21, 7 + bob, P.ink); g.px(18, 5 + bob, P.cyan);
}

// скуф: Геннадий через 10 лет (жилет тот же)
export function sSkuf(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f], b = f % 2;
  g.rect(7 + sw, 21, 3, 6, P.trackD); g.rect(12 - sw, 21, 3, 6, P.track); g.rect(9 + sw, 21, 1, 6, P.white); g.rect(14 - sw, 21, 1, 6, P.white);
  g.rect(6 + sw, 27, 4, 1, P.white); g.rect(12 - sw, 27, 4, 1, P.white); g.rect(5 + sw, 28, 5, 1, P.metal); g.rect(11 - sw, 28, 5, 1, P.metal);
  g.line(6, 12, 5, 19, P.skinD, 2);
  g.ell(12, 16 + b, 8, 6, P.tank); g.ell(15, 17 + b, 5, 4, P.tank);
  g.ell(14, 14 + b, 1.5, 1, P.stain); g.px(10, 17 + b, P.stain);
  g.rect(7, 20 + b, 12, 2, P.skin); g.px(14, 20 + b, P.skinD); g.px(12, 21 + b, P.hair); g.px(16, 21 + b, P.hair);
  g.rect(5, 11, 3, 10, P.vest); g.rect(6, 11, 1, 10, P.stripe); g.rect(17, 11, 2, 6, P.vest); g.px(17, 13, P.stripe);
  g.line(17, 12, 20, 15, P.skin, 2); g.rect(20, 9, 2, 6, P.bottle); g.px(20, 8, P.bottle); g.px(20, 7, P.gold); g.px(21, 11, P.paper);
  g.ell(11, 6, 4.5, 4.5, P.skin); g.px(10, 3, P.white); g.px(11, 3, P.skinL);
  g.line(8, 4, 13, 3, P.hair); g.line(8, 5, 13, 4, P.hair); g.rect(6, 5, 2, 3, P.hair);
  g.px(13, 6, P.ink); g.px(13, 7, P.skinD); g.rect(12, 8, 4, 1, P.hair); g.rect(8, 10, 7, 1, P.skinD); g.px(15, 7, P.red);
  g.px(10, 11, P.gold); g.px(12, 12, P.gold); g.px(14, 11, P.gold);
}

// лабубу: улыбка шире головы
export function sLabubu(g: Grid, f: number): void {
  const dy = f === 1 ? 1 : f === 2 ? -1 : 0, ly = f === 2 ? -1 : 0;
  g.rect(4, 13 + ly, 2, 2, P.labD); g.rect(8, 13 + ly, 2, 2, P.labD);
  g.ell(7, 10 + dy, 4.5, 4, P.lab); g.px(3, 11 + dy, P.labF); g.px(11, 9 + dy, P.labF);
  g.rect(3, dy, 2, 5, P.lab); g.rect(9, dy, 2, 5, P.lab); g.px(4, 1 + dy, P.labP); g.px(9, 1 + dy, P.labP);
  g.ell(7, 6 + dy, 5, 4, P.lab); g.ell(7, 7 + dy, 3.5, 2.5, P.labF);
  g.rect(4, 5 + dy, 2, 2, P.ink); g.rect(8, 5 + dy, 2, 2, P.ink); g.px(4, 5 + dy, P.white); g.px(8, 5 + dy, P.white);
  const open = f === 3;
  g.rect(2, 8 + dy, 10, open ? 3 : 1, P.ink);
  for (let x = 2; x < 12; x += 2) { g.px(x, 8 + dy, P.white); if (open) g.px(x + 1, 10 + dy, P.white); }
}

export function sApostle(g: Grid, f: number): void {
  g.ring(6, 2, 4, 1, f % 2 ? P.white : P.gold);
  for (let i = 5; i >= 0; i--) { const a = -1.3 + i * .6; g.ell(6 + Math.cos(a) * 3.2, 8 + Math.sin(a) * 3, 2.2 - i * .2, 2.2 - i * .2, i % 2 ? P.shrimp : '#ffa27a'); }
  g.px(7, 5, P.ink); g.line(8, 5, 10, 3, P.shrimp); g.px(5, 7, P.white);
}

// ---------- архетипы из бестиария Alien Shooter ----------
/** Стример ради хайпа: бежит с селфи-палкой и кольцевой лампой. Кадр 4 — мигает перед взрывом. */
export function sStreamer(g: Grid, f: number): void {
  const fuse = f === 4, sw = fuse ? 0 : [2, 0, -2, 0][f];
  g.line(7, 17, 7 + sw, 21, P.jeansD, 2); g.line(10, 17, 10 - sw, 21, P.jeans, 2);
  g.rect(6 + sw, 22, 3, 1, P.white); g.rect(9 - sw, 22, 3, 1, P.white);
  g.rect(5, 10, 8, 8, fuse ? P.red : P.vest); g.rect(5, 10, 8, 1, P.vestD); sign(g, 'ON', 6, 12, P.white);
  // селфи-палка с телефоном и кольцевая лампа
  g.line(12, 12, 16, 3 + (f % 2), P.metal); g.rect(15, 1 + (f % 2), 3, 4, P.ink); g.px(16, 2 + (f % 2), P.cyan);
  g.ring(3, 5, 2.5, 2.5, fuse && f % 2 === 0 ? P.red : P.white);
  g.line(5, 11, 3, 8, P.skin);
  g.ell(9, 6, 3.5, 4, P.skin); g.rect(5, 2, 8, 2, P.pink); g.px(12, 2, P.pinkL);
  g.px(10, 5, P.ink); g.px(12, 5, P.ink); g.rect(9, 8, 4, 1, P.ink); g.px(9, 9, P.white);
}

/** Джоконда с шестью пальцами: портрет в раме на ножках. Кадр 2 — глаза горят (прицел). */
export function sMona(g: Grid, f: number): void {
  const aim = f === 2, sw = aim ? 0 : f % 2;
  g.line(6, 21, 5 - sw, 25, P.woodD, 1); g.line(12, 21, 13 + sw, 25, P.woodD, 1);
  g.rect(1, 1, 17, 21, P.goldD); g.rect(2, 2, 15, 19, P.gold); g.rect(3, 3, 13, 17, '#4a5a3a');
  g.rect(3, 13, 13, 7, '#6b5a2a'); g.ell(9, 8, 3.5, 4.5, '#3a2a1a');
  g.ell(9, 8, 2.5, 3.5, P.pale); g.rect(5, 13, 9, 7, '#2a2418'); g.ell(9, 13, 2, 1, P.pale);
  g.px(8, 7, aim ? P.red : P.ink); g.px(10, 7, aim ? P.red : P.ink); g.line(8, 10, 10, 10, P.skinD);
  // шесть пальцев на сложенных руках
  for (let i = 0; i < 6; i++) g.px(6 + i, 17, P.pale);
  g.rect(6, 18, 6, 1, P.skinD);
}

/** Принтер нейрослопа: печатает руки. Кадры 0–3 — лист выползает и уезжает. */
export function sPrinter(g: Grid, f: number): void {
  g.rect(1, 9, 20, 9, P.greyL); g.rect(1, 9, 20, 2, P.white); g.rect(1, 16, 20, 2, P.grey);
  g.rect(3, 12, 16, 2, P.ink); g.px(17, 10, f % 2 ? P.led : P.green); g.px(15, 10, P.red);
  g.rect(4, 5, 14, 4, P.grey); g.rect(5, 3, 12, 2, P.paper);
  // лист с рукой выползает из щели
  const out = [0, 2, 4, 2][f];
  g.rect(6, 13 + out, 10, 3, P.paper);
  for (let i = 0; i < 5; i++) g.px(8 + i * 1.5, 14 + out + (i % 2), P.skin);
  g.rect(2, 18, 3, 2, P.metal); g.rect(17, 18, 3, 2, P.metal);
}

/** Нейро-шаурма: лаваш на ножках, из неё лезет капуста и вонь. */
export function sShawa(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(6, 16, 6 + sw, 19, P.tan, 1); g.line(10, 16, 10 - sw, 19, P.tan, 1);
  g.ell(8, 10, 5, 7, P.pale); g.ell(8, 10, 4, 6, '#e8c890');
  g.rect(4, 4, 9, 3, P.green); g.px(5, 3, P.greenL); g.px(9, 2, P.green); g.px(11, 3, P.greenL); g.px(7, 5, P.red); g.px(10, 5, P.red);
  for (let i = 0; i < 3; i++) g.line(5 + i * 2, 8 + i * 2, 11 - i, 9 + i * 2, '#c9a060');
  g.px(6, 11, P.ink); g.px(10, 11, P.ink); g.rect(7, 14, 3, 1, P.ink);
  // вонь
  for (let i = 0; i < 3; i++) g.px(2 + i * 5 + (f % 2), 1 - (i % 2) + (f % 2), P.greenL);
}

/** Бабушка-смотрительница музея: платок, очки, «ТИШЕ!». */
export function sGuard(g: Grid, f: number): void {
  const sw = [1, 0, -1, 0][f];
  g.line(6, 17, 6 + sw, 20, P.ink, 1); g.line(10, 17, 10 - sw, 20, P.ink, 1);
  g.ell(8, 13, 5, 5, P.purple); g.rect(4, 12, 9, 1, P.purpleD); g.rect(7, 9, 2, 8, P.purpleD);
  g.ell(8, 6, 3.5, 3.5, P.skinL); g.ell(8, 4, 4.5, 3, P.red); g.px(4, 7, P.red); g.px(12, 7, P.red);
  g.rect(5, 6, 3, 1, P.ink); g.rect(9, 6, 3, 1, P.ink); g.px(8, 8, P.skinD);
  g.line(13, 11, 15, 8 - (f % 2), P.skinL); g.px(15, 7 - (f % 2), P.skin);
}
/** Пчела: злая на всех. */
export function sBee(g: Grid, f: number): void {
  g.ell(4, 4, 3, 2, P.gold); g.px(3, 3, P.ink); g.px(3, 4, P.ink); g.px(5, 3, P.ink); g.px(5, 5, P.ink); g.px(7, 4, P.ink);
  g.px(3, 1 + f, P.white); g.px(5, 1 + f, P.white);
}
