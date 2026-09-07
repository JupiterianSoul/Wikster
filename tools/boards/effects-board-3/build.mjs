/* Assembles the effects board out of the shell and the eight tier stylesheets. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('.', import.meta.url).pathname;
const read = (f) => readFileSync(join(DIR, f), 'utf8');

const TIERS = [
  { id: 'common', file: '10-common.css', label: 'Common', colour: '#9aa5b1',
    lead: 'Paper, and the machines that used to print on it. Nothing here shines, and nothing here pretends to: the whole tier is matte stock, off register and slightly worn. It has to read as the floor the other seven tiers stand on.' },
  { id: 'uncommon', file: '20-uncommon.css', label: 'Uncommon', colour: '#4ade80',
    lead: 'Everything in this tier is alive. Growth, drift, damp and light through leaf tissue, all of it moving on long cycles so a shelf of them never reads as busy. Green that behaves like a plant rather than green as a colour choice.' },
  { id: 'rare', file: '30-rare.css', label: 'Rare', colour: '#3b82f6',
    lead: 'Blue as a material: cut, frozen, conducting or under water. This is the first tier where light is a real actor, so most of these respond to the tilt of the card as well as to their own clock.' },
  { id: 'epic', file: '40-epic.css', label: 'Epic', colour: '#c084fc',
    lead: 'Violet, and almost all of it very far away. Gravity, radiation, dust and one flower that got in on colour alone. The scale of the tier is the point: these should feel like a window rather than a surface.' },
  { id: 'legendary', file: '50-legendary.css', label: 'Legendary', colour: '#fbbf24',
    lead: 'Ten answers to one question: what do people actually do with gold? Beat it, draw it, pour it, wear it, stamp it. The sweeps are slower here than anywhere else, because gold reads as heavy or it reads as cheap.' },
  { id: 'mythic', file: '60-mythic.css', label: 'Mythic', colour: '#e02134',
    lead: 'Red, and something has gone wrong with it. Corruption, fire, ritual, failure and heat. These are the only treatments allowed to be genuinely aggressive, and several of them break the card on purpose.' },
  { id: 'exotic', file: '70-exotic.css', label: 'Exotic', colour: '#22d3ee',
    lead: 'Instruments rather than ornament. Every one of these is a readout of something, drawn the way the machine would draw it, in the cyan of a screen that has been on all night.' },
  { id: 'prismatic', file: '90-prismatic.css', label: 'Prismatic', colour: '#f472b6',
    lead: 'The top of the ladder, so each of these takes the full spectrum and splits it a different way: interference, diffraction, thin film, play-of-colour, mirrors, and one that simply lets go of all of it at once.' },
];

const PARTICLES = new Set(['epic-8', 'legendary-8', 'mythic-2', 'mythic-7', 'prismatic-10', 'rare-3', 'uncommon-6', 'uncommon-9']);
const CODE = new Set(['exotic-7']);

/* Card copy: one plausible article per slot, so the plate is judged on real text. */
const ARTICLES = {
  common: [['Gutenberg Bible', 'Printing', '1,204,882'], ['Ordnance Survey', 'Cartography', '842,310'], ['Isometric projection', 'Drawing', '511,776'], ['Corrugated fiberboard', 'Packaging', '388,401'], ['QWERTY', 'Keyboards', '1,908,553'], ['Carbon paper', 'Stationery', '204,119'], ['Double-entry bookkeeping', 'Accounting', '672,940'], ['Dewey Decimal', 'Libraries', '957,308'], ['Xerography', 'Imaging', '415,662'], ['Card catalog', 'Libraries', '333,027']],
  uncommon: [['Fiddlehead fern', 'Botany', '288,410'], ['Sphagnum', 'Bryophytes', '176,995'], ['Symbiosis', 'Ecology', '1,022,318'], ['Hedera helix', 'Climbing plants', '404,571'], ['Photosynthesis', 'Biochemistry', '3,118,204'], ['Eutrophication', 'Limnology', '298,663'], ['Bambusoideae', 'Grasses', '661,209'], ['Wardian case', 'Horticulture', '142,880'], ['Palynology', 'Botany', '188,447'], ['Germination', 'Plant biology', '520,336']],
  rare: [['Corundum', 'Mineralogy', '397,221'], ['Dendrite (crystal)', 'Crystallography', '203,864'], ['Thermohaline circulation', 'Oceanography', '512,904'], ['Printed circuit board', 'Electronics', '1,340,776'], ['Moire pattern', 'Optics', '286,118'], ['Total internal reflection', 'Optics', '744,502'], ['Neon lighting', 'Lighting', '429,377'], ['Sericulture', 'Textiles', '311,240'], ['Sonar', 'Acoustics', '1,105,663'], ['Sumi-e', 'Painting', '267,459']],
  epic: [['Schwarzschild radius', 'Astrophysics', '1,481,220'], ['PSR B1919+21', 'Astronomy', '355,908'], ['Supercell', 'Meteorology', '698,441'], ['Einstein-Rosen bridge', 'Physics', '2,041,377'], ['Geode', 'Geology', '480,116'], ['Interstellar medium', 'Astronomy', '609,733'], ['Magnetar', 'Astronomy', '844,290'], ['Orchidaceae', 'Botany', '971,558'], ['Fluorescence', 'Optics', '1,208,664'], ['Halley’s Comet', 'Astronomy', '2,663,401']],
  legendary: [['Gold leaf', 'Metalwork', '388,206'], ['Filigree', 'Jewellery', '241,779'], ['Lost-wax casting', 'Metallurgy', '506,338'], ['Laurel wreath', 'Antiquity', '712,905'], ['Reliquary', 'Sacred art', '333,662'], ['Art Deco', 'Architecture', '2,214,880'], ['Repousse and chasing', 'Metalwork', '198,447'], ['Sunspot', 'Solar physics', '1,076,219'], ['Crown jewels', 'Regalia', '1,552,340'], ['Gold bar', 'Bullion', '628,117']],
  mythic: [['Bit rot', 'Computing', '291,663'], ['Firestorm', 'Wildfire', '640,228'], ['Ritual', 'Anthropology', '888,470'], ['Fracture mechanics', 'Materials', '412,905'], ['Analogue television', 'Broadcasting', '1,180,336'], ['Chernobyl disaster', 'Nuclear', '4,902,771'], ['Blast furnace', 'Metallurgy', '733,509'], ['Electric arc', 'Physics', '520,884'], ['Thermography', 'Imaging', '366,142'], ['Wormhole', 'Physics', '1,977,058']],
  exotic: [['Polygon mesh', 'Computer graphics', '408,229'], ['Command-line interface', 'Computing', '1,662,940'], ['Vanishing point', 'Perspective', '377,118'], ['Double-slit experiment', 'Physics', '2,308,551'], ['Technical drawing', 'Engineering', '644,703'], ['Superposition principle', 'Physics', '1,411,286'], ['Data stream', 'Computing', '288,006'], ['Oscilloscope', 'Instruments', '596,338'], ['Molecular assembler', 'Nanotech', '324,779'], ['Radar cross-section', 'Defence', '452,660']],
  prismatic: [['Aurora borealis', 'Atmospheric physics', '3,884,220'], ['Diffraction grating', 'Optics', '702,913'], ['Thin-film interference', 'Optics', '388,447'], ['Chromatic aberration', 'Optics', '511,662'], ['Dispersion (optics)', 'Optics', '1,204,338'], ['Opal', 'Gemmology', '944,507'], ['Visible spectrum', 'Optics', '1,760,229'], ['Kaleidoscope', 'Optics', '486,118'], ['Structural coloration', 'Biology', '412,996'], ['SN 1987A', 'Astronomy', '1,338,470']],
};

