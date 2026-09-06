/**
 * THE SEASONS
 * ----------------------------------------------------------------------------
 * The year in eleven parts, each with a name, a look, a booster of its own,
 * a track of rewards and a theme nobody can wear outside it. A season is
 * dated by month and day and comes round every year, so the calendar below
 * is the whole calendar: nothing has to be added for next year.
 *
 *   from, to   [month, day], the day it starts and the day the next begins
 *   pack       the season's booster, in the same shape as a subject in
 *              src/data/packs.js: queries per language, match terms, a hero
 *              article for the pack art, and its own foil and particles
 *   theme      the season's theme id, unlocked on the track (a row in
 *              src/ui/themes.js and a block in styles/themes.css)
 *   badge      the motif and foil of the season's badge chip
 *   particle   what falls, drifts or rises behind the season's theme
 *
 * Everything the player reads is bilingual. Search queries are used as
 * they are (srsearch), so each language has its own.
 */

export const SEASONS = [
  {
    id: 'frost', from: [1, 1], to: [2, 1],
    name: { en: 'Frost', fr: 'Givre' },
    tagline: { en: 'The year begins under ice.', fr: 'L’année commence sous la glace.' },
    blurb: { en: 'Ice, snow, the poles, the long nights and the first days of the year.', fr: 'Glace, neige, les pôles, les longues nuits et les premiers jours de l’année.' },
    icon: 'snowflake', emblem: 'space', accent: '#bfe9ff', accent2: '#0b2a4a', swatch: ['#071426', '#bfe9ff', '#7dd3fc'],
    particle: 'snow', theme: 'frost', badge: { motif: 'flake', foil: ['#eaf8ff', '#7dd3fc', '#1e3a5f'] },
    pack: {
      hero: { en: 'Iceberg', fr: 'Iceberg' },
      family: 'roundel', foil: 'facets', holoAngle: 128, shapes: ['orb', 'star4'], colors: ['#ffffff', '#bfe9ff', '#7dd3fc'],
      match: { en: ['ice', 'snow', 'winter', 'polar', 'arctic', 'antarctic', 'glacier', 'frost', 'new year', 'cold'],
               fr: ['glace', 'neige', 'hiver', 'polaire', 'arctique', 'antarctique', 'glacier', 'gel', 'nouvel an', 'froid'] },
      queries: { en: ['incategory:"Ice"', 'incategory:"Glaciers"', 'incategory:"Winter"', 'incategory:"New Year celebrations"', 'polar expedition', 'snow', 'iceberg', 'winter festival'],
                 fr: ['incategory:"Glace"', 'incategory:"Glacier"', 'incategory:"Hiver"', 'expédition polaire', 'neige', 'banquise', 'nouvel an', 'fête de l’hiver'] }
    }
  },
  {
    id: 'hearts', from: [2, 1], to: [3, 1],
    name: { en: 'Hearts', fr: 'Cœurs' },
    tagline: { en: 'Love letters, masks and confetti.', fr: 'Lettres d’amour, masques et confettis.' },
    blurb: { en: 'Valentines, famous couples, carnival and everything worn to a ball.', fr: 'Saint-Valentin, couples célèbres, carnaval et tout ce qui se porte au bal.' },
    icon: 'heart', emblem: 'pixelheart', accent: '#fb7185', accent2: '#4a1024', swatch: ['#2a0a16', '#fb7185', '#fda4af'],
    particle: 'heart', theme: 'hearts', badge: { motif: 'heart', foil: ['#ffe4e6', '#fb7185', '#881337'] },
    pack: {
      hero: { en: 'Valentine\'s Day', fr: 'Saint-Valentin' },
      family: 'marquee', foil: 'swirl', holoAngle: 96, shapes: ['blob', 'orb'], colors: ['#fb7185', '#fda4af', '#ffffff'],
      match: { en: ['love', 'romance', 'valentine', 'carnival', 'mask', 'wedding', 'couple', 'kiss', 'heart'],
               fr: ['amour', 'romance', 'valentin', 'carnaval', 'masque', 'mariage', 'couple', 'baiser', 'cœur'] },
      queries: { en: ['incategory:"Valentine\'s Day"', 'incategory:"Carnivals"', 'incategory:"Love"', 'incategory:"Romance"', 'famous couple', 'love song', 'masquerade ball', 'wedding tradition'],
                 fr: ['incategory:"Saint-Valentin"', 'incategory:"Carnaval"', 'incategory:"Amour"', 'couple célèbre', 'chanson d’amour', 'bal masqué', 'romance', 'mariage'] }
    }
  },
  {
    id: 'thaw', from: [3, 1], to: [4, 1],
    name: { en: 'Thaw', fr: 'Dégel' },
    tagline: { en: 'The rivers run again.', fr: 'Les rivières coulent à nouveau.' },
    blurb: { en: 'Spring, the equinox, birdsong, rivers, shamrocks and green things.', fr: 'Le printemps, l’équinoxe, les oiseaux, les rivières, les trèfles et tout ce qui est vert.' },
    icon: 'nature', emblem: 'nature', accent: '#86efac', accent2: '#0f3d2a', swatch: ['#07211a', '#86efac', '#5eead4'],
    particle: 'petal', theme: 'thaw', badge: { motif: 'sprout', foil: ['#dcfce7', '#86efac', '#14532d'] },
    pack: {
      hero: { en: 'Spring (season)', fr: 'Printemps' },
      family: 'arch', foil: 'waves', holoAngle: 112, shapes: ['petal', 'orb'], colors: ['#86efac', '#d9f99d', '#ffffff'],
      match: { en: ['spring', 'river', 'bird', 'equinox', 'rain', 'ireland', 'irish', 'shamrock', 'blossom', 'meadow'],
               fr: ['printemps', 'rivière', 'oiseau', 'équinoxe', 'pluie', 'irlande', 'irlandais', 'trèfle', 'floraison', 'prairie'] },
      queries: { en: ['incategory:"Spring (season)"', 'incategory:"Rivers"', 'incategory:"Birds"', 'incategory:"Saint Patrick\'s Day"', 'spring festival', 'equinox', 'songbird', 'river of'],
                 fr: ['incategory:"Printemps"', 'incategory:"Fleuve"', 'incategory:"Oiseau"', 'fête de la Saint-Patrick', 'équinoxe', 'oiseau chanteur', 'rivière', 'renouveau'] }
    }
  },
  {
    id: 'fools', from: [4, 1], to: [5, 1],
    name: { en: 'Fools and Eggs', fr: 'Poissons et œufs' },
    tagline: { en: 'Hoaxes, rabbits and painted eggs.', fr: 'Canulars, lapins et œufs peints.' },
    blurb: { en: 'April Fools, famous hoaxes, Easter, rabbits, eggs and pranks that made history.', fr: 'Poissons d’avril, canulars célèbres, Pâques, lapins, œufs et farces entrées dans l’histoire.' },
    icon: 'wand', emblem: 'laugh', accent: '#fde047', accent2: '#4c1d95', swatch: ['#1d1040', '#fde047', '#c4b5fd'],
    particle: 'bubble', theme: 'fools', badge: { motif: 'egg', foil: ['#fef9c3', '#fde047', '#6b21a8'] },
    pack: {
      hero: { en: 'April Fools\' Day', fr: 'Poisson d’avril' },
      family: 'panel', foil: 'pixels', holoAngle: 84, shapes: ['square', 'star5'], colors: ['#fde047', '#c4b5fd', '#ffffff'],
      match: { en: ['hoax', 'prank', 'april fools', 'easter', 'rabbit', 'egg', 'joke', 'humour', 'humor', 'comedy'],
               fr: ['canular', 'farce', 'poisson d’avril', 'pâques', 'lapin', 'œuf', 'blague', 'humour', 'comédie'] },
      queries: { en: ['incategory:"Hoaxes"', 'incategory:"April Fools\' Day"', 'incategory:"Easter"', 'incategory:"Rabbits and hares"', 'famous hoax', 'practical joke', 'easter egg', 'comedian'],
                 fr: ['incategory:"Canular"', 'incategory:"Pâques"', 'incategory:"Lapin"', 'poisson d’avril', 'canular célèbre', 'farce', 'œuf de Pâques', 'humoriste'] }
    }
  },
  {
    id: 'bloom', from: [5, 1], to: [6, 1],
    name: { en: 'Bloom', fr: 'Floraison' },
    tagline: { en: 'Gardens, bees and May.', fr: 'Jardins, abeilles et le mois de mai.' },
    blurb: { en: 'Flowers, gardens, bees, May Day and everything that opens in the sun.', fr: 'Fleurs, jardins, abeilles, le premier mai et tout ce qui s’ouvre au soleil.' },
    icon: 'plants', emblem: 'plants', accent: '#f9a8d4', accent2: '#1f3a12', swatch: ['#132412', '#f9a8d4', '#a3e635'],
    particle: 'petal', theme: 'bloom', badge: { motif: 'flower', foil: ['#fce7f3', '#f9a8d4', '#365314'] },
    pack: {
      hero: { en: 'Flower', fr: 'Fleur' },
      family: 'arch', foil: 'petals', holoAngle: 100, shapes: ['petal', 'petal', 'orb'], colors: ['#f9a8d4', '#a3e635', '#fef9c3'],
      match: { en: ['flower', 'garden', 'bee', 'blossom', 'botan', 'orchid', 'rose', 'tulip', 'pollinat', 'may day'],
               fr: ['fleur', 'jardin', 'abeille', 'floraison', 'botani', 'orchidée', 'rose', 'tulipe', 'pollinis', 'premier mai'] },
      queries: { en: ['incategory:"Flowers"', 'incategory:"Gardens"', 'incategory:"Bees"', 'incategory:"May Day"', 'botanical garden', 'flowering plant', 'beekeeping', 'rose cultivar'],
                 fr: ['incategory:"Fleur"', 'incategory:"Jardin"', 'incategory:"Abeille"', 'jardin botanique', 'plante à fleurs', 'apiculture', 'fête du Travail', 'muguet'] }
    }
  },
  {
    id: 'solstice', from: [6, 1], to: [7, 14],
    name: { en: 'Solstice', fr: 'Solstice' },
    tagline: { en: 'The longest days.', fr: 'Les jours les plus longs.' },
    blurb: { en: 'The sun, the sea, beaches, midsummer, islands and the longest days of the year.', fr: 'Le soleil, la mer, les plages, la Saint-Jean, les îles et les jours les plus longs de l’année.' },
    icon: 'burst', emblem: 'geography', accent: '#fbbf24', accent2: '#0e4a5e', swatch: ['#06232e', '#fbbf24', '#22d3ee'],
    particle: 'spark', theme: 'solstice', badge: { motif: 'sun', foil: ['#fef3c7', '#fbbf24', '#0e7490'] },
    pack: {
      hero: { en: 'Sun', fr: 'Soleil' },
      family: 'roundel', foil: 'rays', holoAngle: 116, shapes: ['star4', 'orb'], colors: ['#fbbf24', '#22d3ee', '#ffffff'],
      match: { en: ['sun', 'summer', 'beach', 'sea', 'ocean', 'island', 'solstice', 'midsummer', 'surf', 'coast'],
               fr: ['soleil', 'été', 'plage', 'mer', 'océan', 'île', 'solstice', 'saint-jean', 'surf', 'côte'] },
      queries: { en: ['incategory:"Beaches"', 'incategory:"Islands"', 'incategory:"Summer"', 'incategory:"Midsummer"', 'the Sun', 'solstice', 'coral reef', 'lighthouse'],
                 fr: ['incategory:"Plage"', 'incategory:"Île"', 'incategory:"Été"', 'fête de la Saint-Jean', 'le Soleil', 'solstice', 'récif corallien', 'phare'] }
    }
  },
  {
    id: 'voyage', from: [7, 14], to: [9, 1],
    name: { en: 'Voyage', fr: 'Grand voyage' },
    tagline: { en: 'Somewhere else, for a while.', fr: 'Ailleurs, pour un temps.' },
    blurb: { en: 'Travel, expeditions, the Moon landing, festivals, road trips and far-off places.', fr: 'Voyages, expéditions, les premiers pas sur la Lune, festivals, routes et contrées lointaines.' },
    icon: 'planes', emblem: 'planes', accent: '#fb923c', accent2: '#1e3a8a', swatch: ['#0c1a3f', '#fb923c', '#93c5fd'],
    particle: 'bubble', theme: 'voyage', badge: { motif: 'compass', foil: ['#ffedd5', '#fb923c', '#1e3a8a'] },
    pack: {
      hero: { en: 'Apollo 11', fr: 'Apollo 11' },
      family: 'roundel', foil: 'contours', holoAngle: 124, shapes: ['streak', 'orb'], colors: ['#fb923c', '#93c5fd', '#ffffff'],
      match: { en: ['travel', 'expedition', 'voyage', 'journey', 'explorer', 'moon', 'festival', 'road', 'railway', 'tourism'],
               fr: ['voyage', 'expédition', 'explorateur', 'lune', 'festival', 'route', 'chemin de fer', 'tourisme', 'périple'] },
      queries: { en: ['incategory:"Explorers"', 'incategory:"Expeditions"', 'incategory:"Apollo program"', 'incategory:"Music festivals"', 'road trip', 'grand tour', 'famous journey', 'world heritage site'],
                 fr: ['incategory:"Explorateur"', 'incategory:"Expédition"', 'programme Apollo', 'festival de musique', 'voyage célèbre', 'route mythique', 'patrimoine mondial', 'tour du monde'] }
    }
  },
  {
    id: 'harvest', from: [9, 1], to: [10, 1],
    name: { en: 'Harvest', fr: 'Moisson' },
    tagline: { en: 'Back to the fields and the desks.', fr: 'Retour aux champs et aux pupitres.' },
    blurb: { en: 'Harvests, vineyards, apples, the first day of school and the turning leaves.', fr: 'Moissons, vignobles, pommes, la rentrée des classes et les feuilles qui tournent.' },
    icon: 'leaf', emblem: 'plants', accent: '#f59e0b', accent2: '#3b1f0b', swatch: ['#1f1108', '#f59e0b', '#fde68a'],
    particle: 'leaf', theme: 'harvest', badge: { motif: 'leaf', foil: ['#fef3c7', '#f59e0b', '#78350f'] },
    pack: {
      hero: { en: 'Harvest', fr: 'Moisson' },
      family: 'plate', foil: 'linen', holoAngle: 104, shapes: ['petal', 'blob'], colors: ['#f59e0b', '#fde68a', '#b45309'],
      match: { en: ['harvest', 'autumn', 'fall', 'vineyard', 'wine', 'apple', 'school', 'wheat', 'farm', 'orchard'],
               fr: ['moisson', 'automne', 'vignoble', 'vin', 'pomme', 'école', 'blé', 'ferme', 'verger', 'vendange'] },
      queries: { en: ['incategory:"Harvest"', 'incategory:"Autumn"', 'incategory:"Wine regions"', 'incategory:"Apple cultivars"', 'harvest festival', 'vineyard', 'first day of school', 'wheat'],
                 fr: ['incategory:"Moisson"', 'incategory:"Automne"', 'incategory:"Vignoble"', 'fête des vendanges', 'variété de pomme', 'rentrée scolaire', 'blé', 'verger'] }
    }
  },
  {
    id: 'hallows', from: [10, 1], to: [11, 3],
    name: { en: 'Hallows', fr: 'Sabbat' },
    tagline: { en: 'Something is at the door.', fr: 'Quelque chose est à la porte.' },
    blurb: { en: 'Halloween, ghosts, monsters, witches, haunted places and the stories told in the dark.', fr: 'Halloween, fantômes, monstres, sorcières, lieux hantés et les histoires qu’on raconte dans le noir.' },
    icon: 'weird', emblem: 'weird', accent: '#fb923c', accent2: '#2e1065', swatch: ['#160a2a', '#fb923c', '#c084fc'],
    particle: 'ember', theme: 'hallows', badge: { motif: 'ghost', foil: ['#ffedd5', '#fb923c', '#3b0764'] },
    pack: {
      hero: { en: 'Halloween', fr: 'Halloween' },
      family: 'marquee', foil: 'swirl', holoAngle: 138, shapes: ['orb', 'star4'], colors: ['#fb923c', '#c084fc', '#0b0512'],
      match: { en: ['halloween', 'ghost', 'monster', 'witch', 'vampire', 'haunted', 'horror', 'zombie', 'skeleton', 'pumpkin'],
               fr: ['halloween', 'fantôme', 'monstre', 'sorcière', 'vampire', 'hanté', 'horreur', 'zombie', 'squelette', 'citrouille'] },
      queries: { en: ['incategory:"Halloween"', 'incategory:"Ghosts"', 'incategory:"Legendary creatures"', 'incategory:"Witchcraft"', 'haunted house', 'horror film', 'vampire', 'monster'],
                 fr: ['incategory:"Halloween"', 'incategory:"Fantôme"', 'incategory:"Créature légendaire"', 'incategory:"Sorcellerie"', 'maison hantée', 'film d’horreur', 'vampire', 'monstre'] }
    }
  },
  {
    id: 'ember', from: [11, 3], to: [12, 1],
    name: { en: 'Ember', fr: 'Braise' },
    tagline: { en: 'Fog, bonfires and remembrance.', fr: 'Brume, feux de joie et souvenir.' },
    blurb: { en: 'Bonfires, fireworks, fog, candles, remembrance and the tables of thanksgiving.', fr: 'Feux de joie, feux d’artifice, brume, bougies, souvenir et les tables de fête.' },
    icon: 'flame', emblem: 'history', accent: '#f97316', accent2: '#1c1917', swatch: ['#120e0c', '#f97316', '#fdba74'],
    particle: 'ember', theme: 'ember', badge: { motif: 'candle', foil: ['#ffedd5', '#f97316', '#292524'] },
    pack: {
      hero: { en: 'Bonfire', fr: 'Feu de joie' },
      family: 'plate', foil: 'grooves', holoAngle: 92, shapes: ['spike', 'orb'], colors: ['#f97316', '#fdba74', '#ffffff'],
      match: { en: ['fire', 'bonfire', 'firework', 'fog', 'candle', 'remembrance', 'memorial', 'thanksgiving', 'lantern', 'november'],
               fr: ['feu', 'feu de joie', 'feu d’artifice', 'brume', 'bougie', 'souvenir', 'mémorial', 'action de grâce', 'lanterne', 'novembre'] },
      queries: { en: ['incategory:"Fireworks"', 'incategory:"Remembrance days"', 'incategory:"Thanksgiving"', 'incategory:"Fire"', 'bonfire night', 'memorial', 'lantern festival', 'candle'],
                 fr: ['incategory:"Feu d’artifice"', 'incategory:"Mémoire collective"', 'incategory:"Feu"', 'commémoration', 'fête des lanternes', 'bougie', 'action de grâce', 'Toussaint'] }
    }
  },
  {
    id: 'yule', from: [12, 1], to: [1, 1],
    name: { en: 'Yule', fr: 'Noël' },
    tagline: { en: 'Lights in every window.', fr: 'Des lumières à chaque fenêtre.' },
    blurb: { en: 'Christmas, winter holidays, carols, gingerbread, reindeer and the lights in every window.', fr: 'Noël, les fêtes d’hiver, les chants, le pain d’épices, les rennes et les lumières à chaque fenêtre.' },
    icon: 'gift', emblem: 'seal', accent: '#f87171', accent2: '#0f3d2a', swatch: ['#08231a', '#f87171', '#86efac'],
    particle: 'snow', theme: 'yule', badge: { motif: 'tree', foil: ['#fee2e2', '#f87171', '#14532d'] },
    pack: {
      hero: { en: 'Christmas', fr: 'Noël' },
      family: 'sash', foil: 'stars', holoAngle: 118, shapes: ['star4', 'orb'], colors: ['#f87171', '#86efac', '#ffffff'],
      match: { en: ['christmas', 'yule', 'winter holiday', 'santa', 'reindeer', 'carol', 'gingerbread', 'nativity', 'advent', 'hanukkah'],
               fr: ['noël', 'fêtes de fin d’année', 'père noël', 'renne', 'chant de noël', 'pain d’épices', 'nativité', 'avent', 'hanoucca'] },
      queries: { en: ['incategory:"Christmas"', 'incategory:"Christmas traditions"', 'incategory:"Christmas music"', 'incategory:"Winter holidays"', 'Santa Claus', 'reindeer', 'gingerbread', 'Christmas market'],
                 fr: ['incategory:"Noël"', 'incategory:"Tradition de Noël"', 'incategory:"Chant de Noël"', 'fêtes de fin d’année', 'père Noël', 'renne', 'pain d’épices', 'marché de Noël'] }
    }
  }
];

