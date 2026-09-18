// Оружие игрока: основной и альтернативный огонь. Сама стрельба — в game/.
export interface WeaponDef {
  readonly name: string;
  readonly short: string;
  /** секунд между выстрелами */
  readonly rate: number;
  /** патронов в ящике */
  readonly pick: number;
  readonly sfx: string;
}
export interface AltDef { readonly name: string; readonly cd: number; readonly cost: number }

export const WEAPONS: readonly WeaponDef[] = [
  { name: 'МАКАРОВ', short: 'МАК', rate: .2, pick: 0, sfx: 'pistol' },
  { name: 'ДРОБОВИК НА 5 СТВОЛОВ', short: 'ДРОБ', rate: .5, pick: 40, sfx: 'shotgun' },
  { name: 'ПУЛЕМЁТ NEGATIVE PROMPT', short: 'ПУЛ', rate: .065, pick: 260, sfx: 'minigun' },
  { name: 'РАКЕТНИЦА JPEG', short: 'JPEG', rate: .5, pick: 18, sfx: 'rocket' },
  { name: 'ЛАЗЕР CTRL+Z', short: 'CTRLZ', rate: .05, pick: 220, sfx: 'laser' },
  { name: 'КАПЧА-ГРАНАТОМЁТ', short: 'КАПЧА', rate: .75, pick: 14, sfx: 'captcha' },
  { name: 'СТЕПЛЕР-АВТОМАТ', short: 'СТЕП', rate: .11, pick: 160, sfx: 'staple' },
  { name: 'ОГНЕМЁТ «ГОРЯЧИЙ ДУБЛЬ»', short: 'ОГОНЬ', rate: .04, pick: 300, sfx: 'flame' },
  { name: 'ТОМ БСЭ', short: 'БСЭ', rate: .65, pick: 16, sfx: 'book' },
  { name: 'РЕЛЬСОТРОН «ПЕРВОИСТОЧНИК»', short: 'РЕЛЬС', rate: 1, pick: 10, sfx: 'rail' },
  { name: 'КНОПКА «СГЕНЕРИРОВАТЬ ЕЩЁ»', short: 'ЕЩЁ', rate: .25, pick: 60, sfx: 'regen' },
  { name: 'ГИПЕРССЫЛКА', short: 'ССЫЛКА', rate: .4, pick: 60, sfx: 'zap' },
  { name: 'КЛАВИАТУРА-БУМЕРАНГ', short: 'КЛАВА', rate: .6, pick: 25, sfx: 'kbd' },
  { name: 'ПЫЛЕСОС ДАТАСЕТОВ', short: 'ПЫЛЕС', rate: .05, pick: 300, sfx: 'vac' },
  { name: 'МИНЫ «ПРИНЯТЬ COOKIES?»', short: 'COOKIE', rate: .45, pick: 12, sfx: 'mine' },
  { name: 'САМОНАВОДЯЩИЙСЯ ТАПОК', short: 'ТАПОК', rate: .35, pick: 40, sfx: 'slip' },
  { name: 'СНАЙПЕР-ТОКЕНИЗАТОР', short: 'ТОКЕН', rate: .8, pick: 20, sfx: 'snipe' },
  { name: 'ЭЛЕКТРОГИТАРА «КРИНЖ-РОК»', short: 'ГИТАРА', rate: .45, pick: 50, sfx: 'guitar' },
  { name: 'НЯН-ПУШКА', short: 'НЯН', rate: .5, pick: 25, sfx: 'nyan' }
];

export const ALT: readonly AltDef[] = [
  { name: 'КОНТРОЛЬНАЯ ОЧЕРЕДЬ', cd: 1.4, cost: 0 }, { name: 'ЖАКАН', cd: 1.2, cost: 3 }, { name: 'ТУРЕЛЬ', cd: 8, cost: 60 },
  { name: 'КАССЕТНЫЙ JPEG', cd: 2.5, cost: 3 }, { name: 'CTRL+SHIFT+Z', cd: 3, cost: 30 }, { name: 'КАПЧА-КОВЁР', cd: 4, cost: 3 },
  { name: 'ВЕЕР СКОБ', cd: 1.2, cost: 10 }, { name: 'СТЕНА ОГНЯ', cd: 3, cost: 40 }, { name: 'РАСКРЫТЬ КНИГУ', cd: 4, cost: 3 },
  { name: 'ТРОЙНОЙ ПЕРВОИСТОЧНИК', cd: 3, cost: 3 }, { name: 'ПЕРЕГЕНЕРИРОВАТЬ ВСЁ', cd: 6, cost: 10 }, { name: 'ОТКРЫТЬ В НОВОЙ ВКЛАДКЕ', cd: 3, cost: 10 },
  { name: 'ТРИ КЛАВИАТУРЫ', cd: 2.5, cost: 3 }, { name: 'ВЫДУВ', cd: 4, cost: 40 }, { name: 'ПОДОРВАТЬ ВСЕ', cd: .5, cost: 0 },
  { name: 'БАБУШКИН ВЕРТОЛЁТ', cd: 6, cost: 5 }, { name: 'КОНТЕКСТНОЕ ОКНО', cd: 2.5, cost: 3 }, { name: 'ПАУЭР-АККОРД', cd: 3, cost: 8 },
  { name: 'МЕГА-НЯН', cd: 4, cost: 5 }
];

/** Размеры пиксельных спрайтов пушек [ширина, высота]. */
export const GUN_SPECS: readonly (readonly [number, number])[] = [[11, 7], [16, 9], [17, 9], [17, 9], [16, 9], [16, 9], [13, 7], [17, 9], [12, 9], [20, 9], [14, 9], [15, 9], [14, 9], [17, 11], [14, 9], [13, 9], [22, 9], [18, 11], [15, 9]];
