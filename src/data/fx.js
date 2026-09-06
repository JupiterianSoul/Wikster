/*
 * CARD EFFECTS
 *
 * Every rarity ships with its own bespoke treatment, drawn tier by tier: that
 * is `classic`, and it is what a card wears until its owner says otherwise.
 * The rest are alternates bought with Ink in the Atelier, five to a rarity
 * and no two alike anywhere in the table: a Common has five of its own, a
 * Prismatic five of its own, and none of the forty is another recoloured.
 *
 * Each is written for the rarity it belongs to and paints in that rarity's
 * colour where it paints a colour at all, so dressing a tier never costs
 * the ladder its legibility. Their CSS lives in styles/cards.css under
 * [data-fx]. Special sits outside all of this and always wears its own.
 */

const s = (id, en, fr, noteEn, noteFr) => ({ id, name: { en, fr }, note: { en: noteEn, fr: noteFr } });

export const CLASSIC = s('classic', 'Classic', 'Classique', 'The treatment drawn for this tier.', 'Le traitement dessiné pour ce palier.');

export const FX_BY_RARITY = {
  common: [
    s('pencil', 'Pencil', 'Crayon', 'Hatched pencil strokes, laid diagonally across the art.', 'Des hachures au crayon, posées en diagonale sur l’image.'),
    s('fold', 'Folded', 'Plié', 'A crease down the card, catching the light along its edge.', 'Un pli le long de la carte, qui accroche la lumière sur son arête.'),
    s('postmark', 'Postmark', 'Cachet', 'A circular postmark stamped in the corner, turning slowly.', 'Un cachet postal rond tamponné dans le coin, qui tourne lentement.'),
    s('dust', 'Dust', 'Poussière', 'Motes drifting up through a shaft of light.', 'Des grains de poussière qui montent dans un rai de lumière.'),
    s('halftone', 'Halftone', 'Trame', 'A newspaper dot screen laid over the picture.', 'Une trame de points de journal posée sur l’image.')
  ],
  uncommon: [
    s('moss', 'Moss', 'Mousse', 'Green blotches creeping in from the corners and breathing.', 'Des taches vertes qui gagnent depuis les coins et respirent.'),
    s('vines', 'Vines', 'Lianes', 'Thin vines climbing the card on the diagonal.', 'De fines lianes qui grimpent la carte en diagonale.'),
    s('dew', 'Dew', 'Rosée', 'Drops of water on the surface, each catching the light in turn.', 'Des gouttes d’eau sur la surface, qui prennent la lumière tour à tour.'),
    s('verdigris', 'Verdigris', 'Vert-de-gris', 'A patina washing in from the edges, the way copper goes.', 'Une patine qui gagne depuis les bords, comme le cuivre.'),
    s('fern', 'Fern', 'Fougère', 'A fern frond unrolling across the corner.', 'Une fronde de fougère qui se déroule dans le coin.')
  ],
  rare: [
    s('ripple', 'Ripple', 'Ondulation', 'Rings spreading from the centre, as on still water.', 'Des cercles qui s’élargissent depuis le centre, comme sur une eau calme.'),
    s('frostbite', 'Frostbite', 'Gelure', 'Ice crystals reaching in from the corners.', 'Des cristaux de glace qui avancent depuis les coins.'),
    s('tide', 'Tide', 'Marée', 'A band of water rising and falling along the foot of the card.', 'Une bande d’eau qui monte et descend au pied de la carte.'),
    s('sapphire', 'Sapphire', 'Saphir', 'The surface cut into facets, a sheen crossing each in turn.', 'La surface taillée en facettes, un éclat traversant chacune tour à tour.'),
    s('constellation', 'Constellation', 'Constellation', 'Stars joined by faint lines, wheeling slowly.', 'Des étoiles reliées par de fins traits, qui tournent lentement.')
  ],
  epic: [
    s('nebula', 'Nebula', 'Nébuleuse', 'Clouds of colour drifting over each other.', 'Des nuages de couleur qui dérivent l’un sur l’autre.'),
    s('arcane', 'Arcane', 'Arcane', 'A ring of runes turning around the frame.', 'Un anneau de runes qui tourne autour du cadre.'),
    s('voltage', 'Voltage', 'Voltage', 'A lightning fork flickering down the card.', 'Un éclair qui tressaille le long de la carte.'),
    s('velvet', 'Velvet', 'Velours', 'Crushed velvet, its nap catching the light where it turns.', 'Du velours froissé, dont le poil prend la lumière là où il tourne.'),
    s('orbitals', 'Orbitals', 'Orbitales', 'Two orbits tilting around the card at different speeds.', 'Deux orbites qui basculent autour de la carte à deux vitesses.')
  ],
  legendary: [
    s('gilt', 'Gilt', 'Dorure', 'Gold leaf laid in flakes, shimmering where it is thin.', 'De la feuille d’or posée par écailles, qui miroite là où elle est mince.'),
    s('sunburst', 'Sunburst', 'Rayons', 'Rays fanning out from the corner and turning.', 'Des rayons qui s’éventaillent depuis le coin et tournent.'),
    s('laurel', 'Laurel', 'Laurier', 'A laurel wreath running the border.', 'Une couronne de laurier qui court le long du bord.'),
    s('embers', 'Embers', 'Braises', 'Sparks rising from the foot of the card and going out.', 'Des étincelles qui montent du pied de la carte et s’éteignent.'),
    s('molten', 'Molten', 'En fusion', 'Seams of molten gold flowing across the art.', 'Des veines d’or en fusion qui coulent sur l’image.')
  ],
  mythic: [
    s('bloodmoon', 'Blood Moon', 'Lune de sang', 'A crimson moon rising behind the art, eclipsed at its edge.', 'Une lune pourpre qui se lève derrière l’image, éclipsée sur son bord.'),
    s('dragonscale', 'Dragonscale', 'Écailles', 'Overlapping scales, a highlight sweeping across them.', 'Des écailles qui se chevauchent, un reflet qui les balaie.'),
    s('inferno', 'Inferno', 'Brasier', 'Flames licking up from the foot of the card.', 'Des flammes qui lèchent le pied de la carte.'),
    s('sigil', 'Sigil', 'Sceau', 'A glowing geometric seal pulsing over the art.', 'Un sceau géométrique lumineux qui pulse sur l’image.'),
    s('thorns', 'Thorns', 'Épines', 'A border of thorns closing around the frame.', 'Une bordure d’épines qui se referme autour du cadre.')
  ],
  exotic: [
    s('hologram', 'Hologram', 'Hologramme', 'Diffraction bands shifting through every colour.', 'Des bandes de diffraction qui passent par toutes les couleurs.'),
    s('glitch', 'Glitch', 'Glitch', 'The picture splitting into offset colour channels.', 'L’image qui se dédouble en canaux de couleur décalés.'),
    s('plasma', 'Plasma', 'Plasma', 'Two swirls of light turning against each other.', 'Deux tourbillons de lumière qui tournent l’un contre l’autre.'),
    s('oilslick', 'Oil Slick', 'Irisé', 'The rainbow of oil on water, sliding as the card tilts.', 'L’arc-en-ciel d’une nappe d’huile, qui glisse quand la carte penche.'),
    s('scanlines', 'Scanlines', 'Balayage', 'A cathode screen: fine lines and a rolling bar.', 'Un écran cathodique : des lignes fines et une barre qui défile.')
  ],
  prismatic: [
    s('spectrum', 'Spectrum', 'Spectre', 'A full rainbow sweeping the whole card.', 'Un arc-en-ciel complet qui balaie toute la carte.'),
    s('shatter', 'Shatter', 'Éclats', 'Glass shards over the art, each catching its own light.', 'Des éclats de verre sur l’image, chacun prenant sa propre lumière.'),
    s('curtain', 'Curtain', 'Rideau', 'Ribbons of light folding over the card like an aurora.', 'Des rubans de lumière qui se replient sur la carte comme une aurore.'),
    s('starfield', 'Starfield', 'Champ d’étoiles', 'Deep space in two layers, drifting at two speeds.', 'L’espace profond en deux couches, dérivant à deux vitesses.'),
    s('crown', 'Crown', 'Couronne', 'A radiant crown of light at the top of the card, pulsing.', 'Une couronne de lumière radieuse en haut de la carte, qui pulse.')
  ]
};

export const DEFAULT_FX = 'classic';

/** Every style of a rarity, classic first. */
export const fxForRarity = (rarityId) => [CLASSIC, ...(FX_BY_RARITY[rarityId] ?? [])];

/** Every alternate in the table, with the rarity it belongs to. */
export const ALL_FX = Object.entries(FX_BY_RARITY).flatMap(([rarityId, list]) => list.map((style) => ({ ...style, rarityId })));

export const fxById = (id) => (id === DEFAULT_FX ? CLASSIC : ALL_FX.find((s) => s.id === id) ?? CLASSIC);

/** Whether an id names an effect that exists, for this rarity. */
export const fxExists = (rarityId, id) => id === DEFAULT_FX || (FX_BY_RARITY[rarityId] ?? []).some((s) => s.id === id);
