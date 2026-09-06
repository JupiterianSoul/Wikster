/**
 * LEVEL FRAMES
 * ============================================================================
 * A frame is the wrapper a level wears: around the level ring in the app bar,
 * around the big ring on the profile, and around your picture everywhere
 * friends can see it. One new frame every 10 levels, from level 10 to the
 * level cap at 500 - fifty tiers - in five styles the player picks between
 * on the Customization screen.
 *
 * Everything here is drawn, not shipped: each style is a generator taking a
 * tier (1..50) and returning SVG. Tiers 1..10 reproduce the design sheet the
 * styles were chosen from; past that, each style keeps escalating with the
 * same vocabulary. All of it is deterministic - the same tier always draws
 * the same frame, because a frame is a rank, not a decoration roll.
 *
 * Geometry: the viewBox is -58..58 and the wrapped circle is assumed to sit
 * at radius 26. CSS places the overlay at 223% of the circle's size so the
 * drawn ring lands exactly on the element's edge (116 / 52 = 2.23).
 */

/*
 * `minLevel` is the level that opens a style. Metal is the one every player
 * starts in, so it opens at 1; the rest are earned, and the gaps widen as they
 * go so the last of them is a real destination rather than a Tuesday.
 *
 * `code` marks a style no level can reach: it arrives with a secret code and
 * is hidden from the picker entirely until that code is redeemed, the same way
 * the special themes and badges are. `ink` marks one the Atelier sells: it
 * is not in the picker until bought, and worn from level 1 once it is.
 */
export const FRAME_STYLES = [
  { id: 'metal',   minLevel: 1,   name: { en: 'Metal Ages',    fr: 'Âges du métal' } },
  { id: 'circuit', minLevel: 15,  name: { en: 'Neon Circuit',  fr: 'Circuit néon' } },
  { id: 'orbit',   minLevel: 35,  name: { en: 'Cosmic Orbit',  fr: 'Orbite cosmique' } },
  { id: 'crest',   minLevel: 60,  name: { en: 'Foil Crest',    fr: 'Blason métallisé' } },
  { id: 'crystal', minLevel: 90,  name: { en: 'Crystal Bloom', fr: 'Floraison de cristal' } },
  { id: 'aurora',  minLevel: 125, name: { en: 'Aurora Veil',   fr: 'Voile aurore' } },
  { id: 'runic',   minLevel: 160, name: { en: 'Runic Seal',    fr: 'Sceau runique' } },
  { id: 'solar',   minLevel: 200, name: { en: 'Solar Crown',   fr: 'Couronne solaire' } },
  { id: 'singularity', minLevel: 500, name: { en: 'Singularity', fr: 'Singularité' } },
  { id: 'god',     minLevel: Infinity, code: 'creator',
    name: { en: 'Apotheosis', fr: 'Apothéose' } },
  { id: 'hellfire', minLevel: Infinity, code: 'hellfire',
    name: { en: 'Hellfire', fr: 'Feu de l’enfer' } },
  // The Atelier's ten: bought with Ink, worn from level 1 once bought.
  { id: 'ivy',      minLevel: 1, ink: true, name: { en: 'Living Ivy',     fr: 'Lierre vivant' } },
  { id: 'gears',    minLevel: 1, ink: true, name: { en: 'Clockwork',      fr: 'Horlogerie' } },
  { id: 'tide',     minLevel: 1, ink: true, name: { en: 'Tidewater',      fr: 'Marée' } },
  { id: 'storm',    minLevel: 1, ink: true, name: { en: 'Stormcell',      fr: 'Cellule orageuse' } },
  { id: 'honey',    minLevel: 1, ink: true, name: { en: 'Honeycomb',      fr: 'Rayon de miel' } },
  { id: 'inkwell',  minLevel: 1, ink: true, name: { en: 'Inkwell',        fr: 'Encrier' } },
  { id: 'origami',  minLevel: 1, ink: true, name: { en: 'Paper Fold',     fr: 'Pli de papier' } },
  { id: 'lanterns', minLevel: 1, ink: true, name: { en: 'Paper Lanterns', fr: 'Lanternes de papier' } },
  { id: 'stained',  minLevel: 1, ink: true, name: { en: 'Stained Glass',  fr: 'Vitrail' } },
  { id: 'comet',    minLevel: 1, ink: true, name: { en: 'Comet Trail',    fr: 'Traînée de comète' } }
];

/** The styles the Atelier sells, in the order it shelves them. */
export const INK_FRAMES = FRAME_STYLES.filter((s) => s.ink);

/** Has this player reached the level a style asks for? */
export const frameUnlocked = (style, level) => (Number(level) || 1) >= (style?.minLevel ?? 1);
export const DEFAULT_FRAME_STYLE = 'metal';
export const frameStyleById = (id) =>
  FRAME_STYLES.find((s) => s.id === id) ?? FRAME_STYLES[0];

/**
 * Which frame a level wears: the first tier from level 1, so an equipped
 * style is always visible, then one tier more every ten levels up to the
 * fiftieth at 500. A frame the player picked and cannot see is a bug, not a
 * reward waiting at level 10.
 */
export const frameTier = (level) =>
  Math.max(1, Math.min(50, Math.floor((Number(level) || 1) / 10)));

/* --- small helpers --------------------------------------------------------- */

const TAU = Math.PI / 180;
const P = (r, deg) => `${(r * Math.cos(deg * TAU)).toFixed(2)},${(r * Math.sin(deg * TAU)).toFixed(2)}`;
/** Deterministic jitter in [0,1): a frame is a rank, not a dice roll. */
const jit = (i, salt = 0) => (((i + 1) * 73 + salt * 131) % 97) / 97;

