/**
 * BADGES
 * ============================================================================
 * The trophies above the statistics: holographic foil chips, one per family
 * of hard achievements, shown on the profile between the level card and the
 * numbers. A badge is not another achievement - it is what the top rungs of
 * a chain LOOK like once you are standing on them.
 *
 * Each badge hangs off one achievement chain (src/achievements.js) and starts
 * counting at that chain's hard end: `from` names the first rung that shows
 * on the chip. Climb further and the same chip upgrades in place - the foil
 * re-tints, a pip is added, the rank rises. Two hang off single feats
 * instead. Everything is computed from live achievement state; nothing is
 * stored.
 *
 * The look is the "holo foil chip" the player picked from ten candidates: a
 * rounded hexagon of iridescent foil, a dark inset, the motif in white line
 * art, a diagonal sheen, and one pip per rank along the bottom edge.
 */
import { tx } from './i18n.js';
import { SEASONS } from './data/seasons.js';
import { ACHIEVEMENTS } from './achievements.js';

/* --- the set ---------------------------------------------------------------
 * `chain` + `from`: upgradeable, one rank per unlocked rung from `from` up.
 * `ach`: a single feat, one rank. `motif` picks the line art below. */
export const BADGES = [
  { id: 'ripper',     chain: 'pack',      from: 4, motif: 'pack',
    name: { en: 'Ripper', fr: 'Déchireur' } },
  { id: 'collector',  chain: 'cards',     from: 4, motif: 'cards',
    name: { en: 'Collector', fr: 'Collectionneur' } },
  { id: 'archivist',  chain: 'album',     from: 3, motif: 'book',
    name: { en: 'Archivist', fr: 'Archiviste' } },
  { id: 'tycoon',     chain: 'value',     from: 3, motif: 'gem',
    name: { en: 'Tycoon', fr: 'Magnat' } },
  { id: 'ascendant',  chain: 'level',     from: 5, motif: 'peak',
    name: { en: 'Ascendant', fr: 'Ascendant' } },
  { id: 'starcatcher', chain: 'legendary', from: 2, motif: 'star',
    name: { en: 'Starcatcher', fr: 'Attrapeur d’étoiles' } },
  // The id predates the tier's rename; it stays so equipped loadouts hold.
  { id: 'relichunter', chain: 'prismatic', from: 1, motif: 'crystal',
    name: { en: 'Prism Hunter', fr: 'Chasseur de prismes' } },
  { id: 'scholar',    chain: 'perfect',   from: 2, motif: 'quiz',
    name: { en: 'Scholar', fr: 'Érudit' } },
  { id: 'timekeeper', chain: 'timed',     from: 3, motif: 'hourglass',
    name: { en: 'Timekeeper', fr: 'Gardien du temps' } },
  { id: 'devoted',    chain: 'daily',     from: 3, motif: 'gift',
    name: { en: 'Devoted', fr: 'Fidèle' } },
  { id: 'magnate',    chain: 'rich',      from: 2, motif: 'coin',
    name: { en: 'Deep Pockets', fr: 'Poches profondes' } },
  { id: 'prismatic',  ach: 'one-of-each', motif: 'prism',
    name: { en: 'One of Each', fr: 'Un de chaque' } },
  { id: 'seller',     chain: 'vendor',    from: 1, motif: 'tag',
    name: { en: 'Seller', fr: 'Vendeur' } },
  { id: 'buyer',      chain: 'hammer',    from: 1, motif: 'gavel',
    name: { en: 'Buyer', fr: 'Acheteur' } },
  { id: 'encyclo',    chain: 'unique',    from: 3, motif: 'scroll',
    name: { en: 'Encyclopedist', fr: 'Encyclopédiste' } },
  { id: 'philanthrope', chain: 'gift',    from: 2, motif: 'openhand',
    name: { en: 'Philanthropist', fr: 'Philanthrope' } },
  /* --- the second shelf: one chip per family the second two hundred added --- */
  { id: 'papermill',   chain: 'common',       from: 3, motif: 'paper',        name: { en: 'Paper Mill', fr: 'Papeterie' } },
  { id: 'clover',      chain: 'uncommon',     from: 3, motif: 'clover',       name: { en: 'Green Thumb', fr: 'Main verte' } },
  { id: 'deepblue',    chain: 'rare',         from: 3, motif: 'drop',         name: { en: 'Deep Blue', fr: 'Grand bleu' } },
  { id: 'saga',        chain: 'epic',         from: 3, motif: 'tome',         name: { en: 'Saga', fr: 'Saga' } },
  { id: 'dragon',      chain: 'mythic',       from: 2, motif: 'dragon',       name: { en: 'Dragon Keeper', fr: 'Gardien de dragon' } },
  { id: 'xeno',        chain: 'exotic',       from: 2, motif: 'planet',       name: { en: 'Xenologist', fr: 'Xénologue' } },
  { id: 'plainwrap',   chain: 'basic',        from: 3, motif: 'box',          name: { en: 'Plain Wrapper', fr: 'Emballage simple' } },
  { id: 'specialist',  chain: 'subject',      from: 3, motif: 'graduate',     name: { en: 'Specialist', fr: 'Spécialiste' } },
  { id: 'cottage',     chain: 'homemade',     from: 2, motif: 'hammer',       name: { en: 'Cottage Industry', fr: 'Artisan' } },
  { id: 'newsstand',   chain: 'today',        from: 2, motif: 'newspaper',    name: { en: 'Newsstand', fr: 'Kiosque' } },
  { id: 'almanac',     chain: 'seasonal',     from: 2, motif: 'almanac',      name: { en: 'Almanac', fr: 'Almanach' } },
  { id: 'vaultkey',    chain: 'tiered',       from: 2, motif: 'vault',        name: { en: 'Vault Key', fr: 'Clé du coffre' } },
  { id: 'atlas',       chain: 'subjects',     from: 2, motif: 'atlas',        name: { en: 'Atlas', fr: 'Atlas' } },
  { id: 'explorer',    chain: 'fresh',        from: 2, motif: 'footprints',   name: { en: 'Explorer', fr: 'Explorateur' } },
  { id: 'megaphone',   chain: 'famous',       from: 2, motif: 'megaphone',    name: { en: 'Name-dropper', fr: 'Célébrités' } },
  { id: 'genie',       chain: 'wishcome',     from: 2, motif: 'shootingstar', name: { en: 'The Genie', fr: 'Le Génie' } },
  { id: 'bookworm',    chain: 'reader',       from: 2, motif: 'glasses',      name: { en: 'Bookworm', fr: 'Rat de bibliothèque' } },
  { id: 'readingroom', chain: 'deep',         from: 2, motif: 'library',      name: { en: 'Reading Room', fr: 'Salle de lecture' } },
  { id: 'lexicon',     chain: 'wikdle',       from: 3, motif: 'letters',      name: { en: 'Lexicon', fr: 'Lexique' } },
  { id: 'wordsmith',   chain: 'wikdlewin',    from: 3, motif: 'crossword',    name: { en: 'Wordsmith', fr: 'Cruciverbiste' } },
  { id: 'quickdraw',   chain: 'wikdlefast',   from: 2, motif: 'bolt',         name: { en: 'Quick Draw', fr: 'Vif-argent' } },
  { id: 'unbroken',    chain: 'wikdlestreak', from: 2, motif: 'chain',        name: { en: 'Unbroken', fr: 'Sans faille' } },
  { id: 'bandit',      chain: 'spins',        from: 3, motif: 'cherry',       name: { en: 'One-armed Bandit', fr: 'Bandit manchot' } },
  { id: 'horseshoe',   chain: 'spinwins',     from: 2, motif: 'horseshoe',    name: { en: 'Lucky Streak', fr: 'Veine' } },
  { id: 'bells',       chain: 'triples',      from: 2, motif: 'bell',         name: { en: 'Three Bells', fr: 'Trois cloches' } },
  { id: 'duellist',    chain: 'duels',        from: 2, motif: 'swords',       name: { en: 'Duellist', fr: 'Duelliste' } },
  { id: 'sharpeye',    chain: 'reveals',      from: 2, motif: 'eye',          name: { en: 'Sharp Eye', fr: 'Œil de lynx' } },
  { id: 'arcadelegend', chain: 'arcade',      from: 3, motif: 'joystick',     name: { en: 'Arcade Legend', fr: 'Légende de l’arcade' } },
  { id: 'adventurer',  chain: 'quests',       from: 3, motif: 'map',          name: { en: 'Adventurer', fr: 'Aventurier' } },
  { id: 'ironwill',    chain: 'hardquests',   from: 2, motif: 'anvil',        name: { en: 'Iron Will', fr: 'Volonté de fer' } },
  { id: 'sweeper',     chain: 'fulldays',     from: 2, motif: 'checklist',    name: { en: 'Clean Sweep', fr: 'Grand chelem' } },
  { id: 'climber',     chain: 'rungs',        from: 3, motif: 'ladder',       name: { en: 'Climber', fr: 'Grimpeur' } },
  { id: 'allweather',  chain: 'seasonpts',    from: 3, motif: 'weathervane',  name: { en: 'All-weather', fr: 'Par tous les temps' } },
  { id: 'yearwheel',   chain: 'seasons',      from: 2, motif: 'yearwheel',    name: { en: 'Wheel of the Year', fr: 'Roue de l’année' } },
  { id: 'ribboned',    chain: 'seasonbadges', from: 2, motif: 'ribbon',       name: { en: 'Ribboned', fr: 'Enrubanné' } },
  { id: 'standard',    chain: 'goals',        from: 3, motif: 'flag',         name: { en: 'Standard Bearer', fr: 'Porte-étendard' } },
  { id: 'dynasty',     chain: 'matches',      from: 2, motif: 'banner',       name: { en: 'Dynasty', fr: 'Dynastie' } },
  { id: 'quartermaster', chain: 'donated',    from: 3, motif: 'basket',       name: { en: 'Quartermaster', fr: 'Intendant' } },
  { id: 'towncrier',   chain: 'hallchat',     from: 2, motif: 'horn',         name: { en: 'Town Crier', fr: 'Crieur public' } },
  { id: 'recruiter',   chain: 'recruiter',    from: 2, motif: 'handshake',    name: { en: 'Recruiter', fr: 'Recruteur' } },
  { id: 'penpal',      chain: 'chatter',      from: 3, motif: 'envelope',     name: { en: 'Pen Pal', fr: 'Correspondant' } },
  { id: 'roundtable',  chain: 'circles',      from: 2, motif: 'people',       name: { en: 'Round Table', fr: 'Table ronde' } },
  { id: 'bigheart',    chain: 'kudos',        from: 2, motif: 'thumbs',       name: { en: 'Big Heart', fr: 'Grand cœur' } },
  { id: 'wellliked',   chain: 'received',     from: 2, motif: 'parcel',       name: { en: 'Well Liked', fr: 'Apprécié' } },
  { id: 'paddle',      chain: 'bidder',       from: 3, motif: 'paddle',       name: { en: 'Paddle Up', fr: 'Panneau levé' } },
  { id: 'consignor',   chain: 'lister',       from: 2, motif: 'lectern',      name: { en: 'Consignor', fr: 'Déposant' } },
  { id: 'ingot',       chain: 'bigsale',      from: 2, motif: 'ingot',        name: { en: 'Record Lot', fr: 'Lot record' } },
  { id: 'regular',     chain: 'shopper',      from: 3, motif: 'cart',         name: { en: 'Loyal Customer', fr: 'Client fidèle' } },
  { id: 'bigspender',  chain: 'spender',      from: 3, motif: 'banknote',     name: { en: 'Big Spender', fr: 'Grand dépensier' } },
  { id: 'dockworker',  chain: 'crates',       from: 2, motif: 'crate',        name: { en: 'Dockworker', fr: 'Docker' } },
  { id: 'inkwell',     chain: 'inkearned',    from: 3, motif: 'inkdrop',      name: { en: 'Inkwell', fr: 'Encrier' } },
  { id: 'brush',       chain: 'inkspent',     from: 2, motif: 'brush',        name: { en: 'Patron of the Arts', fr: 'Mécène des arts' } },
  { id: 'effects',     chain: 'fxowned',      from: 2, motif: 'sparkles',     name: { en: 'Effects Department', fr: 'Service des effets' } },
  { id: 'palette',     chain: 'themesowned',  from: 2, motif: 'palette',      name: { en: 'Decorator', fr: 'Décorateur' } },
  { id: 'framer',      chain: 'framesowned',  from: 2, motif: 'frame',        name: { en: 'Frame Shop', fr: 'Encadreur' } },
  { id: 'sunrise',     chain: 'days',         from: 3, motif: 'sunrise',      name: { en: 'Around the Sun', fr: 'Le tour du soleil' } },
  { id: 'sevens',      chain: 'weeks',        from: 2, motif: 'seven',        name: { en: 'Seven for Seven', fr: 'Sept sur sept' } },
  { id: 'numberone',   ach: 'board-1',                 motif: 'laurelone',    name: { en: 'Number One', fr: 'Numéro un' } },
  { id: 'sparring',    chain: 'versus',       from: 3, motif: 'crossedcards', name: { en: 'Sparring Partner', fr: 'Partenaire d’entraînement' } },
  { id: 'undisputed',  chain: 'versuswin',    from: 2, motif: 'stopwatch',    name: { en: 'Undisputed', fr: 'Incontesté' } },
  // The special badges: one per secret code (src/codes.js), earned the
  // moment the code is redeemed, worn straight away. `code` names the code;
  // the chip's foil is the person's own colour rather than the rank ladder.
  { id: 'special-simon',   code: 'simon',   motif: 'laugh',  foil: ['#bfdbfe', '#3b82f6', '#1d4ed8'],
    name: { en: 'Simon’s Special Badge', fr: 'Badge spécial de Simon' } },
  { id: 'special-celeste', code: 'celeste', motif: 'lamassu', foil: ['#fce7f3', '#f472b6', '#be185d'],
    name: { en: 'Céleste’s Special Badge', fr: 'Badge spécial de Céleste' } },
  { id: 'special-samuel',  code: 'samuel',  motif: 'pixel',  foil: ['#cfe7ff', '#1e90ff', '#1e3a8a'],
    name: { en: 'Samuel’s Special Badge', fr: 'Badge spécial de Samuel' } },
  { id: 'special-noah',    code: 'noah',    motif: 'dice',   foil: ['#e9d5ff', '#a855f7', '#6b21a8'],
    name: { en: 'Noah’s Special Badge', fr: 'Badge spécial de Noah' } },
  { id: 'special-julien',  code: 'julien',  motif: 'wheel',    foil: ['#f5ead6', '#d8c39a', '#5c4426'],
    name: { en: 'Julien’s Special Badge', fr: 'Badge spécial de Julien' } },
  { id: 'special-catherine', code: 'catherine', motif: 'openbook', foil: ['#ccfbf1', '#2dd4bf', '#0f4c47'],
    name: { en: 'Catherine’s Special Badge', fr: 'Badge spécial de Catherine' } },
  { id: 'special-mathilde', code: 'mathilde', motif: 'pot',      foil: ['#ede9fe', '#a78bfa', '#3b1f6b'],
    name: { en: 'Mathilde’s Special Badge', fr: 'Badge spécial de Mathilde' } },
  // The only badge that burns: a live flame behind the skull (badge-live-fire in screens.css).
  { id: 'special-hellfire', code: 'hellfire', motif: 'hellfire', live: 'fire', foil: ['#ffe4de', '#fa8072', '#5b1717'],
    name: { en: 'To the Hellfire', fr: 'Vers le Feu de l’enfer' } },
  // The only badge in gold, and the only one that is not somebody else's.
  { id: 'special-creator', code: 'creator', motif: 'seal',   foil: ['#fff7d6', '#fbbf24', '#7c2d12'],
    name: { en: 'The Creator', fr: 'Le Créateur' } },
  // The season badges (src/data/seasons.js): one per season, earned on its
  // track and kept for good. Like the code badges, a season badge that has
  // not been earned is not shown at all.
  ...SEASONS.map((season) => ({
    id: `season-${season.id}`, season: season.id, motif: season.badge.motif, foil: season.badge.foil,
    name: { en: `${season.name.en} ${season.from[0] === 1 && season.id === 'frost' ? 'Season' : 'Season'}`, fr: `Saison ${season.name.fr}` }
  }))
];

