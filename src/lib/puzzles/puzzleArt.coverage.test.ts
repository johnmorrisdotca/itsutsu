import { describe, expect, it } from "vitest";

import { PUZZLE_ART_FINGERPRINT } from "./puzzleArt.data";
import { PUZZLE_ART_FILES, readPuzzleArtFingerprint } from "./puzzleArtFingerprint";

/**
 * EVERY PUZZLE'S PICTURE IS A PICTURE OF THE GRID AS IT IS DRAWN NOW.
 *
 * The boards have `boardArt.coverage.test.ts`, written the day forty-five
 * pictures of an old board stayed in the repository with every test green.
 * A puzzle's grid is drawn by other files, so it gets the same gate over its
 * own — a change to `PuzzleGrid.tsx` fails the build until
 * `pnpm screenshots:puzzles` has re-taken the puzzles' pictures, and leaves
 * the boards' pictures alone.
 */
describe("the puzzle pictures match the grid they are of", () => {
  it("was stamped when the pictures were last taken", () => {
    expect(PUZZLE_ART_FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is a picture of the grid as it stands", () => {
    const now = readPuzzleArtFingerprint();
    expect(now, "one of the puzzle's files could not be read").not.toBeNull();
    expect(
      now,
      "The puzzle grid is drawn differently from when public/art/games/<puzzle>.jpg were taken. Re-take them:\n\n" +
        "    pnpm screenshots:puzzles\n\n" +
        `(The files watched are ${PUZZLE_ART_FILES.join(", ")} — see puzzleArtFingerprint.ts if one of them should not be.)`,
    ).toBe(PUZZLE_ART_FINGERPRINT);
  });
});
