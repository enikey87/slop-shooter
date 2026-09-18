import { describe, expect, it } from 'vitest';
import { enemyDef } from '../src/content/enemies';
import { BOSSES } from '../src/content/bosses';
import { composition, bossOfWave } from '../src/game/waves';
import { start } from './helpers';

describe('волны', () => {
  it('босс каждые 5 волн, по порядку, скуф — седьмой', () => {
    expect(bossOfWave(4)).toBeNull();
    expect(bossOfWave(5)).toBe(BOSSES[0]);
    expect(bossOfWave(35)).toBe('skuf');
    expect(bossOfWave(40)).toBe(BOSSES[0]);
  });
  it('в боссовой волне ровно один босс, в обычной — ни одного', () => {
    start(3);
    for (let n = 1; n <= 35; n++) {
      const bosses = composition(n).filter(t => enemyDef(t).boss);
      expect(bosses.length, `волна ${n}`).toBe(n % 5 === 0 ? 1 : 0);
    }
  });
  it('враги не приходят раньше своей волны, волны растут', () => {
    start(4);
    let prev = 0;
    for (let n = 1; n <= 20; n++) {
      const list = composition(n);
      for (const t of list) if (!enemyDef(t).boss) expect(enemyDef(t).from ?? 1, `${t} в волне ${n}`).toBeLessThanOrEqual(n);
      if (n % 5) { expect(list.length).toBeGreaterThanOrEqual(prev * .6); prev = list.length; }
    }
  });
});