/**
 * Where every badge stands, from the evaluated achievement list
 * (achievements.evaluate() output - names already translated).
 * Returns [{ badge, rank, max, rungs, next }] in BADGES order:
 * rank 0 = locked; rungs = the achievements the chip counts, in order;
 * next = the first rung not yet unlocked, if any.
 */
export function badgeStates(evaluated, redeemed = {}, seasonBadges = []) {
  const byChain = new Map();
  for (const a of evaluated) {
    if (!a.chain) continue;
    if (!byChain.has(a.chain)) byChain.set(a.chain, []);
    byChain.get(a.chain).push(a);
  }
  for (const list of byChain.values()) list.sort((a, b) => a.tier - b.tier);

  // A special badge that has not been earned is not a locked chip: it is
  // not there at all. Nobody is shown a thing they can never have.
  return BADGES.filter((badge) => (!badge.code || Number(redeemed?.[badge.code] ?? 0) > 0)
    && (!badge.season || seasonBadges.includes(badge.season))).map((badge) => {
    if (badge.season) {
      const rung = { id: `season:${badge.season}`, unlocked: true, tier: 1, name: tx(badge.name), desc: tx(SEASON_RUNG) };
      return { badge, rank: 1, max: 1, rungs: [rung], next: null, name: tx(badge.name) };
    }
    if (badge.code) {
      // One rung: the code itself. Unlocked by redeeming it, nothing else.
      const on = Number(redeemed?.[badge.code] ?? 0) > 0;
      const rung = { id: `code:${badge.code}`, unlocked: on, tier: 1,
        name: tx(badge.name), desc: tx(CODE_RUNG) };
      return { badge, rank: on ? 1 : 0, max: 1, rungs: [rung], next: on ? null : rung, name: tx(badge.name) };
    }
    const rungs = badge.chain
      ? (byChain.get(badge.chain) ?? []).filter((a) => a.tier >= badge.from)
      : evaluated.filter((a) => a.id === badge.ach);
    let rank = 0;
    for (const r of rungs) { if (r.unlocked) rank++; else break; }
    return {
      badge, rank, max: rungs.length, rungs,
      next: rungs.find((r) => !r.unlocked) ?? null,
      name: tx(badge.name)
    };
  });
}

