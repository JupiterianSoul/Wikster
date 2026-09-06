/* Wikipedia Today's ladder, and the price it earns under the game's own rule. */
import { check, done } from './lib.mjs';

const { TODAY_CARDS, TODAY_POOL, TODAY_PRICE, RETURN_RATE, SELL_RATE, WRAPPER_CARDS, todayBands, todayExpectedCardValue, todayRarityForRank } =
  await import('../../src/economy.js');
const { priceFor } = await import('../../src/pricing.js');
const { rarityById, rarityRank } = await import('../../src/data/rarities.js');

/* --- the ladder ----------------------------------------------------------- */
// The day's number one is the day's Prismatic; the far end of the list is Rare.
check('the day\'s number one is Prismatic', todayRarityForRank(1).id === 'prismatic');
check('the next four are Exotic', todayRarityForRank(2).id === 'exotic' && todayRarityForRank(5).id === 'exotic');
check('the two hundredth is Rare', todayRarityForRank(TODAY_POOL).id === 'rare');
check('nothing on the list is below Rare', rarityRank(todayRarityForRank(TODAY_POOL).id) >= rarityRank('rare'));

// The ladder never climbs as the rank falls: further down is never rarer.
let monotonic = true;
for (let rank = 2; rank <= TODAY_POOL; rank++) {
  if (rarityRank(todayRarityForRank(rank).id) > rarityRank(todayRarityForRank(rank - 1).id)) monotonic = false;
}
check('a lower place is never a higher tier', monotonic);

// A rank the list cannot have still answers, rather than throwing.
check('a rank off the end lands on the last band', todayRarityForRank(9999).id === 'rare');
check('a nonsense rank does too', todayRarityForRank(0).id === 'rare' && todayRarityForRank(NaN).id === 'rare');

// The bands cover 1..pool with no gap and no overlap.
const bands = todayBands();
let covered = true;
let expected = 1;
for (const band of bands) {
  if (band.from !== expected) covered = false;
  expected = (band.to ?? TODAY_POOL) + 1;
}
check('the bands cover the list end to end', covered, JSON.stringify(bands.map((b) => `${b.from}-${b.to ?? '+'}`)));
check('the last band is open ended', bands[bands.length - 1].to === null);

/* --- the price ------------------------------------------------------------ */
// Rank 1 in a pool of 200 is one card in 200: the top tier stays scarce.
const prismaticRanks = Array.from({ length: TODAY_POOL }, (_, i) => i + 1)
  .filter((rank) => todayRarityForRank(rank).id === 'prismatic').length;
check('one place in the pool earns Prismatic', prismaticRanks === 1, String(prismaticRanks));

// The expected card is the average of the ladder at full fame, and the price
// is that value under the same rule every booster in the game is priced by.
let sum = 0;
for (let rank = 1; rank <= TODAY_POOL; rank++) sum += priceFor(1, todayRarityForRank(rank));
check('the expected card is the ladder\'s average', Math.abs(todayExpectedCardValue() - sum / TODAY_POOL) < 0.001);

const byTheRule = Math.max(5, Math.round(
  ((todayExpectedCardValue() * SELL_RATE) / RETURN_RATE) * (TODAY_CARDS + WRAPPER_CARDS) / 5) * 5);
check('the price follows the game\'s rule', TODAY_PRICE === byTheRule, `${TODAY_PRICE} vs ${byTheRule}`);

// The rule that makes the game work: opening a pack and selling it must lose
// money. This is what the old grading broke, so it is checked outright.
const packValue = todayExpectedCardValue() * TODAY_CARDS;
check('a pack sells back for less than it costs', packValue * SELL_RATE < TODAY_PRICE,
  `sell ${Math.round(packValue * SELL_RATE)} vs price ${TODAY_PRICE}`);
check('and by the same margin as every other pack',
  Math.abs((packValue * SELL_RATE) / TODAY_PRICE - RETURN_RATE * (TODAY_CARDS / (TODAY_CARDS + WRAPPER_CARDS))) < 0.01);

// Grading on readership was the bug: every article on this list is famous, so
// every card came out at the top of the table and the pack printed money.
const byFame = priceFor(1, rarityById('prismatic')) * TODAY_CARDS;
check('grading on fame alone would have paid several times the price', byFame * SELL_RATE > TODAY_PRICE * 2,
  `${Math.round(byFame * SELL_RATE)} vs ${TODAY_PRICE}`);

done();
