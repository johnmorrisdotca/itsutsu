"use client";

import { GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { usePuzzleEnded } from "./PuzzleWinSlot";

/** The solves that draw Give up and New game themselves, in their controls row (`PatienceControls`, `CubeSolve`). */
export const HAS_OWN_ENDING_ROW: ReadonlySet<PuzzleKind> = new Set([PUZZLE_KINDS.solitaire, PUZZLE_KINDS.freecell, PUZZLE_KINDS.spider, PUZZLE_KINDS.cube]);

/**
 * NEW GAME BESIDE PAUSE, in the line over every solve's grid (`SolveHeader`):
 * the way to the puzzle's set-up, for as long as the solve is going. The run
 * is kept where it was left (`useKeptRun`, caught as the link is pressed) and
 * waits in My games, so nothing is asked. It sits up there and not under the
 * grid so that it adds no height to the page's foot: a tall board (Kumimoji's)
 * is laid out for the tray to end the page, and a row below it moved the board
 * off the screen the tray was scrolled to. Not in a race, whose leaving is
 * leaving a contest, nor where the solve draws its own row. Gone (but still
 * taking its room, so nothing beside it moves) once the card at the end is drawn.
 */
export function PuzzleNewGameBeside({ kind }: { kind: PuzzleKind }) {
  const ended = usePuzzleEnded();
  if (HAS_OWN_ENDING_ROW.has(kind)) return null;
  return (
    <span className={ended ? "invisible" : undefined} aria-hidden={ended || undefined}>
      <NewGameLink href={setUpPath(kind)} testId="puzzle-new" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} px-3 py-1 text-sm`} />
    </span>
  );
}

/**
 * NEW GAME UNDER A PASS-AND-PLAY PUZZLE TABLE (Kumimoji's and Mahjong's tables
 * for several), which have no header line of their own.
 */
export function PuzzleNewGame({ kind }: { kind: PuzzleKind }) {
  return (
    <GameEnding>
      <NewGameLink href={setUpPath(kind)} testId="puzzle-new" />
    </GameEnding>
  );
}