const grad = (id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
  stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</linearGradient>';

const glowFilter = (id, dev = 2) =>
  `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="${dev}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const arc = (r, a0, a1, attrs) =>
  `<path d="M ${P(r, a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(r, a1)}" fill="none" ${attrs}/>`;

const diamond = (cx, cy, r) =>
  `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

/* --- A. metal ages ---------------------------------------------------------
 * Ten materials climb copper to diamond over the first hundred levels; the
 * forty tiers past them work through gemstones and stranger alloys. */

const METALS = [
  ['#8a5a2b', '#c98f4e', '#5c3a18'], ['#9c6a1f', '#e0a33e', '#6b4310'],
  ['#6f7683', '#aab3c2', '#474d59'], ['#9aa5b5', '#dfe7f2', '#5f6875'],
  ['#b28414', '#f2ca4f', '#7a570a'], ['#c2922a', '#ffe08a', '#8a6410'],
  ['#7f9ba8', '#d5ecf5', '#4d626d'], ['#8fa7c9', '#e8f2ff', '#54678a'],
  ['#7e6bd6', '#c9baff', '#4a3d8f'], ['#4fc3d9', '#c5f6ff', '#22758a']
];
const METALS_X = [
  ['#b3273b', '#ff7d8a', '#701020'], ['#1f9d55', '#7df0a8', '#0c5a2e'],
  ['#2b5fd9', '#8ab8ff', '#173a8a'], ['#7e3fd0', '#c99bff', '#4a1f8a'],
  ['#525a6e', '#a8b3c9', '#23283a'], ['#d97b16', '#ffd27d', '#8a4a08'],
  ['#4fa8c9', '#c5f0ff', '#22637a'], ['#8a7ad0', '#e0d5ff', '#4a3f8a'],
  ['#c2a22a', '#fff0a8', '#8a6c10'], ['#6bd0d9', '#eafcff', '#2a7a86']
];

function drawMetal(t, uid) {
  const [mid, hi, lo] = t < 10 ? METALS[t] : METALS_X[Math.min(Math.floor((t - 10) / 4), 9)];
  const g = `${uid}m`;
  const defs = grad(g, [[0, hi], [0.55, mid], [1, lo]]);
  const metal = `url(#${g})`;

  const studCount = t < 2 ? 0 : Math.min(4 + t, 14);
  const studs = Array.from({ length: studCount }, (_, i) => {
    const a = -90 + i * 360 / studCount;
    return `<circle cx="${P(33.5, a).split(',')[0]}" cy="${P(33.5, a).split(',')[1]}" r="${t >= 6 ? 2.2 : 1.7}" fill="${hi}" stroke="${lo}" stroke-width=".7"/>`;
  }).join('');

  const gem = t >= 4 ? `<polygon points="${diamond(0, -33.5, t >= 8 ? 5.5 : 4.4)}" fill="${t >= 8 ? '#9ef3ff' : '#ff5f6b'}" stroke="${lo}" stroke-width="1"/>` : '';
  const wings = t >= 7 ? `<path d="M -31 14 Q -44 8 -45 -6 L -38 -2 Q -40 6 -31 10 Z" fill="${metal}" stroke="${lo}" stroke-width=".8"/>
    <path d="M 31 14 Q 44 8 45 -6 L 38 -2 Q 40 6 31 10 Z" fill="${metal}" stroke="${lo}" stroke-width=".8"/>` : '';
  const outer = t >= 14 ? `<circle cx="0" cy="0" r="${40 + Math.min((t - 14) * 0.1, 3)}" fill="none" stroke="${mid}" stroke-width="1.2" stroke-opacity=".8"/>` : '';
  const sideGems = t >= 24 ? [-38, -142].map((a) =>
    `<polygon points="${diamond(+P(37, a).split(',')[0], +P(37, a).split(',')[1], 3.2)}" fill="${hi}" stroke="${lo}" stroke-width=".8"/>`).join('') : '';
  const ticks = t >= 34 ? Array.from({ length: 16 }, (_, i) => {
    const a = -90 + i * 22.5;
    return `<line x1="${P(43.5, a)}" x2="${P(46.5, a)}" y1="" y2="" stroke="${hi}" stroke-width="1"/>`
      .replace(`x1="${P(43.5, a)}"`, `x1="${P(43.5, a).split(',')[0]}" y1="${P(43.5, a).split(',')[1]}"`)
      .replace(`x2="${P(46.5, a)}"`, `x2="${P(46.5, a).split(',')[0]}" y2="${P(46.5, a).split(',')[1]}"`);
  }).join('') : '';
  const halo = t >= 44 ? `<circle cx="0" cy="0" r="47" fill="none" stroke="${hi}" stroke-width=".8" stroke-opacity=".5"/>` : '';

  return `<defs>${defs}</defs>${outer}${halo}
    <circle cx="0" cy="0" r="33.5" fill="none" stroke="${metal}" stroke-width="${5 + Math.min(t, 12) * 0.28}"/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="${lo}" stroke-width="1"/>
    ${wings}${studs}${sideGems}${ticks}${gem}`;
}

/* --- C. neon circuit -------------------------------------------------------
 * Ten segments light one per rank for the first hundred levels; the decades
 * after keep the full ring and add instrumentation around it. */

const CIRCUIT_HUES = ['#39d0ff', '#39d0ff', '#4fc7ff', '#7db2ff', '#a48cff',
  '#c76bff', '#ef5fd8', '#ff5f9e', '#ffb04f', '#ffe14f'];

function drawCircuit(t, uid) {
  const g = `${uid}c`;
  const col = CIRCUIT_HUES[t % 10];
  const stage = Math.floor(t / 10);
  const defs = glowFilter(g, 2);
  const lit = t < 10 ? t + 1 : 10;

  const segs = Array.from({ length: 10 }, (_, i) => {
    const on = i < lit;
    return arc(33, -90 + i * 36 + 3, -90 + (i + 1) * 36 - 3,
      `stroke="${on ? col : '#232a4d'}" stroke-width="4.6" stroke-linecap="round" ${on ? `filter="url(#${g})"` : ''}`);
  }).join('');

  const ticks = stage >= 1 ? Array.from({ length: 20 }, (_, i) => {
    const a = -90 + i * 18;
    const [x1, y1] = P(39.5, a).split(','), [x2, y2] = P(42, a).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width=".9" stroke-opacity=".7"/>`;
  }).join('') : '';
  const outerRing = stage >= 2 ? `<circle cx="0" cy="0" r="44.5" fill="none" stroke="${col}" stroke-width="1" stroke-opacity=".55"/>` : '';
  const nodes = stage >= 3 ? [45, 135, 225, 315].map((a) => {
    const [x, y] = P(44.5, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="2" fill="${col}" filter="url(#${g})"/>`;
  }).join('') : '';
  const core = stage >= 4 ? `<circle cx="0" cy="0" r="28.5" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity=".85" filter="url(#${g})"/>` : '';
  const crownNode = t >= 9 ? `<circle cx="0" cy="-33" r="3" fill="#ffffff" filter="url(#${g})"/>` : '';

  return `<defs>${defs}</defs>
    <circle cx="0" cy="0" r="33" fill="none" stroke="#161b38" stroke-width="6.5"/>
    ${segs}${ticks}${outerRing}${nodes}${core}${crownNode}`;
}

/* --- D. cosmic orbit -------------------------------------------------------
 * Orbits, moons and stars accumulate; comets arrive late; the deep tiers
 * pick up a nebula and one blazing star. */

const ORBIT_INKS = ['#5c6bb0', '#5c6bb0', '#6a77c2', '#7a83d4', '#8a8fe6',
  '#9a9bf0', '#ab9df5', '#c0a8fa', '#d5b4ff', '#ecc8ff'];
const ORBIT_INKS_X = ['#f3d2ff', '#f9dcff', '#ffe6f8', '#fff0ea', '#fff5da',
  '#fff9d0', '#fffbda', '#fffde4', '#fffff0', '#ffffff'];

function drawOrbit(t, uid) {
  const g = `${uid}o`;
  const ink = t < 10 ? ORBIT_INKS[t] : ORBIT_INKS_X[Math.min(Math.floor((t - 10) / 4), 9)];
  const defs = glowFilter(g, 1.6);
  const orbits = Math.min(1 + Math.floor(t / 5), 5);

  const nebula = t >= 16 ? `<circle cx="0" cy="0" r="40" fill="none" stroke="#8a5fd0" stroke-width="10" stroke-opacity=".12"/>` : '';
  const rings = Array.from({ length: orbits }, (_, i) =>
    `<ellipse cx="0" cy="0" rx="${34 + i * 3.2}" ry="${30 + i * 2.1}" fill="none" stroke="${ink}" stroke-width="1.2"
      transform="rotate(${-18 + i * 16})"/>`).join('');
  const moons = Array.from({ length: Math.min(1 + t, 14) }, (_, i) => {
    const a = (i * 137 + 40);
    const rx = 34 + (i % orbits) * 3.2, ry = 30 + (i % orbits) * 2.1;
    const x = rx * Math.cos(a * TAU), y = ry * Math.sin(a * TAU);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.6 + (i % 3) * 0.5}" fill="#dfe7ff"/>`;
  }).join('');
  const sparks = t >= 4 ? Array.from({ length: Math.min(t, 20) }, (_, i) => {
    const a = i * 61, r = 41 + (i % 3) * 3;
    const [x, y] = P(r, a).split(',');
    return `<circle cx="${x}" cy="${y}" r=".9" fill="#aebdf5"/>`;
  }).join('') : '';
  const comet = t >= 8 ? `<g filter="url(#${g})">
      <path d="M 26 -30 Q 38 -38 50 -42" stroke="#9ef3ff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="26" cy="-30" r="3" fill="#e6fbff"/></g>` : '';
  const comet2 = t >= 26 ? `<g filter="url(#${g})">
      <path d="M -26 30 Q -38 38 -50 42" stroke="#ffb8f0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="-26" cy="30" r="2.4" fill="#ffe6fb"/></g>` : '';
  const star = t >= 40 ? `<g filter="url(#${g})">
      <line x1="0" y1="-52" x2="0" y2="-40" stroke="#fff6c9" stroke-width="1.2"/>
      <line x1="-6" y1="-46" x2="6" y2="-46" stroke="#fff6c9" stroke-width="1.2"/>
      <circle cx="0" cy="-46" r="2.4" fill="#fffdf0"/></g>` : '';

  return `<defs>${defs}</defs>${nebula}${rings}${moons}${sparks}${comet}${comet2}${star}`;
}

