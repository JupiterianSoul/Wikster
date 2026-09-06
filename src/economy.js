// @ts-check
/**
 * The economy.
 *
 * The one rule everything else is built to protect: **you cannot get rich by
 * churning boosters.** Selling a booster's entire contents returns a fixed
 * fraction of what the booster cost, whatever tier it was, so the
 * sell-buy-bigger-sell loop always leaks value instead of compounding. A lucky
 * Prismatic can still pay for several packs - that's the thrill - but it is
 * variance around a losing mean, not a strategy.
 *
 * Concretely:
 *   sell value of a card   = SELL_RATE × its price
 *   price of a booster     = its expected sell value ÷ RETURN_RATE
 *
 * so E[sell everything] = RETURN_RATE × price, for every booster in the game.
 * Progression therefore comes from time (the shop stipend), not from grinding.
 */
import { RARITIES, rarityById } from './data/rarities.js';
import { oddsFor } from './data/odds.js';
import { priceFor } from './pricing.js';
import { timedDrawCaps } from './timed.js';

/** A card sells for this fraction of its listed price. */
export const SELL_RATE = 0.3;

/** Selling a whole booster returns this fraction of what it cost. */
export const RETURN_RATE = 0.72;

/**
 * Assumed popularity of a typical draw from an untiered pack, used to price
 * boosters before we know which articles they'll contain. Real pulls vary
 * around it - that variance is the gambling texture - but prices stay
 * predictable.
 */
const TYPICAL_POP = 0.56;

/** Boosters restricted to one theme cost more than open ones. */
const THEME_SURCHARGE = 1.25;

/** How many cards a shop booster can hold. */
export const CARD_COUNT_RANGE = [3, 7];

/** How many cards a booster the player sizes themselves may hold. */
export const CUSTOM_CARD_RANGE = [1, 10];

/**
 * The wrapper: what a booster costs on top of its cards, whatever it
 * holds. Priced per card alone, two one-card boosters would cost exactly one
 * two-card booster, and a player could split any pack into singles for the
 * pick of the prints at no cost. The wrapper is a little over one card's
 * worth, so a pack of one is dear and a pack of ten is the bargain, and the
 * two prices always land in that order.
 */
export const WRAPPER_CARDS = 1.2;

/* --- what a pack is allowed to draw --------------------------------------- */

/**
 * Rarity is the article's own now, so a booster's tier is a POPULARITY
 * CONSTRAINT on what it may draw: a Legendary booster only pulls pages
 * famous enough to BE at least Legendary. Timed packs run the other way:
 * low track levels cap how famous a page they may pull.
 *
 * Returns { minPopularity, maxPopularity } for the draw, either side null
 * when unconstrained.
 */
export function drawCapsFor(spec) {
  // A timed booster is the one pack still described by a range: its track
  // level caps how famous a page it may pull, whatever the roll says.
  if (spec?.kind === 'timed') return timedDrawCaps(spec.timedLevel ?? 1);
  // Everything else is described by its ODDS ROW, not by a band. The row is
  // rolled once per card and the roll decides which band that card is fetched
  // from, so the pack has no single band of its own. `guarantee` is the tier
  // the pack promises at least one card of, and null when it promises nothing.
  return {
    minPopularity: null,
    maxPopularity: null,
    odds: spec?.rarityId ?? null,
    guarantee: spec?.rarityId ?? null
  };
}

/**
 * Mean value of a single card out of this booster.
 *
 * Read straight off the odds row: the chance of each rarity times what a card
 * of that rarity is worth. This has to follow the table or the shop misprices
 * every tier booster the moment the table is tuned, which is exactly what
 * happened when the price was derived from a band the draw no longer used.
 *
 * A timed booster still has a ceiling rather than a row, so it keeps the old
 * reckoning.
 */
export function expectedCardValue(spec) {
  if (spec?.kind === 'timed') {
    const caps = timedDrawCaps(spec.timedLevel ?? 1);
    const pop = Math.min(TYPICAL_POP, caps.maxPopularity ?? 1);
    return priceFor(pop, rarityById('common'));
  }
  // The print is rolled and the article's fame is whatever the subject gives,
  // so a card is worth the typical fame times the tier it was rolled.
  const row = oddsFor(spec?.rarityId ?? null);
  let value = 0;
  for (let i = 0; i < RARITIES.length; i++) {
    value += ((row[i] ?? 0) / 100) * priceFor(TYPICAL_POP, RARITIES[i]);
  }
  return value;
}

/** What the shop charges. */
export function boosterPrice(spec) {
  const cards = spec.cards ?? 5;
  const perCard = (expectedCardValue(spec) * SELL_RATE) / RETURN_RATE;
  const raw = perCard * (cards + WRAPPER_CARDS);
  const themed = spec.themeId || spec.kind === 'custom' ? THEME_SURCHARGE : 1;
  // Round to something that reads like a price tag.
  return Math.max(5, Math.round((raw * themed) / 5) * 5);
}

/**
 * THE PRESS charges a premium over the plain price of a tier booster. The
 * plain price is the booster's expected sell value over RETURN_RATE, the
 * same rule as everything else, and by that rule a Mythic pack is only a
 * little over twice a Rare one: most of its cards are still low prints.
 * But a tier booster is a guarantee, and the guarantee is what is being
 * sold: the markup climbs with the tier, so a Mythic run costs several
 * times a Rare one and a Prismatic run is a real event. The rule that
 * opening and selling loses money on average is only made stronger.
 */
