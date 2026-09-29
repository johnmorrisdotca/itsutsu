/**
 * Writes down the fingerprint of the board the party games' pictures were taken of.
 *
 * Run by `pnpm screenshots:party`, straight after the screenshots and the
 * thumbnails, so the stamp and the pictures are always written together by
 * one command. `party.coverage.test.ts` compares it with the board as it
 * stands and fails the build when they have come apart.
 */
import { writeFileSync } from "node:fs";

import { PARTY_ART_FILES, readPartyArtFingerprint } from "../src/lib/party/partyArtFingerprint.ts";

const OUT = "src/lib/party/partyArt.data.ts";
const fingerprint = readPartyArtFingerprint();
if (fingerprint === null) {
  console.error(`Could not read one of ${PARTY_ART_FILES.length} party game files; nothing written.`);
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    "/**",
    " * The party games' boards as they were when `public/art/games/<game>.jpg` were taken.",
    " *",
    " * WRITTEN BY `pnpm screenshots:party`, NEVER BY HAND. It is a hash over",
    " * `PARTY_ART_FILES` — see `partyArtFingerprint.ts`. If the gate is",
    " * pointing at this line, re-take the pictures rather than editing the number:",
    " *",
    " *   pnpm screenshots:party",
    " */",
    `export const PARTY_ART_FINGERPRINT = ${JSON.stringify(fingerprint)};`,
    "",
  ].join("\n"),
);
console.log(`${OUT} stamped ${fingerprint} over ${PARTY_ART_FILES.length} files.`);
