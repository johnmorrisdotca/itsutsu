"use client";

import type { KeyedMutator } from "swr";

import { GAME_COPY } from "@/components/game/game.constants";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button } from "@/components/ui/Controls";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { describeRemaining } from "@/lib/history/deadline";
import { FORFEITS_TO_LOSE } from "@/lib/history/gameSettingsSchema";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { useMatchClock } from "./useMatchClock";

/**
 * What the clock says, and the two things a player may do about it.
 *
 * Its own component because it is its own job: the board is about where the
 * stones are, and this is about who owes a move and by when. The hook that
 * keeps the countdown honest between polls lives with it rather than in the
 * board, so the once-a-second tick belongs to the thing that is counting.
 *
 * The deadline is the server's. Nothing here decides one; it only says what
 * the game came with, and hands back the two answers a player can give: take
 * the turn somebody has run out of time for, or give them more of it.
 */
export function MatchClock({
  detail,
  state,
  seat,
  yourTurn,
  token,
  onError,
  mutate,
}: {
  detail: GameDetail;
  state: GameState;
  seat: Stone | null;
  yourTurn: boolean;
  token: string | null;
  onError: (message: string | null) => void;
  mutate: KeyedMutator<GameDetail>;
}) {
  const { deadline, now, overdue, canClaim, endsTheGame, give, claim } = useMatchClock({
    detail,
    state,
    seat,
    yourTurn,
    token,
    onError,
    mutate,
  });

  return (
    <>
    {deadline !== null && state.status === GAME_STATUS.playing ? (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
          overdue ? TONE_CLASS.alarm : TONE_CLASS.calm
        }`}
        data-testid="deadline"
      >
        <span>
          {STONE_DISPLAY[state.toPlay].label} {GAME_COPY.mustMoveBy}{" "}
          <span className="font-mono tabular-nums">
            {deadline.toLocaleTimeString()}
          </span>
          {" · "}
          <span
            className="font-mono tabular-nums"
            data-testid="deadline-remaining"
          >
            {describeRemaining(deadline, new Date(now))}
          </span>
          {detail.timeoutPenalty === "turn" &&
          (detail.forfeits.black > 0 || detail.forfeits.white > 0) ? (
            <span className="ml-2 text-xs opacity-80">
              {STONE_DISPLAY[state.toPlay].label}:{" "}
              {GAME_COPY.forfeitsNote(
                detail.forfeits[state.toPlay],
                FORFEITS_TO_LOSE,
              )}
            </span>
          ) : null}
        </span>
        {canClaim ? (
          /*
            The one irreversible thing here that is done TO somebody rather
            than by them, so it asks — and the question says which of the
            two it is, since claiming a turn and claiming the game are not
            the same act.
          */
          <ConfirmButton
            label={
              endsTheGame
                ? GAME_COPY.claimGame.label
                : GAME_COPY.claimTurn.label
            }
            question={
              endsTheGame
                ? GAME_COPY.claimGameConfirm
                : GAME_COPY.claimTurnConfirm
            }
            confirm={
              endsTheGame
                ? GAME_COPY.claimGame.label
                : GAME_COPY.claimTurn.label
            }
            onConfirm={() => void claim()}
            strong
            title={GAME_COPY.claimHint}
            testId="claim-timeout"
          />
        ) : null}
        {seat !== null &&
        !yourTurn &&
        state.status === GAME_STATUS.playing ? (
          <Button
            onClick={give}
            title="Add time to the other side's clock for this move. Nobody has to win on the clock."
            data-testid="give-time"
          >
            Give more time
          </Button>
        ) : null}
      </div>
    ) : null}
    {detail.clockMode === "game" && detail.moveTimeMs !== null ? (
      <p className="text-xs text-muted" data-testid="time-budgets">
        Time left for the whole game · {STONE_DISPLAY.black.label}{" "}
        {describeBudget(detail.blackTimeMs ?? detail.moveTimeMs)} ·{" "}
        {STONE_DISPLAY.white.label}{" "}
        {describeBudget(detail.whiteTimeMs ?? detail.moveTimeMs)}
      </p>
    ) : null}
    </>
  );
}
/** A budget in words: "1h 20m", "45s". */
function describeBudget(ms: number): string {
  return describeRemaining(new Date(ms), new Date(0));
}
