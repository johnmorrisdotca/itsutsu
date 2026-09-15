import type { LadderStrengthTable } from "./ladderStrength.types";

/**
 * The command that measures every game in the table again and rewrites
 * `ladderStrength.data.ts` — and nothing else. In memory, on the machine
 * running it: no database, no network, no request to the site.
 *
 * At 4,000 positions a move, which is what a look-ahead game is given on the
 * live site; twenty games a pairing, colours alternating.
 *
 * Five in a row is not in the table yet. Its round robin ran past an hour on one
 * machine without finishing — at 15×15, and again at its smallest board, 9×9 —
 * because its line search weighs a threat reading at every candidate, which the
 * look-ahead games do not. That is a run for a machine left alone rather than
 * one to wait on before shipping a bot change: add `freestyle:9` to the boards
 * when it is run, and the game has no row, which reads as nothing, until then.
 */
export const LADDER_STRENGTH_COMMAND =
  "BOT_LADDER=1 LADDER_WRITE=1 LADDER_BOARDS=reversi:8,checkers:8 LADDER_GAMES=20 " +
  "LADDER_NODES=4000 pnpm exec vitest run src/lib/gomoku/ladder.match.test.ts --disable-console-intercept";

/**
 * The whole text of `ladderStrength.data.ts` for a table.
 *
 * One function, used by the generator to write the file and by
 * `ladderStrength.test.ts` to check the checked-in file is exactly what the
 * generator writes — so a row edited by hand is caught as a hand edit, rather
 * than read as a measurement nobody made. Games sorted, so a run that measured
 * them in another order leaves the same file.
 */
export function ladderStrengthSource(table: LadderStrengthTable): string {
  const sorted = Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b)));
  return [
    "/**",
    " * GENERATED: how the graded computer players actually did against each other, per game.",
    " *",
    " * Written by `ladder.match.test.ts` with LADDER_WRITE=1; never edit a row by hand.",
    " * Every row carries the fingerprint of the files that decide a grade's play",
    " * (`LADDER_FINGERPRINT_FILES`), and `measuredLadder` answers nothing for a row",
    " * whose fingerprint is not the current code's. A stale measurement is not shown,",
    " * and it does not fail the build either: silence, not a guess.",
    " *",
    " * To measure again, on your own CPU, writing only this file:",
    " *",
    ` *   ${LADDER_STRENGTH_COMMAND}`,
    " */",
    'import type { LadderStrengthTable } from "./ladderStrength.types";',
    "",
    `export const LADDER_STRENGTH: LadderStrengthTable = ${JSON.stringify(sorted, null, 2)};`,
    "",
  ].join("\n");
}
