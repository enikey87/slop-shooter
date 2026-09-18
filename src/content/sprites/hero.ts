// Геннадий и дядя Вася.
import { Grid } from '../../engine/gfx/pixel';
import { P } from '../palette';

// ---------- hero ----------
export function sHero(g: Grid, f: number, mode: string): void {
  const walk = mode === 'walk';
  const y0 = walk ? (f % 2 ? -1 : 0) : f;
  const sw = walk ? [2, 0, -2, 0][f] : 0;
  g.line(10, 16, 10 - sw, 20, P.jeansD, 2); g.rect(9 - sw, 21, 3, 2, P.boot);
  g.line(7, 16, 7 + sw, 20, P.jeans, 2); g.rect(6 + sw, 21, 4, 2, P.boot);
  g.rect(4, 9 + y0, 10, 8, P.vest); g.rect(4, 9 + y0, 2, 8, P.vestD);
  g.rect(9, 9 + y0, 2, 8, P.stripe); g.rect(4, 13 + y0, 10, 1, P.stripe); g.rect(4, 16 + y0, 10, 1, P.boot);
  g.rect(3, 10 + y0, 2, 5, P.vestD); g.rect(3, 15 + y0, 2, 1, P.skinD);
  g.ell(9, 5 + y0, 4, 4, P.skin);
  g.rect(5, 4 + y0, 2, 4, P.hair); g.px(7, 8 + y0, P.hair);
  g.px(8, 2 + y0, P.white); g.px(9, 2 + y0, P.skinL); g.px(8, 3 + y0, P.skinL);
  g.px(11, 5 + y0, P.ink); g.rect(11, 7 + y0, 3, 1, P.hair); g.px(13, 6 + y0, P.skinD);
}

export function sVasya(g: Grid, f: number): void {
  const y0 = f;
  g.rect(6, 16, 2, 5, P.trackD); g.rect(10, 16, 2, 5, P.track); g.rect(5, 21, 4, 2, P.white); g.rect(10, 21, 4, 2, P.white);
  g.rect(4, 9 + y0, 10, 8, P.track); g.rect(4, 9 + y0, 2, 8, P.trackD); g.rect(7, 9 + y0, 1, 8, P.white); g.rect(12, 9 + y0, 1, 8, P.white);
  g.ell(9, 5 + y0, 4, 4, P.skin); g.rect(5, 1 + y0, 9, 2, P.metal); g.rect(12, 2 + y0, 3, 1, P.metal);
  g.px(11, 5 + y0, P.ink); g.rect(10, 7 + y0, 4, 1, P.hair); g.px(13, 6 + y0, P.skinD);
}