/* --- E. foil crest ---------------------------------------------------------
 * Chevron wings multiply around the ring; the foil works through metals,
 * then stays prismatic and picks up a crown, gems and a star. */

const CREST_FOILS = [
  ['#d09a5c', '#7a5426'], ['#d09a5c', '#7a5426'], ['#c9c9d4', '#767b87'],
  ['#d9dee8', '#8d94a3'], ['#f2ca4f', '#8a6410'], ['#ffe08a', '#9a7524'],
  ['#f2ca4f', '#8a6410'], ['#ffe08a', '#9a7524']
];
const CREST_PRISMS = [
  ['#8ff2ff', '#c99bff', '#ffd08a'], ['#ffb8f0', '#ffd08a', '#8ff2b8'],
  ['#c5ff8f', '#8ff2ff', '#ffb8d0'], ['#ffd08a', '#ff8fa8', '#c99bff'],
  ['#8fb8ff', '#8ff2e0', '#ffe08a'], ['#e0c5ff', '#ffc5e8', '#c5f6ff'],
  ['#fff0a8', '#8ff2ff', '#e0a8ff'], ['#ffffff', '#c5f6ff', '#ffe6fb']
];

function drawCrest(t, uid) {
  const g = `${uid}f`;
  const prism = t >= 8;
  const set = prism ? CREST_PRISMS[t < 10 ? 0 : Math.min(1 + Math.floor((t - 10) / 6), 7)] : CREST_FOILS[t];
  const defs = prism
    ? grad(g, [[0, set[0]], [0.5, set[1]], [1, set[2]]], { x2: 1, y2: 1 })
    : grad(g, [[0, set[0]], [1, set[1]]]);
  const foil = `url(#${g})`;

  const layers = t < 10 ? 1 + Math.floor(t / 3) : Math.min(4 + Math.floor((t - 10) / 13), 6);
  const wing = (side) => Array.from({ length: layers }, (_, i) => {
    const o = i * 9;
    return `<path d="M ${side * (30 + o)} 12 L ${side * (44 + o)} ${2 - i * 3} L ${side * (36 + o)} ${-2 - i * 2} L ${side * (46 + o)} ${-14 - i * 3} L ${side * (32 + o)} ${-10 - i * 2} Z"
      fill="${foil}" stroke="#3a2c10" stroke-width=".8" opacity="${1 - i * 0.14}"/>`;
  }).join('');
  const crown = t >= 5 ? `<path d="M -12 -32 L -6 -40 L 0 -33 L 6 -40 L 12 -32 Z" fill="${foil}" stroke="#3a2c10" stroke-width=".8"/>` : '';
  const gem = t >= 9 ? `<circle cx="0" cy="-36" r="2.6" fill="#9ef3ff" stroke="#1c5e6b" stroke-width=".8"/>` : '';
  const twinGems = t >= 22 ? `<circle cx="-10" cy="-35" r="1.8" fill="#ffb8f0" stroke="#6b1c50" stroke-width=".7"/>
    <circle cx="10" cy="-35" r="1.8" fill="#ffb8f0" stroke="#6b1c50" stroke-width=".7"/>` : '';
  const star = t >= 34 ? `<polygon points="0,-49 1.8,-44.4 6.6,-44.4 2.8,-41.6 4.2,-37 0,-39.8 -4.2,-37 -2.8,-41.6 -6.6,-44.4 -1.8,-44.4"
    fill="#fff0a8" stroke="#8a6410" stroke-width=".6"/>` : '';
  const radiance = t >= 46 ? Array.from({ length: 7 }, (_, i) => {
    const a = -138 + i * 16;
    const [x1, y1] = P(38, a).split(','), [x2, y2] = P(50, a).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${set[i % 3]}" stroke-width="1" stroke-opacity=".6"/>`;
  }).join('') : '';

  return `<defs>${defs}</defs>${radiance}
    <circle cx="0" cy="0" r="31.5" fill="none" stroke="${foil}" stroke-width="4"/>
    ${wing(1)}${wing(-1)}${crown}${twinGems}${gem}${star}`;
}

/* --- F. crystal bloom (new for the frame rework) ---------------------------
 * Shards grow around the ring like frost on a window: a few teal splinters
 * at first, a full corona later, working through jade and amethyst to a
 * prismatic bloom where every shard carries its own colour. */

const CRYSTAL_SETS = [
  ['#3ec9c9', '#b8fff4', '#1f7a7a'], ['#3eb8d9', '#c5f0ff', '#1f6a8a'],
  ['#3ec98f', '#b8ffdc', '#1f7a4e'], ['#7a5fd0', '#d5c5ff', '#42308a'],
  ['#9a4fd0', '#e0c5ff', '#5a2a8a'], ['#c94fb8', '#ffc5f0', '#801f70'],
  ['#d94f7a', '#ffc5d8', '#8a1f42'], ['#d9924f', '#ffe0c5', '#8a541f'],
  null, // prismatic: per-shard colours
  ['#dfe7f2', '#ffffff', '#8a97a8']
];
const CRYSTAL_PRISM = [
  ['#3ec9c9', '#b8fff4', '#1f7a7a'], ['#7a5fd0', '#d5c5ff', '#42308a'],
  ['#c94fb8', '#ffc5f0', '#801f70'], ['#d9924f', '#ffe0c5', '#8a541f'],
  ['#3ec98f', '#b8ffdc', '#1f7a4e']
];

