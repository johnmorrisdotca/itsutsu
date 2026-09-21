import { describe, expect, it } from "vitest";

import { createGame, playMove } from "@/lib/gomoku/engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { AFTER_MOVE } from "@/lib/preferences/turnFlow";
import { pendingMove, submitWords } from "./pendingMove";

/**
 * A MOVE PLACED BUT NOT SENT.
 *
 * The property worth pinning is that the preview is the ENGINE'S answer and
 * not a drawing of one — so a capture shows as a capture and a win shows as a
 * win, before anything has left the browser.
 */
describe("a move placed but not sent", () => {
  it("shows the board the engine would leave, not the board with a stone painted on", () => {
    const state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    const placed = pendingMove(state, { kind: MOVE_KINDS.place, row: 4, col: 4 });

    expect(placed).not.toBeNull();
    // The turn is kept for posting, and the position is the engine's.
    expect(placed!.turn).toEqual({ kind: MOVE_KINDS.place, row: 4, col: 4 });
    expect(placed!.after.moves).toHaveLength(1);
    expect(placed!.after.toPlay).toBe(STONES.white);
    // And the real board is untouched: nothing has been played yet.
    expect(state.moves).toHaveLength(0);
  });

  it("shows a win as a win before it is sent", () => {
    // Black has four in a row and the fifth is placed but not submitted.
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    const idle = [
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 8, col: 0 },
      { row: 8, col: 8 },
    ];
    [0, 1, 2, 3].forEach((col, at) => {
      state = playMove(state, { row: 4, col });
      state = playMove(state, idle[at]);
    });

    const winning = pendingMove(state, { kind: MOVE_KINDS.place, row: 4, col: 4 });
    expect(winning).not.toBeNull();
    expect(winning!.after.winner, "the preview did not show the win the move makes").toBe(STONES.black);
    // The game itself is still in play: nothing has been sent.
    expect(state.winner).toBeNull();
  });

  it("takes no move the engine refuses, rather than previewing an unchanged board", () => {
    const state = playMove(createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0), { row: 4, col: 4 });
    // A point already holding a stone. A "pending" move here would put a
    // Submit button under a board that had not changed.
    expect(pendingMove(state, { kind: MOVE_KINDS.place, row: 4, col: 4 })).toBeNull();
  });
});

describe("what Submit says", () => {
  it("names where it is about to take you", () => {
    expect(submitWords(AFTER_MOVE.myGames, RULE_VARIANTS.freestyle)).toContain("my games");
    expect(submitWords(AFTER_MOVE.nextWaiting, RULE_VARIANTS.freestyle)).toContain("next game");
    // The game is NAMED, because "the next Ninuki" is the sentence somebody
    // means — read from the display table rather than spelled here, so a game
    // that is renamed does not leave this test asserting an old name.
    expect(submitWords(AFTER_MOVE.sameGame, RULE_VARIANTS.ninuki)).toContain(
      RULE_VARIANT_DISPLAY[RULE_VARIANTS.ninuki].label,
    );
  });

  it("promises no journey when the setting is to stay put", () => {
    const words = submitWords(AFTER_MOVE.stay, RULE_VARIANTS.freestyle);
    expect(words).toBe("Submit this move");
    expect(words).not.toContain("then");
  });
});
