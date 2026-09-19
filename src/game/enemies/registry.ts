// Кто как себя ведёт. Враги без записи просто идут на игрока (голем, кот, котята, лошадь).
import type { EnemyId } from '../../content/enemies';
import type { Behavior } from './types';
import * as B from './behaviors';
import { jboss } from '../bosses/jboss';
import { mama } from '../bosses/mama';
import { cboss } from '../bosses/cboss';
import { skboss } from '../bosses/skboss';
import { ouro, oseg } from '../bosses/ouro';
import { skuf } from '../bosses/skuf';

export const BEHAVIORS: Partial<Record<EnemyId, Behavior>> = {
  hand: B.hand, spag: B.spag, shark: B.shark, croc: B.croc, tung: B.tung, ballerina: B.ballerina, grandpa: B.grandpa,
  horseFree: B.horseFree, skibidi: B.skibidi, chimp: B.chimp, amogus: B.amogus, doge: B.doge, capy: B.capy, troll: B.troll,
  patapim: B.patapim, lirili: B.lirili, apostle: B.apostle, oiia: B.oiia, sigma: B.sigma, quadro: B.quadro, labubu: B.labubu,
  evasya: B.evasya, sixseven: B.sixseven, floppa: B.floppa, fboss: B.floppa, jesus: B.jesus,
  streamer: B.streamer, mona: B.mona, printer: B.printer, shawa: B.shawa,
  jboss, mama, cboss, skboss, ouro, oseg, skuf
};
