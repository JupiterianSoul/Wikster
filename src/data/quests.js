/**
 * THE QUEST BOOK
 * ----------------------------------------------------------------------------
 * Every daily quest the game can hand out, as a template: what is counted
 * (`metric`, a name the app reports progress under), how much (`target`),
 * how hard (`tier`), and what it pays. Three are dealt a day, on the server,
 * from the UTC date and the player's id: Easy six times in ten, Medium three,
 * Hard one (see supabase/functions/quests). An Easy quest is meant to take
 * about ten minutes of ordinary play.
 *
 * `metric` is the contract with the rest of the app. Progress is reported
 * with quests.track(metric, amount, detail); the metrics are:
 *
 *   open           a booster opened               detail: { themeId, rarityId, kind }
 *   pull           a card pulled                  detail: { rarityId, themeId, isNew, popularity }
 *   sell           a card sold                    detail: { amount }
 *   buy            a booster bought               detail: { price, kind }
 *   wikdle         a Wikdle finished              detail: { won, guesses }
 *   slots          a spin                         detail: { bet, won, lines }
 *   points         minigame points earned         detail: { game }
 *   quiz           a quiz finished                detail: { correct }
 *   album          an album completed
 *   friend         a friend request accepted
 *   gift           a gift sent
 *   trade          a trade completed
 *   playtime       a minute played
 *   custom         a custom booster built
 *   daily          the daily gift claimed
 *   fx             a card effect chosen
 *   view           a card looked at in detail
 *
 * `where` narrows a metric to a detail: { rarityId } or { themeId } or
 * { won: true } and so on; a report that does not match is not counted.
 */
import { RARITIES } from './rarities.js';

const R = (n) => ({ money: n });
const RB = (n, spec) => ({ money: n, booster: spec });

const EASY = [], MEDIUM = [], HARD = [];
const easy = (q) => EASY.push({ tier: 'easy', ...q });
const medium = (q) => MEDIUM.push({ tier: 'medium', ...q });
const hard = (q) => HARD.push({ tier: 'hard', ...q });

// --- opening and pulling ----------------------------------------------------
easy({ id: 'open-1', metric: 'open', target: 1, reward: R(60),
  name: { en: 'Open a booster', fr: 'Ouvrez un booster' },
  how: { en: 'Any booster at all, from Boosters or Free Packs.', fr: 'N’importe lequel, depuis Boosters ou Packs gratuits.' } });
easy({ id: 'open-2', metric: 'open', target: 2, reward: R(110),
  name: { en: 'Open 2 boosters', fr: 'Ouvrez 2 boosters' },
  how: { en: 'Any two, of any kind.', fr: 'Deux, de n’importe quel type.' } });
easy({ id: 'open-3', metric: 'open', target: 3, reward: R(160),
  name: { en: 'Open 3 boosters', fr: 'Ouvrez 3 boosters' },
  how: { en: 'Any three, of any kind.', fr: 'Trois, de n’importe quel type.' } });
easy({ id: 'pull-5', metric: 'pull', target: 5, reward: R(60),
  name: { en: 'Pull 5 cards', fr: 'Tirez 5 cartes' },
  how: { en: 'Every card out of a booster counts, new or not.', fr: 'Chaque carte sortie d’un booster compte, nouvelle ou non.' } });
easy({ id: 'pull-10', metric: 'pull', target: 10, reward: R(120),
  name: { en: 'Pull 10 cards', fr: 'Tirez 10 cartes' },
  how: { en: 'About two boosters’ worth.', fr: 'L’équivalent de deux boosters environ.' } });
easy({ id: 'pull-new-3', metric: 'pull', where: { isNew: true }, target: 3, reward: R(100),
  name: { en: 'Pull 3 cards you do not own', fr: 'Tirez 3 cartes que vous n’avez pas' },
  how: { en: 'Only articles missing from your collection count. Duplicates do not.', fr: 'Seuls les articles absents de votre collection comptent. Les doublons non.' } });
easy({ id: 'pull-uncommon-2', metric: 'pull', where: { rarityId: 'uncommon' }, target: 2, reward: R(90),
  name: { en: 'Pull 2 Uncommon cards', fr: 'Tirez 2 cartes Peu communes' },
  how: { en: 'The green tier. Exactly Uncommon — better prints do not count.', fr: 'Le palier vert. Exactement Peu commune : les meilleures ne comptent pas.' } });
