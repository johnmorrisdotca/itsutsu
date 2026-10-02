"use client";

import { EndGameButton, GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { ENDINGS } from "@/components/play/gameEnding.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { SolveDone, type Done, type SolveRace } from "./solveShared";

/**
 * UNDER A PATIENCE TABLE (FreeCell, Spider), as under Solitaire's: Undo, the
 * count of moves standing, Give up, and the line that says what to do next —
 * or, once the game is won or given up, the card that says how it went.
 */
export function PatienceControls({
  puzzle,
  hasAccount,
  race,
  done,
  moves,
  canUndo,
  onUndo,
  canGiveUp,
  onGiveUp,
  said,
  extra = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race: SolveRace | null;
  done: Done | null;
  moves: number;
  canUndo: boolean;
  onUndo: () => void;
  canGiveUp: boolean;
  onGiveUp: () => void;
  said: string;
  /** A line of the game's own beside the count (Spider's deals left). */
  extra?: string | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={onUndo} disabled={!canUndo} data-testid="patience-undo">
          Undo
        </button>
        <p className="text-sm tabular-nums" data-testid="patience-move-count">
          {moves} {moves === 1 ? "move" : "moves"}
        </p>
        {extra === null ? null : (
          <p className="text-sm text-muted" data-testid="patience-extra">
            {extra}
          </p>
        )}
        {done === null ? (
          <div className="ml-auto">
            <GameEnding>
              <EndGameButton ending={ENDINGS.giveUp} onEnd={onGiveUp} disabled={!canGiveUp} testId="patience-give-up" />
              {race === null ? <NewGameLink href={setUpPath(puzzle.kind)} testId="patience-new" /> : null}
            </GameEnding>
          </div>
        ) : null}
      </div>
      {done === null ? (
        <p className="min-h-10 text-sm text-muted" data-testid="patience-said" aria-live="polite">
          {said}
        </p>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} moves={moves} />
      )}
    </>
  );
}
