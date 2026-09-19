// Оружие игрока: основной и альтернативный огонь. Сама стрельба — в game/.
/** Класс — роль пушки: 1 табельное, 2 поток, 3 тяжёлое, 4 прикол. Слоты свободные (см. game/inventory.ts). */
export type WeaponClass = 1 | 2 | 3 | 4;
export const CLASS_NAME: Record<WeaponClass, string> = { 1: 'ТАБЕЛЬНОЕ', 2: 'ПОТОК', 3: 'ТЯЖЁЛОЕ', 4: 'ПРИКОЛ' };

export interface AltDef { readonly name: string; readonly cd: number; readonly cost: number }
export interface WeaponDef {
  readonly name: string;
  readonly short: string;
  readonly cls: WeaponClass;
  /** секунд между выстрелами */
  readonly rate: number;
  /** патронов в полном ящике (около 18 с огня для потока) */
  readonly box: number;
  /** расход патронов за выстрел */
  readonly perShot: number;
  readonly sfx: string;
  /** индекс спрайта в GUN_SPECS / content/sprites/guns.ts */
  readonly sprite: number;
  readonly role: string;
  readonly alt: AltDef;
  /** что даёт 3-й и 5-й уровень (показывается в баннере) */
  readonly lv3: string;
  readonly lv5: string;
}

