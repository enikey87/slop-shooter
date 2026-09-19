// Защита от зависаний: санитар состояния (NaN) и сторож волны (враги, которые не умирают).
import { P } from '../content/palette';
import { G } from './world';
import { say, banner } from './fx';
import { spawnPoint } from './arena';
import { isBoss } from './body';
import { WW, WH } from './state';

const ok = (v: number): boolean => Number.isFinite(v);
let safeX = WW / 2, safeY = WH / 2, safeHp = 100;

/** Каждый тик: сущности с NaN убираем, игрока с NaN возвращаем на последнюю нормальную позицию. Возвращает число исправлений. */
export function sanitize(): number {
  const p = G.p;
  let fixes = 0;
  if (ok(p.x) && ok(p.y)) { safeX = p.x; safeY = p.y; } else { p.x = safeX; p.y = safeY; fixes++; }
  if (ok(p.hp)) safeHp = p.hp; else { p.hp = safeHp; fixes++; }
  const n = G.enemies.length + G.bullets.length + G.ebullets.length + G.parts.length + G.pickups.length + G.allies.length;
  G.enemies = G.enemies.filter(e => ok(e.x) && ok(e.y) && ok(e.hp));
  G.bullets = G.bullets.filter(b => ok(b.x) && ok(b.y));
  G.ebullets = G.ebullets.filter(b => ok(b.x) && ok(b.y));
  G.parts = G.parts.filter(q => ok(q.x) && ok(q.y));
  G.pickups = G.pickups.filter(k => ok(k.x) && ok(k.y));
  G.allies = G.allies.filter(a => ok(a.x) && ok(a.y));
  fixes += n - (G.enemies.length + G.bullets.length + G.ebullets.length + G.parts.length + G.pickups.length + G.allies.length);
  // потолок сущностей: вражеских пуль в буллет-хелле боссов может стать слишком много
  if (G.ebullets.length > 900) G.ebullets.splice(0, G.ebullets.length - 900);
  if (G.bullets.length > 900) G.bullets.splice(0, G.bullets.length - 900);
  return fixes;
}

/** Сколько секунд волна может идти без прогресса, прежде чем сторож вмешается. */
export const STUCK_NUDGE = 40, STUCK_CLEAR = 70;

/** Прогресс волны: урон по врагу, убийство, появление врага. */
export function progress(): void { G.stuckT = 0; }

/** Как пробить босса — показываем, если бой встал. */
const BOSS_HINT: Partial<Record<string, string>> = {
  jboss: 'сначала убей апостолов — они его щит', mama: 'стреляй в текст промпта над ней', cboss: 'бей, когда пикирует; взрывы задевают вполсилы',
  skboss: 'сломай унитазы — он питается от них', fboss: 'не стой рядом с лутом — она его ест', ouro: 'сначала хвост, голову — когда ест себя',
  skuf: 'сломай диван или найди пульт'
};
let bossHp = 0, bossT = 0;
/** Бой с боссом встал (здоровье почти не падает 25 с) — подсказываем механику. */
function watchBoss(dt: number): void {
  const b = G.boss;
  if (!b || G.intro) { bossT = 0; return; }
  if (b.hp < bossHp - b.max * .01 || b.hp > bossHp) { bossHp = b.hp; bossT = 0; return; }
  bossT += dt;
  if (bossT >= 25) { bossT = 0; const h = BOSS_HINT[b.type]; if (h) banner('ПОДСКАЗКА', h, 3, P.cyan); }
}

/** Сторож: очередь пуста, а враги не умирают. Сначала телепортируем их к игроку, потом закрываем волну. Боссов не трогаем. */
export function watchWave(dt: number): void {
  watchBoss(dt);
  if (G.phase !== 'wave' || G.queue.length || G.portals.length || G.boss || !G.enemies.length) { G.stuckT = 0; return; }
  const was = G.stuckT;
  G.stuckT += dt;
  if (was < STUCK_NUDGE && G.stuckT >= STUCK_NUDGE) {
    for (const e of G.enemies) {
      if (isBoss(e)) continue;
      const sp = spawnPoint(50, { x: G.p.x, y: G.p.y, r: 90 });
      e.x = sp.x; e.y = sp.y; e.charm = 0; e.disguised = false; e.stun = 0; e.vis = 1;
    }
    say(G.p.x, G.p.y - 34, 'СЛОП ЗАБЛУДИЛСЯ — ВОТ ОН', P.pink, true);
  }
  if (G.stuckT >= STUCK_CLEAR) {
    for (const e of G.enemies) if (!isBoss(e)) e.dead = true;
    G.enemies = G.enemies.filter(e => !e.dead);
    banner('ТАЙМАУТ ГЕНЕРАЦИИ', 'остатки волны удалены', 1.8, P.muted);
    G.stuckT = 0;
  }
}
