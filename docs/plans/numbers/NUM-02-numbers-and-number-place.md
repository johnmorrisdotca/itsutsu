# NUM-02. The Numbers family, and Number Place

Board key: `numbers-a-new-family-of-puzzles-starting-with-sudoku`. Kind:
feature, HIGH. Needs NUM-01 on `main`. The timed head-to-head is NUM-05.

## Why

John wants a puzzle category, opening with Sudoku, that costs the server
nothing. Sudoku is Nikoli's trademark in Japan, so the site's name for it is
the puzzle's original one, Number Place ナンプレ, with Sudoku named as what it
is our version of.

## Before you start

1. Read the README's decision in full, then AGENTS.md "New Game Gate",
   "Nothing Is A Dead End", "Show The Data, Not The Way To It", the picture
   sizes, "Function Size", "Fewer Pushes".
2. Read `src/lib/gomoku/families.ts`, `slugs.ts`, `variants.constants.ts`
   (the `VariantCopy` shape), `src/lib/learn/rulesPage.ts` (the `RulesPage`
   shape), `src/components/games/GameName.tsx`, `GameThumb.tsx`,
   `gamePicture.ts`, `sourceScan.ts`, `src/app/games/[slug]/page.tsx` and
   its `rules`, `family`, `new`, `play` siblings, `src/lib/xp/xpTour.ts`,
   `xpGame.ts`, `xp.constants.ts`, `src/lib/api/rateLimit.ts`.

## Exact changes

### 1. The puzzle library, `src/lib/puzzles/`

- `puzzles.types.ts`: `PuzzleKind`, `PuzzleLevel` ("easy" | "medium" |
  "hard"), `PuzzleSpec` (`sizes`, `defaultSize`, `levels`, `grid: "cells"`),
  `Puzzle` (`kind`, `size`, `level`, `givens: string`, `solution: string`,
  `seed`), `PuzzleCheck` (the O(cells) verdict).
- `puzzles.constants.ts`: `PUZZLE_KINDS`, `PUZZLE_KIND_LIST`,
  `PUZZLE_SPECS`, `PUZZLE_LEVEL_DISPLAY` (易しい 初級 / 中級 / 上級), and
  `PUZZLE_DISPLAY: Record<PuzzleKind, VariantCopy>` — label, kanji, tagline,
  origin, inspiredBy, alsoKnownAs, country, wikipedia, rules (three or
  more), board.
- `random.ts`: a seeded generator (mulberry32) and `shuffle`. Two browsers
  handed one seed derive one puzzle; the race in NUM-05 depends on it.
- `numberPlace/boxes.ts`: box geometry for 4 (2×2), 6 (2 rows × 3 columns)
  and 9 (3×3); `numberPlace/solve.ts`: a solver that counts solutions up to
  two (uniqueness) and a singles-only pass (difficulty);
  `numberPlace/generate.ts`: fill a grid by randomised backtracking, then
  remove cells in a seeded order while the puzzle stays unique, stopping at
  the level's givens; `numberPlace/rate.ts`: easy = singles alone finish it,
  medium = singles plus at most one guess, hard = the rest.
- `puzzleCheck.ts`: `checkSolution(kind, size, givens, answer)`: every row,
  column and box a permutation, every given kept. Pure, O(cells), the one
  function the server also runs.
- `puzzleCode.ts`: the puzzle as a string for an address, a POST body and
  (NUM-05) a column: `"4..3.1.."` row-major; `puzzleHash` for the XP subject.

### 2. The catalogue learns a second kind of key

- `src/lib/catalogue/gameKeys.ts`: `GameKey = RuleVariant | PuzzleKind`,
  `isPuzzleKind`, `gameCopyFor(key): VariantCopy`, `EVERY_GAME_KEY`
  (variants then puzzles).
- `families.types.ts`: `games: GameKey[]`; `families.ts`: the row
  `{ key: "numbers", title: "Numbers", kanji: "数", games: ["numberPlace"] }`
  and `boardGamesOf(family)`. `siblingsOf`/`familyOf`/`familyKeyOf` take a
  `GameKey`.
- `slugs.ts`: `PUZZLE_SLUGS` (`numberPlace: "number-place"`), `slugFor` and
  the path builders take a `GameKey`; `puzzleFor(slug)`; `variantFor`
  unchanged (null for a puzzle slug).
- `GameName`, `GameThumb`/`pictureOf`: a puzzle key or slug is a known game.
- `PublicCatalogue.catalogueFamilies`, `GameCatalogue`'s families view,
  `GameList`, `GameCards` (a puzzle card carries `kind: "puzzle"` and the
  kind filter offers it), the family page, `HomeFamilies`, About: draw the
  puzzle through the same components; a puzzle's card shows a "Solve one"
  line in place of the played-figures strip (nothing is counted until
  NUM-05 keeps solves, so nothing is promised).
