"use client";

import { useState } from "react";

import { PuzzleSetUp, PuzzleSizes } from "@/components/puzzles/PuzzleSetUp";
import { PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { GamePicker } from "./GamePicker";
import { PuzzleBoardPreview } from "./PuzzleBoardPreview";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, PICK_BOARD_ROW_UNDER_FAMILIES } from "./picker.constants";

/**
 * THE SET-UP SCREEN WITH A PUZZLE CHOSEN: the puzzle's name where the game's
 * would be, its grid in the board's own frame where the board's would be
 * (`PuzzleBoardPreview`), and its size, level and Solve where the opponent,
 * the rules and Begin would be.
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
  hasAccount,
}: {
  puzzle: PuzzleKind;
  onPuzzle: (kind: PuzzleKind | null) => void;
  /** The board game the screen still holds, for the moment a reader goes back to one. */
  variant: string;
  onGame: (variant: string) => void;
  disabled: boolean;
  /** Whether this reader has an account, which a race needs. */
  hasAccount: boolean;
}) {
  const copy = PUZZLE_DISPLAY[puzzle];
  // The size belongs to the puzzle it was chosen for: another puzzle starts at its own usual size.
  const [chosen, setChosen] = useState<{ kind: PuzzleKind; size: number } | null>(null);
  const size = chosen !== null && chosen.kind === puzzle ? chosen.size : PUZZLE_SPECS[puzzle].defaultSize;
  const onSize = (next: number) => setChosen({ kind: puzzle, size: next });
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
            // The picture and its sizes side by side, in the very row a game's board and its boards stand in.
            <div className={`${PICK_BOARD_ROW} py-2 ${PICK_BOARD_ROW_UNDER_FAMILIES}`}>
              <div className={PICK_BOARD_PREVIEW}>
                <PuzzleBoardPreview kind={puzzle} size={size} />
              </div>
              <PuzzleSizes kind={puzzle} size={size} onSize={onSize} beside />
            </div>
          }
        />
        <PuzzleSetUp key={puzzle} kind={puzzle} hasAccount={hasAccount} framed={false} sized={{ size, onSize }} />
      </div>
    </>
  );
}
