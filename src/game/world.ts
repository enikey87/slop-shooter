// Текущий забег и связь симуляции с внешним миром (звук, декали, экраны) через хуки.
// В тестах и симуляторе хуки остаются пустыми — игра крутится без DOM и WebAudio.
import type { Enemy, GameState, Player, Prop } from './state';
import type { LevelId } from '../content/levels';
import { createState } from './state';

export let G: GameState = createState(1);
export function setGame(g: GameState): void { G = g; }

export interface Hooks {
  sfx(name: string, gap?: number): void;
  /** трек босса или возврат к обычной музыке */
  bossMusic(on: boolean, track?: string): void;
  regularMusic(i: number): void;
  /** пятна на полу */
  splat(x: number, y: number, r: number, colors: readonly string[]): void;
  rubble(pr: Prop, colors: readonly string[]): void;
  /** враг рассыпался на пиксели */
  enemyDied(e: Enemy): void;
  heroDied(p: Player): void;
  perksOpened(): void;
  gameOver(): void;
  victory(): void;
  /** вошёл в портал: показать экран загрузки, потом вызвать startNextLevel() */
  transit(): void;
  /** начался уровень: перерисовать пол, сменить музыку */
  levelStart(id: LevelId): void;
  /** ошибка внутри симуляции, которую поймали и пережили */
  error(err: unknown, where: string): void;
}
const noop = (): void => {};
export const hooks: Hooks = {
  sfx: noop, bossMusic: noop, regularMusic: noop, splat: noop, rubble: noop,
  enemyDied: noop, heroDied: noop, perksOpened: noop, gameOver: noop, victory: noop, error: noop, transit: noop, levelStart: noop
};
export function setHooks(h: Partial<Hooks>): void { Object.assign(hooks, h); }
export const sfx = (name: string, gap?: number): void => hooks.sfx(name, gap);
/** Пойманные ошибки симуляции (для тестов и отладки). */
export const simErrors: string[] = [];
export function reportSimError(err: unknown, where: string): void {
  const msg = `${where}: ${err instanceof Error ? err.message : String(err)}`;
  if (simErrors.length < 50 && !simErrors.includes(msg)) simErrors.push(msg);
  hooks.error(err, where);
}
