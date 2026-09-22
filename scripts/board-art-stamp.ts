/**
 * Writes down the fingerprint of the board the pictures were taken of.
 *
 * Run by `pnpm screenshots:games`, straight after the screenshots and the
 * thumbnails, so the stamp and the pictures are always written together by one
 * command. `boardArt.coverage.test.ts` compares it with the board as it stands
 * and fails the build when they have come apart.
 */
import { writeFileSync } from "node:fs";

import { BOARD_ART_FILES, readBoardArtFingerprint } from "../src/lib/record/boardArtFingerprint.ts";

const OUT = "src/lib/record/boardArt.data.ts";
const fingerprint = readBoardArtFingerprint();
if (fingerprint === null) {
  console.error(`Could not read one of ${BOARD_ART_FILES.length} board files; nothing written.`);
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    "/**",
    " * The board as it was when `public/art/games/*.jpg` were taken.",
    " *",
    " * WRITTEN BY `pnpm screenshots:games`, NEVER BY HAND. It is a hash over",
    " * `BOARD_ART_FILES` — see `boardArtFingerprint.ts` for why a picture needs",
    " * one at all, and for the day the star was refitted and forty-five pictures",
    " * of the old board stayed in the repository with nothing failing.",
    " *",
    " * If the gate is pointing at this line, the answer is to re-take the",
    " * pictures rather than to edit the number:",
    " *",
    " *   pnpm screenshots:games",
    " */",
    `export const BOARD_ART_FINGERPRINT = ${JSON.stringify(fingerprint)};`,
    "",
  ].join("\n"),
);
console.log(`${OUT} stamped ${fingerprint} over ${BOARD_ART_FILES.length} files.`);
