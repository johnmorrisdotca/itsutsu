"use client";

import { IdleModal } from "./IdleModal";
import { useIdleWatch } from "./useIdleWatch";

/**
 * "Are you still there?" for a surface that has nothing of its own to do when
 * the answer is no — a live game, whose clock is the server's and which the
 * site keeps. The same watch, timings and dialogue as the practice board
 * (`GameView`), which pauses its own clock on it and so calls the watch itself.
 *
 * John, 2026-09-24: "don't we have the ARE YOU THERE Modal that we have in
 * other games? All games should have that... why do we have games that don't
 * have it????" `idleWatch.coverage.test.ts` lists every surface a person plays
 * on and fails the build when one does not ask.
 */
export function AskIfAway({
  watching,
  onBack,
  detail,
  kept,
}: {
  /** Whether there is somebody here to ask: a seat holder, while the game is being played. */
  watching: boolean;
  /** Called when they answer that they are here, after the question closes. */
  onBack?: () => void;
  detail?: string;
  kept?: string;
}) {
  const { idle, confirm } = useIdleWatch({ enabled: watching });
  return (
    <IdleModal
      open={idle}
      onConfirm={() => {
        confirm();
        onBack?.();
      }}
      detail={detail}
      kept={kept}
    />
  );
}
