/**
 * WHAT THE CREATOR HANDED OVER
 * ----------------------------------------------------------------------------
 * The tools do not reach into a save. They leave a row in public.grants saying
 * what to hand over, and this puts it away.
 *
 * Everything here goes through the game's own writers - addBooster, recordPulls,
 * saveWallet, addInk, saveProfile - rather than restating what those write.
 * That is the whole point of the queue, and it is worth being explicit about
 * why, because the obvious alternative was tried and shipped and did not work:
 *
 *   The shapes drift. An inventory slot is { spec, count } under an id derived
 *   from the spec, not a number under a booster's name. A card carries
 *   `rarityId`, and rarityById() of anything else quietly answers Common. A
 *   write from outside is a guess at all of that, and a wrong guess does not
 *   fail - it lands and is read past. Granted boosters were simply not there;
 *   granted Legendaries came out Common.
 *
 *   And the merge is not neutral. The device rewrites the profile key
 *   immediately before every push, so a profile the creator wrote was always
 *   the older of the two by the time they met, and the merge threw it away
 *   every single time. Level, play time and every owned cosmetic were being
 *   discarded by design.
 *
 * Applied here, on the device, through those writers, neither can happen: the
 * shapes are whatever the game says they are today, and the write is the newest
 * by construction.
 *
 * Nothing here is allowed to break a launch. A project without the table, a
 * lost connection, a row naming a kind this build does not know: each one ends
 * with the game carrying on. A row that fails is left unclaimed and tried again
 * next launch, which is the right way round - the other order loses the gift.
 */
import * as store from '../collection.js';
import { addInk, loadInk } from '../ink.js';
import { rarityById } from '../data/rarities.js';
import { priceFor } from '../pricing.js';
import { specName, specIcon } from '../booster.js';
import { t, getLanguage } from '../i18n.js';
import * as account from '../account.js';
import { openSheet, refreshWallet, state, toast } from './core.js';
import { live } from './live.js';
import { renderPacks } from './packs.js';
import { renderBinder } from './binder.js';
import { renderShop } from './shop.js';
import { refreshLevelBadge } from './regalia.js';

/* --- putting one away ------------------------------------------------------ */

/**
 * Apply one row. Returns a short description of what landed, or null if this
 * build does not know the kind - in which case the row is left unclaimed for a
 * build that does.
 */
function apply(row) {
  const p = row.payload ?? {};
  switch (row.kind) {
    case 'coins': {
      const before = store.loadWallet();
      const after = p.mode === 'set' ? Number(p.amount) : before + Number(p.amount);
      store.saveWallet(Math.max(0, Math.round(after)));
      state.wallet = store.loadWallet();
      return { text: t('giftCoins', { n: Math.round(state.wallet - before) }), icon: 'coin' };
    }
    case 'ink': {
      const before = loadInk();
      if (p.mode === 'set') {
        // There is no "set" in the Ink module on purpose: it is a ledger. The
        // difference is added, which comes to the same balance.
        addInk(Math.max(0, Number(p.amount) - before));
      } else {
        addInk(Number(p.amount));
      }
      return { text: t('giftInk', { n: Math.round(Number(p.amount)) }), icon: 'ink' };
    }
    case 'booster': {
      const spec = p.spec;
      if (!spec || typeof spec !== 'object') return null;
      const count = Math.max(1, Math.round(Number(p.count) || 1));
      store.addBooster(state.inventory, spec, count);
      return { text: `${count} x ${specName(spec)}`, icon: specIcon(spec), spec };
    }
    case 'card': {
      const article = p.article;
      if (!article?.key) return null;
      const rarity = rarityById(p.rarityId);
      const count = Math.max(1, Math.round(Number(p.count) || 1));
      /*
       * The price is worked out here rather than carried in the payload. The
       * game derives a card's price from the article's fame and its tier, and
       * re-derives it on every duplicate pull; a number sent from outside
       * survived exactly one copy and was then recalculated anyway. Deriving it
       * means a granted card is worth what an identical pulled card is worth,
       * which is the only price that does not distort the economy.
       */
      const price = priceFor(Number(article.popularity) || 0, rarity);
      const pulls = Array.from({ length: count }, () => ({
        article, rarity, price,
        packName: t('giftPackName'), packIcon: 'gift', packAccent: null
      }));
      store.recordPulls(state.collection, pulls, { kind: 'open', themeId: null, rarityId: rarity.id, cards: count });
      return { text: `${article.title} x${count}`, icon: 'card', thumbnail: article.thumbnail, rarity };
    }
    case 'takeCard': {
      const entry = state.collection.entries?.[p.key];
      if (!entry) return null;
      delete state.collection.entries[p.key];
      store.saveCollection(state.collection);
      return { text: t('giftTaken', { what: entry.title ?? p.key }), icon: 'minus' };
    }
    case 'profile': {
      /* A patch of dotted paths, applied to the live profile and saved through
         the game's own writer, so this device's stamp is the newest one. */
      let changed = 0;
      for (const [path, value] of Object.entries(p.patch ?? {})) {
        const parts = String(path).split('.');
        let node = state.profile;
        for (const part of parts.slice(0, -1)) {
          if (typeof node[part] !== 'object' || !node[part]) node[part] = {};
          node = node[part];
        }
        node[parts.at(-1)] = value;
        changed++;
      }
      if (!changed) return null;
      store.saveProfile(state.profile);
      return { text: p.say || t('giftProfile'), icon: 'star' };
    }
    case 'profileAdd': {
      /* Adding rather than setting, resolved here so two grants in a row do not
         quietly become one: the creator does not know what the number was. */
      const parts = String(p.path ?? '').split('.').filter(Boolean);
      if (!parts.length) return null;
      let node = state.profile;
      for (const part of parts.slice(0, -1)) {
        if (typeof node[part] !== 'object' || !node[part]) node[part] = {};
        node = node[part];
      }
      const last = parts.at(-1);
      node[last] = Math.max(0, (Number(node[last]) || 0) + (Number(p.by) || 0));
      store.saveProfile(state.profile);
      return { text: p.say || t('giftProfile'), icon: 'star' };
    }
    case 'owned': {
      const bucket = p.bucket;
      if (!['themes', 'frames', 'fx'].includes(bucket)) return null;
      const ids = (Array.isArray(p.ids) ? p.ids : [p.id]).filter(Boolean).map(String);
      if (!ids.length) return null;
      state.profile.owned ??= { themes: [], frames: [], fx: [] };
      const list = (state.profile.owned[bucket] ??= []);
      let added = 0;
      for (const id of ids) if (!list.includes(id)) { list.push(id); added++; }
      store.saveProfile(state.profile);
      return added ? { text: t('giftOwned', { n: added, kind: t(`giftBucket_${bucket}`) }), icon: 'wand' } : null;
    }
    case 'revokeOwned': {
      const bucket = p.bucket;
      if (!['themes', 'frames', 'fx'].includes(bucket)) return null;
      const list = state.profile.owned?.[bucket];
      if (!Array.isArray(list) || !list.includes(p.id)) return null;
      state.profile.owned[bucket] = list.filter((x) => x !== p.id);
      store.saveProfile(state.profile);
      return { text: t('giftRevoked'), icon: 'minus' };
    }
    default:
      return null;
  }
}

