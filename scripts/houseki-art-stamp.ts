/**
 * Writes down the fingerprint of the boards the Houseki games' pictures were taken of.
 *
 * Run by `pnpm screenshots:houseki`, straight after the screenshots and the
 * thumbnails, so the stamp and the pictures are always written together by one
 * command. `houseki.coverage.test.ts` compares it with the boards as they stand and
 * fails the build when they have come apart.
 */
import { writeFileSync } from "node:fs";

import { HOUSEKI_ART_FILES, readHousekiArtFingerprint } from "../src/lib/houseki/housekiArtFingerprint.ts";

const OUT = "src/lib/houseki/housekiArt.data.ts";
const fingerprint = readHousekiArtFingerprint();
if (fingerprint === null) {
  console.error(`Could not read one of ${HOUSEKI_ART_FILES.length} Houseki files; nothing written.`);
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    "/**",
    " * The Houseki games' boards as they were when `public/art/games/<game>.jpg` were taken.",
    " *",
    " * WRITTEN BY `pnpm screenshots:houseki`, NEVER BY HAND. It is a hash over",
    " * `HOUSEKI_ART_FILES` — see `housekiArtFingerprint.ts`. If the gate is",
    " * pointing at this line, re-take the pictures rather than editing the number:",
    " *",
    " *   pnpm screenshots:houseki",
    " */",
    `export const HOUSEKI_ART_FINGERPRINT = ${JSON.stringify(fingerprint)};`,
    "",
  ].join("\n"),
);
console.log(`${OUT} stamped ${fingerprint} over ${HOUSEKI_ART_FILES.length} files.`);
