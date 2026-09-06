/**
 * VERSUS: the two friend games, on screen
 * ----------------------------------------------------------------------------
 * One screen with a table: challenges waiting on me, challenges waiting on
 * a friend, and settled ones with their pay. A new challenge picks a
 * friend, a game, and plays my half on the spot; answering one plays my
 * half of theirs. The arithmetic is in src/versus.js and on the server;
 * this file only paints and asks.
 */
import { t, tx } from '../i18n.js';
import { iconSvg } from '../data/icons.js';
import { press } from '../ui/components.js';
import { synth } from '../ui/sound.js';
import * as store from '../collection.js';
import * as account from '../account.js';
import { rarityById } from '../data/rarities.js';
import { formatAmount, formatViews } from '../pricing.js';
import { fill, h } from '../ui/dom.js';
import { CLASH_CARDS, PAY, SORT_CARDS, canClash, canSort, clashRounds, dealSort, eligible, outcomeFor, snapshot, trueOrder } from '../versus.js';
import { addInk } from '../ink.js';
import { bump } from '../ledger.js';
import { gameStage, reportQuest } from './arcade.js';
import { el, esc, ink, money, openSheet, refreshWallet, showScreen, state, toast } from './core.js';
import { describeError, signedIn, userId } from './gate.js';
import { paintDrawerLinks, pushNote } from './drawer.js';
import { live } from './live.js';
import { paintAvatarInto } from './social.js';
import { updateBadges } from './regalia.js';

const KIND_ICON = { clash: 'collection', sort: 'clock' };
const KIND_COLOR = { clash: '#f472b6', sort: '#38bdf8' };
const kindName = (kind) => t(kind === 'clash' ? 'versusClash' : 'versusSort');

let feed = null;

export function renderVersus({ friendId = null } = {}) {
  el.versusTitle.textContent = t('versusTitle');
  el.versusBack.innerHTML = iconSvg('chevronLeft', { size: 18 });
  const v = state.versus ??= { rows: [], loaded: false, view: 'table', draft: null, busy: false };
  if (friendId) { v.view = 'new'; v.draft = { friendId, kind: null }; }
  paintVersus();
  if (!signedIn()) return;
  loadVersus();
  watchVersus();
}

async function loadVersus() {
  const v = state.versus;
  try {
    v.rows = await account.myChallenges();
    v.loaded = true;
    v.unavailable = false;
  } catch (error) {
    if (String(error?.message) === 'SCHEMA') v.unavailable = true;
  }
  if (state.tab === 'versus') paintVersus();
  paintDrawerLinks();
}

/** The table follows the server while the screen is up. */
function watchVersus() {
  if (feed) return;
  feed = account.openChallengeFeed(userId(), () => { if (state.tab === 'versus') loadVersus(); else feed?.close(), feed = null; });
}

/** How many challenges wait on me: the drawer's dot. */
export const versusWaiting = () => (state.versus?.rows ?? []).filter((c) => c.status === 'open' && c.opponent === userId()).length
  + (state.versus?.rows ?? []).filter((c) => c.status === 'done' && !c.claimed.includes(userId())).length;

/* --- painting ---------------------------------------------------------------- */

function paintVersus() {
  const v = state.versus;
  const body = el.versusBody;
  if (!signedIn()) { fill(body, gameStage('friends', t('versusSignIn'))); return; }
  if (v.unavailable) { fill(body, gameStage('friends', t('versusUnavailable'))); return; }
  if (v.view === 'new') { paintNew(); return; }
  if (v.view === 'play') { paintPlay(); return; }
  paintTable();
}

function friendOf(id) {
  return state.social.friends.find((f) => f.otherId === id) ?? null;
}

function personLine(id, name, level = null) {
  const wrap = h('span.versus-who');
  const mark = h('span.person-mark.is-tiny');
  const friend = friendOf(id);
  paintAvatarInto(mark, friend?.profile ?? { username: name, level: level ?? 1 });
  wrap.append(mark, document.createTextNode(name ?? '?'));
  return wrap;
}

