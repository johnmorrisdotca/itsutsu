import { describe, expect, it } from "vitest";

import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";

const draft: RulesDraft = {
  variant: "freestyle",
  size: 15,
  obstacles: "none",
  opening: "free",
  moveTimeMs: null,
  timeoutPenalty: "turn",
  clockMode: "move",
  rated: true,
  allowResign: true,
  open: false,
  handicap: NO_HANDICAP,
};

describe("applyRulesChange", () => {
  it("takes a change through untouched when nothing disagrees", () => {
    expect(applyRulesChange(draft, { size: 19 }).size).toBe(19);
    expect(applyRulesChange(draft, { rated: false }).rated).toBe(false);
  });

  it("carries the board with a change of game", () => {
    // Reversi is 8×8: asking for it from a 15×15 game asks for its board too.
    expect(applyRulesChange(draft, { variant: "reversi" }).size).toBe(8);
  });

  it("keeps a board the new game does have", () => {
    expect(applyRulesChange({ ...draft, size: 19 }, { variant: "hex" }).size).toBe(19);
  });

  it("keeps an opening a shared game may be played under", () => {
    // Only three of the openings work across two devices; see SHARED_OPENINGS.
    expect(applyRulesChange(draft, { opening: "longPro" }).opening).toBe("longPro");
  });

  it("drops an opening a shared game cannot be played under", () => {
    // Swap needs both players in the room to answer for it, so it is not one
    // of the three; asking for it here falls back to a free opening rather
    // than being sent to a server that would refuse it.
    expect(applyRulesChange(draft, { opening: "swap2" }).opening).toBe("free");
  });

  it("leaves the draft it was given alone", () => {
    // The same rule the engine follows: every change is a new value.
    applyRulesChange(draft, { variant: "reversi" });
    expect(draft.variant).toBe("freestyle");
    expect(draft.size).toBe(15);
  });

  it("settles in one step, whatever order the changes arrive in", () => {
    // Board then game, or game then board: the answer is the game's board.
    const a = applyRulesChange(applyRulesChange(draft, { size: 19 }), { variant: "reversi" });
    const b = applyRulesChange(applyRulesChange(draft, { variant: "reversi" }), { size: 19 });
    expect(a.size).toBe(8);
    expect(b.size).toBe(8);
  });
});
