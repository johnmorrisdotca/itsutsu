# Numbers: a family of puzzles beside the games

**2026-10-01: two puzzles moved out.** Hidden Stones and Black and White
went to Logic puzzles on John's word ("Hidden Stones isn't really a numbers
game", "black and white is a logic puzzle i guess"): neither has a number in
it. Numbers holds six now, and the six are their own open-source package,
Kazu 数 (`@johnmorrisdotca/kazu`).

**Kazu is what the site plays (the board row `kazu-the-numbers-family-s-six-puzzles-as-an-open-source-package-the-site-plays`).**
The generators, the solver, the O(cells) check, the cell and puzzle codes and
the cage outline are imported from the package, pinned to an exact version
like the other seven. The site's own code for them is gone; `src/lib/puzzles/kazu.ts`
translates the site's kind spelling (`numberPlace`) to the package's
(`number-place`) and turns what the package makes into the site's `Puzzle`,
and `jigsaw/code.ts`, `killer/code.ts`, `killer/outline.ts`, `moreOrLess/code.ts`,
`towers/code.ts` and `numberPlace/generate.ts` stay as one-line re-exports so
every old import still holds. What stays the site's: the words, the grid and
its frame (`PuzzleGrid`, `PuzzleBoardPreview`), the kept solve and race, the
hint cell, and `jigsaw/shake.ts`, the set-up picture's irregular regions, because
the package does not export its `shakeRegions`. A puzzle is its kind, size,
level and seed, so a new Kazu version must make every puzzle as before
(`kazu.test.ts` pins a day's puzzles and the old Number Place seeds; Kazu's own
`site.fixture.json` pins 3,600 more) or it is a new major version there.
The plan files below stay as they were written, and name the code as it was.

John, 2026-09-24: "adding a new category to the site. Numbers... for
introducing Sudoku. Then we have to merge one group; I think merge Races +
Territory… If there is another number type of game we can add like Sudoku,
that would be great… Sudoku is a one person thing, but if we want to make it
2 person, we could give each person the same puzzle and time them… should
cost me nothing, no server calculations. This would be HIGH. And then we
have to update docs and about info. And then… make new images too… there's
another game… where you find all the cats… since this is an itsutsu site,
no cats, should be something else like find the Black stone, and give it a
nice name."

Twelve rows, in order. Each plan file says what to read, every file that
changes, the tests, the acceptance list, and what not to do. If a plan and
the code disagree, the code moved after the plan was written; say so in the
row and follow the code's gates.

## Order

| Row | Plan | Needs |
|---|---|---|
| `races-and-territory-become-one-family` | `NUM-01-territory-and-races.md` | nothing (shipped first: it is the room under the cap of eight) |
| `numbers-a-new-family-of-puzzles-starting-with-sudoku` | `NUM-02-numbers-and-number-place.md` | NUM-01 |
| `a-find-the-stones-logic-puzzle-like-star-battle` | `NUM-03-hidden-stones.md` | NUM-02 |
| `a-second-number-puzzle-beside-sudoku` | `NUM-04-more-or-less.md` | NUM-02 |
| Race a friend (the timed head-to-head; part of the Numbers row, released on its own) | `NUM-05-race-a-friend.md` | NUM-02, **a migration**, John's word and a Neon branch |
| `killer-sudoku-joins-the-numbers-family` (Sum Cages) | built on `its-killer`, no plan file | NUM-02 |
| `towers-joins-the-numbers-family` | `NUM-07-towers.md` | Sum Cages (same files) |
| `black-and-white-joins-the-numbers-family` | `NUM-08-black-and-white.md` | NUM-07 |
| `about-a-numbers-chapter-with-an-article-for-each-puzzle` | `NUM-09-about-numbers.md` | the three above; the cloud agent's |

The last four came from John's yes on 2026-09-24 to three more puzzles, which
fills the shelf at eight.

| `number-place-at-16-16-the-giant-size` | `NUM-10-giant-number-place.md` | NUM-07, NUM-08 |
| `puzzle-leaderboards-as-prominent-as-puzzlemadness-s` | `NUM-11-puzzle-leaderboards.md` | **a migration** (a stored `points` column) |
| `about-sites-worth-knowing-add-puzzlemadness` | the paragraph in NUM-11 | the cloud agent's |

**A site to learn from: PuzzleMadness** (puzzlemadness.co.uk, read
2026-09-24). Nearly forty Sudoku variants and close to sixty logic puzzles,
daily at five levels, and leaderboards worth copying. How it scores and ranks
is written down in NUM-11. Its catalogue is also the list to read when Numbers
next has room: Samurai, 12×12, Hyper, Center-dot, Nonograms, Kakuro and Hitori
are all there.

## The decision: a puzzle is a kind of its own, catalogued with the games

The engine (`src/lib/gomoku/engine.ts`, `VARIANT_SPECS`, the simulator, the
bots, the ladders, the head-start measurement) is built for two colours
taking turns on one board. A puzzle has one solver, no turns, no colour, no
rating and no move list, and the honest answer to "is a solved puzzle a won
game?" is no. Stretching the variant model to hold one would put a row in
`VARIANT_SPECS` that the engine cannot play, a game the simulator cannot
finish, a ladder nobody can stand on, and a `Game` row with `row`/`col`
moves that mean nothing. Every gate would then need an exception, and an
exception per gate is the shape that rots.