function paintTable() {
  const v = state.versus;
  const me = userId();
  const rows = v.rows;
  const waitingOnMe = rows.filter((c) => c.status === 'open' && c.opponent === me);
  const waitingOnThem = rows.filter((c) => c.status === 'open' && c.challenger === me);
  const settled = rows.filter((c) => c.status !== 'open');

  const intro = h('p.game-note.versus-intro', t('versusIntro'));
  const start = h('button.btn.btn-primary.btn-block', { type: 'button' }, t('versusNew'));
  press(start, { sound: null });
  start.addEventListener('click', () => {
    synth.playTap();
    if (!state.social.friends.length) { toast(esc(t('versusNoFriends')), 'error'); return; }
    v.view = 'new'; v.draft = { friendId: null, kind: null };
    paintVersus();
  });

  const section = (labelKey, list, empty) => h('div.versus-section', [
    h('h3.label', t(labelKey)),
    list.length ? h('div.settings-list.versus-list', list) : h('p.muted.versus-empty', empty)
  ]);

  const row = (c) => {
    const other = c.challenger === me ? { id: c.opponent, name: c.opponentName } : { id: c.challenger, name: c.challengerName };
    const node = h('div.person.versus-row');
    node.style.setProperty('--game', KIND_COLOR[c.kind]);
    node.dataset.challenge = c.id;
    node.dataset.kind = c.kind;
    const art = h('span.person-mark.versus-kind', { html: iconSvg(KIND_ICON[c.kind], { size: 18 }) });
    const copy = h('span.person-copy', [h('b', [kindName(c.kind)]), h('span', [personLine(other.id, other.name)])]);
    const bay = h('span.person-actions');
    if (c.status === 'open' && c.opponent === me) {
      const play = h('button.btn.btn-sm.btn-primary', { type: 'button' }, t('versusPlay'));
      press(play, { sound: null });
      play.addEventListener('click', () => { synth.playTap(); v.view = 'play'; v.draft = { challenge: c }; paintVersus(); });
      const no = h('button.btn.btn-sm.btn-ghost', { type: 'button' }, t('versusDecline'));
      press(no, { sound: null });
      no.addEventListener('click', async () => {
        no.disabled = true;
        try { await account.declineChallenge(c.id); synth.playTap(); loadVersus(); } catch (error) { toast(esc(versusError(error)), 'error'); no.disabled = false; }
      });
      bay.append(play, no);
    } else if (c.status === 'open') {
      bay.append(h('span.chip', t('versusWaiting')));
    } else if (c.status === 'declined') {
      bay.append(h('span.chip', t('versusDeclined')));
    } else {
      const { outcome } = outcomeFor(c, me);
      const tag = h(`span.versus-outcome.is-${outcome}`, t(outcome === 'win' ? 'versusWon' : outcome === 'lose' ? 'versusLost' : 'versusDraw'));
      copy.querySelector('span').append(h('span.versus-score.tabular', ` ${c.result?.scores?.challenger ?? 0}-${c.result?.scores?.opponent ?? 0}`));
      const see = h('button.btn.btn-sm.btn-ghost', { type: 'button' }, t('versusSee'));
      press(see, { sound: null });
      see.addEventListener('click', () => { synth.playTap(); openResult(c); });
      if (!c.claimed.includes(me)) {
        const claim = h('button.btn.btn-sm.btn-primary', { type: 'button' }, t('versusClaim'));
        press(claim, { sound: null });
        claim.addEventListener('click', () => claimChallenge(c, claim));
        bay.append(tag, claim, see);
      } else bay.append(tag, see);
    }
    node.append(art, copy, bay);
    return node;
  };

  fill(body(), h('div.versus', [
    intro, start,
    section('versusOnYou', waitingOnMe.map(row), t('versusOnYouEmpty')),
    section('versusOnThem', waitingOnThem.map(row), t('versusOnThemEmpty')),
    section('versusSettled', settled.map(row), v.loaded ? t('versusSettledEmpty') : t('versusLoading'))
  ]));
}

const body = () => el.versusBody;

/* --- a new challenge --------------------------------------------------------- */