easy({ id: 'pull-rare-1', metric: 'pull', where: { rarityId: 'rare' }, target: 1, reward: R(120),
  name: { en: 'Pull a Rare card', fr: 'Tirez une carte Rare' },
  how: { en: 'The blue tier. Exactly Rare — better prints do not count.', fr: 'Le palier bleu. Exactement Rare : les meilleures ne comptent pas.' } });
easy({ id: 'pull-famous-2', metric: 'pull', where: { famous: true }, target: 2, reward: R(90),
  name: { en: 'Pull 2 widely-read articles', fr: 'Tirez 2 articles très lus' },
  how: { en: 'Articles with a lot of readers. The card shows its readership on its page.', fr: 'Des articles très consultés. La carte affiche son audience sur sa page.' } });
easy({ id: 'open-basic-1', metric: 'open', where: { kind: 'open' }, target: 1, reward: R(70),
  name: { en: 'Open a basic booster', fr: 'Ouvrez un booster de base' },
  how: { en: 'One that draws from all of Wikipedia rather than a subject.', fr: 'Un booster qui pioche dans tout Wikipédia plutôt que dans un sujet.' } });
easy({ id: 'open-theme-1', metric: 'open', where: { kind: 'theme' }, target: 1, reward: R(70),
  name: { en: 'Open a subject booster', fr: 'Ouvrez un booster par sujet' },
  how: { en: 'Any pack named after a subject: Animals, Space, History and the rest.', fr: 'Un booster portant le nom d’un sujet : Animaux, Espace, Histoire, etc.' } });
easy({ id: 'open-timed-1', metric: 'open', where: { kind: 'timed' }, target: 1, reward: R(60),
  name: { en: 'Open a free pack', fr: 'Ouvrez un pack gratuit' },
  how: { en: 'The ones that build up over time, in the Free Packs tab.', fr: 'Ceux qui s’accumulent avec le temps, dans l’onglet Packs gratuits.' } });
easy({ id: 'open-custom-1', metric: 'open', where: { kind: 'custom' }, target: 1, reward: R(90),
  name: { en: 'Open a booster you made', fr: 'Ouvrez un booster que vous avez fait' },
  how: { en: 'Build one on the Custom tab first, then open it.', fr: 'Fabriquez-en un dans l’onglet Perso, puis ouvrez-le.' } });
medium({ id: 'open-5', metric: 'open', target: 5, reward: R(300),
  name: { en: 'Open 5 boosters', fr: 'Ouvrez 5 boosters' },
  how: { en: 'Any five, of any kind.', fr: 'Cinq, de n’importe quel type.' } });

// --- the duel and the reveal --------------------------------------------------
easy({ id: 'duel-1', metric: 'duel', target: 1, reward: R(80),
  name: { en: 'Play a round of Popularity Duel', fr: 'Jouez une manche de Duel de popularité' },
  how: { en: 'In Minigames. Guess which of two articles is read more.', fr: 'Dans Mini-jeux. Devinez lequel des deux articles est le plus lu.' } });
easy({ id: 'reveal-1', metric: 'reveal', target: 1, reward: R(80),
  name: { en: 'Play a round of Guess the Article', fr: 'Jouez une manche de Devinez l’article' },
  how: { en: 'In Minigames. Name the article as its picture comes into focus.', fr: 'Dans Mini-jeux. Nommez l’article à mesure que l’image se précise.' } });
medium({ id: 'duel-streak-5', metric: 'duel', where: { minCorrect: 5 }, target: 1, reward: R(240),
  name: { en: 'Get 5 right in a row in Popularity Duel', fr: 'Enchaînez 5 bonnes réponses au Duel de popularité' },
  how: { en: 'One run of five without a mistake. A wrong answer starts the count again.', fr: 'Cinq d’affilée sans erreur. Une mauvaise réponse remet le compte à zéro.' } });
medium({ id: 'reveal-6', metric: 'reveal', where: { minCorrect: 6 }, target: 1, reward: R(240),
  name: { en: 'Name 6 articles in one Guess the Article round', fr: 'Nommez 6 articles en une manche de Devinez l’article' },
  how: { en: 'Six correct out of the eight in a single round.', fr: 'Six bonnes réponses sur les huit d’une même manche.' } });