function drawCrystal(t, uid) {
  const g = `${uid}x`;
  const setIndex = Math.min(Math.floor(t / 5), 9);
  const fixed = CRYSTAL_SETS[setIndex];
  const defs = glowFilter(g, 1.4);

  const count = Math.min(3 + t, 24);
  const shards = Array.from({ length: count }, (_, i) => {
    // Sprout from the bottom and climb both sides as the count grows.
    const side = i % 2 ? 1 : -1;
    const climb = Math.floor(i / 2) * (168 / Math.max(Math.ceil(count / 2) - 1, 1));
    const a = 90 + side * climb;
    const [mid, hi, lo] = fixed ?? CRYSTAL_PRISM[i % CRYSTAL_PRISM.length];
    const len = 9 + Math.min(t, 30) * 0.22 + jit(i, t) * 5 - (i % 3 === 0 ? 3 : 0);
    const w = 3 + jit(i, 7) * 1.6;
    const base = 28.5, tip = base + len;
    const [bx, by] = P(base, a).split(',').map(Number);
    const [tx2, ty2] = P(tip, a).split(',').map(Number);
    const px = -Math.sin(a * TAU), py = Math.cos(a * TAU);
    const m1 = base + len * 0.42;
    const [mx, my] = P(m1, a).split(',').map(Number);
    return `<polygon points="${bx + px * w},${by + py * w} ${mx + px * w * 1.25},${my + py * w * 1.25} ${tx2},${ty2} ${mx - px * w * 1.25},${my - py * w * 1.25} ${bx - px * w},${by - py * w}"
      fill="${mid}" stroke="${lo}" stroke-width=".8"/>
      <line x1="${mx}" y1="${my}" x2="${tx2}" y2="${ty2}" stroke="${hi}" stroke-width=".9" stroke-opacity=".9"/>`;
  }).join('');

  const ring = fixed ?? CRYSTAL_PRISM[0];
  const glints = t >= 28 ? Array.from({ length: Math.min(3 + Math.floor((t - 28) / 6), 6) }, (_, i) => {
    const a = 90 + (i % 2 ? 1 : -1) * (30 + i * 26);
    const [x, y] = P(44 + jit(i, 3) * 4, a).split(',');
    return `<g filter="url(#${g})" stroke="#ffffff" stroke-width="1"><line x1="${x}" y1="${+y - 3}" x2="${x}" y2="${+y + 3}"/><line x1="${+x - 3}" y1="${y}" x2="${+x + 3}" y2="${y}"/></g>`;
  }).join('') : '';
  const halo = t >= 45 ? `<circle cx="0" cy="0" r="47.5" fill="none" stroke="${ring[1]}" stroke-width=".8" stroke-opacity=".5"/>` : '';

  return `<defs>${defs}</defs>${halo}
    <circle cx="0" cy="0" r="29" fill="none" stroke="${ring[0]}" stroke-opacity=".55" stroke-width="2.4"/>
    ${shards}${glints}`;
}

/* --- the one public drawing call ------------------------------------------ */

/* --- AURORA VEIL: ribbons of light drawn round the ring -------------------- */
const AURORA_BANDS = [
  ['#7dd3fc', '#a78bfa'], ['#34d399', '#22d3ee'], ['#f472b6', '#a78bfa'],
  ['#fbbf24', '#f472b6'], ['#22d3ee', '#818cf8']
];

function drawAurora(t, uid) {
  const g = `${uid}a`;
  const bands = Math.min(2 + Math.floor(t / 6), 8);
  const defs = glowFilter(g, 2.2) + AURORA_BANDS.map(([a, b], i) =>
    `<linearGradient id="${uid}g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('');

  // Each ribbon is an arc of its own radius and sweep, leaning further out as
  // the tier climbs, so a high frame reads as a curtain rather than a circle.
  const ribbons = Array.from({ length: bands }, (_, i) => {
    const grad = `url(#${uid}g${i % AURORA_BANDS.length})`;
    const r = 33 + i * (1.6 + Math.min(t, 40) * 0.05) + jit(i, t) * 2;
    const span = 90 + jit(i, 5) * 120 + Math.min(t, 30) * 2;
    const from = -110 + i * 46 + jit(i, 9) * 40;
    const w = 2.4 + jit(i, 2) * 2.6 + Math.min(t, 30) * 0.05;
    return arc(r, from, from + span,
      `stroke="${grad}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-opacity="${(0.5 + jit(i, 4) * 0.4).toFixed(2)}"`);
  }).join('');

  const motes = t >= 20 ? Array.from({ length: Math.min(4 + Math.floor((t - 20) / 5), 12) }, (_, i) => {
    const [x, y] = P(30 + jit(i, 6) * 22, jit(i, 11) * 360).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(0.7 + jit(i, 8) * 1.1).toFixed(2)}" fill="#ffffff" fill-opacity=".8"/>`;
  }).join('') : '';

  return `<defs>${defs}</defs><g filter="url(#${g})">${ribbons}</g>${motes}`;
}

/* --- RUNIC SEAL: marks cut into a ring ------------------------------------ */
const RUNES = ['M-3,-4 L0,4 L3,-4', 'M-3,-4 L-3,4 M-3,0 L3,-3', 'M0,-4 L0,4 M-3,-1 L3,-1',
  'M-3,-4 L3,4 M3,-4 L-3,4', 'M-3,4 L0,-4 L3,4 M-2,1 L2,1', 'M-3,-4 L3,-4 L-3,4 L3,4'];

function drawRunic(t, uid) {
  const g = `${uid}r`;
  const ink = ['#c7d2fe', '#fde68a', '#a7f3d0', '#fecaca', '#e9d5ff'][Math.min(Math.floor(t / 10), 4)];
  const count = Math.min(4 + Math.floor(t / 2), 24);
  const r = 36;
  const marks = Array.from({ length: count }, (_, i) => {
    const a = (360 / count) * i - 90;
    const [x, y] = P(r, a).split(',');
    const path = RUNES[(i + Math.floor(t / 7)) % RUNES.length];
    return `<g transform="translate(${x},${y}) rotate(${(a + 90).toFixed(1)})">
      <path d="${path}" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }).join('');
  const rings = arc(30.5, 0, 359.9, `stroke="${ink}" stroke-width=".9" stroke-opacity=".55"`)
    + (t >= 12 ? arc(41.5, 0, 359.9, `stroke="${ink}" stroke-width=".7" stroke-opacity=".4"`) : '')
    + (t >= 30 ? arc(45, 0, 359.9, `stroke="${ink}" stroke-width="2.6" stroke-opacity=".18"`) : '');
  return `<defs>${glowFilter(g, 1.5)}</defs>${rings}<g filter="url(#${g})">${marks}</g>`;
}

/* --- SOLAR CROWN: rays off a hot core ------------------------------------- */
function drawSolar(t, uid) {
  const g = `${uid}s`;
  const rays = Math.min(8 + t, 44);
  const hot = ['#fde68a', '#fbbf24', '#fb923c', '#f87171', '#fff7d6'][Math.min(Math.floor(t / 11), 4)];
  const defs = glowFilter(g, 2) +
    `<linearGradient id="${uid}ray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hot}" stop-opacity=".05"/>
      <stop offset="1" stop-color="${hot}"/></linearGradient>`;
  // P() hands back an "x,y" pair and a line needs the two apart, so it is split
  // here rather than bent through the helper.
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (360 / rays) * i - 90;
    const long = i % 3 === 0;
    const inner = 30;
    const outer = inner + (long ? 12 : 7) + Math.min(t, 34) * 0.24 + jit(i, t) * 3;
    const [x1, y1] = P(inner, a).split(',');
    const [x2, y2] = P(outer, a).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#${uid}ray)"
      stroke-width="${(long ? 2.2 : 1.2).toFixed(1)}" stroke-linecap="round"/>`;
  }).join('');
  const core = arc(29, 0, 359.9, `stroke="${hot}" stroke-width="1.6" stroke-opacity=".85"`);
  return `<defs>${defs}</defs>${core}<g filter="url(#${g})">${lines}</g>`;
}

/* --- GOD: the frame behind the one-time code ------------------------------
 * Gold on gold, and the only frame in the set that moves on its own: two
 * counter-rotating rings, a halo that breathes, and rays that never stop. It
 * cannot be reached by levelling, so it never has to sit politely beside the
 * others in the picker. */
