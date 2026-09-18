// Выбор перка при повышении уровня: логика здесь, отрисовка карточек — в ui/.
import { P } from '../content/palette';
import { PERKS } from '../content/perks';
import { pick } from '../engine/rng';
import { G, hooks, sfx } from './world';
import { say } from './fx';

export function openPerks(): void {
  const avail = PERKS.filter(pk => (G.taken[pk.id] ?? 0) < pk.max);
  if (!avail.length) { G.pendingPerks = 0; return; }
  G.pendingPerks--;
  G.state = 'perk';
  const choices: typeof avail = [];
  while (choices.length < Math.min(3, avail.length)) { const c = pick(avail); if (!choices.includes(c)) choices.push(c); }
  G.perkChoices = choices;
  sfx('level');
  hooks.perksOpened();
}

export function choosePerk(i: number): boolean {
  if (G.state !== 'perk' || !G.perkChoices[i]) return false;
  const pk = G.perkChoices[i];
  pk.apply(G.mods, G.p, G.ab);
  G.p.hp = Math.min(G.mods.maxHp, G.p.hp);
  G.taken[pk.id] = (G.taken[pk.id] ?? 0) + 1;
  G.state = 'play';
  say(G.p.x, G.p.y - 30, pk.name, P.cyan, true);
  sfx('pickup');
  return true;
}
