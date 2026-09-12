import { describe, expect, it } from "vitest";

import { ASKING } from "@/components/ui/ui.constants";

import { advanceHold, NOTHING_HELD, type AdvanceHold } from "./advanceHold";

/**
 * The rule that keeps a move from swapping the board out from under an open
 * resign or cancel. Checked here rather than in a browser because it is three
 * events and one slot, and a browser can only show one path per run.
 */

/** A stand-in for "the move that would carry somebody onward", named so the assertions read. */
const MOVE = "carry onward to the next game";
const OTHER = "carry onward, but from the later move";

/** Walks a whole sequence, so a test says what a player did rather than what a state was. */
function walk(events: readonly Parameters<typeof advanceHold<string>>[1][]) {
  let hold: AdvanceHold<string> = NOTHING_HELD;
  const carried: string[] = [];
  for (const event of events) {
    const step = advanceHold(hold, event);
    hold = step.hold;
    if (step.now !== null) carried.push(step.now);
  }
  return { hold, carried };
}

describe("holding the advance while a question is up", () => {
  it("carries on at once when nothing is being asked", () => {
    const { hold, carried } = walk([{ kind: "move", move: MOVE }]);
    expect(carried).toEqual([MOVE]);
    // Nothing is kept: an advance already made is not one to make again.
    expect(hold).toEqual(NOTHING_HELD);
  });

  it("holds a move that lands while the question is on the screen", () => {
    const { hold, carried } = walk([{ kind: ASKING.asked }, { kind: "move", move: MOVE }]);
    expect(carried, "the board moved out from under an open dialog").toEqual([]);
    expect(hold).toEqual({ asked: true, waiting: MOVE });
  });

  it("carries on when the question is waved away", () => {
    const { hold, carried } = walk([
      { kind: ASKING.asked },
      { kind: "move", move: MOVE },
      { kind: ASKING.dismissed },
    ]);
    expect(carried).toEqual([MOVE]);
    expect(hold).toEqual(NOTHING_HELD);
  });

  it("drops the held advance when the question is answered", () => {
    /*
     * The resignation is what happens next, and its own path decides where
     * that leaves the player — on the board with the result on it. Carrying
     * them off it would whisk them past their own game ending.
     */
    const { hold, carried } = walk([
      { kind: ASKING.asked },
      { kind: "move", move: MOVE },
      { kind: ASKING.answered },
    ]);
    expect(carried).toEqual([]);
    expect(hold).toEqual(NOTHING_HELD);
  });

  it("keeps only the last move played while the question was up", () => {
    // Connect6 lays two stones, so a second move inside the window is real.
    const { carried } = walk([
      { kind: ASKING.asked },
      { kind: "move", move: MOVE },
      { kind: "move", move: OTHER },
      { kind: ASKING.dismissed },
    ]);
    expect(carried).toEqual([OTHER]);
  });

  it("carries nothing on a question opened and shut with no move behind it", () => {
    const { hold, carried } = walk([{ kind: ASKING.asked }, { kind: ASKING.dismissed }]);
    expect(carried).toEqual([]);
    expect(hold).toEqual(NOTHING_HELD);
  });

  it("lets go of a hold the moment its question is answered, and holds nothing after", () => {
    /*
     * The latch this guards against: an answered question whose act was
     * REFUSED leaves the player on a live board, and a hold still set would
     * swallow their next move's advance for the rest of the session.
     */
    const { carried } = walk([
      { kind: ASKING.asked },
      { kind: ASKING.answered },
      { kind: "move", move: MOVE },
    ]);
    expect(carried).toEqual([MOVE]);
  });

  it("leaves the hold it was given alone", () => {
    const before: AdvanceHold<string> = { asked: true, waiting: MOVE };
    advanceHold(before, { kind: ASKING.dismissed });
    expect(before).toEqual({ asked: true, waiting: MOVE });
  });
});
