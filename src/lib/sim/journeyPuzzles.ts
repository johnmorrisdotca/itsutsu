import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * APPROXIMATE PUZZLE POINTS FOR THE PROJECTION.
 *
 * The real score comes from `pointsFor` (`src/lib/puzzles/puzzlePoints.ts`),
 * which needs an actual generated grid — its givens, a solver's guesses, the
 * checks and hints spent. Generating a real grid for every one of a
 * simulated player's several thousand solves across a year is not a
 * reasonable thing to do inside a page render, so this table stands in for
 * it: the measured points at each puzzle's default size and level, from
 * `docs/plans/points/README.md`'s own table (read 2026-09-25). That is an
 * APPROXIMATION, not the real function, and this comment is the flag for it.
 *
 * `SIM_SITE_POINTS_WEIGHT` then does what PTS-01 proposes for the real site:
 * scale each puzzle's own points so a medium solve at its default size is
 * worth about 100 site points (IP), the same way `gameMax` puts a Gomoku win
 * at 100. PTS-01 has not shipped in code yet (only its plan), so this weight
 * lives here rather than being imported from `puzzles.constants.ts`.
 */
const MEASURED_POINTS: Partial<Record<PuzzleKind, Record<PuzzleLevel, number>>> = {
  numberPlace: { easy: 205, medium: 250, hard: 285 },
  gomoji: { easy: 1000, medium: 800, hard: 650 },
};

/** Weight so a medium solve is ~100: 100 / the measured medium score. */
function weightFor(kind: PuzzleKind): number {
  const medium = MEASURED_POINTS[kind]?.medium;
  return medium && medium > 0 ? 100 / medium : 1;
}

/** IP a single solve of this puzzle, at this level, is worth in the projection. */
export function approxPuzzleIp(kind: PuzzleKind, level: PuzzleLevel): number {
  const points = MEASURED_POINTS[kind]?.[level] ?? MEASURED_POINTS[kind]?.medium ?? 100;
  return Math.round(points * weightFor(kind));
}

/** Whether this puzzle kind can be "played out" without being solved (only the word puzzles can). */
export function isWordPuzzle(kind: PuzzleKind): boolean {
  return kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop" || kind === "koushi";
}

/** Chance a single attempt at this level is solved rather than played out or abandoned. Approximate, not measured. */
export function approxSolveChance(level: PuzzleLevel): number {
  return level === "easy" ? 0.95 : level === "medium" ? 0.85 : 0.7;
}
