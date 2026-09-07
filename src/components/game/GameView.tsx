"use client";

import { Board } from "@/components/board/Board";
import { GameOptions, GameSidebar } from "./GamePanel";
import { useGameRecording } from "./useGameRecording";
import { useGameSession } from "./useGameSession";

export function GameView() {
  const { session, actions } = useGameSession({}, { persist: true });
  useGameRecording(session);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <div className="w-full min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[min(100%,46rem)]">
            <Board
              state={session.state}
              appearance={session.appearance}
              marks={session.marks}
              onPlay={actions.play}
            />
          </div>
        </div>
        <GameSidebar session={session} actions={actions} />
      </div>
      <GameOptions session={session} actions={actions} />
    </div>
  );
}
