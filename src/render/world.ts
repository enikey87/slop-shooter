// Мир в низком разрешении: пол, зоны, укрытия, враги, игрок, снаряды, частицы. Сортировка по Y.
import { P } from '../content/palette';
import { enemyDef } from '../content/enemies';
import { AFFIX } from '../content/affixes';
import { PROPDEF } from '../content/props';
import { tint, damaged, shadow, type Sheet } from '../engine/gfx/sheet';
import { TAU, R } from '../engine/math';
import { vrnd, vpick } from '../engine/rng';
import { isTouch } from '../platform';
import { G } from '../game/world';
import { bodyY, scaleOf, isBoss } from '../game/body';
import { gunPivot } from '../game/weapons';
import { activeGunId, gunLevel, weaponNear } from '../game/inventory';
import { WEAPONS } from '../content/weapons';
import { TIERS } from '../content/tiers';
import type { Ally, Enemy, Pickup, Player, Prop } from '../game/state';
import { SPR, GUNS } from './sprites';
import { sprOf, enemyFrame } from './enemySprites';
import { lx, view } from './canvas';
import { floorCanvas } from './floor';

/** Подписи в мировых координатах: рисуются потом, в полном разрешении (иначе шрифт нечитаем). */
export interface Label { x: number; y: number; txt: string; color: string; big?: boolean }
export const labels: Label[] = [];

interface BlitOpts { scale?: number; color?: string | null; dmg?: number; alpha?: number | null; outline?: string | null }
export function blit(spr: Sheet, frame: number, x: number, y: number, face: number, o: BlitOpts = {}): void {
  const sc = o.scale ?? 1;
  const img = o.color ? tint(spr, frame, o.color) : o.dmg ? damaged(spr, frame, o.dmg) : spr.frames[frame];
  lx.save();
  lx.translate(R(x), R(y));
  if (face < 0) lx.scale(-1, 1);
  if (o.alpha != null) lx.globalAlpha = o.alpha;
  if (o.outline) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) lx.drawImage(tint(spr, frame, o.outline), -spr.ax * sc + ox, -spr.ay * sc + oy, spr.w * sc, spr.h * sc);
  lx.drawImage(img, -spr.ax * sc, -spr.ay * sc, spr.w * sc, spr.h * sc);
  lx.restore();
}
function drawShadow(x: number, y: number, rx: number, a = .35): void { const s = shadow(rx); lx.globalAlpha = a; lx.drawImage(s, R(x - s.width / 2), R(y - s.height / 2)); lx.globalAlpha = 1; }
function pixLine(x0: number, y0: number, x1: number, y1: number, col: string, w = 1): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  lx.fillStyle = col;
  for (let i = 0; i <= n; i++) lx.fillRect(R(x0 + (x1 - x0) * i / n - (w - 1) / 2), R(y0 + (y1 - y0) * i / n - (w - 1) / 2), w, w);
}
/** Картинка, повёрнутая на угол (с шагом 45°, если snap). */
function rotated(img: CanvasImageSource, x: number, y: number, a: number, ox: number, oy: number, snap = false): void {
  lx.save(); lx.translate(R(x), R(y)); lx.rotate(snap ? R(a / (Math.PI / 4)) * (Math.PI / 4) : a); lx.drawImage(img, ox, oy); lx.restore();
}
/** Кружок из точек (радиусы, кольца, прицелы бомб). */
function dotRing(x: number, y: number, rx: number, ry: number, n: number, color: string, phase = 0): void {
  lx.fillStyle = color;
  for (let i = 0; i < n; i++) { const a = phase + i / n * TAU; lx.fillRect(R(x + Math.cos(a) * rx), R(y + Math.sin(a) * ry), 1, 1); }
}
const blink = (hz: number): boolean => ((G.t * hz) | 0) % 2 === 1;

