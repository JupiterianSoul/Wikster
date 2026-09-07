/*
 * CARD EFFECTS
 *
 * Every rarity ships with its own bespoke treatment, drawn tier by tier: that
 * is `classic`, and it is what a card wears until its owner says otherwise.
 *
 * The rest are the alternates, bought with Ink in the Atelier, and none of
 * them is new. A board was built and shown first: ten treatments for each of
 * the eight tiers, eighty in all, every one drawn as a real card at real size
 * on the app's own layers. Thirty-nine were chosen, and those thirty-nine are
 * here, carried across exactly as they were drawn, for the tier they were
 * drawn for. The counts are what was picked, not a number settled beforehand.
 *
 * Their CSS lives in styles/cards.css under [data-fx], where a treatment
 * restyles the whole face: the plate, the frame, the ring, the artwork's mount,
 * the title's colour and the tag. What it never does is paint on the article's
 * picture, which sits above every effect layer. Special sits outside all of
 * this and always wears its own.
 */

const s = (id, en, fr, noteEn, noteFr) => ({ id, name: { en, fr }, note: { en: noteEn, fr: noteFr } });

export const CLASSIC = s('classic', 'Classic', 'Classique', 'The treatment drawn for this tier.', 'Le traitement dessiné pour ce palier.');

export const FX_BY_RARITY = {
  common: [
    s('newsprint', 'Newsprint', 'Papier journal', 'A coarse halftone screen slightly out of register, on paper that has gone yellow.', 'Une trame grossière légèrement hors repérage, sur un papier qui a jauni.'),
    s('graphpaper', 'Graph Paper', 'Papier millimétré', 'Pale squares with a heavier rule every fifth, and a graphite smudge that shifts.', 'De pâles carreaux, un trait plus fort tous les cinq, et une bavure de graphite qui se déplace.'),
    s('carboncopy', 'Carbon Copy', 'Papier carbone', 'The second sheet: everything in smudged violet transfer, drifting as it sets.', 'La seconde feuille : tout en report violet estompé, qui dérive en se fixant.'),
    s('photocopy', 'Photocopy', 'Photocopie', 'Run through the machine one time too many, with the scan bar still passing down it.', 'Passée une fois de trop dans la machine, la barre de lecture la parcourant encore.'),
    s('indexcard', 'Index Card', 'Fiche bristol', 'White stock with a red header rule and one dog-eared corner that lifts and settles.', 'Un bristol blanc, un filet rouge en tête, et un coin corné qui se soulève et retombe.')
  ],
  uncommon: [
    s('moss', 'Moss', 'Mousse', 'Velvet clumps with a fuzzy silhouette, damp and slowly brightening.', 'Des touffes de velours à la silhouette floue, humides, qui s’éclaircissent lentement.'),
    s('ivyborder', 'Ivy Border', 'Lierre', 'A vine that has taken the frame, its leaves nodding in the draught.', 'Une vigne qui a pris le cadre, ses feuilles dodelinant dans le courant d’air.'),
    s('chlorophyll', 'Chlorophyll', 'Chlorophylle', 'Leaf tissue on a lightbox, the cell walls glowing where the sun gets through.', 'Du tissu foliaire sur une table lumineuse, les parois brillant là où le soleil passe.'),
    s('algaebloom', 'Algae Bloom', 'Efflorescence', 'Green clouds turning in still water, with bubbles finding the surface.', 'Des nuages verts qui tournent en eau calme, des bulles trouvant la surface.'),
    s('pollen', 'Pollen', 'Pollen', 'Motes caught in one shaft of afternoon light, going nowhere in particular.', 'Des poussières prises dans un rai de lumière d’après-midi, sans aller nulle part.')
  ],
  rare: [
    s('sapphirecut', 'Sapphire Cut', 'Taille saphir', 'A gem’s facets, each one catching the light at its own moment.', 'Les facettes d’une gemme, chacune accrochant la lumière à son propre moment.'),
    s('deepcurrent', 'Deep Current', 'Courant profond', 'Caustics on the floor of somewhere very far down, with a slow swell.', 'Des caustiques au fond de quelque part de très profond, avec une houle lente.'),
    s('neonsign', 'Neon Sign', 'Néon', 'Bent tube and cold cathode buzz, with one bad contact in the corner.', 'Un tube plié, le bourdonnement d’une cathode froide, un mauvais contact dans le coin.'),
    s('cobaltsilk', 'Cobalt Silk', 'Soie cobalt', 'A woven sheen that changes its mind as the card turns.', 'Un lustre tissé qui change d’avis quand la carte tourne.')
  ],
  epic: [
    s('eventhorizon', 'Event Horizon', 'Horizon des événements', 'The disc, the lensing ring, and the part where nothing comes back.', 'Le disque, l’anneau de lentille, et la part d’où rien ne revient.'),
    s('violetstorm', 'Violet Storm', 'Orage violet', 'Thunderheads stacked to the top of the card, lit from inside.', 'Des cumulonimbus empilés jusqu’en haut de la carte, éclairés de l’intérieur.'),
    s('geode', 'Amethyst Geode', 'Géode', 'The inside of a rock that turned out to be worth opening.', 'L’intérieur d’une pierre qui valait la peine d’être ouverte.'),
    s('starless', 'Starless', 'Sans étoiles', 'No stars at all, only dust lanes and one thing burning behind them.', 'Aucune étoile, seulement des voiles de poussière et une chose qui brûle derrière.'),
    s('orchid', 'Orchid', 'Orchidée', 'Velvet petals, a throat of deeper purple, and pollen dust on the air.', 'Des pétales de velours, une gorge d’un violet plus profond, du pollen dans l’air.')
  ],
  legendary: [
    s('filigree', 'Filigree', 'Filigrane', 'Wire scrollwork, soldered corner to corner, catching a slow light.', 'Des volutes de fil soudées d’un coin à l’autre, accrochant une lumière lente.'),
    s('moltengold', 'Molten Gold', 'Or en fusion', 'Not yet set. It is still moving, and it is still hot.', 'Pas encore pris. Il bouge encore, et il est encore brûlant.'),
    s('hammered', 'Hammered', 'Martelé', 'Planished by hand, every dent holding its own small piece of the sun.', 'Planée à la main, chaque creux tenant son petit morceau de soleil.'),
    s('coronation', 'Coronation', 'Couronnement', 'Ermine ground, a heraldic diaper, and one gold band across the plate.', 'Un fond d’hermine, un semé héraldique, et une bande d’or en travers de la plaque.'),
    s('ingot', 'Ingot', 'Lingot', 'No ornament: weight, a stamped face and a bevel that says nothing bends here.', 'Aucun ornement : du poids, une face frappée, un biseau qui dit que rien ne plie ici.')
  ],
  mythic: [
    s('corrupted', 'Corrupted', 'Corrompue', 'The file is damaged. Blocks of it are being read from the wrong place.', 'Le fichier est endommagé. Des blocs sont lus au mauvais endroit.'),
    s('emberstorm', 'Ember Storm', 'Pluie de braises', 'The fire is out, and it is still throwing pieces of itself upward.', 'Le feu est éteint, et il projette encore des morceaux de lui-même vers le haut.'),
    s('meltdown', 'Meltdown', 'Fusion', 'Hazard stripes, a warning nobody is left to read, and an alarm still lit.', 'Des bandes de danger, un avertissement que plus personne ne lit, une alarme allumée.'),
    s('furnacegate', 'Furnace Gate', 'Porte du four', 'Something is open that should be shut, and the air above it is bending.', 'Quelque chose est ouvert qui devrait être fermé, et l’air au-dessus se tord.'),
    s('predator', 'Predator', 'Prédateur', 'Seen in heat, where the cold parts of the world stop existing.', 'Vue en chaleur, là où les parts froides du monde cessent d’exister.')
  ],
  exotic: [
    s('terminal', 'Terminal', 'Terminal', 'A session that has been open a long time, still printing.', 'Une session ouverte depuis longtemps, qui écrit encore.'),
    s('gridrunner', 'Grid Runner', 'Grille', 'A floor that goes on forever and is coming toward you at speed.', 'Un sol qui n’en finit pas et qui vient vers vous à toute allure.'),
    s('schematic', 'Schematic', 'Schéma', 'Dimensioned, tolerance noted, drawn by somebody who checks twice.', 'Coté, tolérance indiquée, dessiné par quelqu’un qui vérifie deux fois.'),
    s('datastream', 'Datastream', 'Flux', 'Columns of it, falling faster than anyone is reading.', 'Des colonnes qui tombent plus vite que personne ne lit.'),
    s('oscilloscope', 'Oscilloscope', 'Oscilloscope', 'One channel, one trace, and a graticule to argue with.', 'Une voie, une trace, et un réticule avec qui discuter.')
  ],
  prismatic: [
    s('auroraveil', 'Aurora Veil', 'Voile d’aurore', 'Curtains hanging off the magnetic field, folding and refolding all night.', 'Des rideaux suspendus au champ magnétique, qui se plient et se replient toute la nuit.'),
    s('diffraction', 'Diffraction', 'Diffraction', 'One ruled grating, and white light doing what it always wanted to.', 'Un réseau gravé, et la lumière blanche faisant ce qu’elle a toujours voulu.'),
    s('refraction', 'Refraction', 'Réfraction', 'One beam in at the top, seven colours out at the bottom, no negotiation.', 'Un faisceau en haut, sept couleurs en bas, sans négociation.'),
    s('spectralrain', 'Spectral Rain', 'Pluie spectrale', 'It falls in colour, and each streak leaves the next one behind.', 'Elle tombe en couleur, et chaque traînée laisse la suivante derrière.'),
    s('supernova', 'Supernova', 'Supernova', 'Everything the star had, released across the whole spectrum at once.', 'Tout ce que l’étoile avait, libéré d’un coup sur tout le spectre.')
  ]
};

export const DEFAULT_FX = CLASSIC.id;

export const ALL_FX = [CLASSIC, ...Object.values(FX_BY_RARITY).flat()];

export const fxForRarity = (rarityId) => [CLASSIC, ...(FX_BY_RARITY[rarityId] ?? [])];

export const fxById = (id) => ALL_FX.find((f) => f.id === id) ?? CLASSIC;

export const fxExists = (rarityId, id) => (FX_BY_RARITY[rarityId] ?? []).some((f) => f.id === id);
