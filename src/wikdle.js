// @ts-check
/**
 * WIKDLE
 * ============================================================================
 * The encyclopaedia's word of the day, guessed in six rows of five. One
 * puzzle a day for everyone, chosen by the UTC date so the whole world plays
 * the same word and a phone's clock cannot fetch tomorrow's; a guess has to
 * be a real word before it costs a row; and the board is written down after
 * every guess, so a game survives a closed app and cannot be replayed once
 * it is over.
 *
 * Scoring follows the game everyone knows, duplicates included: a letter is
 * GREEN in its right place, YELLOW where the word has an unclaimed copy of it
 * somewhere else, GRAY otherwise, and a word with one E never lights two.
 */
/*
 * The word lists are the largest file in the app and only a round of Wikdle
 * reads them, so they are fetched when the board opens rather than shipped
 * with the first screen. Everything that needs a word awaits loadWords()
 * once; the board does it before it paints.
 */
const words = {};

/** The languages a board exists in; anything else plays in English. */
export const LANGS = ['en', 'fr'];
export const langFor = (language) => (LANGS.includes(language) ? language : 'en');

/** Fetches a language's answer and dictionary lists, once. */
export async function loadWords(lang = 'en') {
  const id = langFor(lang);
  words[id] ??= await (id === 'fr' ? import('./data/wikdle-words-fr.js') : import('./data/wikdle-words.js'));
  return words[id];
}

const lists = (lang = 'en') => {
  const found = words[langFor(lang)];
  if (!found) throw new Error('WIKDLE_WORDS_NOT_LOADED');
  return found;
};
import { t } from './i18n.js';

export const ROWS = 6;
export const COLUMNS = 5;
const STATE_KEY = 'wikster.wikdle.v1';

/** The UTC day, as the calendar date the puzzle belongs to. */
export const utcDay = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/** Milliseconds until the next puzzle, for the countdown after a finished one. */
export const msToNextDay = (now = Date.now()) => {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now;
};

/**
 * The day's word. A hash of the date walks the answer list so consecutive
 * days are not consecutive words, and the walk is a permutation, so a word
 * does not come back until every other has been used.
 */