// ---------- игрок ----------
function drawGun(p: Player): void {
  const id = activeGunId(), gun = GUNS[WEAPONS[id].sprite], gp = gunPivot(p);
  lx.save();
  lx.translate(R(gp.x), R(gp.y)); lx.rotate(p.ang);
  if (p.face < 0) lx.scale(1, -1);
  lx.drawImage(gun.img, -2 - p.recoil, -gun.m);
  const lvl = gunLevel(id);
  if (lvl >= 3 && blink(lvl >= 5 ? 10 : 6)) { lx.fillStyle = P.white; lx.fillRect(gun.w - 4, -gun.m, 1, 1); }
  lx.restore();
}
const CLING_SPOTS = [[-7, -4], [6, -2], [-3, -13], [8, -11], [0, 3]];
function drawPlayer(p: Player): void {
  for (const tr of p.trail) blit(SPR.heroWalk, tr.f, tr.x, tr.y, tr.face, { color: '#ffffff', alpha: tr.t * 2.5 });
  drawShadow(p.x, p.y, 6);
  if (G.mods.aura) dotRing(p.x, p.y, 26, 15, 10, P.pink, G.t * 2);
  if (p.inv > 0 && blink(30)) return;
  const spr = p.moving ? SPR.heroWalk : SPR.heroIdle, f = (p.anim | 0) % spr.n;
  const behind = Math.sin(p.ang) < -.35;
  if (behind) drawGun(p);
  blit(spr, f, p.x, p.y, p.face, { color: p.hit > 0 ? '#ffffff' : null });
  for (let i = 0; i < p.cling; i++) blit(SPR.labubu, ((G.t * 6 + i) | 0) % 2 ? 3 : 0, p.x + CLING_SPOTS[i][0] * p.face, p.y + CLING_SPOTS[i][1] + (((G.t * 8 + i) | 0) % 2), -p.face);
  // чем меньше реальности, тем больше пальцев
  const extra = p.hp > 60 ? 0 : p.hp > 30 ? 1 : 3;
  lx.fillStyle = P.skin;
  for (let i = 0; i < extra; i++) lx.fillRect(R(p.x - p.face * (6 + i)), R(p.y - 7 + ((G.t * 6 + i) | 0) % 2), 1, 2);
  if (!behind) drawGun(p);
}

// ---------- враги ----------
function drawEnemy(e: Enemy): void {
  if (e.disguised) {
    const lift = R(Math.sin(e.t * 4) * 1.5) - 2;
    drawShadow(e.x, e.y, 5); blit(SPR.ammo, 0, e.x, e.y + lift, 1);
    if (((e.t * 2) | 0) % 7 === 0) { lx.fillStyle = P.red; lx.fillRect(R(e.x + 4), R(e.y - 8 + lift), 1, 1); }
    return;
  }
  const spr = sprOf(e), sc = scaleOf(e), f = enemyFrame(e);
  let y = e.y - e.z - (e.grounded ? 10 * sc : 0);
  if (e.alt) y = e.y - e.alt - Math.sin(e.t * 3) * 2;
  if (!e.alt) drawShadow(e.x, e.y, R(e.r * 1.1) + 1);
  for (const tr of e.trail) blit(spr, tr.f, tr.x, tr.y, tr.face, { color: P.vest, alpha: tr.t * 2.5, scale: sc });
  if (e.type === 'jesus' || e.type === 'jboss') blit(SPR.halo, ((e.t * 3) | 0) % 2, e.x + e.face * sc, y - 31 * sc, 1, { scale: sc });
  const boss = isBoss(e) && !e.decoy, bph = boss ? e.phase : e.type === 'oseg' && e.head ? e.head.phase : 0;
  const outline = e.charm > 0 ? P.purple : e.elite && e.aff ? AFFIX[e.aff].color : boss || e.type === 'oseg' ? [P.gold, P.vest, P.red][bph] : e.decoy ? P.purple : null;
  const alpha = e.type === 'troll' ? e.vis : e.decoy ? .45 + .25 * Math.sin(e.t * 9) : null;
  const jx = e.trans && e.trans > 0 ? R(vrnd(2)) : 0;
  const flashColor = e.flash > 0 ? (e.trans && e.trans > 0 ? P.red : '#ffffff') : e.stun > 0 && blink(8) ? P.cyan : null;
  const tierCol = TIERS[e.tier]?.color;
  blit(spr, f, e.x + jx, y, e.type === 'sixseven' || e.skin === 'sixseven' ? 1 : e.face, { color: flashColor, outline: outline ?? (e.tier === 3 ? tierCol : null), scale: sc, alpha, dmg: bph || (e.broken && e.type === 'golem' ? 1 : 0) });
  // ступень: подсветка спрайта цветом (как цвета монстров в Alien Shooter)
  if (tierCol && !flashColor) blit(spr, f, e.x + jx, y, e.type === 'sixseven' ? 1 : e.face, { color: tierCol, scale: sc, alpha: e.tier === 3 ? .25 + .15 * Math.sin(G.t * 5) : .3 });
  if (e.type === 'lirili') { lx.fillStyle = P.white; for (let i = 0; i < 12; i += 3) { const a = -G.t * .8 + i / 12 * TAU; lx.fillRect(R(e.x + Math.cos(a) * 75), R(e.y + Math.sin(a) * 45), 1, 1); } }
  if (e.shield > 0) dotRing(e.x, bodyY(e), e.hr + 2, (e.hr + 2) * .8, 12, 'rgba(255,248,236,.5)', G.t * 3);
  if (e.type === 'ballerina' && e.spin && e.spin > 0) { lx.fillStyle = P.pinkL; for (let i = 0; i < 6; i++) { const a = e.t * 14 + i; lx.fillRect(R(e.x + Math.cos(a) * 9), R(e.y - 12 + Math.sin(a) * 4), 1, 1); } }
  if (e.burnDur && e.burnDur > 0) { lx.fillStyle = blink(12) ? P.vest : P.gold; for (let i = 0; i < (e.burnS ?? 1) * 2; i++) lx.fillRect(R(e.x + Math.sin(e.t * 9 + i * 2) * e.hr * .7), R(bodyY(e) - e.hr * .6 - ((G.t * 20 + i * 3) % 5)), 1, 1); }
  if (e.stun > 0) dotRing(e.x, bodyY(e) - e.hr - 3, 5, 2, 3, P.gold, G.t * 6);
  if (e.hp < e.max && !isBoss(e) && e.max > 4) {
    const w = e.hr * 2, by = R(e.alt ? e.y - 2 : e.y + 2);
    lx.fillStyle = P.ink; lx.fillRect(R(e.x - w / 2), by, w, 2);
    lx.fillStyle = P.pink; lx.fillRect(R(e.x - w / 2), by, R(w * Math.max(0, e.hp / e.max)), 2);
  }
}

