// Звук игры: один синтезатор на приложение.
import { Synth } from './engine/audio/synth';
import { SFX } from './content/sfx';
import { makeSongs, REGULAR, BOSS_TRACKS } from './content/music';

export const Snd = new Synth(SFX, makeSongs, { regular: REGULAR, boss: BOSS_TRACKS });
