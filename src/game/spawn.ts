// Создание врагов, порталов и свиты боссов.
import { P } from '../content/palette';
import { enemyDef, TYPES, SEG_SKINS, type EnemyId } from '../content/enemies';
import { AFFIX, type AffixId } from '../content/affixes';
import { BOSS_SUB } from '../content/bosses';
import { TIERS, tierOdds } from '../content/tiers';
import { TAU } from '../engine/math';
import { random, pick } from '../engine/rng';
import { G, hooks, sfx } from './world';
import { say, burst } from './fx';
import { makeProp, spawnPoint } from './arena';
import type { Enemy } from './state';

/** Трек, который включается на каждого босса. */
const BOSS_TRACK: Partial<Record<EnemyId, string>> = { jboss: 'bossOrgan', mama: 'bossGlitch', cboss: 'bossMetal', skboss: 'bossSkibidi', fboss: 'bossPhonk', ouro: 'bossGlitch', skuf: 'hardbass' };

export const eliteChance = (): number => (G.wave < 4 ? 0 : Math.min(.28, .05 + G.wave * .012));

export function makeEnemy(type: EnemyId, x: number, y: number, elite = false): Enemy {
  // здоровье растёт с волной медленнее, чем раньше (4,5% вместо 6%): часть сложности несут ступени
  const T = enemyDef(type), n = Math.max(1, G.wave), hpMul = 1 + (n - 1) * .045 + Math.max(0, n - 15) * .03;
  const e: Enemy = {
    type, x, y, r: T.r, hy: T.hy, hr: T.hr, hp: T.hp * hpMul, max: T.hp * hpMul, alt: T.fly || 0, z: 0,
    spd: T.spd * (1 + Math.min(.35, n * .018)) * (.9 + random() * .2), heavy: !!T.heavy,
    dmg: T.dmg * (1 + n * .012), score: T.score, t: random() * 10, face: 1, hitCd: 0, cd: 1 + random() * 2, kx: 0, ky: 0, flash: 0, atk: 0,
    variant: (random() * 4) | 0, elite: false, aff: null, affT: 1 + random(), stun: 0, slowT: 0, shield: 0, trail: [],
    state: 'walk', st: 0, orbit: random() * TAU, charm: 0, calm: 0, vis: 1, phase: 0, tier: 0
  };
  if (!T.boss && T.cost) applyTier(e, rollTier(n));
  if (type === 'amogus') e.disguised = true;
  if (type === 'ouro' || type === 'oseg') e.noSep = true;
  if (elite && !T.boss) {
    e.elite = true; e.hp *= 2; e.max *= 2; e.score *= 3;
    e.aff = pick((Object.keys(AFFIX) as AffixId[]).filter(k => !(k === 'blink' && T.fly)));
    if (e.aff === 'shield') e.shield = e.max * .6;
    if (e.aff === 'fast') e.spd *= 1.8;
  }
  if (T.boss) {
    const cycle = Math.floor((n - 1) / 30);
    e.hp = e.max = T.hp * (1 + cycle * .8) + n * 25; e.bossName = T.boss; G.boss = e;
    sfx('boss'); hooks.bossMusic(true, BOSS_TRACK[type]);
  }
  return e;
}
/** makeEnemy + добавить на арену. */
export function addEnemy(type: EnemyId, x: number, y: number, elite = false): Enemy {
  const e = makeEnemy(type, x, y, elite);
  G.enemies.push(e);
  return e;
}

function rollTier(n: number): number {
  const [f, k, pro] = tierOdds(n), r = random();
  return r < pro ? 3 : r < pro + k ? 2 : r < pro + k + f ? 1 : 0;
}
/** Ступень: здоровье, скорость, урон. Трюк вида включают поведения по e.tier. */
export function applyTier(e: Enemy, tier: number): void {
  const t = TIERS[tier];
  e.tier = tier; e.hp *= t.hp; e.max *= t.hp; e.spd *= t.spd; e.dmg *= t.dmg; e.score = Math.round(e.score * (1 + tier * .5));
}

export function spawnPortal(type: EnemyId, x: number, y: number, t = .9, elite?: boolean): void {
  G.portals.push({ x, y, type, t, max: t, elite: elite ?? random() < eliteChance() });
  sfx('portal', .08);
}

export function spawnOuroSegments(head: Enemy): void {
  let prev = head;
  head.segs = [];
  for (let i = 0; i < 14; i++) {
    const s = addEnemy('oseg', head.x - (i + 1) * 11, head.y);
    s.skin = pick(SEG_SKINS); s.leader = prev; s.head = head; s.cd = 2 + random() * 4;
    s.hp = s.max = TYPES.oseg.hp * (1 + (G.wave - 1) * .05);
    head.segs.push(s); prev = s;
  }
  head.segMax = head.segs.reduce((a, s) => a + s.max, 0);
}

export function spawnApostles(B: Enemy): void {
  for (let i = 0; i < 6; i++) { const a = addEnemy('apostle', B.x, B.y); a.master = B; a.oa = i / 6 * TAU; a.cd = 2 + i * .5; a.noSep = true; }
  say(B.x, B.y - 80, 'АПОСТОЛЫ, КО МНЕ', P.gold, true);
}

export function spawnToilets(n: number): void {
  const alive = G.props.filter(q => q.kind === 'toiletprop').length;
  for (let i = alive; i < n; i++) {
    const sp = spawnPoint(110), pr = makeProp('toiletprop', sp.x - 6, sp.y - 3, 1 + G.wave / 40);
    pr.sp = 2 + i * 1.5;
    G.props.push(pr);
    burst(sp.x, sp.y - 6, [P.cyan, P.white], 16, 60);
  }
}

/** Портал догенерировался — враг появляется. */
export function spawnFromPortal(po: { x: number; y: number; type: EnemyId; elite: boolean; mama?: boolean; charm?: boolean }): Enemy {
  const ne = addEnemy(po.type, po.x, po.y, po.elite);
  if (po.type === 'amogus' && po.mama) ne.disguised = false;
  burst(po.x, po.y - 4, [P.pink, P.cyan], 12, 50);
  if (po.charm) ne.charm = 10;
  if (ne.type === 'ouro') spawnOuroSegments(ne);
  if (enemyDef(ne.type).boss) {
    G.intro = { name: enemyDef(ne.type).boss!, sub: BOSS_SUB[ne.type] ?? '', t: 2.3, max: 2.3 };
    if (ne.type === 'jboss') spawnApostles(ne);
    if (ne.type === 'skboss') spawnToilets(3);
  }
  return ne;
}