hard({ id: 'reveal-perfect', metric: 'reveal', where: { minCorrect: 8 }, target: 1, reward: R(520),
  name: { en: 'Name all 8 in one Guess the Article round', fr: 'Nommez les 8 en une manche de Devinez l’article' },
  how: { en: 'A perfect round: every article named, none missed.', fr: 'Une manche parfaite : tous les articles nommés, aucun raté.' } });
medium({ id: 'pull-25', metric: 'pull', target: 25, reward: R(320),
  name: { en: 'Pull 25 cards', fr: 'Tirez 25 cartes' },
  how: { en: 'About five boosters’ worth.', fr: 'L’équivalent de cinq boosters environ.' } });
medium({ id: 'pull-rare-3', metric: 'pull', where: { rarityId: 'rare' }, target: 3, reward: R(340),
  name: { en: 'Pull 3 Rare cards', fr: 'Tirez 3 cartes Rares' },
  how: { en: 'Exactly Rare. A Rare booster from the Shop makes this much likelier.', fr: 'Exactement Rare. Un booster Rare en boutique améliore nettement vos chances.' } });
medium({ id: 'pull-epic-1', metric: 'pull', where: { rarityId: 'epic' }, target: 1, reward: R(380),
  name: { en: 'Pull an Epic card', fr: 'Tirez une carte Épique' },
  how: { en: 'The purple tier. An Epic booster guarantees one.', fr: 'Le palier violet. Un booster Épique en garantit une.' } });
medium({ id: 'pull-new-10', metric: 'pull', where: { isNew: true }, target: 10, reward: R(360),
  name: { en: 'Pull 10 cards you do not own', fr: 'Tirez 10 cartes que vous n’avez pas' },
  how: { en: 'Duplicates do not count. A subject you have collected less of helps.', fr: 'Les doublons ne comptent pas. Un sujet peu collectionné aide.' } });
medium({ id: 'open-tier-1', metric: 'open', where: { tiered: true }, target: 1, reward: R(300),
  name: { en: 'Open a booster with a tier on it', fr: 'Ouvrez un booster à palier' },
  how: { en: 'Any pack named for a rarity — Rare, Epic, Legendary and so on.', fr: 'Un booster portant le nom d’une rareté : Rare, Épique, Légendaire, etc.' } });
medium({ id: 'open-themes-3', metric: 'open', where: { kind: 'theme' }, target: 3, reward: R(320),
  name: { en: 'Open 3 subject boosters', fr: 'Ouvrez 3 boosters par sujet' },
  how: { en: 'Three subject packs. They can all be the same subject.', fr: 'Trois boosters par sujet. Le même sujet est accepté.' } });
hard({ id: 'open-12', metric: 'open', target: 12, reward: RB(900, { kind: 'open', themeId: null, rarityId: 'rare', cards: 5 }),
  name: { en: 'Open 12 boosters', fr: 'Ouvrez 12 boosters' },
  how: { en: 'A long session. Free packs count towards it.', fr: 'Une longue session. Les packs gratuits comptent.' } });
hard({ id: 'pull-legendary-1', metric: 'pull', where: { rarityId: 'legendary' }, target: 1, reward: R(1200),
  name: { en: 'Pull a Legendary card', fr: 'Tirez une carte Légendaire' },
  how: { en: 'The gold tier, about 1 card in 60 from a basic pack. A Legendary booster guarantees one.', fr: 'Le palier or, environ 1 carte sur 60 en booster de base. Un booster Légendaire en garantit une.' } });
hard({ id: 'pull-epic-3', metric: 'pull', where: { rarityId: 'epic' }, target: 3, reward: R(1000),
  name: { en: 'Pull 3 Epic cards', fr: 'Tirez 3 cartes Épiques' },
  how: { en: 'Exactly Epic. Epic boosters are the reliable way.', fr: 'Exactement Épique. Les boosters Épiques sont le moyen sûr.' } });
hard({ id: 'pull-60', metric: 'pull', target: 60, reward: R(1100),
  name: { en: 'Pull 60 cards', fr: 'Tirez 60 cartes' },
  how: { en: 'Roughly a dozen boosters over the day.', fr: 'Environ une douzaine de boosters dans la journée.' } });
