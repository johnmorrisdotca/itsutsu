import type { OrdinaryLevel, PuzzleLevel } from "./puzzles.types";

/**
 * A level as the puzzles that have no extra hard read it: extra hard is hard. None of them offers it (`spec.levels`
 * refuses it in an address and the routes refuse it in a request), so this is never what a reader meets, only what
 * keeps a stray value from indexing nothing, and the one place a package's three levels meet the site's four.
 * A module of its own, with nothing imported, so a generator can read it without reaching the tables.
 */
export function ordinaryLevel(level: PuzzleLevel): OrdinaryLevel {
  return level === "extra-hard" ? "hard" : level;
}
