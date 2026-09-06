import { RARITIES } from './data/rarities.js';
/**
 * ACHIEVEMENTS
 * ============================================================================
 * Three hundred and more goals across the whole game. Each achievement is COMPUTED from
 * the player's real state - nothing is "awarded" at some moment that could be
 * missed; if the condition holds, the achievement is unlocked. The only thing
 * stored is which ones have been REDEEMED (the reward taken), on the profile:
 *
 *   profile.achievements = { redeemed: ['first-pack', ...] }
 *
 * Most achievements come in CHAINS - the same feat at rising sizes. A chain
 * member carries `chain` (the family id) and `tier` (1-based rung), which is
 * what upgradeable badges hang off later.
 *
 * Rewards scale with difficulty, deliberately stingy at the bottom: the first
 * rung of anything pays pocket change, the middle pays real coins, and only
 * the rungs that take weeks pay in boosters - up to a Prismatic pack for the
 * level cap. Easy money here was quietly out-earning the shop.
 */
import { tx } from './i18n.js';

/**
 * The measurable facts achievements are judged against. main.js builds one
 * of these from live state whenever the list is rendered.
 */
export function measure({ profile, entries, albumsDeep, albumsStarted = 0, albumsHundred = 0, customPacks, friends, wallet = 0,
  wikdle = null, wishlist = 0, badgesWorn = 0, signedIn = false, specials = 0 }) {
  const L = profile.ledger ?? {};
  const n = (key) => Number(L[key]) || 0;
  const size = (key) => (Array.isArray(L[key]) ? L[key].length : 0);
  const owned = profile.owned ?? {};
  const seasons = Object.values(profile.seasons ?? {});
  const rc = profile.rarityCounts ?? {};
  const high = ['legendary', 'mythic', 'exotic', 'prismatic']
    .reduce((sum, id) => sum + (rc[id] ?? 0), 0);
  return {
    boosters: profile.boostersOpened ?? 0,
    cards: Object.values(rc).reduce((sum, n) => sum + n, 0),
    unique: entries.length,
    value: entries.reduce((sum, e) => sum + e.price * e.count, 0),
    level: profile.progress?.level ?? 1,
    albumsDeep,
    albumsStarted,
    legendaries: high,
    prismatics: rc.prismatic ?? 0,
    // Builds ever, not packs currently on the shelf: deleting one must not
    // take an achievement back. The max() keeps old saves whole, since the
    // counter only started existing after their packs did.
    customsBuilt: Math.max(customPacks.length, profile.packsBuilt ?? 0),
    friends,
    dailyClaims: (profile.daily?.board ?? 0) * 30 + (profile.daily?.claimed ?? 0),
    boardsDone: profile.daily?.board ?? 0,
    playHours: (profile.playMs ?? 0) / 3600000,
    sold: profile.cardsSold ?? 0,
    quizPlayed: profile.quizPlayed ?? 0,
    quizWins: profile.quizWins ?? 0,
    quizPerfect: profile.quizPerfect ?? 0,
    giftsSent: profile.giftsSent ?? 0,
    tradesDone: profile.tradesDone ?? 0,
    timedOpened: profile.timed?.opened ?? 0,
    auctionsSold: profile.auctionsSold ?? 0,
    auctionsWon: profile.auctionsWon ?? 0,
    wallet,
    maxCardPrice: entries.reduce((m, e) => Math.max(m, e.price), 0),
    maxViews: entries.reduce((m, e) => Math.max(m, e.views ?? 0), 0),
    favorites: entries.filter((e) => e.favorite).length,
    maxCopies: entries.reduce((m, e) => Math.max(m, e.count), 0),
    // The eight tiers of the table: Special is outside it and a card with no
    // tier on record is not a ninth one.
    raritiesOwned: new Set(entries.map((e) => e.rarityId).filter((id) => RARITIES.some((r) => r.id === id))).size,
    // Album medals claimed, across every album; and cards fused up a tier.
    albumTiers: Object.values(profile.albumTiers ?? {}).reduce((sum, n) => sum + (Number(n) || 0), 0),
    fused: profile.fused ?? 0,
    // The arcade's two newer games: the best duel streak, and perfect reveal rounds.
    duelBest: profile.duelBest ?? 0,
    revealPerfect: profile.revealPerfect ?? 0,

    /* --- the second two hundred ---------------------------------------- */
    commons: rc.common ?? 0, uncommons: rc.uncommon ?? 0, rares: rc.rare ?? 0, epics: rc.epic ?? 0,
    mythics: rc.mythic ?? 0, exotics: rc.exotic ?? 0,
    opensBasic: n('opens_open'), opensTheme: n('opens_theme'), opensCustom: n('opens_custom'),
    opensToday: n('opens_today'), opensSeason: n('opensSeason'), opensTier: n('opensTier'), opensTimed: n('opens_timed'),
    subjects: size('subjects'), newPulls: n('newPulls'), famousPulls: n('famousPulls'), wishGranted: n('wishGranted'),
    wishlist, articleViews: n('articleViews'), albumsHundred, specials,
    wikdlePlays: Math.max(n('wikdlePlays'), wikdle?.played ?? 0), wikdleWins: Math.max(n('wikdleWins'), wikdle?.won ?? 0),
    wikdleFast: n('wikdleFast'), wikdleStreak: wikdle?.best ?? 0,
    slotsSpins: n('slotsSpins'), slotsWins: n('slotsWins'), slotsTriples: n('slotsTriples'),
    duelRounds: profile.duelRounds ?? 0, revealRounds: profile.revealRounds ?? 0, arcadePoints: n('arcadePoints'),
    questsClaimed: n('questsClaimed'), questsHard: n('questsHard'), questDays: n('questDays'),
    seasonRungs: n('seasonRungs'), seasonPoints: seasons.reduce((sum, s) => sum + (Number(s?.points) || 0), 0),
    seasonsPlayed: seasons.filter((s) => (Number(s?.points) || 0) > 0).length,
    seasonBadges: (profile.seasonUnlocks?.badges ?? []).length, seasonQuests: n('seasonQuests'),
    guildsJoined: n('guildsJoined'), guildsFounded: n('guildsFounded'), guildGoals: n('guildGoals'), guildMatches: n('guildMatches'),
    guildDonated: n('guildDonated'), guildTaken: n('guildTaken'), guildChats: n('guildChats'), guildInvites: n('guildInvites'),
    messagesSent: n('messagesSent'), conversations: size('conversations'), kudosGiven: n('kudosGiven'), giftsReceived: n('giftsReceived'),
    showcase: Array.isArray(profile.showcase) ? profile.showcase.filter(Boolean).length : 0,
    avatarSet: n('avatarSet'), badgesWorn, signedIn: signedIn ? 1 : 0,
    bidsPlaced: n('bidsPlaced'), auctionsListed: n('auctionsListed'), auctionBest: n('auctionBest'),
    shopBuys: n('shopBuys'), spent: n('spent'), crates: n('crates'), bundles: n('bundles'), tierBuys: n('tierBuys'), sellEarned: n('sellEarned'),
    inkEarned: n('inkEarned'), inkSpent: n('inkSpent'),
    themesOwned: (owned.themes ?? []).length, framesOwned: (owned.frames ?? []).length, fxOwned: (owned.fx ?? []).length,
    themesWorn: size('themesWorn'), framesWorn: size('framesWorn'), fxWorn: size('fxWorn'), atelierBuys: n('atelierBuys'),
    codesRedeemed: Object.values(profile.codesRedeemed ?? {}).filter((v) => Number(v) > 0).length,
    playDays: n('playDays'), giftWeeks: profile.daily?.weeks ?? 0,
    boardTop100: n('bestRank') > 0 && n('bestRank') <= 100 ? 1 : 0,
    boardTop10: n('bestRank') > 0 && n('bestRank') <= 10 ? 1 : 0,
    boardFirst: n('bestRank') === 1 ? 1 : 0,
    backups: n('backups')
  };
}

const coins = (n) => ({ kind: 'coins', coins: n });
const pack = (rarityId, cards = 5) => ({ kind: 'booster', spec: { kind: 'open', themeId: null, rarityId, cards } });

/** "1,500" / "1 500" - descriptions carry the number in each language. */
const en = (n) => n.toLocaleString('en-US');
const fr = (n) => n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');

/** One standalone achievement. */
const A = (id, icon, stat, need, reward, name, desc) =>
  ({ id, icon, stat, need, reward, name, desc });

/**
 * One family of achievements: same stat, rising `need`s. `desc` writes the
 * description for a given size, so the copy never drifts from the number.
 */
const chain = (chainId, icon, stat, desc, steps) => steps.map(([need, reward, name], i) => ({
  id: `${chainId}-${need}`, icon, stat, need, reward,
  name, desc: desc(need, i), chain: chainId, tier: i + 1
}));

