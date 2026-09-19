import { describe, expect, it } from 'vitest';
import { WEAPONS, WEAPON_IDS, LEVEL_KILLS } from '../src/content/weapons';
import { G } from '../src/game/world';
import { takeWeapon, gunKill, offerWeapons, takeNear, curSlot } from '../src/game/inventory';
import { updateTrigger, altFire } from '../src/game/weapons';
import { addEnemy } from '../src/game/spawn';
import { STEP } from '../src/engine/loop';
import { start, run } from './helpers';

/** Подержать курок t секунд и отпустить (рельса стреляет на отпускании). */
function hold(t: number): void { for (let i = 0; i < t / STEP; i++) updateTrigger(STEP, true); updateTrigger(STEP, false); }

describe('оружие', () => {
  it('4 слота по классам, каждый класс в своём слоте', () => {
    start(5);
    expect(G.p.guns.length).toBe(4);
    for (const id of WEAPON_IDS) if (id !== 'makarov') {
      takeWeapon(id);
      expect(G.p.guns[WEAPONS[id].cls - 1]?.id).toBe(id);
    }
    expect(G.p.guns[0]?.id).toBe('makarov');
  });
  it('каждая пушка стреляет, тратит патроны и альт уходит на перезарядку', () => {
    for (const id of WEAPON_IDS) {
      start(5);
      takeWeapon(id);
      const s = curSlot(), golem = addEnemy('golem', G.p.x + 40, G.p.y);
      G.p.ang = 0;
      const before = { b: G.bullets.length, beams: G.beams.length, mines: G.mines.length, ammo: s.ammo };
      hold(.8);
      const fired = G.bullets.length > before.b || G.beams.length > before.beams || G.mines.length > before.mines || golem.hp < golem.max;
      expect(fired, id).toBe(true);
      if (id !== 'makarov') expect(s.ammo, id).toBeLessThan(before.ammo);
      s.altCd = 0; s.ammo = 1000;
      altFire();
      expect(s.altCd, id).toBe(WEAPONS[id].alt.cd);
    }
  });
  it('уровень растёт от убийств этой пушкой и хранится у типа', () => {
    start(6);
    takeWeapon('mg');
    for (let i = 0; i < LEVEL_KILLS[2]; i++) gunKill('mg');
    expect(G.gunLvl.mg.lvl).toBe(3);
    takeWeapon('flame');
    takeWeapon('mg');
    expect(G.gunLvl.mg.lvl).toBe(3);
  });
  it('ящик предлагает две пушки разных классов; взял одну — вторая исчезает; старая падает на пол', () => {
    start(8);
    takeWeapon('mg');
    offerWeapons(G.p.x, G.p.y, 2);
    const offer = G.pickups.filter(k => k.type === 'weapon');
    expect(offer.length).toBe(2);
    expect(WEAPONS[offer[0].gun!].cls).not.toBe(WEAPONS[offer[1].gun!].cls);
    const flow = offer.find(k => WEAPONS[k.gun!].cls === 2) ?? offer[0];
    G.p.x = flow.x; G.p.y = flow.y;
    takeNear();
    expect(G.pickups.filter(k => k.type === 'weapon' && k.t > 0 && k.group).length).toBe(0);
    if (WEAPONS[flow.gun!].cls === 2 && flow.gun !== 'mg') expect(G.pickups.some(k => k.type === 'weapon' && k.gun === 'mg' && k.t > 0)).toBe(true);
  });
  it('взрывы задевают летающих', () => {
    start(9);
    takeWeapon('rocket');
    const croc = addEnemy('croc', G.p.x + 60, G.p.y);
    G.p.ang = 0;
    hold(.1);
    run(1, null);
    expect(croc.hp).toBeLessThan(croc.max);
  });
  it('5 секунд боя каждой пушкой на ур. 5 без исключений', () => {
    for (const id of WEAPON_IDS) {
      start(10);
      takeWeapon(id); G.gunLvl[id].lvl = 5;
      G.wave = 6; G.phase = 'inter'; G.interT = 0;
      expect(() => run(5), id).not.toThrow();
    }
  });
});