- Skips, each with its reason in a comment: `GamePicker` (two-player set-up:
  families with board games), `champions` (ladders), `catalogueStats`
  (played counts over `RULE_VARIANT_LIST`, unchanged), the "also in this
  family" line under a board and a ladder (`boardGamesOf`).

### 3. Pages

- `/games/[slug]/page.tsx`: `puzzleFor(slug)` first → `PuzzleFrontDoor`
  (`src/components/puzzles/PuzzleFrontDoor.tsx`): picture, name, tagline,
  origin, also-known-as, the object, "Solve Number Place →" (to `/new`),
  the family panel, facets (Rules, Its family, Background), Wikipedia.
  `generateStaticParams` adds the puzzle slugs.
- `/rules`: `puzzleRulesPage(kind)` builds a `RulesPage` (`variant:
  GameKey`); the record link is left off for a puzzle.
- `/family`, `/background`: accept a puzzle key.
- `/new`: `PuzzleSetUp` — size tiles at the regular picture size, level
  chips, one button "Solve". Gated like every set-up page.
- `/play?size=&level=&seed=`: `PuzzlePlay` (client, `ssr: false` for the
  grid, `readyMark`): generates from the seed (a fresh seed when none),
  draws the grid, pencil-free entry by tapping a cell then a number key
  (44px keys below `sm`), a timer that starts on the first entry, "Check"
  says how many cells are wrong without saying which, and completion is
  detected in the browser. On completion: the time, "Another →", and for a
  member the XP the route paid.

### 4. XP and the route

- `xp.types.ts` / `xp.constants.ts`: `puzzleSolved` (25, cap 6, label
  "Puzzle solved" 解決, subject kind:size:hash). Not people-only.
- `xpGame.ts`: `XP_VARIANTS_TO_PLAY = EVERY_GAME_KEY.length`; `familyToWin`
  counts `boardGamesOf`. `xpPuzzle.ts`: `puzzleAwards(kind, hash)` →
  `[puzzleSolved, firstOfVariant kind, firstOfFamily numbers]`;
  `awardTourBonuses` after, as a finished game does.
- `src/app/api/puzzles/solved/route.ts`: POST `{ kind, size, level, givens,
  answer, elapsedMs }`; 401 without a member; 422 when `checkSolution` says
  no; rate-limited (`RATE_LIMITS.puzzleSolved`, a cost limit); answers
  `{ xp }`. No read of anything but the member.
- `xp.coverage.test.ts`: the ceiling adds a family met (150) and a first of
  each puzzle (50 each); `xpHistory.ts` names the subject.

### 5. Pictures, docs, About

- `e2e/puzzle-screenshots.spec.ts` (`GAME_SCREENSHOTS=1`): opens the solve at
  a fixed seed, fills a few cells, screenshots the grid to
  `public/art/games/numberPlace.jpg`; `pnpm screenshots:puzzles` runs it,
  then `art:thumbs`, then stamps `src/lib/puzzles/puzzleArt.data.ts` over
  the grid's files (`puzzleArt.coverage.test.ts`, the same shape as
  `boardArt.coverage.test.ts`).
- `puzzles.coverage.test.ts`: every kind named by a unit test and a browser
  spec, has a picture and a thumb, is in a family, has full copy and a
  filled rules page, generates a unique puzzle at every size and level
  under a time budget, and `checkSolution` refuses a wrong grid.
- About: the Getting started and catalogue chapters read the families from
  the table already; add a Puzzles paragraph to Playing here (how a solve
  works, what it pays). `README.md`: eight families, the Numbers row, a
  "Puzzles" section. `docs/DOCS_UPKEEP.md`: rows for `src/lib/puzzles/**`
  and `src/components/puzzles/**`. `docs/CORE_CONCEPTS.md`: a puzzle is not
  a variant.

## Tests

- Unit: `random.test.ts`, `numberPlace/generate.test.ts` (unique at 4/6/9 ×
  three levels, seeded and repeatable, givens within the level's band),
  `solve.test.ts`, `puzzleCheck.test.ts`, `puzzleCode.test.ts`,
  `gameKeys.test.ts`, `xpPuzzle.test.ts`, the route's test.
- Browser: `e2e/number-place.spec.ts`: the front door, set-up to solve, fill
  a 4×4 from the seed's solution (read through the page's data attribute),
  the done card, the XP toast for the operator; a stranger sees rules and no
  solve.
- The gates: `variants.coverage`, `gameLinks.coverage`,
  `gamePictures.coverage`, `familyMark.coverage`, `about.coverage`,
  `page-width`, `fits-a-phone`.

## What not to do

- No server-side generation, solving or timers. No polling.
- No `Game` row for a solve. No rating.
- Do not put a puzzle in `VARIANT_SPECS` or `RULE_VARIANT_DISPLAY`.

## Release summary

"A new family, Numbers, opens with Number Place — our Sudoku, at 4×4, 6×6 and 9×9, three levels, solved in your browser and paid in XP."