export const WEAPONS = {
  makarov: { name: 'МАКАРОВ', short: 'МАК', cls: 1, rate: .18, box: 0, perShot: 0, sfx: 'pistol', sprite: 0, role: 'точность и ритм: каждое 3-е попадание подряд ×2',
    alt: { name: 'КОНТРОЛЬНАЯ ОЧЕРЕДЬ', cd: 1.4, cost: 0 }, lv3: 'пробивает одного врага', lv5: 'убийства заряжают блэкаут вдвое быстрее' },
  mg: { name: 'ПУЛЕМЁТ NEGATIVE PROMPT', short: 'ПУЛ', cls: 2, rate: .1, box: 220, perShot: 1, sfx: 'minigun', sprite: 2, role: 'раскрутка: держи — стреляет вдвое чаще',
    alt: { name: 'ТУРЕЛЬ', cd: 8, cost: 50 }, lv3: 'каждая 4-я пуля — скоба: пробивает и замедляет', lv5: 'ствол не остывает 2 секунды' },
  flame: { name: 'ОГНЕМЁТ «ГОРЯЧИЙ ДУБЛЬ»', short: 'ОГОНЬ', cls: 2, rate: .04, box: 180, perShot: .4, sfx: 'flame', sprite: 7, role: 'поджигает: горение стакается и перекидывается',
    alt: { name: 'СТЕНА ОГНЯ', cd: 3, cost: 20 }, lv3: 'сгоревшие взрываются', lv5: 'синее пламя жжёт сквозь водяной знак' },
  laser: { name: 'ЛАЗЕР CTRL+Z', short: 'CTRLZ', cls: 2, rate: .05, box: 180, perShot: .5, sfx: 'laser', sprite: 4, role: 'нагрев: урон по одной цели растёт до ×3',
    alt: { name: 'CTRL+SHIFT+Z', cd: 3, cost: 15 }, lv3: 'луч отражается от укрытия', lv5: 'нагрев переносится на новую цель' },
  vacuum: { name: 'ПЫЛЕСОС ДАТАСЕТОВ', short: 'ПЫЛЕС', cls: 2, rate: .05, box: 180, perShot: .5, sfx: 'vac', sprite: 13, role: 'всасывает вражеские снаряды, 5 штук = патрон тяжёлому',
    alt: { name: 'ВЫДУВ', cd: 4, cost: 20 }, lv3: 'тянет лут со всего экрана', lv5: 'всосанное летит обратно с уроном ×2' },
  shotgun: { name: 'ДРОБОВИК НА 5 СТВОЛОВ', short: 'ДРОБ', cls: 3, rate: .5, box: 20, perShot: 1, sfx: 'shotgun', sprite: 1, role: 'в упор ×1,5; пятый ствол бьёт за спину',
    alt: { name: 'РАСКРЫТЬ КНИГУ', cd: 4, cost: 1 }, lv3: 'каждый 3-й выстрел — жакан насквозь', lv5: 'задний ствол стреляет полной дробью' },
  rocket: { name: 'РАКЕТНИЦА JPEG', short: 'JPEG', cls: 3, rate: .5, box: 18, perShot: 1, sfx: 'rocket', sprite: 3, role: 'урон по площади, прямое попадание ×2',
    alt: { name: 'КАССЕТНЫЙ JPEG', cd: 2.5, cost: 2 }, lv3: 'артефакты сжатия замедляют', lv5: 'ракета доворачивает к толпе' },
  rail: { name: 'РЕЛЬСОТРОН «ПЕРВОИСТОЧНИК»', short: 'РЕЛЬС', cls: 3, rate: .3, box: 14, perShot: 1, sfx: 'rail', sprite: 9, role: 'держи — заряд до 40 урона, пробивает всё',
    alt: { name: 'ТРОЙНОЙ ПЕРВОИСТОЧНИК', cd: 3, cost: 3 }, lv3: 'токенизация: попадание рассыпается на осколки', lv5: 'полный заряд оглушает линию' },
  captcha: { name: 'КАПЧА-ГРАНАТОМЁТ', short: 'КАПЧА', cls: 3, rate: .75, box: 16, perShot: 1, sfx: 'captcha', sprite: 5, role: 'оглушает; оглушённые получают +30% урона',
    alt: { name: 'КАПЧА-КОВЁР', cd: 4, cost: 3 }, lv3: 'оглушённые молчат ещё 2 секунды', lv5: 'капча стирает вражеские снаряды' },
  slipper: { name: 'САМОНАВОДЯЩИЙСЯ ТАПОК', short: 'ТАПОК', cls: 4, rate: .35, box: 50, perShot: 1, sfx: 'slip', sprite: 15, role: 'не промахивается: для быстрых и летающих',
    alt: { name: 'БАБУШКИН ВЕРТОЛЁТ', cd: 6, cost: 5 }, lv3: 'рикошетит к следующей цели', lv5: 'отшлёпанный 2 секунды не атакует' },
  link: { name: 'ГИПЕРССЫЛКА', short: 'ССЫЛКА', cls: 4, rate: .4, box: 45, perShot: 1, sfx: 'zap', sprite: 11, role: 'цепная молния по рою',
    alt: { name: 'ОТКРЫТЬ В НОВОЙ ВКЛАДКЕ', cd: 3, cost: 6 }, lv3: '+2 прыжка', lv5: 'каждый прыжок оглушает' },
  keyboard: { name: 'КЛАВИАТУРА-БУМЕРАНГ', short: 'КЛАВА', cls: 4, rate: .6, box: 30, perShot: 1, sfx: 'kbd', sprite: 12, role: 'пробивает туда и обратно',
    alt: { name: 'ТРИ КЛАВИАТУРЫ', cd: 2.5, cost: 3 }, lv3: 'MIDI: на возврате бьёт звуком', lv5: 'после возврата кружит щитом' },
  nyan: { name: 'НЯН-ПУШКА', short: 'НЯН', cls: 4, rate: .5, box: 36, perShot: 1, sfx: 'nyan', sprite: 18, role: 'отскакивает от стен и укрытий',
    alt: { name: 'МЕГА-НЯН', cd: 4, cost: 5 }, lv3: 'радуга замедляет врагов', lv5: '+1 пробитие за каждый отскок' },
  mines: { name: 'МИНЫ «ПРИНЯТЬ COOKIES?»', short: 'COOKIE', cls: 4, rate: .45, box: 24, perShot: 1, sfx: 'mine', sprite: 14, role: 'ловушка: 15 урона по площади',
    alt: { name: 'ПОДОРВАТЬ ВСЕ', cd: .5, cost: 0 }, lv3: 'мины приманивают врагов', lv5: 'цепная реакция ×1,5' }
} as const satisfies Record<string, WeaponDef>;
export type WeaponId = keyof typeof WEAPONS;
export const weaponDef = (id: WeaponId): WeaponDef => WEAPONS[id];
export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];

/** Опыт пушки до уровней 2–5. Опыт = «вес» убитого врага (рука 1, голем 6, босс 40). */
export const LEVEL_KILLS = [0, 25, 80, 180, 320] as const;
/** Потолок опыта за одно убийство: босс сразу не докачивает пушку до конца. */
export const MAX_KILL_XP = 40;
export const MAX_GUN_LEVEL = 5;
/** Множители от уровня пушки: чётные уровни — цифры, нечётные — механики. */
export const levelDmg = (l: number): number => (l >= 4 ? 1.44 : l >= 2 ? 1.2 : 1);
export const levelRate = (l: number): number => (l >= 4 ? 1.15 : 1);

/** Размеры пиксельных спрайтов пушек [ширина, высота]. */
export const GUN_SPECS: readonly (readonly [number, number])[] = [[11, 7], [16, 9], [17, 9], [17, 9], [16, 9], [16, 9], [13, 7], [17, 9], [12, 9], [20, 9], [14, 9], [15, 9], [14, 9], [17, 11], [14, 9], [13, 9], [22, 9], [18, 11], [15, 9]];