function paintNew() {
  const v = state.versus;
  const d = v.draft;
  const back = h('button.btn.btn-ghost.btn-sm', { type: 'button' }, t('back'));
  press(back, { sound: null });
  back.addEventListener('click', () => { synth.playTap(); v.view = 'table'; v.draft = null; paintVersus(); });

  // Step one: the friend.
  const friends = state.social.friends;
  const who = h('div.settings-list.versus-list', friends.map((f) => {
    const row = h('button.person.is-tick', { type: 'button' });
    row.classList.toggle('is-on', d.friendId === f.otherId);
    const mark = h('span.person-mark');
    paintAvatarInto(mark, f.profile);
    row.append(mark, h('span.person-copy', [h('b', f.profile.username), h('span', t('friendsLevelLine', { n: f.profile.level ?? 1, rank: '' }).replace(/ ·.*$/, ''))]));
    press(row, { sound: null });
    row.addEventListener('click', () => { synth.playTap(); d.friendId = f.otherId; paintVersus(); });
    return row;
  }));

  // Step two: the game.
  const entries = store.allEntries(state.collection);
  const games = h('div.versus-games', ['clash', 'sort'].map((kind) => {
    const ok = kind === 'clash' ? canClash(entries) : canSort(entries);
    const tile = h('button.game-tile.versus-game', { type: 'button', disabled: !ok });
    tile.style.setProperty('--game', KIND_COLOR[kind]);
    tile.classList.toggle('is-on', d.kind === kind);
    tile.dataset.kind = kind;
    tile.innerHTML = `<span class="game-tile-art">${iconSvg(KIND_ICON[kind], { size: 26 })}</span><span class="game-tile-copy"><b></b><p></p></span>`;
    tile.querySelector('b').textContent = kindName(kind);
    tile.querySelector('p').textContent = ok ? t(kind === 'clash' ? 'versusClashNote' : 'versusSortNote') : t(kind === 'clash' ? 'versusClashNeed' : 'versusSortNeed', { n: kind === 'clash' ? CLASH_CARDS : SORT_CARDS });
    press(tile, { sound: null });
    tile.addEventListener('click', () => { synth.playTap(); d.kind = kind; paintVersus(); });
    return tile;
  }));

  const go = h('button.btn.btn-primary.btn-block', { type: 'button', disabled: !(d.friendId && d.kind) }, t('versusPlayHalf'));
  press(go, { sound: null });
  go.addEventListener('click', () => {
    synth.playTap();
    v.view = 'play';
    v.draft = { friendId: d.friendId, kind: d.kind, fresh: true };
    paintVersus();
  });

  fill(body(), h('div.versus', [
    back,
    h('h3.label', t('versusPickFriend')), who,
    h('h3.label', t('versusPickGame')), games,
    go
  ]));
}

/* --- playing a half ------------------------------------------------------------- */

function paintPlay() {
  const v = state.versus;
  const d = v.draft;
  const kind = d.fresh ? d.kind : d.challenge.kind;
  const back = h('button.btn.btn-ghost.btn-sm', { type: 'button' }, t('back'));
  press(back, { sound: null });
  back.addEventListener('click', () => { synth.playTap(); v.view = d.fresh ? 'new' : 'table'; if (d.fresh) v.draft = { friendId: d.friendId, kind: d.kind }; paintVersus(); });
  const entries = store.allEntries(state.collection);

  const submit = async (half) => {
    if (v.busy) return;
    v.busy = true;
    try {
      if (d.fresh) {
        await account.sendChallenge(d.friendId, kind, half);
        toast(esc(t('versusSent', { name: friendOf(d.friendId)?.profile?.username ?? '?' })), 'ok');
        synth.playResolved();
      } else {
        const settled = await account.answerChallenge(d.challenge.id, half);
        synth.playFanfare();
        v.view = 'table';
        v.draft = null;
        await loadVersus();
        openResult(settled);
        v.busy = false;
        return;
      }
      v.view = 'table';
      v.draft = null;
      await loadVersus();
    } catch (error) {
      toast(esc(versusError(error)), 'error');
      synth.playDenied();
    }
    v.busy = false;
    if (state.tab === 'versus') paintVersus();
  };

  if (kind === 'clash') {
    fill(body(), h('div.versus', [back, h('p.game-note.versus-intro', t('versusClashPick', { n: CLASH_CARDS })), clashPicker(entries, (cards) => submit({ cards }))]));
    return;
  }
  const cards = d.fresh ? dealSort(entries) : (d.challenge.payload?.cards ?? []);
  if (!cards) { fill(body(), gameStage('clock', t('versusSortNeed', { n: SORT_CARDS }))); return; }
  fill(body(), h('div.versus', [back, h('p.game-note.versus-intro', t('versusSortPlay', { n: SORT_CARDS })), sortArena(cards, (order, ms) => submit(d.fresh ? { cards, order, ms } : { order, ms }))]));
}

