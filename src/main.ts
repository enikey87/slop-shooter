// Точка входа: собирает симуляцию, рендер, звук и UI в одно приложение.
import { isTouch, $ } from './platform';
import { Snd } from './audio';
import { R, clamp } from './engine/math';
import { random } from './engine/rng';
import { startLoop } from './engine/loop';
import { buildSprites } from './render/sprites';
import { resize, view } from './render/canvas';
import { buildFloor, splat, rubble } from './render/floor';
import { enemyDied, heroDied } from './render/effects';
import { draw } from './render/draw';
import { G, setHooks } from './game/world';
import { WW, WH } from './game/state';
import { newGame, step } from './game/sim';
import { spawnPoint } from './game/arena';
import { addEnemy, spawnOuroSegments } from './game/spawn';
import { takeWeapon, startingOffer } from './game/inventory';
import { hitEnemy, damageProp } from './game/combat';
import type { EnemyId } from './content/enemies';
import type { WeaponId } from './content/weapons';
import { initInput, readTick } from './ui/input';
import { initTouchbar, updateTouchbar } from './ui/touchbar';
import { initScreens, showPerks, showGameOver, showVictory, togglePause, toggleSound, pickPerk } from './ui/screens';

if (isTouch) { $('keys-desktop').hidden = true; $('keys-touch').hidden = false; }

setHooks({
  sfx: (name, gap) => Snd.play(name, gap),
  bossMusic: (on, track) => Snd.bossMode(on, 0, track),
  regularMusic: i => Snd.regular(i),
  splat, rubble, enemyDied, heroDied,
  perksOpened: showPerks,
  gameOver: showGameOver,
  victory: showVictory,
  error: (err, where) => reportError(err, `tick:${where}`)
});

/** ?seed=123 в URL — воспроизводимый забег. */
const urlSeed = Number(new URLSearchParams(location.search).get('seed')) || 0;
const freshSeed = (): number => urlSeed || (Math.random() * 2 ** 32) >>> 0;

function syncView(): void { G.view.w = view.VW; G.view.h = view.VH; }

function startRun(): void {
  Snd.init();
  newGame(freshSeed());
  syncView();
  buildFloor();
  startingOffer();
  Snd.regular(0); Snd.bossMode(false); Snd.music(true);
}

const ATTRACT: EnemyId[] = ['hand', 'hand', 'cat', 'spag', 'shark', 'ballerina', 'tung', 'grandpa', 'croc', 'horse', 'golem', 'jesus', 'skibidi', 'doge', 'capy', 'floppa', 'patapim', 'chimp', 'lirili', 'amogus', 'sixseven'];
function attractMode(): void {
  newGame(freshSeed());
  syncView();
  buildFloor();
  G.state = 'attract'; G.wave = 1;
  for (const t of ATTRACT) { const sp = spawnPoint(30); addEnemy(t, sp.x, sp.y, random() < .15).disguised = false; }
  G.boss = null;
  G.cam.x = R(view.VW < WW ? clamp(G.p.x - view.VW / 2, 0, WW - view.VW) : (WW - view.VW) / 2);
  G.cam.y = R(view.VH < WH ? clamp(G.p.y - view.VH / 2, 0, WH - view.VH) : (WH - view.VH) / 2);
}

function boot(): void {
  buildSprites();
  resize();
  addEventListener('resize', () => { resize(); syncView(); });
  initInput({
    playing: () => G.state === 'play',
    sound: toggleSound,
    nextTrack: () => { Snd.init(); Snd.next(); },
    pause: () => { if (G.state === 'play' || G.state === 'pause') togglePause(); },
    perk: i => G.state === 'perk' && pickPerk(i),
    blur: () => { if (G.state === 'play') togglePause(); }
  });
  initTouchbar();
  initScreens({ start: startRun });
  Snd.onTrack = name => { G.toast = { txt: '♪ ' + name, t: 3.5 }; };
  attractMode();
  startLoop({
    tick: dt => step(dt, readTick()),
    frame: dt => { updateTouchbar(dt); draw(); },
    onError: reportError
  });
}

/** Ошибка в тике или кадре: игра продолжается, отчёт — в консоль и window.__slopErrors (seed + время, чтобы воспроизвести). */
const errors: { where: string; msg: string; seed: number; t: number; wave: number; n: number }[] = [];
function reportError(err: unknown, where: string): void {
  const msg = err instanceof Error ? err.message : String(err);
  const known = errors.find(e => e.msg === msg && e.where === where);
  if (known) { known.n++; return; }
  errors.push({ where, msg, seed: G.seed, t: +G.t.toFixed(2), wave: G.wave, n: 1 });
  console.error(`[slop] ошибка в ${where}, игра продолжается. seed=${G.seed} t=${G.t.toFixed(2)} волна=${G.wave}`, err);
  G.toast = { txt: '⚠ поймали ошибку — игра продолжается', t: 3 };
}

// Отладка и smoke-тесты из консоли браузера.
declare global { interface Window { __slop: () => typeof G; __slopDebug: unknown; __slopErrors: typeof errors } }
window.__slop = () => G;
window.__slopErrors = errors;
window.__slopDebug = {
  makeEnemy: (t: EnemyId, x: number, y: number, el: boolean) => addEnemy(t, x, y, el),
  giveGun: takeWeapon, lvl: (id: WeaponId, l: number) => { G.gunLvl[id].lvl = l; }, PROPS: () => G.props, spawnSeg: spawnOuroSegments, snd: () => Snd.debug,
  hit: (e: Parameters<typeof hitEnemy>[0], d: number) => hitEnemy(e, d, 0, 0, { noCrit: true }),
  hitProp: damageProp
};

const fontsReady = document.fonts?.load ? Promise.race([
  Promise.all([document.fonts.load(`8px 'Press Start 2P'`), document.fonts.load(`800 14px 'JetBrains Mono'`)]),
  new Promise(r => setTimeout(r, 1500))
]) : Promise.resolve();
fontsReady.then(boot, boot);
