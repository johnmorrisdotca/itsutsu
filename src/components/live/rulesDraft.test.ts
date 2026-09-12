import { describe, expect, it } from "vitest";

import { NO_HANDICAP, RULE_VARIANT_LIST, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
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

  it("snaps to a board the picker OFFERS, not merely one the engine allows", () => {
    /*
     * The bug this closes, found by clicking Halma and then Gomoku.
     *
     * Gomoku declares no `boardSizes`, so `sizeForVariant` answered "any size
     * is fine" and left the draft at 8 — while the picker, reading
     * `boardSizesFor`, drew 9, 13, 15 and 19. The header said 8×8, four
     * blocks were on the screen and not one of them was ticked.
     */
    expect(applyRulesChange(draft, { variant: "halma", size: 8 }).size).toBe(8);
    expect(applyRulesChange({ ...draft, variant: "halma", size: 8 }, { variant: "freestyle" }).size).toBe(9);
    // The same from every board no line game is offered on.
    for (const size of [3, 4, 5, 6, 7, 8, 10, 11, 16, 17]) {
      expect(
        applyRulesChange(draft, { variant: "freestyle", size }).size,
        `${size} is not a board Gomoku is offered on`,
      ).toBe(9);
    }
  });

  it("never leaves a draft on a board its own game does not offer", () => {
    /*
     * The property, across every pair: whatever game you come from and
     * whatever board you were on, the board you land on is one the next
     * game's picker will have a block for. Otherwise the screen shows a row
     * of boards with no answer marked on it.
     */
    for (const from of RULE_VARIANT_LIST) {
      for (const size of boardSizesFor(from)) {
        for (const to of RULE_VARIANT_LIST) {
          const next = applyRulesChange({ ...draft, variant: from, size }, { variant: to });
          expect(
            boardSizesFor(to),
            `${from} at ${size} -> ${to} landed on ${next.size}, which it does not offer`,
          ).toContain(next.size);
        }
      }
    }
  });
});
