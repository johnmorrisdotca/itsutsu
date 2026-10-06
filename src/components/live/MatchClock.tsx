"use client";

import type { KeyedMutator } from "swr";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { gameCopy } from "@/components/game/game.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { weave } from "@/lib/i18n/weave";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button } from "@/components/ui/Controls";
import { LocalTime } from "@/components/ui/LocalTime";
import { TONE_CLASS, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { describeRemaining } from "@/lib/history/deadline";
import type { Speaker } from "@/lib/i18n/i18n";
import { FORFEITS_TO_LOSE } from "@/lib/history/moveTime.constants";
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
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
        className={`${PLAY_SURFACE} flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
          overdue ? TONE_CLASS.alarm : TONE_CLASS.calm
        }`}
        data-testid="deadline"
      >
        <span>
          {weave(GAME_COPY.mustMoveBy, {
            name: stoneName(say, state.toPlay),
            when: (
              <span className="font-mono tabular-nums">
                <LocalTime at={deadline.toISOString()} style="time" />
              </span>
            ),
          })}
          {" · "}
          {/*
            Blank, at the width it will have, until the browser has the page.
            How long is left depends on whose clock is asking: the server's
            answer is a second or two old by the time the browser checks it,
            and the browser's clock is the one this countdown ticks on.
          */}
          <span
            className="inline-block min-w-[7ch] font-mono tabular-nums"
            data-testid="deadline-remaining"
          >
            {now === null ? "\u00a0" : describeRemaining(deadline, new Date(now), say)}
          </span>
          {detail.timeoutPenalty === "turn" &&
          (detail.forfeits.black > 0 || detail.forfeits.white > 0) ? (
            <span className="ml-2 text-xs opacity-80">
              {say.say("live.forfeitLine", {
                colour: stoneName(say, state.toPlay),
                note: GAME_COPY.forfeitsNote(detail.forfeits[state.toPlay], FORFEITS_TO_LOSE),
              })}
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
            title={say.say("live.giveTimeHint")}
            data-testid="give-time"
          >
            {say.say("live.giveTime")}
          </Button>
        ) : null}
      </div>
    ) : null}
    {detail.clockMode === "game" && detail.moveTimeMs !== null ? (
      <p className={`${PLAY_SURFACE} text-xs text-muted`} data-testid="time-budgets">
        {say.say("live.timeBudgets", {
          black: stoneName(say, "black"),
          blackTime: describeBudget(detail.blackTimeMs ?? detail.moveTimeMs, say),
          white: stoneName(say, "white"),
          whiteTime: describeBudget(detail.whiteTimeMs ?? detail.moveTimeMs, say),
        })}
      </p>
    ) : null}
    </>
  );
}
/** A budget in words: "1h 20m", "45s". */
function describeBudget(ms: number, say: Speaker): string {
  return describeRemaining(new Date(ms), new Date(0), say);
}