/** Five of my cards, with their readers showing: the hand is the strategy. */
function clashPicker(entries, onDone) {
  const pool = eligible(entries).sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 80);
  const picked = new Set();
  const list = h('div.pick-list.versus-pick');
  const count = h('p.versus-count.tabular');
  const done = h('button.btn.btn-primary.btn-block', { type: 'button', disabled: true }, t('versusClashSend'));
  const paint = () => {
    count.textContent = t('versusPicked', { n: picked.size, total: CLASH_CARDS });
    done.disabled = picked.size !== CLASH_CARDS;
  };
  list.replaceChildren(...pool.map((c) => {
    const row = h('button.pick-row.is-tick', { type: 'button' });
    row.dataset.key = c.key;
    row.innerHTML = `<span class="pick-thumb"></span><span class="pick-copy"><b></b><span></span></span><span class="pick-tick">${iconSvg('check', { size: 15 })}</span>`;
    if (c.thumbnail) row.querySelector('.pick-thumb').style.backgroundImage = `url("${c.thumbnail}")`;
    row.querySelector('b').textContent = c.title;
    const sub = row.querySelector('.pick-copy span');
    sub.textContent = `${tx(rarityById(c.rarityId).name)} · ${formatViews(c.views)}`;
    sub.style.color = rarityById(c.rarityId).color;
    press(row, { sound: null });
    row.addEventListener('click', () => {
      if (picked.has(c.key)) picked.delete(c.key);
      else if (picked.size < CLASH_CARDS) picked.add(c.key);
      else { synth.playDenied(); return; }
      row.classList.toggle('is-on', picked.has(c.key));
      synth.playTap();
      paint();
    });
    return row;
  }));
  press(done, { sound: null });
  done.addEventListener('click', () => { synth.playTap(); onDone(pool.filter((c) => picked.has(c.key)).map(snapshot)); });
  paint();
  return h('div.versus-clash', [count, list, done]);
}

/** Eight cards, shuffled; tap them most read first. The clock starts on the first tap. */
function sortArena(cards, onDone) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const order = [];
  let startedAt = 0;
  const clock = h('span.wikdle-pill.versus-clock.tabular', '0.0 s');
  const strip = h('div.versus-strip');
  const grid = h('div.versus-grid');
  const undo = h('button.btn.btn-ghost.btn-sm', { type: 'button', disabled: true }, t('versusUndo'));
  let timer = null;
  const tick = () => { clock.textContent = `${((Date.now() - startedAt) / 1000).toFixed(1)} s`; };
  const paint = () => {
    strip.replaceChildren(...Array.from({ length: SORT_CARDS }, (_, i) => {
      const key = order[i];
      const card = key ? cards.find((c) => c.key === key) : null;
      return h('span.versus-slot', { class: card ? 'is-filled' : '' }, [h('b.tabular', String(i + 1)), card ? h('span', card.title) : h('span.muted', '')]);
    }));
    for (const node of grid.children) node.classList.toggle('is-placed', order.includes(node.dataset.key));
    undo.disabled = order.length === 0;
  };
  grid.replaceChildren(...shuffled.map((c) => {
    const tile = h('button.versus-card', { type: 'button' });
    tile.dataset.key = c.key;
    tile.innerHTML = `<span class="versus-card-art"></span><b></b>`;
    if (c.thumbnail) tile.querySelector('.versus-card-art').style.backgroundImage = `url("${c.thumbnail}")`;
    tile.querySelector('b').textContent = c.title;
    press(tile, { sound: null });
    tile.addEventListener('click', () => {
      if (order.includes(c.key)) return;
      if (!startedAt) { startedAt = Date.now(); timer = setInterval(tick, 100); }
      order.push(c.key);
      synth.playTap();
      paint();
      if (order.length === SORT_CARDS) {
        clearInterval(timer);
        const ms = Date.now() - startedAt;
        tick();
        onDone([...order], ms);
      }
    });
    return tile;
  }));
  press(undo, { sound: null });
  undo.addEventListener('click', () => { order.pop(); synth.playTap(); paint(); });
  paint();
  return h('div.versus-sort', [h('div.wikdle-head', [clock, undo]), strip, grid]);
}

/* --- the reckoning ------------------------------------------------------------------ */

