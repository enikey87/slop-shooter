// Уровни забега: 4 волны + босс на каждом. Абсурд нарастает от парковки до квартиры скуфа.
import type { EnemyId } from './enemies';

export type LevelId = 'parking' | 'office' | 'dacha' | 'sewer' | 'museum' | 'latent' | 'apartment';
/** Механика уровня — game/mechanics/*.ts. */
export type MechanicId = 'standup' | 'garden' | 'flush' | 'lasers' | 'reshuffle' | 'buckwheat';

export interface LevelDef {
  readonly id: LevelId;
  readonly name: string;
  /** подзаголовок на карточке уровня */
  readonly sub: string;
  /** градус абсурда 1…7: кривизна HUD, мутации врагов, глитчи пола */
  readonly absurd: number;
  /** трек из обычного плейлиста */
  readonly music: string;
  readonly boss: EnemyId;
  readonly mechanic?: MechanicId;
  /** множители весов врагов в волнах этого уровня */
  readonly weights: Partial<Record<EnemyId, number>>;
  /** враги, которые водятся только здесь: их вес */
  readonly locals?: Partial<Record<EnemyId, number>>;
  /** шутки экрана загрузки */
  readonly loading: readonly string[];
}

export const LEVELS: readonly LevelDef[] = [
  { id: 'parking', name: 'ПАРКОВКА У ДАТАЦЕНТРА', sub: 'здесь всё началось. пахнет перегретыми видеокартами', absurd: 1, music: 'main', boss: 'jboss',
    weights: { hand: 1.5, cat: 1.3, skibidi: 1.2 },
    loading: ['прогреваем серверы…', 'считаем пальцы: 5… 6… 7…', 'подключаем реальность к зарядке'] },
  { id: 'office', name: 'ОПЕНСПЕЙС СТАРТАПА', sub: 'у нас нет иерархии, но есть комбуча', absurd: 2, music: 'disco', boss: 'mama', mechanic: 'standup',
    weights: { sigma: 2.5, doge: 1.8, mona: 1.6, sixseven: 1.4, printer: 1.5, grandpa: 0 },
    loading: ['синхронизируем OKR с вайбом…', 'ставим пуфики в agile-порядок', 'раунд инвестиций: 43%'] },
  { id: 'dacha', name: 'ДАЧА ДЯДИ ВАСИ', sub: 'шесть соток и шесть пальцев', absurd: 3, music: 'polka', boss: 'cboss', mechanic: 'garden',
    weights: { quadro: 2.2, chimp: 2, labubu: 1.6, capy: 1.6, croc: 1.5, sigma: .4 },
    loading: ['копаем картошку нейросетью…', 'дядя Вася ищет второй сапог', 'топим баню промптами'] },
  { id: 'sewer', name: 'КАНАЛИЗАЦИЯ СКИБИДИ', sub: 'осторожно: регулярный смыв', absurd: 4, music: 'phonk', boss: 'skboss', mechanic: 'flush',
    weights: { skibidi: 3, shawa: 2.2, streamer: 1.8, amogus: 1.5, cat: .5 },
    loading: ['прочищаем латентный стояк…', 'ес ес ес ес', 'скачиваем воду: 67%'] },
  { id: 'museum', name: 'МУЗЕЙ НЕЙРОИСКУССТВА', sub: 'руками не трогать. у экспонатов их по шесть', absurd: 5, music: 'lofi', boss: 'fboss', mechanic: 'lasers',
    weights: { mona: 2.5, printer: 1.6, ballerina: 2, jesus: 1.8, hand: .6 },
    locals: { guard: 2.4 },
    loading: ['вешаем картины вверх ногами…', 'бабушки-смотрительницы на позициях', 'реставрируем Мону: +1 палец'] },
  { id: 'latent', name: 'ЛАТЕНТНОЕ ПРОСТРАНСТВО', sub: 'реальность на 0,3 температуры', absurd: 6, music: 'synthwave', boss: 'ouro', mechanic: 'reshuffle',
    weights: { troll: 2.2, oiia: 2, lirili: 2, sixseven: 1.8, horse: 1.5 },
    loading: ['денойзим реальность… шаг 4 из ∞', 'веса перемешаны. ваши тоже', 'загрузка загрузки…'] },
  { id: 'apartment', name: 'КВАРТИРА СКУФА', sub: 'ты — маленький. диван — горный хребет', absurd: 7, music: 'hardbass', boss: 'skuf', mechanic: 'buckwheat',
    weights: { golem: 1.6, patapim: 1.8, floppa: 1.8, shawa: 1.6, streamer: 1.5, tung: 1.5 },
    loading: ['варим гречку в масштабе 1:100…', 'ищем пульт… не найден', 'скуф смотрит телевизор. телевизор смотрит на тебя'] }
];

/** Модификаторы бесконечного режима: уровень случайный, правило — на карточке. */
export interface EndlessMod { readonly id: 'hands' | 'turbo' | 'glass' | 'mirror'; readonly name: string; readonly sub: string }
export const ENDLESS_MODS: readonly EndlessMod[] = [
  { id: 'hands', name: 'ВСЕ ВРАГИ — РУКИ', sub: 'рук много. очень много' },
  { id: 'turbo', name: 'ГРАВИТАЦИЯ 2.0', sub: 'враги быстрее на 40%' },
  { id: 'glass', name: 'СТЕКЛЯННАЯ РЕАЛЬНОСТЬ', sub: 'урон ×2 — и твой, и по тебе' },
  { id: 'mirror', name: 'ЗЕРКАЛЬНЫЙ МИР', sub: 'управление наоборот, но только по горизонтали' }
];

/** Волн на уровень, последняя — босс. */
export const WAVES_PER_LEVEL = 5;
