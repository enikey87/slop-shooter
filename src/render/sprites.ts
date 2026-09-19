// Реестр всех спрайтов: строится один раз при запуске из процедурных функций в content/sprites.
import { sheet, type Sheet } from '../engine/gfx/sheet';
import { sign } from '../engine/gfx/pixel';
import { P } from '../content/palette';
import { GUN_SPECS } from '../content/weapons';
import { buildGun, type GunSprite } from '../content/sprites/guns';
import * as H from '../content/sprites/hero';
import * as E from '../content/sprites/enemies';
import * as I from '../content/sprites/items';

function build() {
  return {
    heroIdle: sheet(18, 24, 2, (g, f) => H.sHero(g, f, 'idle'), 9, 22),
    heroWalk: sheet(18, 24, 4, (g, f) => H.sHero(g, f, 'walk'), 9, 22),
    hand: [6, 7, 9, 12].map(n => sheet(19, 19, 4, (g, f) => E.sHand(g, f, n), 7, 14)),
    cat: sheet(27, 19, 4, (g, f) => E.sCat(g, f, 1), 12, 17),
    kitten: sheet(19, 14, 4, (g, f) => E.sCat(g, f, .66), 8, 12),
    spag: sheet(19, 26, 5, (g, f) => E.sSpag(g, f % 4, f === 4), 9, 24),
    golem: sheet(25, 32, 4, E.sGolem, 12, 30),
    jesus: sheet(30, 35, 4, E.sJesus, 16, 33),
    halo: sheet(17, 7, 2, E.sHalo, 8, 3, true),
    shark: sheet(27, 20, 5, E.sShark, 12, 18),
    croc: sheet(32, 20, 4, E.sCroc, 15, 10),
    tung: sheet(23, 28, 4, E.sTung, 8, 26),
    ballerina: sheet(17, 25, 4, E.sBallerina, 8, 23),
    horse: sheet(23, 31, 4, E.sHorse, 11, 29),
    horseFree: sheet(22, 17, 4, E.sHorseFree, 11, 15),
    grandpa: sheet(20, 25, 4, E.sGrandpa, 9, 23),
    mama: sheet(46, 42, 4, E.sMama, 23, 40),
    bomb: sheet(7, 9, 1, I.sBomb, 3, 8),
    cab: sheet(18, 30, 3, I.sCab, 0, 0),
    barrel: sheet(11, 15, 1, I.sBarrel, 0, 0),
    vend: sheet(17, 29, 2, I.sVend, 0, 0),
    ammo: sheet(13, 12, 1, I.sAmmo, 6, 11),
    grass: sheet(13, 12, 2, I.sGrass, 6, 11),
    disk: sheet(12, 12, 2, I.sDisk, 6, 11),
    gunbox: sheet(14, 12, 2, I.sGunBox, 7, 11),
    coffee: sheet(9, 10, 2, I.sCoffee, 4, 9),
    cone: sheet(10, 10, 1, I.sCone, 5, 9),
    book: sheet(9, 7, 1, I.sBook, 4, 3),
    captcha: sheet(7, 7, 1, I.sCaptcha, 3, 3),
    patapim: sheet(23, 28, 4, E.sPatapim, 11, 27),
    chimp: sheet(19, 24, 4, E.sChimp, 9, 22),
    lirili: sheet(22, 26, 4, E.sLirili, 11, 25),
    capy: sheet(24, 17, 4, E.sCapy, 12, 15),
    floppa: sheet(22, 20, 4, E.sFloppa, 11, 18),
    doge: sheet(22, 18, 4, E.sDoge, 11, 16),
    skibidi: sheet(16, 24, 4, E.sSkibidi, 8, 22),
    amogus: sheet(14, 17, 4, E.sAmogus, 7, 15),
    troll: sheet(16, 16, 2, E.sTroll, 8, 8),
    ouro: sheet(25, 18, 2, E.sOuro, 12, 9),
    vasya: sheet(18, 24, 2, H.sVasya, 9, 22),
    kb: sheet(11, 6, 1, I.sKb, 5, 3),
    slipper: sheet(9, 5, 1, I.sSlipper, 4, 2),
    nyan: sheet(13, 8, 2, I.sNyan, 6, 4),
    mine: sheet(11, 8, 2, I.sMine, 5, 7),
    peel: sheet(9, 6, 1, I.sPeel, 4, 5),
    sixseven: sheet(18, 24, 4, E.sSixSeven, 9, 22),
    digits: { '6': sheet(5, 7, 1, g => sign(g, '6', 1, 1, P.green), 2, 3), '7': sheet(5, 7, 1, g => sign(g, '7', 1, 1, P.green), 2, 3) },
    oiia: sheet(17, 21, 8, E.sOiia, 8, 19),
    sigma: sheet(17, 27, 4, E.sSigma, 8, 25),
    quadro: [0, 1, 2].map(v => sheet(23, 16, 4, (g, f) => E.sQuadro(g, f, v), 11, 14)),
    skuf: sheet(24, 30, 4, E.sSkuf, 11, 28),
    labubu: sheet(14, 17, 4, E.sLabubu, 7, 15),
    blindbox: sheet(13, 13, 2, I.sBlindbox, 6, 12),
    dubai: sheet(14, 9, 2, I.sDubai, 7, 8),
    couch: sheet(22, 17, 1, I.sCouch, 0, 0),
    bottle: sheet(5, 8, 1, I.sBottle, 2, 4),
    apostle: sheet(13, 13, 2, E.sApostle, 6, 12),
    streamer: sheet(19, 24, 5, E.sStreamer, 9, 22),
    guard: sheet(17, 22, 4, E.sGuard, 8, 20),
    bee: sheet(9, 7, 2, E.sBee, 4, 4),
    mona: sheet(19, 26, 3, E.sMona, 9, 25),
    printer: sheet(22, 21, 4, E.sPrinter, 11, 19),
    shawa: sheet(17, 20, 4, E.sShawa, 8, 19),
    toiletprop: sheet(16, 20, 2, I.sToiletProp, 0, 0),
    desk: sheet(24, 18, 2, I.sDesk, 0, 0),
    beanbag: sheet(14, 12, 1, I.sBeanbag, 0, 0),
    keg: sheet(10, 14, 2, I.sKeg, 0, 0),
    bed: sheet(26, 12, 2, I.sBed, 0, 0),
    hive: sheet(10, 15, 2, I.sHive, 0, 0),
    banya: sheet(26, 26, 2, I.sBanya, 0, 0),
    outhouse: sheet(12, 24, 1, I.sOuthouse, 0, 0),
    pipe: sheet(28, 14, 2, I.sPipe, 0, 0),
    painting: sheet(18, 21, 2, I.sPainting, 0, 0),
    statue: sheet(12, 26, 1, I.sStatue, 0, 0),
    cube: sheet(14, 18, 3, I.sCube, 0, 0),
    gsofa: sheet(73, 34, 1, I.sGiantSofa, 0, 0),
    gbottle: sheet(12, 34, 1, I.sGiantBottle, 0, 0),
    tv: sheet(38, 29, 2, I.sTv, 0, 0),
    carrot: sheet(9, 11, 2, I.sCarrot, 4, 10),
    remote: sheet(7, 11, 2, I.sRemote, 3, 10),
    words: Object.fromEntries(['WOW', 'SUCH', 'MUCH', 'VERY', 'AMAZE'].map(w => [w, sheet(w.length * 4 + 1, 7, 1, I.sWord(w), (w.length * 4 + 1) >> 1, 3)])) as Record<string, Sheet>,
    letters: Object.fromEntries([...'DELVE'].map(ch => [ch, sheet(5, 7, 1, I.sLetter(ch), 2, 3)])) as Record<string, Sheet>
  };
}

export type SpriteBank = ReturnType<typeof build>;
export let SPR: SpriteBank;
export const GUNS: GunSprite[] = [];

export function buildSprites(): void {
  SPR = build();
  for (let i = 0; i < GUN_SPECS.length; i++) GUNS.push(buildGun(i));
}
