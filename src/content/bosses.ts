// Боссы: порядок появления, подписи фаз, промпты Мамы Промпт.
import type { EnemyId } from './enemies';

export const BOSSES: readonly EnemyId[] = ['jboss', 'mama', 'cboss', 'skboss', 'fboss', 'ouro', 'skuf'];

export const BOSS_SUB: Partial<Record<EnemyId, string>> = {
  jboss: 'Апостолы держат святой щит. Сначала апостолы', mama: 'Порождает слоп по описанию. Стреляй в промпт',
  cboss: 'Бомбит с высоты. Бей, когда пикирует', skboss: 'Сантехника окружила парковку. Сначала унитазы',
  fboss: 'Отбирает пушки и ест лут. Держи оружие крепче', ouro: 'Обучается на себе. Не дай доесть хвост',
  skuf: 'Это ты. Через 10 лет. Где-то лежит пульт'
};

export const PHASE_NAMES: Partial<Record<EnemyId, readonly [string, string, string]>> = {
  jboss: ['БЛАГОСЛОВЛЯЕТ', 'ЖАРЕНЫЙ', 'В КЛЯРЕ'], mama: ['ПЕЧАТАЕТ…', 'TEMPERATURE 2.0', 'ГАЛЛЮЦИНИРУЕТ'],
  cboss: ['БОМБАРДИРУЕТ', 'ПИКИРУЕТ', 'ГОРИТ'], skboss: ['ПОЁТ', 'СМЫВАЕТ', 'ЗАСОР'],
  fboss: ['ШЛЁПАЕТ', 'ДВОЙНОЙ ШЛЁП', 'ШЛЁПА ГНЕВАЕТСЯ'], ouro: ['ЖРЁТ ХВОСТ', 'ПЕРЕОБУЧАЕТСЯ', 'КОЛЛАПС'],
  skuf: ['ВОРЧИТ', 'ЗЕРКАЛИТ ТЕБЯ', 'ДИВАН И ЯРОСТЬ']
};

export interface MamaPrompt { readonly txt: string; readonly type?: EnemyId; readonly n: number; readonly loot?: 'ammo' | 'hp' | 'up'; readonly charm?: boolean }

export const MAMA_PROMPTS: readonly MamaPrompt[] = [
  { txt: '5 рук, фотореализм', type: 'hand', n: 5 }, { txt: 'котик, но их два', type: 'cat', n: 2 },
  { txt: 'акула в найках', type: 'shark', n: 2 }, { txt: 'балерина капучино', type: 'ballerina', n: 2 },
  { txt: 'грустный дед с тортом', type: 'grandpa', n: 1 }, { txt: 'тун тун тун сахур', type: 'tung', n: 2 },
  { txt: 'бомбардиро крокодило', type: 'croc', n: 1 }, { txt: 'спагетти, реалистично', type: 'spag', n: 3 },
  { txt: 'скибиди туалеты, много', type: 'skibidi', n: 4 }, { txt: 'доге, such много', type: 'doge', n: 2 },
  { txt: 'капибара, но злая', type: 'capy', n: 1 }, { txt: 'троллфейс', type: 'troll', n: 2 }, { txt: 'six seven', type: 'sixseven', n: 3 }
];

/** Во что превращается промпт, если его прострелить. */
export const MAMA_EDITS: readonly MamaPrompt[] = [
  { txt: 'патроны, много, 4k', loot: 'ammo', n: 3 }, { txt: 'трава, фотореализм', loot: 'hp', n: 2 },
  { txt: 'апскейл пушки, бесплатно', loot: 'up', n: 1 }, { txt: '5 рук, но за Гену', type: 'hand', n: 5, charm: true },
  { txt: 'котики на стороне Гены', type: 'cat', n: 2, charm: true }, { txt: 'скибиди, но добрые', type: 'skibidi', n: 3, charm: true }
];