function drawAlly(al: Ally): void {
  drawShadow(al.x, al.y, al.kind === 'dog' ? 5 : 6);
  const alpha = al.t < 1.5 && blink(10) ? .4 : 1;
  if (al.kind === 'dog') { blit(SPR.doge, al.moving ? ((G.t * 10) | 0) % 4 : 0, al.x, al.y, al.face, { alpha, outline: P.cyan }); return; }
  if (al.kind === 'turret') {
    lx.globalAlpha = alpha; lx.fillStyle = P.metal; lx.fillRect(R(al.x - 4), R(al.y - 3), 1, 4); lx.fillRect(R(al.x + 3), R(al.y - 3), 1, 4); lx.fillRect(R(al.x - 1), R(al.y - 5), 2, 5);
    const tg = GUNS[2]; lx.save(); lx.translate(R(al.x), R(al.y - 6)); lx.rotate(al.ang); if (al.face < 0) lx.scale(1, -1); lx.drawImage(tg.img, -4, -tg.m); lx.restore(); lx.globalAlpha = 1;
    return;
  }
  blit(SPR.vasya, ((G.t * 2) | 0) % 2, al.x, al.y, al.face, { alpha });
  const gun = GUNS[al.shotgun ? 1 : 0];
  lx.save(); lx.translate(R(al.x + al.face * 3), R(al.y - 9)); lx.rotate(al.ang); if (al.face < 0) lx.scale(1, -1);
  lx.globalAlpha = alpha; lx.drawImage(gun.img, -2, -gun.m); lx.restore();
}

function drawProp(pr: Prop): void {
  const def = PROPDEF[pr.kind], spr = SPR[pr.kind];
  const f = pr.kind === 'cab' ? ((G.t * 2 + pr.seed) | 0) % 3 : pr.kind === 'vend' ? ((G.t * 2 + pr.seed) | 0) % 2 : 0;
  const jig = pr.flash > 0 ? R(vrnd(1)) : 0;
  lx.drawImage(pr.flash > 0 ? tint(spr, f, '#ffffff') : spr.frames[f], pr.x + def.ox + jig, pr.y + def.oy);
}

const gunSheets = new Map<number, Sheet>();
/** Пушка как одноклеточный лист — чтобы красить её tint(). */
function gunSheet(id: number): Sheet {
  let s = gunSheets.get(id);
  if (!s) { const g = GUNS[id]; gunSheets.set(id, s = { w: g.img.width, h: g.img.height, n: 1, ax: 0, ay: 0, frames: [g.img], pix: [], tints: new Map(), damagedCache: new Map() }); }
  return s;
}
const CLASS_GLOW = [P.gold, P.cyan, P.vest, P.purple];
const PICKUP_SPR = { ammo: 'ammo', hp: 'grass', up: 'disk', gun: 'gunbox', coffee: 'coffee', blindbox: 'blindbox', dubai: 'dubai', remote: 'remote' } as const;
function drawPickup(k: Pickup): void {
  if (k.t < 3 && ((k.t * 8) | 0) % 2) return;
  const lift = R(Math.sin(k.bob) * 1.5) - 2;
  drawShadow(k.x, k.y, 5);
  if (k.type === 'stolen' || k.type === 'weapon') {
    const d = WEAPONS[k.gun ?? 'makarov'], gs = gunSheet(d.sprite), gi = gs.frames[0], x = R(k.x - gi.width / 2), y = R(k.y + lift - gi.height - 2);
    // обводка: красная у отобранной, цвет класса у пушки на полу
    const glow = k.type === 'stolen' ? (blink(6) ? P.red : null) : CLASS_GLOW[d.cls - 1];
    if (glow) { const t = tint(gs, 0, glow); for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) lx.drawImage(t, x + ox, y + oy); }
    lx.drawImage(gi, x, y);
    return;
  }
  const spr = SPR[PICKUP_SPR[k.type as keyof typeof PICKUP_SPR]];
  blit(spr, ((G.t * 3) | 0) % spr.n, k.x, k.y + lift, 1);
}

