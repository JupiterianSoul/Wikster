# Effects board III

Eighty card treatments, ten for every rarity, each drawn as a real card at real
size using the app's own effect layers (`.fx-a`, `.fx-b`, `.fx-c`, `.fx-v`,
`.fx-p`, `.fx-code`, `.fx-ring`, `.fx-art`).

Published at https://claude.ai/code/artifact/8b1d927b-2753-4e3a-b315-3ae2898cb5cb

The first two boards were only ever published, never kept, and had to be dug
back out of an old session before their designs could be shipped. This one lives
in the repository so that cannot happen again.

## Rebuilding

    node tools/boards/effects-board-3/build.mjs

That reads `00-shell.html` (board chrome plus a mirror of the card CSS) and the
eight tier stylesheets, and writes `board.html` beside them. The build derives
each design's name and one-line description from the numbered comment above its
rules, so a design is renamed by editing that comment and nothing else.

## What the tiers are

| File | Tier | Idea |
| --- | --- | --- |
| `10-common.css` | Common | Paper and the machines that printed on it. Matte, off register, barely moving |
| `20-uncommon.css` | Uncommon | Alive: growth, drift, damp, light through leaf tissue |
| `30-rare.css` | Rare | Blue as a material: cut, frozen, conducting, under water |
| `40-epic.css` | Epic | Violet, and almost all of it very far away |
| `50-legendary.css` | Legendary | Ten things people do with gold |
| `60-mythic.css` | Mythic | Red, and something has gone wrong with it |
| `70-exotic.css` | Exotic | Instruments rather than ornament |
| `90-prismatic.css` | Prismatic | Ten ways of splitting the spectrum |

## Rules a design has to keep

Checked with the probes in the session that built this, and worth rechecking
before any design is added:

* It has to move. A treatment that sits still reads as broken in the shop.
* Nothing may paint outside the card. The face clips, but a layer that relies on
  that has to be deliberate about it.
* It may not eat its own text. The title needs 3:1 against what is painted
  behind it and the summary 2.2:1, held at every phase of the animation, not
  just the frame that happens to be showing. In practice that means a broad
  bright sweep belongs under `.card-body` (z-index 1, not 2 or more), and a
  darkening scrim belongs there too, or it dims the ink along with the ground.
