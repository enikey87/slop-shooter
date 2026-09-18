// Пушки в руках Геннадия: вид сверху, поворачиваются вслед за прицелом.
import { Grid } from '../../engine/gfx/pixel';
import { P } from '../palette';
import { GUN_SPECS } from '../weapons';

export interface GunSprite { img: HTMLCanvasElement; w: number; h: number; m: number }

// ---------- guns ----------
export function buildGun(id: number): GunSprite {
  const [w, h] = GUN_SPECS[id], g = new Grid(w, h), m = (h / 2) | 0;
  switch (id) {
    case 0: g.rect(3, m - 1, 7, 2, P.metal); g.px(9, m - 1, P.metalL); g.rect(4, m + 1, 2, 2, P.metal); g.rect(1, m - 1, 3, 3, P.skin); break;
    case 1:
      g.rect(1, m - 1, 4, 3, P.brown); g.rect(0, m, 2, 1, P.metal); g.rect(5, m - 2, 4, 5, P.metal);
      g.rect(9, m - 3, 6, 1, P.metalL); g.rect(9, m - 1, 6, 1, P.metal); g.rect(9, m + 1, 6, 1, P.metalL); g.rect(9, m + 3, 5, 1, P.metal);
      g.rect(5, m + 2, 2, 2, P.skin); g.rect(2, m + 1, 2, 2, P.skin); break;
    case 2:
      g.rect(3, m - 2, 6, 5, P.metal); g.px(4, m - 2, P.metalL);
      for (let k = -2; k <= 2; k++) g.rect(9, m + k, 7, 1, k % 2 ? P.metal : P.metalL);
      g.px(5, m + 3, P.gold); g.px(6, m + 4, P.gold); g.px(7, m + 3, P.gold); g.rect(1, m - 1, 2, 3, P.skin); break;
    case 3:
      g.rect(2, m - 2, 14, 4, P.cyan); g.rect(2, m - 2, 14, 1, P.white); g.rect(7, m - 2, 2, 4, P.pink); g.rect(15, m - 2, 1, 4, P.cyanD);
      g.rect(4, m + 2, 2, 2, P.skin); g.rect(10, m + 2, 2, 2, P.skin); break;
    case 4:
      g.rect(3, m - 2, 9, 4, P.greyL); g.rect(3, m - 2, 9, 1, P.white); g.rect(12, m - 1, 3, 2, P.cyan); g.px(14, m - 1, P.white);
      g.rect(5, m - 1, 2, 2, P.cyanD); g.rect(7, m + 2, 2, 1, P.metal); g.rect(1, m, 2, 2, P.skin); break;
    case 5:
      g.rect(3, m - 2, 11, 4, P.green); g.rect(3, m - 2, 11, 1, P.greenL); g.rect(6, m - 1, 3, 3, P.white); g.px(7, m, P.green); g.px(8, m - 1, P.green);
      g.rect(14, m - 2, 1, 4, P.greenD); g.rect(1, m, 2, 2, P.skin); break;
    case 6:
      g.rect(2, m - 2, 9, 2, P.red); g.rect(2, m, 10, 2, P.metal); g.px(11, m - 1, P.metalL); g.rect(1, m - 2, 2, 2, P.skin); break;
    case 7:
      g.rect(2, m - 3, 5, 6, P.red); g.rect(2, m - 3, 5, 1, '#ff8a80'); g.rect(7, m - 1, 8, 2, P.metal); g.rect(15, m - 1, 1, 2, P.metalL);
      g.px(16, m - 1, P.vest); g.rect(8, m + 1, 2, 2, P.skin); break;
    case 8:
      g.rect(2, m - 3, 8, 7, P.brown); g.rect(2, m - 3, 8, 1, P.brownL); g.rect(9, m - 3, 1, 7, P.paper);
      g.rect(4, m - 1, 4, 1, P.gold); g.rect(4, m + 1, 3, 1, P.gold); g.rect(1, m, 2, 2, P.skin); break;
    case 9:
      g.rect(2, m - 2, 6, 4, P.purpleD); g.rect(2, m - 2, 6, 1, P.purple); g.rect(8, m - 1, 11, 2, P.metal);
      for (let x = 9; x < 18; x += 3) { g.px(x, m - 2, P.cyan); g.px(x, m + 1, P.cyan); }
      g.rect(1, m, 2, 2, P.skin); break;
    case 10:
      g.rect(3, m - 3, 10, 6, P.pink); g.rect(3, m - 3, 10, 1, P.pinkL);
      for (const [x, y] of [[7, -1], [8, -2], [9, -1], [9, 0], [8, 1], [7, 0], [10, -2]]) g.px(x, m + y, P.white);
      g.rect(1, m, 2, 2, P.skin); break;
    case 11:
      g.rect(3, m - 1, 7, 3, P.cyanD); g.rect(3, m - 1, 7, 1, P.cyan);
      g.rect(10, m - 2, 3, 1, P.cyan); g.rect(10, m + 1, 3, 1, P.cyan); g.px(10, m - 1, P.cyan); g.px(12, m, P.white); g.px(13, m, P.cyan);
      g.rect(1, m, 2, 2, P.skin); break;
    case 12:
      g.rect(2, m - 2, 11, 5, P.greyD); g.rect(2, m - 2, 11, 1, P.grey);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) g.px(3 + x * 2 + (y % 2), m - 1 + y, P.greyL);
      g.rect(1, m + 1, 2, 2, P.skin); break;
    case 13:
      g.rect(2, m - 3, 6, 6, P.purpleD); g.rect(2, m - 3, 6, 1, P.purple); g.px(4, m - 1, P.led);
      g.rect(8, m - 1, 6, 2, P.metal); g.rect(14, m - 3, 2, 7, P.metalL); g.rect(1, m + 2, 2, 2, P.skin); break;
    case 14:
      g.rect(2, m - 3, 10, 6, P.white); g.rect(2, m - 3, 10, 1, P.greyL);
      g.ell(6, m, 2, 2, P.brownL); g.px(5, m - 1, P.coffee); g.px(7, m + 1, P.coffee); g.rect(9, m - 1, 2, 2, P.green);
      g.rect(1, m, 2, 2, P.skin); break;
    case 15:
      g.rect(3, m - 1, 9, 3, P.pink); g.rect(3, m + 1, 9, 1, P.pinkD); g.rect(5, m - 2, 4, 1, P.cyan); g.px(11, m - 1, P.pinkL);
      g.rect(1, m - 1, 2, 2, P.skin); break;
    case 16:
      g.rect(2, m - 1, 8, 3, P.metal); g.rect(10, m, 11, 1, P.metalL); g.rect(5, m - 3, 5, 2, P.ink); g.px(9, m - 3, P.cyan);
      g.px(20, m - 1, P.green); g.rect(1, m + 1, 2, 2, P.skin); break;
    case 17:
      g.ell(5, m, 4, 3, P.red); g.ell(4, m, 2, 1, P.redD); g.rect(9, m - 1, 8, 2, P.woodL); g.rect(17, m - 2, 1, 4, P.wood);
      for (let x = 10; x < 17; x += 2) g.px(x, m - 1, P.greyL);
      g.rect(3, m + 2, 2, 2, P.skin); break;
    case 18:
      g.rect(3, m - 3, 9, 6, P.floppa); g.rect(4, m - 2, 7, 4, P.pinkL); g.px(6, m - 1, P.pinkD); g.px(8, m + 1, P.pinkD);
      g.rect(12, m - 2, 3, 4, P.grey); g.px(13, m - 1, P.ink); g.px(0, m - 2, P.red); g.px(0, m - 1, P.gold); g.px(0, m, P.green); g.px(0, m + 1, P.cyan);
      g.rect(1, m + 2, 2, 1, P.skin); break;
  }
  g.outline(P.ink);
  return { img: g.toCanvas(), w, h, m };
}
