/* The achievement table, the badge shelf and the ledger: sizes, uniqueness, and what counts. */
import { check, done, fakeStorage } from './lib.mjs';

fakeStorage();
const { ACHIEVEMENTS, measure, evaluate } = await import('../../src/achievements.js');
const { BADGES, SHAPES, badgeSvg, badgeStates, badgeStateFromRank } = await import('../../src/badges.js');
const ledger = await import('../../src/ledger.js');
const { hasIcon } = await import('../../src/data/icons.js');

/* --- the achievements ----------------------------------------------------- */
check('three hundred achievements and more', ACHIEVEMENTS.length >= 300, String(ACHIEVEMENTS.length));
check('every id is its own', new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length);
check('every name is its own, in both languages', new Set(ACHIEVEMENTS.map((a) => a.name.en)).size === ACHIEVEMENTS.length && new Set(ACHIEVEMENTS.map((a) => a.name.fr)).size === ACHIEVEMENTS.length);
check('every description is its own', new Set(ACHIEVEMENTS.map((a) => a.desc.en)).size === ACHIEVEMENTS.length);
check('every icon exists', ACHIEVEMENTS.every((a) => hasIcon(a.icon)), ACHIEVEMENTS.filter((a) => !hasIcon(a.icon)).map((a) => a.icon).join(' '));
const stats = new Set(ACHIEVEMENTS.map((a) => a.stat));
check('over ninety different things are measured', stats.size >= 90, String(stats.size));
const facts = measure({ profile: {}, entries: [], albumsDeep: 0, customPacks: [], friends: 0 });
check('every stat is a measured fact', [...stats].every((s) => s in facts), [...stats].filter((s) => !(s in facts)).join(' '));
check('a chain climbs', ACHIEVEMENTS.filter((a) => a.chain).every((a, i, all) => { const prev = all.find((b) => b.chain === a.chain && b.tier === a.tier - 1); return !prev || prev.need < a.need; }));
check('nothing is unlocked on an empty save', evaluate(facts).every((a) => !a.unlocked));

/* --- the ledger ----------------------------------------------------------- */
const profile = {};
ledger.record(profile, 'open', { kind: 'theme', themeId: 'animals' });
ledger.record(profile, 'open', { kind: 'theme', themeId: 'animals' });
ledger.record(profile, 'open', { kind: 'theme', themeId: 'season-yule', rarityId: 'rare' });
ledger.record(profile, 'pull', { isNew: true, popularity: 0.9, wished: true });
ledger.record(profile, 'wikdle', { won: true, guesses: 3 });
ledger.record(profile, 'wikdle', { won: false, guesses: 6 });
ledger.record(profile, 'slots', { won: true, threeOfAKind: true });
ledger.record(profile, 'points', { amount: 120, game: 'slots' });
ledger.record(profile, 'buy', { price: 300, kind: 'crate' });
ledger.record(profile, 'buy', { price: 100, kind: 'open', rarityId: 'epic', bundle: true });
ledger.record(profile, 'sell', { amount: 45 });
ledger.record(profile, 'view');
check('a quest report is counted', profile.ledger.opens_theme === 3 && profile.ledger.opensSeason === 1 && profile.ledger.opensTier === 1);
check('subjects are counted once each', profile.ledger.subjects.length === 2);
check('new, famous and wished pulls are told apart', profile.ledger.newPulls === 1 && profile.ledger.famousPulls === 1 && profile.ledger.wishGranted === 1);
check('a fast Wikdle win counts twice, a loss once', profile.ledger.wikdlePlays === 2 && profile.ledger.wikdleWins === 1 && profile.ledger.wikdleFast === 1);
check('the slot machine keeps spins, wins and triples', profile.ledger.slotsSpins === 1 && profile.ledger.slotsWins === 1 && profile.ledger.slotsTriples === 1 && profile.ledger.slotsBest === 120);
check('the shop keeps buys, spend, crates, bundles and press', profile.ledger.shopBuys === 2 && profile.ledger.spent === 400 && profile.ledger.crates === 1 && profile.ledger.bundles === 1 && profile.ledger.tierBuys === 1);
check('selling and reading count', profile.ledger.sellEarned === 45 && profile.ledger.articleViews === 1);
check('an unknown metric moves nothing', ledger.record(profile, 'nothing') === false);
ledger.bumpMin(profile, 'bestRank', 40); ledger.bumpMin(profile, 'bestRank', 12); ledger.bumpMin(profile, 'bestRank', 90);
check('the best rank is the lowest number', profile.ledger.bestRank === 12);
check('a set is capped and never doubles', (ledger.noteIn(profile, 'few', 'a', 2), ledger.noteIn(profile, 'few', 'b', 2), !ledger.noteIn(profile, 'few', 'c', 2) && !ledger.noteIn(profile, 'few', 'a', 2) && profile.ledger.few.length === 2));
const measured = measure({ profile, entries: [], albumsDeep: 0, customPacks: [], friends: 0, wikdle: { played: 0, won: 0, best: 4 } });
check('the facts read the ledger', measured.opensTheme === 3 && measured.subjects === 2 && measured.wikdleStreak === 4 && measured.boardTop100 === 1 && measured.boardTop10 === 0);

/* --- the badges ----------------------------------------------------------- */
check('ninety badges and more', BADGES.length >= 86, String(BADGES.length));
check('every badge id is its own', new Set(BADGES.map((b) => b.id)).size === BADGES.length);
check('every badge has its own motif', new Set(BADGES.map((b) => b.motif)).size === BADGES.length);
check('every badge has its own foil', new Set(BADGES.map((b) => b.foil.join())).size === BADGES.length);
check('every badge has a shape, and all six are used', BADGES.every((b) => SHAPES.includes(b.shape)) && new Set(BADGES.map((b) => b.shape)).size === 6);
check('every chain badge hangs off a real chain', BADGES.filter((b) => b.chain).every((b) => ACHIEVEMENTS.some((a) => a.chain === b.chain && a.tier === b.from)));
check('every single-feat badge names a real achievement', BADGES.filter((b) => b.ach).every((b) => ACHIEVEMENTS.some((a) => a.id === b.ach)));
check('every chip draws, at every rank', BADGES.every((b) => [0, 1, 2].every((r) => { const svg = badgeSvg(b, r, 3); return svg.startsWith('<svg') && !/NaN|undefined/.test(svg); })));
check('no two chips draw the same', new Set(BADGES.map((b) => badgeSvg(b, 1, 1))).size === BADGES.length);
const all = evaluate(measure({ profile: { ledger: { seasonRungs: 120 } }, entries: [], albumsDeep: 0, customPacks: [], friends: 0 }));
const climber = badgeStates(all).find((st) => st.badge.id === 'climber');
check('a badge counts its rungs from the chain', climber && climber.rank === climber.max && climber.max === 2, JSON.stringify(climber && { rank: climber.rank, max: climber.max }));
const fromRow = badgeStateFromRank('climber', 1);
check('a friend\'s row rebuilds the same shelf', fromRow.max === 2 && fromRow.rank === 1 && fromRow.rungs[0].unlocked && !fromRow.rungs[1].unlocked);
check('a code badge from a row is one rung', badgeStateFromRank('special-creator', 1).max === 1 && badgeStateFromRank('nope', 1) === null);

done();
