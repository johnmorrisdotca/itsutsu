import { describe, expect, it } from "vitest";

import { describeRules } from "./rulesSummary";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";

/**
 * The line above a board describes that board.
 *
 * John opened a game of Halma against Meijin and read "Halma ハルマ · 9×9
 * Mini" over a board sixteen columns wide. Both halves were doing what they
 * were told: the engine snaps a size the variant does not offer as it builds
 * the state, so the board was right, and the label was reading the number in
 * the row, which was 9.
 *
 * Rows written since the size is settled on the way in cannot say 9 for a
 * game of Halma. Two in production still do, because they were written
 * before that, and rather than trust that no such row will ever exist again
 * the label snaps the same way the board does.
 */
const plain = { obstacles: "none", opening: "free", handicap: NO_HANDICAP };

describe("describeRules", () => {
  it("names the board a game is actually played on, not the number in the row", () => {
    // The case John found: stored 9, drawn 16.
    const line = describeRules({ ...plain, variant: "halma", size: 9 });
    expect(line, "the label repeated a size Halma does not have").toContain("16×16");
    expect(line).not.toContain("9×9");
  });

  it("does the same for the size that started all this", () => {
    // A Reversi game stored at 19×19 is still a game of Reversi on 8×8.
    expect(describeRules({ ...plain, variant: "reversi", size: 19 })).toContain("8×8");
  });

  it("leaves a size the game does offer exactly alone", () => {
    expect(describeRules({ ...plain, variant: "halma", size: 10 })).toContain("10×10");
    expect(describeRules({ ...plain, variant: "freestyle", size: 15 })).toContain("15×15");
    expect(describeRules({ ...plain, variant: "go", size: 13 })).toContain("13×13");
  });

  it("still says what the game is, and adds the board's own name", () => {
    const line = describeRules({ ...plain, variant: "halma", size: 9 });
    expect(line).toContain("Halma");
    // 16 is "Sixteen 十六路" in the size table; 9 is "Mini", which is what
    // John saw and what made the two halves visibly disagree.
    expect(line).toContain("Sixteen");
    expect(line).not.toContain("Mini");
  });

  it("says nothing clever about a variant it does not know", () => {
    // An unknown name has no sizes to snap to, so the row's number stands.
    expect(describeRules({ ...plain, variant: "not-a-game", size: 12 })).toContain("12×12");
  });
});
