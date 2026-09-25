"use client";

import { MOVE_KINDS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";
import { capturePaths, slideWord, type SlideMove } from "@/lib/gomoku/notation";
import type { Point } from "@/lib/gomoku/gomoku.types";
import type { GameMove } from "@/lib/history/gameHistory.types";
import { MOVE_FORMAT_DISPLAY, linesOf, pointIn, type MoveFormatChoice } from "@/lib/record/moveFormats";

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
  nameOf,
  format = "itsutsu",
  played,
}: {
  /**
   * The same moves as the engine replayed them, in order, where the caller has
   * a replay: what lets a draughts capture be written as one (g5:e3:c1). A list
   * whose length disagrees is ignored and every slide is written plainly.
   */
  played?: readonly SlideMove[];
  size: number;
  moves: readonly GameMove[];
  /** Which move the board is showing. Later ones are dimmed: they are still to come. */
  at?: number;
  onJump?: (moveNumber: number) => void;
  emptyNote?: string;
  testId?: string;
  /**
   * A record's own name for a move, where it has one this site does not use:
   * a famous Othello game counts its rows from the top, so its opening move
   * is f5 and not F4. Left out, a move is said as the board says it.
   */
  nameOf?: (move: GameMove) => string;
  /**
   * How the moves are written: ours, one a line, or two a line as ItsYourTurn
   * and GoldToken print them (`moveFormats.ts`), the same choice the live
   * record offers. A record with names of its own (`nameOf`) keeps them.
   */
  format?: MoveFormatChoice;
}) {
  if (moves.length === 0) {
    return (
      <p className="text-xs text-muted" data-testid={`${testId}-empty`}>
        {emptyNote}
      </p>
    );
  }

  const pairs = MOVE_FORMAT_DISPLAY[format].pairs;
  // Each move's capture path, by its move number: the engine's list is in the record's order.
  const paths = played !== undefined && played.length === moves.length ? capturePaths(played) : null;
  const pathOf = new Map(moves.map((move, at) => [move.number, paths?.[at] ?? null]));
  return (
    <ol className="max-h-56 overflow-y-auto rounded-lg border border-rule text-sm" data-testid={testId} data-format={format}>
      {linesOf(format, moves).map((line) => (
        <li key={line.number} className="flex items-stretch" data-testid="played-line">
          {/* Two a line, the line's number stands before the pair, as the other sites print it. */}
          {pairs ? (
            <span className="w-9 shrink-0 self-center pr-1 text-right font-mono text-xs text-muted tabular-nums">
              {line.number}
              {format === "itsYourTurn" ? "." : ""}
            </span>
          ) : null}
          {line.moves.map(({ move }) => {
            const current = at === move.number;
            const ahead = at !== undefined && move.number > at;
            const said = nameOf?.(move) ?? wordFor(size, move, format, pathOf.get(move.number) ?? null);
            const inside = (
              <>
                {pairs ? null : (
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-muted tabular-nums">{move.number}</span>
                )}
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
            const shared = `flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1 text-left ${
              current ? "bg-shade font-semibold" : ""
            } ${ahead ? "opacity-60" : ""}`;
            return onJump === undefined ? (
              <span key={move.number} className={shared} data-testid="played-move" data-move={move.number}>
                {inside}
              </span>
            ) : (
              <button
                key={move.number}
                type="button"
                onClick={() => onJump(move.number)}
                className={`${shared} transition-colors hover:bg-shade`}
                aria-current={current ? "step" : undefined}
                data-testid="played-move"
                data-move={move.number}
              >
                {inside}
              </button>
            );
          })}
        </li>
      ))}
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
function wordFor(size: number, move: GameMove, format: MoveFormatChoice, capture: readonly Point[] | null): string {
  const without = stonelessWord(move.kind);
  if (without !== null) return without;
  const to = pointIn(format, size, move);
  // A draughts capture with a colon, a multi-jump as every square it landed on (`slideWord`).
  if (capture !== null) return slideWord(capture.map((point) => pointIn(format, size, point)), true);
  if (move.kind === MOVE_KINDS.move && move.from !== undefined) {
    return slideWord([pointIn(format, size, move.from), to], false);
  }
  if (move.kind === MOVE_KINDS.piece && move.cells !== undefined) {
    return `${to} ×${move.cells.length}`;
  }
  return to;
}
