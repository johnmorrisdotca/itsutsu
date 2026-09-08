"use client";

import { useEffect } from "react";

import { Board } from "@/components/board/Board";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { gamePath } from "@/lib/gomoku/slugs";
import { GameOptions, GameSidebar } from "./GamePanel";
import { IdleModal } from "./IdleModal";
import { useIdleWatch } from "./useIdleWatch";
import { BranchPrompt, ReviewBanner } from "./ReviewControls";
import { useGameRecording } from "./useGameRecording";
import { useGameSession } from "./useGameSession";

export function GameView({
  variant,
  trackPath = false,
}: {
  variant?: RuleVariant;
  trackPath?: boolean;
}) {
  // Nothing moving for a couple of minutes pauses the clock behind a modal.
  const { idle, confirm } = useIdleWatch();
  // A game asked for by name resumes if it is the stored one, else starts fresh.
  const { session, actions } = useGameSession(
    variant === undefined ? {} : { variant },
    { persist: true, paused: idle, fresh: variant !== undefined },
  );
  const streaks = useGameRecording(session);

  /*
   * The address follows the game. Choosing another game from the browser or
   * the settings is the same act as arriving at its page, so the bar shows
   * /games/<slug> either way, and a refresh or a copied link keeps the game.
   */
  const playing = session.state.settings.variant;
  useEffect(() => {
    if (!trackPath) return;
    const path = gamePath(playing);
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [playing, trackPath]);
  const showIdle = idle && session.state.status === GAME_STATUS.playing;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <div className="w-full min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[min(100%,46rem)] flex-col gap-3">
            <ReviewBanner session={session} actions={actions} />
            <BranchPrompt session={session} actions={actions} />
            <Board
              state={session.state}
              appearance={session.appearance}
              marks={session.marks}
              readOnly={session.boardReadOnly}
              onPlay={actions.play}
              onTwist={actions.twist}
              selected={session.selected}
              footprintFor={session.hand.piece !== null ? session.hand.footprintFor : undefined}
              placing={session.placing}
            />
          </div>
        </div>
        <GameSidebar session={session} actions={actions} />
      </div>
      <GameOptions session={session} actions={actions} streaks={streaks} />
      <IdleModal open={showIdle} onConfirm={confirm} />
    </div>
  );
}
