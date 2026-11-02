"use client";

import { EndGameButton, GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { ENDINGS } from "@/components/play/gameEnding.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { BUTTON_BASE, BUTTON_QUIET, ROOM_FOR_A_WORD, ROOM_FOR_THREE_LINES, ROOM_FOR_TWO_LINES, TAP_HEIGHT } from "@/components/ui/ui.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { SolveDone, type Done, type SolveRace } from "./solveShared";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

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
  const say = useSpeaker();
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${ROOM_FOR_A_WORD}`} onClick={onUndo} disabled={!canUndo} data-testid="patience-undo">
          {say.say("puzzle.press.undo")}
        </button>
        <p className="min-w-16 text-sm tabular-nums" data-testid="patience-move-count">
          {say.count("count.move", moves)}
        </p>
        {extra === null ? null : (
          <p className={`basis-full text-sm text-muted ${ROOM_FOR_TWO_LINES} sm:order-last sm:min-h-0`} data-testid="patience-extra">
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
        <p className={`text-sm text-muted ${ROOM_FOR_THREE_LINES}`} data-testid="patience-said" aria-live="polite">
          {said}
        </p>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} moves={moves} />
      )}
    </>
  );
}
