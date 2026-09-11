"use client";

import { MOVE_KINDS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { pointName } from "@/lib/gomoku/notation";
import type { GameMove } from "@/lib/history/gameHistory.types";

/**
 * The moves of a game, in order — the 棋譜 itself.
 *
 * John asked for this twice: "WHERE ARE THE GAMES PLAYED WHEN VIEWING A GAME???
 * where is the game history???" A practice game against yourself has listed its
 * moves all along, and the two places a REAL game is read — a match being
 * played, and a finished one — showed a board and a count and nothing else. The
 * one mode nobody plays seriously was the only one that said what had happened.
 *
 * Read-only, and separate from `game/MoveHistory` on purpose rather than by
 * accident. That one belongs to a practice session: it offers to jump, to undo,
 * to rewrite the game from a point, and it marks the moves an engine thinks
 * were fatal. None of that is true of somebody else's game. What the two do
 * share is how a move is WORDED, and this copies that exactly — the same point
 * names, the same dot for the colour, the same reading of a pass — because two
 * spellings of one move is how a record stops being checkable against itself.
 *
 * `onJump` is the difference between the two homes it has. A finished game can
 * be stepped through, so each move is a position to go to; a game still being
 * played has no scrubber to move, so the list is simply what has happened.
 */
export function PlayedMoves({
  size,
  moves,
  at,
  onJump,
  emptyNote = "No moves yet.",
  testId = "played-moves",
}: {
  size: number;
  moves: readonly GameMove[];
  /** Which move the board is showing. Later ones are dimmed: they are still to come. */
  at?: number;
  onJump?: (moveNumber: number) => void;
  emptyNote?: string;
  testId?: string;
}) {
  if (moves.length === 0) {
    return (
      <p className="text-xs text-muted" data-testid={`${testId}-empty`}>
        {emptyNote}
      </p>
    );
  }

  return (
    <ol
      className="max-h-56 overflow-y-auto rounded-lg border border-rule text-sm"
      data-testid={testId}
    >
      {moves.map((move) => {
        const current = at === move.number;
        const ahead = at !== undefined && move.number > at;
        const said = wordFor(size, move);
        const inside = (
          <>
            <span className="w-7 shrink-0 text-right font-mono text-xs text-muted tabular-nums">
              {move.number}
            </span>
            <span
              aria-hidden="true"
              className={`size-2.5 shrink-0 rounded-full ${
                move.stone === "black" ? "bg-ink" : "border border-rule-strong bg-ivory"
              }`}
            />
            <span className="font-mono">{said}</span>
            <span className="sr-only">
              {STONE_DISPLAY[move.stone as keyof typeof STONE_DISPLAY]?.label ?? move.stone}
            </span>
          </>
        );
        const shared = `flex w-full items-center gap-2 px-2.5 py-1 text-left ${
          current ? "bg-shade font-semibold" : ""
        } ${ahead ? "opacity-60" : ""}`;

        return (
          <li key={move.number} data-testid="played-move" data-move={move.number}>
            {onJump === undefined ? (
              <span className={shared}>{inside}</span>
            ) : (
              <button
                type="button"
                onClick={() => onJump(move.number)}
                className={`${shared} transition-colors hover:bg-shade`}
                aria-current={current ? "step" : undefined}
              >
                {inside}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One move, said the way the board would say it.
 *
 * A pass has no point and a slide has two, and printing a coordinate for
 * either would be a record that disagrees with the game it describes — a
 * Halma move reads as the square somebody left, not the one they arrived at.
 */
function wordFor(size: number, move: GameMove): string {
  if (move.kind === MOVE_KINDS.pass) return "pass";
  const to = pointName(size, move);
  if (move.kind === MOVE_KINDS.move && move.from !== undefined) {
    return `${pointName(size, move.from)}→${to}`;
  }
  if (move.kind === MOVE_KINDS.piece && move.cells !== undefined) {
    return `${to} ×${move.cells.length}`;
  }
  return to;
}
