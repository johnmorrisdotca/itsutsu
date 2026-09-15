"use client";

import { useCallback, useState } from "react";

import {
  cellAt,
  inMovePhase,
  isLegalMove,
  movePiece,
  passTurn,
  pieceMoves,
  placePiece,
  playMove,
  twistBoard,
} from "@/lib/gomoku/engine";
import { MOVE_KINDS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point, Seat, Stone } from "@/lib/gomoku/gomoku.types";

import { HISTORY_MODES } from "./game.constants";
import type { SessionSettings } from "./game.types";
import { usePieceHand } from "./usePieceHand";

/**
 * What a click on the board means, and what is in hand while it is decided.
 *
 * Lifted out of `useGameSession` when that hook reached the size gate. The
 * session keeps the timeline and the game around it; this is the input half —
 * the stone, the piece or the colour in hand, the piece picked up in a sliding
 * game, and a move held back for confirmation because it would discard the
 * moves after it. Every move still reaches the engine through `commit`, the
 * session's one way of recording one.
 */
export function useBoardInput({
  state,
  commit,
  reviewing,
  historyMode,
  helpRequest,
  setHelpRequest,
  setHelpMark,
}: {
  state: GameState;
  /** The session's one way of recording a move. */
  commit: (move: GameState) => void;
  reviewing: boolean;
  historyMode: SessionSettings["historyMode"];
  /** A seat that has asked for advice: while one has, a click marks the board instead. */
  helpRequest: Seat | null;
  setHelpRequest: (seat: Seat | null) => void;
  setHelpMark: (point: Point | null) => void;
}) {
  const [selected, setSelected] = useState<Point | null>(null);
  const { hand, rotate: rotatePiece, flip: flipPiece, toggleSingle } = usePieceHand(state);
  // The choose-a-colour games: which colour the next stone will be. Black to begin with.
  const choosesColour = VARIANT_SPECS[state.settings.variant].anyColour;
  const [placingChoice, setPlacingChoice] = useState<Stone>(STONES.black);
  const placing = choosesColour ? placingChoice : null;
  const setPlacing = useCallback((stone: Stone) => setPlacingChoice(stone), []);
  const [pendingBranch, setPendingBranch] = useState<Point | null>(null);

  const play = useCallback(
    (point: Point) => {
      // While advice has been asked for, a click marks the board instead.
      if (helpRequest !== null) {
        setHelpMark(point);
        setHelpRequest(null);
        return;
      }
      /*
       * Playing from an earlier position destroys the moves after it. In
       * review mode that is simply not allowed; in branch mode it is held
       * back for confirmation, because silently discarding a game someone is
       * only reading through is never what they meant.
       */
      if (reviewing) {
        if (historyMode !== HISTORY_MODES.branch) return;
        if (!isLegalMove(state, point)) return;
        setPendingBranch(point);
        return;
      }
      /*
       * The sliding games: once every piece is down, the first click picks a
       * piece up and the second puts it down. Clicking another of your own
       * pieces changes your mind; clicking the same one puts it back.
       */
      // The piece games: the click is where the piece's corner goes, unless a single is chosen.
      if (hand.piece !== null && !hand.layingSingle) {
        const footprint = hand.footprintFor(point);
        if (footprint !== null) commit(placePiece(state, footprint));
        return;
      }
      if (inMovePhase(state)) {
        const lands =
          selected !== null &&
          pieceMoves(state, selected).some((to) => to.row === point.row && to.col === point.col);
        if (lands && selected !== null) {
          setSelected(null);
          commit(movePiece(state, selected, point));
          return;
        }
        if (cellAt(state, point) === state.toPlay) {
          setSelected(
            selected !== null && selected.row === point.row && selected.col === point.col
              ? null
              : point,
          );
        }
        return;
      }
      commit(playMove(state, point, MOVE_KINDS.place, placing));
    },
    [commit, hand, helpRequest, historyMode, placing, reviewing, selected, setHelpMark, setHelpRequest, state],
  );

  /** Passes the turn: forced in a piece game when nothing fits, offered freely at any point in Go. */
  const pass = useCallback(() => {
    if (reviewing) return;
    commit(passTurn(state));
  }, [commit, reviewing, state]);

  /** Finishes a move in the twist games by turning one quadrant. */
  const twist = useCallback(
    (quadrant: number, clockwise: boolean) => {
      if (reviewing) return;
      commit(twistBoard(state, quadrant, clockwise));
    },
    [commit, reviewing, state],
  );

  const confirmBranch = useCallback(() => {
    if (pendingBranch === null) return;
    setPendingBranch(null);
    commit(playMove(state, pendingBranch, MOVE_KINDS.place, placing));
  }, [commit, pendingBranch, placing, state]);

  const cancelBranch = useCallback(() => setPendingBranch(null), []);

  /** Puts down whatever is in hand and forgets a move held back, for a new game. */
  const clearInput = useCallback(() => {
    setSelected(null);
    setPendingBranch(null);
  }, []);

  return {
    selected,
    hand,
    rotatePiece,
    flipPiece,
    toggleSingle,
    placing,
    setPlacing,
    pendingBranch,
    play,
    pass,
    twist,
    confirmBranch,
    cancelBranch,
    clearInput,
  };
}