const EXTRACTS = {
  common: 'The technique spread through commercial printers within a decade, and remained standard practice until offset lithography displaced it almost entirely.',
  uncommon: 'Growth is slow and largely seasonal, with the visible structure representing several years of accumulation under favourable conditions.',
  rare: 'The effect depends on the refractive index of the medium, and disappears entirely when the two are matched closely enough.',
  epic: 'Observations from three separate arrays converged on the same figure, which remained controversial for most of the following decade.',
  legendary: 'The work was commissioned for a single occasion and never repeated, though the pattern was copied widely by later workshops.',
  mythic: 'Recovery was attempted twice before the site was abandoned, and the surrounding area remains closed to the public.',
  exotic: 'The instrument records at a fixed sample rate, so any feature shorter than one interval is reconstructed rather than measured.',
  prismatic: 'Each wavelength leaves the surface at its own angle, which is why the colour changes with nothing more than the position of the observer.',
};

/* A drawn stand-in for the article image: no network, and it reads as a real picture. */
function art(tier, n, colour) {
  const seed = (i) => ((n * 37 + i * 61) % 100) / 100;
  const shapes = [];
  for (let i = 0; i < 7; i++) {
    const x = 6 + seed(i) * 88, y = 10 + seed(i + 3) * 76, r = 6 + seed(i + 7) * 22;
    shapes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 2 ? '#f2f4f8' : '#2a3040'}" opacity="${(0.12 + seed(i + 11) * 0.3).toFixed(2)}"/>`);
  }
  for (let i = 0; i < 4; i++) {
    const y = 12 + i * 22 + seed(i + 5) * 10;
    shapes.push(`<path d="M0 ${y.toFixed(1)} Q 25 ${(y - 12 + seed(i) * 24).toFixed(1)} 50 ${y.toFixed(1)} T 100 ${(y + 6 - seed(i + 2) * 12).toFixed(1)}" fill="none" stroke="${i % 2 ? '#eef1f6' : '#232936'}" stroke-width="${(0.6 + seed(i + 9)).toFixed(2)}" opacity="${(0.2 + seed(i + 4) * 0.35).toFixed(2)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="#7d8492"/><rect width="100" height="100" fill="${colour}" opacity="0.22"/>${shapes.join('')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function particles(v) {
  if (!PARTICLES.has(v)) return '';
  let out = '';
  for (let i = 0; i < 12; i++) {
    const left = (6 + ((i * 29) % 88)).toFixed(0);
    const size = (1.4 + ((i * 13) % 9) / 4).toFixed(2);
    const dur = (5 + ((i * 17) % 40) / 6).toFixed(1);
    const delay = (-(i * 11) % 60 / 6).toFixed(1);
    const sx = (((i % 5) - 2) * 4).toFixed(0);
    out += `<i style="left:${left}%;bottom:-6%;width:${size}cqw;height:${size}cqw;--sx:${sx}cqw;animation-duration:${dur}s;animation-delay:${delay}s"></i>`;
  }
  return out;
}

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEF#$%&*+=<>/\\|';
function codeCols(v) {
  if (!CODE.has(v)) return '';
  let out = '';
  for (let c = 0; c < 11; c++) {
    let text = '';
    for (let r = 0; r < 60; r++) text += GLYPHS[(c * 17 + r * 7 + r * c) % GLYPHS.length] + '\n';
    const dur = (3.2 + ((c * 13) % 30) / 10).toFixed(1);
    out += `<span class="col" style="animation-duration:${dur}s;animation-delay:${(-(c * 7) % 30 / 10).toFixed(1)}s">${text}${text}</span>`;
  }
  return out;
}

function card(tier, n) {
  const v = `${tier.id}-${n}`;
  const [title, kind, views] = ARTICLES[tier.id][n - 1];
  return `<div class="card" data-variant="${v}" data-rarity="${tier.id}" tabindex="0" role="img" aria-label="${tier.label} treatment ${n}">
  <div class="card-inner"><div class="card-face card-front">
    <div class="fx fx-a"></div>
    <div class="fx-code">${codeCols(v)}</div>
    <div class="fx-art"></div>
    <div class="card-art"><img src="${art(tier.id, n, tier.colour)}" alt=""></div>
    <div class="card-body">
      <h3 class="card-title">${title}</h3>
      <p class="card-desc">${kind}</p>
      <p class="card-extract">${EXTRACTS[tier.id]}</p>
    </div>
    <div class="card-stats"><span class="card-price">${(120 + n * 37 + TIERS.indexOf(tier) * 480).toLocaleString('en-US')}</span><span class="card-views">${views} views</span></div>
    <div class="card-footer"><span class="rarity-badge">${tier.label}</span></div>
    <div class="fx-p">${particles(v)}</div>
    <div class="fx fx-b"></div>
    <div class="fx fx-c"></div>
    <div class="fx fx-v"></div>
    <div class="fx-ring"></div>
  </div></div>
</div>`;
}

function tierSection(tier) {
  const css = read(tier.file);
  const notes = [...css.matchAll(/^\/\* (\d+) ([^:]+): ([^*]+?)\s*\*\/$/gm)].map((m) => ({ n: +m[1], name: m[2].trim(), blurb: m[3].trim() }));
  notes.sort((a, b) => a.n - b.n);
  if (notes.length !== 10) throw new Error(`${tier.id}: found ${notes.length} designs, expected 10`);
  const picks = notes.map((d) => `<figure class="pick" data-pick="${tier.id}-${d.n}">
  ${card(tier, d.n)}
  <figcaption><b><i>${String(d.n).padStart(2, '0')}</i>${d.name}</b><p>${d.blurb}</p></figcaption>
  <button class="choose" type="button" data-pick="${tier.id}-${d.n}" aria-pressed="false">Pick</button>
</figure>`).join('\n');
  return `<section class="tier" id="${tier.id}" style="--tier:${tier.colour}">
  <div class="tier-head"><span class="swatch"></span>
    <h2><span>${tier.label}</span><em>10 treatments</em></h2>
    <p>${tier.lead}</p>
  </div>
  <div class="row">${picks}</div>
</section>`;
}

const tierCss = TIERS.map((t) => read(t.file)).join('\n');
const shell = read('00-shell.html');
const [headAndOpen, styleTail] = [shell, ''];

const jump = TIERS.map((t) => `<a href="#${t.id}" style="--tier:${t.colour}">${t.label}</a>`).join('');

const html = `${headAndOpen}
/* ---- layers the builder controls ---- */
.fx-code { opacity: 0; }
.fx-p i { display: block; }
</style>

<div class="glow one" aria-hidden="true"></div>
<div class="glow two" aria-hidden="true"></div>

<header>
  <h1>Wikster Effects Board III
    <small>Eighty treatments, ten for every rarity. Each one is a real card at real size with the app's own layers, so what you see is what ships. Pick as many per tier as you want.</small>
  </h1>
  <div class="controls">
    <label><input type="checkbox" id="opt-tilt" checked> tilt follows pointer</label>
    <label><input type="checkbox" id="opt-sway" checked> auto sway</label>
    <button type="button" id="opt-pause">Pause motion</button>
    <button type="button" id="copy">Copy picks</button>
  </div>
</header>

<nav class="jump">${jump}</nav>

<main>
${TIERS.map(tierSection).join('\n')}
</main>

<footer>
  <div class="picks">
    <h3>Picked</h3>
    <p id="picks-text">Nothing yet. Pick the ones you want built into the app.</p>
    <button type="button" id="clear">Clear</button>
  </div>
</footer>

<script>
const TIER_ORDER = ${JSON.stringify(TIERS.map((t) => t.id))};
const NAMES = ${JSON.stringify(Object.fromEntries(TIERS.map((t) => {
  const css = read(t.file);
  const notes = [...css.matchAll(/^\/\* (\d+) ([^:]+): /gm)];
  return [t.id, notes.map((m) => m[2].trim())];
})))};

const chosen = new Set(JSON.parse(localStorage.getItem('board3.picks') || '[]'));

function render() {
  for (const fig of document.querySelectorAll('.pick')) {
    const on = chosen.has(fig.dataset.pick);
    fig.classList.toggle('is-chosen', on);
    const b = fig.querySelector('.choose');
    b.textContent = on ? 'Picked' : 'Pick';
    b.setAttribute('aria-pressed', String(on));
  }
  const out = document.getElementById('picks-text');
  if (!chosen.size) { out.textContent = 'Nothing yet. Pick the ones you want built into the app.'; }
  else {
    const by = new Map();
    for (const v of chosen) {
      const i = v.lastIndexOf('-');
      const tier = v.slice(0, i), n = +v.slice(i + 1);
      if (!by.has(tier)) by.set(tier, []);
      by.get(tier).push(n);
    }
    out.innerHTML = TIER_ORDER.filter((t) => by.has(t)).map((t) => {
      const list = by.get(t).sort((a, b) => a - b).map((n) => NAMES[t][n - 1] + ' (' + n + ')').join(', ');
      return '<b>' + t + ':</b> ' + list;
    }).join(' &nbsp;|&nbsp; ');
  }
  try { localStorage.setItem('board3.picks', JSON.stringify([...chosen])); } catch (e) {}
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.choose');
  if (!b) return;
  const v = b.dataset.pick;
  chosen.has(v) ? chosen.delete(v) : chosen.add(v);
  render();
});

document.getElementById('clear').addEventListener('click', () => { chosen.clear(); render(); });
document.getElementById('copy').addEventListener('click', async () => {
  const btn = document.getElementById('copy');
  const text = document.getElementById('picks-text').textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
  catch (err) { btn.textContent = 'Select and copy'; }
  setTimeout(() => { btn.textContent = 'Copy picks'; }, 1600);
});

/* Tilt: pointer over a card drives --tx/--ty and the light vector --lx/--ly. */
let tilt = true;
document.getElementById('opt-tilt').addEventListener('change', (e) => {
  tilt = e.target.checked;
  if (!tilt) for (const c of document.querySelectorAll('.card')) c.style.removeProperty('--tx');
});
document.addEventListener('pointermove', (e) => {
  if (!tilt) return;
  const card = e.target.closest('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  const tx = ((e.clientX - r.left) / r.width - .5) * 2;
  const ty = ((e.clientY - r.top) / r.height - .5) * 2;
  card.style.setProperty('--tx', tx.toFixed(3));
  card.style.setProperty('--ty', ty.toFixed(3));
  card.style.setProperty('--lx', tx.toFixed(3));
  card.style.setProperty('--ly', ty.toFixed(3));
  card.dataset.held = '1';
});
document.addEventListener('pointerleave', (e) => {
  const card = e.target.closest && e.target.closest('.card');
  if (card) { card.dataset.held = ''; card.style.removeProperty('--tx'); card.style.removeProperty('--ty'); }
}, true);

/* Auto sway: every card that is not being touched breathes its light vector, so a
   treatment that only lives in --lx still moves while you are reading the caption. */
let sway = true;
document.getElementById('opt-sway').addEventListener('change', (e) => { sway = e.target.checked; });
const cards = [...document.querySelectorAll('.card')];
let t0 = 0;
function frame(t) {
  if (sway) {
    const s = t / 1000;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (c.dataset.held === '1') continue;
      const p = s * 0.55 + i * 0.37;
      c.style.setProperty('--lx', (Math.sin(p) * 0.85).toFixed(3));
      c.style.setProperty('--ly', (Math.cos(p * 0.8) * 0.35).toFixed(3));
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let paused = false;
document.getElementById('opt-pause').addEventListener('click', () => {
  paused = !paused;
  document.body.classList.toggle('paused', paused);
  document.getElementById('opt-pause').textContent = paused ? 'Resume motion' : 'Pause motion';
});

render();
</script>`;

/* The tier CSS has to sit inside the shell's own style block, before it closes. */
const finalHtml = html.replace('/* ---- layers the builder controls ---- */', `${tierCss}\n/* ---- layers the builder controls ---- */`);
writeFileSync(join(DIR, 'board.html'), finalHtml);
console.log('board.html written:', (finalHtml.length / 1024).toFixed(1) + 'kb');
