import { describe, expect, it } from 'vitest';
import { G } from '../src/game/world';
import { start, run } from './helpers';

describe('забег ботом', () => {
  it('3 минуты игры без исключений, волны идут, враги умирают', () => {
    start(123);
    run(180);
    expect(G.wave).toBeGreaterThan(2);
    expect(G.kills).toBeGreaterThan(20);
  });
});
