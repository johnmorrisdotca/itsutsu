"use client";

import { useCallback, useState } from "react";

import { suggestMove } from "@/lib/gomoku/analysis";
import type { Suggestion } from "@/lib/gomoku/analysis.types";
import { seatToPlay } from "@/lib/gomoku/engine";
import { SEATS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Seat } from "@/lib/gomoku/gomoku.types";
import { HINT_POLICIES } from "./game.constants";
import type { HintPolicy } from "./game.types";

/**
 * What the players may be told, and how much of it is left.
 *
 * A hint is the one thing in a game a player can spend, so what it costs is
 * a rule of its own: reading the answer for the position in front of you is
 * free however often you look, a new position costs one, and a game that
 * reads no lines — a race, a flip, a drop — has no answer to sell.
 */
export type GameHints = {
  hintsLeft: Record<Seat, number>;
  hint: Suggestion | null;
  askHint: () => void;
  grantHint: () => void;
  /** A move answers the question; the old suggestion must not outlive it. */
  forgetHint: () => void;
  resetHints: (perSeat: number) => void;
};

export function useGameHints({
  start,
  policy,
  state,
  onTaken,
}: {
  /** How many each seat begins with, restored from a kept game or the settings. */
  start: Record<Seat, number>;
  policy: HintPolicy;
  state: GameState;
  /** Called when a hint is actually spent, so the game's own tally can count it. */
  onTaken: (seat: Seat) => void;
}): GameHints {
  const [hintsLeft, setHintsLeft] = useState<Record<Seat, number>>(start);
  const [hint, setHint] = useState<Suggestion | null>(null);
  const seat = seatToPlay(state);

  const askHint = useCallback(() => {
    if (policy === HINT_POLICIES.off) return;
    // The answer for this position is already on the board: reading it again is free.
    if (hint !== null) return;
    if (policy === HINT_POLICIES.limited && hintsLeft[seat] <= 0) return;
    // Ask first, charge after: a hint that comes back empty was never a hint.
    const suggestion = suggestMove(state);
    if (suggestion === null) return;
    if (policy === HINT_POLICIES.limited) {
      setHintsLeft((current) => ({ ...current, [seat]: current[seat] - 1 }));
    }
    onTaken(seat);
    setHint(suggestion);
  }, [hint, hintsLeft, onTaken, policy, seat, state]);

  /** Hands one of your own hints to the other seat. */
  const grantHint = useCallback(() => {
    if (policy !== HINT_POLICIES.limited) return;
    if (hintsLeft[seat] <= 0) return;
    const other = seat === SEATS.one ? SEATS.two : SEATS.one;
    setHintsLeft((current) => ({
      ...current,
      [seat]: current[seat] - 1,
      [other]: current[other] + 1,
    }));
  }, [hintsLeft, policy, seat]);

  const forgetHint = useCallback(() => setHint(null), []);
  const resetHints = useCallback((perSeat: number) => {
    setHint(null);
    setHintsLeft({ one: perSeat, two: perSeat });
  }, []);

  return { hintsLeft, hint, askHint, grantHint, forgetHint, resetHints };
}
