/* Ink: what it pays, what it costs, and the tables the Atelier sells from. */
import { check, done, fakeStorage } from './lib.mjs';

fakeStorage();
const ink = await import('../../src/ink.js');
const fx = await import('../../src/data/fx.js');
const frames = await import('../../src/frames.js');
const { RARITIES } = await import('../../src/data/rarities.js');
const { TRACK_REWARDS } = await import('../../src/data/seasons.js');

/* --- the balance ---------------------------------------------------------- */
check('a fresh device holds no Ink', ink.loadInk() === 0);
check('adding Ink returns the new balance', ink.addInk(12) === 12 && ink.loadInk() === 12);
check('a fraction or a negative adds nothing', ink.addInk(-5) === 12 && ink.addInk(0.4) === 12);
check('spending what is there works', ink.spendInk(10) === true && ink.loadInk() === 2);
check('spending more than there is refuses, and moves nothing', ink.spendInk(3) === false && ink.loadInk() === 2);

/* --- the counter and the prices ------------------------------------------- */
check('one Ink costs the rate', ink.exchangeCost(1) === ink.EXCHANGE_RATE);
check('fifty cost fifty times it', ink.exchangeCost(50) === 50 * ink.EXCHANGE_RATE);
check('an effect costs more the rarer the tier', RARITIES.every((r, i) => i === 0 || ink.fxPrice(r.id) > ink.fxPrice(RARITIES[i - 1].id)));
check('a theme is dearer than a common effect and cheaper than a frame', ink.fxPrice('common') < ink.THEME_PRICE && ink.THEME_PRICE < ink.FRAME_PRICE);

/* --- what pays ------------------------------------------------------------ */
check('every level pays something', [1, 2, 3, 7, 13, 99].every((n) => ink.inkForLevel(n) >= 2));
check('a round level pays more than its neighbours', ink.inkForLevel(10) > ink.inkForLevel(9) && ink.inkForLevel(25) > ink.inkForLevel(24) && ink.inkForLevel(100) > ink.inkForLevel(99));
check('the hundredth level pays over a hundred', ink.inkForLevel(100) > 100, String(ink.inkForLevel(100)));
check('a coin achievement pays a hundredth, at least one', ink.inkForAchievement({ kind: 'coins', coins: 50 }) === 1 && ink.inkForAchievement({ kind: 'coins', coins: 2500 }) === 25);
check('a booster achievement pays by its tier', ink.inkForAchievement({ kind: 'booster', spec: { rarityId: 'common' } }) < ink.inkForAchievement({ kind: 'booster', spec: { rarityId: 'legendary' } }));
check('a hard quest pays more than an easy one', ink.inkForQuestTier('hard') > ink.inkForQuestTier('medium') && ink.inkForQuestTier('medium') > ink.inkForQuestTier('easy'));
check('every season rung pays Ink', TRACK_REWARDS.every((r) => r.ink > 0));
const seasonInk = TRACK_REWARDS.reduce((s, r) => s + r.ink, 0);
check('a whole season track buys a theme and change', seasonInk > ink.THEME_PRICE && seasonInk < 2 * ink.FRAME_PRICE, String(seasonInk));

/* --- what is owned -------------------------------------------------------- */
const profile = {};
check('nothing is owned to start', !ink.ownsTheme(profile, 'paper') && !ink.ownsFrame(profile, 'ivy') && !ink.ownsFx(profile, 'rare', 'tide'));
ink.grant(profile, 'themes', 'paper');
ink.grant(profile, 'fx', ink.fxKey('rare', 'tide'));
ink.grant(profile, 'fx', ink.fxKey('rare', 'tide'));
check('a grant is remembered', ink.ownsTheme(profile, 'paper') && ink.ownsFx(profile, 'rare', 'tide'));
check('and only once', profile.owned.fx.length === 1);
check('an effect is owned for one rarity only', !ink.ownsFx(profile, 'epic', 'tide'));
check('an unknown kind is ignored', (ink.grant(profile, 'hats', 'x'), profile.owned.hats === undefined));

/* --- the tables ----------------------------------------------------------- */
/* The table is what the two design boards held once the picked execution per
   tier had become that tier's own drawing: two left for most tiers, seven for
   Prismatic, twenty-one bought in all. The counts are not round on purpose. */
const BOUGHT = fx.ALL_FX.length - 1;
check('every rarity has at least one bought effect', RARITIES.every((r) => (fx.FX_BY_RARITY[r.id] ?? []).length >= 1));
check('eighteen of them, the boards\' own', BOUGHT === 18, String(BOUGHT));
check('and Prismatic carries the four drawn for Prismatic itself', (fx.FX_BY_RARITY.prismatic ?? []).length === 4, String((fx.FX_BY_RARITY.prismatic ?? []).length));
/* The Artifact tier became Prismatic long ago; the three treatments drawn for
   it before that are gone rather than re-badged. */
check('nothing Artifact-era is still sold', !fx.ALL_FX.some((f) => ['marble', 'parchment', 'ivory'].includes(f.id)));
check('no two effects share an id', new Set(fx.ALL_FX.map((s) => s.id)).size === fx.ALL_FX.length);
check('no two effects share a name', new Set(fx.ALL_FX.map((s) => s.name.en)).size === fx.ALL_FX.length && new Set(fx.ALL_FX.map((s) => s.name.fr)).size === fx.ALL_FX.length);
check('every effect is named and noted in both languages', fx.ALL_FX.every((s) => s.name.en && s.name.fr && s.note.en && s.note.fr));
check('classic leads every rarity', RARITIES.every((r) => fx.fxForRarity(r.id)[0].id === 'classic'
  && fx.fxForRarity(r.id).length === (fx.FX_BY_RARITY[r.id] ?? []).length + 1));
check('an effect exists for its own rarity only', fx.fxExists('rare', 'glass') && !fx.fxExists('common', 'glass') && !fx.fxExists('common', 'classic'));
check('and a choice that is no longer in the table reads as classic', !fx.fxExists('rare', 'tide') && fx.fxById('tide').id === 'classic');
check('an unknown id is not an effect', !fx.fxExists('rare', 'sheen') && fx.fxById('sheen').id === 'classic');
check('ten frames on the Atelier shelf', frames.INK_FRAMES.length === 10 && frames.INK_FRAMES.every((s) => s.minLevel === 1));
check('none of them is a code or a level frame', frames.INK_FRAMES.every((s) => !s.code) && new Set(frames.FRAME_STYLES.map((s) => s.id)).size === frames.FRAME_STYLES.length);
check('each draws at every tier', frames.INK_FRAMES.every((s) => [1, 10, 25, 50].every((tier) => { const svg = frames.frameSvg(s.id, tier); return svg.startsWith('<svg') && !/NaN|undefined/.test(svg); })));
check('and each draws differently', new Set(frames.INK_FRAMES.map((s) => frames.frameSvg(s.id, 12))).size === 10);

done();
