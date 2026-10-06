/**
 * Writes down the fingerprint of the board the casual games' pictures were taken of.
 *
 * Run by `pnpm screenshots:casual`, straight after the screenshots and the
 * thumbnails, so the stamp and the pictures are always written together by
 * one command. `casual.coverage.test.ts` compares it with the board as it
 * stands and fails the build when they have come apart.
 */
import { writeFileSync } from "node:fs";

import { CASUAL_ART_FILES, readCasualArtFingerprint } from "../src/lib/casual/casualArtFingerprint.ts";

const OUT = "src/lib/casual/casualArt.data.ts";
const fingerprint = readCasualArtFingerprint();
if (fingerprint === null) {
  console.error(`Could not read one of ${CASUAL_ART_FILES.length} casual game files; nothing written.`);
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    "/**",
    " * The casual games' boards as they were when `public/art/games/<game>.jpg` were taken.",
    " *",
    " * WRITTEN BY `pnpm screenshots:casual`, NEVER BY HAND. It is a hash over",
    " * `CASUAL_ART_FILES` — see `casualArtFingerprint.ts`. If the gate is",
    " * pointing at this line, re-take the pictures rather than editing the number:",
    " *",
    " *   pnpm screenshots:casual",
    " */",
    `export const CASUAL_ART_FINGERPRINT = ${JSON.stringify(fingerprint)};`,
    "",
  ].join("\n"),
);
console.log(`${OUT} stamped ${fingerprint} over ${CASUAL_ART_FILES.length} files.`);
