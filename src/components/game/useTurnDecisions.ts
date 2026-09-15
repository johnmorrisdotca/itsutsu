"use client";

import { useCallback } from "react";

import { isSwapBlocked, type assess } from "@/lib/gomoku/analysis";
import {
  chooseColour as engineChooseColour,
  extendOpening as engineExtendOpening,
  growBoard,
  seatToPlay,
  shrinkBoard,
  swapSeats,
} from "@/lib/gomoku/engine";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { skipMove } from "@/lib/gomoku/rules/record";

import type { ResizeDirection, ResizeProposal } from "./game.types";
import { resizeTarget } from "./sessionSupport";
import type { useGameTimeline } from "./useGameTimeline";

/**
 * The turns that are not a stone: a skip, a swap, a colour chosen, an opening
 * extended, and a resize offered and answered.
 *
 * Lifted out of `useGameSession` beside `useBoardInput` when that hook reached
 * the size gate. Each decision still moves the session's one timeline — a skip
 * through `commit`, the rest as an entry of their own — so each is taken back
 * the way a stone is. The resize proposal itself stays with the session, which
 * clears it when a move is made or a new game begins.
 */
export function useTurnDecisions({
  state,
  line,
  assessment,
  reviewing,
  commit,
  resizeProposal,
  setResizeProposal,
}: {
  state: GameState;
  /** The session's timeline, which every decision moves on. */
  line: ReturnType<typeof useGameTimeline>;
  assessment: ReturnType<typeof assess>;
  reviewing: boolean;
  /** The session's one way of recording a move, which a skip is. */
  commit: (move: GameState) => void;
  resizeProposal: ResizeProposal | null;
  setResizeProposal: (proposal: ResizeProposal | null) => void;
}) {
  const skip = useCallback(() => {
    commit(skipMove(state, Math.random()));
  }, [commit, state]);

  /** A swap moves the timeline on without a stone, so it undoes like a move. */
  const swap = useCallback(() => {
    if (isSwapBlocked(assessment)) return;
    const next = swapSeats(state);
    if (next !== state) line.advance(next, null);
  }, [line, assessment, state]);

  /** Opening decisions are timeline entries too, so they can be taken back. */
  const chooseColour = useCallback(
    (stone: Stone) => {
      if (reviewing) return;
      const next = engineChooseColour(state, stone);
      if (next !== state) line.advance(next, null);
    },
    [line, reviewing, state],
  );

  const extendOpening = useCallback(() => {
    if (reviewing) return;
    const next = engineExtendOpening(state);
    if (next !== state) line.advance(next, null);
  }, [line, reviewing, state]);

  /*
   * A resize changes the game both players are in, so it is offered rather
   * than done. The proposal is session state, not engine state: it is a
   * negotiation about the rules, not a move within them, and nothing about it
   * belongs in the record.
   */
  const proposeResize = useCallback(
    (direction: ResizeDirection) => {
      const size = resizeTarget(state, direction);
      if (size === null) return;
      setResizeProposal({ from: seatToPlay(state), direction, size });
    },
    [setResizeProposal, state],
  );

  const acceptResize = useCallback(() => {
    if (resizeProposal === null) return;
    const next =
      resizeProposal.direction === "grow" ? growBoard(state) : shrinkBoard(state);
    setResizeProposal(null);
    if (next !== state) line.advance(next, null);
  }, [line, resizeProposal, setResizeProposal, state]);

  const declineResize = useCallback(() => setResizeProposal(null), [setResizeProposal]);

  return { skip, swap, chooseColour, extendOpening, proposeResize, acceptResize, declineResize };
}
