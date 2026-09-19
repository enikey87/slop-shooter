import { describe, expect, it } from 'vitest';
import { TYPES, enemyDef, type EnemyId } from '../src/content/enemies';
import { G } from '../src/game/world';
import { addEnemy, makeEnemy, applyTier } from '../src/game/spawn';
import { hitEnemy, killEnemy } from '../src/game/combat';
import { step } from '../src/game/sim';
import { idleInput } from '../src/game/input';
import { STEP } from '../src/engine/loop';
import { start, run } from './helpers';

const tick = (sec: number): void => { for (let i = 0; i < sec / STEP; i++) { if (G.state === 'perk') G.state = 'play'; step(STEP, idleInput()); } };
/** Бессмертный Геннадий, чтобы мерить урон, а не умирать. */
function god(): void { G.mods.maxHp = 1e6; G.p.hp = 1e6; G.phase = 'inter'; G.interT = 1e9; }

describe('архетипы врагов', () => {
  it('ступени: до 6-й волны только черновики, к 20-й есть все четыре', () => {
    start(1);
    G.wave = 3;
    expect(Array.from({ length: 200 }, () => makeEnemy('hand', 100, 100).tier).every(t => t === 0)).toBe(true);
    G.wave = 22;
    const tiers = new Set(Array.from({ length: 800 }, () => makeEnemy('hand', 100, 100).tier));
    expect([...tiers].sort()).toEqual([0, 1, 2, 3]);
    G.boss = null;
  });
  it('PRO лечится, голем на половине здоровья теряет вывеску и ускоряется', () => {
    start(2); god(); G.wave = 10;
    const pro = addEnemy('golem', 700, 100); applyTier(pro, 3);
    pro.hp = pro.max * .9; tick(1);
    expect(pro.hp).toBeGreaterThan(pro.max * .9);
    const g = addEnemy('golem', 100, 500), spd = g.spd;
    hitEnemy(g, g.max * .6, 0, 0, { noCrit: true }); tick(.1);
    expect(g.broken).toBe(true);
    expect(g.spd).toBeGreaterThan(spd);
  });
  it('стример добегает и взрывается', () => {
    start(3); god();
    const s = addEnemy('streamer', G.p.x + 60, G.p.y);
    tick(3);
    expect(s.dead).toBe(true);
    expect(G.p.hp).toBeLessThan(1e6);
  });
  it('Джоконда стреляет по стоящему игроку, а по ушедшему с линии — мимо', () => {
    start(4); god();
    const m = addEnemy('mona', G.p.x + 200, G.p.y); m.cd = 0;
    tick(2.5);
    expect(G.p.hp).toBeLessThan(1e6);
    start(4); god();
    const m2 = addEnemy('mona', G.p.x + 200, G.p.y); m2.cd = 0;
    // дождались фиксации прицела и отошли
    for (let i = 0; i < 1.2 / STEP; i++) step(STEP, idleInput());
    const hp = G.p.hp;
    for (let i = 0; i < 1 / STEP; i++) step(STEP, { ...idleInput(), my: 1 });
    expect(G.p.hp).toBe(hp);
  });
  it('принтер печатает руки, но не больше лимита', () => {
    start(5); god();
    const pr = addEnemy('printer', 600, 400); pr.cd = 0;
    tick(30);
    const kids = G.enemies.filter(e => e.master === pr).length;
    expect(kids).toBeGreaterThan(2);
    expect(kids).toBeLessThanOrEqual(6);
  });
  it('шаурма после смерти оставляет облако', () => {
    start(6); god();
    const s = addEnemy('shawa', 300, 300);
    killEnemy(s);
    expect(G.zones.some(z => z.kind === 'gas')).toBe(true);
  });
  it('все обычные враги всех ступеней вместе 15 секунд — без исключений', () => {
    start(7); god(); G.wave = 20;
    const ids = (Object.keys(TYPES) as EnemyId[]).filter(t => enemyDef(t).cost);
    ids.forEach((t, i) => { const e = addEnemy(t, 60 + (i * 97) % 680, 60 + (i * 53) % 440); applyTier(e, i % 4); e.disguised = false; });
    expect(() => run(15)).not.toThrow();
  });
});