function drawGod(t, uid) {
  const g = `${uid}g`;
  const defs = glowFilter(g, 2.6) +
    `<linearGradient id="${uid}gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7d6"/><stop offset="0.45" stop-color="#fbbf24"/>
      <stop offset="0.7" stop-color="#b45309"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
    <radialGradient id="${uid}halo"><stop offset="0.55" stop-color="#fde68a" stop-opacity="0"/>
      <stop offset="1" stop-color="#fbbf24" stop-opacity=".55"/></radialGradient>`;

  const rays = Array.from({ length: 36 }, (_, i) => {
    const a = 10 * i - 90;
    const long = i % 3 === 0;
    const [x1, y1] = P(31, a).split(',');
    const [x2, y2] = P(long ? 50 : 41, a).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#${uid}gold)"
      stroke-width="${long ? 2.4 : 1.1}" stroke-linecap="round"/>`;
  }).join('');

  const teeth = Array.from({ length: 12 }, (_, i) => {
    const a = 30 * i - 90;
    const [x, y] = P(37, a).split(',');
    return `<polygon points="${diamond(+x, +y, 3.4)}" fill="url(#${uid}gold)"/>`;
  }).join('');

  return `<defs>${defs}</defs>
    <circle r="46" fill="url(#${uid}halo)" class="god-halo"/>
    <g filter="url(#${g})">
      <g class="god-spin">${rays}</g>
      <g class="god-spin-back">${teeth}</g>
      ${arc(30.5, 0, 359.9, `stroke="url(#${uid}gold)" stroke-width="2.2"`)}
      ${arc(44, 0, 359.9, `stroke="url(#${uid}gold)" stroke-width="1" stroke-opacity=".7"`)}
    </g>`;
}

/* --- J. hellfire ------------------------------------------------------------
 * The Creator's own, behind a code. A ring of lava with glowing cracks, and
 * flames standing up all around it that flicker (hell-* in screens.css);
 * embers ride a second ring the other way. The tier only raises the fire:
 * more tongues, taller, brighter, and from tier 25 a second, outer row. */
function drawHellfire(t, uid) {
  const g = `${uid}g`;
  const tongues = 14 + Math.min(10, Math.floor(t / 5));
  const height = 8 + Math.min(10, t * 0.22);
  const outer = t >= 24;
  const defs = glowFilter(g, 2.2) +
    `<linearGradient id="${uid}fire" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#7a1d0f"/><stop offset="0.45" stop-color="#fa8072"/>
      <stop offset="0.8" stop-color="#ffc9a3"/><stop offset="1" stop-color="#fff5ee"/></linearGradient>
    <linearGradient id="${uid}lava" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a0b08"/><stop offset="0.5" stop-color="#5b1717"/><stop offset="1" stop-color="#1a0605"/></linearGradient>
    <radialGradient id="${uid}heat"><stop offset="0.5" stop-color="#fa8072" stop-opacity="0"/>
      <stop offset="1" stop-color="#fa8072" stop-opacity=".5"/></radialGradient>`;

  // A tongue of flame standing on the ring at angle a, its tip leaning with the jitter.
  const tongue = (a, r, h, w, cls) => {
    const [bx, by] = P(r, a).split(',').map(Number);
    const [tx, ty] = P(r + h, a + (jit(Math.round(a), 3) - 0.5) * 8).split(',').map(Number);
    const [lx, ly] = P(r, a - w).split(',').map(Number);
    const [rx, ry] = P(r, a + w).split(',').map(Number);
    const [mx, my] = P(r + h * 0.55, a).split(',').map(Number);
    return `<path class="${cls}" d="M${lx},${ly} Q${mx - (tx - bx) * 0.2},${my - (ty - by) * 0.2} ${tx},${ty} Q${mx + (tx - bx) * 0.2},${my + (ty - by) * 0.2} ${rx},${ry} Z" fill="url(#${uid}fire)" style="transform-origin:${bx}px ${by}px"/>`;
  };
  const flames = Array.from({ length: tongues }, (_, i) => {
    const a = (360 / tongues) * i - 90;
    const h = height * (0.7 + jit(i, 1) * 0.6);
    return tongue(a, 33, h, 360 / tongues / 2.6, `hell-flame hell-f${i % 3}`);
  }).join('');
  const outerFlames = outer ? Array.from({ length: Math.round(tongues * 1.5) }, (_, i) => {
    const a = (360 / Math.round(tongues * 1.5)) * i - 84;
    return tongue(a, 46, height * 0.55 * (0.7 + jit(i, 2) * 0.6), 360 / tongues / 4, `hell-flame hell-f${(i + 1) % 3}`);
  }).join('') : '';

  // Cracks of light in the lava ring.
  const cracks = Array.from({ length: 10 + Math.min(8, Math.floor(t / 6)) }, (_, i) => {
    const a = (360 / (10 + Math.min(8, Math.floor(t / 6)))) * i + jit(i, 5) * 20 - 90;
    const [x1, y1] = P(28.5, a).split(',');
    const [x2, y2] = P(33, a + (jit(i, 6) - 0.5) * 14).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffb3a7" stroke-width="1.1" stroke-linecap="round" class="hell-crack"/>`;
  }).join('');

  const embers = Array.from({ length: 12 + Math.min(12, Math.floor(t / 4)) }, (_, i) => {
    const a = (360 / (12 + Math.min(12, Math.floor(t / 4)))) * i;
    const [x, y] = P(40 + jit(i, 7) * 8, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(0.7 + jit(i, 8) * 1.1).toFixed(2)}" fill="${i % 4 === 0 ? '#fff1ec' : '#fa8072'}"/>`;
  }).join('');

  return `<defs>${defs}</defs>
    <circle r="50" fill="url(#${uid}heat)" class="hell-heat"/>
    <g filter="url(#${g})">
      <g class="hell-flames">${outerFlames}${flames}</g>
      ${arc(30.5, 0, 359.9, `stroke="url(#${uid}lava)" stroke-width="5"`)}
      <g class="hell-cracks">${cracks}</g>
      ${arc(28, 0, 359.9, `stroke="#fa8072" stroke-width="0.8" stroke-opacity=".8"`)}
      <g class="hell-embers">${embers}</g>
    </g>`;
}

/* --- SINGULARITY: the frame at the top of the ladder -------------------------
 * Level 500 and nothing less, so it never has to sit politely beside the
 * others: the wrapped circle becomes a black hole. A photon ring so thin it
 * is almost not there, three rings of an accretion disc turning at three
 * speeds (sing-* in screens.css), lensed arcs of light bent around the
 * horizon, two jets pulsing from the poles, and stars circling inward. The
 * tier only decides how many stars have already been caught. */
