import { describe, expect, it } from 'vitest';
import { start, run, fingerprint } from './helpers';

describe('детерминизм', () => {
  it('одинаковый seed и ввод дают одинаковый забег', () => {
    start(42); run(60); const a = fingerprint();
    start(42); run(60); const b = fingerprint();
    expect(a).toBe(b);
  });
  it('разные seed — разные забеги', () => {
    start(1); run(30); const a = fingerprint();
    start(2); run(30); const b = fingerprint();
    expect(a).not.toBe(b);
  });
});
