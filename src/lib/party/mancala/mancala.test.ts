import { describe, expect, it } from "vitest";

import { MANCALA_RULES, MANCALA_STATUS, decodeMancala, encodeMancala, legalPits, mancalaAgain, mustFeed, replayMancala, sowMancala, sowingFrames, startMancala } from "./mancala";
import { partyPlayerName } from "../partyNames";
import { MANCALA_BOARDS } from "./mancala.constants";
import type { MancalaGame, MancalaSeat } from "./mancala.types";

/**
 * Mancala's rules (party kind "mancala"), both rule sets: Kalah, the default,
 * and Oware by the Abapa rules. Holes are numbered as `mancala.types.ts` says:
 * 0–5 the first player's pits, 6 their store, 7–12 the second's, 13 theirs.
 */

const KALAH = MANCALA_BOARDS.kalah;
const OWARE = MANCALA_BOARDS.oware;

function kalah(): MancalaGame {
  return startMancala(KALAH, ["Ann", "Ben"])!;
}

function oware(): MancalaGame {
  return startMancala(OWARE, ["Ann", "Ben"])!;
}

/**
 * A game at a position of the test's own choosing: the pits and stores given,
 * everything else as the rules keep it. Fourteen numbers, in hole order.
 */
function at(game: MancalaGame, holes: number[], toPlay: MancalaSeat = 0): MancalaGame {
  expect(holes).toHaveLength(14);
  return { ...game, holes, toPlay, seen: [] };
}

function sow(game: MancalaGame, pit: number): MancalaGame {
  const next = sowMancala(game, pit);
  expect(next, `pit ${pit} should be sown`).not.toBeNull();
  return next!;
}

const total = (game: MancalaGame) => game.holes.reduce((sum, seeds) => sum + seeds, 0);

