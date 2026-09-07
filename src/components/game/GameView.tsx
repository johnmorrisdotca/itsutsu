"use client";

import { Board } from "@/components/board/Board";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { GameOptions, GameSidebar } from "./GamePanel";
import { IdleModal } from "./IdleModal";
import { useIdleWatch } from "./useIdleWatch";
import { BranchPrompt, ReviewBanner } from "./ReviewControls";
import { useGameRecording } from "./useGameRecording";
import { useGameSession } from "./useGameSession";

export function GameView({ variant }: { variant?: RuleVariant }) {
  // Nothing moving for a couple of minutes pauses the clock behind a modal.
  const { idle, confirm } = useIdleWatch();
  // A game asked for by name starts fresh; otherwise the last game resumes.
  const { session, actions } = useGameSession(
    variant === undefined ? {} : { variant },
    { persist: true, paused: idle, fresh: variant !== undefined },
  );
  const streaks = useGameRecording(session);
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
