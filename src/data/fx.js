/*
 * CARD EFFECTS
 *
 * Every rarity ships with its own bespoke treatment, drawn tier by tier: that
 * is `classic`, and it is what a card wears until its owner says otherwise.
 *
 * The rest are the alternates, bought with Ink in the Atelier, and none of
 * them is new. Two boards were built and shown: three executions for each of
 * the eight tiers, and five more for Prismatic. One per tier was picked and
 * became that tier's own drawing, which is the `classic` above. The twenty-one
 * that were passed over are these, kept exactly as they were drawn, for the
 * tier they were drawn for. That is why there are two for most tiers and seven
 * for Prismatic: it is what the boards held, not a number chosen afterwards.
 *
 * Their CSS lives in styles/cards.css under [data-fx]. Special sits outside
 * all of this and always wears its own.
 */

const s = (id, en, fr, noteEn, noteFr) => ({ id, name: { en, fr }, note: { en: noteEn, fr: noteFr } });

export const CLASSIC = s('classic', 'Classic', 'Classique', 'The treatment drawn for this tier.', 'Le traitement dessiné pour ce palier.');

export const FX_BY_RARITY = {
  common: [
    s('cardstock', 'Cardstock', 'Carton', 'A matte grey plate with a paper grain. Nothing moves, nothing shines.', 'Une plaque grise mate au grain de papier. Rien ne bouge, rien ne brille.'),
    s('slate', 'Slate', 'Ardoise', 'Dark slate with a fine linen weave and a double keyline frame.', 'Ardoise sombre au tissage de lin fin, dans un cadre à double filet.')
  ],
  uncommon: [
    s('runner', 'Runner', 'Coureur', 'A soft green pulse travelling around the border on a faint constant ring.', 'Une douce impulsion verte qui fait le tour du bord sur un anneau constant.'),
    s('ripple', 'Ripple', 'Ondulation', 'A diagonal green wave sweeping corner to corner; the base wash breathes with it.', 'Une vague verte en diagonale, d’un coin à l’autre ; le fond respire avec elle.')
  ],
  rare: [
    s('glass', 'Glass', 'Verre', 'A prismatic band drifting across the face. Tap the card and the title flares blue.', 'Une bande prismatique qui dérive sur la face. Touchez la carte : le titre s’embrase en bleu.'),
    s('prism', 'Prism', 'Prisme', 'Diagonal micro-lines carrying a slow rainbow. A tap blooms a blue pulse behind the title.', 'De fines lignes diagonales portant un arc-en-ciel lent. Un appui fait éclore une pulsation bleue derrière le titre.')
  ],
  epic: [
    s('nebula', 'Nebula', 'Nébuleuse', 'Purple and pink clouds drifting over a star field, the art floating deeper on the tilt.', 'Des nuages violets et roses au-dessus d’un champ d’étoiles, l’image flottant plus profond à l’inclinaison.'),
    s('deepspace', 'Deep Space', 'Espace profond', 'A slowly turning galaxy with two twinkling star layers, and the deepest parallax.', 'Une galaxie qui tourne lentement, deux couches d’étoiles scintillantes, et la plus forte parallaxe.')
  ],
  legendary: [
    s('classicfoil', 'Classic Foil', 'Feuille d’or', 'A wide gold foil ring whose highlight follows the light. Fine sparks rise past the frame.', 'Un large anneau de feuille d’or dont l’éclat suit la lumière. De fines étincelles montent le long du cadre.'),
    s('ornate', 'Ornate', 'Ouvragé', 'Engraved foil with filigree corners, gold dust rising, a warmer plate and a gold title.', 'Une feuille gravée aux coins en filigrane, poussière d’or qui monte, plaque plus chaude et titre doré.')
  ],
  mythic: [
    s('tear', 'Tear', 'Déchirure', 'Calm, then a burst: the border tears, art and text split red and cyan, a red flash resets it.', 'Le calme, puis une rupture : le bord se déchire, image et texte se dédoublent en rouge et cyan, un éclair rouge remet tout en place.'),
    s('static', 'Static', 'Neige', 'A dashed unstable border, scanlines and a rolling band, with two block-glitch bursts.', 'Un bord instable en pointillés, des lignes de balayage et une bande qui roule, avec deux ruptures en blocs.')
  ],
  exotic: [
    s('laseretch', 'Laser Etch', 'Gravure laser', 'Circuit traces etched into the plate with pulsing nodes, cyan art, a laser head running the frame.', 'Des pistes de circuit gravées dans la plaque, des nœuds qui pulsent, une image cyan, une tête laser qui parcourt le cadre.'),
    s('projection', 'Projection', 'Projection', 'The most translucent: four corner emitters, code running sideways, a refresh bar and a flickering image.', 'La plus translucide : quatre émetteurs aux coins, du code qui défile de côté, une barre de rafraîchissement et une image qui vacille.')
  ],
  prismatic: [
    s('marble', 'White Marble', 'Marbre blanc', 'White marble with grey and gold veins; a gold glow travels along the circuit lattice.', 'Un marbre blanc veiné de gris et d’or ; une lueur dorée parcourt le réseau de circuits.'),
    s('parchment', 'Parchment', 'Parchemin', 'Aged parchment with a slowly turning mandala, filigree corners and circuits waking below.', 'Un parchemin vieilli, un mandala qui tourne lentement, des coins en filigrane et des circuits qui s’éveillent en dessous.'),
    s('ivory', 'Ivory Relic', 'Relique d’ivoire', 'An ivory plate in a fat gold frame stamped with runes that light in sequence.', 'Une plaque d’ivoire dans un large cadre doré frappé de runes qui s’allument l’une après l’autre.'),
    s('holofoil', 'Holo Foil', 'Holo', 'The trading-card rainbow: dense spectrum bands sliding with the tilt over charcoal foil and glitter.', 'L’arc-en-ciel des cartes à collectionner : des bandes spectrales denses qui glissent à l’inclinaison sur une feuille anthracite pailletée.'),
    s('oilslick', 'Oil Slick', 'Irisation', 'Thin-film iridescence on black gloss, with interference rings that follow the light.', 'Une irisation en couche mince sur un noir laqué, avec des anneaux d’interférence qui suivent la lumière.'),
    s('cutcrystal', 'Cut Crystal', 'Cristal taillé', 'A faceted gem plate, every facet its own hue; the streak lights them one by one.', 'Une plaque de gemme à facettes, chacune sa teinte ; le trait de lumière les allume une à une.'),
    s('spectrumbeam', 'Spectrum Beam', 'Faisceau', 'Black glass under drifting caustics. A white beam fans into the full spectrum as it sweeps.', 'Un verre noir sous des caustiques mouvantes. Un faisceau blanc s’ouvre en spectre complet à son passage.')
  ]
};

export const DEFAULT_FX = CLASSIC.id;

export const ALL_FX = [CLASSIC, ...Object.values(FX_BY_RARITY).flat()];

export const fxForRarity = (rarityId) => [CLASSIC, ...(FX_BY_RARITY[rarityId] ?? [])];

export const fxById = (id) => ALL_FX.find((f) => f.id === id) ?? CLASSIC;

export const fxExists = (rarityId, id) => (FX_BY_RARITY[rarityId] ?? []).some((f) => f.id === id);
