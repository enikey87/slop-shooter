// Перки: модификаторы игрока и прокачка способностей.
export interface Mods {
  rate: number; dmg: number; proj: number; pierce: number; speed: number; maxHp: number; magnet: number; heal: number; crit: number;
  ebs: number; saves: number; dashCd: number; dashDmg: number; aura: number; ammo: number; cd: number; regen: number; likes: number; mark: boolean;
}
export const baseMods = (): Mods => ({ rate: 1, dmg: 1, proj: 0, pierce: 0, speed: 1, maxHp: 100, magnet: 1, heal: 1, crit: 0, ebs: 1, saves: 0, dashCd: 1, dashDmg: 0, aura: 0, ammo: 1, cd: 1, regen: 0, likes: 1, mark: false });

export type AbilityKey = 'q' | 'e' | 'r' | 'c' | 'v' | 'g';
export type AbilityLevels = Record<AbilityKey, number>;

export interface PerkDef {
  readonly id: string;
  readonly name: string;
  /** строка или описание следующего уровня для способностей */
  readonly desc: string | readonly string[];
  readonly max: number;
  readonly ab?: AbilityKey;
  apply(m: Mods, p: { hp: number }, ab: AbilityLevels): void;
}

export const PERKS: readonly PerkDef[] = [
  { id: 'finger', name: 'ШЕСТОЙ ПАЛЕЦ', desc: '+18% скорострельность. Палец не твой, но работает.', max: 3, apply: m => { m.rate *= 1.18; } },
  { id: 'double', name: 'ДВОЙНОЙ ПРОМПТ', desc: '+1 снаряд у Макарова, пулемёта, степлера, книги и ракетницы.', max: 2, apply: m => { m.proj++; } },
  { id: 'filter', name: 'КОНТЕНТ-ФИЛЬТР', desc: 'Пули и скобы пробивают ещё одного врага.', max: 3, apply: m => { m.pierce++; } },
  { id: 'coffee', name: 'КОФЕ 3 В 1', desc: '+12% к скорости бега.', max: 3, apply: m => { m.speed *= 1.12; } },
  { id: 'bag', name: 'КОЖАНЫЙ МЕШОК', desc: '+25 к максимуму реальности и сразу лечит на 25.', max: 3, apply: (m, p) => { m.maxHp += 25; p.hp += 25; } },
  { id: 'magnet', name: 'МАГНИТ ЛАЙКОВ', desc: 'Лут притягивается вдвое дальше.', max: 2, apply: m => { m.magnet *= 2; } },
  { id: 'grass', name: 'ТРОГАТЕЛЬ ТРАВЫ', desc: 'Трава, кофе и способность «Трава» лечат в 1,5 раза сильнее.', max: 2, apply: m => { m.heal *= 1.5; } },
  { id: 'crit', name: 'БУМАЖНАЯ КНИГА', desc: '15% шанс критического урона ×3. Первоисточники решают.', max: 3, apply: m => { m.crit += .15; } },
  { id: 'rl', name: 'RATE LIMIT', desc: 'Вражеские снаряды летят на 25% медленнее.', max: 2, apply: m => { m.ebs *= .75; } },
  { id: 'ctrls', name: 'CTRL+S', desc: 'Один раз переживёшь смерть и загрузишься с 40% реальности.', max: 2, apply: m => { m.saves++; } },
  { id: 'roll', name: 'КУВЫРКУН', desc: 'Кувырок чаще, а слоп на пути получает урон.', max: 2, apply: m => { m.dashCd *= .65; m.dashDmg += 6; } },
  { id: 'hater', name: 'ТОКСИЧНЫЙ КОММЕНТАТОР', desc: 'Аура вокруг тебя обжигает слоп.', max: 3, apply: m => { m.aura += 4; } },
  { id: 'ammo', name: 'ОПТОВИК', desc: '+50% патронов из ящиков.', max: 2, apply: m => { m.ammo *= 1.5; } },
  { id: 'cd', name: 'ТАЙМ-МЕНЕДЖМЕНТ', desc: 'Q и E перезаряжаются на 25% быстрее, блэкаут копится быстрее.', max: 2, apply: m => { m.cd *= .75; } },
  { id: 'regen', name: 'МЕДИТАЦИЯ', desc: '+1% реальности в секунду.', max: 2, apply: m => { m.regen += 1; } },
  { id: 'likes', name: 'ИНФЛЮЕНСЕР', desc: '+30% лайков и опыта.', max: 2, apply: m => { m.likes *= 1.3; } },
  { id: 'mark', name: 'СВОЙ ВОДЯНОЙ ЗНАК', desc: 'Помеченные тобой враги получают +25% урона.', max: 1, apply: m => { m.mark = true; } },
  { id: 'ab_q', ab: 'q', name: 'Q: WI-FI', max: 2, desc: ['Радиус +30%, оглушение 3,5 с.', 'Ещё и бьёт на 20 и разворачивает вражеские пули против них.'], apply: (_m, _p, ab) => { ab.q++; } },
  { id: 'ab_e', ab: 'e', name: 'E: ТРАВА', max: 2, desc: ['Зона больше, лечит 10%/с, держится 8 с.', 'Сорняки жгут слоп в зоне.'], apply: (_m, _p, ab) => { ab.e++; } },
  { id: 'ab_r', ab: 'r', name: 'R: БЛЭКАУТ', max: 2, desc: ['Копится на 35% быстрее, урон 60.', 'Урон 80, всех оглушает на 3 с, боссу 18%.'], apply: (_m, _p, ab) => { ab.r++; } },
  { id: 'ab_c', ab: 'c', name: 'C: ДЯДЯ ВАСЯ', max: 2, desc: ['Вася берёт дробовик и стоит 16 с.', 'Вася приходит с псом Шариком, тот кусает слоп.'], apply: (_m, _p, ab) => { ab.c++; } },
  { id: 'ab_v', ab: 'v', name: 'V: CTRL+Z', max: 2, desc: ['Откат на 5 с и половина магазина обратно.', 'На месте ухода остаётся точка сохранения — и взрывается.'], apply: (_m, _p, ab) => { ab.v++; } },
  { id: 'ab_g', ab: 'g', name: 'G: ПРОМПТ-ИНЪЕКЦИЯ', max: 2, desc: ['Радиус +40%, переубеждает на 10 с.', 'Переубеждённые взрываются, когда контекст сброшен.'], apply: (_m, _p, ab) => { ab.g++; } }
];
