import type { GameState } from "@/lib/gomoku/gomoku.types";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";
import type { GameMove } from "@/lib/history/gameHistory.types";

import { FAMOUS_NOTATIONS } from "./famous.constants";
import type { FamousGame } from "./famous.types";

/**
 * A FAMOUS GAME'S MOVES, as a record lists them: numbered from 1, one for each
 * step of its timeline, passes included — so move `n` is the position at
 * `timeline[n]`, and the list and the scrubber can never disagree. Read from
 * the replayed game (`famousTimeline`), never from the record's text again:
 * an Othello record leaves forced passes out, and the replay puts them back.
 */
export function famousMoves(timeline: readonly GameState[]): GameMove[] {
  const played = timeline.at(-1)?.moves ?? [];
  return played.map((move, index) => ({
    number: index + 1,
    row: move.row,
    col: move.col,
    stone: move.stone,
    kind: move.kind,
    // A published record keeps no clock.
    createdAt: "",
  }));
}

/**
 * Each move's name as the game's own record gives it, where that differs from
 * this site's: an Othello record's square ("f5", its rows counted from the
 * top). Null where the site's own names are the record's (Go's are). A move
 * with no point keeps its word; the record's squares are matched to the placed
 * moves in order.
 */
export function famousMoveNames(game: FamousGame, moves: readonly GameMove[]): Map<number, string> | null {
  if (game.notation !== FAMOUS_NOTATIONS.othello) return null;
  const squares = game.moves.split(" ").filter((token) => token !== "" && token !== "--");
  const names = new Map<number, string>();
  let next = 0;
  for (const move of moves) {
    // A move with no point (a pass) keeps its own word; only a placed stone has a square in the record.
    if (stonelessWord(move.kind) !== null) continue;
    const square = squares[next];
    next += 1;
    if (square !== undefined) names.set(move.number, square);
  }
  return next === squares.length ? names : null;
}
