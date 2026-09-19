// HTML-экраны поверх канваса: старт, перки, пауза, смерть, победа.
import { P } from '../content/palette';
import { PERKS } from '../content/perks';
import { WEAPONS, type WeaponId } from '../content/weapons';
import { EVOLUTIONS, type EvolutionDef } from '../content/evolutions';
import { EPITAPHS } from '../content/texts.ru';
import { vpick } from '../engine/rng';
import { $ } from '../platform';
import { Snd } from '../audio';
import { G } from '../game/world';
import { banner } from '../game/fx';
import { choosePerk } from '../game/perks';
import { nextLevelDef, startNextLevel } from '../game/levels';
import { LEVELS } from '../content/levels';
import { releaseFire } from './input';

export interface ScreenHandlers { start(): void }

const hideAll = (): void => { for (const id of ['start', 'over', 'pause', 'perks', 'win', 'transit']) $(id).hidden = true; };
const stats = (): string => `Волна ${G.wave} · уровень ${G.p.level} · слопа убрано: ${G.kills} · лайков: ${G.score} · ${G.p.guns.filter(Boolean).map(s => `${WEAPONS[s!.id].short} ${G.gunLvl[s!.id].lvl}`).join(' · ')}`;

export function toggleSound(): void {
  Snd.init();
  const on = Snd.toggle();
  for (const b of document.querySelectorAll('.snd-toggle')) b.textContent = on ? 'Звук: вкл' : 'Звук: выкл';
}

export function togglePause(): void {
  if (G.state === 'play') {
    G.state = 'pause'; Snd.music(false);
    const names = Object.entries(G.taken).map(([id, n]) => `${PERKS.find(pk => pk.id === id)?.name ?? id}${n > 1 ? ' x' + n : ''}`);
    const recipes = (Object.entries(EVOLUTIONS) as [WeaponId, EvolutionDef][]).map(([id, ev]) => `${WEAPONS[id].short} ур.5 + ${PERKS.find(pk => pk.id === ev.perk)?.name} → ${ev.name}${G.evolved[id] ? ' ✓' : ''}`);
    $('pause-perks').textContent = (names.length ? `Перки: ${names.join(' · ')}` : 'Перков пока нет. Убивай слоп, копи лайки.') + `\n\nЭволюции (сундук босса): ${recipes.join(' · ')}`;
    $('pause').hidden = false; $('btn-resume').focus();
  } else if (G.state === 'pause') { G.state = 'play'; $('pause').hidden = true; Snd.music(true); }
}

export function pickPerk(i: number): boolean {
  if (!choosePerk(i)) return false;
  $('perks').hidden = true;
  return true;
}

export function showPerks(): void {
  $('perk-level').textContent = `УРОВЕНЬ ${G.p.level} · ЛАЙКИ ПРЕВРАТИЛИСЬ В ОПЫТ`;
  const list = $('perk-list'); list.textContent = '';
  G.perkChoices.forEach((pk, i) => {
    const have = G.taken[pk.id] ?? 0;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'perk';
    const k = document.createElement('kbd'); k.textContent = String(i + 1);
    const t = document.createElement('b'); t.textContent = pk.name;
    const d = document.createElement('span'); d.textContent = typeof pk.desc === 'string' ? pk.desc : pk.desc[have];
    b.append(k, t, d);
    const small = pk.ab ? `УР. ${have + 1} → ${have + 2}` : pk.max > 1 ? `${have}/${pk.max}` : '';
    if (small) { const s = document.createElement('small'); s.textContent = small; t.append(' ', s); }
    b.addEventListener('click', () => pickPerk(i));
    list.append(b);
  });
  $('perks').hidden = false;
  (list.firstChild as HTMLElement | null)?.focus();
}

/** Экран загрузки между уровнями: шутка, статистика уровня, полоска «генерации». */
export function showTransit(): void {
  const next = nextLevelDef(), mod = G.level + 1 >= LEVELS.length ? '· БЕСКОНЕЧНЫЙ РЕЖИМ' : `· ${G.level + 2} из ${LEVELS.length}`;
  const secs = Math.round(G.t - G.levelStart.t), kills = G.kills - G.levelStart.kills, likes = G.score - G.levelStart.score;
  $('transit-label').textContent = `ПЕРЕХОД ${mod}`;
  $('transit-name').textContent = next.name;
  $('transit-sub').textContent = next.sub;
  $('transit-stats').textContent = `Уровень пройден за ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · слопа убрано: ${kills} · лайков: ${likes} · лучшая серия: ${G.combo.best}`;
  const tips = next.loading, btn = $<HTMLButtonElement>('btn-transit'), bar = $('transit-bar');
  btn.disabled = true; bar.style.width = '0%';
  $('transit').hidden = false;
  const t0 = performance.now(), dur = 2600;
  const tickBar = (): void => {
    const k = Math.min(1, (performance.now() - t0) / dur);
    bar.style.width = `${Math.round(k * 100)}%`;
    $('transit-tip').textContent = `${tips[Math.min(tips.length - 1, Math.floor(k * tips.length))]} ${Math.round(k * 100)}%`;
    if (k < 1) requestAnimationFrame(tickBar);
    else { btn.disabled = false; btn.focus(); }
  };
  requestAnimationFrame(tickBar);
}
function enterNext(): void {
  if (G.state !== 'transit') return;
  $('transit').hidden = true;
  startNextLevel();
}

export function showGameOver(): void {
  Snd.music(false);
  setTimeout(() => {
    $('over-post').textContent = vpick(EPITAPHS)(G.wave);
    $('over-stats').textContent = stats();
    $('over').hidden = false;
    $('btn-restart').focus();
  }, 1100);
}

export function showVictory(): void {
  releaseFire();
  $('win-stats').textContent = stats();
  $('win').hidden = false; $('btn-continue').focus();
}

export function initScreens(h: ScreenHandlers): void {
  const start = (): void => { hideAll(); h.start(); };
  $('btn-start').addEventListener('click', start);
  $('btn-restart').addEventListener('click', start);
  $('btn-win-restart').addEventListener('click', start);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-transit').addEventListener('click', enterNext);
  $('btn-continue').addEventListener('click', () => { $('win').hidden = true; G.state = 'play'; banner('БЕСКОНЕЧНЫЙ РЕЖИМ', 'слоп возвращается сильнее', 2.4, P.pink); });
  for (const b of document.querySelectorAll('.snd-toggle')) b.addEventListener('click', toggleSound);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') togglePause(); });
}
