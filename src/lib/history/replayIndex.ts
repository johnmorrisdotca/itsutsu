import type { GameState } from "@/lib/gomoku/gomoku.types";

/**
 * The move number a timeline position is AT.
 *
 * Not the position's own index into the array. `replayTimeline` (the
 * engine's) inserts an extra entry for every opening-choice pause — swap,
 * swap2, rif, sakata and tarannikov all offer one — and another for every
 * twist, in the twist games. Neither is a move a person played, so counting
 * position instead of stones drifts the moment either occurs: "Move 30 of
 * 18" is what that drift looks like once it has happened enough times.
 *
 * `GameState.moves` is the engine's own count of moves actually applied —
 * `chooseColour` and `extendOpening` never touch it, and `twistBoard`
 * replaces the last entry rather than adding one — so reading its length is
 * the same question `game.moveCount` already answers, asked of one position
 * in the timeline instead of the whole game.
 */
export function moveNumberAt(state: GameState): number {
  return state.moves.length;
}

/**
 * Which timeline position "move N" means — the LATEST one at which exactly
 * N moves have landed.
 *
 * "Latest" rather than "first" on purpose: a move's own twist, when it has
 * one, is resolved by the next timeline entry with the same move count, and
 * a pause immediately afterward (the next player being asked to choose a
 * colour) is resolved by the one after that — both still describe "after
 * move N", and showing the more-settled position is closer to what a reader
 * asking for move N wants than showing the mid-resolution one.
 *
 * The scrubber, the label, a filed page's initial position and a shared
 * scrub-bar URL all have to agree on this, and disagreeing is silent: two of
 * them showing different boards for "move 12" looks like a slow page, not a
 * bug, until somebody notices the position is wrong.
 */
export function timelineIndexForMove(timeline: readonly GameState[], moveNumber: number): number {
  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    if (timeline[index].moves.length === moveNumber) return index;
  }
  // A move number the timeline has no position for — before its first entry
  // or past its last — lands on whichever end is closer, rather than
  // throwing over a value a reader could easily have typed into a URL.
  return moveNumber <= 0 ? 0 : timeline.length - 1;
}
