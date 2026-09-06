/*
 * The release timeline. It is the app's memory of what a device has already
 * been shown: the id of the newest release a player has seen is stored, and
 * everything after that id in this list is what the what's-new sheet offers.
 *
 * So a repeated id is not a cosmetic slip. It makes "seen" resolve to the
 * FIRST release carrying that id, and every release after that one reads as
 * unseen: a player up to date is greeted, on every launch, with a sheet of
 * twenty-seven things they have already read.
 */
import { check, done } from './lib.mjs';

const { RELEASES } = await import('../../src/data/releases.js');

const ids = RELEASES.map((r) => r.id);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
check('every release id is its own', dupes.length === 0, dupes.join(' '));
check('and reading it back finds the one that was written', RELEASES.every((r, i) => ids.indexOf(r.id) === i));

check('every release is named in both languages',
  RELEASES.every((r) => r.title?.en && r.title?.fr));
check('every release says what it brought, in both',
  RELEASES.every((r) => r.points?.length && r.points.every((p) => p.en && p.fr)));
check('and spells it out in both',
  RELEASES.every((r) => r.changelog?.length && r.changelog.every((c) => c.en && c.fr)));
check('every release has an icon and a colour',
  RELEASES.every((r) => typeof r.icon === 'string' && /^#[0-9a-f]{6}$/i.test(r.accent)));

/* A device up to date is a device with nothing to be shown. */
const unseenFrom = (seen) => {
  const at = RELEASES.findIndex((r) => r.id === seen);
  const from = at >= 0 ? at + 1 : RELEASES.length - 1;
  return RELEASES.slice(from);
};
check('a device on the newest release is offered nothing', unseenFrom(RELEASES.at(-1).id).length === 0,
  String(unseenFrom(RELEASES.at(-1).id).length));
check('a device one behind is offered exactly one', unseenFrom(RELEASES.at(-2).id).length === 1,
  String(unseenFrom(RELEASES.at(-2).id).length));

done();
