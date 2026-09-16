import { describe, expect, it } from "vitest";

import { HONESTY, claimsNoBlunders, readBotMove } from "./botHonesty";
import { createGame } from "@/lib/gomoku/engine";
import { applyTurn, legalTurns } from "@/lib/gomoku/opponentTurns";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { assess } from "@/lib/gomoku/analysis";
import { GAME_STATUS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { BOT_TIERS } from "@/lib/gomoku/opponent.constants";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import type { GameState } from "@/lib/gomoku/gomoku.types";

/** A place on the board, as a turn. */
const at = (row: number, col: number): BotTurn => ({ kind: "place", row, col });

/** Lays a run of stones, alternating colours by playing the other side far away. */
function build(state: GameState, moves: readonly BotTurn[]): GameState {
  let here = state;
  for (const move of moves) {
    const next = applyTurn(here, move);
    expect(next, `turn ${JSON.stringify(move)} was refused`).not.toBe(here);
    here = next;
  }
  return here;
}

describe("which grades are answerable for a blunder", () => {
  it("is the ones whose spec says they never make one", () => {
    expect(claimsNoBlunders(BOT_TIERS.meijin)).toBe(true);
    expect(claimsNoBlunders(BOT_TIERS.guoshou)).toBe(true);
  });

  it("is not the ones that are supposed to", () => {
    // Razryad throws a turn away on purpose. Accusing it of that would be
    // accusing it of working.
    expect(claimsNoBlunders(BOT_TIERS.razryad)).toBe(false);
    expect(claimsNoBlunders(BOT_TIERS.kyu)).toBe(false);
    expect(readBotMove(createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }), at(4, 4), BOT_TIERS.razryad).verdict)
      .toBe(HONESTY.notClaimed);
  });
});

describe("reading a move a computer player made", () => {
  /*
   * Black has four in a row with both ends open and it is black's turn. The
   * win is one stone away, and there is nothing subtle about missing it.
   */
  function fourInARow(): GameState {
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 9, firstPlayer: "black" });
    return build(start, [
      at(4, 1), at(0, 0),
      at(4, 2), at(0, 1),
      at(4, 3), at(0, 2),
      at(4, 4), at(8, 8),
    ]);
  }

  it("catches a grade that walks past a win it already had", () => {
    const state = fourInARow();
    expect(state.status).toBe(GAME_STATUS.playing);
    expect(state.toPlay).toBe("black");

    // Proves the premise rather than assuming it: the win really is there.
    const winning = legalTurns(state, 200).filter((turn) => {
      const next = applyTurn(state, turn);
      return next !== state && next.status === GAME_STATUS.won && next.winner === "black";
    });
    expect(winning.length).toBeGreaterThan(0);

    const reading = readBotMove(state, at(7, 0), BOT_TIERS.guoshou);
    expect(reading.verdict).toBe(HONESTY.missedWin);
  });

  it("does not accuse it of missing a win it took", () => {
    const state = fourInARow();
    const win = legalTurns(state, 200).find((turn) => {
      const next = applyTurn(state, turn);
      return next !== state && next.status === GAME_STATUS.won && next.winner === "black";
    })!;
    expect(readBotMove(state, win, BOT_TIERS.guoshou).verdict).toBe(HONESTY.nothingSeen);
  });

  it("says it could not read a turn the engine refuses, rather than passing it", () => {
    const state = fourInARow();
    // An occupied point. The move route is what rejects this; the reading must
    // not quietly call it clean.
    expect(readBotMove(state, at(4, 1), BOT_TIERS.guoshou).verdict).toBe(HONESTY.unreadable);
  });

  it("catches a grade that walks into a loss another turn avoided", () => {
    /*
     * THE POSITIVE CASE FOR `gaveWin`, and the reason it is written out rather
     * than trusted. A correction that merely stops a check firing is
     * indistinguishable from deleting it, so this proves it still fires.
     *
     * The four must be BLOCKABLE for the accusation to be fair, which is the
     * whole subtlety and cost this test a first draft: an open four, live at
     * both ends, is already lost before the move — black can block one end and
     * not both — and a grade cannot be accused of losing a position that was
     * lost when it was handed over. So black's own stone closes the left end,
     * and the only winning point left is one black can take.
     */
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 9, firstPlayer: "black" });
    const state = build(start, [
      at(4, 0), at(4, 1),
      at(0, 0), at(4, 2),
      at(0, 1), at(4, 3),
      at(0, 2), at(4, 4),
    ]);
    expect(state.status).toBe(GAME_STATUS.playing);
    expect(state.toPlay).toBe("black");

    // Premise one: black is NOT already lost — blocking holds the game.
    const blocking = applyTurn(state, at(4, 5));
    expect(blocking).not.toBe(state);
    expect(assess(blocking).outlook.black).not.toBe("lost");

    // Premise two: white really does win next move if black looks away.
    const ignoring = applyTurn(state, at(8, 0));
    expect(ignoring).not.toBe(state);
    const whiteWins = legalTurns(ignoring, 200).some((turn) => {
      const next = applyTurn(ignoring, turn);
      return next !== ignoring && next.status === GAME_STATUS.won && next.winner === "white";
    });
    expect(whiteWins, "white should have a winning reply for this test to mean anything").toBe(true);

    expect(readBotMove(state, at(8, 0), BOT_TIERS.guoshou).verdict).toBe(HONESTY.gaveWin);
  });

  it("clears the top grade over a whole game it actually played", () => {
    /*
     * The honest case, end to end and not hand-built: 国手 against itself, every
     * move read as the server would read it. A check that fires on ordinary
     * correct play is worse than no check, because it would put a cheat mark on
     * every game the feature was meant to protect.
     */
    let state: GameState = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0.5);
    let read = 0;
    for (let move = 0; move < 30 && state.status === GAME_STATUS.playing; move += 1) {
      const turn = chooseTurn(state, BOT_TIERS.guoshou, Math.random, { nodes: 4_000, millis: 5_000 });
      if (turn === null) break;
      const verdict = readBotMove(state, turn, BOT_TIERS.guoshou).verdict;
      expect([HONESTY.nothingSeen, HONESTY.unreadable]).toContain(verdict);
      read += 1;
      const next = applyTurn(state, turn);
      if (next === state) break;
      state = next;
    }
    // The tolerant assertion above enumerates what it tolerates; this is what
    // stops it passing because it never got far enough to look.
    expect(read).toBeGreaterThan(8);
  });
});
