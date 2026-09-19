// Шлёпа-босс: поведение общее с обычной шлёпой (enemies/behaviors.ts), здесь — кража пушки.
import { P } from '../../content/palette';
import { WEAPONS } from '../../content/weapons';
import { G, sfx } from '../world';
import { banner } from '../fx';
import { spawnPoint } from '../arena';
import { mkPickup } from '../pickups';
import { curSlot, cycleGun } from '../weapons';

export function stealGun(): void {
  const s = curSlot();
  if (s.id === 'makarov' || s.stolen) return;
  s.stolen = true; cycleGun(1);
  const sp = spawnPoint(170);
  G.pickups.push({ ...mkPickup(sp.x, sp.y, 'stolen'), gun: s.id, t: 9999 });
  banner('ШЛЁПА ОТОБРАЛА ПУШКУ', `${WEAPONS[s.id].name} — беги за ней`, 2, P.floppa); sfx('sus');
}
