# NUM-09. About: a Numbers chapter

Board key: `about-a-numbers-chapter-with-an-article-for-each-puzzle`. Kind:
feature. For the cloud agent that owns the About page; not claimed by the
puzzle builders.

## Why

John, 2026-09-24, with three puzzles joining Numbers: "we need to add more
articles in our About page as well. And update counts in our articles. And
make sure our images are correct."

## What is there now

- One paragraph in "What is on the board here" (`about.games.tsx`) names every
  puzzle in a sentence, with its sizes. At eight it is a list, not a sentence.
- "There are N games here" counts `RULE_VARIANT_LIST` only, so the puzzles are
  in the family count and in no game count.
- The puzzles' pictures were re-taken on 2026-09-24 (NUM-07): the live ones
  showed a selected cell. Any About screenshot of a puzzle should be taken
  after that lands.

## Wanted

- A Numbers section (or chapter) with a short article per puzzle: what it is,
  whose puzzle it is our version of, how to start, its picture from
  `public/art/games/<kind>.jpg`, a link to its front door through `GameName`.
- Every count read from the catalogue (`PUZZLE_KIND_LIST`, `EVERY_GAME_KEY`),
  never typed; the catalogue sentence says how many games and how many
  puzzles.
- Checked at 390px, and with no session (About is open to strangers).