export function wordForDay(day = utcDay(), lang = 'en') {
  const id = langFor(lang);
  let h = 2166136261;
  // The English seed is the one the board has always used, so a day's word
  // did not change under everyone when a second language arrived.
  for (const ch of id === 'en' ? `wikdle:${day}` : `wikdle:${id}:${day}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const { ANSWERS } = lists(id);
  const n = ANSWERS.length;
  // A stride coprime with the list length visits every word once.
  const stride = 7919 % n || 1;
  const index = (Math.floor(h / 97) * stride + (h % n)) % n;
  return ANSWERS[index];
}

/** Whether a guess is a word the dictionary knows. */
export const isWord = (guess, lang = 'en') => lists(lang).DICTIONARY.has(String(guess ?? '').toLowerCase());

/**
 * One row scored against the answer: an array of 'hit' | 'near' | 'miss'.
 * Exact matches are claimed first, so a letter in its place can never be
 * robbed by an earlier copy of it elsewhere; then each remaining guess
 * letter takes one unclaimed copy from the answer, if there is one.
 */
export function scoreGuess(guess, answer) {
  const g = String(guess).toLowerCase().split('');
  const a = String(answer).toLowerCase().split('');
  const marks = new Array(COLUMNS).fill('miss');
  const left = {};
  for (let i = 0; i < COLUMNS; i++) {
    if (g[i] === a[i]) marks[i] = 'hit';
    else left[a[i]] = (left[a[i]] ?? 0) + 1;
  }
  for (let i = 0; i < COLUMNS; i++) {
    if (marks[i] === 'hit') continue;
    if (left[g[i]] > 0) { marks[i] = 'near'; left[g[i]]--; }
  }
  return marks;
}

/** The keyboard's memory: the best mark seen for every letter. */
export function keyMarks(rows) {
  const rank = { miss: 1, near: 2, hit: 3 };
  const best = {};
  for (const row of rows) {
    row.guess.split('').forEach((ch, i) => {
      const mark = row.marks[i];
      if ((rank[mark] ?? 0) > (rank[best[ch]] ?? 0)) best[ch] = mark;
    });
  }
  return best;
}

/* --- persistence ---------------------------------------------------------- */

const blank = (day, lang = 'en') => ({ day, lang: langFor(lang), rows: [], status: 'playing', startedAt: Date.now(), finishedAt: null });

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
}

/** Today's board, started if there is none. A board from another day is not today's. */
/** Where a day's board is kept: the English one under its day, as it always
 *  was; another language's under the language and the day. */
const gameKey = (day, lang = 'en') => (langFor(lang) === 'en' ? day : `${langFor(lang)}:${day}`);

export function loadGame(day = utcDay(), lang = 'en') {
  const all = readAll();
  const game = all.games?.[gameKey(day, lang)];
  if (game && Array.isArray(game.rows)) return { lang: langFor(lang), ...game };
  return blank(day, lang);
}

function saveGame(game) {
  const all = readAll();
  all.games = all.games ?? {};
  all.games[gameKey(game.day, game.lang)] = game;
  // Only the last few days are kept; the streak and the stats carry the rest.
  const days = Object.keys(all.games).sort((a, b) => a.slice(-10).localeCompare(b.slice(-10)));
  while (days.length > 14) delete all.games[days.shift()];
  writeAll(all);
}

/** Wins, plays, streaks and the guess histogram, kept forever. */
export function loadStats() {
  const all = readAll();
  const s = all.stats ?? {};
  return {
    played: s.played ?? 0, won: s.won ?? 0, streak: s.streak ?? 0, best: s.best ?? 0,
    lastWonDay: s.lastWonDay ?? null,
    guesses: Array.isArray(s.guesses) && s.guesses.length === ROWS ? s.guesses : new Array(ROWS).fill(0)
  };
}

function saveStats(stats) {
  const all = readAll();
  all.stats = stats;
  writeAll(all);
}

/** Yesterday's date string, for the streak. */
const dayBefore = (day) => new Date(new Date(`${day}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);

/**
 * Play one guess. Returns the updated game, or an object with `error`:
 *   'over'      the board is finished
 *   'short'     fewer than five letters
 *   'unknown'   not a word the dictionary knows
 */
export function playGuess(game, guess) {
  if (game.status !== 'playing') return { error: 'over' };
  const word = String(guess ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (word.length !== COLUMNS) return { error: 'short' };
  if (!isWord(word, game.lang)) return { error: 'unknown' };
  const answer = wordForDay(game.day, game.lang);
  const marks = scoreGuess(word, answer);
  const rows = [...game.rows, { guess: word, marks }];
  const won = marks.every((m) => m === 'hit');
  const status = won ? 'won' : rows.length >= ROWS ? 'lost' : 'playing';
  const next = { ...game, rows, status, finishedAt: status === 'playing' ? null : Date.now() };
  saveGame(next);
  if (status !== 'playing') {
    const stats = loadStats();
    stats.played += 1;
    if (won) {
      stats.won += 1;
      stats.guesses[rows.length - 1] += 1;
      stats.streak = stats.lastWonDay === dayBefore(game.day) ? stats.streak + 1 : 1;
      stats.best = Math.max(stats.best, stats.streak);
      stats.lastWonDay = game.day;
    } else {
      stats.streak = 0;
    }
    saveStats(stats);
  }
  return next;
}

/* --- hints ------------------------------------------------------------------
 * Three hints, and each has to be worth what it costs.
 *
 * The first two come from the encyclopaedia: what the word's own article
 * says it is, in a few words, and then the sentence the article opens with,
 * the word itself blanked out wherever it appears. That is a real clue to
 * think with rather than a letter to fill in. The third is a letter in its
 * place, drawn from the answer itself, which cannot be wrong and works with
 * no connection at all; it is also what the first two fall back to when the
 * encyclopaedia has nothing worth reading about the word.
 *
 * A five-letter word usually has a page listing its meanings rather than an
 * article, so the search looks past that page for the article the word
 * most plainly names: "Tiger" over "Tiger (disambiguation)", the city over
 * the football club.
 */

/** What a hint costs, in the day's points, and how many a board may take. */
export const HINT_COST = 120;
export const HINTS_MAX = 3;

const fold = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The word with its letters hidden wherever it appears, accents or not,
 *  plural or not: "▮▮▮▮▮ is the capital of France." */
const mask = (text, word) => String(text ?? '').replace(/\p{L}+/gu, (token) => {
  const flat = fold(token);
  if (!flat.startsWith(word) || flat.length > word.length + 3) return token;
  return '▮'.repeat(word.length) + token.slice(word.length);
});

/** The sentences of a paragraph, whole, short enough to read as a clue. */
const sentences = (text) => String(text ?? '').replace(/\s+/g, ' ').trim()
  .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«"(])/)
  .map((line) => line.trim())
  .filter((line) => line.length >= 12 && line.length <= 240);

/**
 * Whether a line is about the word or about the many things the word can
 * name. A page of meanings, a list, a name page: none of them say anything
 * about the answer.
 */
const EMPTY_MEANING = /(may|can) (also )?refer to|refers? to:|same term|disambiguat|homonym|Wikimedia|list of |liste de |^(surname|given name|family name|nom de famille|prénom)/i;
const useful = (line, word) => {
  if (!line || EMPTY_MEANING.test(line)) return null;
  const hidden = mask(line, word);
  // A line that is nothing but the blanked-out word says nothing.
  if (hidden.replace(/▮/g, '').replace(/[^\p{L}]/gu, '').length < 6) return null;
  return hidden.charAt(0).toUpperCase() + hidden.slice(1);
};

const wikiHost = (lang) => `https://${langFor(lang)}.wikipedia.org`;

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  return res.json();
}

/** The article the word most plainly names: its own page when that is an
 *  article, otherwise the first search hit whose title is the word. */
async function findArticle(word, lang) {
  const summary = await getJson(`${wikiHost(lang)}/api/rest_v1/page/summary/${encodeURIComponent(word)}`).catch(() => null);
  if (summary && (!summary.type || summary.type === 'standard') && !EMPTY_MEANING.test(String(summary.description ?? '')) && !EMPTY_MEANING.test(sentences(summary.extract)[0] ?? '')) return summary;
  const search = await getJson(`${wikiHost(lang)}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`intitle:${word}`)}&srlimit=10&format=json&origin=*`).catch(() => null);
  for (const hit of search?.query?.search ?? []) {
    const title = String(hit.title ?? '');
    const flat = fold(title);
    if (!(flat === word || flat.startsWith(`${word} (`) || flat.startsWith(`${word} `))) continue;
    if (/disambig|homonym/i.test(title)) continue;
    const page = await getJson(`${wikiHost(lang)}/api/rest_v1/page/summary/${encodeURIComponent(title)}`).catch(() => null);
    if (page && (!page.type || page.type === 'standard')) return page;
  }
  return null;
}

const facts = new Map();

/** What the encyclopaedia can say about the word without saying it: the
 *  short description, then the article's opening sentences. Cached. */
async function articleFacts(word, lang) {
  const key = `${langFor(lang)}:${word}`;
  if (facts.has(key)) return facts.get(key);
  let lines = [];
  try {
    const page = await findArticle(word, lang);
    if (page) {
      const about = useful(String(page.description ?? '').trim(), word);
      if (about) lines.push({ kind: 'about', text: about });
      for (const line of sentences(page.extract).slice(0, 4)) {
        const clue = useful(line, word);
        if (clue) lines.push({ kind: 'sentence', text: clue });
        if (lines.length >= 3) break;
      }
    }
  } catch {
    lines = [];
  }
  // Nothing found is not remembered: the next tap may have a connection.
  if (lines.length) facts.set(key, lines);
  return lines;
}

/**
 * Which letter a letter-hint gives away: the same order every time for a
 * given word, so taking the second never repeats the first, and positions
 * the board has already turned green are skipped as worthless.
 */
function letterHint(word, taken, greens = []) {
  const order = [2, 4, 0, 3, 1];   // middle first: the least guessable places
  const known = new Set(greens);
  const free = order.filter((i) => !known.has(i) && !taken.has(i));
  const at = (free.length ? free : order.filter((i) => !taken.has(i)))[0];
  if (at == null) return null;
  taken.add(at);
  return { at, kind: 'letter', text: t('wikdleHintLetter', { n: at + 1, of: COLUMNS, letter: String(word[at]).toUpperCase() }) };
}

/** The positions a board's letter hints have already given away. */
const hintedPositions = (hints) => new Set((hints ?? [])
  .map((h) => (typeof h === 'string' ? null : h?.at))
  .filter((at) => Number.isInteger(at)));

/**
 * A hint for the day's word: the encyclopaedia's, while it has something
 * unsaid and the board has not taken its two; then a letter. Never resolves
 * to nothing while a letter is left: a hint always tells you something.
 */
export async function fetchHint(word, n, { greens = [], hints = [], lang = 'en' } = {}) {
  const taken = hintedPositions(hints);
  const said = new Set((hints ?? []).map(hintText));
  const fromArticle = n < 2 ? (await articleFacts(word, lang)).find((line) => !said.has(line.text)) : null;
  if (fromArticle) return fromArticle;
  return letterHint(word, taken, greens) ?? (await articleFacts(word, lang)).find((line) => !said.has(line.text)) ?? null;
}

/** Record a hint taken on today's board, so it is charged once and shown again after a relaunch. */
export function takeHint(game, hint) {
  const hints = [...(game.hints ?? []), typeof hint === 'string' ? { text: hint } : hint];
  const next = { ...game, hints };
  saveGame(next);
  return next;
}

/** A stored hint's words, whichever shape it was written in. */
export const hintText = (hint) => (typeof hint === 'string' ? hint : String(hint?.text ?? ''));

/** The Wikipedia article of the day's word, to read once the board is done. */
export const articleUrl = (word, lang = 'en') => `https://${langFor(lang)}.wikipedia.org/wiki/${encodeURIComponent(word)}`;

/**
 * What a finished board is worth: more for fewer rows, less for each hint,
 * nothing for a loss.
 *
 * A board is once a day and takes real thought, so it pays like it: solving
 * one is worth a few slot spins rather than a consolation. The floor keeps a
 * slow solve with both hints from ever reading as a waste of a morning.
 */
export const WIKDLE_POINTS = [1400, 1150, 950, 800, 650, 500];
export const basePoints = (game) => (game.status === 'won' ? WIKDLE_POINTS[game.rows.length - 1] ?? 500 : 0);
export const wikdlePoints = (game) =>
  game.status === 'won' ? Math.max(320, basePoints(game) - (game.hints?.length ?? 0) * HINT_COST) : 0;

/**
 * The streak's bonus on the day's coins: five percent a day, up to half
 * again at ten days. A streak is a habit, and a habit pays.
 */
export const STREAK_BONUS_STEP = 0.05;
export const STREAK_BONUS_MAX = 0.5;
export const streakBonus = (streak) => Math.min(STREAK_BONUS_MAX, Math.max(0, (Number(streak) || 0) - 1) * STREAK_BONUS_STEP);

/** Solving in this many rows or fewer hands over a booster on top of the coins. */
export const FAST_SOLVE_ROWS = 2;
/** Every streak of this many days hands over a booster too. */
export const STREAK_BOOSTER_EVERY = 7;

/** The shareable grid of squares, the way people post it. */
export function shareText(game) {
  const square = { hit: '\u{1F7E9}', near: '\u{1F7E8}', miss: '⬛' };
  const head = `Wikster Wikdle ${game.day} ${game.status === 'won' ? game.rows.length : 'X'}/${ROWS}`;
  return [head, ...game.rows.map((row) => row.marks.map((m) => square[m]).join(''))].join('\n');
}