hard({ id: 'pull-mythic-1', metric: 'pull', where: { rarityId: 'mythic' }, target: 1, reward: RB(1500, { kind: 'open', themeId: null, rarityId: 'epic', cards: 5 }),
  name: { en: 'Pull a Mythic card', fr: 'Tirez une carte Mythique' },
  how: { en: 'The red tier, rarer than Legendary. A Mythic booster guarantees one.', fr: 'Le palier rouge, plus rare que Légendaire. Un booster Mythique en garantit une.' } });

// --- subjects: one quest per theme, three sizes -------------------------------
const THEMES = [
  ['animals', { en: 'Animals', fr: 'Animaux' }], ['space', { en: 'Space', fr: 'Espace' }],
  ['history', { en: 'History', fr: 'Histoire' }], ['science', { en: 'Science', fr: 'Sciences' }],
  ['geography', { en: 'Geography', fr: 'Géographie' }], ['art', { en: 'Art', fr: 'Art' }],
  ['music', { en: 'Music', fr: 'Musique' }], ['food', { en: 'Food', fr: 'Cuisine' }],
  ['sport', { en: 'Sport', fr: 'Sport' }], ['games', { en: 'Games', fr: 'Jeux' }],
  ['weird', { en: 'Weird', fr: 'Insolite' }], ['tech', { en: 'Technology', fr: 'Technologie' }]
];
for (const [themeId, name] of THEMES) {
  easy({ id: `theme-${themeId}-3`, metric: 'pull', where: { themeId }, target: 3, reward: R(90),
    name: { en: `Pull 3 ${name.en} cards`, fr: `Tirez 3 cartes ${name.fr}` },
    how: { en: `Open the ${name.en} booster — cards only count if they came from that subject.`,
           fr: `Ouvrez le booster ${name.fr} : seules les cartes issues de ce sujet comptent.` } });
  medium({ id: `theme-${themeId}-8`, metric: 'pull', where: { themeId }, target: 8, reward: R(300),
    name: { en: `Pull 8 ${name.en} cards`, fr: `Tirez 8 cartes ${name.fr}` },
    how: { en: `Two ${name.en} boosters should do it.`, fr: `Deux boosters ${name.fr} devraient suffire.` } });
  hard({ id: `theme-${themeId}-rare-2`, metric: 'pull', where: { themeId, minRarity: 'rare' }, target: 2, reward: R(900),
    name: { en: `Pull 2 ${name.en} cards, Rare or better`, fr: `Tirez 2 cartes ${name.fr}, Rares ou mieux` },
    how: { en: `From the ${name.en} subject, at Rare or any tier above it.`, fr: `Du sujet ${name.fr}, en Rare ou tout palier supérieur.` } });
}

// --- the shop and the market -------------------------------------------------
easy({ id: 'buy-1', metric: 'buy', target: 1, reward: R(50),
  name: { en: 'Buy a booster', fr: 'Achetez un booster' },
  how: { en: 'From the Shop. Buying it is enough — you need not open it.', fr: 'À la boutique. L’achat suffit : nul besoin de l’ouvrir.' } });
easy({ id: 'sell-1', metric: 'sell', target: 1, reward: R(50),
  name: { en: 'Sell a card', fr: 'Vendez une carte' },
  how: { en: 'Open a card in your collection and sell it. A duplicate is the painless one.', fr: 'Ouvrez une carte de votre collection et vendez-la. Un doublon est indolore.' } });
easy({ id: 'sell-3', metric: 'sell', target: 3, reward: R(90),
  name: { en: 'Sell 3 cards', fr: 'Vendez 3 cartes' },
  how: { en: 'Duplicates are worth the same as the original.', fr: 'Un doublon vaut autant que l’original.' } });
easy({ id: 'buy-2', metric: 'buy', target: 2, reward: R(100),
  name: { en: 'Buy 2 boosters', fr: 'Achetez 2 boosters' },
  how: { en: 'From the Shop, at any price.', fr: 'À la boutique, à n’importe quel prix.' } });
medium({ id: 'buy-spend-1000', metric: 'buy', sum: 'price', target: 1000, reward: R(320),
  name: { en: 'Spend 1,000 in the Shop', fr: 'Dépensez 1 000 à la boutique' },
  how: { en: 'Across as many boosters as you like — the prices add up.', fr: 'Sur autant de boosters que vous voulez : les prix s’additionnent.' } });
