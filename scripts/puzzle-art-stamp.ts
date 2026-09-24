/**
 * Writes down the fingerprint of the grid the puzzle pictures were taken of.
 *
 * Run by `pnpm screenshots:puzzles`, straight after the screenshots and the
 * thumbnails, so the stamp and the pictures are always written together by
 * one command. `puzzleArt.coverage.test.ts` compares it with the grid as it
 * stands and fails the build when they have come apart.
 */
import { writeFileSync } from "node:fs";

import { PUZZLE_ART_FILES, readPuzzleArtFingerprint } from "../src/lib/puzzles/puzzleArtFingerprint.ts";

const OUT = "src/lib/puzzles/puzzleArt.data.ts";
const fingerprint = readPuzzleArtFingerprint();
if (fingerprint === null) {
  console.error(`Could not read one of ${PUZZLE_ART_FILES.length} puzzle files; nothing written.`);
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    "/**",
    " * The puzzle grid as it was when `public/art/games/<puzzle>.jpg` were taken.",
    " *",
    " * WRITTEN BY `pnpm screenshots:puzzles`, NEVER BY HAND. It is a hash over",
    " * `PUZZLE_ART_FILES` — see `puzzleArtFingerprint.ts`. If the gate is",
    " * pointing at this line, re-take the pictures rather than editing the number:",
    " *",
    " *   pnpm screenshots:puzzles",
    " */",
    `export const PUZZLE_ART_FINGERPRINT = ${JSON.stringify(fingerprint)};`,
    "",
  ].join("\n"),
);
console.log(`${OUT} stamped ${fingerprint} over ${PUZZLE_ART_FILES.length} files.`);
