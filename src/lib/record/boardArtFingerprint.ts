/*
 * A RELATIVE PATH, NOT `@/`, because `scripts/board-art-stamp.ts` imports this
 * from plain node, which resolves no aliases — the same reason
 * `release-take.ts`'s imports name their files. See `ladderFingerprint.ts`,
 * which this borrows both its hash and its whole shape from.
 */
import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE FILES A GAME'S PICTURE IS MADE OUT OF.
 *
 * `public/art/games/<variant>.jpg` is a SCREENSHOT of the board this code
 * draws, taken by `pnpm screenshots:games`. Git does not know one file is made
 * of the other, so changing how a board is drawn leaves forty-five pictures of
 * the old board in the repository, on the games index, the family cards, the
 * rules pages and every list that names a game — and nothing fails.
 *
 * It happened the day it was written about. AGENTS.md already says "when a
 * merge brings in a file that something else is DERIVED from, re-run the
 * derivation rather than reading the diff", with `pnpm art:thumbs` as the
 * example; the star was refitted, the pictures were not re-taken, and John saw
 * the old board on the games page: "You didn't update all the boards that were
 * adjusted? Chinese Checkers preview board looks bad."
 *
 * So the rule gets a gate, in the shape this repository already uses for the
 * bot ladder (`ladderFingerprint.ts`): hash the source, keep the hash beside
 * the artefact, and fail when they disagree.
 *
 * WHY THESE FILES AND NOT THE WHOLE OF `components/board`. What a screenshot
 * shows is the board's geometry, its paper and its stones. The files below
 * decide all three. A test file, a type file or a component that draws
 * something OUTSIDE the board's own box — the coordinate strips live in
 * `Board.tsx`, which is here — cannot change a picture that is cropped to the
 * board. Erring wide is the safe direction anyway: a file too many costs a
 * four-minute re-run, a file too few costs a wrong picture nobody notices.
 */
export const BOARD_ART_FILES: readonly string[] = [
  "src/components/board/Board.tsx",
  "src/components/board/Board.constants.ts",
  "src/components/board/BoardLines.tsx",
  "src/components/board/Intersection.tsx",
  "src/components/board/StoneMark.tsx",
  "src/components/board/appearance.ts",
  "src/components/board/margin.ts",
  "e2e/game-screenshots.spec.ts",
];

/**
 * The fingerprint of the board as it is drawn now, or null when any file
 * cannot be read.
 *
 * Null rather than a hash of what could be read: a partial hash matches
 * nothing and means "unknown", and a gate cannot tell that from "stale".
 */
export function readBoardArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(BOARD_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