medium({ id: 'sell-earn-500', metric: 'sell', sum: 'amount', target: 500, reward: R(300),
  name: { en: 'Earn 500 selling cards', fr: 'Gagnez 500 en vendant des cartes' },
  how: { en: 'What the sales pay you adds up. A card sells for about a third of its value.', fr: 'Le produit des ventes s’additionne. Une carte se vend environ un tiers de sa valeur.' } });
medium({ id: 'buy-custom-1', metric: 'buy', where: { kind: 'custom' }, target: 1, reward: R(280),
  name: { en: 'Buy a booster you made', fr: 'Achetez un booster que vous avez fait' },
  how: { en: 'Build one on the Custom tab, then buy it.', fr: 'Fabriquez-en un dans l’onglet Perso, puis achetez-le.' } });
hard({ id: 'buy-spend-5000', metric: 'buy', sum: 'price', target: 5000, reward: R(1200),
  name: { en: 'Spend 5,000 in the Shop', fr: 'Dépensez 5 000 à la boutique' },
  how: { en: 'A big day at the shop. Tiered boosters get there fastest.', fr: 'Une grosse journée en boutique. Les boosters à palier y arrivent le plus vite.' } });
hard({ id: 'sell-earn-2500', metric: 'sell', sum: 'amount', target: 2500, reward: R(1000),
  name: { en: 'Earn 2,500 selling cards', fr: 'Gagnez 2 500 en vendant des cartes' },
  how: { en: 'A clear-out of duplicates. Higher tiers sell for much more.', fr: 'Un grand ménage de doublons. Les hauts paliers rapportent bien plus.' } });

// --- Wikdle -------------------------------------------------------------------
easy({ id: 'wikdle-play', metric: 'wikdle', target: 1, reward: R(80),
  name: { en: 'Play today’s Wikdle', fr: 'Jouez le Wikdle du jour' },
  how: { en: 'In Minigames. Finishing counts even if you do not get it.', fr: 'Dans Mini-jeux. Terminer compte, même sans trouver.' } });
easy({ id: 'wikdle-win', metric: 'wikdle', where: { won: true }, target: 1, reward: R(150),
  name: { en: 'Solve today’s Wikdle', fr: 'Résolvez le Wikdle du jour' },
  how: { en: 'Find the word within your six guesses.', fr: 'Trouvez le mot en six essais ou moins.' } });
medium({ id: 'wikdle-4', metric: 'wikdle', where: { won: true, maxGuesses: 4 }, target: 1, reward: R(320),
  name: { en: 'Solve the Wikdle in 4 guesses or fewer', fr: 'Résolvez le Wikdle en 4 essais ou moins' },
  how: { en: 'Four, three, two or one. Fewer is fine.', fr: 'Quatre, trois, deux ou un. Moins convient aussi.' } });
medium({ id: 'wikdle-exact-4', metric: 'wikdle', where: { won: true, guesses: 4 }, target: 1, reward: R(300),
  name: { en: 'Solve the Wikdle on exactly the 4th guess', fr: 'Résolvez le Wikdle exactement au 4e essai' },
  how: { en: 'Exactly four. Solving it sooner does not count for this one.', fr: 'Exactement quatre. Trouver plus tôt ne compte pas ici.' } });
hard({ id: 'wikdle-3', metric: 'wikdle', where: { won: true, maxGuesses: 3 }, target: 1, reward: R(900),
  name: { en: 'Solve the Wikdle in 3 guesses or fewer', fr: 'Résolvez le Wikdle en 3 essais ou moins' },
  how: { en: 'The hints from the word’s article are the way in.', fr: 'Les indices tirés de l’article du mot sont la clé.' } });
hard({ id: 'wikdle-2', metric: 'wikdle', where: { won: true, maxGuesses: 2 }, target: 1, reward: RB(1500, { kind: 'open', themeId: null, rarityId: 'epic', cards: 5 }),
  name: { en: 'Solve the Wikdle in 2 guesses or fewer', fr: 'Résolvez le Wikdle en 2 essais ou moins' },
  how: { en: 'Mostly luck, and one very good first guess.', fr: 'Surtout de la chance, et un très bon premier essai.' } });