function drawSingularity(t, uid) {
  const g = `${uid}g`;
  const defs = glowFilter(g, 2.2) +
    `<linearGradient id="${uid}in" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#bae6fd"/><stop offset="1" stop-color="#7dd3fc" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${uid}mid" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde68a"/><stop offset="0.5" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316" stop-opacity=".25"/></linearGradient>
    <linearGradient id="${uid}out" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#c084fc"/><stop offset="0.5" stop-color="#7c3aed"/><stop offset="1" stop-color="#312e81" stop-opacity=".2"/></linearGradient>
    <linearGradient id="${uid}jet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0f2fe" stop-opacity="0"/><stop offset="0.5" stop-color="#bae6fd"/><stop offset="1" stop-color="#e0f2fe" stop-opacity="0"/></linearGradient>
    <radialGradient id="${uid}well"><stop offset="0.5" stop-color="#7c3aed" stop-opacity="0"/>
      <stop offset="0.8" stop-color="#7c3aed" stop-opacity=".28"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>`;

  const stars = Array.from({ length: 12 + Math.min(12, Math.floor(t / 4)) }, (_, i) => {
    const n = 12 + Math.min(12, Math.floor(t / 4));
    const a = (360 / n) * i + jit(i, 9) * 14;
    const [x, y] = P(44 + jit(i, 10) * 9, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(0.6 + jit(i, 11) * 1.1).toFixed(2)}" fill="${i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#bae6fd' : '#fde68a'}" class="sing-star sing-s${i % 3}"/>`;
  }).join('');

  return `<defs>${defs}</defs>
    <circle r="54" fill="url(#${uid}well)" class="sing-well"/>
    <g class="sing-stars">${stars}</g>
    <g filter="url(#${g})">
      <rect x="-1.2" y="-55" width="2.4" height="22" rx="1.2" fill="url(#${uid}jet)" class="sing-jet"/>
      <rect x="-1.2" y="33" width="2.4" height="22" rx="1.2" fill="url(#${uid}jet)" class="sing-jet sing-jet-b"/>
      <g class="sing-spin sing-out"><circle r="42.5" fill="none" stroke="url(#${uid}out)" stroke-width="3.2" stroke-dasharray="40 9 16 7" stroke-linecap="round"/></g>
      <g class="sing-spin sing-mid"><circle r="37.5" fill="none" stroke="url(#${uid}mid)" stroke-width="4" stroke-dasharray="27 6 12 8" stroke-linecap="round"/></g>
      <g class="sing-spin sing-in"><circle r="33" fill="none" stroke="url(#${uid}in)" stroke-width="2.6" stroke-dasharray="19 5 8 4" stroke-linecap="round"/></g>
      ${arc(47.5, 196, 344, `stroke="#c4b5fd" stroke-width="0.9" stroke-opacity=".7" stroke-linecap="round" class="sing-lens"`)}
      ${arc(47.5, 16, 164, `stroke="#c4b5fd" stroke-width="0.9" stroke-opacity=".7" stroke-linecap="round" class="sing-lens sing-lens-b"`)}
      <circle r="30.8" fill="none" stroke="#05030c" stroke-width="2.2" stroke-opacity=".9"/>
      <circle r="29.4" fill="none" stroke="#ffffff" stroke-width="1.3" class="sing-ring"/>
    </g>`;
}

/* ===========================================================================
   THE ATELIER FRAMES
   ---------------------------------------------------------------------------
   Ten styles no level hands out: they are bought with Ink, and once bought
   they climb the same fifty tiers as the rest. Each one keeps to its own
   vocabulary so none reads as another recoloured: a hedge of ivy, a train
   of gears, a tide, a storm, a honeycomb, an inkwell, folded paper, paper
   lanterns, stained glass, and a comet on its orbit.
   =========================================================================== */

/* --- ivy: leaves around a vine, then berries, then blossom ------------------ */
function drawIvy(t, uid) {
  const g = `${uid}v`;
  const defs = grad(g, [[0, '#86efac'], [0.5, '#22c55e'], [1, '#14532d']]);
  const n = 8 + Math.min(16, Math.floor(t / 3));
  const leaves = Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i + jit(i, 1) * 10;
    const [x, y] = P(33.5, a).split(',');
    const s = (2.6 + jit(i, 2) * 1.2).toFixed(2);
    return `<path d="M 0 0 C ${s} ${-s} ${s * 2} 0 0 ${s * 1.6} C ${-s * 2} 0 ${-s} ${-s} 0 0 Z" transform="translate(${x} ${y}) rotate(${a + 90})" fill="url(#${g})" stroke="#14532d" stroke-width=".5"/>`;
  }).join('');
  const berries = t >= 10 ? Array.from({ length: Math.min(10, 3 + Math.floor((t - 10) / 4)) }, (_, i) => {
    const a = -70 + i * 37;
    const [x, y] = P(37.5, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="1.5" fill="#dc2626" stroke="#7f1d1d" stroke-width=".4"/>`;
  }).join('') : '';
  const blossom = t >= 25 ? [-90, 30, 150].map((a) => {
    const [x, y] = P(38, a).split(',');
    return `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((r) => `<ellipse rx="1.4" ry="2.6" cy="-2" fill="#fbcfe8" transform="rotate(${r})"/>`).join('')}<circle r="1" fill="#fde047"/></g>`;
  }).join('') : '';
  const gold = t >= 40 ? arc(41.5, 0, 359.9, `stroke="#facc15" stroke-width=".9" stroke-opacity=".7" stroke-dasharray="3 5"`) : '';
  return `<defs>${defs}</defs>${gold}
    <circle r="33.5" fill="none" stroke="#166534" stroke-width="${3.6 + Math.min(t, 12) * 0.2}"/>
    <circle r="33.5" fill="none" stroke="#4ade80" stroke-width=".8" stroke-dasharray="2 6" stroke-opacity=".8"/>
    ${leaves}${berries}${blossom}`;
}

/* --- gears: a toothed ring and the small wheels that drive it ------------- */
function drawGears(t, uid) {
  const g = `${uid}b`;
  const defs = grad(g, [[0, '#fde68a'], [0.5, '#b45309'], [1, '#78350f']]);
  const teeth = 18 + Math.min(18, Math.floor(t / 3));
  const ring = Array.from({ length: teeth * 2 }, (_, i) => P(i % 2 ? 36.5 : 33, (360 / (teeth * 2)) * i)).join(' ');
  const wheels = Math.min(6, 1 + Math.floor(t / 8));
  const small = Array.from({ length: wheels }, (_, i) => {
    const a = -90 + i * (360 / wheels) + 20;
    const [x, y] = P(43, a).split(',');
    const r = 4 + jit(i, 3) * 2;
    const pts = Array.from({ length: 16 }, (_, k) => P(k % 2 ? r + 1.4 : r, k * 22.5)).join(' ');
    return `<g transform="translate(${x} ${y})" class="gear-turn${i % 2 ? ' is-back' : ''}"><polygon points="${pts}" fill="#d97706" stroke="#78350f" stroke-width=".6"/><circle r="${(r * 0.35).toFixed(1)}" fill="#fef3c7"/></g>`;
  }).join('');
  const hand = t >= 20 ? `<line x1="0" y1="-26" x2="0" y2="-31" stroke="#fef3c7" stroke-width="1.4" stroke-linecap="round" transform="rotate(${(t * 23) % 360})"/>` : '';
  const rivets = t >= 30 ? Array.from({ length: 8 }, (_, i) => { const [x, y] = P(30, i * 45).split(','); return `<circle cx="${x}" cy="${y}" r="1.1" fill="#fde68a" stroke="#78350f" stroke-width=".4"/>`; }).join('') : '';
  return `<defs>${defs}</defs>
    <polygon points="${ring}" fill="none" stroke="url(#${g})" stroke-width="3.2" stroke-linejoin="round"/>
    <circle r="30.5" fill="none" stroke="#78350f" stroke-width="1"/>
    ${rivets}${hand}${small}`;
}

/* --- tide: a wave running round the ring, foam on its crest --------------- */
function drawTide(t, uid) {
  const g = `${uid}w`;
  const defs = grad(g, [[0, '#bae6fd'], [0.5, '#0ea5e9'], [1, '#0c4a6e']]);
  const crests = 6 + Math.min(10, Math.floor(t / 5));
  const wave = (r, amp, phase) => 'M ' + Array.from({ length: 73 }, (_, i) => {
    const a = i * 5 + phase;
    return P(r + amp * Math.sin((a * crests) * TAU), a);
  }).join(' L ') + ' Z';
  const foam = Array.from({ length: crests }, (_, i) => {
    const a = (360 / crests) * i + 90 / crests;
    const [x, y] = P(37.5, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(0.9 + jit(i, 4) * 0.6).toFixed(2)}" fill="#f0f9ff"/>`;
  }).join('');
  const second = t >= 15 ? `<path d="${wave(30, 1.4, 12)}" fill="none" stroke="#7dd3fc" stroke-width="1" stroke-opacity=".8" class="tide-roll"/>` : '';
  const moon = t >= 30 ? `<circle cx="0" cy="-44" r="3.6" fill="#fef9c3"/><circle cx="1.6" cy="-45" r="3" fill="#0c4a6e" fill-opacity=".0"/>` : '';
  const fish = t >= 40 ? [40, 200].map((a) => { const [x, y] = P(44, a).split(','); return `<path d="M -3 0 L 1 -2 L 1 2 Z M 1 0 L 3 -1.5 L 3 1.5 Z" transform="translate(${x} ${y}) rotate(${a + 90})" fill="#7dd3fc"/>`; }).join('') : '';
  return `<defs>${defs}</defs>${moon}
    <path d="${wave(34, 2.2, 0)}" fill="none" stroke="url(#${g})" stroke-width="${3.4 + Math.min(t, 10) * 0.2}" stroke-linejoin="round" class="tide-roll"/>
    ${second}${foam}${fish}`;
}