export const seasonById = (id) => SEASONS.find((s) => s.id === id) ?? null;

/** The track: ten rungs of season points, the same ladder every season. */
export const TRACK = [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

/**
 * What each rung pays. `booster` is the season's own pack; `badge` and
 * `theme` are the season's and cannot be had any other way.
 */
export const TRACK_REWARDS = [
  { money: 300, ink: 5 },
  { booster: { cards: 5 }, ink: 5 },
  { money: 600, ink: 10 },
  { badge: true, ink: 15 },
  { money: 500, booster: { cards: 5 }, ink: 10 },
  { money: 1000, ink: 20 },
  { theme: true, ink: 25 },
  { booster: { cards: 5, rarityId: 'epic' }, ink: 25 },
  { money: 2000, ink: 40 },
  { booster: { cards: 5, rarityId: 'legendary' }, money: 1500, ink: 60 }
];

/**
 * Season points, by what was done. Points scored in a minigame count one
 * for every twenty; everything else is a flat amount per report. The
 * season's own booster pays three times an ordinary one.
 */
export const POINTS_FOR = {
  open: (detail, season) => (detail?.themeId === `season-${season.id}` ? 30 : 10),
  pull: (detail) => (detail?.isNew ? 3 : 1),
  points: (detail) => Math.floor((Number(detail?.amount) || 0) / 20),
  wikdle: (detail) => (detail?.won ? 25 : 5),
  quiz: () => 10,
  daily: () => 40,
  album: () => 100,
  gift: () => 15,
  trade: () => 20,
  friend: () => 20,
  duel: () => 8,
  reveal: () => 8,
  slots: () => 1,
  custom: () => 15,
  // A friend game settled and claimed: more for the winner.
  versus: (detail) => (detail?.won ? 40 : 10)
};

/** What a claimed daily quest and a guild goal add on top. */
export const POINTS_QUEST = 30;
export const POINTS_GUILD_GOAL = 100;

/* --- the season boosters, in the shape of a subject -------------------------
 * themeById() in src/data/packs.js knows these too, so a season booster
 * is named, coloured, styled and drawn by the same code as any subject
 * booster, without sitting on the shelf of albums or the shop's own rows. */
export const SEASON_PACKS = SEASONS.map((season) => ({
  id: `season-${season.id}`,
  season: season.id,
  icon: season.icon,
  emblem: season.emblem,
  name: season.name,
  tagline: season.tagline,
  hero: season.pack.hero,
  accent: season.accent, accent2: season.accent2,
  match: season.pack.match,
  queries: season.pack.queries,
  style: { family: season.pack.family, foil: season.pack.foil, holoAngle: season.pack.holoAngle, shapes: season.pack.shapes, colors: season.pack.colors }
}));

export const seasonPackById = (id) => SEASON_PACKS.find((p) => p.id === id) ?? null;