So:

- **A `PuzzleKind`** (`src/lib/puzzles/`) sits beside `RuleVariant`, with its
  own spec table (`PUZZLE_SPECS`: sizes, levels, grid), its own copy table
  (`PUZZLE_DISPLAY`, the same `VariantCopy` shape the games use, so the rules
  page and the cards need no second template), its own generators and
  checkers, and its own coverage gate (`puzzles.coverage.test.ts`) asking
  the New Game Gate's questions in the puzzle's terms.
- **A `GameKey` is either** (`src/lib/catalogue/gameKeys.ts`:
  `RuleVariant | PuzzleKind`, with `isPuzzleKind`, `gameCopyFor`,
  `EVERY_GAME_KEY`). `GameFamily.games` holds `GameKey`s, so the Numbers
  family is a row in `GAME_FAMILIES` like the other seven, counted by every
  page that counts families, drawn by every page that draws them. The
  consumers that only make sense for board games (the two-player set-up
  picker, the champions table, the catalogue's played-figures, the "also
  in this family" line under a board) read `boardGamesOf(family)` and say
  so where they skip a family.
- **One address shape.** A puzzle is `/games/<slug>` like any game, with
  `/rules`, `/family`, `/background`, `/new` (set-up: size and level) and
  `/play` (the solve) under it. The pages branch on `puzzleFor(slug)`
  before `variantFor(slug)`. No new route is added, so `e2e/page-width.spec.ts`
  and the gate's `OPEN_PATTERNS` are already right: a puzzle's rules are
  open to a stranger, its solve needs an invite, as for the games.
  `/history`, `/me`, `/standings` and `/match` answer 404 for a puzzle
  until NUM-05 gives it a record.
- **`GameName` and `GameThumb` take a puzzle key** the way they take a
  variant key or a slug, through `gameCopyFor` and `pictureOf`, so the
  dead-end gate and the pictures gate hold for puzzles with no new
  exception.
- **Everything that thinks runs in the browser.** Generation, the
  uniqueness check and the difficulty rating are pure TypeScript under
  `src/lib/puzzles/`, imported only by client components and by tests.
  The server never generates, never solves, never runs a timer. The one
  server call a solo solve makes is `POST /api/puzzles/solved` — a member's
  finished puzzle, checked in O(cells) (`checkSolution`: the grid is a valid
  solution and agrees with the givens) and paid through `awardXp`. A
  stranger or an invite holder without an account solves for nothing and is
  told so on the page.
- **XP.** `puzzleSolved`, 25 XP with a cap of six a day (the price and the
  allowance of `gameFinished`), keyed on the puzzle so the same one pays
  once. A solve also pays `firstOfVariant <kind>` and `firstOfFamily numbers`
  through the tour, so the eighth family can be met and "every game played"
  counts the puzzles (`XP_VARIANTS_TO_PLAY = EVERY_GAME_KEY.length`).
  No `firstWinAtVariant`: a puzzle is finished, not won, so Numbers is a
  family that cannot be "won" (`familyToWin` reads board games only) and the
  once-only ceiling moves by exactly a family met plus a first of each
  puzzle. Puzzles are not people-only: a program never calls the route, and
  John keeps that list.
- **Head to head keeps rows, so it waits for a migration** (NUM-05).
- **Names of our own**, following Drop Four for Connect Four: "Sudoku" 数独
  is Nikoli's trademark in Japan, "Queens" is LinkedIn's, "Futoshiki" is
  the name a Nikoli-published puzzle goes by. Each of ours says what it is
  our version of through `inspiredBy` and `alsoKnownAs`, under
  `RULES_ATTRIBUTION`:
  - **Number Place ナンプレ** — the puzzle's own original name (Howard
    Garns, Dell, 1979), and ナンプレ is what Japan calls it where 数独 cannot
    be used. Sizes 4×4 (2×2 boxes), 6×6 (2×3 boxes), 9×9; easy, medium, hard.
  - **Hidden Stones 隠し石** — one black stone hidden in every row, column and
    region, no two touching, even at a corner. The one-star form of Hans
    Eendebak's Star Battle, which LinkedIn's Queens made a habit. Sizes 5 to 10,
    of which the set-up screen offers 5, 7, 9 and 10 (four boards at most, 2026-09-24).
  - **More or Less 大小** — a Latin square with "more than" marks between
    cells. Our version of Futoshiki. Sizes 4 to 7.
- **Generators are ours**, MIT-clean by construction. The candidate
  libraries were either GPL (banned here), unmaintained, 9×9-only, or a
  hundred lines that any of us can write and test; and a shared seeded
  random (`src/lib/puzzles/random.ts`) lets two browsers derive the same
  puzzle from one seed, which the race needs and no library offers.

## The board rows

Claimed on the live board as `fable`, 2026-09-24. The release session closes
each with `pnpm release:take:prod --done <key>`.

## How to work one

Own worktree off `origin/main`, own dev server, own port. `pnpm preflight:prod`
green, the specs the plan names run with `--no-deps`, then one push of the
branch. The plan's acceptance list is the hand-over; the release summary
sentence is at the foot of each plan.
