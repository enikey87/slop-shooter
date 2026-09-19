import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/content/bosses';
import { enemyDef } from '../src/content/enemies';
import { G } from '../src/game/world';
import { spawnFromPortal } from '../src/game/spawn';
import { killEnemy, destroyProp } from '../src/game/combat';
import { step } from '../src/game/sim';
import { STEP } from '../src/engine/loop';
import { idleInput } from '../src/game/input';
import { choosePerk } from '../src/game/perks';
import { start, run } from './helpers';

/** Снять «щиты» босса, чтобы проверить только фазы. */
function unshield(): void {
  for (const e of G.enemies) if (e.type === 'apostle' || e.type === 'oseg') killEnemy(e);
  for (const q of G.props.slice()) if (q.kind === 'toiletprop') destroyProp(q);
}
function tick(n = 1): void { for (let i = 0; i < n; i++) { if (G.state === 'perk') choosePerk(0); step(STEP, idleInput()); } }

describe('боссы', () => {
  for (const type of BOSSES) {
    it(`${type}: три фазы по порогам здоровья, затем смерть`, () => {
      start(7);
      G.wave = 20; G.phase = 'wave'; G.mods.maxHp = G.p.hp = 1e9;
      const b = spawnFromPortal({ x: 500, y: 300, type, elite: false });
      expect(G.boss).toBe(b);
      tick(200); // заставка
      unshield();
      const th = enemyDef(type).phases ?? [.66, .33];
      b.hp = b.max * (th[0] - .01); if (b.segs) b.segMax = 0;
      tick(2);
      expect(b.phase).toBe(1);
      b.hp = b.max * (th[1] - .01);
      tick(100); // неуязвимость прошлой смены фазы
      expect(b.phase).toBe(2);
      killEnemy(b);
      expect(G.boss).toBeNull();
      expect(G.pickups.length).toBeGreaterThanOrEqual(4);
    });
  }
  it('бой с каждым боссом 20 секунд не падает', () => {
    for (const type of BOSSES) {
      start(11);
      G.wave = 5; G.phase = 'wave'; G.queue = [];
      spawnFromPortal({ x: 500, y: 300, type, elite: false });
      expect(() => run(20)).not.toThrow();
    }
  });
});

describe('оглушение боссов', () => {
  it('спам капчей не держит босса оглушённым и неуязвимым вечно', () => {
    start(12);
    G.wave = 15; G.phase = 'wave'; G.mods.maxHp = G.p.hp = 1e9;
    const b = spawnFromPortal({ x: 500, y: 300, type: 'cboss', elite: false });
    tick(200);
    b.trans = 1.4;
    // оглушаем каждые 0,5 с 10 секунд подряд
    for (let i = 0; i < 20; i++) { b.stun = .8; tick(30); }
    expect(b.trans).toBeLessThanOrEqual(0);
    let free = 0;
    for (let i = 0; i < 20; i++) { b.stun = Math.max(b.stun, .8); tick(30); if (b.stun <= 0) free++; }
    expect(free).toBeGreaterThan(0);
  });
});
