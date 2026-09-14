import { describe, expect, it } from "vitest";

import {
  NO_HANDICAP,
  OPENING_RULES,
  RULE_VARIANT_LIST,
  VARIANT_SPECS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";
import { applyRulesChange, openingsOffered, type RulesDraft } from "./rulesDraft";

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

describe("openingsOffered", () => {
  it("offers every game the free opening, so there is always an answer to mark", () => {
    for (const variant of RULE_VARIANT_LIST) {
      expect(openingsOffered(variant), variant).toContain(OPENING_RULES.free);
    }
  });

  it("offers only what a shared game can use AND what the game itself allows", () => {
    for (const variant of RULE_VARIANT_LIST) {
      for (const opening of openingsOffered(variant)) {
        expect(SHARED_OPENINGS, `${variant} offers ${opening}`).toContain(opening);
        expect(VARIANT_SPECS[variant].openings, `${variant} offers ${opening}`).toContain(opening);
      }
    }
  });

  it("offers the whole three at the line games and one at the rest", () => {
    expect(openingsOffered("freestyle")).toEqual([OPENING_RULES.free, OPENING_RULES.pro, OPENING_RULES.longPro]);
    expect(openingsOffered("renju")).toEqual([OPENING_RULES.free, OPENING_RULES.pro, OPENING_RULES.longPro]);
    // Hex offers Swap too, which cannot be played across two devices.
    expect(openingsOffered("hex")).toEqual([OPENING_RULES.free]);
    expect(openingsOffered("reversi")).toEqual([OPENING_RULES.free]);
    expect(openingsOffered("halma")).toEqual([OPENING_RULES.free]);
  });

  it("does not narrow the list for a game it cannot look up", () => {
    expect(openingsOffered("no-such-game")).toEqual(SHARED_OPENINGS);
  });
});

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

  it("drops an opening the new game does not offer, and keeps one it does", () => {
    /*
     * The set-up screen used to carry Pro from Gomoku to Halma, show "Pro
     * opening" in its summary, and have the game made with Free — the creation
     * route normalises it, silently. The draft now says what will be played.
     */
    const pro = applyRulesChange(draft, { opening: OPENING_RULES.pro });
    expect(pro.opening).toBe(OPENING_RULES.pro);
    expect(applyRulesChange(pro, { variant: "halma" }).opening).toBe(OPENING_RULES.free);
    expect(applyRulesChange(pro, { variant: "reversi" }).opening).toBe(OPENING_RULES.free);
    expect(applyRulesChange(pro, { variant: "renju" }).opening).toBe(OPENING_RULES.pro);
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

  it("never leaves a draft on an opening its own game does not offer", () => {
    for (const from of RULE_VARIANT_LIST) {
      for (const opening of openingsOffered(from)) {
        for (const to of RULE_VARIANT_LIST) {
          const next = applyRulesChange({ ...draft, variant: from, opening }, { variant: to });
          expect(openingsOffered(to), `${from} ${opening} -> ${to} kept ${next.opening}`).toContain(next.opening);
        }
      }
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
