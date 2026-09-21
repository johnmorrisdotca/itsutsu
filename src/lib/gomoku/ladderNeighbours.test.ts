import { describe, expect, it } from "vitest";

import { BOT_TIERS } from "./opponent.constants";
import { ladderNeighbours, readsAsLevel } from "./ladderNeighbours";
import type { LadderMeasurement } from "./ladderStrength.types";

/**
 * The reduction from a round robin to the two comparisons a player is making.
 *
 * The case worth having is the one that started the ticket: two rungs that
 * measured level must not be printed as one beating the other.
 */
function measured(pairings: LadderMeasurement["pairings"]): LadderMeasurement {
  return {
    variant: "reversi",
    size: 8,
    gamesPerPairing: 20,
    nodesPerMove: 4000,
    measuredOn: "2026-09-15",
    fingerprint: "f",
    tiers: [BOT_TIERS.dan, BOT_TIERS.meijin, BOT_TIERS.guoshou],
    pairings,
  };
}

describe("one grade against the rungs beside it", () => {
  it("reads a pairing from the asked-for grade's side, whichever way it was stored", () => {
    const table = measured([
      { first: BOT_TIERS.meijin, second: BOT_TIERS.guoshou, wins: 9, losses: 8, draws: 3 },
      { first: BOT_TIERS.dan, second: BOT_TIERS.meijin, wins: 4, losses: 15, draws: 1 },
    ]);

    // Stored from Meijin's side, and asked from Meijin's side: unchanged.
    expect(ladderNeighbours(table, BOT_TIERS.meijin).above).toEqual({
      tier: BOT_TIERS.guoshou,
      wins: 9,
      losses: 8,
      draws: 3,
    });
    // The same row asked from Guoshou's side: the wins are the losses.
    expect(ladderNeighbours(table, BOT_TIERS.guoshou).below).toEqual({
      tier: BOT_TIERS.meijin,
      wins: 8,
      losses: 9,
      draws: 3,
    });
    // And the rung below Meijin, stored the other way round again.
    expect(ladderNeighbours(table, BOT_TIERS.meijin).below).toEqual({
      tier: BOT_TIERS.dan,
      wins: 15,
      losses: 4,
      draws: 1,
    });
  });

  it("says null at the ends of the ladder, rather than an empty record", () => {
    const table = measured([]);
    // Разряд is the bottom rung and Guoshou the top: no rung there at all,
    // which is a different fact from "they played and it was nil-nil".
    expect(ladderNeighbours(table, BOT_TIERS.razryad).below).toBeNull();
    expect(ladderNeighbours(table, BOT_TIERS.guoshou).above).toBeNull();
    // A rung that exists but was never played is also null, not 0-0.
    expect(ladderNeighbours(table, BOT_TIERS.razryad).above).toBeNull();
  });

  it("says nothing about a specialist, who is on no rung", () => {
    const both = ladderNeighbours(measured([]), BOT_TIERS.tamenoki);
    expect(both).toEqual({ above: null, below: null });
  });

  describe("whether a pairing settles anything", () => {
    it("calls the top two level at the scores actually measured", () => {
      /*
       * Reversi 7-13 and draughts 3-6-11, measured 2026-09-21. Both LOOK like
       * results and neither is: two-sided p of 0.26 and 0.51 between players
       * of equal strength. A display that rounded either into "the higher
       * grade is stronger" would hide the finding this whole ticket is about.
       */
      expect(readsAsLevel({ tier: BOT_TIERS.guoshou, wins: 7, losses: 13, draws: 0 })).toBe(true);
      expect(readsAsLevel({ tier: BOT_TIERS.guoshou, wins: 3, losses: 6, draws: 11 })).toBe(true);
      // And the earlier measurement of the same pairing, for the same reason.
      expect(readsAsLevel({ tier: BOT_TIERS.guoshou, wins: 9, losses: 8, draws: 3 })).toBe(true);
    });

    it("does not let draws make a thin margin look supported", () => {
      // Nine games of evidence either way. The draws are real and say nothing
      // about who is stronger, so they cannot widen the sample.
      expect(readsAsLevel({ tier: BOT_TIERS.meijin, wins: 3, losses: 6, draws: 11 })).toBe(true);
      expect(readsAsLevel({ tier: BOT_TIERS.meijin, wins: 3, losses: 6, draws: 0 })).toBe(true);
    });

    it("calls a real gap a real gap", () => {
      // 段 against 名人, every game: p below 0.001, and the table's own numbers.
      expect(readsAsLevel({ tier: BOT_TIERS.meijin, wins: 0, losses: 20, draws: 0 })).toBe(false);
      expect(readsAsLevel({ tier: BOT_TIERS.dan, wins: 17, losses: 2, draws: 1 })).toBe(false);
    });

    it("treats a pairing nobody played as settling nothing", () => {
      expect(readsAsLevel({ tier: BOT_TIERS.meijin, wins: 0, losses: 0, draws: 0 })).toBe(true);
    });
  });
});