describe("mancala: a new game", () => {
  it("has four seeds in every pit and empty stores, under either rule set, with the first player to sow from any pit", () => {
    for (const game of [kalah(), oware()]) {
      expect(game.holes).toEqual([4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]);
      expect(game.toPlay).toBe(0);
      expect(legalPits(game)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(game.status).toBe(MANCALA_STATUS.playing);
    }
    expect(kalah().ruleSet).toBe("kalah");
    expect(oware().ruleSet).toBe("oware");
  });

  it("is offered for two only, on Kalah's board or Oware's", () => {
    expect(startMancala(KALAH, ["Ann"])).toBeNull();
    expect(startMancala(KALAH, ["Ann", "Ben", "Cy"])).toBeNull();
    expect(startMancala(13, ["Ann", "Ben"])).toBeNull();
    expect(startMancala(KALAH, ["Ann", "Ben"], 2)).toBeNull();
    expect(startMancala(OWARE, ["Ann", "Ben"], 1)!.toPlay).toBe(1);
  });

  it("calls a seat left blank by its place", () => {
    const game = startMancala(KALAH, ["  Ann   Lee ", ""])!;
    expect(partyPlayerName(game, 0)).toBe("Ann Lee");
    expect(partyPlayerName(game, 1)).toBe("Player 2");
  });
});

describe("mancala: Kalah's sowing", () => {
  it("sows one to a hole counter-clockwise, and a last seed in your own store gives you another turn", () => {
    const next = sow(kalah(), 2);
    expect(next.last!.path).toEqual([3, 4, 5, 6]);
    expect(next.holes).toEqual([4, 4, 0, 5, 5, 5, 1, 4, 4, 4, 4, 4, 4, 0]);
    expect(next.last!.again).toBe(true);
    expect(next.toPlay).toBe(0);
  });

  it("passes the turn when the last seed falls anywhere else", () => {
    const next = sow(kalah(), 0);
    expect(next.last!.path).toEqual([1, 2, 3, 4]);
    expect(next.last!.again).toBe(false);
    expect(next.toPlay).toBe(1);
    expect(legalPits(next)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("drops a seed in your own store as it passes, and never in your opponent's", () => {
    const game = at(kalah(), [0, 0, 0, 0, 0, 10, 0, 1, 1, 1, 1, 1, 1, 0]);
    const next = sow(game, 5);
    expect(next.last!.path).toEqual([6, 7, 8, 9, 10, 11, 12, 0, 1, 2]);
    expect(next.holes[13]).toBe(0);
    // One passing through, and three more for the last seed alone in pit 2 with two opposite in pit 10.
    expect(next.last!.captured).toBe(3);
    expect(next.holes[6]).toBe(1 + 3);
  });

  it("gives the second player their own store and skips the first's", () => {
    const game = at(kalah(), [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 9, 0], 1);
    const next = sow(game, 12);
    expect(next.last!.path).toEqual([13, 0, 1, 2, 3, 4, 5, 7, 8]);
    expect(next.holes[6]).toBe(0);
    // And captures for the second player too: the last seed alone in pit 8, with two opposite in pit 4.
    expect(next.last!.takenFrom).toEqual([8, 4]);
    expect(next.holes[13]).toBe(1 + 3);
  });

  it("with thirteen seeds comes all the way round into the pit it left, and captures there", () => {
    const game = at(kalah(), [13, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0]);
    const next = sow(game, 0);
    expect(next.last!.path).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0]);
    // The pit it left was emptied, so the last seed lands alone there, and the two in pit 12 opposite go with it.
    expect(next.last!.captured).toBe(3);
    expect(next.last!.takenFrom).toEqual([0, 12]);
    expect(next.holes[0]).toBe(0);
    expect(next.holes[12]).toBe(0);
    expect(next.holes[6]).toBe(1 + 3);
  });
});

describe("mancala: Kalah's capture", () => {
  it("takes the last seed and everything opposite when it lands in an empty pit of yours", () => {
    const game = at(kalah(), [2, 0, 0, 1, 1, 1, 5, 1, 1, 1, 1, 6, 1, 3]);
    const next = sow(game, 0);
    // 0 → 1, 2: the last lands alone in pit 2, opposite pit 10 holds 1.
    expect(next.last!.captured).toBe(2);
    expect(next.last!.takenFrom).toEqual([2, 10]);
    expect(next.holes[2]).toBe(0);
    expect(next.holes[10]).toBe(0);
    expect(next.holes[6]).toBe(7);
    expect(next.toPlay).toBe(1);
    expect(total(next)).toBe(total(game));
  });

  it("takes nothing when the pit opposite is empty: the seed stays where it fell", () => {
    const game = at(kalah(), [2, 0, 0, 1, 1, 1, 5, 1, 1, 1, 0, 6, 1, 3]);
    const next = sow(game, 0);
    expect(next.last!.captured).toBe(0);
    expect(next.holes[2]).toBe(1);
    expect(next.holes[6]).toBe(5);
  });

  it("takes nothing when the last seed lands in an empty pit of your opponent's", () => {
    const game = at(kalah(), [1, 0, 0, 0, 0, 3, 5, 0, 0, 1, 1, 1, 1, 3]);
    const next = sow(game, 5);
    // 5 → 6, 7, 8: the last lands alone in pit 8, which is Ben's, with Ann's pit 4 opposite empty anyway.
    expect(next.last!.captured).toBe(0);
    expect(next.holes[8]).toBe(1);
    expect(next.toPlay).toBe(1);
  });

  it("does not capture into a pit that was not empty before the last seed", () => {
    const game = at(kalah(), [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0]);
    const next = sow(game, 0);
    expect(next.holes[1]).toBe(2);
    expect(next.last!.captured).toBe(0);
  });
});

describe("mancala: Kalah's end", () => {
  it("ends when a row is empty, and each player adds what is left on their side to their store", () => {
    // Ann's last seed goes to her store: her row is empty, and Ben's seeds go to Ben's store.
    const game = at(kalah(), [0, 0, 0, 0, 0, 1, 20, 1, 2, 3, 0, 0, 0, 21]);
    const next = sow(game, 5);
    expect(next.status).toBe(MANCALA_STATUS.finished);
    expect(next.ending).toBe("rowEmpty");
    expect(next.holes).toEqual([0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 0, 0, 0, 27]);
    expect(next.winners).toEqual([1]);
    expect(legalPits(next)).toEqual([]);
    expect(MANCALA_RULES.over(next)).toBe(true);
  });

  it("ends when the opponent's row is emptied by a capture, too", () => {
    const game = at(kalah(), [1, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 2, 25]);
    const next = sow(game, 0);
    // 0 → 1, alone opposite pit 11: empty, so nothing taken — Ann's row still holds a seed, the game goes on.
    expect(next.status).toBe(MANCALA_STATUS.playing);
    const capture = at(kalah(), [1, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 2, 0, 25]);
    const taken = sow(capture, 0);
    expect(taken.last!.captured).toBe(3);
    expect(taken.status).toBe(MANCALA_STATUS.finished);
    expect(taken.holes[6]).toBe(23);
    expect(taken.winners).toEqual([1]);
  });

  it("is a draw when the stores are level", () => {
    const game = at(kalah(), [0, 0, 0, 0, 0, 1, 23, 0, 0, 0, 0, 0, 0, 24]);
    const next = sow(game, 5);
    expect(next.holes[6]).toBe(24);
    expect(next.winners).toEqual([0, 1]);
  });
});

describe("mancala: Oware's sowing", () => {
  it("never sows into a store", () => {
    const next = sow(oware(), 5);
    expect(next.last!.path).toEqual([7, 8, 9, 10]);
    expect(next.holes[6]).toBe(0);
    const round = sow(at(oware(), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0], 1), 12);
    expect(round.last!.path).toEqual([0, 1, 2]);
    expect(round.holes[13]).toBe(0);
  });

  it("gives no extra turn, wherever the last seed falls", () => {
    const next = sow(oware(), 2);
    expect(next.last!.again).toBe(false);
    expect(next.toPlay).toBe(1);
  });

  it("skips the pit it started from on a sowing of twelve or more, leaving it empty", () => {
    const game = at(oware(), [12, 1, 1, 1, 1, 1, 0, 4, 4, 4, 4, 4, 4, 0]);
    const next = sow(game, 0);
    expect(next.last!.path).toEqual([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 1]);
    expect(next.holes[0]).toBe(0);
    expect(next.holes[1]).toBe(3);
  });
});

describe("mancala: Oware's capture", () => {
  it("takes two or three in the opponent's pit the last seed made, and back along their row while each holds two or three", () => {
    // Ann sows 3 from pit 5 into 7, 8, 9: each of those then holds 2, 3 and 2.
    const game = at(oware(), [4, 4, 4, 4, 4, 3, 0, 1, 2, 1, 4, 4, 4, 0]);
    const next = sow(game, 5);
    expect(next.last!.takenFrom).toEqual([9, 8, 7]);
    expect(next.last!.captured).toBe(7);
    expect(next.holes[6]).toBe(7);
    expect([next.holes[7], next.holes[8], next.holes[9]]).toEqual([0, 0, 0]);
  });

  it("stops the chain at the first pit that does not hold two or three", () => {
    const game = at(oware(), [4, 4, 4, 4, 4, 3, 0, 1, 4, 1, 4, 4, 4, 0]);
    const next = sow(game, 5);
    // Pit 8 holds 5: only pit 9 is taken.
    expect(next.last!.takenFrom).toEqual([9]);
    expect(next.last!.captured).toBe(2);
  });

  it("never takes from the sower's own row, however many seeds the pit holds", () => {
    const game = at(oware(), [4, 4, 4, 1, 2, 0, 0, 4, 4, 4, 4, 4, 1, 0], 1);
    const next = sow(game, 12);
    // Ben's seed lands in Ann's pit 0 making 5: nothing, and in any case the chain never reaches Ben's own row.
    expect(next.last!.captured).toBe(0);
    const own = sow(at(oware(), [4, 4, 4, 4, 4, 4, 0, 1, 1, 1, 1, 2, 0, 0], 1), 10);
    // 10 → 11: Ben's own pit, now 3, is his, not his opponent's: nothing taken.
    expect(own.last!.captured).toBe(0);
    expect(own.holes[11]).toBe(3);
  });

  it("forfeits a grand slam: a capture that would take every seed the opponent has takes none", () => {
    // Ben has 1 in pit 7 and 2 in pit 8; Ann's sowing of 2 from pit 5 makes them 2 and 3 — all of Ben's seeds.
    const game = at(oware(), [4, 4, 4, 4, 4, 2, 10, 1, 2, 0, 0, 0, 0, 13]);
    const next = sow(game, 5);
    expect(next.last!.grandSlam).toBe(true);
    expect(next.last!.captured).toBe(0);
    expect([next.holes[7], next.holes[8]]).toEqual([2, 3]);
    expect(next.holes[6]).toBe(10);
  });
});

describe("mancala: Oware's must-feed rule", () => {
  it("offers only a sowing that gives an empty row seeds", () => {
    // Ben's row is empty. Pit 5's one seed reaches pit 7; pit 0's two stop at 2.
    const game = at(oware(), [2, 0, 0, 0, 0, 1, 20, 0, 0, 0, 0, 0, 0, 25 - 1]);
    expect(mustFeed(game)).toBe(true);
    expect(legalPits(game)).toEqual([5]);
    expect(sowMancala(game, 0)).toBeNull();
    expect(sowMancala(game, 5)).not.toBeNull();
  });

  it("ends the game when nothing can feed an empty row, the player to move taking the seeds on their own side", () => {
    // Ann sows her last seed out of her row; Ben's row holds one seed in pit 7, which cannot reach round to Ann's row.
    const game = at(oware(), [0, 0, 0, 0, 0, 1, 20, 0, 0, 0, 0, 0, 0, 20]);
    const next = sow(game, 5);
    // 5 → 7: now Ann's row is empty and Ben must feed; one seed in pit 7 reaches only pit 8.
    expect(next.status).toBe(MANCALA_STATUS.finished);
    expect(next.ending).toBe("cannotFeed");
    expect(next.holes).toEqual([0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 21]);
    expect(next.winners).toEqual([1]);
  });
});

describe("mancala: Oware's end", () => {
  it("is won the moment somebody has taken 25", () => {
    const game = at(oware(), [4, 4, 4, 4, 4, 3, 22, 1, 2, 1, 0, 0, 4, 0]);
    const next = sow(game, 5);
    expect(next.holes[6]).toBe(29);
    expect(next.status).toBe(MANCALA_STATUS.finished);
    expect(next.ending).toBe("majority");
    expect(next.winners).toEqual([0]);
  });

  it("is a draw at 24 each", () => {
    // Ann's one seed makes two in Ben's pit 7 and takes them, to 24; Ben has 24 already, and one seed left in pit 8.
    const game = at(oware(), [0, 0, 0, 0, 1, 1, 22, 1, 1, 0, 0, 0, 0, 24]);
    const next = sow(game, 5);
    expect(next.last!.captured).toBe(2);
    expect(next.holes[6]).toBe(24);
    expect(next.status).toBe(MANCALA_STATUS.finished);
    expect(next.ending).toBe("even");
    expect(next.winners).toEqual([0, 1]);
  });

  it("ends when the same position comes round a third time, each player taking the seeds on their side", () => {
    // A seed each, chasing each other round the board: nothing can ever be captured, so it goes round for ever.
    let game = at(oware(), [1, 0, 0, 0, 0, 0, 23, 1, 0, 0, 0, 0, 0, 23]);
    let moves = 0;
    while (game.status === MANCALA_STATUS.playing && moves < 500) {
      game = sow(game, legalPits(game)[0]);
      moves += 1;
    }
    expect(game.status).toBe(MANCALA_STATUS.finished);
    expect(game.ending).toBe("repeated");
    expect(game.holes[6] + game.holes[13]).toBe(48);
    expect(moves).toBeLessThan(500);
  });
});

describe("mancala: moves that may not be made", () => {
  it("refuses an empty pit, the opponent's pit, a store and anything once the game is over, and leaves the game untouched", () => {
    const game = at(kalah(), [0, 1, 1, 1, 1, 1, 0, 4, 4, 4, 4, 4, 4, 0]);
    const before = JSON.stringify(game);
    expect(sowMancala(game, 0)).toBeNull();
    expect(sowMancala(game, 7)).toBeNull();
    expect(sowMancala(game, 6)).toBeNull();
    sow(game, 1);
    expect(JSON.stringify(game)).toBe(before);
    const over = { ...game, status: MANCALA_STATUS.finished };
    expect(sowMancala(over, 1)).toBeNull();
  });
});

describe("mancala: keeping, replaying and playing again", () => {
  it("keeps a game as its table and its sowings, and reads it back exactly", () => {
    for (const board of [KALAH, OWARE]) {
      const game = replayMancala(board, ["Ann", "Ben"], 1, [8, 1, 11])!;
      expect(game).not.toBeNull();
      expect(decodeMancala(encodeMancala(game))).toEqual(game);
    }
  });

  it("refuses what it cannot play out again", () => {
    expect(decodeMancala(null)).toBeNull();
    expect(decodeMancala("")).toBeNull();
    expect(decodeMancala("{}")).toBeNull();
    expect(decodeMancala(JSON.stringify({ v: 2, board: KALAH, players: ["", ""], first: 0, moves: [] }))).toBeNull();
    // Ann cannot sow from Ben's pit.
    expect(decodeMancala(JSON.stringify({ v: 1, board: KALAH, players: ["", ""], first: 0, moves: [7] }))).toBeNull();
    expect(decodeMancala(JSON.stringify({ v: 1, board: 10, players: ["", ""], first: 0, moves: [] }))).toBeNull();
  });

  it("plays again with the same table and rules, the other player sowing first", () => {
    const game = replayMancala(OWARE, ["Ann", "Ben"], 0, [2, 8])!;
    const again = mancalaAgain(game);
    expect(again.board).toBe(OWARE);
    expect(again.players).toEqual(["Ann", "Ben"]);
    expect(again.toPlay).toBe(1);
    expect(again.moves).toEqual([]);
  });

  it("draws a sowing seed by seed: the pit lifted, each seed as it falls, then the board as the rules leave it", () => {
    const before = at(kalah(), [2, 0, 0, 1, 1, 1, 5, 1, 1, 1, 1, 6, 1, 3]);
    const after = sow(before, 0);
    const frames = sowingFrames(before, after);
    expect(frames).toHaveLength(after.last!.path.length + 2);
    expect(frames[0][0]).toBe(0);
    expect(frames[1][1]).toBe(1);
    expect(frames[2][2]).toBe(1);
    expect(frames.at(-1)).toEqual(after.holes);
    expect(sowingFrames(before, before)).toEqual([]);
  });
});
