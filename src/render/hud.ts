// HUD в полном разрешении: реальность, опыт, оружие, дебаффы, счёт, слоты, способности, босс, баннеры, прицел.
import { P } from '../content/palette';
import { enemyDef } from '../content/enemies';
import { WEAPONS, CLASS_NAME, LEVEL_KILLS, MAX_GUN_LEVEL, type WeaponClass } from '../content/weapons';
import { PHASE_NAMES } from '../content/bosses';
import { R, clamp } from '../engine/math';
import { isTouch, PIX_FONT } from '../platform';
import { Snd } from '../audio';
import { G } from '../game/world';
import { xpNeed } from '../game/state';
import { bossFrac } from '../game/body';
import { DEFAULT_PHASES } from '../game/bosses/phases';
import { curSlot, activeGunId, gunLevel } from '../game/inventory';
import { CD } from '../game/abilities';
import type { AbilityKey } from '../content/perks';
import { mouse, touch } from '../ui/input';
import { ctx, view } from './canvas';
import { GUNS } from './sprites';

const PAD = 16;

function txt(s: string | number, x: number, y: number, color: string, size = 8, align: CanvasTextAlign = 'left'): void {
  let str = String(s);
  // six-seven ломает цифры на экране
  if (G.p.scramble > 0) { let i = 0; const k = (G.t * 6) | 0; str = str.replace(/\d/g, () => ((i++ + k) % 2 ? '6' : '7')); }
  ctx.font = `${size}px ${PIX_FONT}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = P.ink; ctx.fillText(str, x + 2, y + 2);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function box(x: number, y: number, w: number, h: number, fill: string, border: string): void {
  ctx.fillStyle = P.ink; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = border; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
}
/** Надпись «РЕАЛЬНОСТЬ» разваливается вместе со здоровьем. */
function realityLabel(hp: number): string {
  return hp > 60 ? 'РЕАЛЬНОСТЬ' : hp > 40 ? 'РЕАЛЬНОСТЬ (НР)' : hp > 20 ? 'РЕАЛЬНОСЬТЬ' : 'РЕЛЬАНСОТЬ';
}

/** Левый верхний угол. Возвращает Y, с которого можно рисовать дальше. */
function drawStatus(narrow: boolean): number {
  const p = G.p, m = G.mods;
  const shown = p.hp < 50 ? Math.round(p.hp + Math.sin(G.t * 9) * 2) : Math.round(p.hp);
  txt(`${realityLabel(p.hp)} ${Math.max(0, shown)}/${m.maxHp}`, PAD, PAD, P.paper);
  const blocks = Math.min(40, Math.round(m.maxHp / 5)), bw = narrow ? 5 : 8, filled = Math.ceil(p.hp / m.maxHp * blocks);
  for (let i = 0; i < blocks; i++) {
    ctx.fillStyle = P.ink; ctx.fillRect(PAD + i * (bw + 2), PAD + 14, bw, 10);
    ctx.fillStyle = i < filled ? (p.hp > 40 ? P.green : p.hp > 20 ? P.gold : P.pink) : P.slot;
    ctx.fillRect(PAD + i * (bw + 2) + 1, PAD + 15, bw - 2, 8);
  }
  const need = xpNeed(p.level), xw = Math.min(blocks * (bw + 2) - 2, 260);
  txt(`УР ${p.level}`, PAD, PAD + 30, P.cyan);
  ctx.fillStyle = P.ink; ctx.fillRect(PAD + 44, PAD + 30, xw - 44, 8);
  ctx.fillStyle = P.cyan; ctx.fillRect(PAD + 45, PAD + 31, (xw - 46) * Math.min(1, G.xp / need), 6);

  const slot = curSlot(), id = activeGunId(), d = WEAPONS[id], mak = id === 'makarov';
  txt(`${d.name} · УР ${gunLevel(id)}`, PAD, PAD + 46, mak ? P.paper : P.cyan);
  txt(mak ? `ПАТРОНЫ ∞ · СЕРИЯ ${p.streak % 3}/3` : `ПАТРОНЫ ${Math.ceil(slot.ammo)}`, PAD, PAD + 60, P.muted);
  if (id === slot.id) {
    const A = d.alt, cd = slot.altCd ?? 0, ready = cd <= 0 && (mak || slot.ammo >= A.cost);
    txt(`${isTouch ? 'АЛЬТ' : 'ПКМ'}: ${A.name}${cd > 0 ? ' ' + cd.toFixed(1) : A.cost ? ' (' + A.cost + ')' : ''}`, PAD, PAD + 74, ready ? P.cyan : P.dim);
  }
  let sy = PAD + 90;
  const warn = (s: string): void => { txt(s, PAD, sy, P.pink); sy += 14; };
  if (p.guilt) warn('ДЕДУ ГРУСТНО: СТРЕЛЬБА x0.5');
  if (p.invert > 0) warn('TEMPERATURE 2.0: УПРАВЛЕНИЕ НАОБОРОТ');
  if (p.noGun > 0) warn('NEGATIVE PROMPT: NO GUNS');
  if (p.rooted) warn(p.rooted === 'foam' ? 'ПЕННАЯ ЛУЖА: СКОРОСТЬ x0.6' : 'КОРНИ ПАТАПИМА: СКОРОСТЬ x0.5');
  if (p.mogged) warn('ТЕБЯ ЗАМОГАЛИ: УРОН x0.7');
  if (p.sugar > 0) warn(`САХАРНЫЙ РАШ ${Math.ceil(p.sugar)}`);
  if (p.cling) warn(`НА ТЕБЕ ЛАБУБУ: ${p.cling} · КУВЫРОК — СТРЯХНУТЬ`);
  if (p.timeSlow) warn('ЛИРИЛИ ЛАРИЛА: ВРЕМЯ ЗАМЕДЛЕНО');
  if (p.slip > 0) warn('СКОЛЬЗИШЬ НА БАНАНЕ');
  if (p.wobble) warn('SIX SEVEN: РУКИ КАЧАЮТСЯ');
  if (p.scramble > 0) warn('SIX SEVEN: ЦИФРЫ СЛОМАНЫ');
  return sy;
}

function drawScore(narrow: boolean, sy: number): number {
  const W = view.W;
  if (narrow) {
    txt(`${G.score} ЛАЙКОВ · ВОЛНА ${G.wave}`, PAD, sy, P.gold); sy += 16;
    if (G.toast) { txt(G.toast.txt, PAD, sy, P.cyan); sy += 14; }
    return sy;
  }
  txt(`${G.score} ЛАЙКОВ`, W - PAD, PAD, P.gold, 16, 'right');
  txt(G.wave ? `ВОЛНА ${G.wave} · СЛОПА: ${G.enemies.length + G.queue.length + G.portals.length}` : 'ПОДГОТОВКА', W - PAD, PAD + 24, P.paper, 8, 'right');
  txt(Snd.on ? 'ЗВУК: M · ТРЕК: N' : 'ЗВУК ВЫКЛ: M', W - PAD, PAD + 38, P.dim, 8, 'right');
  if (G.toast) { ctx.globalAlpha = Math.min(1, G.toast.t); txt(G.toast.txt, W - PAD, PAD + 54, P.cyan, 8, 'right'); ctx.globalAlpha = 1; }
  return sy;
}

interface AbilityCell { k: string; key?: AbilityKey; name: string; cd: number; max: number; col: string; ult?: boolean }
const abilitySize = (): { aw: number; gap: number } => (view.W < 900 ? { aw: 32, gap: 12 } : { aw: 40, gap: 22 });

/** Кнопки способностей (только десктоп). Возвращают правую границу. */
function drawAbilities(): number {
  if (isTouch) return PAD;
  const p = G.p, m = G.mods, { aw, gap } = abilitySize(), ay = view.H - PAD - aw - 14;
  const ab: AbilityCell[] = [
    { k: 'Q', key: 'q', name: 'WI-FI', cd: p.cdQ, max: CD.q * m.cd, col: P.cyan },
    { k: 'E', key: 'e', name: 'ТРАВА', cd: p.cdE, max: CD.e * m.cd, col: P.green },
    { k: 'R', key: 'r', name: 'БЛЭКАУТ', cd: 100 - p.ult, max: 100, col: P.white, ult: true },
    { k: 'C', key: 'c', name: 'ВАСЯ', cd: p.cdC, max: CD.c * m.cd, col: '#6b8cff' },
    { k: 'V', key: 'v', name: 'CTRL+Z', cd: p.cdV, max: CD.v * m.cd, col: P.cyan },
    { k: 'G', key: 'g', name: 'ПРОМПТ', cd: p.cdG, max: CD.g * m.cd, col: P.purple },
    { k: '␣', name: 'КУВЫРОК', cd: Math.max(0, p.dashCd), max: 1.1 * m.dashCd, col: P.vest }
  ];
  ab.forEach((a, i) => {
    const x = PAD + i * (aw + gap), ready = a.cd <= 0.001;
    box(x, ay, aw, aw, '#231b30', ready ? a.col : P.slot);
    if (!ready) { ctx.fillStyle = 'rgba(26,20,35,.7)'; ctx.fillRect(x, ay, aw, aw * Math.min(1, a.cd / a.max)); }
    txt(a.k, x + aw / 2, ay + 10, ready ? a.col : P.dim, 16, 'center');
    txt(a.ult && !ready ? `${R(p.ult)}%` : !ready ? `${Math.ceil(a.cd)}` : a.name, x + aw / 2, ay + aw + 4, ready ? a.col : '#8a82a0', 8, 'center');
    const lvl = a.key ? G.ab[a.key] : 0;
    for (let j = 0; j < (lvl ? 3 : 0); j++) { ctx.fillStyle = j < lvl ? a.col : P.slot; ctx.fillRect(x + 3 + j * 5, ay + 3, 4, 3); }
  });
  return PAD + ab.length * (aw + gap) - gap;
}

const CLASS_COLOR = [P.gold, P.cyan, P.vest, P.purple];
/** 4 слота по классам: пушка, уровень (5 делений), опыт до следующего, патроны. */
function drawGunSlots(narrow: boolean, sy: number, leftEdge: number): void {
  const p = G.p, gap = 8, W = view.W, H = view.H, sw = narrow ? 34 : 40, n = p.guns.length;
  const rowW = n * (sw + gap) - gap;
  const x0 = narrow ? PAD : Math.max(leftEdge + 24, (W - rowW) / 2), y = narrow ? sy + 4 : H - PAD - 18 - sw;
  p.guns.forEach((s, i) => {
    const x = x0 + i * (sw + gap), sel = i === p.cur, col = CLASS_COLOR[i];
    box(x, y, sw, sw, sel ? '#3a2d4d' : '#231b30', sel ? P.gold : s ? col : P.slot);
    if (!isTouch) txt(String(i + 1), x + 2, y + 2, sel ? P.gold : P.muted, 8);
    if (!s) { txt(CLASS_NAME[(i + 1) as WeaponClass].slice(0, 3), x + sw / 2, y + sw / 2 - 4, P.slot, 8, 'center'); return; }
    const d = WEAPONS[s.id], gi = GUNS[d.sprite].img, sc = Math.min(2, Math.floor((sw - 6) / gi.width) || 1), empty = s.id !== 'makarov' && s.ammo <= 0;
    ctx.globalAlpha = empty ? .35 : 1;
    ctx.drawImage(gi, R(x + (sw - gi.width * sc) / 2), R(y + (sw - gi.height * sc) / 2), gi.width * sc, gi.height * sc);
    ctx.globalAlpha = 1;
    // уровень: 5 делений, нечётные (механики) — золотые
    const gl = G.gunLvl[s.id];
    for (let j = 0; j < 5; j++) { ctx.fillStyle = j < gl.lvl ? (j % 2 === 0 && j ? P.gold : col) : P.slot; ctx.fillRect(x + 2 + j * ((sw - 4) / 5), y + sw - 5, (sw - 4) / 5 - 1, 3); }
    // опыт до следующего уровня
    if (gl.lvl < MAX_GUN_LEVEL) { const a = LEVEL_KILLS[gl.lvl - 1], b = LEVEL_KILLS[gl.lvl]; ctx.fillStyle = P.white; ctx.fillRect(x + 2, y + sw - 1, (sw - 4) * clamp((gl.xp - a) / (b - a), 0, 1), 1); }
    if (s.id !== 'makarov') txt(String(Math.ceil(s.ammo)), x + sw / 2, y + sw + 4, empty ? P.red : P.muted, 8, 'center');
    if (s.stolen) { ctx.strokeStyle = P.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + sw - 3, y + sw - 3); ctx.moveTo(x + sw - 3, y + 3); ctx.lineTo(x + 3, y + sw - 3); ctx.stroke(); }
  });
}

function drawBossIntro(narrow: boolean): void {
  const it = G.intro; if (!it) return;
  const { W, H } = view, k = Math.min(1, (it.max - it.t) / .3, it.t / .3), bh = R(H * .14 * k);
  ctx.fillStyle = P.ink; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
  ctx.globalAlpha = k;
  const big = narrow ? 14 : 24, cy = H * .5;
  ctx.fillStyle = 'rgba(26,20,35,.85)'; ctx.fillRect(0, cy - big - 26, W, big * 2 + 52);
  txt('БОСС', W / 2, cy - big - 14, P.red, 8, 'center');
  ctx.font = `${big}px ${PIX_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = P.pink; ctx.fillText(it.name, W / 2 + 3, cy + 3); ctx.fillStyle = P.gold; ctx.fillText(it.name, W / 2, cy);
  txt(it.sub, W / 2, cy + big, P.paper, 8, 'center');
  ctx.globalAlpha = 1;
}

function drawBossBar(narrow: boolean): void {
  const b = G.boss;
  if (!b || b.dead) return;
  const { W, H } = view, fr = Math.max(0, bossFrac(b)), bph = b.phase, th = enemyDef(b.type).phases ?? DEFAULT_PHASES;
  const w = Math.min(460, W - PAD * 2), x = (W - w) / 2, y = narrow ? H - PAD - 20 - 130 : PAD + 56;
  const col = [P.pink, P.vest, P.red][bph];
  txt(`${b.bossName} · ${PHASE_NAMES[b.type]?.[bph] ?? ''}`, W / 2, y - 16, col, 8, 'center');
  ctx.fillStyle = P.ink; ctx.fillRect(x - 2, y - 2, w + 4, 14);
  ctx.fillStyle = P.slot; ctx.fillRect(x, y, w, 10);
  const trans = !!b.trans && b.trans > 0;
  ctx.fillStyle = trans && ((G.t * 12) | 0) % 2 ? P.white : col; ctx.fillRect(x, y, w * fr, 10);
  for (const t of th) { ctx.fillStyle = P.ink; ctx.fillRect(R(x + w * t) - 1, y - 3, 3, 16); ctx.fillStyle = P.paper; ctx.fillRect(R(x + w * t), y - 3, 1, 16); }
  if (trans) txt('НЕУЯЗВИМ', W / 2, y + 14, P.white, 8, 'center');
}

function drawBanner(narrow: boolean): void {
  const bn = G.banner;
  if (!bn || G.intro) return;
  const { W, H } = view, a = clamp(Math.min(bn.t / .4, (bn.max - bn.t) / .2 + .2), 0, 1), size = narrow ? 16 : 32;
  ctx.globalAlpha = a;
  ctx.font = `${size}px ${PIX_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = P.pink; ctx.fillText(bn.title, W / 2 + 4, H * .3 + 4);
  ctx.fillStyle = bn.color; ctx.fillText(bn.title, W / 2, H * .3);
  txt(bn.sub, W / 2, H * .3 + size, P.paper, 8, 'center');
  ctx.globalAlpha = 1;
}

function drawPointer(): void {
  const st = touch.stick;
  if (st) {
    ctx.fillStyle = 'rgba(239,230,210,.25)';
    ctx.fillRect(st.ox - 40, st.oy - 4, 80, 8); ctx.fillRect(st.ox - 4, st.oy - 40, 8, 80);
    const dx = st.x - st.ox, dy = st.y - st.oy, l = Math.min(40, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    ctx.fillStyle = 'rgba(239,230,210,.5)'; ctx.fillRect(st.ox + Math.cos(a) * l - 12, st.oy + Math.sin(a) * l - 12, 24, 24);
  }
  if (isTouch || G.state !== 'play') return;
  const x = R(mouse.x), y = R(mouse.y), u = Math.max(2, view.S - 1);
  const pts = [[-4, 0], [-3, 0], [3, 0], [4, 0], [0, -4], [0, -3], [0, 3], [0, 4]];
  ctx.fillStyle = P.ink; for (const [ox, oy] of pts) ctx.fillRect(x + ox * u - u / 2 + 1, y + oy * u - u / 2 + 1, u, u);
  ctx.fillStyle = activeGunId() === 'captcha' ? P.greenL : P.gold; for (const [ox, oy] of pts) ctx.fillRect(x + ox * u - u / 2, y + oy * u - u / 2, u, u);
  // шестой палец на прицеле, когда реальность трещит
  if (G.p.hp <= 60) { ctx.fillStyle = P.skin; ctx.fillRect(x + 3 * u, y - 5 * u, u, 2 * u); }
  // заряд рельсы и нагрев лазера — полоска под прицелом
  const gauge = G.p.charge > 0 ? G.p.charge / 1.2 : activeGunId() === 'laser' ? G.p.heat / 2 : activeGunId() === 'mg' ? G.p.spin : 0;
  if (gauge > 0) { ctx.fillStyle = P.ink; ctx.fillRect(x - 6 * u, y + 6 * u, 12 * u, u + 2); ctx.fillStyle = gauge >= 1 ? P.white : P.purple; ctx.fillRect(x - 6 * u + 1, y + 6 * u + 1, (12 * u - 2) * Math.min(1, gauge), u); }
}

export function drawHUD(): void {
  const narrow = view.W < 640;
  let sy = drawStatus(narrow);
  sy = drawScore(narrow, sy);
  const abRight = drawAbilities();
  drawGunSlots(narrow, sy, abRight);
  drawBossIntro(narrow);
  drawBossBar(narrow);
  drawBanner(narrow);
  drawPointer();
}
