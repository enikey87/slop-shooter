// Кадр целиком: мир в низком разрешении → растянуть с тряской → подписи → оверлеи → HUD.
import { P } from '../content/palette';
import { R } from '../engine/math';
import { vrnd } from '../engine/rng';
import { PIX_FONT } from '../platform';
import { G } from '../game/world';
import { ctx, low, view } from './canvas';
import { drawWorld, labels } from './world';
import { drawHUD } from './hud';

function drawOverlays(): void {
  const p = G.p, { W, H, S } = view, playing = G.state === 'play';
  const fill = (c: string): void => { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); };
  if (p.hp < 40 && playing) {
    // «засвет» реальности: оранжевый туман и блики
    const k = (40 - p.hp) / 40;
    fill(`rgba(255,170,60,${.14 * k})`);
    for (let i = 0; i < 8; i++) {
      const x = (Math.sin(i * 12.9 + G.t * .2) * .5 + .5) * W, y = (Math.cos(i * 7.3 + G.t * .15) * .5 + .5) * H, r = (6 + i * 2) * S;
      ctx.fillStyle = `rgba(255,230,180,${.1 * k})`;
      ctx.fillRect(R(x - r), R(y - r / 2), r * 2, r); ctx.fillRect(R(x - r / 2), R(y - r), r, r * 2);
    }
  }
  if (p.sugar > 0 && playing) fill(`rgba(156,201,90,${.07 + .04 * Math.sin(G.t * 10)})`);
  if (p.invert > 0) fill(`rgba(155,140,255,${.08 + .05 * Math.sin(G.t * 8)})`);
  if (G.flash > 0) fill(`rgba(255,79,123,${G.flash * .7})`);
  if (G.blackout > 0) fill(G.blackout > .55 ? `rgba(255,248,236,${(G.blackout - .55) * 5})` : `rgba(0,0,0,${G.blackout * .9})`);
}

export function draw(): void {
  const p = G.p, c = G.cam, { W, H, S, DPR, VW, VH } = view, playing = G.state === 'play';
  drawWorld();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  let sx = R(vrnd(G.shake)) * S, sy = R(vrnd(G.shake)) * S;
  if (p.hp < 20 && playing) { sx += R(Math.sin(G.t * 2.3) * 2) * S; sy += R(Math.cos(G.t * 1.7) * 1.5) * S; }
  ctx.fillStyle = P.ink; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(low, sx, sy, VW * S, VH * S);
  if (p.hp < 25 && playing) {
    // двоение в глазах
    ctx.globalAlpha = .18; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(low, sx + S, sy, VW * S, VH * S);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  const toScreen = (x: number, y: number): [number, number] => [(x - c.x) * S + sx, (y - c.y) * S + sy];
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const l of labels) {
    const [x, y] = toScreen(l.x, l.y);
    ctx.font = `${l.big ? 10 : 8}px ${PIX_FONT}`;
    if (l.big) { const w = ctx.measureText(l.txt).width; ctx.fillStyle = 'rgba(26,20,35,.85)'; ctx.fillRect(x - w / 2 - 6, y - 10, w + 12, 20); }
    ctx.fillStyle = P.ink; ctx.fillText(l.txt, x + 1, y + 1); ctx.fillStyle = l.color; ctx.fillText(l.txt, x, y);
  }
  for (const t of G.texts) {
    const [x, y] = toScreen(t.x, t.y);
    ctx.globalAlpha = Math.min(1, t.t / t.max * 2);
    ctx.font = `${t.big ? (S >= 4 ? 16 : 12) : 8}px ${PIX_FONT}`;
    ctx.fillStyle = P.ink; ctx.fillText(t.txt, x + 2, y + 2);
    ctx.fillStyle = t.color; ctx.fillText(t.txt, x, y);
  }
  ctx.globalAlpha = 1;
  drawOverlays();
  if (G.state !== 'attract') drawHUD();
}