// --- the casino ---------------------------------------------------------------
easy({ id: 'slots-3', metric: 'slots', target: 3, reward: R(60),
  name: { en: 'Spin the slots 3 times', fr: 'Faites 3 tours de machine à sous' },
  how: { en: 'In Minigames. Winning is not required.', fr: 'Dans Mini-jeux. Gagner n’est pas nécessaire.' } });
easy({ id: 'slots-10', metric: 'slots', target: 10, reward: R(120),
  name: { en: 'Spin the slots 10 times', fr: 'Faites 10 tours de machine à sous' },
  how: { en: 'Any bet size counts.', fr: 'Toute mise compte.' } });
easy({ id: 'slots-win-1', metric: 'slots', where: { won: true }, target: 1, reward: R(80),
  name: { en: 'Win a spin on the slots', fr: 'Gagnez un tour à la machine à sous' },
  how: { en: 'Any winning line, however small.', fr: 'N’importe quelle ligne gagnante, même petite.' } });
easy({ id: 'points-200', metric: 'points', sum: 'amount', target: 200, reward: R(90),
  name: { en: 'Score 200 minigame points', fr: 'Marquez 200 points en mini-jeux' },
  how: { en: 'Every minigame adds to the same total.', fr: 'Tous les mini-jeux alimentent le même total.' } });
medium({ id: 'points-500', metric: 'points', sum: 'amount', target: 500, reward: R(300),
  name: { en: 'Score 500 minigame points', fr: 'Marquez 500 points en mini-jeux' },
  how: { en: 'Wikdle, the slots, the duel and the reveal all count.', fr: 'Wikdle, la machine à sous, le duel et la devinette comptent.' } });
medium({ id: 'slots-line-3', metric: 'slots', where: { threeOfAKind: true }, target: 1, reward: R(320),
  name: { en: 'Land three matching symbols on the slots', fr: 'Alignez trois symboles identiques' },
  how: { en: 'Three of the same on one line. Playing more lines gives more chances.', fr: 'Trois identiques sur une ligne. Jouer plus de lignes multiplie les chances.' } });
medium({ id: 'slots-25', metric: 'slots', target: 25, reward: R(300),
  name: { en: 'Spin the slots 25 times', fr: 'Faites 25 tours de machine à sous' },
  how: { en: 'Small bets go furthest here.', fr: 'Les petites mises durent le plus longtemps ici.' } });
hard({ id: 'points-2000', metric: 'points', sum: 'amount', target: 2000, reward: R(1100),
  name: { en: 'Score 2,000 minigame points', fr: 'Marquez 2 000 points en mini-jeux' },
  how: { en: 'A long stretch across every minigame.', fr: 'Une longue série sur tous les mini-jeux.' } });
hard({ id: 'slots-star', metric: 'slots', where: { symbol: 'star', count: 3 }, target: 1, reward: R(1000),
  name: { en: 'Land three stars on the slots', fr: 'Alignez trois étoiles' },
  how: { en: 'Three star symbols on one line.', fr: 'Trois symboles étoile sur une même ligne.' } });
hard({ id: 'slots-jackpot', metric: 'slots', where: { symbol: 'wiki', count: 3 }, target: 1, reward: RB(3000, { kind: 'open', themeId: null, rarityId: 'legendary', cards: 5 }),
  name: { en: 'Hit the slots jackpot', fr: 'Décrochez le jackpot' },
  how: { en: 'Three Wikster symbols on one line. The rarest thing in the game.', fr: 'Trois symboles Wikster sur une ligne. Le plus rare du jeu.' } });

// --- the quiz, the album, the friends ----------------------------------------
easy({ id: 'quiz-1', metric: 'quiz', target: 1, reward: R(70),
  name: { en: 'Finish a quiz', fr: 'Terminez un quiz' },
  how: { en: 'Open a card you own and start its quiz. Getting them wrong still counts.', fr: 'Ouvrez une carte que vous possédez et lancez son quiz. Se tromper compte quand même.' } });
easy({ id: 'quiz-3right', metric: 'quiz', where: { minCorrect: 3 }, target: 1, reward: R(120),
  name: { en: 'Get 3 right in one quiz', fr: 'Obtenez 3 bonnes réponses à un quiz' },
  how: { en: 'Three of the five, in a single quiz.', fr: 'Trois sur cinq, dans un même quiz.' } });
