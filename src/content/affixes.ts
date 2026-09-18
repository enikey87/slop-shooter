// Свойства элитных врагов.
import { P } from './palette';

export const AFFIX = {
  split:  { name: 'БЕСКОНЕЧНЫЙ СКРОЛЛ', color: P.cyan },
  shield: { name: 'ВОДЯНОЙ ЗНАК', color: P.white },
  toxic:  { name: 'ВИРУСНЫЙ', color: P.green },
  blink:  { name: 'ДИПФЕЙК', color: P.purple },
  fast:   { name: 'СПИДРАН', color: P.vest },
  magnet: { name: 'КЛИКБЕЙТ', color: P.red },
  bless:  { name: 'ЛАЙКНУТЫЙ', color: P.pink }
} as const;
export type AffixId = keyof typeof AFFIX;