export const PRESS_MARKUP = {
  uncommon: 1.05, rare: 1.2, epic: 1.45, legendary: 1.9, mythic: 2.6, exotic: 3.6, prismatic: 5
};
export const pressPrice = (spec) =>
  Math.max(5, Math.round((boosterPrice(spec) * (PRESS_MARKUP[spec.rarityId] ?? 1)) / 5) * 5);

/** A bundle: several boosters, one price, this far under the sum of their parts. */
export const BUNDLE_OFF_RANGE = [10, 20];
export const bundlePrice = (specs, pct) =>
  Math.max(5, Math.round((specs.reduce((sum, spec) => sum + boosterPrice(spec), 0) * (100 - pct)) / 100 / 5) * 5);

/**
 * THE CRATE: one price whatever comes out, and each crate bought in a
 * restock makes the next one dearer, back to the floor at the restock.
 */
export const CRATE_BASE_PRICE = 1000;
export const CRATE_STEP_PCT = 25;
export const cratePriceAt = (bought) =>
  Math.round((CRATE_BASE_PRICE * Math.pow(1 + CRATE_STEP_PCT / 100, Math.max(0, bought))) / 5) * 5;

/** What the player gets for a card. */
export const sellPriceFor = (price) => Math.max(1, Math.round(price * SELL_RATE));

/* --- shop cadence --------------------------------------------------------- */

/** The shop restocks on this cadence, and pays a stipend each time. */
export const REFRESH_MS = 2 * 60 * 60 * 1000;

/** Credited once per elapsed restock, so time - not grinding - is the income. */
export const STIPEND = 500;

/** Stipends stop accruing past this many missed restocks. */
export const STIPEND_MAX_BANKED = 4;

/** The window index the shop's contents are seeded from. */
export const windowIndexAt = (now = Date.now()) => Math.floor(now / REFRESH_MS);

export const nextRefreshAt = (now = Date.now()) => (windowIndexAt(now) + 1) * REFRESH_MS;

/* --- Wikipedia Today ------------------------------------------------------
 *
 * Every other booster grades a card on how read its article is. That rule
 * cannot work here: this pack draws from the day's most-read list, where
 * being read by everybody is the entry requirement, so readership grades
 * the whole pack at the top and the pack pays out several times what it
 * costs. What DOES tell these articles apart is their place on the list.
 *
 * So a Wikipedia Today card's tier is its article's rank on the day: the
 * one story everyone read is the day's Prismatic, and the two hundredth is
 * a Rare. The card keeps its true readership, so its base value and
 * everything else read off the article stay honest; only the tier is the
 * ranking. The price then follows the same rule as every booster in the
 * game, off the average of the ladder below, so this pack cannot be a way
 * of printing money however the table is tuned.
 */

/** How far down the day's list a pack may reach. */
export const TODAY_POOL = 200;
export const TODAY_CARDS = 5;

/** Rank on the day, to the tier it earns. */
const TODAY_LADDER = [
  { upTo: 1,   id: 'prismatic' },
  { upTo: 5,   id: 'exotic' },
  { upTo: 15,  id: 'mythic' },
  { upTo: 40,  id: 'legendary' },
  { upTo: 100, id: 'epic' },
  { upTo: Infinity, id: 'rare' }
];

/** The ladder as bands, for the sheet that explains the pack. */
export const todayBands = () => TODAY_LADDER.map((band, i) => ({
  from: i === 0 ? 1 : TODAY_LADDER[i - 1].upTo + 1,
  to: Number.isFinite(band.upTo) ? band.upTo : null,
  rarity: rarityById(band.id)
}));

export function todayRarityForRank(rank) {
  const n = Number.isFinite(rank) && rank > 0 ? rank : TODAY_POOL;
  return rarityById((TODAY_LADDER.find((band) => n <= band.upTo) ?? TODAY_LADDER[TODAY_LADDER.length - 1]).id);
}

/**
 * What one card out of this pack is worth on average: every rank in the
 * pool is equally likely, and every article on the list is famous, so each
 * is priced at the top of the fame curve times the tier its rank earns.
 */
export function todayExpectedCardValue() {
  let total = 0;
  for (let rank = 1; rank <= TODAY_POOL; rank++) total += priceFor(1, todayRarityForRank(rank));
  return total / TODAY_POOL;
}

/** The same rule as boosterPrice, on this pack's own expected value. */
export const TODAY_PRICE = Math.max(5, Math.round(
  ((todayExpectedCardValue() * SELL_RATE) / RETURN_RATE) * (TODAY_CARDS + WRAPPER_CARDS) / 5) * 5);

/* --- starting out --------------------------------------------------------- */

export const STARTER_COINS = 1500;
export const STARTER_PACKS = 3;
export const STARTER_PACK_CARDS = 5;

/* --- the free shelf ------------------------------------------------------- */

/**
 * The shop always carries something free, so a player with an empty wallet is
 * never stuck. Two small boosters a window is worth roughly 230 Buckarooz if
 * you sell every card - under half a single stipend, and under a tenth of what
 * a day of stipends pays - so it is a floor, not a faucet.
 */
export const FREE_SLOTS = 2;
export const FREE_CARDS = 3;

/**
 * The free shelf runs on its own, slower clock than the rest of the shop: the
 * shelves rotate every two hours, but a free booster comes round every four.
 * Its contents therefore sit still through one restock before changing, which
 * is deliberate - you can see what is coming, and the shop turning over does
 * not hand out another one.
 */
export const FREE_REFRESH_MS = 4 * 60 * 60 * 1000;

export const freeWindowAt = (now = Date.now()) => Math.floor(now / FREE_REFRESH_MS);

export const nextFreeAt = (now = Date.now()) => (freeWindowAt(now) + 1) * FREE_REFRESH_MS;