export const badgesEarned = (evaluated, redeemed = {}, seasonBadges = []) =>
  badgeStates(evaluated, redeemed, seasonBadges).filter((s) => s.rank > 0).length;

const SEASON_RUNG = {
  en: 'Reach the fourth rung of the season’s track while the season is on.',
  fr: 'Atteignez le quatrième palier de la piste de la saison pendant la saison.'
};

const CODE_RUNG = {
  en: 'Redeem the secret code made for you in Settings.',
  fr: 'Utilisez le code secret fait pour vous dans les Réglages.'
};

/* --- the chip --------------------------------------------------------------
 * Foil sets by rank: cool holo first, warmer and wider the higher the chip
 * has been carried. Locked chips are pressed in grey. */

/* --- one look per badge ------------------------------------------------------
 * No two chips share a foil or a shape. The chain badges take their colours
 * from a golden-angle walk round the hue wheel, three foil families in turn
 * (gloss: light to dark; deep: dark to light; duo: the hue and its
 * neighbour), and one of six shapes; the code and season badges keep the
 * foils their makers gave them and take the shapes in their turn. */
export const SHAPES = ['hex', 'shield', 'circle', 'diamond', 'octagon', 'square'];
const hsl = (h, sat, light) => {
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
};
const foilFor = (i) => {
  const h = (i * 137.508) % 360;
  const family = i % 3;
  if (family === 0) return [hsl(h, 0.85, 0.86), hsl(h, 0.8, 0.6), hsl(h, 0.7, 0.3)];
  if (family === 1) return [hsl(h, 0.7, 0.28), hsl(h, 0.8, 0.55), hsl(h, 0.9, 0.85)];
  return [hsl(h, 0.85, 0.7), hsl((h + 40) % 360, 0.85, 0.6), hsl((h + 80) % 360, 0.8, 0.45)];
};
{
  let i = 0;
  for (const badge of BADGES) {
    badge.shape ??= SHAPES[i % SHAPES.length];
    if (!badge.foil) badge.foil = foilFor(i);
    i++;
  }
}

const FOILS = [
  ['#3a4160', '#4a5478', '#3a4160'],                                  // locked
  ['#7ef2ff', '#7d8bff', '#e07dff'],                                  // rank I
  ['#7d8bff', '#e07dff', '#ffb37d'],                                  // rank II
  ['#7ef2ff', '#7d8bff', '#e07dff', '#ffb37d', '#7ef77f'],            // rank III
  ['#ffd75e', '#ff9d7d', '#e07dff', '#7d8bff', '#7ef2ff'],            // rank IV
  ['#fff3b8', '#ffd75e', '#ff9d7d', '#e07dff', '#8ff2ff'],            // rank V
  ['#ffffff', '#fff3b8', '#ffc5e8', '#c5b8ff', '#b8fff4']             // rank VI+
];
const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const romanRank = (n) => ROMANS[Math.min(n, ROMANS.length - 1)];

