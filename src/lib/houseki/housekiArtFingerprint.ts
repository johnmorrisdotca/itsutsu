import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";

/**
 * The files that decide how a Houseki game's picture looks: the package that
 * plays the game, the components that draw its board and its gems, the colours and
 * symbols of the gems, and the scene the picture is taken of. The same idea as
 * `casualArtFingerprint.ts` for the casual games, kept apart so that a new release
 * of Houseki, or a change to how a gem is drawn, asks for these five pictures to be
 * re-taken and nothing else's.
 */
export const HOUSEKI_ART_FILES: readonly string[] = [
  // The boards the pictures show are the package's: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/houseki/package.json",
  "src/components/houseki/HousekiWell.tsx",
  "src/lib/houseki/houseki.constants.ts",
  "e2e/houseki-screenshots.spec.ts",
];

export function readHousekiArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(HOUSEKI_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
