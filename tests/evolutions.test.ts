import { describe, expect, it } from 'vitest';
import { EVOLUTIONS } from '../src/content/evolutions';
import type { WeaponId } from '../src/content/weapons';
import { G } from '../src/game/world';
import { takeWeapon, evolvable, evolve, weaponName } from '../src/game/inventory';
import { spawnFromPortal } from '../src/game/spawn';
import { killEnemy } from '../src/game/combat';
import { openPerks } from '../src/game/perks';
import { start, run } from './helpers';

const ids = Object.keys(EVOLUTIONS) as WeaponId[];

describe('эволюции', () => {
  it('нужны 5-й уровень и перк; босс роняет сундук, сундук эволюционирует пушку', () => {
    start(1);
    takeWeapon('mg');
    expect(evolvable()).toEqual([]);
    G.gunLvl.mg.lvl = 5;
    expect(evolvable()).toEqual([]);
    G.taken.finger = 1;
    expect(evolvable()).toEqual(['mg']);
    G.wave = 5;
    const b = spawnFromPortal({ x: 400, y: 200, type: 'jboss', elite: false });
    killEnemy(b);
    const chest = G.pickups.find(k => k.type === 'evo');
    expect(chest?.gun).toBe('mg');
    G.p.x = chest!.x; G.p.y = chest!.y;
    run(4, null); // заставка босса и стоп-кадр, потом подбор
    expect(G.evolved.mg).toBe(true);
    expect(weaponName('mg')).toBe(EVOLUTIONS.mg!.name);
  });
  it('перк, которого не хватает до эволюции, всегда среди вариантов', () => {
    start(2);
    takeWeapon('rocket'); G.gunLvl.rocket.lvl = 5;
    for (let i = 0; i < 20; i++) { G.state = 'play'; G.pendingPerks = 1; openPerks(); expect(G.perkChoices.some(pk => pk.id === 'mark')).toBe(true); }
  });
  it('каждая эволюция 8 секунд в бою без исключений', () => {
    for (const id of ids) {
      start(3);
      takeWeapon(id); G.gunLvl[id].lvl = 5; evolve(id);
      G.wave = 8; G.phase = 'inter'; G.interT = 0; G.mods.maxHp = G.p.hp = 1e6;
      expect(() => run(8), id).not.toThrow();
    }
    expect(G.allies.length).toBeGreaterThanOrEqual(0);
  });
  it('робот-пылесос появляется с эволюцией и ездит', () => {
    start(4);
    takeWeapon('vacuum'); evolve('vacuum');
    const r = G.allies.find(a => a.kind === 'robovac')!;
    expect(r).toBeTruthy();
    G.wave = 3; G.phase = 'inter'; G.interT = 0;
    const x0 = r.x; run(4);
    expect(r.x).not.toBe(x0);
  });
  it('серия убийств растёт и сбрасывается; босс даёт стоп-кадр', () => {
    start(5); G.wave = 5;
    const b = spawnFromPortal({ x: 400, y: 200, type: 'jboss', elite: false });
    killEnemy(b);
    expect(G.combo.n).toBeGreaterThanOrEqual(1); // вместе с апостолами
    expect(G.hitStop).toBeGreaterThan(0);
    run(6, null); // заставка босса 2,3 с + окно серии 2,5 с
    expect(G.combo.n).toBe(0);
  });
});