const hexPoints = (r) => Array.from({ length: 6 }, (_, i) => {
  const a = (-90 + i * 60) * Math.PI / 180;
  return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/* Line-art motifs, drawn for a 44-unit box centred on 0,0; stroke colour and
 * width come from the chip so locked and earned share the same drawings. */
const MOTIFS = {
  pack: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -11 -17 L 11 -17 L 14 -12 L 14 14 Q 14 17 11 17 L -11 17 Q -14 17 -14 14 L -14 -12 Z"/>
    <path d="M -11 -17 L -6 -12 L 0 -17 L 6 -12 L 11 -17"/>
    <line x1="-7" y1="5" x2="7" y2="5"/><line x1="-7" y1="10" x2="4" y2="10"/></g>`,
  cards: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <rect x="-16" y="-12" width="20" height="27" rx="3" transform="rotate(-8)"/>
    <rect x="-3" y="-15" width="20" height="27" rx="3" transform="rotate(7)"/>
    <polygon points="7.5,-6 9.3,-1.8 13.8,-1.6 10.3,1.2 11.5,5.6 7.5,3 3.5,5.6 4.7,1.2 1.2,-1.6 5.7,-1.8" fill="${s}" stroke="none" transform="rotate(7)"/></g>`,
  book: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M -15 -14 Q -15 -17 -12 -17 L 12 -17 Q 15 -17 15 -14 L 15 14 Q 15 17 12 17 L -12 17 Q -15 17 -15 14 Z"/>
    <line x1="-8" y1="-17" x2="-8" y2="17"/>
    <polygon points="4,-5 5.8,-0.8 10.3,-0.6 6.8,2.2 8,6.6 4,4 0,6.6 1.2,2.2 -2.3,-0.6 2.2,-0.8" fill="${s}" stroke="none"/></g>`,
  gem: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <polygon points="-14,-6 -7,-14 7,-14 14,-6 0,16"/>
    <polyline points="-14,-6 14,-6"/><polyline points="-7,-14 -4,-6 0,16"/><polyline points="7,-14 4,-6 0,16"/></g>`,
  peak: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -16 14 L -5 -8 L 1 2 L 7 -12 L 16 14 Z"/>
    <path d="M 7 -12 L 7 -17 L 12 -15 L 7 -13.2"/></g>`,
  star: (s) => `<g stroke="${s}" stroke-width="2.2" stroke-linejoin="round" fill="none">
    <path d="M 0 -16 Q 2.5 -2.5 16 0 Q 2.5 2.5 0 16 Q -2.5 2.5 -16 0 Q -2.5 -2.5 0 -16 Z"/>
    <circle cx="10" cy="-11" r="1.6" fill="${s}" stroke="none"/></g>`,
  relic: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <polygon points="0,-15 13,-4 8,14 -8,14 -13,-4"/>
    <circle cx="0" cy="1" r="5.5"/><circle cx="0" cy="1" r="1.6" fill="${s}" stroke="none"/></g>`,
  crystal: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="0,-16 9,-7 5,15 -5,15 -9,-7"/>
    <polyline points="-9,-7 0,-3 9,-7"/><line x1="0" y1="-3" x2="0" y2="15"/>
    <path d="M 15 -14 L 15 -8 M 12 -11 L 18 -11" stroke-width="2"/></g>`,
  quiz: (s) => `<g fill="none" stroke="${s}" stroke-width="2.8" stroke-linecap="round">
    <path d="M -7 -7 Q -7 -15 0 -15 Q 8 -15 8 -8 Q 8 -3 2 -1 Q 0 0 0 4"/>
    <circle cx="0" cy="13" r="1.8" fill="${s}" stroke="none"/></g>`,
  hourglass: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -10 -16 L 10 -16 L 10 -10 Q 10 -4 3 0 Q 10 4 10 10 L 10 16 L -10 16 L -10 10 Q -10 4 -3 0 Q -10 -4 -10 -10 Z"/>
    <path d="M -5 12 L 5 12 L 0 6 Z" fill="${s}" stroke="none"/></g>`,
  gift: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <rect x="-13" y="-6" width="26" height="21" rx="2"/><line x1="0" y1="-6" x2="0" y2="15"/>
    <path d="M 0 -6 Q -9 -8 -8 -13 Q -4 -16 0 -6 Q 4 -16 8 -13 Q 9 -8 0 -6"/></g>`,
  coin: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4">
    <circle cx="0" cy="0" r="14"/><circle cx="0" cy="0" r="9.5"/>
    <line x1="0" y1="-9.5" x2="0" y2="-14"/><line x1="0" y1="9.5" x2="0" y2="14"/></g>`,
  prism: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="0,-13 13,10 -13,10"/>
    <line x1="-18" y1="-2" x2="-6" y2="-2"/>
    <line x1="6" y1="1" x2="17" y2="-3"/><line x1="6" y1="4" x2="18" y2="3"/><line x1="6" y1="7" x2="17" y2="9"/></g>`,
  tag: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M -2 -16 L 10 -16 Q 13 -16 13 -13 L 13 -1 L 1 14 Q -1 16 -3 14 L -15 0 Q -17 -2 -15 -4 Z" transform="rotate(14)"/>
    <circle cx="6" cy="-9" r="2.4" transform="rotate(14)"/></g>`,
  gavel: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-4" y="-16" width="14" height="9" rx="2" transform="rotate(38)"/>
    <line x1="-1" y1="1" x2="-11" y2="12"/>
    <line x1="-16" y1="16" x2="2" y2="16"/></g>`,
  scroll: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -13 -13 Q -9 -16 -5 -13 L -5 12 Q -9 15 -13 12 Z"/>
    <path d="M -5 -13 L 9 -13 Q 13 -13 13 -9 L 13 8 Q 13 12 9 12 L -5 12"/>
    <line x1="0" y1="-6" x2="8" y2="-6"/><line x1="0" y1="0" x2="8" y2="0"/><line x1="0" y1="6" x2="6" y2="6"/></g>`,
  heart: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M 0 13 Q -14 3 -14 -5 Q -14 -13 -7 -13 Q -2 -13 0 -8 Q 2 -13 7 -13 Q 14 -13 14 -5 Q 14 3 0 13 Z"/>
    <path d="M -5 -4 L -1 -4 L 1 -8 L 3 0 L 5 -4" stroke-width="1.8"/></g>`,
  /* --- the second shelf --- */
  openhand: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-14 4 L-14 12 Q-14 17 -9 17 L8 17 Q14 17 15 11 L17 -2 Q17 -6 13 -6 L12 4"/><path d="M-14 4 Q-8 -2 -2 4 L8 4 Q12 4 12 8"/>
    <path d="M0 -14 Q-6 -20 -8 -14 Q-8 -8 0 -4 Q8 -8 8 -14 Q6 -20 0 -14 Z" fill="${s}" stroke="none"/></g>`,
  paper: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-11 -16 h14 l8 8 v24 h-22 Z"/><path d="M3 -16 v8 h8"/><path d="M-6 0 h12 M-6 6 h12 M-6 12 h7"/></g>`,
  clover: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 0 C-2 -12 -14 -12 -12 -4 C-14 4 -2 6 0 0 C-12 2 -12 14 -4 12 C4 14 6 2 0 0 C2 12 14 12 12 4 C14 -4 2 -6 0 0 C12 -2 12 -14 4 -12 C-4 -14 -6 -2 0 0 Z"/><path d="M0 4 Q-2 12 -6 17"/></g>`,
  drop: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M0 -17 C6 -8 12 -2 12 5 A12 12 0 0 1 -12 5 C-12 -2 -6 -8 0 -17 Z"/><path d="M-6 6 a6 6 0 0 0 4 6" stroke-width="1.8"/></g>`,
  tome: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-13 -15 h20 a4 4 0 0 1 4 4 v26 h-20 a4 4 0 0 1 -4 -4 Z"/><path d="M-13 11 a4 4 0 0 1 4 -4 h20"/><path d="M-4 -8 h8 M-4 -3 h8"/><circle cx="0" cy="3" r="2"/></g>`,
  dragon: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 6 Q-10 -12 4 -8 Q14 -6 16 4 Q10 0 6 4 Q10 12 2 14 Q-6 16 -8 8 Q-14 10 -16 6 Z"/><path d="M4 -8 L2 -16 L8 -11 M-2 -6 L-6 -14"/><circle cx="8" cy="0" r="1.4" fill="${s}"/><path d="M-8 8 Q-4 4 0 8"/></g>`,
  planet: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round">
    <circle cx="0" cy="0" r="9"/><path d="M-18 -4 C-10 6 10 8 18 -2" /><path d="M-15 -8 C-8 -11 6 -12 14 -9"/><circle cx="-3" cy="-3" r="1.5" fill="${s}" stroke="none"/></g>`,
  box: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M-15 -6 L0 -14 L15 -6 L15 10 L0 18 L-15 10 Z"/><path d="M-15 -6 L0 2 L15 -6 M0 2 V18"/><path d="M-7 -10 L8 -2" stroke-width="1.6"/></g>`,
  graduate: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-18 -4 L0 -12 L18 -4 L0 4 Z"/><path d="M-10 0 V9 Q0 16 10 9 V0"/><path d="M18 -4 V6" /><circle cx="18" cy="8" r="1.5" fill="${s}"/></g>`,
  hammer: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-2 -6 L-14 6 L-10 10 L2 -2" /><rect x="-2" y="-16" width="18" height="10" rx="2" transform="rotate(45 7 -11)"/><path d="M-14 16 h28" stroke-width="1.6"/></g>`,
  newspaper: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 -12 h26 v22 a4 4 0 0 1 -4 4 h-22 a4 4 0 0 1 -4 -4 v-14 h4"/><rect x="-11" y="-7" width="8" height="7"/><path d="M1 -6 h6 M1 -2 h6 M-11 4 h18 M-11 8 h18"/></g>`,
  almanac: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-14" y="-11" width="28" height="26" rx="3"/><path d="M-14 -4 h28 M-8 -16 v7 M8 -16 v7"/><path d="M-8 3 l3 3 5 -6" /><circle cx="6" cy="9" r="1.4" fill="${s}"/></g>`,
  vault: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-15" y="-15" width="30" height="30" rx="4"/><circle cx="0" cy="0" r="8"/><path d="M0 -8 V-4 M0 4 V8 M-8 0 H-4 M4 0 H8"/><path d="M10 -9 v4 M10 5 v4"/></g>`,
  atlas: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <circle cx="0" cy="0" r="15"/><path d="M-15 0 h30 M0 -15 v30"/><path d="M-9 -12 Q0 -6 9 -12 M-9 12 Q0 6 9 12"/><ellipse cx="0" cy="0" rx="7" ry="15"/></g>`,
  footprints: (s) => `<g fill="${s}" stroke="none">
    <ellipse cx="-7" cy="-4" rx="4.2" ry="6.5" transform="rotate(-10 -7 -4)"/><circle cx="-8.5" cy="-13" r="1.5"/><circle cx="-5" cy="-13.5" r="1.3"/>
    <ellipse cx="7" cy="8" rx="4.2" ry="6.5" transform="rotate(10 7 8)"/><circle cx="8.5" cy="-1" r="1.5"/><circle cx="5" cy="-1.5" r="1.3"/><circle cx="-4" cy="6" r="1.8"/><circle cx="4" cy="18" r="1.8"/></g>`,
  megaphone: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 -4 h6 L10 -14 v28 L-10 4 h-6 Z"/><path d="M-8 4 v9 h6 v-7"/><path d="M14 -4 q4 4 0 8" /><path d="M17 -8 q7 8 0 16"/></g>`,
  shootingstar: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M6 -2 L8.5 3.5 L14.5 4 L10 8 L11.5 14 L6 11 L0.5 14 L2 8 L-2.5 4 L3.5 3.5 Z"/><path d="M-6 -6 L-16 -16 M-2 -12 L-8 -18 M-10 0 L-18 -6"/></g>`,
  glasses: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="-8" cy="2" r="6.5"/><circle cx="8" cy="2" r="6.5"/><path d="M-1.5 2 h3 M-14.5 0 L-18 -6 M14.5 0 L18 -6"/></g>`,
  library: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 16 h32"/><rect x="-14" y="-10" width="6" height="26"/><rect x="-6" y="-16" width="6" height="32"/><rect x="2" y="-6" width="6" height="22"/><path d="M10 -12 l6 -2 l4 28 l-6 1 Z"/></g>`,
  letters: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-17" y="-8" width="10" height="10" rx="1.5"/><rect x="-5" y="-8" width="10" height="10" rx="1.5"/><rect x="7" y="-8" width="10" height="10" rx="1.5"/><rect x="-11" y="4" width="10" height="10" rx="1.5"/><rect x="1" y="4" width="10" height="10" rx="1.5"/><path d="M-12 -3 v.1 M0 -3 v.1 M12 -3 v.1 M-6 9 v.1 M6 9 v.1" stroke-width="3"/></g>`,
  crossword: (s) => `<g fill="none" stroke="${s}" stroke-width="2" stroke-linejoin="round">
    <rect x="-15" y="-15" width="30" height="30"/><path d="M-5 -15 v30 M5 -15 v30 M-15 -5 h30 M-15 5 h30"/><rect x="-15" y="-15" width="10" height="10" fill="${s}"/><rect x="5" y="5" width="10" height="10" fill="${s}"/><rect x="-5" y="-5" width="10" height="10" fill="${s}"/></g>`,
  bolt: (s) => `<g fill="${s}" stroke="${s}" stroke-width="1.5" stroke-linejoin="round">
    <path d="M3 -18 L-11 3 L-1 3 L-4 18 L11 -4 L1 -4 Z"/></g>`,
  chain: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-18" y="-5" width="14" height="10" rx="5" transform="rotate(-30)"/><rect x="4" y="-5" width="14" height="10" rx="5" transform="rotate(-30)"/><path d="M-4 0 h8" transform="rotate(-30)"/></g>`,
  cherry: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="-7" cy="8" r="6"/><circle cx="8" cy="10" r="6"/><path d="M-7 2 Q-4 -10 6 -16 M8 4 Q6 -8 6 -16"/><path d="M6 -16 Q12 -18 16 -12" /></g>`,
  horseshoe: (s) => `<g fill="none" stroke="${s}" stroke-width="3" stroke-linecap="round">
    <path d="M-12 14 V-2 A12 12 0 0 1 12 -2 V14"/><path d="M-12 8 h-3 M12 8 h3 M-11 -4 h-3 M11 -4 h3" stroke-width="2"/></g>`,
  bell: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-13 10 Q-9 6 -9 -2 A9 9 0 0 1 9 -2 Q9 6 13 10 Z"/><path d="M0 -14 v3 M-4 14 a4 4 0 0 0 8 0"/></g>`,
  swords: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-14 -14 L8 8 M8 8 L13 13 M4 12 L12 4"/><path d="M14 -14 L-8 8 M-8 8 L-13 13 M-4 12 L-12 4"/><path d="M-14 -14 L-14 -9 M-14 -14 L-9 -14 M14 -14 L14 -9 M14 -14 L9 -14"/></g>`,
  eye: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M-17 0 Q0 -14 17 0 Q0 14 -17 0 Z"/><circle cx="0" cy="0" r="6"/><circle cx="1.5" cy="-1.5" r="1.8" fill="${s}" stroke="none"/></g>`,
  joystick: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 6 h32 v8 a3 3 0 0 1 -3 3 h-26 a3 3 0 0 1 -3 -3 Z"/><path d="M-4 6 V-6"/><circle cx="-4" cy="-11" r="5"/><circle cx="8" cy="11" r="1.6" fill="${s}"/><circle cx="12" cy="9" r="1.6" fill="${s}"/></g>`,
  map: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 -10 L-6 -14 L6 -10 L16 -14 V12 L6 16 L-6 12 L-16 16 Z"/><path d="M-6 -14 V12 M6 -10 V16"/><path d="M8 2 l2 2 l4 -4" /></g>`,
  anvil: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 -8 h30 q4 0 2 4 l-10 4 v8 h-14 v-8 q-10 -1 -8 -8 Z"/><path d="M-8 8 h14 M-12 14 h22"/></g>`,
  checklist: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-15" y="-15" width="30" height="30" rx="3"/><path d="M-10 -8 l3 3 l5 -6 M0 -7 h10"/><path d="M-10 1 l3 3 l5 -6 M0 2 h10"/><path d="M-10 10 l3 3 l5 -6 M0 11 h10"/></g>`,
  ladder: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linecap="round">
    <path d="M-8 -17 V17 M8 -17 V17"/><path d="M-8 -11 h16 M-8 -4 h16 M-8 3 h16 M-8 10 h16"/></g>`,
  weathervane: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 -4 V16 M-8 16 h16"/><path d="M-16 -8 L-4 -4 L4 -8 L16 -6 L4 -12 L-4 -10 Z"/><path d="M0 -17 v4 M-12 -14 l2 2 M12 -14 l-2 2"/></g>`,
  yearwheel: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round">
    <circle cx="0" cy="0" r="15"/><circle cx="0" cy="0" r="5"/><path d="M0 -15 V-5 M0 5 V15 M-15 0 H-5 M5 0 H15 M-10.6 -10.6 L-3.5 -3.5 M3.5 3.5 L10.6 10.6 M-10.6 10.6 L-3.5 3.5 M3.5 -3.5 L10.6 -10.6"/></g>`,
  ribbon: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="0" cy="-5" r="9"/><circle cx="0" cy="-5" r="4"/><path d="M-6 2 L-9 17 L-2 13 M6 2 L9 17 L2 13"/></g>`,
  flag: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-12 17 V-16"/><path d="M-12 -14 Q-2 -18 4 -13 Q10 -8 16 -12 V3 Q10 7 4 2 Q-2 -3 -12 1 Z"/></g>`,
  banner: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-17 -14 h34"/><path d="M-12 -14 V12 L0 6 L12 12 V-14"/><path d="M-5 -6 h10 M-5 0 h10"/></g>`,
  basket: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 -2 h32 l-4 18 h-24 Z"/><path d="M-10 -2 L-2 -14 M10 -2 L2 -14"/><path d="M-9 3 v9 M-3 3 v9 M3 3 v9 M9 3 v9"/></g>`,
  horn: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-16 2 h5 L4 -10 v22 L-11 2"/><path d="M-11 2 v8 h5"/><path d="M9 -4 a6 6 0 0 1 0 10 M13 -9 a12 12 0 0 1 0 20"/></g>`,
  handshake: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-18 -4 L-9 -8 L0 0 L4 -4 L13 -8 L18 -4"/><path d="M-9 0 L-2 6 M-5 -4 L2 2 M0 0 L7 7 L11 5 L3 -3"/><path d="M-18 6 L-11 8 M18 6 L11 8"/></g>`,
  envelope: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-16" y="-11" width="32" height="22" rx="2"/><path d="M-16 -9 L0 3 L16 -9"/><path d="M-16 11 L-5 0 M16 11 L5 0"/></g>`,
  people: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="-7" cy="-6" r="5"/><circle cx="8" cy="-4" r="4"/><path d="M-16 14 Q-16 2 -7 2 Q2 2 2 14 Z"/><path d="M4 14 Q4 5 8 4 Q16 5 16 14 Z"/></g>`,
  thumbs: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-14 0 h6 v14 h-6 Z"/><path d="M-8 2 L-2 -12 Q3 -12 2 -6 L1 0 h10 a3 3 0 0 1 3 3 l-3 10 a2 2 0 0 1 -2 1 h-17"/></g>`,
  parcel: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-14" y="-6" width="28" height="22" rx="2"/><path d="M-14 -6 h28 M0 -6 v22"/><path d="M0 -6 Q-8 -8 -8 -13 Q-4 -16 0 -6 Q4 -16 8 -13 Q8 -8 0 -6"/><path d="M-14 4 h28" stroke-width="1.6"/></g>`,
  paddle: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-11" y="-17" width="22" height="18" rx="2"/><path d="M0 1 V17"/><path d="M-4 -12 h8 M-4 -8 h8" /></g>`,
  lectern: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-14 -12 h28 l-3 8 h-22 Z"/><path d="M-5 -4 V16 M5 -4 V16 M-10 16 h20"/><path d="M-6 -16 l12 -2" /></g>`,
  ingot: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-12 -2 h24 l4 12 h-32 Z"/><path d="M-9 -10 h18 l3 8 h-24 Z"/><path d="M-3 4 h6" stroke-width="1.6"/></g>`,
  cart: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-17 -12 h5 l4 18 h18 l4 -12 h-24"/><circle cx="-5" cy="13" r="2.4"/><circle cx="8" cy="13" r="2.4"/><path d="M-4 0 h12" /></g>`,
  banknote: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-17" y="-9" width="34" height="18" rx="2"/><circle cx="0" cy="0" r="5"/><path d="M-13 -5 v10 M13 -5 v10"/></g>`,
  crate: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-15" y="-13" width="30" height="26" rx="1"/><path d="M-15 -13 L15 13 M15 -13 L-15 13 M-15 -3 h30 M-15 3 h30" stroke-width="1.6"/></g>`,
  inkdrop: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-12 0 h24 v14 a3 3 0 0 1 -3 3 h-18 a3 3 0 0 1 -3 -3 Z"/><path d="M-8 0 v-4 h16 v4"/><path d="M4 -17 C6 -13 8 -11 8 -9 a4 4 0 0 1 -8 0 c0 -2 2 -4 4 -8 Z"/></g>`,
  brush: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 -16 L-2 0" stroke-width="3"/><path d="M-2 0 Q-10 0 -10 8 Q-14 12 -16 16 Q-4 16 -2 8 Q4 6 2 2 Z"/></g>`,
  sparkles: (s) => `<g fill="${s}" stroke="none">
    <path d="M-4 -16 L-1.5 -8 L6 -5.5 L-1.5 -3 L-4 5 L-6.5 -3 L-14 -5.5 L-6.5 -8 Z"/><path d="M10 0 L11.5 5 L16 6.5 L11.5 8 L10 13 L8.5 8 L4 6.5 L8.5 5 Z"/><path d="M-8 8 L-7 11 L-4 12 L-7 13 L-8 16 L-9 13 L-12 12 L-9 11 Z"/></g>`,
  palette: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M0 -16 C-10 -16 -17 -9 -17 0 C-17 9 -10 15 -2 15 C2 15 2 11 0 9 C-2 6 2 4 6 5 C13 6 17 2 17 -4 C17 -11 9 -16 0 -16 Z"/><circle cx="-8" cy="-6" r="2.2" fill="${s}"/><circle cx="0" cy="-10" r="2.2" fill="${s}"/><circle cx="8" cy="-6" r="2.2" fill="${s}"/><circle cx="-10" cy="3" r="2.2" fill="${s}"/></g>`,
  frame: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-16" y="-16" width="32" height="32" rx="2"/><rect x="-10" y="-10" width="20" height="20"/><path d="M-16 -16 L-10 -10 M16 -16 L10 -10 M-16 16 L-10 10 M16 16 L10 10" stroke-width="1.6"/></g>`,
  sunrise: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round">
    <path d="M-12 8 A12 12 0 0 1 12 8"/><path d="M-18 8 h36 M-14 14 h28"/><path d="M0 -14 v4 M-11 -8 l2.5 2.5 M11 -8 l-2.5 2.5 M-17 0 h4 M13 0 h4"/></g>`,
  seven: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-16" y="-14" width="32" height="28" rx="3"/><path d="M-16 -7 h32"/><path d="M-6 -1 h12 l-8 12" stroke-width="2.8"/></g>`,
  laurelone: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-3 12 V-10 L-8 -6"/><path d="M-3 12 h-4 M-3 12 h4" /><path d="M-16 -4 Q-18 8 -8 14 M-14 -2 q-4 4 -2 8 M-12 4 q-3 4 0 8"/><path d="M16 -4 Q18 8 8 14 M14 -2 q4 4 2 8 M12 4 q3 4 0 8"/></g>`,
  crossedcards: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-14" y="-12" width="16" height="24" rx="2.5" transform="rotate(-18)"/><rect x="-2" y="-12" width="16" height="24" rx="2.5" transform="rotate(18)"/>
    <path d="M-8 -4 l3 3 M8 0 l-3 3" stroke-width="1.8"/></g>`,
  stopwatch: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="0" cy="2" r="13"/><path d="M0 2 L6 -3"/><path d="M-4 -15 h8 M0 -15 v4 M11 -9 l3 -3"/></g>`,
  /* --- the season motifs (src/data/seasons.js) --- */
  flake: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linecap="round">
    <path d="M0 -16 V16 M-14 -8 L14 8 M-14 8 L14 -8"/>
    <path d="M0 -16 l-4 4 M0 -16 l4 4 M0 16 l-4 -4 M0 16 l4 -4 M-14 -8 l0 5.5 M-14 -8 l5 -1.5 M14 8 l0 -5.5 M14 8 l-5 1.5 M-14 8 l5 1.5 M-14 8 l0 -5.5 M14 -8 l-5 -1.5 M14 -8 l0 5.5"/></g>`,
  sprout: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 16 V-2"/><path d="M0 4 Q-12 6 -13 -6 Q-2 -6 0 4 Z"/><path d="M0 -2 Q12 0 13 -12 Q2 -12 0 -2 Z"/></g>`,
  egg: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M0 -16 Q13 -6 13 5 Q13 16 0 16 Q-13 16 -13 5 Q-13 -6 0 -16 Z"/>
    <path d="M-11 2 l4 -3 4 3 4 -3 4 3 4 -3" stroke-width="2"/><path d="M-9 8 l3 -2 3 2 3 -2 3 2 3 -2 3 2" stroke-width="2"/></g>`,
  flower: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <circle cx="0" cy="0" r="4"/>
    <path d="M0 -4 Q-5 -14 0 -16 Q5 -14 0 -4 Z M4 0 Q14 -5 16 0 Q14 5 4 0 Z M0 4 Q5 14 0 16 Q-5 14 0 4 Z M-4 0 Q-14 5 -16 0 Q-14 -5 -4 0 Z"/></g>`,
  sun: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linecap="round">
    <circle cx="0" cy="0" r="7"/>
    <path d="M0 -16 v4 M0 12 v4 M-16 0 h4 M12 0 h4 M-11.3 -11.3 l2.8 2.8 M8.5 8.5 l2.8 2.8 M-11.3 11.3 l2.8 -2.8 M8.5 -8.5 l2.8 -2.8"/></g>`,
  compass: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <circle cx="0" cy="0" r="15"/>
    <path d="M0 -11 L4 0 L0 11 L-4 0 Z"/><path d="M-4 0 L0 -11 L4 0 Z" fill="${s}" stroke="none"/></g>`,
  leaf: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-13 13 Q-13 -13 15 -15 Q17 13 -13 13 Z"/><path d="M-13 13 Q-2 2 11 -11"/><path d="M-4 4 l6 1 M1 -1 l6 1 M-8 8 l5 1"/></g>`,
  ghost: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-12 14 V-2 A12 12 0 0 1 12 -2 V14 L8 10 L4 14 L0 10 L-4 14 L-8 10 Z"/>
    <path d="M-5 -1 a1.6 1.6 0 1 0 .1 0 M5 -1 a1.6 1.6 0 1 0 .1 0"/></g>`,
  candle: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-6" y="-2" width="12" height="18" rx="2"/><path d="M0 -2 V-6"/>
    <path d="M0 -16 Q-4 -11 0 -7 Q4 -11 0 -16 Z"/></g>`,
  tree: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 -16 L8 -6 H4 L11 4 H6 L14 14 H-14 L-6 4 H-11 L-4 -6 H-8 Z"/><path d="M-2 14 v3 h4 v-3"/><path d="M-3 2 h.1 M4 -3 h.1 M2 8 h.1"/></g>`,
  /* A speech bubble laughing: shut eyes, wide mouth. */
  laugh: (s) => `<g fill="none" stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -16 -14 Q -16 -17 -13 -17 L 13 -17 Q 16 -17 16 -14 L 16 5 Q 16 8 13 8 L -2 8 L -10 16 L -8 8 L -13 8 Q -16 8 -16 5 Z"/>
    <path d="M -10 -8 Q -7 -12 -4 -8 M 4 -8 Q 7 -12 10 -8"/>
    <path d="M -8 -2 Q 0 8 8 -2 Z" fill="${s}"/></g>`,
  /* A winged bull, in profile. */
  lamassu: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M -16 4 Q -14 -6 -2 -8 L 12 -8 Q 17 -8 17 -3 L 17 14 M 12 14 L 12 4 M 4 14 L 4 4 M -4 14 L -4 4 M -12 14 L -12 3"/>
    <path d="M -2 -8 Q -5 -16 3 -18 L 12 -18 Q 17 -18 17 -13 L 17 -8"/>
    <path d="M -3 -7 L -13 -13 Q -14 -3 -3 0 Z"/>
    <path d="M 6 -20 L 5 -24 M 12 -20 L 13 -24"/></g>`,
  /* An eight-bit heart. */
  pixel: (s) => `<g fill="${s}" stroke="none">
    <path d="M -14 -10 h 6 v -4 h 6 v 4 h 4 v -4 h 6 v 4 h 6 v 8 h -4 v 4 h -4 v 4 h -4 v 4 h -4 v -4 h -4 v -4 h -4 v -4 h -4 Z" fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M -10 -8 h 4 v 4 h -4 Z"/></g>`,
  /* Two dice, one showing five, one showing three. */
  dice: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="-17" y="-12" width="16" height="16" rx="3" transform="rotate(-10)"/>
    <rect x="2" y="-4" width="16" height="16" rx="3" transform="rotate(10)"/>
    <g fill="${s}" stroke="none">
      <circle cx="-13" cy="-9" r="1.6" transform="rotate(-10)"/><circle cx="-5" cy="-9" r="1.6" transform="rotate(-10)"/>
      <circle cx="-9" cy="-4" r="1.6" transform="rotate(-10)"/>
      <circle cx="-13" cy="1" r="1.6" transform="rotate(-10)"/><circle cx="-5" cy="1" r="1.6" transform="rotate(-10)"/>
      <circle cx="6" cy="0" r="1.6" transform="rotate(10)"/><circle cx="10" cy="4" r="1.6" transform="rotate(10)"/><circle cx="14" cy="8" r="1.6" transform="rotate(10)"/>
    </g></g>`,
  /* A wax seal with the W pressed into it, for The Creator. */
  seal: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 -15 Q9 -17 13 -9 Q19 -4 15 4 Q16 12 8 15 Q2 20 -5 16 Q-13 17 -15 9 Q-20 3 -15 -3 Q-16 -11 -8 -13 Q-5 -18 0 -15 Z"/>
    <path d="M-8 -5 L-4 6 L0 -2 L4 6 L8 -5"/></g>`,
  /* A half wheel of cheese under the lamp, for Julien. */
  wheel: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-17 4 A17 17 0 0 1 17 4 Z"/><path d="M-17 4 v7 h34 v-7"/><path d="M-6 -2 a2 2 0 1 0 .1 0 M6 -4 a1.6 1.6 0 1 0 .1 0"/></g>`,
  /* An open book, for Catherine. */
  openbook: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 -9 Q-8 -14 -17 -11 V11 Q-8 8 0 13 Q8 8 17 11 V-11 Q8 -14 0 -9 Z"/><path d="M0 -9 V13"/><path d="M-12 -6 Q-7 -7 -4 -5 M-12 0 Q-7 -1 -4 1 M4 -5 Q7 -7 12 -6 M4 1 Q7 -1 12 0"/></g>`,
  /* A pot of yoghurt with the spoon in it, for Mathilde. */
  pot: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-13 -8 h26 l-3 22 h-20 Z"/><path d="M-15 -8 h30"/><path d="M4 -15 l6 12"/><path d="M-8 2 h6"/></g>`,
  /* A skull in flames, for the Hellfire code. */
  hellfire: (s) => `<g fill="none" stroke="${s}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-9 4 a9 8 0 0 1 18 0 c0 3-1.5 5-3.5 6.5 V15 h-11 v-4.5 C-7.5 9 -9 7 -9 4 Z"/>
    <path d="M-5 4 a1.8 1.8 0 1 0 .1 0 M5 4 a1.8 1.8 0 1 0 .1 0"/><path d="M-2 15 v2 M2 15 v2"/>
    <path d="M0 -19 c-3 4 -6 7 -6 11 0 2 1 3 2 4 0-3 1-4 3-5 -1 2 0 4 1 5 1-1 2-3 2-5 2 1 3 2 3 5 1-1 2-2 2-4 0-4 -4 -7 -7 -11 Z"/>
    <path d="M-14 -3 c-2 3 -3 6 -2 9 M14 -3 c2 3 3 6 2 9"/></g>`
};

/**
 * One chip. `rank` 0 draws the locked press; higher ranks brighten the foil
 * and add a pip per rank under the motif. Ids are deterministic so repeated
 * chips share definitions instead of fighting over them.
 */
/** The outer and inner plates, and the clip, for a chip's shape. */
function plate(shape, r, attrs) {
  const k = r / 40;
  switch (shape) {
    case 'circle': return `<circle cx="0" cy="0" r="${r}" ${attrs}/>`;
    case 'diamond': return `<polygon points="0,${-r * 1.08} ${r * 1.08},0 0,${r * 1.08} ${-r * 1.08},0" ${attrs}/>`;
    case 'octagon': return `<polygon points="${Array.from({ length: 8 }, (_, i) => { const a = (-90 + 22.5 + i * 45) * Math.PI / 180; return `${(r * 1.04 * Math.cos(a)).toFixed(2)},${(r * 1.04 * Math.sin(a)).toFixed(2)}`; }).join(' ')}" ${attrs}/>`;
    case 'square': return `<rect x="${-r * 0.92}" y="${-r * 0.92}" width="${r * 1.84}" height="${r * 1.84}" rx="${9 * k}" ${attrs}/>`;
    case 'shield': return `<path d="M ${-r * 0.95} ${-r * 0.8} Q 0 ${-r * 1.05} ${r * 0.95} ${-r * 0.8} L ${r * 0.95} ${r * 0.1} Q ${r * 0.95} ${r * 0.75} 0 ${r * 1.05} Q ${-r * 0.95} ${r * 0.75} ${-r * 0.95} ${r * 0.1} Z" ${attrs}/>`;
    default: return `<polygon points="${hexPoints(r)}" ${attrs}/>`;
  }
}

/**
 * One chip. `rank` 0 draws the locked press; higher ranks brighten the foil
 * and add a pip per rank under the motif. Ids are deterministic so repeated
 * chips share definitions instead of fighting over them.
 */
export function badgeSvg(badge, rank, max, { size = 64 } = {}) {
  const uid = `pwb-${badge.id}-${Math.min(rank, FOILS.length - 1)}`;
  const foil = rank > 0 && badge.foil ? badge.foil : FOILS[Math.min(rank, FOILS.length - 1)];
  const locked = rank <= 0;
  const stops = foil.map((c, i) => [i / Math.max(foil.length - 1, 1), c]);
  const ink = locked ? '#67719c' : '#ffffff';
  const shape = badge.shape ?? 'hex';

  const pipRow = max > 1 ? Array.from({ length: max }, (_, i) => {
    const x = (i - (max - 1) / 2) * 8;
    const on = i < rank;
    return `<polygon points="${x},23.6 ${x + 2.6},26.2 ${x},28.8 ${x - 2.6},26.2"
      fill="${on ? foil[Math.min(1, foil.length - 1)] : 'none'}" stroke="${on ? 'none' : '#4a5478'}" stroke-width="1"/>`;
  }).join('') : '';

  const live = !locked && badge.live ? ` class="badge-live badge-live-${badge.live}"` : '';
  return `<svg viewBox="-50 -46 100 96" width="${size}" height="${size * 0.96}" aria-hidden="true" style="display:block"${live}>
    <defs>
      <linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
      <clipPath id="${uid}c">${plate(shape, 40, '')}</clipPath>
    </defs>
    ${plate(shape, 40, `fill="url(#${uid}g)" stroke="${locked ? '#4a5478' : '#ffffff'}" stroke-opacity="${locked ? 1 : 0.8}" stroke-width="1.8" stroke-linejoin="round"`)}
    ${plate(shape, 32.5, `fill="#151936" fill-opacity="${locked ? 0.92 : 0.82}"`)}
    ${live ? `<g clip-path="url(#${uid}c)" class="badge-flames">
      <path class="badge-flame is-1" d="M-26 40 C-24 22 -14 14 -18 -2 C-8 8 -6 20 -10 34 C-2 22 4 8 -2 -8 C10 4 12 22 6 34 C14 24 18 10 12 -4 C24 10 26 26 26 40 Z" fill="#fa8072" opacity="0.55"/>
      <path class="badge-flame is-2" d="M-22 40 C-20 26 -12 20 -14 8 C-6 16 -4 26 -8 36 C-2 26 2 16 -2 4 C8 14 10 26 4 36 C12 28 14 16 10 6 C20 16 22 30 22 40 Z" fill="#ffb3a7" opacity="0.5"/>
      <path class="badge-flame is-3" d="M-14 40 C-12 30 -8 26 -8 18 C-2 24 0 30 -2 38 C2 30 6 24 4 16 C10 24 12 32 12 40 Z" fill="#fff1ec" opacity="0.55"/>
    </g>` : ''}
    <g transform="translate(0,-3)">${(MOTIFS[badge.motif] ?? MOTIFS.star)(ink)}</g>
    ${pipRow}
    ${locked ? '' : `<g clip-path="url(#${uid}c)"><rect x="-64" y="-13" width="128" height="14" fill="#ffffff" opacity=".3" transform="rotate(-32)"/></g>`}
  </svg>`;
}

/**
 * A badge as a friend's profile row reports it: the id and the rank, no
 * evaluation of their save. The rungs are read off the achievement table,
 * so the sheet can still say what each rank took.
 */
export function badgeStateFromRank(id, rank) {
  const badge = BADGES.find((b) => b.id === id);
  if (!badge) return null;
  const rungs = badge.chain
    ? ACHIEVEMENTS.filter((a) => a.chain === badge.chain && a.tier >= badge.from)
    : badge.ach ? ACHIEVEMENTS.filter((a) => a.id === badge.ach) : [];
  const max = badge.code || badge.season ? 1 : Math.max(1, rungs.length);
  const r = Math.max(0, Math.min(max, Number(rank) || 0));
  const list = rungs.length
    ? rungs.map((a, i) => ({ id: a.id, unlocked: i < r, tier: i + 1, name: tx(a.name), desc: tx(a.desc) }))
    : [{ id: `${badge.code ? 'code' : 'season'}:${badge.id}`, unlocked: r > 0, tier: 1, name: tx(badge.name), desc: tx(badge.code ? CODE_RUNG : SEASON_RUNG) }];
  return { badge, rank: r, max, rungs: list, next: list.find((x) => !x.unlocked) ?? null, name: tx(badge.name) };
}
