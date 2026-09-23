"use client";

import { Button } from "@/components/ui/Controls";
import { TONE_CLASS } from "@/components/ui/ui.constants";

import { BOT_SEAT_COPY, LIVE_PAUSED_COPY } from "./live.constants";
import { NextCheck } from "./NextCheck";

/**
 * The lines above a live board that say how it is keeping up: when it next
 * asks, that it has stopped asking, what went wrong, and that the computer is
 * thinking. Out of `SharedGame` when that file reached the size gate.
 *
 * The countdown is furniture — "just the board" hides it — while a stopped
 * board, an error and a computer thinking are things a player needs to know
 * whatever the page is showing, so they stay.
 */
export function LiveStatusLines({
  asking,
  answeredAt,
  every,
  paused,
  onResume,
  error,
  thinking,
}: {
  asking: boolean;
  answeredAt: () => number;
  every: number;
  paused: boolean;
  onResume: () => void;
  error: string | null;
  thinking: boolean;
}) {
  return (
    <>
      {/* And while it IS asking, when the next check is due — so quiet and broken look different. */}
      <div data-chrome className="contents">
        <NextCheck asking={asking} answeredAt={answeredAt} every={every} />
      </div>
      {/* A board that has stopped asking says so, rather than showing an old position as the current one. */}
      {paused ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted" data-testid="live-paused">
          <span>{LIVE_PAUSED_COPY.line}</span>
          <Button onClick={onResume}>{LIVE_PAUSED_COPY.check}</Button>
        </p>
      ) : null}

      {error !== null ? <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}>{error}</p> : null}

      {/*
        Said out loud, because it is now this browser doing the thinking and a
        move may take a couple of seconds. A board that simply sits there is
        indistinguishable from one that has stopped working, and the player has
        no other way to tell — the computer used to answer inside the request
        that carried their own stone, so there was never a gap to explain.
      */}
      {thinking ? (
        <p className="text-sm text-muted" data-testid="bot-thinking" role="status">
          {BOT_SEAT_COPY.thinking}
        </p>
      ) : null}
    </>
  );
}