// ---------- слои ----------
function drawZones(): void {
  for (const z of G.zones) {
    const fade = Math.min(1, z.t);
    if (z.kind === 'fire' || z.kind === 'pfire') {
      lx.globalAlpha = fade;
      for (let i = 0; i < 14; i++) { const ang = i * 2.4, rr = (i % 5) / 5 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6, h = 1 + (((G.t * 12 + i) | 0) % 3); lx.fillStyle = [P.red, P.vest, P.gold][(i + ((G.t * 8) | 0)) % 3]; lx.fillRect(R(x), R(y) - h, 1, h); }
    } else if (z.kind === 'foam') {
      lx.globalAlpha = fade * .85;
      for (let i = 0; i < 30; i++) { const ang = i * 2.4, rr = (i % 6) / 6 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6; lx.fillStyle = i % 3 ? P.white : P.gold; lx.fillRect(R(x), R(y) - (((G.t * 3 + i) | 0) % 2), 1 + (i % 2), 1); }
    } else if (z.kind === 'gas') {
      // вонь: зелёные клубы, покачиваются
      lx.globalAlpha = fade * .55;
      for (let i = 0; i < 22; i++) { const ang = i * 2.4 + G.t * .5, rr = (i % 5) / 5 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6 - ((G.t * 6 + i) % 4); lx.fillStyle = i % 3 ? P.greenL : P.green; lx.fillRect(R(x), R(y), 2, 2); }
    } else if (z.kind === 'jpeg') {
      // артефакты сжатия: мигающие квадраты 2×2
      lx.globalAlpha = fade * .7;
      for (let i = 0; i < 18; i++) { const ang = i * 2.4, rr = (i % 6) / 6 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6; lx.fillStyle = [P.cyan, P.pink, P.white, '#3a8fb8'][(i + ((G.t * 6) | 0)) % 4]; lx.fillRect(R(x) & ~1, R(y) & ~1, 2, 2); }
    } else if (z.kind === 'roots') {
      lx.globalAlpha = fade;
      for (let i = 0; i < 26; i++) {
        const ang = i * 2.4, rr = (i % 6) / 6 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6, w = ((G.t * 2 + i) | 0) % 2;
        lx.fillStyle = i % 2 ? P.woodD : P.monkey; lx.fillRect(R(x), R(y), 3, 1); lx.fillRect(R(x) + 1 + w, R(y) - 1, 1, 1);
      }
    } else {
      lx.globalAlpha = fade;
      for (let i = 0; i < 40; i++) {
        const ang = i * 2.4, rr = (i % 7) / 7 * z.r, x = z.x + Math.cos(ang) * rr, y = z.y + Math.sin(ang) * rr * .6, sw = ((G.t * 3 + i) | 0) % 2;
        lx.fillStyle = i % 2 ? P.green : P.greenD;
        lx.fillRect(R(x), R(y) - 2, 1, 3); lx.fillRect(R(x) + sw, R(y) - 3, 1, 1);
      }
    }
    lx.globalAlpha = 1;
  }
  for (const pd of G.puddles) {
    const pc = pd.col === 'holy' ? [P.goldD, P.white] : pd.col === 'sewage' ? ['#5a3d1a', '#9a7a3c'] : [P.greenD, P.greenL];
    lx.globalAlpha = Math.min(1, pd.t) * .7; lx.fillStyle = pc[0];
    lx.fillRect(R(pd.x - pd.r), R(pd.y - 2), pd.r * 2, 4); lx.fillRect(R(pd.x - pd.r + 2), R(pd.y - 3), pd.r * 2 - 4, 6);
    lx.fillStyle = pc[1]; lx.fillRect(R(pd.x - 2), R(pd.y - 1), 1, 1);
    lx.globalAlpha = 1;
  }
}

