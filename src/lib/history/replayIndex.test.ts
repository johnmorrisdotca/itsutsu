import { describe, expect, it } from "vitest";

import { createGame, playMove, twistBoard } from "@/lib/gomoku/engine";
import { replayMoves } from "@/lib/gomoku/rules/record";
import { OPENING_RULES, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";
import { moveNumberAt, timelineIndexForMove } from "./replayIndex";

const p = (row: number, col: number): Point => ({ row, col });

/*
 * Zero games like these exist on production today — confirmed by the audit
 * this fix comes from — so these fixtures are the only proof there is. Both
 * are built with the real engine (createGame/playMove/twistBoard/
 * replayMoves), never with a hand-rolled GameState, so a timeline shape this
 * test assumes is a shape the engine actually produces.
 */

describe("a twist game's timeline", () => {
  // Two moves, each followed by its own twist — the exact shape
  // replayMoves gives a stored twistFive game with two twisted moves.
  const start = createGame({ variant: RULE_VARIANTS.twistFive });
  const played = twistBoard(playMove(twistBoard(playMove(start, p(0, 0)), 0, true), p(5, 5)), 3, false);
  const timeline = replayMoves(start, played.moves);

  it("has one extra timeline entry per twist, beyond one per move", () => {
    // start, move 1, its twist, move 2, its twist — 5 entries for 2 moves.
    expect(timeline).toHaveLength(5);
    expect(played.moves).toHaveLength(2);
  });

  it("does NOT move one-for-one with the timeline's own index", () => {
    // The bug, stated as data: index 4 is the last position, but only 2
    // moves have actually landed there — "Move 4 of 2" is what reading the
    // raw index as the move number would print.
    expect(moveNumberAt(timeline[4])).toBe(2);
    expect(moveNumberAt(timeline[4])).not.toBe(4);
  });

  it("counts the pre-twist and post-twist states as the same move", () => {
    // twistBoard replaces the move it turns rather than adding one, so both
    // halves of move 1 read as move 1 — the twist is part of it, not after it.
    expect(moveNumberAt(timeline[1])).toBe(1); // stone placed, twist owed
    expect(moveNumberAt(timeline[2])).toBe(1); // twist applied
  });

  it("sends 'move 1' to the settled, post-twist position", () => {
    expect(timelineIndexForMove(timeline, 1)).toBe(2);
  });

  it("sends 'move 2' to the final position", () => {
    expect(timelineIndexForMove(timeline, 2)).toBe(4);
  });

  it("sends 'move 0' to the start", () => {
    expect(timelineIndexForMove(timeline, 0)).toBe(0);
  });
});

describe("a swap-opening game's timeline, past the fourth move", () => {
  // Three stones offer the swap; two more are played once it resolves.
  // replayTimeline never has a recorded choice for a stored game, so the
  // pause always resolves by assuming the chooser kept their colour — see
  // replay.ts — which still inserts a timeline entry nobody played.
  const start = createGame({ opening: OPENING_RULES.swap });
  const moves = [p(7, 7), p(7, 8), p(8, 8), p(0, 0), p(0, 1)];
  const timeline = replayMoves(start, moves);

  it("inserts one entry for the swap choice, on top of one per move", () => {
    // start, move 1, 2, 3, the choice, move 4, move 5 — 7 for 5 moves.
    expect(timeline).toHaveLength(7);
  });

  it("is still aligned for the first three moves, before the choice", () => {
    expect(moveNumberAt(timeline[1])).toBe(1);
    expect(moveNumberAt(timeline[2])).toBe(2);
    expect(moveNumberAt(timeline[3])).toBe(3);
  });

  /*
   * THE FINDING'S OWN WORDS: "past move 4". The choice entry sits at index
   * 4 with only three stones down — reading the index as the move number
   * would print "Move 4" while the board still shows move 3, and every move
   * from here on is one further off for the rest of the game.
   */
  it("misaligns index and move number from the fourth move on", () => {
    expect(moveNumberAt(timeline[4])).toBe(3); // the choice: still 3 stones
    expect(moveNumberAt(timeline[5])).toBe(4); // move 4, one position later than its own number
    expect(moveNumberAt(timeline[6])).toBe(5); // move 5, same permanent offset
  });

  it("sends 'move 4' past the choice, to where the fourth stone actually is", () => {
    expect(timelineIndexForMove(timeline, 4)).toBe(5);
  });

  it("sends 'move 3' to the settled position, after the choice resolves", () => {
    // Index 3 (pre-choice) and index 4 (the choice) are both move 3; the
    // settled one is the later, more-resolved of the two — see the doc
    // comment on timelineIndexForMove.
    expect(timelineIndexForMove(timeline, 3)).toBe(4);
  });

  it("sends the final move number to the true end of the game", () => {
    expect(timelineIndexForMove(timeline, 5)).toBe(6);
    expect(timeline[6]).toBe(timeline[timeline.length - 1]);
  });
});