medium({ id: 'quiz-perfect', metric: 'quiz', where: { correct: 5 }, target: 1, reward: R(360),
  name: { en: 'Get all 5 right in one quiz', fr: 'Obtenez les 5 bonnes réponses à un quiz' },
  how: { en: 'A clean sweep. Reading the card’s article first helps a lot.', fr: 'Un sans-faute. Lire l’article de la carte d’abord aide beaucoup.' } });
medium({ id: 'quiz-3', metric: 'quiz', target: 3, reward: R(300),
  name: { en: 'Finish 3 quizzes', fr: 'Terminez 3 quiz' },
  how: { en: 'Three different cards. There is a daily limit on quizzes.', fr: 'Trois cartes différentes. Le nombre de quiz par jour est limité.' } });
hard({ id: 'quiz-2perfect', metric: 'quiz', where: { correct: 5 }, target: 2, reward: R(1100),
  name: { en: 'Get all 5 right in 2 quizzes', fr: 'Faites un sans-faute à 2 quiz' },
  how: { en: 'Two perfect quizzes in the same day.', fr: 'Deux quiz parfaits dans la même journée.' } });
easy({ id: 'view-5', metric: 'view', target: 5, reward: R(50),
  name: { en: 'Open 5 cards to read them', fr: 'Ouvrez 5 cartes pour les lire' },
  how: { en: 'Tap a card in your collection to open its page. Five different cards.', fr: 'Touchez une carte de votre collection pour ouvrir sa page. Cinq cartes différentes.' } });
easy({ id: 'view-15', metric: 'view', target: 15, reward: R(90),
  name: { en: 'Open 15 cards to read them', fr: 'Ouvrez 15 cartes pour les lire' },
  how: { en: 'Fifteen different cards from your collection.', fr: 'Quinze cartes différentes de votre collection.' } });
easy({ id: 'daily-claim', metric: 'daily', target: 1, reward: R(50),
  name: { en: 'Claim the daily gift', fr: 'Récupérez le cadeau du jour' },
  how: { en: 'The gift waiting on the home screen once a day.', fr: 'Le cadeau qui attend sur l’écran d’accueil, une fois par jour.' } });
easy({ id: 'playtime-10', metric: 'playtime', target: 10, reward: R(70),
  name: { en: 'Play for 10 minutes', fr: 'Jouez 10 minutes' },
  how: { en: 'Counted while the game is open in front of you.', fr: 'Compté tant que le jeu est ouvert devant vous.' } });
easy({ id: 'fx-1', metric: 'fx', target: 1, reward: R(60),
  name: { en: 'Put an effect on a rarity', fr: 'Appliquez un effet à une rareté' },
  how: { en: 'In Customization, choose a card effect for any tier you own one for.', fr: 'Dans Personnalisation, choisissez un effet de carte pour un palier que vous possédez.' } });
medium({ id: 'playtime-30', metric: 'playtime', target: 30, reward: R(260),
  name: { en: 'Play for 30 minutes', fr: 'Jouez 30 minutes' },
  how: { en: 'Across the whole day, not in one sitting.', fr: 'Sur toute la journée, pas d’un seul trait.' } });
medium({ id: 'custom-1', metric: 'custom', target: 1, reward: R(300),
  name: { en: 'Build your own booster', fr: 'Fabriquez votre propre booster' },
  how: { en: 'On the Custom tab: pick a subject and a size, and it is yours.', fr: 'Dans l’onglet Perso : choisissez un sujet et une taille, et il est à vous.' } });
medium({ id: 'gift-1', metric: 'gift', target: 1, reward: R(280),
  name: { en: 'Send a friend a gift', fr: 'Offrez un cadeau à un ami' },
  how: { en: 'Needs a friend. Open their profile and send a card or a booster.', fr: 'Nécessite un ami. Ouvrez son profil et envoyez une carte ou un booster.' } });
medium({ id: 'trade-1', metric: 'trade', target: 1, reward: R(320),
  name: { en: 'Complete a trade with a friend', fr: 'Concluez un échange avec un ami' },
  how: { en: 'Both sides have to accept before it counts.', fr: 'Les deux parties doivent accepter pour que cela compte.' } });
medium({ id: 'friend-1', metric: 'friend', target: 1, reward: R(300),
  name: { en: 'Add a friend', fr: 'Ajoutez un ami' },
  how: { en: 'Search a username in Friends. It counts when they accept.', fr: 'Cherchez un pseudo dans Amis. Cela compte quand la personne accepte.' } });
