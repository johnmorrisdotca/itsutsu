import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";

/**
 * The files that decide how a party game's picture looks: its board, its
 * colours and the scene the picture is taken of. The same idea as
 * `boardArtFingerprint.ts` for the boards and `puzzleArtFingerprint.ts` for
 * the puzzles, kept apart so that a change to Dots and Boxes' board or
 * Mancala's asks for the party games' pictures to be re-taken and nothing
 * else's.
 */
export const PARTY_ART_FILES: readonly string[] = [
  "src/components/party/DotsBoard.tsx",
  "src/components/party/GhostFragment.tsx",
  "src/components/party/GhostTurnLine.tsx",
  "src/components/party/party.constants.ts",
  "src/lib/party/dotsAndBoxes/dotsAndBoxes.ts",
  "src/lib/party/superghost/superghost.ts",
  "src/components/party/MancalaBoard.tsx",
  "src/components/party/mancalaLayout.ts",
  "src/lib/party/mancala/sowing.ts",
  "src/lib/party/mancala/mancala.ts",
  "src/components/party/tenka/TenkaMap.tsx",
  "src/components/party/tenka/TenkaWraps.tsx",
  "src/components/party/tenka/tenka.constants.ts",
  "src/lib/party/tenka/tenkaShapes.data.ts",
  "src/components/party/TrainTable.tsx",
  "src/components/party/DominoFace.tsx",
  "src/components/party/trainLayout.ts",
  "src/lib/party/mexicanTrain/mexicanTrain.ts",
  "src/lib/party/mexicanTrain/trainComputer.ts",
  "src/components/party/cards/CardPlay.tsx",
  "src/components/party/cards/CardTableParts.tsx",
  "src/components/party/cards/CardSeats.tsx",
  "src/components/party/cards/cardTable.constants.ts",
  "src/components/party/cards/heartsAdapter.tsx",
  "src/components/party/cards/climbAdapters.tsx",
  "src/components/party/cards/goFishAdapter.tsx",
  "src/components/party/cards/crazyEightsAdapter.tsx",
  "src/components/party/cards/spadesAdapter.tsx",
  "src/components/party/cards/ginRummyAdapter.tsx",
  "src/components/party/cards/euchreAdapter.tsx",
  "src/components/party/cards/cribbageAdapter.tsx",
  "src/components/cards/PlayingCard.tsx",
  "src/components/cards/CardFace.tsx",
  "src/components/cards/CardBack.tsx",
  "src/components/cards/CardHand.tsx",
  "src/components/cards/Cards.constants.ts",
  "e2e/party-screenshots.spec.ts",
];

export function readPartyArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(PARTY_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
