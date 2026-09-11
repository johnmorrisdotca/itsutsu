import { describe, expect, it } from "vitest";

import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import { advancesAfterMove, carriesOnwardFrom, nextWaiting, waitingFirst } from "./nextGame";

/** Only the two fields the rule reads, so the cases say what they are about. */
const at = (id: string, since: string) => ({ game: { id }, since });

describe("which game to play next", () => {
  it("takes the one that has been waiting longest", () => {
    /*
     * The opposite of every other list here, on purpose. A record reads newest
     * first because it is history; a queue of games waiting on YOU is a debt,
     * and the oldest is the one somebody is wondering about.
     */
    const queue = [at("new", "2026-09-10T12:00:00Z"), at("old", "2026-09-01T12:00:00Z")];
    expect(nextWaiting(queue)?.game.id).toBe("old");
  });

  it("never sends somebody back to the game they just left", () => {
    /*
     * A move does not always end your turn — two stones a turn in Connect6 —
     * so the board just played can still be waiting on you a second later.
     * Taking somebody "onward" to where they already are is the one outcome
     * that would read as the feature being broken.
     */
    const queue = [at("just-played", "2026-09-01T12:00:00Z"), at("other", "2026-09-05T12:00:00Z")];
    expect(nextWaiting(queue, "just-played")?.game.id).toBe("other");
  });

  it("says nothing is waiting rather than inventing somewhere to go", () => {
    expect(nextWaiting([])).toBeNull();
    expect(nextWaiting([at("only", "2026-09-01T12:00:00Z")], "only")).toBeNull();
  });

  it("orders a whole queue, not just its head", () => {
    const queue = [at("c", "2026-09-09T00:00:00Z"), at("a", "2026-09-01T00:00:00Z"), at("b", "2026-09-05T00:00:00Z")];
    expect([...queue].sort(waitingFirst).map((one) => one.game.id)).toEqual(["a", "b", "c"]);
  });

  it("stays put when the move did not end the turn", () => {
    /*
     * Connect6 lays two stones a turn. After the first, the board is still
     * waiting on the same person, and being carried "onward" to the board
     * they are already looking at is the one outcome that reads as broken.
     */
    expect(carriesOnwardFrom(GAME_STATUS.playing, STONES.black, STONES.black)).toBe(false);
    expect(carriesOnwardFrom(GAME_STATUS.playing, STONES.white, STONES.black)).toBe(true);
  });

  it("stays put on a game that has just ended, whoever won it", () => {
    // The result is what the move was for. Nobody is carried past their own win.
    for (const ended of [GAME_STATUS.won, GAME_STATUS.draw]) {
      expect(carriesOnwardFrom(ended, STONES.white, STONES.black)).toBe(false);
      expect(carriesOnwardFrom(ended, STONES.black, STONES.black)).toBe(false);
    }
  });

  it("carries everybody onward for now, and has somewhere for the choice to live", () => {
    // True for everybody until the account preferences it will read exist.
    expect(advancesAfterMove()).toBe(true);
  });

  it("leaves the list it was given alone", () => {
    // The same rule the engine keeps: a function that sorts its argument in
    // place surprises the caller that was still reading it.
    const queue = [at("b", "2026-09-05T00:00:00Z"), at("a", "2026-09-01T00:00:00Z")];
    nextWaiting(queue);
    expect(queue.map((one) => one.game.id)).toEqual(["b", "a"]);
  });
});
