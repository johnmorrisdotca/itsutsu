"use client";

import { Board } from "@/components/board/Board";
import { GamePanel } from "./GamePanel";
import { useGame } from "./useGame";

export function GameView() {
  const { state, play, undo, reset } = useGame();

  return (
    <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-start">
      <div className="w-full max-w-[640px]">
        <Board state={state} onPlay={play} />
      </div>
      <GamePanel state={state} onUndo={undo} onReset={reset} />
    </div>
  );
}