export const ACHIEVEMENTS = [

  // --- album medals ---
  ...chain('medal', 'collection', 'albumTiers',
    (n) => ({ en: `Claim ${en(n)} album medal${n === 1 ? '' : 's'}`, fr: `Réclamez ${fr(n)} médaille${n === 1 ? '' : 's'} d’album` }),
    [
      [1,  coins(500),        { en: 'First medal', fr: 'Première médaille' }],
      [5,  coins(2500),       { en: 'A shelf of medals', fr: 'Une étagère de médailles' }],
      [15, pack('legendary', 5), { en: 'Decorated', fr: 'Décoré' }],
      [40, pack('exotic', 5), { en: 'The full cabinet', fr: 'La vitrine complète' }]
    ]),

  // --- the popularity duel ---
  ...chain('duel', 'podium', 'duelBest',
    (n) => ({ en: `A duel streak of ${en(n)}`, fr: `Une série de ${fr(n)} au duel` }),
    [
      [3,  coins(150),        { en: 'Warm-up', fr: 'Échauffement' }],
      [6,  coins(500),        { en: 'Reading the room', fr: 'Lire la salle' }],
      [10, coins(1500),       { en: 'Encyclopaedic', fr: 'Encyclopédique' }],
      [15, pack('legendary', 5), { en: 'The perfect duel', fr: 'Le duel parfait' }]
    ]),

  // --- guess the article ---
  ...chain('reveal', 'search', 'revealPerfect',
    (n) => ({ en: `${en(n)} perfect reveal round${n === 1 ? '' : 's'}`, fr: `${fr(n)} manche${n === 1 ? '' : 's'} parfaite${n === 1 ? '' : 's'} de devinette` }),
    [
      [1,  coins(300),        { en: 'Eight for eight', fr: 'Huit sur huit' }],
      [5,  coins(1200),       { en: 'Sharp eyes', fr: 'L’œil vif' }],
      [20, pack('mythic', 5), { en: 'Through the blur', fr: 'À travers le flou' }]
    ]),

  // --- fusing copies ---
  ...chain('fuse', 'spark', 'fused',
    (n) => ({ en: `Fuse ${en(n)} set${n === 1 ? '' : 's'} of copies`, fr: `Fusionnez ${fr(n)} lot${n === 1 ? '' : 's'} de doubles` }),
    [
      [1,   coins(200),      { en: 'Three into one', fr: 'Trois en un' }],
      [10,  coins(1200),     { en: 'Alchemist', fr: 'Alchimiste' }],
      [50,  pack('mythic', 5), { en: 'The furnace', fr: 'La fournaise' }]
    ]),

  // --- opening boosters ---
  ...chain('pack', 'packs', 'boosters',
    (n) => ({ en: `Open ${en(n)} boosters`, fr: `Ouvrez ${fr(n)} boosters` }),
    [
      [1,    coins(100),        { en: 'First rip', fr: 'Première ouverture' }],
      [10,   coins(250),        { en: 'Getting the hang of it', fr: 'La main est prise' }],
      [50,   coins(800),        { en: 'Serial opener', fr: 'Ouvreur en série' }],
      [150,  coins(2000),       { en: 'Foil in the veins', fr: 'Du papier alu dans les veines' }],
      [400,  pack('epic', 5),   { en: 'Confetti machine', fr: 'Machine à confettis' }],
      [1000, pack('mythic', 5), { en: 'The thousand rips', fr: 'Les mille déchirures' }]
    ]),

  // --- cards pulled ---
  ...chain('cards', 'collection', 'cards',
    (n) => ({ en: `Pull ${en(n)} cards`, fr: `Tirez ${fr(n)} cartes` }),
    [
      [25,   coins(100),           { en: 'A start', fr: 'Un début' }],
      [100,  coins(300),           { en: 'Stacking up', fr: 'Ça s’empile' }],
      [300,  coins(900),           { en: 'The shoebox', fr: 'La boîte à chaussures' }],
      [800,  coins(2200),          { en: 'The great pile', fr: 'La grande pile' }],
      [2000, pack('legendary', 5), { en: 'Paper avalanche', fr: 'Avalanche de papier' }],
      [5000, pack('exotic', 5),    { en: 'Five thousand deep', fr: 'Cinq mille plus loin' }]
    ]),

  // --- different cards owned ---
  ...chain('unique', 'search', 'unique',
    (n) => ({ en: `Own ${en(n)} different cards`, fr: `Possédez ${fr(n)} cartes différentes` }),
    [
      [50,   coins(200),        { en: 'Curator', fr: 'Curateur' }],
      [150,  coins(700),        { en: 'Cataloguer', fr: 'Catalogueur' }],
      [400,  coins(2000),       { en: 'Field guide', fr: 'Guide de terrain' }],
      [1000, pack('mythic', 5), { en: 'The living encyclopedia', fr: 'L’encyclopédie vivante' }]
    ]),

  // --- collection value ---
  ...chain('value', 'gem', 'value',
    (n) => ({ en: `Collection worth ฿${en(n)}`, fr: `Collection à ฿${fr(n)}` }),
    [
      [10000,   coins(250),           { en: 'Worth something', fr: 'Ça vaut quelque chose' }],
      [50000,   coins(1000),          { en: 'Serious money', fr: 'Sérieux capital' }],
      [150000,  coins(2500),          { en: 'Small fortune', fr: 'Petite fortune' }],
      [500000,  pack('legendary', 6), { en: 'The vault', fr: 'Le coffre-fort' }],
      [1500000, pack('exotic', 6),    { en: 'Priceless, almost', fr: 'Inestimable, ou presque' }]
    ]),

  // --- level ---
  ...chain('level', 'trophy', 'level',
    (n) => ({ en: `Reach level ${en(n)}`, fr: `Atteignez le niveau ${fr(n)}` }),
    [
      [5,   coins(150),           { en: 'Warmed up', fr: 'Échauffé' }],
      [10,  coins(300),           { en: 'Settled in', fr: 'Installé' }],
      [20,  coins(700),           { en: 'Veteran', fr: 'Vétéran' }],
      [30,  coins(1200),          { en: 'Living legend', fr: 'Légende vivante' }],
      [50,  coins(2500),          { en: 'Half a hundred', fr: 'Un demi-cent' }],
      [75,  pack('epic', 6),      { en: 'Scholar', fr: 'Érudit' }],
      [100, pack('legendary', 6), { en: 'The third digit', fr: 'Le troisième chiffre' }],
      [200, pack('mythic', 6),    { en: 'Beyond the clouds', fr: 'Au-dessus des nuages' }],
      [350, pack('exotic', 6),    { en: 'Stratosphere', fr: 'Stratosphère' }],
      [500, pack('prismatic', 6), { en: 'The summit', fr: 'Le sommet' }]
    ]),

  // --- albums with real depth --------------------------------------------
  // An album is measured against its category's true size, so "complete" is
  // not a thing anyone will ever do. Depth is the shelf that looks collected:
  // twenty five cards in one book.
  ...chain('album', 'collection', 'albumsDeep',
    (n) => n === 1
      ? { en: 'Get 25 cards into one album', fr: 'Réunissez 25 cartes dans un album' }
      : { en: `Stock ${en(n)} albums with 25 cards each`, fr: `Garnissez ${fr(n)} albums de 25 cartes chacun` },
    [
      [1,  coins(500),          { en: 'Bound and shelved', fr: 'Relié et rangé' }],
      [3,  coins(1500),         { en: 'Librarian', fr: 'Bibliothécaire' }],
      [6,  pack('epic', 5),     { en: 'Wing of the library', fr: 'L’aile de la bibliothèque' }],
      [12, pack('legendary', 5), { en: 'The archive', fr: 'L’archive' }],
      [20, pack('mythic', 6),   { en: 'The whole shelf', fr: 'Toute l’étagère' }]
    ]),

  // --- albums started ---
  ...chain('shelf', 'collection', 'albumsStarted',
    (n) => ({ en: `Put a card in ${en(n)} different albums`, fr: `Placez une carte dans ${fr(n)} albums différents` }),
    [
      [3,  coins(150),  { en: 'Dipping in', fr: 'On y trempe' }],
      [10, coins(600),  { en: 'A bit of everything', fr: 'Un peu de tout' }],
      [20, coins(1800), { en: 'Wide open shelves', fr: 'Étagères grandes ouvertes' }]
    ]),

  // --- big pulls ---
  ...chain('legendary', 'spark', 'legendaries',
    (n) => n === 1
      ? { en: 'Pull a Legendary or better', fr: 'Tirez une Légendaire ou mieux' }
      : { en: `Pull ${en(n)} Legendary-or-better cards`, fr: `Tirez ${fr(n)} cartes Légendaires ou mieux` },
    [
      [1,   coins(300),           { en: 'It shines', fr: 'Ça brille' }],
      [10,  coins(1500),          { en: 'Star magnet', fr: 'Aimant à étoiles' }],
      [40,  pack('legendary', 5), { en: 'Gold rush', fr: 'Ruée vers l’or' }],
      [120, pack('exotic', 5),    { en: 'Walking supernova', fr: 'Supernova ambulante' }]
    ]),

  ...chain('prismatic', 'gem', 'prismatics',
    (n) => n === 1
      ? { en: 'Pull a Prismatic', fr: 'Tirez une Prismatique' }
      : { en: `Pull ${en(n)} Prismatics`, fr: `Tirez ${fr(n)} Prismatiques` },
    [
      [1,  pack('epic', 5),      { en: 'First light', fr: 'Première lumière' }],
      [5,  pack('mythic', 5),    { en: 'Spectrum', fr: 'Spectre' }],
      [15, pack('prismatic', 5), { en: 'Full spectrum', fr: 'Spectre complet' }]
    ]),

  // --- the forge ---
  ...chain('custom', 'wand', 'customsBuilt',
    (n) => n === 1
      ? { en: 'Build a custom booster', fr: 'Créez un booster personnalisé' }
      : { en: `Build ${en(n)} custom boosters`, fr: `Créez ${fr(n)} boosters personnalisés` },
    [
      [1,  coins(200),  { en: 'Wiki smith', fr: 'Forgeron de wiki' }],
      [5,  coins(900),  { en: 'Pack press', fr: 'Presse à paquets' }],
      [15, coins(2500), { en: 'The foundry', fr: 'La fonderie' }]
    ]),

  // --- friends ---
  ...chain('friend', 'friends', 'friends',
    (n) => n === 1
      ? { en: 'Make a friend', fr: 'Ajoutez un ami' }
      : { en: `Have ${en(n)} friends`, fr: `Ayez ${fr(n)} amis` },
    [
      [1, coins(200),  { en: 'Not alone', fr: 'Pas seul' }],
      [3, coins(600),  { en: 'A small circle', fr: 'Un petit cercle' }],
      [8, coins(1800), { en: 'The table is full', fr: 'La table est pleine' }]
    ]),

  // --- gifts to friends ---
  ...chain('gift', 'gift', 'giftsSent',
    (n) => n === 1
      ? { en: 'Send a gift to a friend', fr: 'Envoyez un cadeau à un ami' }
      : { en: `Send ${en(n)} gifts to friends`, fr: `Envoyez ${fr(n)} cadeaux à des amis` },
    [
      [1,  coins(200),           { en: 'It is better to give', fr: 'Le plaisir d’offrir' }],
      [10, coins(900),           { en: 'Secret Santa', fr: 'Père Noël secret' }],
      [50, pack('legendary', 5), { en: 'The patron', fr: 'Le mécène' }]
    ]),

  // --- trades ---
  ...chain('trade', 'trade', 'tradesDone',
    (n) => n === 1
      ? { en: 'Complete a trade', fr: 'Concluez un échange' }
      : { en: `Complete ${en(n)} trades`, fr: `Concluez ${fr(n)} échanges` },
    [
      [1,  coins(200),           { en: 'Fair and square', fr: 'Donnant-donnant' }],
      [10, coins(900),           { en: 'Horse trader', fr: 'Maquignon' }],
      [50, pack('legendary', 5), { en: 'The broker', fr: 'Le courtier' }]
    ]),

  // --- daily gifts ---
  ...chain('daily', 'gift', 'dailyClaims',
    (n) => ({ en: `Claim ${en(n)} daily gifts`, fr: `Réclamez ${fr(n)} cadeaux quotidiens` }),
    [
      [7,   coins(250),         { en: 'A good week', fr: 'Une bonne semaine' }],
      [30,  coins(900),         { en: 'The regular', fr: 'L’habitué' }],
      [90,  coins(2500),        { en: 'A season of it', fr: 'Une saison entière' }],
      [250, pack('mythic', 5),  { en: 'Rain or shine', fr: 'Qu’il pleuve ou qu’il vente' }]
    ]),

  // --- time played ---
  ...chain('hours', 'clock', 'playHours',
    (n) => ({ en: `Play for ${en(n)} hours`, fr: `Jouez ${fr(n)} heures` }),
    [
      [2,  coins(150),           { en: 'Time flies', fr: 'Le temps file' }],
      [10, coins(600),           { en: 'Where did the day go', fr: 'Où est passée la journée' }],
      [30, coins(1500),          { en: 'Hooked', fr: 'Accroché' }],
      [80, pack('legendary', 5), { en: 'Part of the furniture', fr: 'Un meuble de la maison' }]
    ]),

  // --- timed boosters ---
  ...chain('timed', 'hourglass', 'timedOpened',
    (n) => ({ en: `Open ${en(n)} timed boosters`, fr: `Ouvrez ${fr(n)} boosters minutés` }),
    [
      [3,   coins(100),        { en: 'Right on time', fr: 'Pile à l’heure' }],
      [25,  coins(600),        { en: 'Clockwork', fr: 'Réglé comme une horloge' }],
      [100, coins(2000),       { en: 'The metronome', fr: 'Le métronome' }],
      [300, pack('mythic', 5), { en: 'Master of minutes', fr: 'Maître des minutes' }]
    ]),

  // --- selling ---
  ...chain('sold', 'trade', 'sold',
    (n) => ({ en: `Sell ${en(n)} cards`, fr: `Vendez ${fr(n)} cartes` }),
    [
      [5,   coins(150),  { en: 'First trade-in', fr: 'Première reprise' }],
      [50,  coins(800),  { en: 'Market stall', fr: 'Étal de marché' }],
      [250, coins(2500), { en: 'Wholesale', fr: 'Vente en gros' }]
    ]),

  // --- the quiz ---
  ...chain('quiz', 'quiz', 'quizPlayed',
    (n) => n === 1
      ? { en: 'Finish a quiz', fr: 'Terminez un quiz' }
      : { en: `Finish ${en(n)} quizzes`, fr: `Terminez ${fr(n)} quiz` },
    [
      [1,   coins(150),           { en: 'Pop quiz', fr: 'Interro surprise' }],
      [10,  coins(500),           { en: 'Study group', fr: 'Groupe d’étude' }],
      [50,  coins(1800),          { en: 'The examinee', fr: 'Le candidat' }],
      [150, pack('legendary', 5), { en: 'Tenured', fr: 'Titulaire de la chaire' }]
    ]),

  ...chain('quizwin', 'quiz', 'quizWins',
    (n) => ({ en: `Win ${en(n)} quizzes with 3 right or more`, fr: `Gagnez ${fr(n)} quiz avec 3 bonnes réponses ou plus` }),
    [
      [5,   coins(400),        { en: 'Passing grade', fr: 'La moyenne' }],
      [25,  coins(1500),       { en: 'Honor roll', fr: 'Tableau d’honneur' }],
      [100, pack('mythic', 5), { en: 'Summa cum laude', fr: 'Mention très bien' }]
    ]),

  ...chain('perfect', 'quiz', 'quizPerfect',
    (n) => n === 1
      ? { en: 'Answer every question of a quiz right', fr: 'Répondez juste à toutes les questions d’un quiz' }
      : { en: `Get a perfect quiz ${en(n)} times`, fr: `Réussissez un quiz parfait ${fr(n)} fois` },
    [
      [1,  coins(400),         { en: 'Flawless', fr: 'Sans faute' }],
      [10, coins(2000),        { en: 'The perfectionist', fr: 'Le perfectionniste' }],
      [40, pack('exotic', 5),  { en: 'Photographic memory', fr: 'Mémoire photographique' }]
    ]),

  // --- money held at once ---
  ...chain('rich', 'gem', 'wallet',
    (n) => ({ en: `Hold ฿${en(n)} at once`, fr: `Détenez ฿${fr(n)} d’un coup` }),
    [
      [10000,  coins(250),           { en: 'Piggy bank', fr: 'Tirelire' }],
      [50000,  coins(1200),          { en: 'Nest egg', fr: 'Bas de laine' }],
      [250000, pack('legendary', 6), { en: 'Deep pockets', fr: 'Les poches profondes' }]
    ]),

  // --- a single card's worth ---
  ...chain('prize', 'gem', 'maxCardPrice',
    (n) => ({ en: `Own a card worth ฿${en(n)}`, fr: `Possédez une carte à ฿${fr(n)}` }),
    [
      [1500,  coins(300),  { en: 'A fine piece', fr: 'Une belle pièce' }],
      [5000,  coins(1200), { en: 'Centrepiece', fr: 'Pièce maîtresse' }],
      [12000, coins(3000), { en: 'The crown jewel', fr: 'Le joyau de la couronne' }]
    ]),

  // --- a single card's fame ---
  ...chain('fame', 'cloud', 'maxViews',
    (n) => ({ en: `Own a card read ${en(n)} times a month`, fr: `Possédez une carte lue ${fr(n)} fois par mois` }),
    [
      [250000,   coins(300),  { en: 'Front page', fr: 'En première page' }],
      [1000000,  coins(1200), { en: 'Household name', fr: 'Connue de tous' }],
      [10000000, coins(3000), { en: 'The whole world reads it', fr: 'Le monde entier la lit' }]
    ]),

  // --- favorites ---
  ...chain('fav', 'starFilled', 'favorites',
    (n) => n === 1
      ? { en: 'Mark a card as a favorite', fr: 'Mettez une carte en favori' }
      : { en: `Mark ${en(n)} cards as favorites`, fr: `Mettez ${fr(n)} cartes en favori` },
    [
      [1,  coins(100),  { en: 'Teacher’s pet', fr: 'Le chouchou' }],
      [10, coins(300),  { en: 'Shortlist', fr: 'Liste restreinte' }],
      [50, coins(1200), { en: 'Hall of fame', fr: 'Panthéon personnel' }]
    ]),

  // --- copies of one card ---
  ...chain('copies', 'collection', 'maxCopies',
    (n) => ({ en: `Hold ${en(n)} copies of one card`, fr: `Cumulez ${fr(n)} exemplaires d’une même carte` }),
    [
      [3,  coins(150),  { en: 'Déjà vu', fr: 'Déjà-vu' }],
      [10, coins(600),  { en: 'The echo', fr: 'L’écho' }],
      [30, coins(2000), { en: 'Print run', fr: 'Tirage complet' }]
    ]),

  // --- the auction house ---
  ...chain('vendor', 'trade', 'auctionsSold',
    (n) => n === 1
      ? { en: 'Sell a card at auction', fr: 'Vendez une carte aux enchères' }
      : { en: `Sell ${en(n)} cards at auction`, fr: `Vendez ${fr(n)} cartes aux enchères` },
    [
      [1,  coins(200),           { en: 'Gone under the hammer', fr: 'Adjugé' }],
      [10, coins(900),           { en: 'Auctioneer', fr: 'Commissaire-priseur' }],
      [50, pack('legendary', 5), { en: 'House favourite', fr: 'Chouchou de la salle' }]
    ]),

  ...chain('hammer', 'burst', 'auctionsWon',
    (n) => n === 1
      ? { en: 'Win a card at auction', fr: 'Remportez une carte aux enchères' }
      : { en: `Win ${en(n)} cards at auction`, fr: `Remportez ${fr(n)} cartes aux enchères` },
    [
      [1,  coins(200),           { en: 'Winning bid', fr: 'Mise gagnante' }],
      [10, coins(900),           { en: 'The last word', fr: 'Le dernier mot' }],
      [50, pack('legendary', 5), { en: 'King of the floor', fr: 'Roi de la salle' }]
    ]),

  // --- one-offs ---
  A('full-board', 'gift', 'boardsDone', 1, coins(1500),
    { en: 'Full board', fr: 'Plateau complet' },
    { en: 'Finish a whole 30-day gift board', fr: 'Terminez un plateau de cadeaux de 30 jours' }),
  A('one-of-each', 'spark', 'raritiesOwned', 8, pack('exotic', 5),
    { en: 'One of each', fr: 'Un de chaque' },
    { en: 'Own a card of every rarity at once', fr: 'Possédez une carte de chaque rareté en même temps' }),
  /* =====================================================================
     THE SECOND TWO HUNDRED: one chain per real thing the game now has,
     judged against the ledger (src/ledger.js) and the rest of the save.
     ===================================================================== */

  // --- pulls by tier: the tiers the first hundred did not name ----------
  ...chain('common', 'collection', 'commons',
    (n) => ({ en: `Pull ${en(n)} Common cards`, fr: `Tirez ${fr(n)} cartes Communes` }),
    [
      [50,   coins(100),  { en: 'Everyday paper', fr: 'Papier de tous les jours' }],
      [250,  coins(400),  { en: 'The common touch', fr: 'Le sens du commun' }],
      [1000, coins(1200), { en: 'Bread and butter', fr: 'Le pain quotidien' }],
      [3000, pack('rare', 5), { en: 'Salt of the earth', fr: 'Le sel de la terre' }]
    ]),
  ...chain('uncommon', 'collection', 'uncommons',
    (n) => ({ en: `Pull ${en(n)} Uncommon cards`, fr: `Tirez ${fr(n)} cartes Peu communes` }),
    [
      [25,   coins(120),  { en: 'A little unusual', fr: 'Un peu inhabituel' }],
      [150,  coins(500),  { en: 'Off the beaten page', fr: 'Hors des sentiers battus' }],
      [600,  coins(1500), { en: 'Green thumb', fr: 'La main verte' }],
      [2000, pack('epic', 5), { en: 'Uncommonly so', fr: 'Rarement aussi' }]
    ]),
  ...chain('rare', 'collection', 'rares',
    (n) => ({ en: `Pull ${en(n)} Rare cards`, fr: `Tirez ${fr(n)} cartes Rares` }),
    [
      [10,  coins(200),  { en: 'Blue streak', fr: 'Série bleue' }],
      [60,  coins(700),  { en: 'Deep water', fr: 'Eaux profondes' }],
      [250, coins(2000), { en: 'The rare air', fr: 'L’air raréfié' }],
      [800, pack('legendary', 5), { en: 'Sapphire cabinet', fr: 'Cabinet de saphirs' }]
    ]),
  ...chain('epic', 'spark', 'epics',
    (n) => ({ en: `Pull ${en(n)} Epic cards`, fr: `Tirez ${fr(n)} cartes Épiques` }),
    [
      [5,   coins(250),  { en: 'Purple patch', fr: 'Période faste' }],
      [25,  coins(900),  { en: 'Saga', fr: 'Saga' }],
      [100, coins(2500), { en: 'Epic proportions', fr: 'Proportions épiques' }],
      [300, pack('mythic', 5), { en: 'The long poem', fr: 'Le long poème' }]
    ]),
  ...chain('mythic', 'spark', 'mythics',
    (n) => ({ en: `Pull ${en(n)} Mythic cards`, fr: `Tirez ${fr(n)} cartes Mythiques` }),
    [
      [3,   coins(400),  { en: 'Red letter day', fr: 'Jour à marquer d’une pierre rouge' }],
      [12,  coins(1500), { en: 'Bestiary', fr: 'Bestiaire' }],
      [40,  pack('mythic', 5), { en: 'Dragon’s hoard', fr: 'Trésor de dragon' }],
      [120, pack('exotic', 5),  { en: 'Mythmaker', fr: 'Faiseur de mythes' }]
    ]),
  ...chain('exotic', 'spark', 'exotics',
    (n) => n === 1
      ? { en: 'Pull an Exotic', fr: 'Tirez une Exotique' }
      : { en: `Pull ${en(n)} Exotic cards`, fr: `Tirez ${fr(n)} cartes Exotiques` },
    [
      [1,  coins(500),  { en: 'Out of this world', fr: 'Pas de ce monde' }],
      [5,  coins(1800), { en: 'Strange signals', fr: 'Signaux étranges' }],
      [20, pack('exotic', 5), { en: 'Xenologist', fr: 'Xénologue' }],
      [60, pack('prismatic', 5), { en: 'Beyond the spectrum', fr: 'Au-delà du spectre' }]
    ]),

  // --- boosters by kind --------------------------------------------------
  ...chain('basic', 'packs', 'opensBasic',
    (n) => ({ en: `Open ${en(n)} basic boosters`, fr: `Ouvrez ${fr(n)} boosters de base` }),
    [
      [10,  coins(120),  { en: 'Plain wrapper', fr: 'Emballage simple' }],
      [60,  coins(500),  { en: 'No frills', fr: 'Sans fioritures' }],
      [250, coins(1800), { en: 'The staple', fr: 'La valeur sûre' }]
    ]),
  ...chain('subject', 'packs', 'opensTheme',
    (n) => ({ en: `Open ${en(n)} subject boosters`, fr: `Ouvrez ${fr(n)} boosters par sujet` }),
    [
      [10,  coins(120),  { en: 'On topic', fr: 'Dans le sujet' }],
      [60,  coins(500),  { en: 'Specialist', fr: 'Spécialiste' }],
      [250, coins(1800), { en: 'Department head', fr: 'Chef de département' }]
    ]),
  ...chain('homemade', 'wand', 'opensCustom',
    (n) => ({ en: `Open ${en(n)} boosters you built`, fr: `Ouvrez ${fr(n)} boosters faits maison` }),
    [
      [5,   coins(150),  { en: 'Home cooking', fr: 'Cuisine maison' }],
      [25,  coins(600),  { en: 'Own label', fr: 'Marque maison' }],
      [100, coins(2000), { en: 'Cottage industry', fr: 'Industrie artisanale' }]
    ]),
  ...chain('today', 'cloud', 'opensToday',
    (n) => ({ en: `Open ${en(n)} Wikipedia Today boosters`, fr: `Ouvrez ${fr(n)} boosters Wikipédia du jour` }),
    [
      [3,  coins(200),  { en: 'Morning paper', fr: 'Le journal du matin' }],
      [15, coins(800),  { en: 'Current affairs', fr: 'Actualités' }],
      [60, pack('epic', 5), { en: 'Zeitgeist', fr: 'L’air du temps' }]
    ]),
  ...chain('seasonal', 'calendar', 'opensSeason',
    (n) => ({ en: `Open ${en(n)} season boosters`, fr: `Ouvrez ${fr(n)} boosters de saison` }),
    [
      [3,  coins(200),  { en: 'In season', fr: 'De saison' }],
      [15, coins(800),  { en: 'Four seasons', fr: 'Quatre saisons' }],
      [60, pack('epic', 5), { en: 'Almanac', fr: 'Almanach' }]
    ]),
  ...chain('tiered', 'gem', 'opensTier',
    (n) => ({ en: `Open ${en(n)} tier boosters`, fr: `Ouvrez ${fr(n)} boosters à palier` }),
    [
      [5,  coins(200),  { en: 'Guaranteed', fr: 'Garanti' }],
      [25, coins(800),  { en: 'Sure thing', fr: 'Valeur sûre' }],
      [100, pack('legendary', 5), { en: 'The vault key', fr: 'La clé du coffre' }]
    ]),
  ...chain('subjects', 'search', 'subjects',
    (n) => ({ en: `Open boosters on ${en(n)} different subjects`, fr: `Ouvrez des boosters sur ${fr(n)} sujets différents` }),
    [
      [3,  coins(150),  { en: 'Sampler', fr: 'Échantillon' }],
      [10, coins(600),  { en: 'Generalist', fr: 'Généraliste' }],
      [20, coins(1800), { en: 'The whole syllabus', fr: 'Tout le programme' }]
    ]),
  ...chain('fresh', 'search', 'newPulls',
    (n) => ({ en: `Pull ${en(n)} cards you had never seen`, fr: `Tirez ${fr(n)} cartes jamais vues` }),
    [
      [30,  coins(150),  { en: 'Fresh ink', fr: 'Encre fraîche' }],
      [200, coins(700),  { en: 'Explorer', fr: 'Explorateur' }],
      [800, pack('epic', 5), { en: 'Terra incognita', fr: 'Terra incognita' }]
    ]),
  ...chain('famous', 'cloud', 'famousPulls',
    (n) => ({ en: `Pull ${en(n)} famous articles`, fr: `Tirez ${fr(n)} articles célèbres` }),
    [
      [10,  coins(150),  { en: 'Name-dropper', fr: 'Collectionneur de noms' }],
      [100, coins(700),  { en: 'Celebrity circuit', fr: 'Circuit des célébrités' }],
      [500, pack('epic', 5), { en: 'Everybody knows', fr: 'Tout le monde connaît' }]
    ]),
  ...chain('wishcome', 'wish', 'wishGranted',
    (n) => n === 1
      ? { en: 'Pull a card from your wishlist', fr: 'Tirez une carte de votre liste de souhaits' }
      : { en: `Pull ${en(n)} cards from your wishlist`, fr: `Tirez ${fr(n)} cartes de votre liste de souhaits` },
    [
      [1,  coins(250),  { en: 'Wish granted', fr: 'Vœu exaucé' }],
      [5,  coins(900),  { en: 'Careful what you wish for', fr: 'Attention à ce que vous souhaitez' }],
      [25, pack('legendary', 5), { en: 'The genie', fr: 'Le génie' }]
    ]),
  ...chain('wishlist', 'wish', 'wishlist',
    (n) => n === 1
      ? { en: 'Put a card on your wishlist', fr: 'Mettez une carte sur votre liste de souhaits' }
      : { en: `Keep ${en(n)} cards on your wishlist`, fr: `Gardez ${fr(n)} cartes sur votre liste de souhaits` },
    [
      [1,  coins(80),   { en: 'Wanted', fr: 'Recherchée' }],
      [10, coins(300),  { en: 'The long list', fr: 'La longue liste' }],
      [50, coins(1000), { en: 'Letter to Santa', fr: 'Lettre au Père Noël' }]
    ]),
  ...chain('reader', 'scroll', 'articleViews',
    (n) => ({ en: `Open ${en(n)} cards to read them`, fr: `Ouvrez ${fr(n)} cartes pour les lire` }),
    [
      [10,   coins(80),   { en: 'Curious', fr: 'Curieux' }],
      [100,  coins(300),  { en: 'Well read', fr: 'Cultivé' }],
      [1000, coins(1200), { en: 'Bookworm', fr: 'Rat de bibliothèque' }]
    ]),
  ...chain('deep', 'collection', 'albumsHundred',
    (n) => n === 1
      ? { en: 'Get 100 cards into one album', fr: 'Réunissez 100 cartes dans un album' }
      : { en: `Stock ${en(n)} albums with 100 cards each`, fr: `Garnissez ${fr(n)} albums de 100 cartes chacun` },
    [
      [1,  coins(800),  { en: 'A hundred pages', fr: 'Cent pages' }],
      [3,  pack('epic', 5), { en: 'Heavy volumes', fr: 'Gros volumes' }],
      [10, pack('mythic', 6), { en: 'The reading room', fr: 'La salle de lecture' }]
    ]),
  A('special-one', 'star', 'specials', 1, coins(500),
    { en: 'One of a kind', fr: 'Unique en son genre' },
    { en: 'Own a Special card', fr: 'Possédez une carte Spéciale' }),

  // --- the arcade, game by game ------------------------------------------
  ...chain('wikdle', 'quiz', 'wikdlePlays',
    (n) => ({ en: `Play ${en(n)} Wikdles`, fr: `Jouez ${fr(n)} Wikdles` }),
    [
      [5,   coins(120),  { en: 'Five letters', fr: 'Cinq lettres' }],
      [30,  coins(500),  { en: 'A month of words', fr: 'Un mois de mots' }],
      [120, coins(1500), { en: 'Lexicon', fr: 'Lexique' }],
      [365, pack('legendary', 5), { en: 'A year of words', fr: 'Une année de mots' }]
    ]),
  ...chain('wikdlewin', 'quiz', 'wikdleWins',
    (n) => ({ en: `Solve ${en(n)} Wikdles`, fr: `Résolvez ${fr(n)} Wikdles` }),
    [
      [3,   coins(200),  { en: 'Word up', fr: 'Le mot juste' }],
      [20,  coins(700),  { en: 'Cruciverbalist', fr: 'Cruciverbiste' }],
      [75,  coins(2000), { en: 'Walking dictionary', fr: 'Dictionnaire ambulant' }],
      [200, pack('mythic', 5), { en: 'Final answer', fr: 'Réponse finale' }]
    ]),
  ...chain('wikdlefast', 'quiz', 'wikdleFast',
    (n) => n === 1
      ? { en: 'Solve a Wikdle in three guesses or fewer', fr: 'Résolvez un Wikdle en trois essais ou moins' }
      : { en: `Solve ${en(n)} Wikdles in three guesses or fewer`, fr: `Résolvez ${fr(n)} Wikdles en trois essais ou moins` },
    [
      [1,  coins(250),  { en: 'Quick on the draw', fr: 'Vif comme l’éclair' }],
      [10, coins(1000), { en: 'Three and done', fr: 'Trois et c’est plié' }],
      [40, pack('exotic', 5), { en: 'Mind reader', fr: 'Télépathe' }]
    ]),
  ...chain('wikdlestreak', 'clock', 'wikdleStreak',
    (n) => ({ en: `Solve the Wikdle ${en(n)} days running`, fr: `Résolvez le Wikdle ${fr(n)} jours de suite` }),
    [
      [3,  coins(200),  { en: 'Three in a row', fr: 'Trois d’affilée' }],
      [7,  coins(600),  { en: 'A full week', fr: 'Une semaine pleine' }],
      [30, pack('legendary', 5), { en: 'Unbroken', fr: 'Sans interruption' }]
    ]),
  ...chain('spins', 'dice', 'slotsSpins',
    (n) => ({ en: `Spin the slot machine ${en(n)} times`, fr: `Lancez la machine à sous ${fr(n)} fois` }),
    [
      [10,   coins(100),  { en: 'Pull the lever', fr: 'Tirez le levier' }],
      [100,  coins(400),  { en: 'Regular at the bar', fr: 'Habitué du comptoir' }],
      [500,  coins(1500), { en: 'High roller', fr: 'Gros joueur' }],
      [2000, pack('mythic', 5), { en: 'One-armed bandit', fr: 'Le bandit manchot' }]
    ]),
  ...chain('spinwins', 'dice', 'slotsWins',
    (n) => ({ en: `Win ${en(n)} spins`, fr: `Gagnez ${fr(n)} tours` }),
    [
      [5,   coins(150),  { en: 'Beginner’s luck', fr: 'La chance du débutant' }],
      [50,  coins(600),  { en: 'Lucky streak', fr: 'Série chanceuse' }],
      [250, coins(2000), { en: 'The house loses', fr: 'La maison perd' }]
    ]),
  ...chain('triples', 'dice', 'slotsTriples',
    (n) => n === 1
      ? { en: 'Line up three of a kind', fr: 'Alignez trois symboles identiques' }
      : { en: `Line up three of a kind ${en(n)} times`, fr: `Alignez trois symboles identiques ${fr(n)} fois` },
    [
      [1,  coins(200),  { en: 'Three cherries', fr: 'Trois cerises' }],
      [10, coins(900),  { en: 'Jackpot habit', fr: 'L’habitude du jackpot' }],
      [50, pack('legendary', 5), { en: 'Bells, bells, bells', fr: 'Cloches, cloches, cloches' }]
    ]),
  ...chain('duels', 'podium', 'duelRounds',
    (n) => ({ en: `Play ${en(n)} popularity duel rounds`, fr: `Jouez ${fr(n)} manches de duel de popularité` }),
    [
      [5,   coins(100),  { en: 'Higher or lower', fr: 'Plus ou moins' }],
      [50,  coins(500),  { en: 'Duellist', fr: 'Duelliste' }],
      [250, coins(1800), { en: 'Pistols at dawn', fr: 'Pistolets à l’aube' }]
    ]),
  ...chain('reveals', 'search', 'revealRounds',
    (n) => ({ en: `Play ${en(n)} Guess the Article rounds`, fr: `Jouez ${fr(n)} manches de Devinez l’article` }),
    [
      [5,   coins(100),  { en: 'Squint', fr: 'Plissez les yeux' }],
      [50,  coins(500),  { en: 'Focus puller', fr: 'Pointeur' }],
      [250, coins(1800), { en: 'Twenty-twenty', fr: 'Dix sur dix' }]
    ]),
  ...chain('arcade', 'podium', 'arcadePoints',
    (n) => ({ en: `Score ${en(n)} minigame points in all`, fr: `Marquez ${fr(n)} points de mini-jeux en tout` }),
    [
      [1000,   coins(150),  { en: 'First points', fr: 'Premiers points' }],
      [10000,  coins(600),  { en: 'Five figures', fr: 'Cinq chiffres' }],
      [100000, coins(2500), { en: 'Arcade legend', fr: 'Légende de l’arcade' }],
      [500000, pack('exotic', 5), { en: 'Half a million', fr: 'Un demi-million' }]
    ]),

  // --- the quests --------------------------------------------------------
  ...chain('quests', 'scroll', 'questsClaimed',
    (n) => ({ en: `Claim ${en(n)} daily quests`, fr: `Réclamez ${fr(n)} quêtes du jour` }),
    [
      [5,   coins(150),  { en: 'Errand runner', fr: 'Coursier' }],
      [30,  coins(500),  { en: 'Quest log', fr: 'Journal de quêtes' }],
      [120, coins(1500), { en: 'Adventurer', fr: 'Aventurier' }],
      [365, pack('mythic', 5), { en: 'A year of errands', fr: 'Une année de courses' }]
    ]),
  ...chain('hardquests', 'scroll', 'questsHard',
    (n) => n === 1
      ? { en: 'Claim a hard quest', fr: 'Réclamez une quête difficile' }
      : { en: `Claim ${en(n)} hard quests`, fr: `Réclamez ${fr(n)} quêtes difficiles` },
    [
      [1,  coins(200),  { en: 'The hard way', fr: 'À la dure' }],
      [10, coins(900),  { en: 'Never the easy road', fr: 'Jamais la voie facile' }],
      [50, pack('legendary', 5), { en: 'Iron will', fr: 'Volonté de fer' }]
    ]),
  ...chain('fulldays', 'scroll', 'questDays',
    (n) => n === 1
      ? { en: 'Claim every quest of a day', fr: 'Réclamez toutes les quêtes d’un jour' }
      : { en: `Claim every quest of the day ${en(n)} times`, fr: `Réclamez toutes les quêtes du jour ${fr(n)} fois` },
    [
      [1,  coins(200),  { en: 'Clean sweep', fr: 'Grand chelem' }],
      [10, coins(900),  { en: 'Completionist', fr: 'Perfectionniste' }],
      [50, pack('legendary', 5), { en: 'Not a quest left', fr: 'Plus une quête' }]
    ]),

  // --- the seasons -------------------------------------------------------
  ...chain('rungs', 'calendar', 'seasonRungs',
    (n) => ({ en: `Claim ${en(n)} rungs of season tracks`, fr: `Réclamez ${fr(n)} paliers de pistes de saison` }),
    [
      [5,   coins(200),  { en: 'First steps', fr: 'Premiers pas' }],
      [20,  coins(800),  { en: 'Climber', fr: 'Grimpeur' }],
      [60,  coins(2500), { en: 'Every ladder', fr: 'Toutes les échelles' }],
      [110, pack('exotic', 5), { en: 'The full year, twice over', fr: 'L’année entière, deux fois' }]
    ]),
  ...chain('seasonpts', 'calendar', 'seasonPoints',
    (n) => ({ en: `Earn ${en(n)} season points in all`, fr: `Gagnez ${fr(n)} points de saison en tout` }),
    [
      [500,   coins(150),  { en: 'Warm-up lap', fr: 'Tour de chauffe' }],
      [2500,  coins(600),  { en: 'Steady points', fr: 'Points réguliers' }],
      [10000, coins(2000), { en: 'Seasoned', fr: 'Aguerri' }],
      [50000, pack('exotic', 5), { en: 'All-weather', fr: 'Par tous les temps' }]
    ]),
  ...chain('seasons', 'calendar', 'seasonsPlayed',
    (n) => ({ en: `Score points in ${en(n)} different seasons`, fr: `Marquez des points dans ${fr(n)} saisons différentes` }),
    [
      [2,  coins(200),  { en: 'Two seasons', fr: 'Deux saisons' }],
      [5,  coins(900),  { en: 'Half the year', fr: 'La moitié de l’année' }],
      [11, pack('legendary', 5), { en: 'The whole calendar', fr: 'Tout le calendrier' }]
    ]),
  ...chain('seasonbadges', 'star', 'seasonBadges',
    (n) => n === 1
      ? { en: 'Earn a season badge', fr: 'Gagnez un badge de saison' }
      : { en: `Earn ${en(n)} season badges`, fr: `Gagnez ${fr(n)} badges de saison` },
    [
      [1,  coins(300),  { en: 'Pinned', fr: 'Épinglé' }],
      [4,  coins(1200), { en: 'Four seasons on the chest', fr: 'Quatre saisons sur la poitrine' }],
      [11, pack('exotic', 5), { en: 'Every season’s badge', fr: 'Le badge de chaque saison' }]
    ]),
  ...chain('seasonquests', 'calendar', 'seasonQuests',
    (n) => ({ en: `Claim ${en(n)} season quests`, fr: `Réclamez ${fr(n)} quêtes de saison` }),
    [
      [5,   coins(150),  { en: 'Of the day', fr: 'Du jour' }],
      [30,  coins(600),  { en: 'Seasonal worker', fr: 'Saisonnier' }],
      [100, coins(2000), { en: 'Every day of the season', fr: 'Chaque jour de la saison' }]
    ]),

  // --- the guild ---------------------------------------------------------
  A('guild-join', 'shield', 'guildsJoined', 1, coins(300),
    { en: 'Under a banner', fr: 'Sous une bannière' },
    { en: 'Join a guild', fr: 'Rejoignez une guilde' }),
  A('guild-found', 'shield', 'guildsFounded', 1, coins(500),
    { en: 'Founder', fr: 'Fondateur' },
    { en: 'Found a guild of your own', fr: 'Fondez votre propre guilde' }),
  ...chain('goals', 'shield', 'guildGoals',
    (n) => n === 1
      ? { en: 'Claim a weekly guild goal', fr: 'Réclamez un objectif de guilde hebdomadaire' }
      : { en: `Claim ${en(n)} weekly guild goals`, fr: `Réclamez ${fr(n)} objectifs de guilde hebdomadaires` },
    [
      [1,  coins(300),  { en: 'Team effort', fr: 'Effort collectif' }],
      [5,  coins(900),  { en: 'Pulling together', fr: 'Tous ensemble' }],
      [20, coins(2500), { en: 'Well-oiled', fr: 'Bien huilé' }],
      [52, pack('exotic', 5), { en: 'A year of Sundays', fr: 'Une année de dimanches' }]
    ]),
  ...chain('matches', 'shield', 'guildMatches',
    (n) => n === 1
      ? { en: 'Claim a guild match win', fr: 'Réclamez une victoire de match de guilde' }
      : { en: `Claim ${en(n)} guild match wins`, fr: `Réclamez ${fr(n)} victoires de match de guilde` },
    [
      [1,  coins(400),  { en: 'First blood', fr: 'Première victoire' }],
      [5,  coins(1200), { en: 'Rivalry', fr: 'Rivalité' }],
      [20, pack('mythic', 5), { en: 'Dynasty', fr: 'Dynastie' }]
    ]),
  ...chain('donated', 'gift', 'guildDonated',
    (n) => n === 1
      ? { en: 'Put a card on the guild table', fr: 'Posez une carte sur la table de la guilde' }
      : { en: `Put ${en(n)} cards on the guild table`, fr: `Posez ${fr(n)} cartes sur la table de la guilde` },
    [
      [1,   coins(150),  { en: 'Spare one', fr: 'Une en trop' }],
      [10,  coins(600),  { en: 'Generous', fr: 'Généreux' }],
      [50,  coins(1800), { en: 'Quartermaster', fr: 'Intendant' }],
      [200, pack('legendary', 5), { en: 'The commons', fr: 'Les communs' }]
    ]),
  ...chain('taken', 'gift', 'guildTaken',
    (n) => n === 1
      ? { en: 'Take a card from the guild table', fr: 'Prenez une carte sur la table de la guilde' }
      : { en: `Take ${en(n)} cards from the guild table`, fr: `Prenez ${fr(n)} cartes sur la table de la guilde` },
    [
      [1,  coins(100),  { en: 'Help yourself', fr: 'Servez-vous' }],
      [10, coins(400),  { en: 'Regular at the table', fr: 'Habitué de la table' }],
      [50, coins(1500), { en: 'Well provided', fr: 'Bien pourvu' }]
    ]),
  ...chain('hallchat', 'chat', 'guildChats',
    (n) => ({ en: `Say ${en(n)} things in the guild hall`, fr: `Dites ${fr(n)} choses dans la salle de guilde` }),
    [
      [10,   coins(100),  { en: 'Hello, hall', fr: 'Bonjour la salle' }],
      [100,  coins(400),  { en: 'Voice of the guild', fr: 'La voix de la guilde' }],
      [1000, coins(1500), { en: 'Town crier', fr: 'Crieur public' }]
    ]),
  ...chain('recruiter', 'addFriend', 'guildInvites',
    (n) => n === 1
      ? { en: 'Invite a friend into the guild', fr: 'Invitez un ami dans la guilde' }
      : { en: `Invite ${en(n)} friends into the guild`, fr: `Invitez ${fr(n)} amis dans la guilde` },
    [
      [1,  coins(150),  { en: 'Come and see', fr: 'Venez voir' }],
      [5,  coins(600),  { en: 'Recruiter', fr: 'Recruteur' }],
      [20, coins(1800), { en: 'Press gang', fr: 'Sergent recruteur' }]
    ]),

  // --- friends, and what passes between them -----------------------------
  ...chain('chatter', 'chat', 'messagesSent',
    (n) => ({ en: `Send ${en(n)} messages to friends`, fr: `Envoyez ${fr(n)} messages à des amis` }),
    [
      [10,   coins(100),  { en: 'Say hi', fr: 'Dites bonjour' }],
      [100,  coins(400),  { en: 'Chatterbox', fr: 'Moulin à paroles' }],
      [1000, coins(1500), { en: 'Correspondent', fr: 'Correspondant' }],
      [5000, pack('legendary', 5), { en: 'Pen pal for life', fr: 'Correspondant à vie' }]
    ]),
  ...chain('circles', 'friends', 'conversations',
    (n) => n === 1
      ? { en: 'Talk to a friend', fr: 'Parlez à un ami' }
      : { en: `Talk to ${en(n)} different friends`, fr: `Parlez à ${fr(n)} amis différents` },
    [
      [1,  coins(100),  { en: 'First words', fr: 'Premiers mots' }],
      [5,  coins(400),  { en: 'Round of the table', fr: 'Le tour de la table' }],
      [15, coins(1500), { en: 'Everyone’s friend', fr: 'L’ami de tous' }]
    ]),
  ...chain('kudos', 'heart', 'kudosGiven',
    (n) => n === 1
      ? { en: 'Leave a heart on a friend’s showcase', fr: 'Laissez un cœur sur la vitrine d’un ami' }
      : { en: `Leave ${en(n)} hearts on friends’ showcases`, fr: `Laissez ${fr(n)} cœurs sur les vitrines d’amis` },
    [
      [1,  coins(80),   { en: 'Nice one', fr: 'Joli' }],
      [10, coins(300),  { en: 'Admirer', fr: 'Admirateur' }],
      [50, coins(1200), { en: 'Big heart', fr: 'Grand cœur' }]
    ]),
  ...chain('received', 'gift', 'giftsReceived',
    (n) => n === 1
      ? { en: 'Receive a gift from a friend', fr: 'Recevez un cadeau d’un ami' }
      : { en: `Receive ${en(n)} gifts from friends`, fr: `Recevez ${fr(n)} cadeaux d’amis` },
    [
      [1,  coins(100),  { en: 'For me?', fr: 'Pour moi ?' }],
      [10, coins(400),  { en: 'Well liked', fr: 'Apprécié' }],
      [50, coins(1500), { en: 'Birthday every day', fr: 'Anniversaire tous les jours' }]
    ]),
  A('showcase-full', 'star', 'showcase', 3, coins(200),
    { en: 'Window dressing', fr: 'Vitrine garnie' },
    { en: 'Pin three cards to your showcase', fr: 'Épinglez trois cartes dans votre vitrine' }),
  A('avatar-set', 'friends', 'avatarSet', 1, coins(100),
    { en: 'A face to the name', fr: 'Un visage sur le nom' },
    { en: 'Choose a profile picture', fr: 'Choisissez une photo de profil' }),
  A('badges-four', 'star', 'badgesWorn', 4, coins(300),
    { en: 'Four on the chest', fr: 'Quatre sur la poitrine' },
    { en: 'Wear four badges at once', fr: 'Portez quatre badges à la fois' }),
  A('signed-in', 'cloud', 'signedIn', 1, coins(150),
    { en: 'On the record', fr: 'Au registre' },
    { en: 'Sign in to an account', fr: 'Connectez-vous à un compte' }),

  // --- the auction house, the rest of it ---------------------------------
  ...chain('bidder', 'burst', 'bidsPlaced',
    (n) => n === 1
      ? { en: 'Place a bid', fr: 'Placez une enchère' }
      : { en: `Place ${en(n)} bids`, fr: `Placez ${fr(n)} enchères` },
    [
      [1,   coins(100),  { en: 'Paddle up', fr: 'Panneau levé' }],
      [10,  coins(400),  { en: 'Bidding war', fr: 'Surenchère' }],
      [50,  coins(1500), { en: 'Floor regular', fr: 'Habitué de la salle' }],
      [200, pack('legendary', 5), { en: 'Going, going', fr: 'Une fois, deux fois' }]
    ]),
  ...chain('lister', 'label', 'auctionsListed',
    (n) => n === 1
      ? { en: 'Put a card up for auction', fr: 'Mettez une carte aux enchères' }
      : { en: `Put ${en(n)} cards up for auction`, fr: `Mettez ${fr(n)} cartes aux enchères` },
    [
      [1,  coins(100),  { en: 'Lot one', fr: 'Lot numéro un' }],
      [10, coins(400),  { en: 'Consignor', fr: 'Déposant' }],
      [50, coins(1500), { en: 'The catalogue', fr: 'Le catalogue' }]
    ]),
  ...chain('bigsale', 'gem', 'auctionBest',
    (n) => ({ en: `Sell one card at auction for ฿${en(n)}`, fr: `Vendez une carte aux enchères à ฿${fr(n)}` }),
    [
      [500,   coins(200),  { en: 'A fair price', fr: 'Un juste prix' }],
      [2500,  coins(900),  { en: 'Record lot', fr: 'Lot record' }],
      [10000, pack('mythic', 5), { en: 'The hammer falls', fr: 'Le marteau tombe' }]
    ]),

  // --- the shop and the money ----------------------------------------------
  ...chain('shopper', 'packs', 'shopBuys',
    (n) => ({ en: `Buy ${en(n)} boosters in the shop`, fr: `Achetez ${fr(n)} boosters à la boutique` }),
    [
      [5,    coins(100),  { en: 'Window shopper', fr: 'Lèche-vitrine' }],
      [50,   coins(400),  { en: 'Loyal customer', fr: 'Client fidèle' }],
      [250,  coins(1500), { en: 'Wholesale buyer', fr: 'Acheteur en gros' }],
      [1000, pack('mythic', 5), { en: 'Shopkeeper’s dream', fr: 'Le rêve du boutiquier' }]
    ]),
  ...chain('spender', 'gem', 'spent',
    (n) => ({ en: `Spend ฿${en(n)} in the shop in all`, fr: `Dépensez ฿${fr(n)} à la boutique en tout` }),
    [
      [5000,    coins(200),  { en: 'Loose change', fr: 'Menue monnaie' }],
      [50000,   coins(800),  { en: 'Big spender', fr: 'Grand dépensier' }],
      [250000,  coins(2500), { en: 'Patron of the shop', fr: 'Mécène de la boutique' }],
      [1000000, pack('exotic', 5), { en: 'The million', fr: 'Le million' }]
    ]),
  ...chain('crates', 'burst', 'crates',
    (n) => n === 1
      ? { en: 'Open a crate', fr: 'Ouvrez une caisse' }
      : { en: `Open ${en(n)} crates`, fr: `Ouvrez ${fr(n)} caisses` },
    [
      [1,  coins(150),  { en: 'Crowbar', fr: 'Pied-de-biche' }],
      [10, coins(600),  { en: 'Dockworker', fr: 'Docker' }],
      [50, pack('legendary', 5), { en: 'The whole shipment', fr: 'Toute la cargaison' }]
    ]),
  ...chain('bundles', 'packs', 'bundles',
    (n) => n === 1
      ? { en: 'Buy a bundle', fr: 'Achetez un lot' }
      : { en: `Buy ${en(n)} bundles`, fr: `Achetez ${fr(n)} lots` },
    [
      [1,  coins(150),  { en: 'Buy in bulk', fr: 'Achat groupé' }],
      [10, coins(600),  { en: 'By the dozen', fr: 'À la douzaine' }],
      [50, coins(2000), { en: 'Pallet load', fr: 'Par palettes' }]
    ]),
  ...chain('pressbuys', 'gem', 'tierBuys',
    (n) => n === 1
      ? { en: 'Buy a booster from the press', fr: 'Achetez un booster de la presse' }
      : { en: `Buy ${en(n)} boosters from the press`, fr: `Achetez ${fr(n)} boosters de la presse` },
    [
      [1,  coins(150),  { en: 'Hot off the press', fr: 'Tout juste sorti de presse' }],
      [10, coins(600),  { en: 'Pressman', fr: 'Pressier' }],
      [50, pack('legendary', 5), { en: 'Print master', fr: 'Maître imprimeur' }]
    ]),
  ...chain('freebies', 'gift', 'opensTimed',
    (n) => ({ en: `Open ${en(n)} free packs`, fr: `Ouvrez ${fr(n)} packs gratuits` }),
    [
      [10,  coins(100),  { en: 'On the house', fr: 'Offert par la maison' }],
      [100, coins(400),  { en: 'Nothing to pay', fr: 'Rien à payer' }],
      [500, coins(1500), { en: 'Free lunch', fr: 'Repas gratuit' }]
    ]),
  ...chain('earner', 'trade', 'sellEarned',
    (n) => ({ en: `Earn ฿${en(n)} from selling cards`, fr: `Gagnez ฿${fr(n)} en vendant des cartes` }),
    [
      [1000,   coins(150),  { en: 'First takings', fr: 'Première recette' }],
      [10000,  coins(600),  { en: 'Turnover', fr: 'Chiffre d’affaires' }],
      [100000, coins(2500), { en: 'Cash register', fr: 'Caisse enregistreuse' }]
    ]),

  // --- Ink and the Atelier ---------------------------------------------------
  ...chain('inkearned', 'ink', 'inkEarned',
    (n) => ({ en: `Earn ${en(n)} Ink in all`, fr: `Gagnez ${fr(n)} Encre en tout` }),
    [
      [100,   coins(200),  { en: 'First drops', fr: 'Premières gouttes' }],
      [500,   coins(800),  { en: 'Inkwell', fr: 'Encrier' }],
      [2000,  coins(2500), { en: 'Ink-stained', fr: 'Taché d’encre' }],
      [10000, pack('exotic', 5), { en: 'A river of ink', fr: 'Un fleuve d’encre' }]
    ]),
  ...chain('inkspent', 'ink', 'inkSpent',
    (n) => ({ en: `Spend ${en(n)} Ink in the Atelier`, fr: `Dépensez ${fr(n)} Encre à l’Atelier` }),
    [
      [100,  coins(200),  { en: 'Patron of the arts', fr: 'Mécène des arts' }],
      [500,  coins(800),  { en: 'Regular at the Atelier', fr: 'Habitué de l’Atelier' }],
      [2000, coins(2500), { en: 'Dressed to the nines', fr: 'Sur son trente-et-un' }]
    ]),
  ...chain('themesowned', 'wand', 'themesOwned',
    (n) => n === 1
      ? { en: 'Buy a theme', fr: 'Achetez un thème' }
      : { en: `Own ${en(n)} bought themes`, fr: `Possédez ${fr(n)} thèmes achetés` },
    [
      [1, coins(200),  { en: 'A new coat of paint', fr: 'Un coup de peinture' }],
      [5, coins(900),  { en: 'Decorator', fr: 'Décorateur' }],
      [9, pack('legendary', 5), { en: 'Every colour', fr: 'Toutes les couleurs' }]
    ]),
  ...chain('framesowned', 'frame', 'framesOwned',
    (n) => n === 1
      ? { en: 'Buy a level frame', fr: 'Achetez un cadre de niveau' }
      : { en: `Own ${en(n)} bought level frames`, fr: `Possédez ${fr(n)} cadres de niveau achetés` },
    [
      [1,  coins(200),  { en: 'Framed', fr: 'Encadré' }],
      [5,  coins(900),  { en: 'Frame shop', fr: 'Encadreur' }],
      [10, pack('legendary', 5), { en: 'Every frame on the wall', fr: 'Tous les cadres au mur' }]
    ]),
  ...chain('fxowned', 'spark', 'fxOwned',
    (n) => n === 1
      ? { en: 'Buy a card effect', fr: 'Achetez un effet de carte' }
      : { en: `Own ${en(n)} bought card effects`, fr: `Possédez ${fr(n)} effets de carte achetés` },
    [
      [1,  coins(200),  { en: 'Special effect', fr: 'Effet spécial' }],
      [10, coins(900),  { en: 'Effects department', fr: 'Service des effets' }],
      [40, pack('prismatic', 5), { en: 'The whole table', fr: 'Toute la table' }]
    ]),
  ...chain('themesworn', 'wand', 'themesWorn',
    (n) => ({ en: `Wear ${en(n)} different themes`, fr: `Portez ${fr(n)} thèmes différents` }),
    [
      [2,  coins(80),   { en: 'Try it on', fr: 'Essayez-le' }],
      [5,  coins(300),  { en: 'Change of scenery', fr: 'Changement de décor' }],
      [10, coins(1200), { en: 'Chameleon', fr: 'Caméléon' }]
    ]),
  ...chain('framesworn', 'frame', 'framesWorn',
    (n) => ({ en: `Wear ${en(n)} different level frames`, fr: `Portez ${fr(n)} cadres de niveau différents` }),
    [
      [2,  coins(80),   { en: 'Reframed', fr: 'Recadré' }],
      [5,  coins(300),  { en: 'Frame by frame', fr: 'Cadre par cadre' }],
      [10, coins(1200), { en: 'Gallery wall', fr: 'Mur de galerie' }]
    ]),
  ...chain('fxworn', 'spark', 'fxWorn',
    (n) => n === 1
      ? { en: 'Put a card effect on a rarity', fr: 'Mettez un effet de carte sur une rareté' }
      : { en: `Put ${en(n)} different card effects on`, fr: `Mettez ${fr(n)} effets de carte différents` },
    [
      [1,  coins(80),   { en: 'Dressed up', fr: 'Endimanché' }],
      [5,  coins(300),  { en: 'Wardrobe', fr: 'Garde-robe' }],
      [20, coins(1200), { en: 'Costume department', fr: 'Service des costumes' }]
    ]),
  ...chain('atelier', 'ink', 'atelierBuys',
    (n) => ({ en: `Make ${en(n)} purchases in the Atelier`, fr: `Faites ${fr(n)} achats à l’Atelier` }),
    [
      [3,  coins(150),  { en: 'Three parcels', fr: 'Trois paquets' }],
      [15, coins(700),  { en: 'Best customer', fr: 'Meilleur client' }],
      [59, pack('prismatic', 5), { en: 'Bought the shop', fr: 'La boutique entière' }]
    ]),
  ...chain('codes', 'key', 'codesRedeemed',
    (n) => n === 1
      ? { en: 'Redeem a secret code', fr: 'Utilisez un code secret' }
      : { en: `Redeem ${en(n)} secret codes`, fr: `Utilisez ${fr(n)} codes secrets` },
    [
      [1, coins(200),  { en: 'Open sesame', fr: 'Sésame, ouvre-toi' }],
      [3, coins(900),  { en: 'Keyring', fr: 'Trousseau' }]
    ]),

  // --- time, in days ---------------------------------------------------------
  ...chain('days', 'calendar', 'playDays',
    (n) => ({ en: `Play on ${en(n)} different days`, fr: `Jouez ${fr(n)} jours différents` }),
    [
      [7,   coins(200),  { en: 'A week in', fr: 'Une semaine' }],
      [30,  coins(700),  { en: 'A month of days', fr: 'Un mois de jours' }],
      [100, coins(2000), { en: 'The hundredth day', fr: 'Le centième jour' }],
      [365, pack('exotic', 5), { en: 'Around the sun', fr: 'Le tour du soleil' }]
    ]),
  ...chain('weeks', 'gift', 'giftWeeks',
    (n) => n === 1
      ? { en: 'Finish a full week of daily gifts', fr: 'Terminez une semaine complète de cadeaux' }
      : { en: `Finish ${en(n)} full weeks of daily gifts`, fr: `Terminez ${fr(n)} semaines complètes de cadeaux` },
    [
      [1,  coins(200),  { en: 'Seven for seven', fr: 'Sept sur sept' }],
      [10, coins(900),  { en: 'Ten weeks straight', fr: 'Dix semaines de suite' }],
      [52, pack('mythic', 5), { en: 'Fifty-two', fr: 'Cinquante-deux' }]
    ]),

  // --- the board -------------------------------------------------------------
  A('board-100', 'podium', 'boardTop100', 1, coins(300),
    { en: 'On the board', fr: 'Au tableau' },
    { en: 'Finish in the top hundred of a leaderboard window', fr: 'Terminez dans les cent premiers d’une fenêtre du classement' }),
  A('board-10', 'podium', 'boardTop10', 1, coins(1200),
    { en: 'Top ten', fr: 'Top dix' },
    { en: 'Finish in the top ten of a leaderboard window', fr: 'Terminez dans les dix premiers d’une fenêtre du classement' }),
  A('board-1', 'trophy', 'boardFirst', 1, pack('mythic', 5),
    { en: 'Number one', fr: 'Numéro un' },
    { en: 'Top a leaderboard window', fr: 'Terminez premier d’une fenêtre du classement' }),
  A('backup', 'cloud', 'backups', 1, coins(100),
    { en: 'Belt and braces', fr: 'Ceinture et bretelles' },
    { en: 'Export a backup of your save', fr: 'Exportez une sauvegarde' })

];

/** Unlock state for every achievement, given the measured facts. */
export function evaluate(facts, redeemed = []) {
  const done = new Set(redeemed);
  return ACHIEVEMENTS.map((a) => {
    const have = facts[a.stat] ?? 0;
    return {
      ...a,
      name: tx(a.name), desc: tx(a.desc),
      have: Math.min(have, a.need),
      unlocked: have >= a.need,
      redeemed: done.has(a.id),
      redeemable: have >= a.need && !done.has(a.id)
    };
  });
}

export const redeemableCount = (facts, redeemed = []) =>
  evaluate(facts, redeemed).filter((a) => a.redeemable).length;
