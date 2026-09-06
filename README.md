# Wikster

A trading card game built out of Wikipedia. You buy booster packs, tear them
open with your thumb, and the cards inside are real Wikipedia articles: a
photograph, a title, the opening lines, and a rarity decided by how many
people actually read that page last month.

It runs as a website and as an Android app, from one codebase and one build.

- **Play in a browser:** https://jupiteriansoul.github.io/Wikster/
- **Android:** the newest APK is always the `apk-latest` release of this
  repository.

The whole app is vanilla JavaScript with no framework. Vite bundles it, the
Android app is a WebView around the same `dist/`, and Supabase holds accounts
and the social features. If you want to read the source, `src/main.js` is the
application and everything else is a module it pulls in.

## Contents

- [Running it](#running-it)
- [How a card is made](#how-a-card-is-made)
- [Boosters](#boosters)
- [Rarity](#rarity)
- [Money](#money)
- [The collection](#the-collection)
- [Progression](#progression)
- [Accounts and the social side](#accounts-and-the-social-side)
- [Themes, sound and motion](#themes-sound-and-motion)
- [The Android app](#the-android-app)
- [The website](#the-website)
- [Project layout](#project-layout)
- [Names that cannot change](#names-that-cannot-change)
- [Credits](#credits)

## Running it

Node 20 or newer.

```sh
npm install
npm run dev        # development server on :5173
npm run build      # production build into dist/
npm run preview    # serve the built dist/ on :4173
```

`npm run build` is the whole product. `dist/` is what the website serves and
what the Android app wraps, byte for byte (less the music, which the app
plays from the site).

```sh
npm test               # npm run check, then every browser suite
npm run check          # i18n parity, the sweep, the unit checks, the type check
npm run test:offline   # the suites that need no backend
npm run test:stub      # the suites that run against the fake Supabase
npm run shots          # every screen at 1440x900, for looking at
node tools/economy-report.mjs   # where Buckarooz come from and go
```

The suites live in `tests/suites` and run with Playwright against a real
build served by `vite preview`; `tests/run.mjs` builds each mode into its
own folder first, so editing while a suite runs changes nothing about what
it tests. `tests/lib/supastub.mjs` is a Supabase that answers from memory
(auth, saves and their history, friends, chat, trades, auctions, the codex,
the leaderboard), which is what lets the social suites run without a
project. `tests/unit` holds Node-only checks of the pure modules. The same
`npm test` runs on every push in `.github/workflows/tests.yml`.

`jsconfig.json` and `npm run typecheck` run TypeScript over the JavaScript:
the pure modules carry `// @ts-check`, `src/types.js` names the shapes
(Card, Entry, PackSpec, SaveEnvelope) and `src/env.d.ts` the build's globals.

The app works with no backend at all: without Supabase credentials it runs
fully offline-capable and local, and only the account features are missing.
To turn those on, see [Accounts](#accounts-and-the-social-side).

## How a card is made

A card is one Wikipedia article. Drawing one means:

1. **Find candidates.** A booster's subject is a set of search queries. The
   draw runs two of them and pools the results, so a whole pack costs about
   one search rather than one per card.
2. **Insist on a picture.** A card with no image is not a card. The draw takes
   the lead image, and if there is none it goes looking for the first real
   photograph on the page. An article that cannot produce one is skipped, not
   shown blank.
3. **Insist on real text.** Disambiguation pages, list articles and stubs
   whose opening lines say nothing are rejected.
4. **Ask how many people read it.** Once the draw has settled on its cards,
   one request fetches their monthly readers, and that number is each
   article's **fame**: it sets the price. It does not decide the rarity; the
   booster does, below. A pack is never held for it: past a couple of
   seconds the card is priced on its size and corrected on its next pull.

Cards are drawn in the language the app is set to. A French card that has no
French article falls back to the English one rather than vanishing.

## Boosters

A booster has a **subject**, a **size** (3 to 7 cards) and sometimes a
**tier**.

There are 26 subjects, from Animals and Space to Cinema, Football and Memes.
Most are searches; a subject may instead be a curated roll, its articles named
outright in `src/data/packs.js`, and the booster then deals a random hand from
that list.

### Rarity is the print

Rarity is rolled when a pack is opened, one roll per card, off the booster's
odds row. The roll is the card's rarity: its **print**, the way a physical
card is a common or a foil of the same picture. The article is drawn from the
subject separately. The two are independent, which is the whole point: an
Epic pack deals Epics at its printed rate in every subject, thin or famous,
and nothing has to be owed, capped or repaired afterwards.

A tier booster rolls on a better row and, on top of that, always contains at
least one card of its tier. A card above the promised tier keeps the promise:
a Legendary in an Epic pack is not a broken one.

| Booster | Com | Unc | Rare | Epic | Leg | Myth | Exo | Pris |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| basic | 68 | 18 | 8 | 3.5 | 1.6 | 0.6 | 0.25 | 0.05 |
| Uncommon | 50 | 28 | 13 | 5.5 | 2.2 | 0.9 | 0.35 | 0.05 |
| Rare | 34 | 30 | 20 | 9 | 4.2 | 1.8 | 0.85 | 0.15 |
| Epic | 20 | 26 | 26 | 16 | 7.5 | 3 | 1.3 | 0.2 |
| Legendary | 11 | 18 | 25 | 23 | 14 | 6 | 2.6 | 0.4 |
| Mythic | 6 | 11 | 19 | 24 | 22 | 12 | 5 | 1 |
| Exotic | 3 | 6 | 12 | 19 | 24 | 20 | 13 | 3 |
| Prismatic | 1.5 | 3 | 7 | 13 | 20 | 24 | 20 | 11.5 |

The whole table lives in `src/data/odds.js`. Booster prices are computed from
it, so tuning a row reprices the shop rather than desynchronising it.

Pull an article you already own at a better print and the better print takes
its place in the collection, copies kept. That is what a duplicate is for.

### Custom boosters

You can build a booster out of any Fandom wiki: type a subject, the app probes
for a matching wiki, and if it finds one with real content the booster draws
from it. Getting a usable picture out of Fandom is the hard part, so the draw
tries the page image, the original upload, the lead image and finally any
image on the page, rejecting thumbnails too small to fill a card.

Custom boosters are private to whoever built them and never enter the shared
card index.

## Rarity

Eight tiers, rolled per card as described above, plus **Special**, which sits
outside the table and cannot be drawn.

Each tier has its own treatment on the card: foils, refraction, glare that
follows the phone's gyroscope, and for the top tiers an animated surface. The
odds sheet in the app shows the exact rates for the booster in front of you.

A collection written before prints existed keeps the tiers it had: a card
with no tier on record is graded once from its fame, and never again.

## Money

The currency is Buckarooz. A card's price comes from its fame and its print,
selling returns a fraction of that price, and boosters are priced from
what they can be expected to contain, so opening and selling always loses
money on average. That is deliberate: the collection is the point, not the
arbitrage.

Income comes from a stipend paid on every shop restock (two hours), a daily
gift, timed boosters that build up whether the app is open or not, levelling
up, and a five-a-day quiz.

There is a second currency, Ink, and it buys only looks: the Atelier takes it
for themes, level frames and card effects, and nothing else does. Ink is paid
in small steady amounts from many places, so that it is earned rather than
farmed: every level (more at the round ones), every achievement, every daily
quest by its tier, every rung of the season track and the day's season quest,
the seventh gift of a week, a guild goal met and a guild match won. Buckarooz
can be pressed into Ink at the Atelier's counter at a fixed rate, dear enough
that a theme stays a real purchase. The balance lives under its own key and
travels with the save; what has been bought lives on the profile, so a
purchase follows the player between devices. The module is `src/ink.js`.

The shop restocks every two hours with a spotlight discount, a free shelf that
is always stocked so an empty wallet is never a dead end, six subjects, a
vault of tier boosters, and everything you have built yourself.

## The collection

Cards are filed into **albums**, one per subject, plus albums for custom wikis
and for each personal booster. An album knows its real total: for a searched
subject it is the number of matching articles on Wikipedia, so most albums
cannot be finished, and that is the joke.

Duplicates stack as `×2`. The binder has an album shelf and a **classic**
view of every card at once, grouped by subject, with a search field of its
own.

Since most albums cannot be finished, each has **medals** that can be
(`ALBUM_TIERS` in `src/albums.js`): Bronze at 75 different cards of the
subject, Silver at 200, Gold at 500, Diamond at 1,000, each paying coins and
from Silver up a booster of the subject with a guaranteed tier. An album
smaller than a rung awards it on being complete instead; the personal
albums behind a code have none. The rung reached shows as a disc on the
cover, and the open album carries the four rungs with the one to claim.

Three spare copies of a card **fuse** into a one-card booster guaranteed a
tier above the card's (the fourth Cat becomes an Epic pull), from the card's
own sheet; a Prismatic has nowhere to go. When a card is looked at, its
article is checked once a week (`src/wiki/repair.js`): a renamed page brings
the card's title and text up to date, a deleted one is said to be gone. The
card itself is never taken away.

Cards are drawn from the whole encyclopaedia, and the whole encyclopaedia
includes articles nobody wants opening on a bus, so Settings carries **Hide
sensitive content**. It reads the card's own title, description and opening
against a short list of unambiguous terms (`src/sensitive.js`) and hides the
picture on the ones that match, in the collection, the albums and the picture
picker. Nothing is removed, no draw changes, and an open card can be
uncovered with a tap: the setting hides a picture, it does not edit the
game.

Alongside it, the **Card Index** is the shared record of every card anyone has
pulled, and a **wishlist** marks cards you want, which friends and the auction
floor can both see.

## Progression

- **Levels** to 500, earned by opening boosters, with a frame for your avatar
  from level 1 and a new tier of it every 10 levels, across 8 styles.
- **100 achievements** in chains, from your first booster to genuinely absurd
  collection milestones.
- **Badges** in 10 styles, worn four at a time on your profile.

### Achievements, badges and the ledger

There are over three hundred and fifty achievements in some hundred
families, and every one is computed from the save rather than awarded at a
moment that could be missed. The first hundred read the collection and the
profile; the rest read a ledger of things done (`src/ledger.js`, kept on the
profile under `ledger`): every quest report the app makes is counted there
(boosters by kind, subjects, new and famous pulls, Wikdle plays and wins,
spins, shop purchases, sales, cards read), and the places a report does not
reach bump their own count (guild goals and matches, the table and the hall,
messages, hearts, bids, lots, Ink earned and spent, themes and frames and
effects worn, days played). Achievements pay coins or a booster, and Ink.

Badges hang off the hard end of a family and rise in rank as the family is
climbed: ninety-four of them, and no two alike. Each has its own line art,
its own foil (the chain badges take theirs from a golden-angle walk round the
hue wheel, in three foil families) and one of six shapes. The badges a player
has earned are published with their public stats (`badges` on `profiles`,
V12) so a friend's page shows their whole shelf without reading their save.

### Dressing the collection

Customization holds two pickers beyond the theme, and shows only what is
owned: the door to the rest is the Atelier.

**Card effects** choose the look each rarity wears, one row per tier. Classic,
the treatment drawn for that tier, is always there; the Atelier sells five
alternates for each rarity, forty in all and no two built the same way. A
Common can wear pencil hatching, a crease, a postmark, dust in a shaft of
light or a halftone screen; a Prismatic a turning spectrum, shattered glass, an
aurora curtain, a starfield or a crown. Each is bought for one rarity and
dresses every card of that tier; the alternates that paint a colour paint in
the rarity's own, so a choice never costs the ladder its legibility. A chosen
effect takes the tier's own dressing off and paints its own on the plate over
the art and under the text. The table is `src/data/fx.js`; the CSS lives under
`[data-fx]` in `src/styles/cards.css`.

**Level frames** open at a level of their own, from 15 to 200 across eight
styles, and a ninth, the Singularity, waits at the level cap of 500. A locked
frame still shows its drawing, since the point is to see what you are climbing
towards. Ten more are sold in the Atelier and worn from level 1 once bought:
ivy, clockwork, a tide, a storm, a honeycomb, an inkwell, folded paper, paper
lanterns, stained glass and a comet; they climb the same fifty tiers as the
rest.

**Themes** other than the seasons' and the codes' are sold in the Atelier too;
the default is free, and the one being worn always stays in the picker.

## Accounts and the social side

Accounts are optional. Signed in, you get cloud save across devices, plus
friends, chat, trading, gifting, an auction house where cards go to real
bidders, and presence.

The backend is Supabase. To run your own:

1. Create a project.
2. Run `supabase/schema.sql` in the SQL editor. It creates the tables and,
   more importantly, the row level security policies.
3. Put the project URL and the **publishable** key in `.env.production`:

   ```
   VITE_SUPABASE_URL=https://yourproject.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```

The publishable key is meant to ship inside the client and is committed here
on purpose. It grants nothing on its own: row level security is the boundary,
and every policy in `schema.sql` is written on the assumption that anyone can
see this key. The **secret** key must never appear in this repository or in a
build.

Syncing is per key, not per blob (`src/save.js`, `src/account/save.js`).
Every storage key in the save carries the time it last changed on the
device that wrote it, and a push first looks at the server's row: if another
device wrote since this one last looked, the two saves are merged key by
key, the newer copy of each winning and a tie going to the account, and
keys the other device changed later come down before the merged save goes
up. A device that has already played the account merges the same way at
sign-in; a fresh device, or one holding another account's save, takes the
account's save whole, which is what carries a collection onto a new phone.
The local save stays authoritative for the session you are in, so a dropped
connection never costs you cards.

Under all of it the server keeps the save's history: `saves_history` in
`schema.sql` files the row being replaced on every write (thinned with age:
the last hour, one an hour for a day, one a day after that, never more than
forty) and always the one from before an erase. Settings, Data, **Backups**
lists them and puts one back; the save it replaces is filed first, so a
restore can be undone. A project that ran an older `schema.sql` has to run
the current one again for the table and for the `submit_score` function the
newer games use.

### Ending a save, and ending an account

Settings, Data, holds three destructive buttons that do three different things.

**Remove all cards** empties the collection and keeps the player: level,
experience, achievements and personal boosters all stay.

**Erase everything** ends the save and signs you out. The save row is deleted,
the profile's progress is reset, the wishlist, friends, messages, deliveries,
trades and auctions go, and the device is cleared down to the session token, so
the app comes back at the welcome screen. Signing in again finds an account
with nothing stored against it. Signing out is the point: without it the cloud
save simply comes back down.

**Delete account** removes the account itself, so the address stops working and
is free to sign up with again. This one needs an edge function, because
deleting a row in `auth.users` takes the service key and that key must never
ship in an APK:

```sh
supabase secrets set SERVICE_ROLE_KEY=...   # Settings, API, service_role
supabase functions deploy delete-account
```

The function takes the caller's id from their token and never from the request
body, so it can only ever delete the person asking.

To wipe **every** account at once, `supabase/wipe-all-accounts.sql` is run by
hand in the SQL editor. It is deliberately not something the app can do.

## Themes, sound and motion

15 themes, each a full palette with its own animated backdrop, its own
synthesised sound kit, and its own launcher icon on Android. The app's mark is
painted in the current theme's accents, so the drawer, the splash and the sign
in gate all follow a theme change.

Every sound effect is synthesised at runtime from oscillators, so the app
ships no sound files for its own interface. Music is a shuffle of found jazz
recordings, credited in `src/assets/music/LICENSE.md`.

A low power mode cuts the backdrop and the card effects for phones that get
hot, and everything respects `prefers-reduced-motion`.

## The Android app

A WebView that opens the published site. The site updates the moment it is
published, so the app does too: every change reaches the phone on its next
launch, with no reinstall. The APK only needs rebuilding when the shell itself
changes (a new launcher icon, a WebView setting), which is rare.

The built `dist/` still ships inside the APK, as the fallback for when the
site cannot be reached: the shell opens it if the phone has no network, or if
the site's page fails to load. It is served over a real `https://` origin by
`WebViewAssetLoader` so that `fetch()` to Wikipedia obeys ordinary CORS rules
instead of the restrictions a `file://` page would face. The two copies are
different origins, so they keep separate device storage; the account's save
is what carries a collection between them.

```sh
npm run build
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

CI builds it on every push and publishes it as the rolling `apk-latest`
release.

### Signing, and why the key is in the repo

`android/keystore/` holds a signing key, committed deliberately, used by both
build types.

Android identifies an app by its signature. Without a fixed key, every CI
build is signed by a freshly generated one, so every build looks like a
different app: updates refuse to install, and uninstalling to make room takes
the player's whole collection with it. The committed key buys the one thing
that matters for a sideloaded hobby app, which is that every build installs
over the last one and keeps the save. It protects nothing else, and the
password is in `build.gradle` next to it. Anything shipping for real should
generate a proper key and pass it through CI secrets.

### Play Protect

Android offers to scan any sideloaded APK with Play Protect. **No application
can switch that off**; it belongs to the device. You can decline the scan when
prompted, or turn it off in Play Store → Play Protect → Settings.

What the app can do is not make it worse, so what ships is a release build.
A debug build sets the `debuggable` flag, which is the thing Android words its
warnings most strongly about.

## The arcade: minigames, quests and the leaderboard

Behind the shop there is a small arcade, in the drawer as **Minigames**,
**Daily quests** and **Leaderboard**. The rule that holds all of it together
is that nothing which pays out is decided on the phone.

**Wikdle** (`src/wikdle.js`, words in `src/data/wikdle-words.js`) is the
five-letter word of the day in six rows. The word is a function of the UTC
date, so everyone on Earth has the same one and a phone's clock cannot fetch
tomorrow's; a guess has to be in the dictionary before it costs a row;
duplicate letters are scored the way the original scores them (one E in the
word never lights two); and the board is written down after every guess, so
it survives a closed app and cannot be replayed once it is over. Two hints
are offered for 120 of the day's points each, and both have to earn it: the
first is always a letter in its place, read off the answer itself, so it
needs no connection and can never be vague; the second is what the word
means, taken from Wikipedia and only when the page is a real article rather
than a list of the things the word can name, and another letter when it is
not. A solve is worth 1,400 points in one guess down to 500 in six, never
less than 320 after hints, paid at ninety percent in Buckarooz with a streak
bonus of five percent a day up to half again; a solve in two rows hands over
a Rare booster, and every seventh day of a streak a booster too. Signed in,
the points are sent once to the leaderboard.

**The Popularity Duel** (`src/duel.js`) is two of your own cards: one shows
how many people read its article in a month, the other hides it, and the
call is more or fewer. Right, and the challenger takes the seat and a new
one walks in, the streak growing (100 points, then 110, then 120); wrong,
and the round is over; fifteen in a row is a perfect with a 500-point
bonus. Three rounds a day, paid at a quarter of the points in Buckarooz.
The cards are the player's, so the game is about knowing what you collected,
and it opens once the album holds ten different cards with a readership.

**Guess the Article** (`src/reveal.js`) is a card's picture, blurred past
recognition, and four titles: the answer and three decoys from the same
album, so the subject is never the tell. The blur lifts a step every few
seconds, or sooner on request, and the points fall with it, 250, 180, 120,
60; a wrong pick pays nothing and names the card. Eight cards a round,
three rounds a day, paid at thirty percent. It opens at twelve different
cards with a picture, and never shows a card the adult filter would blur.

Both send the day's best round to the leaderboard through `submit_score`,
which now takes the three device-scored games with a maximum per game and
keeps one row per game and day, replacing a duel's or a reveal's when a
later round beats it.

**The slot machine** (`src/slots.js`, book in `src/data/slots.js`) has three
reels, five paylines and eight symbols drawn as their own small pictures: six
that pay, a **wild** that stands in for any of them (three wilds is the
jackpot at 700 times the line bet), and a **bonus** scatter: three anywhere
in the window open eight free spins at the same bet, which the house plays on
the spot and answers with all at once. The paytable is tuned so that the
machine returns about 95% of what is bet over the long run, bonus counted;
`tools/slots-rtp.mjs` computes that figure exactly from the tables. The spin
is decided by the `slots` edge function with `crypto.getRandomValues`, never
by the app: the app takes the coin, asks, checks every window it is handed
against the book (the stops exist, the windows match them, the total adds
up, the bonus has exactly eight spins) and only then pays. If the house does
not answer, or the answer does not add up, the coin comes back. The machine
is one state at a time, idle, spinning, settling, paying, bonus, and refuses
any input that is not for the state it is in, so a double tap buys one spin.

**Daily quests** (`src/quests.js`, book in `src/data/quests.js`) are three a
day from a book of over a hundred, easy, medium and hard by weight, dealt
from the UTC date and the player's id so the deal is the same wherever it is
asked. Everything the player already does reports to them: opening, pulling,
buying, selling, quizzes, trades, the arcade. Signed in, the `quests`
function deals, records progress and honours a claim only when its own copy
of the progress meets the target; signed out, the device does the same for
itself, and nothing reaches a leaderboard.

**The leaderboard** (`src/leaderboard.js`) is three tables on the server,
daily, weekly and all-time, kept by a trigger over every score submitted;
`pg_cron` empties the daily table at midnight UTC and the weekly one on
Sunday. A page is twenty rows and the player's own standing comes back
separately so it can be pinned to the bottom of the screen.

Deploying the arcade to a Supabase project takes three steps: run
`supabase/schema.sql` (V6) in the SQL editor, enable the `pg_cron` extension
under Database, Extensions, and deploy the functions. The functions are
deployed by GitHub: `.github/workflows/supabase.yml` runs
`supabase functions deploy` for every function on each push that touches
one, once the repository holds a `SUPABASE_ACCESS_TOKEN` secret (a personal
access token from the Supabase dashboard, Account, Access Tokens). From a
terminal instead:

```
npx supabase login
npx supabase functions deploy slots quests --project-ref lfcehzltokzaymnqodgh
```

`tools/sync-game-tables.mjs` copies the books (slots, quests) into
`supabase/functions/_shared/` as TypeScript, so the server and the app can
never disagree about what a line pays. Without the functions the app still
runs: Wikdle and the quests work on the device, the casino says the house is
closed, and the leaderboard says what to run.

## The website

The site is the same `dist/`, published to GitHub Pages from the `gh-pages`
branch. That branch holds build output only and is replaced wholesale on each
publish. `.nojekyll` stops Pages filtering the build's filenames, and
`404.html` is a copy of `index.html` so deep links land in the app.

Cloudflare is supported as an alternative, either through its dashboard Git
integration or through `.github/workflows/cloudflare.yml`, which deploys
`wrangler.jsonc` as a Worker serving static assets once
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist as repository
secrets, and does nothing at all until then.

### The live wire

Everything that happens to a player because of someone else used to be
found by asking the server once a minute. `src/account/realtime.js` holds
three Realtime subscriptions instead: a feed of the social rows written for
me (messages, receipts, parcels, requests, trades, filtered on the server by
the same row-level rules a query obeys), a presence channel every signed-in
player joins so "online" is who is on it right now, and the board's three
windows so a leaderboard on screen moves as scores land. `src/app/social.js`
turns each event into the same repaint the heartbeat does, one beat, now;
the heartbeat still runs a minute apart as the net. The chat's broadcast
wire holds what was said before it joined, which is what puts the read mark
up when the other person opens the conversation rather than when they type.
A friend who is offline says when they were last here, from their last
heartbeat. `supabase/schema.sql` V7 publishes the tables and gives the
friendships their whole row on delete.

Scores go through a queue in `src/leaderboard.js`: written to the device
first, sent, and kept until the server has them; every game sends, the slot
machine and the quiz included, and the server takes the difference when a
day's best is beaten instead of adding it twice. `tests/suites/live.mjs`
runs all of it against the stub's own Phoenix socket (in
`tests/lib/supastub.mjs`, over Playwright's mocked WebSocket).

Wikdle plays in the app's language: `src/data/wikdle-words-fr.js` carries
the French answers and dictionary, accents dropped, and the hints come from
the word's article on that language's Wikipedia.

### The seasons

The year is eleven seasons (`src/data/seasons.js`), each dated by month
and day so the calendar repeats on its own. `src/season.js` says which one
is on, keeps season points in the profile under the season's key (the year
it began and its id, so a season played twice is two entries), reads the
track of ten rungs off them, and deals a season quest a day off the same
ledger the daily quests use. A rung's theme and badge go into
`profile.seasonUnlocks`, which outlives the season. Season boosters are
subject packs in all but name: `themeById` in `src/data/packs.js` knows
`SEASON_PACKS`, so naming, colours, art and the draw are the same code as
any subject, and each carries its own foil and particles on its row. The
eleven season themes share one backdrop renderer (`season` in
`src/ui/backdrop.js`), coloured and peopled per season; their CSS blocks
sit at the end of `src/styles/themes.css`, and the picker hides a season
theme the save has not earned. On the server (schema V11) a `seasons` table
holds the same calendar and `current_season_key()` reads it, so every score
also lands on `leaderboard_season` and `guild_season` under the season it
was made in; those windows are never emptied, and the four board functions
take `season` as a window.

### The clubhouse

Guilds are a name, a tag and up to fifty players (`supabase/schema.sql`
V8 and V9, `src/account/guilds.js`, `src/app/guilds.js`). A guild has three
windows of its own, filled by the same trigger that fills a player's: every
point scored lands on both at once, so there is nothing to sum and nothing
to sync. Founding, joining and leaving are functions on the server; the
last one out closes the guild, and the founder can close it outright with
`delete_guild()`, which the roster, the windows and any standing invitation
cascade from. The guild leaderboard is painted by the same code as the
players' (`boardNode` in `src/app/quests.js`) and moves live.

The hall (schema V10) is what happens inside a guild. `guild_messages`
is a room on its own Realtime channel (`openGuildRoom`), opened while the
guild's screen is up and closed when it is left. `guild_goals` holds one
shared target a week per guild, picked from the guild id and the week key
so it cannot be re-rolled, and sized for the roster with a slope that makes
every member cheaper per head; the points kind is moved by the score
trigger itself and the other kinds by `guild_goal_add`, batched on the
client in `src/guildgoal.js` off the same reports the daily quests get.
`guild_bank` is a table of donated card entries anyone in the guild may
take, three a day each, and `guild_matches` pairs a guild with the nearest
unpaired guild on the weekly board the first time anyone in it looks;
`week_turn()` writes the final scores down before pg_cron empties the
weekly windows, so last week's win is still there to be paid for.

An invitation is an offer, not a membership: `invite_to_guild()` writes a
row in `guild_invites` and `accept_guild_invite()` is where the room is
checked for space and the guest for a guild of their own, so nothing that
changed in between can be missed. It reaches the guest through its own
Realtime channel (`openGuildInviteFeed` in `src/account/realtime.js`, alone
so a project without V9 loses nothing else), and the minute heartbeat finds
it when there is no socket. The screen and the bell read the same list, and
the ids already announced are kept in the save so a restart does not ring
twice for the same invitation.

The showcase is up to three cards pinned on the profile: a copy of each,
kept in the profile so it syncs, and published on the profile row so a
friend's page reads it in one go. Friends leave a heart per card
(`showcase_kudos`, one row per friend and card).

Wikipedia Today is a booster whose cards come from what the encyclopaedia's
readers opened most the day before (`fetchTopRead` in `src/wiki/fetch.js`,
the `today` source in `src/wiki/core.js`): one pack a day on the shop floor.
Its cards are the one place in the game where a tier is not read off the
article's readership, because readership cannot tell these articles apart:
being read by everybody is the entry requirement for the list. A card's tier
is its article's place on the day instead (`todayRarityForRank` in
`src/economy.js`), the day's number one down to Rare at two hundred, and the
price is derived from that ladder by the same rule as every other booster,
so the pack cannot be opened and sold at a profit. The card keeps its true
readership, so its value and its numbers stay the article's own.

Notifications: the Android wrapper carries a bridge (`WiksterNotify`) to a
notification channel, and `src/app/notify.js` raises a line for a message,
a request, a parcel or a trade that the live wire delivers while the app is
not on screen; a browser does the same through the Notification API once
allowed from Settings. There is no push service behind it: it works for as
long as the page lives in the background.

### On a desk

`src/styles/desktop.css` has two widths in it, and they are different rooms.

**From 1024px the phone stands up.** The bottom bar becomes a rail down the
left with its labels beside its icons and the drawer's list folded into it, so
the hamburger goes; sheets open as centred dialogues rather than climbing from
an edge no mouse lives near; hover becomes real input; and every grid of cards
is measured in card widths rather than in columns.

**From 1280px it is a desk.** Three columns: the rail, the work, and a panel
down the right (`src/app/panel.js`) carrying the day (level, gift, quests, the
bell) under every screen and, above it, whatever the screen at hand keeps out
of sight on a phone: the shop's clocks and pull rates, the collection's count
and filters, the arcade's rounds left, the auction house's own lots. It
collapses to a handle and remembers. The middle column stops being an 1180px
letterbox and takes the width it is given; insets come down to an 8px rhythm;
lists of self-contained rows (settings, achievements, the glossary) run in two
columns; the shop's stalls sit side by side; the profile puts who you are
beside what you have; the album book holds eight cards to a page instead of
four (`cardsPerPage` in `albums.js`, asked on every paint so the two agree the
moment the window changes). Icon-only buttons say what they do on hover and on
keyboard focus, from the same `aria-label` a screen reader reads. The
header is a toolbar on the right (purse, gift, bell, level) rather than a
phone's bar with the purse dead centre, a screen's caption sits under its
title, and the panel's handle lives in the panel's own head.

What does not change is the app: the same screens, in the same order, painted
by the same code, with the same state. `tests/suites/desk.mjs` holds the frame
to it, including that nothing on a screen ever runs under the panel.

The site is also an installable web app: `public/manifest.webmanifest` and
its icons (drawn from the logo by `tools/icons.mjs`), and a service worker
written out by the build from `src/sw.js` with the build's own file list in
it. The worker stores the shell on the first visit (the page, the scripts,
the styles, the sounds; not the music) and answers navigations from the
network first, three seconds, then the shell, so an update is never held
back by the cache and no connection still opens the app. Card pictures from
Wikipedia are kept as they go by, a few hundred at most. Wikipedia itself is
never cached: a draw needs the live encyclopaedia. The APK's built-in copy
does not register it; that origin is answered by the wrapper.

The eight stylesheets are cascade layers in the order `src/style.css` lists
them, so a later file restyles an earlier one by position rather than by
selector weight, and the first screen loads a third of the JavaScript it
used to: the market, the index, the quiz, the timeline, the games, the Wikdle
word lists and the sample kits are chunks fetched when they are opened.

## Project layout

```
src/
  main.js          the entry: it loads src/app/boot.js
  app/             the application, one module per screen: boot, core,
                   open, packs, shop, binder, detail, market, social, gate,
                   settings, arcade, wikdle, slots, duel, reveal, quiz...
  wiki.js          the public face of src/wiki/: fetch, draw, custom,
                   translate, repair, filter, core
  collection.js    saved state and every localStorage key
  account.js       the public face of src/account/: client, session,
                   profile, save (sync and backups), schema, social,
                   market, index
  duel.js  reveal.js   the two newer games' arithmetic and ledgers
  sw.js            the service worker, written out by the build
  booster.js       a booster spec, and what it is allowed to draw
  economy.js       prices, tiers, the shop cadence, what a pack guarantees
  shop.js          the shelves, seeded so everyone sees the same shop
  albums.js        filing cards, and how big an album really is
  wikdle.js  slots.js  quests.js  leaderboard.js  house.js
  achievements.js  badges.js  frames.js  progression.js  daily.js  quiz.js
  timed.js  pricing.js  packstyle.js  packview.js  save.js  i18n.js
  data/            rarities, subjects, icons, emblems, release notes,
                   the arcade's books and the Wikdle words
  ui/              themes, animated backdrops, the synth, the music player,
                   the sample kits, h() for building DOM, the event bus
  styles/          themes, base, components, booster, cards, screens, games,
                   desktop: cascade layers, in that order
  assets/          fonts, music, sound kits, a few bundled pictures
public/            the web manifest and its icons
android/           the WebView wrapper and its Gradle build
supabase/          schema.sql: tables, policies; functions/: the edge functions
tests/             the browser suites, their stubs, the runner, the unit checks
tools/             split-module.mjs (the AST splitter), i18n-check.mjs,
                   sweep.mjs, economy-report.mjs, icons.mjs,
                   sync-game-tables.mjs, slots-rtp.mjs
```

## The names underneath

The app has been PackyWiki, then Wiklodo, and is Wikster. Three identifiers
carry a rename's cost, and each was handled rather than left behind:

- **`wikster.*` localStorage keys.** These are where every player's
  collection lives. The first launch of a build carries every `packywiki.*`
  key over to its `wikster.*` name and removes the old one
  (`migrateLegacyStorage` in `src/save.js`), and a pasted save from before
  the rename is read under its old keys and old envelope name.
- **`com.wikster.app`**, the Android `applicationId`. It is the app's
  identity to Android and the key to the WebView's storage. It changed with
  the rename, so this APK installs beside an older Wiklodo rather than over
  it: the old one is uninstalled by hand, and the account's save carries the
  collection across.
- **The key name inside `supabase/schema.sql`**, which has to match the
  localStorage key it reads. It says `wikster.collection.v3`; a project that
  ran an older schema.sql has to run the current one again.

## Credits

Article text and images come from Wikipedia and are licensed
[CC BY-SA](https://en.wikipedia.org/wiki/Wikipedia:Copyrights). Every card
links back to the article it came from. This is a hobby project and is not
affiliated with the Wikimedia Foundation.

Bundled third-party material, all of it credited in place:

- Music: found recordings, credited track by track in
  `src/assets/music/LICENSE.md`.
- Two theme sound kits (Cartoon, Matrix) use recordings from the `uisfx`
  project, CC0 1.0, see `src/assets/sfx/LICENSE.md`.
- The Cartoon theme bundles Comic Neue, SIL OFL 1.1, see `src/assets/fonts/`.

Every other sound is synthesised at runtime and every other typeface is a
system stack.
