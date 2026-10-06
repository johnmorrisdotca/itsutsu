import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";

/**
 * The files that decide how a casual game's picture looks: the package that
 * draws the board, the component that mounts it, and the scene the picture is
 * taken of. The same idea as `partyArtFingerprint.ts` for the party games,
 * kept apart so that a new release of Karakuri asks for these eight pictures
 * to be re-taken and nothing else's.
 */
export const CASUAL_ART_FILES: readonly string[] = [
  // The boards are the package's drawing: a new version (or a new tarball) of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/karakuri/package.json",
  "node_modules/@johnmorrisdotca/karakuri/dist/theme.js",
  "node_modules/@johnmorrisdotca/karakuri/dist/style.js",
  "src/components/casual/CasualBoard.tsx",
  "e2e/casual-screenshots.spec.ts",
];

export function readCasualArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(CASUAL_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