function openResult(c) {
  const me = userId();
  const { side, outcome } = outcomeFor(c, me);
  const names = { challenger: c.challengerName ?? '?', opponent: c.opponentName ?? '?' };
  openSheet(kindName(c.kind), (body) => {
    const wrap = h('div.versus-result');
    const line = h(`p.versus-outcome-line.is-${outcome}`, t(outcome === 'win' ? 'versusWonLine' : outcome === 'lose' ? 'versusLostLine' : 'versusDrawLine', { name: names[side === 'challenger' ? 'opponent' : 'challenger'] }));
    const score = h('p.versus-final.tabular', `${names.challenger} ${c.result?.scores?.challenger ?? 0} · ${c.result?.scores?.opponent ?? 0} ${names.opponent}`);
    wrap.append(line, score);
    if (c.kind === 'clash') {
      const rounds = clashRounds(c.payload?.cards ?? [], c.reply?.cards ?? []);
      wrap.append(h('div.versus-rounds', rounds.map((r, i) => h('div.versus-round', { class: `is-${r.winner}` }, [
        h('span.versus-round-n.tabular', String(i + 1)),
        h('span.versus-round-card', { class: r.winner === 'challenger' ? 'is-win' : '' }, [h('b', r.challenger?.title ?? ''), h('small', formatViews(r.challenger?.views ?? 0))]),
        h('span.duel-vs', 'vs'),
        h('span.versus-round-card', { class: r.winner === 'opponent' ? 'is-win' : '' }, [h('b', r.opponent?.title ?? '?'), h('small', r.opponent ? formatViews(r.opponent.views) : '')])
      ]))));
    } else {
      const truth = trueOrder(c.payload?.cards ?? []);
      const cards = c.payload?.cards ?? [];
      const ms = c.result?.ms ?? {};
      wrap.append(h('p.versus-times.tabular', t('versusTimes', { a: names.challenger, ta: ((Number(ms.challenger) || 0) / 1000).toFixed(1), b: names.opponent, tb: ((Number(ms.opponent) || 0) / 1000).toFixed(1) })));
      wrap.append(h('div.versus-rounds', truth.map((key, i) => {
        const card = cards.find((x) => x.key === key);
        const mine = (side === 'challenger' ? c.payload?.order : c.reply?.order)?.[i] === key;
        return h('div.versus-round', { class: mine ? 'is-mine-right' : '' }, [h('span.versus-round-n.tabular', String(i + 1)), h('span.versus-round-card', [h('b', card?.title ?? '?'), h('small', formatViews(card?.views ?? 0))]), h('span.versus-mark', { html: iconSvg(mine ? 'check' : 'close', { size: 14 }) })]);
      })));
    }
    if (!c.claimed.includes(me)) {
      const claim = h('button.btn.btn-primary.btn-block', { type: 'button' }, t('versusClaim'));
      press(claim, { sound: null });
      claim.addEventListener('click', () => claimChallenge(c, claim, { sheet: true }));
      wrap.append(claim);
    }
    body.appendChild(wrap);
  });
}

async function claimChallenge(c, btn, { sheet = false } = {}) {
  btn.disabled = true;
  const me = userId();
  const { outcome } = outcomeFor(c, me);
  try {
    const paid = await account.claimChallenge(c.id);
    const pay = PAY[outcome] ?? PAY.lose;
    store.saveWallet(store.loadWallet() + paid);
    addInk(pay.ink);
    refreshWallet();
    c.claimed.push(me);
    bump(state.profile, 'versusPlayed');
    if (outcome === 'win') bump(state.profile, 'versusWins');
    store.saveProfile(state.profile);
    reportQuest('versus', { won: outcome === 'win', kind: c.kind });
    synth.playCoins();
    toast(`${t('versusPaid', { amount: money(paid) })} + ${ink(pay.ink)}`, 'ok');
    updateBadges();
    if (sheet) live.sheet.hide();
    if (state.tab === 'versus') paintVersus();
  } catch (error) {
    toast(esc(versusError(error)), 'error');
    synth.playDenied();
    btn.disabled = false;
  }
}

/** A refused call, in words. */
function versusError(error) {
  const code = String(error?.message ?? '');
  const key = {
    NOT_FRIEND: 'versusErrFriend', TOO_MANY: 'versusErrMany', BAD_HAND: 'versusErrHand', GONE: 'versusErrGone',
    SETTLED: 'versusErrSettled', NOT_DONE: 'versusErrNotDone', CLAIMED: 'versusErrClaimed', SCHEMA: 'versusUnavailable'
  }[code];
  return key ? t(key) : describeError(error);
}

/** A challenge arriving while the screen is elsewhere: the bell rings. */
export function noteChallenge(row, type) {
  const me = userId();
  if (!row || !me) return;
  if (type === 'INSERT' && row.opponent === me) {
    const name = friendOf(row.challenger)?.profile?.username ?? t('friendSomeone');
    pushNote('dice', t('versusNoteNew', { name, game: kindName(row.kind) }), 'versus');
  } else if (type === 'UPDATE' && row.status === 'done' && row.challenger === me) {
    const name = friendOf(row.opponent)?.profile?.username ?? t('friendSomeone');
    const { outcome } = outcomeFor(row, me);
    pushNote('trophy', t(outcome === 'win' ? 'versusNoteWon' : outcome === 'lose' ? 'versusNoteLost' : 'versusNoteDraw', { name, game: kindName(row.kind) }), 'versus');
  }
  if (state.versus) { state.versus.loaded = false; if (state.tab === 'versus') loadVersus(); }
}
