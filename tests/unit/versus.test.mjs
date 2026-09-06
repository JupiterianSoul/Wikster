/* The two friend games: the deal, the reckoning, and what it pays. */
import { check, done } from './lib.mjs';
const v = await import('../../src/versus.js');

const card = (key, views) => ({ key, title: key, views, rarityId: 'rare' });
const mine = [card('a', 900), card('b', 500), card('c', 300), card('d', 100), card('e', 50)];
const theirs = [card('f', 1000), card('g', 400), card('h', 350), card('i', 90), card('j', 10)];

/* --- card clash ------------------------------------------------------------ */
const rounds = v.clashRounds(mine, theirs);
check('five rounds, best hand first', rounds.length === 5 && rounds[0].challenger.key === 'a' && rounds[0].opponent.key === 'f');
check('each round goes to the more-read card', rounds.map((r) => r.winner).join(',') === 'opponent,challenger,opponent,challenger,challenger');
const clash = v.settle('clash', { cards: mine }, { cards: theirs });
check('three rounds to two wins the clash', clash.winner === 'challenger' && clash.scores.challenger === 3 && clash.scores.opponent === 2, JSON.stringify(clash));
check('a tied round is nobody\'s', v.clashRounds([card('x', 5)], [card('y', 5)])[0].winner === 'draw');
check('an even clash is a draw', v.settle('clash', { cards: mine.slice(0, 2) }, { cards: [card('p', 950), card('q', 10)] }).winner === 'draw');
check('a hand needs five cards with readers', v.canClash(mine) && !v.canClash(mine.slice(0, 4)) && !v.canClash([...mine.slice(0, 4), { key: 'z', views: 0 }]));

/* --- speed sort ------------------------------------------------------------ */
const pool = Array.from({ length: 12 }, (_, i) => card(`s${i}`, (i + 1) * 100));
const hand = v.dealSort(pool, () => 0.5);
check('a deal is eight cards with different readerships', hand.length === 8 && new Set(hand.map((c) => c.views)).size === 8);
check('a pool of same readerships cannot be dealt', v.dealSort(Array.from({ length: 12 }, (_, i) => card(`t${i}`, 100))) === null && !v.canSort(pool.slice(0, 7)));
const truth = v.trueOrder(hand);
check('the true order runs most read first', truth.every((k, i) => i === 0 || hand.find((c) => c.key === k).views < hand.find((c) => c.key === truth[i - 1]).views));
check('a perfect order scores eight', v.sortScore(hand, truth) === 8);
const swapped = [...truth]; [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
check('two cards swapped score six', v.sortScore(hand, swapped) === 6);
check('the better order wins whatever the time', v.settle('sort', { cards: hand, order: truth, ms: 9000 }, { cards: hand, order: swapped, ms: 1000 }).winner === 'challenger');
check('an equal order goes to the faster hand', v.settle('sort', { cards: hand, order: truth, ms: 9000 }, { order: truth, ms: 1000 }).winner === 'opponent');
check('the same order in the same time is a draw', v.settle('sort', { cards: hand, order: truth, ms: 500 }, { order: truth, ms: 500 }).winner === 'draw');

/* --- the sides ------------------------------------------------------------- */
const row = { challenger: 'A', opponent: 'B', status: 'done', result: { winner: 'opponent' } };
check('each side reads its own outcome', v.outcomeFor(row, 'A').outcome === 'lose' && v.outcomeFor(row, 'B').outcome === 'win' && v.outcomeFor(row, 'C').side === null);
check('an open challenge has no outcome yet', v.outcomeFor({ ...row, status: 'open', result: null }, 'A').outcome === null);
check('a win pays more than a draw, a draw more than a loss', v.PAY.win.coins > v.PAY.draw.coins && v.PAY.draw.coins > v.PAY.lose.coins && v.PAY.win.ink > v.PAY.lose.ink);

done();