function drawFloorItems(): void {
  for (const pl of G.peels) if (pl.t > 2 || ((pl.t * 8) | 0) % 2) blit(SPR.peel, 0, pl.x, pl.y, 1);
  for (const mn of G.mines) blit(SPR.mine, mn.arm > 0 ? 0 : ((G.t * 3) | 0) % 2, mn.x, mn.y, 1);
  for (const k of G.pickups) drawPickup(k);
  // прицелы бомб и падения OIIA
  for (const b of G.bombs) { const pr = 1 - b.t / b.max; dotRing(b.x, b.y, b.r * (.4 + pr * .6), b.r * .5 * (.4 + pr * .6), 16, blink(6 + pr * 14) ? P.red : P.vest); }
  for (const e of G.enemies) if (e.type === 'oiia' && e.state === 'fall') { const k = 1 - e.st / 1.1; dotRing(e.x, e.y, 20 * (.4 + k * .6), 10 * (.4 + k * .6), 16, blink(6 + k * 14) ? P.red : P.white); }
  for (const po of G.portals) {
    const pr = 1 - po.t / po.max, boss = !!enemyDef(po.type).boss, rad = boss ? 16 : 8, n = boss ? 28 : 16;
    for (let i = 0; i < n; i++) {
      const a = G.t * 5 + i / n * TAU;
      lx.fillStyle = i / n < pr ? (po.elite ? P.gold : P.pink) : '#4a3552';
      lx.fillRect(R(po.x + Math.cos(a) * rad), R(po.y + Math.sin(a) * rad * .5), 1, 1);
    }
    if (Math.random() < .5) { lx.fillStyle = vpick([P.pink, P.cyan, P.white]); lx.fillRect(R(po.x + vrnd(rad * .6)), R(po.y - Math.random() * 14 * pr), 1, 1); }
    labels.push({ x: po.x, y: po.y + rad * .5 + 8, txt: `генерация ${Math.floor(pr * 100)}%`, color: po.elite ? P.gold : P.pink });
  }
  for (const e of G.enemies) if (e.alt) drawShadow(e.x, e.y, R(e.r * scaleOf(e) * .9), .25);
}

/** Связи боссов с их «щитами»: лучи к апостолам, трубы к унитазам, пасть к хвосту. */
/** Замахи и прицелы, которые надо видеть заранее: линия Джоконды, круг дубины тун-туна, запал стримера. */
function drawTelegraphs(): void {
  for (const e of G.enemies) {
    if (e.state !== 'wind') continue;
    if (e.type === 'mona' && e.aimX != null && e.aimY != null) {
      const x0 = e.x, y0 = e.y - e.hy, dx = e.aimX - x0, dy = e.aimY - y0, L = Math.hypot(dx, dy) || 1, locked = e.st <= .35;
      if (!locked || blink(16)) { lx.globalAlpha = locked ? .9 : .45; pixLine(x0, y0, x0 + dx / L * 500, y0 + dy / L * 500, P.red, 1); lx.globalAlpha = 1; }
    }
    if (e.type === 'tung') dotRing(e.x, e.y, 30, 18, 24, blink(10) ? P.red : P.woodL);
    if (e.type === 'streamer') dotRing(e.x, e.y, 32, 19, 20, blink(14) ? P.red : P.vest);
  }
}
/** Ауры видны кругом на полу: их обходят, а не читают в HUD. */
const AURA: Partial<Record<string, [number, string]>> = { grandpa: [75, P.greyL], sigma: [110, P.greyL], sixseven: [90, P.green] };
function drawAuras(): void {
  for (const e of G.enemies) {
    const a = AURA[e.type];
    if (!a || e.charm > 0 || (e.type === 'sigma' && e.broken)) continue;
    lx.globalAlpha = .35; dotRing(e.x, e.y, a[0], a[0] * .6, Math.round(a[0] / 2.5), a[1], -G.t * .6); lx.globalAlpha = 1;
  }
}
function drawBossTethers(): void {
  const BS = G.boss;
  if (!BS || BS.dead) return;
  if (BS.type === 'jboss') { lx.globalAlpha = .45 + .25 * Math.sin(G.t * 8); for (const a of G.enemies) if (a.type === 'apostle' && a.master === BS) pixLine(a.x, bodyY(a), BS.x, bodyY(BS), P.gold, 1); lx.globalAlpha = 1; }
  if (BS.type === 'skboss') for (const q of G.props) if (q.kind === 'toiletprop') {
    pixLine(q.x + 6, q.y + 2, BS.x, BS.y - 4, '#4b4a57', 2);
    const k = (G.t * .8) % 1; lx.fillStyle = P.cyan; lx.fillRect(R(q.x + 6 + (BS.x - q.x - 6) * k), R(q.y + 2 + (BS.y - 4 - q.y - 2) * k), 2, 2);
  }
  if (BS.type === 'ouro' && BS.eating && BS.segs) {
    const tail = BS.segs.filter(sg => !sg.dead && !sg.free).pop();
    if (tail && blink(8)) { lx.globalAlpha = .7; pixLine(BS.x, bodyY(BS), tail.x, bodyY(tail), P.red, 1); lx.globalAlpha = 1; }
  }
}

