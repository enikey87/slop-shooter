import { describe, expect, it } from 'vitest';
import { WEAPONS, ALT } from '../src/content/weapons';
import { G } from '../src/game/world';
import { giveGun, shoot, altFire } from '../src/game/weapons';
import { addEnemy } from '../src/game/spawn';
import { start, run } from './helpers';

describe('оружие', () => {
  it('каждая пушка стреляет и тратит патроны, альт-огонь уходит на перезарядку', () => {
    start(5);
    for (let id = 1; id < WEAPONS.length; id++) giveGun(id);
    for (let i = 0; i < G.p.guns.length; i++) {
      const s = G.p.guns[i];
      s.ammo = 100;
      G.p.cur = i;
      const golem = addEnemy('golem', G.p.x + 40, G.p.y);
      const before = { b: G.bullets.length, beams: G.beams.length, mines: G.mines.length, ammo: s.ammo };
      shoot();
      const fired = G.bullets.length > before.b || G.beams.length > before.beams || G.mines.length > before.mines || golem.hp < golem.max;
      expect(fired, WEAPONS[s.id].name).toBe(true);
      if (s.id) expect(s.ammo).toBe(before.ammo - 1);
      altFire();
      expect(s.altCd, ALT[s.id].name).toBe(ALT[s.id].cd);
    }
    expect(() => run(5)).not.toThrow();
  });
});
