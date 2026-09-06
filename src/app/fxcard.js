/**
 * THE SAMPLE CARD
 * ----------------------------------------------------------------------------
 * A treatment is a thing you look at, so neither the Atelier nor Customization
 * asks anyone to buy or wear one off a written note. Both paint a real card,
 * at card size, wearing the effect: same face, same frame, same title and
 * price the collection uses, on a drawn stand-in article so nothing here
 * needs the network.
 *
 * The samples light only while they are on screen and never take the tilt,
 * so a wall of forty of them costs about what a wall of forty stills costs.
 */
import { t } from '../i18n.js';
import { DEFAULT_FX } from '../data/fx.js';
import { CARD_FRONT_MARKUP, applyRarityVars, fillFront } from './open.js';

/* A drawn photograph: grey-blue land under a pale sky, so a tier's colour is
   read against the picture rather than swallowed by it. Inline, so a sample
   grid paints on the first frame and works with the radio off. */
const SAMPLE_ART = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="330" viewBox="0 0 440 330">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#dbe4ee"/><stop offset="0.62" stop-color="#9fb0c4"/></linearGradient>
<linearGradient id="l" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#6b7c92"/><stop offset="1" stop-color="#37455a"/></linearGradient></defs>
<rect width="440" height="330" fill="url(#s)"/>
<circle cx="330" cy="86" r="34" fill="#f2f6fb" opacity="0.9"/>
<path d="M0 214 L96 132 L168 196 L242 122 L330 214 Z" fill="#8494a9"/>
<path d="M0 330 L0 206 L118 150 L226 214 L318 158 L440 226 L440 330 Z" fill="url(#l)"/>
<path d="M0 330 L0 268 L140 236 L280 288 L440 250 L440 330 Z" fill="#25313f"/>
</svg>`)}`;

/** The stand-in article, filled with the same fields a real card carries. */
function sampleArticle() {
  return {
    key: 'sample',
    title: t('fxSampleTitle'),
    description: t('fxSampleDesc'),
    extract: t('fxSampleExtract'),
    thumbnail: SAMPLE_ART,
    price: 1240,
    views: 86000,
    packIcon: 'packs'
  };
}

/* One observer for every sample on screen: visible means animated, off screen
   means still, and nothing here follows a finger. */
const watcher = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) target.classList.toggle('is-lit', isIntersecting);
  }, { rootMargin: '120px 0px', threshold: 0.02 })
  : null;

/**
 * A card wearing one effect, whether or not its owner owns it.
 * @param {{ id: string, name: object, color: string, glow: string }} rarity
 * @param {string} fxId the treatment to show, `classic` for the tier's own
 */
export function fxSampleCard(rarity, fxId) {
  const card = document.createElement('article');
  card.className = 'card fx-sample is-revealed';
  applyRarityVars(card, rarity);
  // applyRarityVars dresses the card in what its owner WEARS; a sample shows
  // the one being offered, which is usually not that.
  if (fxId && fxId !== DEFAULT_FX) card.dataset.fx = fxId;
  else delete card.dataset.fx;
  card.innerHTML = `<div class="card-inner"><div class="card-face card-front">${CARD_FRONT_MARKUP}</div></div>`;
  fillFront(card.querySelector('.card-front'), sampleArticle(), rarity);
  if (watcher) watcher.observe(card);
  else card.classList.add('is-lit');
  return card;
}