type Drawable = { y: number; draw: () => void };
function drawActors(): void {
  const list: Drawable[] = [];
  for (const r of G.props) list.push({ y: r.y + r.h, draw: () => drawProp(r) });
  for (const e of G.enemies) if (!e.alt) list.push({ y: e.y, draw: () => drawEnemy(e) });
  if (G.state !== 'dead' && G.state !== 'attract') list.push({ y: G.p.y, draw: () => drawPlayer(G.p) });
  for (const al of G.allies) list.push({ y: al.y, draw: () => drawAlly(al) });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.draw();
  for (const e of G.enemies) if (e.alt) drawEnemy(e);
}

const STUN_TEXT = { captcha: 'выберите все светофоры', wifi: 'нет сети', bonk: 'бонк' } as const;
function collectLabels(): void {
  const p = G.p;
  let stunLabels = 0, charmLabels = 0;
  for (const k of G.pickups) if (k.type === 'stolen' || k.type === 'remote') labels.push({ x: k.x, y: k.y - 20, txt: k.type === 'remote' ? 'ПУЛЬТ' : 'ТВОЯ ПУШКА', color: k.type === 'remote' ? P.gold : P.red });
  // пушки на полу: имя, и что будет по T
  const near = weaponNear();
  for (const k of G.pickups) if (k.type === 'weapon' && k.gun) {
    const d = WEAPONS[k.gun], own = p.guns[d.cls - 1], lvl = G.gunLvl[k.gun].lvl;
    let txt = `${d.short} ур.${lvl}`;
    if (k === near && own && own.id !== k.gun) txt = isTouch ? `ВЗЯТЬ ВМЕСТО ${WEAPONS[own.id].short}` : `T — ВМЕСТО ${WEAPONS[own.id].short}`;
    labels.push({ x: k.x, y: k.y - 18, txt, color: CLASS_GLOW[d.cls - 1] });
    if (k === near) labels.push({ x: k.x, y: k.y + 8, txt: d.role, color: P.paper });
    if (k === near && k.reroll && !isTouch) labels.push({ x: k.x, y: k.y + 18, txt: 'X — перегенерировать', color: P.pink });
  }
  // сигма режет мелкий урон: подсказка, когда в руках мелкокалиберное
  const small = (['makarov', 'mg', 'flame', 'vacuum', 'link', 'keyboard', 'nyan'] as const).includes(activeGunId() as 'mg');
  if (small) for (const e of G.enemies) if (e.type === 'sigma' && Math.hypot(e.x - p.x, e.y - p.y) < 140) labels.push({ x: e.x, y: bodyY(e) - e.hr - 18, txt: 'мелочь не берёт', color: P.greyL });
  for (const mn of G.mines.slice(-3)) if (mn.arm <= 0) labels.push({ x: mn.x, y: mn.y - 12, txt: 'Принять cookies?', color: P.white });
  for (const e of G.enemies) {
    if (e.charm > 0 && charmLabels++ < 3) labels.push({ x: e.x, y: bodyY(e) - e.hr - 10, txt: 'на твоей стороне', color: P.purple });
    if (e.tier === 3) labels.push({ x: e.x, y: bodyY(e) - e.hr * scaleOf(e) - (e.elite ? 16 : 8), txt: 'PRO', color: P.cyan });
    if (e.elite && e.aff) labels.push({ x: e.x, y: bodyY(e) - e.hr * scaleOf(e) - 8, txt: AFFIX[e.aff].name, color: AFFIX[e.aff].color });
    if (e.stun > 0 && e.stunKind && stunLabels < 4) {
      stunLabels++;
      labels.push({ x: e.x, y: bodyY(e) - e.hr - 14, txt: STUN_TEXT[e.stunKind], color: e.stunKind === 'captcha' ? P.greenL : P.cyan });
    }
    if (e.type === 'mama' && e.prompt && !e.decoy && !e.prompt.edited) { const h = e.prompt.hits ?? 0; labels.push({ x: e.x, y: e.y - 34, txt: `СТРЕЛЯЙ В ПРОМПТ ${'#'.repeat(h)}${'.'.repeat(4 - h)}`, color: P.cyan }); }
    if (e.type === 'ouro' && e.eating) labels.push({ x: e.x, y: bodyY(e) - 22, txt: 'СТРЕЛЯЙ В ГОЛОВУ!', color: P.red });
    if (e.type === 'mama' && e.prompt) {
      const k = Math.min(1, e.prompt.t / (e.prompt.dur * .7));
      labels.push({ x: e.x, y: e.y - 50, txt: `> ${e.prompt.txt.slice(0, Math.ceil(e.prompt.txt.length * k))}${blink(4) ? '_' : ' '}`, color: e.prompt.edited ? P.cyan : P.white, big: true });
    }
    if (e.type === 'grandpa' && Math.hypot(e.x - p.x, e.y - p.y) < 36) labels.push({ x: e.x, y: e.y - 36, txt: isTouch ? 'ПОЗДРАВИТЬ' : 'F — ПОЗДРАВИТЬ', color: P.gold });
  }
}

