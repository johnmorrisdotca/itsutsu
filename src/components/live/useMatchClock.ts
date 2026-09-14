"use client";

import { useEffect, useState } from "react";

import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { deadlineFor, isOverdue } from "@/lib/history/deadline";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { useHydrated } from "@/lib/ui/hydrated";

/**
 * The clock on a shared match, and the two courtesies around it.
 *
 * Split out of `SharedGame` because it is a different job from playing the
 * board: it counts down, it decides whether a flag may be claimed, and it
 * carries the two requests that are about time rather than about stones —
 * giving the other side more, and claiming when they run out.
 *
 * Split by responsibility rather than by size, which is the rule: the file
 * went over the line while gaining a move list, and the answer to that is
 * never to shave the comments off something until it fits.
 */
export function useMatchClock({
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
  onError: (said: string | null) => void;
  mutate: (next?: GameDetail, options?: { revalidate: boolean }) => Promise<unknown>;
}) {
  /*
   * A once-a-second tick keeps the countdown honest between polls, and stops
   * when there is nothing to count: a finished game with a timer still running
   * is a page that never settles.
   */
  const deadline = deadlineFor({ ...detail, toPlay: state.toPlay });
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null || state.status !== GAME_STATUS.playing) return;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline, state.status]);

  /*
   * NO "NOW" UNTIL THE BROWSER HAS THE PAGE.
   *
   * The server renders this board too, and its `Date.now()` is not the
   * browser's: by the time the browser checks the markup, "4m 59s" left is
   * "4m 57s", and React throws the server's drawing away. Worse than the
   * countdown, whether the deadline has passed decides the panel's colour and
   * whether a claim is offered — so a load straddling the deadline drew one
   * panel and hydrated another.
   *
   * So until hydration there is no answer: `now` is null, nothing is overdue,
   * and nothing can be claimed. That is "not known yet", not "not overdue" —
   * the first browser render after it says which, a moment later, and the
   * server's claim route is what decides a claim in any case.
   */
  const hydrated = useHydrated();
  const now = hydrated ? tick : null;
  const overdue = now !== null && isOverdue(deadline, new Date(now));
  const canClaim = overdue && seat !== null && !yourTurn && state.status === GAME_STATUS.playing;
  /** Whether claiming ends the game outright or only takes their turn. */
  const endsTheGame = detail.timeoutPenalty === "game" || detail.clockMode === "game";

  /** Asks the server, and takes its answer as the truth rather than guessing. */
  async function ask(path: string, refused: string, refreshOnRefusal: boolean) {
    if (token === null) return;
    onError(null);
    const response = await fetch(`/api/games/${detail.id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const said = (await response.json().catch(() => null)) as { error?: string } | null;
      onError(said?.error ?? refused);
      if (refreshOnRefusal) await mutate();
      return;
    }
    await mutate((await response.json()) as GameDetail, { revalidate: false });
  }

  return {
    deadline,
    /** The tick itself, for the countdown the page prints — null until the browser has the page. */
    now,
    overdue,
    canClaim,
    endsTheGame,
    /** More time for the other side, which is theirs to be given. */
    give: () => ask("time", "Time could not be given.", false),
    /*
     * A flag claimed. Refreshing on a refusal is the point of the difference:
     * the usual reason a claim is refused is that they moved while you were
     * reading, and the board in front of you is the stale thing.
     */
    claim: () => ask("timeout", "That could not be claimed.", true),
  };
}
