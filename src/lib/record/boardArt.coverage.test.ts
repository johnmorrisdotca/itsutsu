import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { BOARD_ART_FINGERPRINT } from "./boardArt.data";
import { BOARD_ART_FILES, readBoardArtFingerprint } from "./boardArtFingerprint";

/**
 * EVERY GAME'S PICTURE IS A PICTURE OF THE BOARD AS IT IS DRAWN NOW.
 *
 * `public/art/games/<variant>.jpg` is a screenshot of the board this code
 * draws. Git does not know one file is made of the other, so changing how a
 * board is drawn leaves the old picture on the games index, the family cards,
 * the rules pages and every list that names a game — and nothing fails.
 *
 * It happened the day this was written. The Chinese Checkers star was refitted
 * from half its board to the whole of it, forty-five pictures of the old board
 * stayed where they were, and John found it on the games page: "You didn't
 * update all the boards that were adjusted? Chinese Checkers preview board
 * looks bad." AGENTS.md already had the rule — re-run the derivation rather
 * than reading the diff — and a rule with no gate is a rule kept until it is
 * not.
 *
 * WHY IT FAILS RATHER THAN GOES QUIET. The bot ladder's fingerprint silences a
 * stale table, because a blank row is honest and a wrong number is not. There
 * is no blank here: the picture is already in the repository and is served to
 * everybody who opens /games. A stale one cannot be hidden, only corrected, so
 * this stops the build and says the one command that corrects it.
 */
describe("the pictures match the board they are of", () => {
  it("was stamped when the pictures were last taken", () => {
    expect(BOARD_ART_FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is a picture of the board as it stands", () => {
    const now = readBoardArtFingerprint();
    expect(now, "one of the board's files could not be read").not.toBeNull();
    expect(
      now,
      "The board is drawn differently from when public/art/games/*.jpg were taken, so every game's " +
        "picture on /games, the family cards and the rules pages is of the old board. Re-take them:\n\n" +
        "    pnpm screenshots:games\n\n" +
        `(About four minutes; it writes the pictures, the thumbnails and the stamp together. The files ` +
        `watched are ${BOARD_ART_FILES.join(", ")} — see boardArtFingerprint.ts if one of them should not be.)`,
    ).toBe(BOARD_ART_FINGERPRINT);
  });

  /*
   * And the pictures are all there. The fingerprint says they are current; it
   * cannot say they exist, and a game whose picture was never taken shows a
   * gap on every page that names it.
   */
  it("has a picture for every game", () => {
    const missing = RULE_VARIANT_LIST.filter((variant) => !existsSync(`public/art/games/${variant}.jpg`));
    expect(missing, "a game with no picture — run pnpm screenshots:games").toEqual([]);
  });
});
