"use client";

import { useEffect, useState } from "react";
import type { Appearance } from "@/components/board/board.types";
import { useSavedAppearance } from "./useSavedAppearance";
import { boardSettingsFrom, type GameDefaults } from "./gameDefaults";

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
  appearance = null,
  signedIn = false,
  defaults,
}: {
  variant?: RuleVariant;
  trackPath?: boolean;
  /** A match opened at its own address, as the server holds it. */
  match?: { game: GameDetail; at?: number } | null;
  /** The member's own board, from their account; null when they have never chosen one. */
  appearance?: Appearance | null;
  /** Whether there is an account to save a board to at all. */
  signedIn?: boolean;
  /** Where a new game starts for this member. */
  defaults: GameDefaults;
}) {
  // Nothing moving for a couple of minutes pauses the clock behind a modal.
  const { idle, confirm } = useIdleWatch();
  // /games/<slug>#post-seat: the lobby's "Post a seat" lands here wanting the sharing panel.
  const [postSeat] = useState(() => typeof window !== "undefined" && window.location.hash === "#post-seat");
  // A game asked for by name resumes if it is the stored one, else starts fresh.
  /*
   * A new board starts where the member said it should. `variant` last,
   * because the address names the game and nothing standing may override
   * that; and a game already stored is restored over the top of all of it,
   * because the settings on a board in progress are what the players agreed.
   */
  const { session, actions } = useGameSession(
    { ...boardSettingsFrom(defaults), ...(variant === undefined ? {} : { variant }) },
    {
      persist: true,
      paused: idle,
      fresh: variant !== undefined,
      accountAppearance: appearance,
      match:
        match === null
          ? null
          : { id: match.game.id, snapshot: snapshotFromMatch(match.game), at: match.at },
    },
  );

  /*
   * Signed in, the board chosen here follows them to their other devices.
   * `signedIn` rather than "has a board": somebody who has never chosen one
   * is exactly who should have their first choice saved.
   */
  useSavedAppearance(session.appearance, signedIn);
  // From the first stone the game is a match on the server, and has an address.
  const kept = useMatchMirror(session, trackPath, match?.game.id ?? null);
  const streaks = useGameRecording(session, { active: kept.matchId !== null, synced: kept.synced });

  /*
   * The address follows the game. Choosing another game from the browser or
   * the settings is the same act as arriving at its page, so the bar shows
   * /games/<slug> either way; once a stone is down the match has an id and
   * the bar names the position, /games/<slug>/<id>/<move>, kept current as
   * the record is stepped through.
   *
   * It waits for the record to be stored before naming a move, which is the
   * whole of a bug a player could meet: the moves are posted one at a time
   * behind the board, and this used to name the local move number the instant
   * the match had an id. MatchPage refuses a move number the game does not
   * hold yet — rightly — so the bar spent that window naming a position the
   * server had never heard of, and anybody who refreshed inside it was told
   * their game did not exist. They had just played two stones.
   *
   * Holding the previous address is the honest half of the fix. The other
   * possibility was to let MatchPage clamp a move number that is too high,
   * and that is worse: it turns a wrong address into a silently wrong
   * position, where an honest 404 at least says something is out of step.
   */
  const playing = session.state.settings.variant;
  const { moveIndex } = session;
  useEffect(() => {
    if (!trackPath) return;
    if (kept.matchId === null) {
      if (window.location.pathname !== gamePath(playing)) {
        window.history.replaceState(null, "", gamePath(playing));
      }
      return;
    }
    // Not yet stored: name the game rather than a position in it. Holding a
    // stale move number instead would show a refreshing player fewer stones
    // than they had just played, which is worse than not naming the position.
    const path = kept.synced
      ? matchPath(playing, kept.matchId, moveIndex)
      : gamePath(playing);
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [kept.matchId, kept.synced, moveIndex, playing, trackPath]);
  const showIdle = idle && session.state.status === GAME_STATUS.playing;

  /*
   * The piece games from the keyboard: R turns the piece, F flips it, S lays
   * a single stone instead, as the on-screen buttons do. Typing in a field is
   * left alone.
   */
  const holdingPiece = session.hand.piece !== null;
  const { rotatePiece, flipPiece, toggleSingle, jumpTo } = actions;
  const { moveTotal } = session;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (holdingPiece) {
        if (key === "r" || key === "arrowright") rotatePiece();
        else if (key === "f" || key === "arrowup") flipPiece();
        else if (key === "s") toggleSingle();
        else return;
      } else {
        // With nothing in hand the arrows walk the record, as they do on a replay.
        if (key === "arrowleft") jumpTo(Math.max(0, moveIndex - 1));
        else if (key === "arrowright") jumpTo(Math.min(moveTotal, moveIndex + 1));
        else if (key === "home") jumpTo(0);
        else if (key === "end") jumpTo(moveTotal);
        else return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [holdingPiece, rotatePiece, flipPiece, toggleSingle, jumpTo, moveIndex, moveTotal]);

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
              viewer={session.state.opener}
            />
          </div>
        </div>
        <GameSidebar session={session} actions={actions} postSeat={postSeat} defaults={defaults} />
      </div>
      <GameOptions session={session} actions={actions} streaks={streaks} />
      <IdleModal open={showIdle} onConfirm={confirm} />
    </div>
  );
}