/* --- storm: a cloud bank, and the bolts that come out of it --------------- */
function drawStorm(t, uid) {
  const g = `${uid}s`;
  const defs = glowFilter(g, 1.8) + grad(`${uid}c`, [[0, '#94a3b8'], [1, '#1e293b']]);
  const puffs = Array.from({ length: 14 }, (_, i) => {
    const a = i * (360 / 14);
    const [x, y] = P(33.5, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(3.6 + jit(i, 5) * 1.6).toFixed(2)}" fill="url(#${uid}c)" stroke="#0f172a" stroke-width=".5"/>`;
  }).join('');
  const bolts = Math.min(8, 1 + Math.floor(t / 6));
  const lightning = Array.from({ length: bolts }, (_, i) => {
    const a = -90 + i * (360 / bolts) + jit(i, 6) * 20;
    const [x, y] = P(38, a).split(',');
    return `<polyline points="0,-6 -2.4,-1 0.8,-0.6 -1.6,6" transform="translate(${x} ${y}) rotate(${a + 90})" fill="none" stroke="#fef08a" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" filter="url(#${g})" class="storm-bolt storm-b${i % 3}"/>`;
  }).join('');
  const rain = t >= 20 ? Array.from({ length: 12 + Math.min(12, t - 20) }, (_, i) => {
    const a = i * (360 / (12 + Math.min(12, t - 20)));
    const [x1, y1] = P(41, a).split(',');
    const [x2, y2] = P(44, a + 3).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#bae6fd" stroke-width=".7" stroke-opacity=".7"/>`;
  }).join('') : '';
  const eye = t >= 40 ? `<circle r="29" fill="none" stroke="#fef08a" stroke-width=".8" stroke-opacity=".6" stroke-dasharray="1 4"/>` : '';
  return `<defs>${defs}</defs>${eye}${puffs}${rain}${lightning}`;
}

/* --- honeycomb: cells around the ring, bees once it fills ----------------- */
function drawHoney(t, uid) {
  const g = `${uid}h`;
  const defs = grad(g, [[0, '#fde68a'], [0.6, '#f59e0b'], [1, '#92400e']]);
  const cells = 14 + Math.min(10, Math.floor(t / 5));
  const hex = (x, y, r, rot) => `<polygon points="${Array.from({ length: 6 }, (_, k) => P(r, rot + k * 60)).join(' ')}" transform="translate(${x} ${y})"/>`;
  const comb = Array.from({ length: cells }, (_, i) => {
    const a = (360 / cells) * i;
    const [x, y] = P(33.5, a).split(',');
    const full = i % 3 !== 2 || t >= 12;
    return `<g fill="${full ? `url(#${g})` : 'none'}" stroke="#78350f" stroke-width=".8">${hex(x, y, 4.2, a)}</g>`;
  }).join('');
  const bees = t >= 20 ? Array.from({ length: Math.min(5, 1 + Math.floor((t - 20) / 7)) }, (_, i) => {
    const a = -60 + i * 75;
    const [x, y] = P(42, a).split(',');
    return `<g transform="translate(${x} ${y}) rotate(${a})" class="bee-hover"><ellipse rx="2.4" ry="1.5" fill="#fbbf24"/><path d="M -1 -1.5 v3 M 0.4 -1.5 v3" stroke="#1c1917" stroke-width=".7"/><ellipse cx="-0.4" cy="-1.8" rx="1.4" ry=".8" fill="#e0f2fe" fill-opacity=".8"/></g>`;
  }).join('') : '';
  const drips = t >= 35 ? [70, 110].map((a, i) => { const [x, y] = P(36, a).split(','); return `<path d="M -1.4 0 q 1.4 ${5 + i * 2} 2.8 0 z" transform="translate(${x} ${y})" fill="#f59e0b"/>`; }).join('') : '';
  return `<defs>${defs}</defs>
    <circle r="33.5" fill="none" stroke="#78350f" stroke-width="1.2" stroke-opacity=".6"/>
    ${comb}${drips}${bees}`;
}

/* --- inkwell: a black ring, splashes and drips, the currency's own frame -- */
function drawInkwell(t, uid) {
  const g = `${uid}i`;
  const defs = grad(g, [[0, '#818cf8'], [0.5, '#312e81'], [1, '#0f0a2e']]);
  const splashes = 6 + Math.min(14, Math.floor(t / 3));
  const blobs = Array.from({ length: splashes }, (_, i) => {
    const a = (360 / splashes) * i + jit(i, 7) * 18;
    const [x, y] = P(38 + jit(i, 8) * 4, a).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(1 + jit(i, 9) * 1.8).toFixed(2)}" fill="#1e1b4b"/>`;
  }).join('');
  const drips = Array.from({ length: Math.min(5, 1 + Math.floor(t / 10)) }, (_, i) => {
    const x = -16 + i * 8 + jit(i, 10) * 4;
    return `<rect x="${x.toFixed(1)}" y="30" width="2.2" height="${(6 + jit(i, 11) * 6).toFixed(1)}" rx="1.1" fill="#1e1b4b" class="ink-drip ink-d${i % 3}"/>`;
  }).join('');
  const quill = t >= 30 ? `<path d="M 30 -38 q 12 -10 16 -2 q -8 2 -14 12 z" fill="#c7d2fe" stroke="#312e81" stroke-width=".6"/><path d="M 32 -28 l 6 -8" stroke="#312e81" stroke-width=".8"/>` : '';
  const sheen = t >= 45 ? arc(33.5, 200, 340, `stroke="#a5b4fc" stroke-width="1" stroke-opacity=".7" stroke-linecap="round"`) : '';
  return `<defs>${defs}</defs>${blobs}
    <circle r="33.5" fill="none" stroke="url(#${g})" stroke-width="${5 + Math.min(t, 10) * 0.25}"/>
    ${drips}${sheen}${quill}`;
}

/* --- origami: a ring folded from paper, facets light and dark ------------- */
function drawOrigami(t, uid) {
  const facets = 12 + Math.min(12, Math.floor(t / 4) * 2);
  const tones = ['#fda4af', '#fecdd3', '#fb7185', '#ffe4e6'];
  const ring = Array.from({ length: facets }, (_, i) => {
    const a0 = (360 / facets) * i;
    const a1 = a0 + 360 / facets;
    const inner = i % 2 ? 30 : 31.5;
    const outer = i % 2 ? 36.5 : 38;
    return `<polygon points="${P(inner, a0)} ${P(outer, a0 + (a1 - a0) / 2)} ${P(inner, a1)}" fill="${tones[i % 4]}" stroke="#9f1239" stroke-width=".4"/>`;
  }).join('');
  const cranes = t >= 20 ? Array.from({ length: Math.min(4, 1 + Math.floor((t - 20) / 8)) }, (_, i) => {
    const a = -120 + i * 90;
    const [x, y] = P(44, a).split(',');
    return `<path d="M -4 1 L 0 -4 L 4 1 L 0 3 Z M 0 -4 L 1 -7 M -4 1 L -7 3" transform="translate(${x} ${y}) rotate(${a + 90})" fill="#fff1f2" stroke="#9f1239" stroke-width=".5" stroke-linejoin="round"/>`;
  }).join('') : '';
  const creases = t >= 35 ? arc(28.5, 0, 359.9, `stroke="#9f1239" stroke-width=".5" stroke-dasharray="4 3" stroke-opacity=".6"`) : '';
  return `${creases}${ring}${cranes}`;
}

/* --- lanterns: paper lamps hung on a cord around the ring ----------------- */
function drawLanterns(t, uid) {
  const g = `${uid}l`;
  const defs = glowFilter(g, 1.6);
  const n = 6 + Math.min(10, Math.floor(t / 4));
  const lamps = Array.from({ length: n }, (_, i) => {
    const a = -90 + (360 / n) * i;
    const [x, y] = P(36, a).split(',');
    const warm = ['#ef4444', '#f97316', '#fbbf24'][i % 3];
    return `<g transform="translate(${x} ${y})" class="lamp-sway lamp-s${i % 3}">
      <line x1="0" y1="-4.5" x2="0" y2="-3" stroke="#fde68a" stroke-width=".6"/>
      <rect x="-2.6" y="-3" width="5.2" height="6" rx="2" fill="${warm}" stroke="#7c2d12" stroke-width=".5" filter="url(#${g})"/>
      <line x1="0" y1="3" x2="0" y2="5" stroke="#fde68a" stroke-width=".6"/></g>`;
  }).join('');
  const cord = `<circle r="33.5" fill="none" stroke="#7c2d12" stroke-width="1" stroke-dasharray="1.5 2.5"/>`;
  const glow = t >= 15 ? `<circle r="41" fill="none" stroke="#fbbf24" stroke-width="6" stroke-opacity=".08"/>` : '';
  const sparks = t >= 30 ? Array.from({ length: 8 + Math.min(8, t - 30) }, (_, i) => { const [x, y] = P(44 + jit(i, 12) * 6, i * 27).split(','); return `<circle cx="${x}" cy="${y}" r=".8" fill="#fde68a"/>`; }).join('') : '';
  return `<defs>${defs}</defs>${glow}${cord}${sparks}${lamps}`;
}

/* --- stained glass: panes leaded together, a rose at the top later -------- */
function drawStained(t, uid) {
  const panes = 8 + Math.min(16, Math.floor(t / 3));
  const glass = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#fb923c'];
  const ring = Array.from({ length: panes }, (_, i) => {
    const a0 = (360 / panes) * i;
    const a1 = a0 + 360 / panes;
    return `<path d="M ${P(30, a0)} A 30 30 0 0 1 ${P(30, a1)} L ${P(38, a1)} A 38 38 0 0 0 ${P(38, a0)} Z" fill="${glass[i % 6]}" fill-opacity=".75" stroke="#1c1917" stroke-width="1.2"/>`;
  }).join('');
  const rose = t >= 25 ? `<g transform="translate(0 -44)">${Array.from({ length: 8 }, (_, k) => `<path d="M 0 0 L ${P(5.5, k * 45 - 22.5)} A 5.5 5.5 0 0 1 ${P(5.5, k * 45 + 22.5)} Z" fill="${glass[k % 6]}" fill-opacity=".8" stroke="#1c1917" stroke-width=".7"/>`).join('')}<circle r="1.6" fill="#fef3c7" stroke="#1c1917" stroke-width=".5"/></g>` : '';
  const light = t >= 40 ? `<circle r="34" fill="none" stroke="#fef3c7" stroke-width="8" stroke-opacity=".12" class="glass-light"/>` : '';
  return `${light}${ring}${rose}`;
}

/* --- comet: a head on its orbit, and the tail it leaves behind ------------ */
function drawComet(t, uid) {
  const g = `${uid}k`;
  const defs = glowFilter(g, 2) + `<linearGradient id="${uid}t" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#67e8f9" stop-opacity="0"/><stop offset="1" stop-color="#ecfeff"/></linearGradient>`;
  const tails = Math.min(3, 1 + Math.floor(t / 17));
  const trail = Array.from({ length: tails }, (_, i) => {
    const start = i * 120;
    const sweep = 80 + Math.min(120, t * 3);
    return `<g class="comet-orbit comet-o${i}">${arc(34, start, start + sweep, `stroke="url(#${uid}t)" stroke-width="${3.2 - i * 0.6}" stroke-linecap="round"`)}
      <circle cx="${P(34, start + sweep).split(',')[0]}" cy="${P(34, start + sweep).split(',')[1]}" r="${2.6 - i * 0.4}" fill="#ecfeff" filter="url(#${g})"/></g>`;
  }).join('');
  const stars = Array.from({ length: 8 + Math.min(16, Math.floor(t / 2)) }, (_, i) => {
    const n = 8 + Math.min(16, Math.floor(t / 2));
    const [x, y] = P(42 + jit(i, 13) * 10, (360 / n) * i).split(',');
    return `<circle cx="${x}" cy="${y}" r="${(0.5 + jit(i, 14) * 0.8).toFixed(2)}" fill="#a5f3fc"/>`;
  }).join('');
  const orbit = `<circle r="34" fill="none" stroke="#155e75" stroke-width="1" stroke-dasharray="2 3"/>`;
  const planet = t >= 30 ? `<circle cx="0" cy="-45" r="3" fill="#fbbf24"/><ellipse cx="0" cy="-45" rx="5.5" ry="1.4" fill="none" stroke="#fde68a" stroke-width=".7" transform="rotate(-20 0 -45)"/>` : '';
  return `<defs>${defs}</defs>${stars}${orbit}${planet}${trail}`;
}

const DRAWERS = {
  metal: drawMetal, circuit: drawCircuit, orbit: drawOrbit, crest: drawCrest, crystal: drawCrystal,
  aurora: drawAurora, runic: drawRunic, solar: drawSolar, singularity: drawSingularity,
  god: drawGod, hellfire: drawHellfire,
  ivy: drawIvy, gears: drawGears, tide: drawTide, storm: drawStorm, honey: drawHoney,
  inkwell: drawInkwell, origami: drawOrigami, lanterns: drawLanterns, stained: drawStained, comet: drawComet
};

/**
 * The frame for a style at a tier, as an <svg> string, or '' below tier 1.
 * The svg fills its container; put it in an absolutely-positioned overlay at
 * 223% of the wrapped circle's size.
 */
export function frameSvg(styleId, tier, { size = null } = {}) {
  const t = Math.min(Math.max(Math.round(tier), 0), 50) - 1;
  if (t < 0) return '';
  const draw = DRAWERS[styleId] ?? DRAWERS.metal;
  const uid = `pwf-${styleId}-${t}-`;
  const dim = size ? `width="${size}" height="${size}"` : 'width="100%" height="100%"';
  return `<svg viewBox="-58 -58 116 116" ${dim} aria-hidden="true" style="overflow:visible;display:block">${draw(t, uid)}</svg>`;
}
