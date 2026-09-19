import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { PROPDEF } from '../src/content/props';
import { G } from '../src/game/world';
import { addEnemy, spawnFromPortal } from '../src/game/spawn';
import { killEnemy } from '../src/game/combat';
import { startNextLevel, enterLevel, EXIT_DELAY } from '../src/game/levels';
import { composition } from '../src/game/waves';
import { STANDUP_EVERY, FLUSH_EVERY, LASERS, laserState } from '../src/game/mechanics';
import { step } from '../src/game/sim';
import { idleInput } from '../src/game/input';
import { STEP } from '../src/engine/loop';
import { start, run } from './helpers';

const god = (): void => { G.mods.maxHp = 1e6; G.p.hp = 1e6; };
const ticks = (sec: number, input = idleInput()): void => { for (let i = 0; i < sec / STEP; i++) { if (G.state === 'perk') G.state = 'play'; step(STEP, input); } };

describe('уровни', () => {
  it('убил босса — остатки волны удалены, через передышку портал, вошёл — следующий уровень', () => {
    start(1); god(); G.wave = 5; G.phase = 'wave';
    const b = spawnFromPortal({ x: 600, y: 200, type: 'jboss', elite: false });
    const minion = addEnemy('golem', 100, 100);
    killEnemy(b);
    expect(minion.dead).toBe(true);
    expect(G.phase).toBe('exit');
    ticks(EXIT_DELAY + 4); // заставка босса 2,3 с + стоп-кадр + передышка
    expect(G.exit).not.toBeNull();
    G.p.x = G.exit!.x; G.p.y = G.exit!.y;
    ticks(.1);
    expect(G.state).toBe('transit');
    startNextLevel();
    expect(G.levelId).toBe('office');
    expect(G.props.some(pr => pr.kind === 'desk')).toBe(true);
    ticks(3);
    expect(G.wave).toBe(6);
  });
  it('после квартиры скуфа — бесконечный режим со случайным уровнем и модификатором', () => {
    start(2);
    for (let i = 0; i < LEVELS.length; i++) startNextLevel();
    expect(G.level).toBe(LEVELS.length);
    expect(G.mod).not.toBeNull();
  });
  it('у каждого уровня свой состав волн: в опенспейсе нет деда, в музее есть бабушки', () => {
    start(3);
    const office = Array.from({ length: 5 }, (_, i) => composition(6 + i % 4)).flat();
    expect(office.includes('grandpa')).toBe(false);
    const museum = Array.from({ length: 8 }, () => composition(21)).flat();
    expect(museum.includes('guard')).toBe(true);
  });
  for (const lv of LEVELS) {
    it(`${lv.id}: карта, механика и 25 секунд боя без исключений`, () => {
      start(4); god();
      G.level = LEVELS.indexOf(lv); G.levelId = lv.id; enterLevel();
      G.wave = G.level * 5 + 2;
      expect(G.props.length).toBeGreaterThan(3);
      for (const pr of G.props) expect(PROPDEF[pr.kind], pr.kind).toBeTruthy();
      expect(() => run(25)).not.toThrow();
    });
  }
  it('опенспейс: стендап замораживает врагов и запрещает стрелять', () => {
    start(5); god(); G.level = 1; G.levelId = 'office'; enterLevel(); G.phase = 'inter'; G.interT = 1e9;
    const e = addEnemy('golem', 600, 400);
    G.mech.t = STANDUP_EVERY - .05;
    ticks(.2);
    expect(e.stun).toBeGreaterThan(2);
    const b = G.bullets.length;
    ticks(.5, { ...idleInput(), fire: true, aim: { x: 300, y: 100 } });
    expect(G.bullets.length).toBe(b);
  });
  it('канализация: во время смыва вне мостков больно, на мостках — нет', () => {
    start(6); god(); G.level = 3; G.levelId = 'sewer'; enterLevel(); G.phase = 'inter'; G.interT = 1e9;
    G.mech.t = FLUSH_EVERY - .05;
    G.p.x = 100; G.p.y = 300; ticks(1);
    expect(G.p.hp).toBeLessThan(1e6);
    const hp = G.p.hp; G.p.x = 200; G.p.y = 300; ticks(1);
    expect(G.p.hp).toBe(hp);
  });
  it('музей: пересёк горящий луч — тревога и бабушки', () => {
    start(7); god(); G.level = 4; G.levelId = 'museum'; enterLevel(); G.phase = 'inter'; G.interT = 1e9;
    let t = 0; while (!laserState(0).on && t++ < 400) ticks(STEP);
    G.p.x = LASERS[0][0]; G.p.y = 300;
    ticks(1.2);
    expect(G.enemies.some(e => e.type === 'guard')).toBe(true);
  });
});
