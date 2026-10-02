"use client";

import { GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { usePuzzleEnded } from "./PuzzleWinSlot";

/**
 * New game, under every puzzle that has no controls row of its own: the way to
 * the puzzle's set-up, for as long as the solve is going. The run is kept
 * where it was left (`useKeptRun`, caught as the link is pressed) and waits in
 * My games, so nothing is asked. Patience and the cube draw the same row
 * themselves, with Give up beside it (`PatienceControls`, `CubeSolve`); a race
 * has no row, since leaving one is leaving a contest. Gone once the card at
 * the end is drawn, which offers Another and the set-up itself.
 */
export function PuzzleNewGame({ kind }: { kind: PuzzleKind }) {
  const ended = usePuzzleEnded();
  if (ended) return null;
  return (
    <GameEnding>
      <NewGameLink href={setUpPath(kind)} testId="puzzle-new" />
    </GameEnding>
  );
}
