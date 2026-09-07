"use client";

import { useState } from "react";
import useSWR from "swr";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { rulesFor } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONE_DISPLAY, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { GAME_COPY } from "@/components/game/game.constants";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { TONE_CLASS } from "@/components/ui/ui.constants";

/** How often a waiting board asks whether the other side has moved. */
const POLL_MS = 2500;

const fetcher = async (url: string): Promise<GameDetail> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the game.");
  return response.json();
};

/**
 * A game played from two devices.
 *
 * The server owns the rules — this only asks it to play a move and redraws
 * whatever comes back. Polling is deliberately plain: a board changes a few
 * times a minute at most, so a short poll costs less than the machinery a
 * socket would need, and it survives a phone locking and waking up.
 */
export function SharedGame({
  initial,
  token,
  seat,
}: {
  initial: GameDetail;
  token: string | null;
  seat: Stone | null;
}) {
  const [error, setError] = useState<string | null>(null);
  /*
   * Whether to keep asking. Driven from `onSuccess` rather than SWR's
   * function-form `refreshInterval`, which does not schedule a poll at all.
   */
  const [polling, setPolling] = useState(initial.status === "active");

  const { data: game, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    // A finished game has nothing left to poll for.
    refreshInterval: polling ? POLL_MS : 0,
    onSuccess: (latest) => setPolling(latest.status === "active"),
    /*
     * Keep polling while the tab is in the background. This is a game played
     * over minutes on two phones — the board has to be current the moment
     * someone looks at it, not a poll interval later.
     */
    refreshWhenHidden: true,
    revalidateOnFocus: true,
  });

  const detail = game ?? initial;
  const state = replayGame(detail);
  const yourTurn = seat !== null && state.toPlay === seat;
  const playable = yourTurn && state.status === GAME_STATUS.playing;

  async function play(point: Point) {
    if (!playable || token === null) return;
    setError(null);

    // Draw the stone at once, then let the server's answer be the truth.
    const response = await fetch(`/api/games/${detail.id}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, row: point.row, col: point.col }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(body?.error ?? "That move could not be played.");
      await mutate();
      return;
    }

    await mutate((await response.json()) as GameDetail, { revalidate: false });
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <TurnBanner
        state={state}
        seat={seat}
        yourTurn={yourTurn}
        finished={state.status !== GAME_STATUS.playing}
      />

      {error !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}>
          {error}
        </p>
      ) : null}

      {VARIANT_SPECS[state.settings.variant].captures ? (
        <p className="text-xs text-muted" data-testid="shared-captures">
          {GAME_COPY.captures.label} · {STONE_DISPLAY.black.label} {state.captures.black} ·{" "}
          {STONE_DISPLAY.white.label} {state.captures.white} ·{" "}
          {GAME_COPY.capturesToWin(state.settings.capturesToWin)}
        </p>
      ) : null}
      {state.status === GAME_STATUS.playing &&
      rulesFor(state.settings, state.toPlay).forbidden.length > 0 ? (
        <p className="text-xs text-muted">
          {STONE_DISPLAY[state.toPlay].label} may not play the points marked ✕.
        </p>
      ) : null}

      <Board
        state={state}
        appearance={DEFAULT_APPEARANCE}
        readOnly={!playable}
        onPlay={play}
      />
    </div>
  );
}

function TurnBanner({
  state,
  seat,
  yourTurn,
  finished,
}: {
  state: ReturnType<typeof replayGame>;
  seat: Stone | null;
  yourTurn: boolean;
  finished: boolean;
}) {
  if (finished) {
    const won = state.winner;
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${TONE_CLASS.great}`}>
        {won === null
          ? "Draw. The board is full."
          : `${STONE_DISPLAY[won].label} wins in ${state.moves.length} moves.`}
      </p>
    );
  }

  if (seat === null) {
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}>
        You are watching. {STONE_DISPLAY[state.toPlay].label} to play.
      </p>
    );
  }

  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
        yourTurn ? TONE_CLASS.good : TONE_CLASS.calm
      }`}
      data-testid="turn-banner"
    >
      {yourTurn
        ? `Your move — you are ${STONE_DISPLAY[seat].label}.`
        : `Waiting for ${STONE_DISPLAY[state.toPlay].label}…`}
    </p>
  );
}
