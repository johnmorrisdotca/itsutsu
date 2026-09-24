import { GameThumb } from "@/components/games/GameThumb";
import { PuzzleSetUp } from "@/components/puzzles/PuzzleSetUp";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { GamePicker } from "./GamePicker";
import { PICK_BOARD_PREVIEW } from "./picker.constants";

/**
 * THE SET-UP SCREEN WITH A PUZZLE CHOSEN: the puzzle's name where the game's
 * would be, its picture where the board's would be, and its size, level and
 * Solve where the opponent, the rules and Begin would be.
 *
 * John, 2026-09-24, with Numbers open on this screen: "There's an error
 * because we don't have a Preview board for the new games." The tile had
 * opened its puzzles as links and left the rest of the screen describing the
 * last board game, with no picture at all. A puzzle has no seats, clock or
 * opponent, so none of those are asked; the row of families stays, so a
 * press on a board family goes straight back to the game that was chosen.
 */
export function PuzzleHere({
  puzzle,
  onPuzzle,
  variant,
  onGame,
  disabled,
}: {
  puzzle: PuzzleKind;
  onPuzzle: (kind: PuzzleKind | null) => void;
  /** The board game the screen still holds, for the moment a reader goes back to one. */
  variant: string;
  onGame: (variant: string) => void;
  disabled: boolean;
}) {
  const copy = PUZZLE_DISPLAY[puzzle];
  return (
    <>
      <p className="text-sm font-semibold" data-testid="set-up-summary">
        {copy.label} <span className="font-mincho">{copy.kanji}</span> · a puzzle for one
      </p>
      <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
        <GamePicker
          value={variant}
          onChange={(next) => {
            onPuzzle(null);
            onGame(next);
          }}
          disabled={disabled}
          label="Game"
          puzzle={puzzle}
          onPuzzle={onPuzzle}
          underFamilies={
            <figure className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2 py-2`} data-testid="set-up-puzzle-preview">
              <GameThumb variant={puzzle} size="large" />
              <figcaption className="text-center text-xs text-muted">
                A preview of {copy.label}. The puzzle itself is made in your browser when you press Solve.
              </figcaption>
            </figure>
          }
        />
        <PuzzleSetUp kind={puzzle} framed={false} />
      </div>
    </>
  );
}
