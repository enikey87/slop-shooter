// Общая палитра игры.
export const P = {
  ink: '#1a1423', white: '#fff8ec', skin: '#f4b894', skinL: '#ffd8bd', skinD: '#c9826b',
  vest: '#ff7a1a', vestD: '#c4501a', stripe: '#ffe45c', jeans: '#4a6cc0', jeansD: '#2f4a8a', boot: '#3b2a22',
  hair: '#5a3a24', metal: '#4b4a57', metalL: '#8a8898', grey: '#a3a9b0', greyD: '#6f757d', greyL: '#d0d4d8',
  gold: '#f7c948', goldD: '#c08a1e', noodle: '#f2d16b', paper: '#efe6d2', paperD: '#c9bea6', red: '#e0413a', redD: '#a02a24',
  cyan: '#7fd6ff', cyanD: '#3a8fb8', green: '#5fbf5a', greenD: '#35803a', greenL: '#8fe08a', pink: '#ff8fc7', pinkD: '#c9588f', pinkL: '#ffc2e0',
  shrimp: '#ff8a5c', shrimpD: '#d0573a', brown: '#8a5a2b', brownL: '#b07a3f', tan: '#b87a55', pale: '#f0c9a8',
  shirt: '#d8d2c4', shirtD: '#a8a194', pants: '#3a3446', nail: '#ffe6e6', led: '#6dff9a', purple: '#9b8cff', purpleD: '#6b4fa8',
  shark: '#5b8fd8', sharkD: '#3d63a8', croc: '#5c9e3c', crocD: '#3d6e27', wood: '#9a6b3f', woodD: '#6e4a2a', woodL: '#c4935c',
  coffee: '#6b3f22', coffeeL: '#c8955f', suit: '#e8ecf0', suitD: '#aab2bd', horse: '#8b5a3c', horseD: '#5e3a26', cardigan: '#7a5c3a',
  banana: '#f5d742', bananaD: '#c9a92a', monkey: '#7a5230', cactus: '#4f9a4a', cactusD: '#356b33', capy: '#a0714a', capyD: '#734f31',
  orange: '#ff9a2e', floppa: '#d9b58a', floppaD: '#a8845c', doge: '#e8a94c', dogeD: '#b87a2e', dogeL: '#fbe3b8', toilet: '#eef2f5',
  toiletD: '#b9c3cc', sus: '#d8323a', susD: '#8e1f26', visor: '#9fe3ff', troll: '#f4f4f4', track: '#3553a8', trackD: '#233a7a',
  oiiaW: '#f2efe9', hairBlk: '#221c28', turtle: '#2a2433', turtleL: '#3d3548', tank: '#f0ede4', stain: '#c9b77a', bottle: '#3d7a3a',
  lab: '#d9b999', labD: '#a8835f', labF: '#f3dcc6', labP: '#f2a1b8', choc: '#5a3520', chocL: '#7a4b2e', pist: '#9cc95a', couch: '#8e3b2f', couchD: '#5e2720',
  muted: '#a79fb8', dim: '#6f6780', slot: '#3a3148'
} as const;
export type Color = typeof P[keyof typeof P];
