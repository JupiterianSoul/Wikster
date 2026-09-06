/**
 * WHAT'S NEW
 * ----------------------------------------------------------------------------
 * A small sheet on launch for anyone who was last here before the latest
 * release: what has changed since, in the short form the timeline uses,
 * and a button to the full patch notes. The last release seen is kept on
 * the device; a brand-new player sees nothing and is marked up to date, so
 * the first launch is the welcome and not a changelog.
 */
import { t, tx } from '../i18n.js';
import { RELEASES } from '../data/releases.js';
import { iconSvg } from '../data/icons.js';
import { press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import { openSheet, showScreen } from './core.js';
import { live } from './live.js';

export const SEEN_KEY = 'wikster.seenRelease.v1';
const AT_MOST = 3;

const seenId = () => { try { return localStorage.getItem(SEEN_KEY); } catch { return null; } };
export const markSeen = () => { try { localStorage.setItem(SEEN_KEY, RELEASES.at(-1).id); } catch { /* session only */ } };

/** The releases this device has not seen, newest first, at most three. */
export function unseenReleases() {
  const seen = seenId();
  const at = seen ? RELEASES.findIndex((r) => r.id === seen) : -1;
  // A device with no mark at all is not shown the whole history: the latest
  // release is what is new to it.
  const from = at >= 0 ? at + 1 : RELEASES.length - 1;
  return RELEASES.slice(from).reverse().slice(0, AT_MOST);
}

/**
 * Show the sheet if there is anything to show, once every other launch
 * sheet has had its turn: it waits for the sheet to be free rather than
 * pushing in front of the daily gift or a level.
 */
export function checkWhatsNew({ fresh = false } = {}) {
  if (fresh) { markSeen(); return false; }
  const list = unseenReleases();
  if (!list.length) return false;
  let tries = 0;
  const attempt = () => {
    if (live.sheet?.open || document.querySelector('.reveal')) {
      if (tries++ < 120) setTimeout(attempt, 500);
      return;
    }
    openWhatsNew(list);
  };
  setTimeout(attempt, 1400);
  return true;
}

export function openWhatsNew(list = unseenReleases()) {
  markSeen();
  openSheet(t('whatsNewTitle'), (body) => {
    const wrap = document.createElement('div');
    wrap.className = 'whatsnew';
    const lead = document.createElement('p');
    lead.className = 'whatsnew-lead';
    lead.textContent = t(list.length === 1 ? 'whatsNewLeadOne' : 'whatsNewLead', { n: list.length });
    wrap.appendChild(lead);
    for (const release of list) {
      const item = document.createElement('div');
      item.className = 'whatsnew-item';
      item.style.setProperty('--tl', release.accent);
      item.innerHTML = `<h4><span class="whatsnew-node">${iconSvg(release.icon, { size: 14 })}</span><span></span></h4><ul></ul>`;
      item.querySelector('h4 span:last-child').textContent = tx(release.title);
      item.querySelector('ul').replaceChildren(...release.points.map((point) => {
        const li = document.createElement('li');
        li.textContent = tx(point);
        return li;
      }));
      wrap.appendChild(item);
    }
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'btn btn-primary btn-block';
    go.textContent = t('whatsNewNotes');
    press(go, { sound: null });
    go.addEventListener('click', () => {
      synth.playTap();
      live.sheet.hide();
      import('./updates.js').then((m) => { showScreen('updates'); m.renderUpdates(); });
    });
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'btn btn-ghost btn-block';
    later.textContent = t('whatsNewClose');
    press(later, { sound: null });
    later.addEventListener('click', () => live.sheet.hide());
    wrap.append(go, later);
    body.appendChild(wrap);
  });
}
