// Эволюции пушек (как в Vampire Survivors): пушка 5-го уровня + нужный перк → сундук босса превращает её в эволюцию.
import type { WeaponId } from './weapons';

export interface EvolutionDef {
  readonly perk: string;
  readonly name: string;
  readonly desc: string;
}
export const EVOLUTIONS: Partial<Record<WeaponId, EvolutionDef>> = {
  makarov: { perk: 'crit', name: 'НАГРАДНОЙ МАКАРОВ', desc: 'каждое 2-е попадание — контрольный, пробивает двоих' },
  mg: { perk: 'finger', name: 'ШЕСТИПАЛЫЙ ПУЛЕМЁТ', desc: 'раскрутка до ×3 и никогда не остывает' },
  flame: { perk: 'hater', name: 'ТОКСИЧНЫЙ ДУБЛЬ', desc: 'горение до 5 стаков, перекидывается дальше и чаще' },
  vacuum: { perk: 'magnet', name: 'РОБОТ-ПЫЛЕСОС', desc: 'робот сам ездит за слопом, жрёт пули и возит лут' },
  rail: { perk: 'filter', name: 'ПЕРВОИСТОЧНИК ИСТИНЫ', desc: 'заряд вдвое быстрее, попадание бьёт молнией соседей' },
  rocket: { perk: 'mark', name: 'JPEG 8K', desc: 'каждая ракета кассетная, взрыв шире' },
  nyan: { perk: 'double', name: 'НЯН-ГАЛАКТИКА', desc: 'на отскоке кот делится на котят' },
  captcha: { perk: 'cd', name: 'reCAPTCHA v∞', desc: 'оглушённые переходят на твою сторону на 4 с' }
};
