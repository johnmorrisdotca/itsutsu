import { createGame, playMove } from "./engine";
import type { GameState, Stone } from "./gomoku.types";

/** The stored shape of a game, as both the API and the pages see it. */
type StoredGame = {
  size: number;
  winLength: number;
  variant: string;
  obstacles: string;
  opener: string;
  moves: { row: number; col: number }[];
};

/**
 * Rebuilds every position a game passed through by replaying its moves.
 *
 * A stored game is a move list, never a board, so this is the only way to read
 * one back — and because it runs the same engine, a replayed game and a live
 * one can never disagree about what is legal or who has won.
 */
export function replayTimeline(game: StoredGame): GameState[] {
  const start = createGame({
    size: game.size,
    winLength: game.winLength,
    variant: game.variant as GameState["settings"]["variant"],
    obstacles: game.obstacles as GameState["settings"]["obstacles"],
    firstPlayer: game.opener as Stone,
    allowUndo: false,
    allowSwap: false,
  });

  const states = [start];
  for (const move of game.moves) {
    states.push(playMove(states[states.length - 1], { row: move.row, col: move.col }));
  }
  return states;
}

/** The position as it stands now. */
export function replayGame(game: StoredGame): GameState {
  const timeline = replayTimeline(game);
  return timeline[timeline.length - 1];
}