function drawBeams(): void {
  for (const bm of G.beams) {
    const a = bm.t / bm.max;
    if (bm.type === 'link') {
      // молния: ломаная с дрожью
      const n = Math.max(2, (Math.hypot(bm.x1 - bm.x0, bm.y1 - bm.y0) / 8) | 0);
      let px0 = bm.x0, py0 = bm.y0;
      for (let i = 1; i <= n; i++) {
        const k = i / n, jx = i === n ? 0 : vrnd(4), jy = i === n ? 0 : vrnd(4);
        const px1 = bm.x0 + (bm.x1 - bm.x0) * k + jx, py1 = bm.y0 + (bm.y1 - bm.y0) * k + jy;
        pixLine(px0, py0, px1, py1, P.cyan, 2); pixLine(px0, py0, px1, py1, P.white, 1);
        px0 = px1; py0 = py1;
      }
    } else if (bm.type === 'sniper') { pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.red, a > .5 ? 3 : 2); pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.white, 1); }
    else if (bm.type === 'rail') { pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.purple, a > .5 ? 3 : 2); pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.white, 1); }
    else { pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.cyan, 2); pixLine(bm.x0, bm.y0, bm.x1, bm.y1, P.white, 1); lx.fillStyle = P.white; lx.fillRect(R(bm.x1 - 1), R(bm.y1 - 1), 3, 3); }
  }
}

function drawBullets(): void {
  for (const b of G.bullets) {
    const n = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / n, uy = b.vy / n;
    switch (b.kind) {
      case 'rocket': lx.fillStyle = P.cyan; lx.fillRect(R(b.x - 2), R(b.y - 1), 4, 2); lx.fillStyle = P.pink; lx.fillRect(R(b.x - 2), R(b.y - 1), 1, 2); break;
      case 'kb': rotated(SPR.kb.frames[0], b.x, b.y, b.rot, -5, -3, true); break;
      case 'slipper': rotated(SPR.slipper.frames[0], b.x, b.y, Math.atan2(b.vy, b.vx), -4, -2); break;
      case 'nyan': blit(SPR.nyan, blink(8) ? 1 : 0, b.x, b.y, b.vx < 0 ? -1 : 1, { scale: b.mega ? 2 : 1 }); break;
      case 'orbit': if (b.src === 'keyboard') rotated(SPR.kb.frames[0], b.x, b.y, b.rot, -5, -3, true); else rotated(SPR.slipper.frames[0], b.x, b.y, (b.oa ?? 0) + Math.PI / 2, -4, -2); break;
      case 'token': pixLine(b.x - ux * 5, b.y - uy * 5, b.x, b.y, P.green, 1); lx.fillStyle = P.white; lx.fillRect(R(b.x), R(b.y), 1, 1); break;
      case 'sonic': {
        const w = (b.w ?? 0) | 0;
        lx.globalAlpha = Math.min(1, b.life * 3);
        for (let i = -w; i <= w; i++) { const back = i * i / (w * 2 + 1); lx.fillStyle = Math.abs(i) % 3 ? P.gold : P.pink; lx.fillRect(R(b.x - uy * i - ux * back), R(b.y + ux * i - uy * back), 1, 1); }
        lx.globalAlpha = 1;
        break;
      }
      case 'grenade': drawShadow(b.x, b.y + 9, 2, .3); blit(SPR.captcha, 0, b.x, b.y - (b.z ?? 0), 1); break;
      case 'book': rotated(SPR.book.frames[0], b.x, b.y, b.rot, -4, -3, true); break;
      case 'flame': {
        const k = b.life / .35;
        lx.fillStyle = k > .7 ? P.white : k > .45 ? P.gold : k > .2 ? P.vest : P.red;
        const s = k > .5 ? 2 : 3; lx.fillRect(R(b.x - s / 2), R(b.y - s / 2), s, s);
        break;
      }
      case 'staple': lx.fillStyle = P.greyL; lx.fillRect(R(b.x), R(b.y), 1, 1); lx.fillRect(R(b.x - ux * 2), R(b.y - uy * 2), 1, 1); break;
      default:
        lx.fillStyle = P.white; lx.fillRect(R(b.x), R(b.y), 1, 1);
        lx.fillStyle = P.stripe; lx.fillRect(R(b.x - ux * 2), R(b.y - uy * 2), 1, 1); lx.fillRect(R(b.x - ux * 3), R(b.y - uy * 3), 1, 1);
    }
  }
}