hard({ id: 'album-1', metric: 'album', target: 1, reward: RB(1500, { kind: 'open', themeId: null, rarityId: 'epic', cards: 5 }),
  name: { en: 'Complete an album', fr: 'Terminez un album' },
  how: { en: 'Every card in one subject’s album. Check Albums to see which is closest.', fr: 'Toutes les cartes de l’album d’un sujet. Voyez dans Albums lequel est le plus proche.' } });
hard({ id: 'playtime-90', metric: 'playtime', target: 90, reward: R(900),
  name: { en: 'Play for 90 minutes', fr: 'Jouez 90 minutes' },
  how: { en: 'An hour and a half over the day.', fr: 'Une heure et demie sur la journée.' } });
hard({ id: 'gift-3', metric: 'gift', target: 3, reward: R(1000),
  name: { en: 'Send 3 gifts', fr: 'Envoyez 3 cadeaux' },
  how: { en: 'Three gifts. They can all go to the same friend.', fr: 'Trois cadeaux. Ils peuvent aller au même ami.' } });

// --- every rarity, as its own quest --------------------------------------------
for (const rarity of RARITIES) {
  const rank = RARITIES.indexOf(rarity);
  if (rank <= 1) continue;
  const tier = rank <= 3 ? medium : hard;
  tier({ id: `print-${rarity.id}-2`, metric: 'pull', where: { rarityId: rarity.id }, target: 2,
    reward: R(rank <= 3 ? 340 : 400 * rank),
    name: { en: `Pull 2 ${rarity.name.en} cards`, fr: `Tirez 2 cartes ${rarity.name.fr}s` },
    how: { en: `Exactly ${rarity.name.en} — better prints do not count. A ${rarity.name.en} booster guarantees one of the two.`,
           fr: `Exactement ${rarity.name.fr} : les meilleures ne comptent pas. Un booster ${rarity.name.fr} en garantit une sur les deux.` } });
}

export const QUESTS = [...EASY, ...MEDIUM, ...HARD];
export const QUEST_TIERS = {
  easy:   { weight: 60, name: { en: 'Easy',   fr: 'Facile' },    color: '#4ade80' },
  medium: { weight: 30, name: { en: 'Medium', fr: 'Moyen' },     color: '#fbbf24' },
  hard:   { weight: 10, name: { en: 'Hard',   fr: 'Difficile' }, color: '#f472b6' }
};
export const QUESTS_PER_DAY = 3;
export const questById = (id) => QUESTS.find((q) => q.id === id) ?? null;

/**
 * Whether one report counts toward a quest, and by how much. A `sum` quest
 * adds a number from the detail; the rest add one per matching report.
 */
export function creditFor(quest, metric, detail = {}) {
  if (quest.metric !== metric) return 0;
  const w = quest.where ?? {};
  const rank = (id) => RARITIES.findIndex((r) => r.id === id);
  for (const [key, want] of Object.entries(w)) {
    if (key === 'minRarity') { if (rank(detail.rarityId) < rank(want)) return 0; continue; }
    if (key === 'maxGuesses') { if (!(detail.guesses <= want)) return 0; continue; }
    if (key === 'minCorrect') { if (!(detail.correct >= want)) return 0; continue; }
    if (key === 'tiered') { if (Boolean(detail.rarityId) !== want) return 0; continue; }
    if (key === 'famous') { if (!((detail.popularity ?? 0) >= 0.75)) return 0; continue; }
    if (key === 'threeOfAKind') { if (!(detail.lines ?? []).some((l) => l.count === 3)) return 0; continue; }
    if (key === 'symbol') { if (!(detail.lines ?? []).some((l) => l.symbol === want && l.count >= (w.count ?? 3))) return 0; continue; }
    if (key === 'count') continue;
    if (key === 'straightWin') { if (!(detail.bets ?? []).some((b) => b.kind === 'straight' && b.won)) return 0; continue; }
    if (key === 'tierWin') { if (!(detail.bets ?? []).some((b) => b.kind === 'tier' && b.won && (want === true || b.pick === want))) return 0; continue; }
    if (detail[key] !== want) return 0;
  }
  if (quest.sum) {
    const n = Number(detail[quest.sum] ?? detail.amount ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 1;
}