/* --- the sheet that says what arrived --------------------------------------- */

/* The creator's own words when there are any, in the device's language. */
const words = (row) => {
  const lang = getLanguage() === 'fr' ? 'fr' : 'en';
  return String(row[`note_${lang}`] || row.note_en || '').trim();
};

export function openGifts(landed) {
  openSheet(t('giftTitle'), (body) => {
    const wrap = document.createElement('div');
    wrap.className = 'notice-sheet notice-gift gift-sheet';
    wrap.dataset.kindLabel = t('noticeKindGift');

    const lead = document.createElement('p');
    lead.className = 'notice-body';
    lead.textContent = t(landed.length === 1 ? 'giftLeadOne' : 'giftLeadMany', { n: landed.length });
    wrap.append(lead);

    /* What actually landed, itemised. A note that says "here is something from
       me" and shows nothing is the complaint this exists to answer. */
    const list = document.createElement('ul');
    list.className = 'gift-list';
    for (const item of landed) {
      const li = document.createElement('li');
      li.className = 'gift-item';
      if (item.thumbnail) {
        const img = document.createElement('img');
        img.className = 'gift-art';
        img.src = item.thumbnail;
        img.alt = '';
        img.loading = 'lazy';
        li.append(img);
      }
      const what = document.createElement('b');
      what.textContent = item.text;
      if (item.rarity) what.style.color = item.rarity.color;
      li.append(what);
      list.append(li);
    }
    wrap.append(list);

    /* Every distinct note the creator attached, once each. */
    const notes = [...new Set(landed.map((x) => x.note).filter(Boolean))];
    for (const note of notes) {
      const said = document.createElement('p');
      said.className = 'notice-reason gift-note';
      said.textContent = note;
      wrap.append(said);
    }
    body.append(wrap);
  });
}

/* --- the pass ---------------------------------------------------------------- */

let running = false;

/**
 * Read what is waiting, put it away, tell them.
 *
 * Safe to call as often as you like: it will not run twice at once, and a row
 * is only claimed once it has actually been applied and written.
 */
export async function collectGifts({ quiet = false } = {}) {
  if (running) return 0;
  const userId = state.account?.session?.user?.id ?? null;
  if (!userId) return 0;
  running = true;
  try {
    const rows = await account.waitingGrants(userId);
    if (!rows.length) return 0;

    const landed = [];
    const done = [];
    for (const row of rows) {
      let out = null;
      try { out = apply(row); }
      catch (err) { console.warn('grant', row.id, err); continue; }
      /* An unknown kind is left unclaimed rather than swallowed: a later build
         that understands it will hand it over then. */
      if (!out) continue;
      done.push(row.id);
      landed.push({ ...out, note: words(row) });
    }
    if (!done.length) return 0;

    // Written first, claimed second. The other order loses a gift when the
    // claim lands and the page dies before the write does.
    await account.claimGrants(done);

    refreshWallet();
    refreshLevelBadge();
    renderPacks();
    renderShop();
    renderBinder();

    if (!quiet) {
      let tries = 0;
      const attempt = () => {
        if (live.sheet?.open || document.querySelector('.reveal')) {
          if (tries++ < 120) { setTimeout(attempt, 500); return; }
          toast(t('giftToast', { n: landed.length }));
          return;
        }
        openGifts(landed);
      };
      attempt();
    }
    return landed.length;
  } catch (err) {
    console.warn('gifts', err);
    return 0;
  } finally {
    running = false;
  }
}