function drawEBullets(): void {
  for (const b of G.ebullets) {
    const tb = (hz: number): boolean => ((b.t * hz) | 0) % 2 === 1;
    switch (b.kind) {
      case 'amen': lx.fillStyle = tb(8) ? P.white : P.gold; lx.fillRect(R(b.x), R(b.y - 2), 1, 5); lx.fillRect(R(b.x - 1), R(b.y - 1), 3, 1); break;
      case 'letter': blit(SPR.letters[b.ch ?? 'D'], 0, b.x, b.y, 1); break;
      case 'word': blit(SPR.words[b.w ?? 'WOW'], 0, b.x, b.y, 1); break;
      case 'grain': lx.fillStyle = P.brownL; lx.fillRect(R(b.x), R(b.y), 1, 1); break;
      case 'ebullet': lx.fillStyle = P.stripe; lx.fillRect(R(b.x), R(b.y), 1, 1); lx.fillStyle = P.red; lx.fillRect(R(b.x - b.vx * .012), R(b.y - b.vy * .012), 1, 1); break;
      case 'erocket': lx.fillStyle = P.red; lx.fillRect(R(b.x - 2), R(b.y - 1), 4, 2); lx.fillStyle = P.vest; lx.fillRect(R(b.x - 2), R(b.y - 1), 1, 2); break;
      case 'eslipper': rotated(tint(SPR.slipper, 0, P.red), b.x, b.y, Math.atan2(b.vy, b.vx), -4, -2); break;
      case 'bottle': drawShadow(b.x, b.gy ?? b.y, 2, .3); rotated(SPR.bottle.frames[0], b.x, b.y, b.t * 12, -2, -4, true); break;
      case 'digit': blit(SPR.digits[b.ch === '7' ? '7' : '6'], 0, b.x, b.y + R(Math.sin(b.t * 14) * 1.5), 1); break;
      case 'peel': drawShadow(b.x, b.gy ?? b.y, 2, .3); blit(SPR.peel, 0, b.x, b.y, 1); break;
      case 'drop': lx.fillStyle = tb(10) ? P.white : P.cyan; lx.fillRect(R(b.x - 1), R(b.y - 1), 2, 3); break;
      case 'fur': lx.fillStyle = tb(10) ? P.floppa : P.floppaD; lx.fillRect(R(b.x - 1), R(b.y - 1), 3, 2); break;
      case 'reflect': lx.fillStyle = tb(12) ? P.pink : P.white; lx.fillRect(R(b.x - 1), R(b.y - 1), 2, 2); break;
      case 'noodle': {
        const a = Math.atan2(b.vy, b.vx), nx = -Math.sin(a), ny = Math.cos(a);
        lx.fillStyle = P.noodle;
        for (let i = 0; i < 5; i++) { const w = Math.sin(b.t * 20 + i) * 1.5; lx.fillRect(R(b.x - Math.cos(a) * i * 1.5 + nx * w), R(b.y - Math.sin(a) * i * 1.5 + ny * w), 1, 1); }
        break;
      }
    }
  }
  for (const b of G.bombs) { const k = b.t / b.max; blit(SPR.bomb, 0, b.x, b.y - b.alt * k - 4, 1); }
}

function drawParticles(): void {
  for (const q of G.parts) {
    const a = Math.max(0, q.life / q.max);
    if (q.ring) {
      const rad = q.size * (1 - a * .6);
      lx.globalAlpha = a; dotRing(q.x, q.y, rad, rad * .6, Math.max(12, R(rad * 2)), q.color); lx.globalAlpha = 1;
      continue;
    }
    if (!q.flash && a < .3 && ((q.life * 40) | 0) % 2) continue;
    lx.fillStyle = q.color;
    lx.fillRect(R(q.x - q.size / 2), R(q.y - q.size / 2), q.size, q.size);
  }
}

export function drawWorld(): void {
  const c = G.cam, fl = floorCanvas();
  lx.setTransform(1, 0, 0, 1, 0, 0);
  lx.imageSmoothingEnabled = false;
  lx.fillStyle = P.ink; lx.fillRect(0, 0, view.VW, view.VH);
  lx.translate(-c.x, -c.y);
  if (fl) lx.drawImage(fl, 0, 0);
  labels.length = 0;
  drawZones();
  drawFloorItems();
  drawBossTethers();
  drawAuras();
  drawTelegraphs();
  drawActors();
  collectLabels();
  drawBeams();
  drawBullets();
  drawEBullets();
  drawParticles();
}
