"use client";

import { useEffect } from "react";

import { Board } from "@/components/board/Board";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { gamePath, matchPath } from "@/lib/gomoku/slugs";
import { snapshotFromMatch } from "./matchSnapshot";
import { useMatchMirror } from "./useMatchMirror";
import { GameOptions, GameSidebar } from "./GamePanel";
import { IdleModal } from "./IdleModal";
import { useIdleWatch } from "./useIdleWatch";
import { BranchPrompt, ReviewBanner } from "./ReviewControls";
import { useGameRecording } from "./useGameRecording";
import { useGameSession } from "./useGameSession";

export function GameView({
  variant,
  trackPath = false,
  match = null,
}: {
  variant?: RuleVariant;
  trackPath?: boolean;
  /** A match opened at its own address, as the server holds it. */
  match?: { game: GameDetail; at?: number } | null;
}) {
  // Nothing moving for a couple of minutes pauses the clock behind a modal.
  const { idle, confirm } = useIdleWatch();
  // A game asked for by name resumes if it is the stored one, else starts fresh.
  const { session, actions } = useGameSession(
    variant === undefined ? {} : { variant },
    {
      persist: true,
      paused: idle,
      fresh: variant !== undefined,
      match:
        match === null
          ? null
          : { id: match.game.id, snapshot: snapshotFromMatch(match.game), at: match.at },
    },
  );
  // From the first stone the game is a match on the server, and has an address.
  const kept = useMatchMirror(session, trackPath, match?.game.id ?? null);
  const streaks = useGameRecording(session, { active: kept.matchId !== null, synced: kept.synced });

  /*
   * The address follows the game. Choosing another game from the browser or
   * the settings is the same act as arriving at its page, so the bar shows
   * /games/<slug> either way; once a stone is down the match has an id and
   * the bar names the position, /games/<slug>/<id>/<move>, kept current as
   * the record is stepped through.
   */
  const playing = session.state.settings.variant;
  const { moveIndex } = session;
  useEffect(() => {
    if (!trackPath) return;
    const path =
      kept.matchId === null ? gamePath(playing) : matchPath(playing, kept.matchId, moveIndex);
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [kept.matchId, moveIndex, playing, trackPath]);
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
