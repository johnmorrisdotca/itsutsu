import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { MOVE_KINDS, OPENING_RULES, RULE_VARIANTS } from "./gomoku.constants";
import { BOT_TIERS } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { inTheBook } from "./opponentOpening";
import { applyTurn } from "./opponentTurns";
import { seededRandom } from "./rules/random";
import type { GameState } from "./gomoku.types";
import type { BotTurn } from "./opponent.types";

/**
 * THE OPENING BOOK, held to what it promises: the centre first, a reply that
 * touches the first stone, a third stone near it — and not the same game
 * every time, which is the whole of why it exists.
 */

const SIZE = 15;
const CENTRE = { row: 7, col: 7 };

function place(state: GameState, row: number, col: number): GameState {
  return applyTurn(state, { kind: MOVE_KINDS.place, row, col });
}

function freestyle(): GameState {
  return createGame({ variant: RULE_VARIANTS.freestyle, size: SIZE });
}

function at(turn: BotTurn | null): string {
  return turn !== null && turn.kind === MOVE_KINDS.place ? `${turn.row},${turn.col}` : "none";
}

function king(turn: BotTurn | null, from: { row: number; col: number }): number {
  if (turn === null || turn.kind !== MOVE_KINDS.place) return Infinity;
  return Math.max(Math.abs(turn.row - from.row), Math.abs(turn.col - from.col));
}

const QUICK = { nodes: 400, millis: 2_000 };

describe("when the book is open", () => {
  it("is open for the second and third stones of a line game, and at no other time", () => {
    const empty = freestyle();
    const one = place(empty, 7, 7);
    const two = place(one, 7, 8);
    const three = place(two, 8, 8);
    expect([empty, one, two, three].map(inTheBook)).toEqual([false, true, true, false]);
  });

  it("is shut where the rules decide the opening stones", () => {
    const pro = place(createGame({ variant: RULE_VARIANTS.freestyle, size: SIZE, opening: OPENING_RULES.pro }), 7, 7);
    expect(inTheBook(pro)).toBe(false);
  });

  it("is shut for a game that is not read by its lines", () => {
    const reversi = createGame({ variant: RULE_VARIANTS.reversi, size: 8 });
    expect(inTheBook(reversi)).toBe(false);
  });
});

describe("what the book plays", () => {
  it("answers a centre stone by touching it, and not always in the same place", () => {
    const one = place(freestyle(), CENTRE.row, CENTRE.col);
    const replies = Array.from({ length: 24 }, (_, seed) => chooseTurn(one, BOT_TIERS.meijin, seededRandom(seed + 1), QUICK));
    for (const reply of replies) expect(king(reply, CENTRE), at(reply)).toBe(1);
    expect(new Set(replies.map(at)).size).toBeGreaterThan(3);
  });

  it("plays its third stone near the first, and not always the same one", () => {
    const two = place(place(freestyle(), CENTRE.row, CENTRE.col), 7, 8);
    const thirds = Array.from({ length: 24 }, (_, seed) => chooseTurn(two, BOT_TIERS.meijin, seededRandom(seed + 1), QUICK));
    for (const third of thirds) expect(king(third, CENTRE), at(third)).toBeLessThanOrEqual(2);
    expect(new Set(thirds.map(at)).size).toBeGreaterThan(1);
  });
});
