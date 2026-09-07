"use client";

import { useCallback, useMemo, useState } from "react";

import {
  footprintAt,
  footprintFits,
  mustPass,
  orientCells,
  queuedPiece,
  singlesLeft,
  upcomingPieces,
} from "@/lib/gomoku/engine";
import { PIECE_PREVIEW, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Piece, PieceCell, Point } from "@/lib/gomoku/gomoku.types";

/** What a player holds in a piece game, and how they have turned it. */
export type PieceHand = {
  /** The piece to lay, or null outside the piece games. */
  piece: Piece | null;
  /** That piece as currently turned and flipped, relative to its top-left corner. */
  cells: PieceCell[];
  next: Piece[];
  turns: number;
  flipped: boolean;
  /** True while the player has chosen to lay a single stone instead. */
  layingSingle: boolean;
  singlesLeft: number;
  /** True when nothing fits and no single is left: the turn has to pass. */
  mustPass: boolean;
  /** The footprint the piece would cover with its corner on `anchor`, or null if it does not fit. */
  footprintFor: (anchor: Point) => PieceCell[] | null;
};

/**
 * The piece in hand for the local and the shared board alike. Turning and
 * flipping are the player's choice and live here; which piece it is, and
 * whether anything fits, are the engine's to say.
 */
export function usePieceHand(state: GameState) {
  /*
   * The orientation belongs to one turn. It is stored against a key for that
   * turn, so a new piece in hand starts the right way up without an effect
   * having to reset anything.
   */
  const turnKey = `${state.moves.length}:${state.toPlay}`;
  const [held, setHeld] = useState({ key: turnKey, turns: 0, flipped: false, single: false });
  const current = held.key === turnKey ? held : { key: turnKey, turns: 0, flipped: false, single: false };
  const { turns, flipped } = current;

  const inPieceGame = VARIANT_SPECS[state.settings.variant].queue !== null;
  const piece = useMemo(() => (inPieceGame ? queuedPiece(state) : null), [inPieceGame, state]);
  const cells = useMemo(
    () => (piece === null ? [] : orientCells(piece, turns, flipped)),
    [flipped, piece, turns],
  );
  const next = useMemo(
    () => (inPieceGame ? upcomingPieces(state, PIECE_PREVIEW) : []),
    [inPieceGame, state],
  );
  const singles = inPieceGame ? singlesLeft(state) : 0;
  const passDue = inPieceGame && mustPass(state);
  const layingSingle = current.single && singles > 0;

  /** The orientation for this turn, fresh if the stored one belongs to an earlier turn. */
  const forThisTurn = (was: typeof held) =>
    was.key === turnKey ? was : { key: turnKey, turns: 0, flipped: false, single: false };

  const rotate = useCallback(
    () => setHeld((was) => ({ ...forThisTurn(was), turns: (forThisTurn(was).turns + 1) % 4 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forThisTurn closes over turnKey only
    [turnKey],
  );
  const flip = useCallback(
    () => setHeld((was) => ({ ...forThisTurn(was), flipped: !forThisTurn(was).flipped })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forThisTurn closes over turnKey only
    [turnKey],
  );
  const toggleSingle = useCallback(() => {
    if (singles > 0) setHeld((was) => ({ ...forThisTurn(was), single: !forThisTurn(was).single }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forThisTurn closes over turnKey only
  }, [singles, turnKey]);

  const footprintFor = useCallback(
    (anchor: Point): PieceCell[] | null => {
      if (piece === null || layingSingle) return null;
      const footprint = footprintAt(cells, anchor);
      return footprintFits(state.board, state.settings.size, footprint) ? footprint : null;
    },
    [cells, layingSingle, piece, state.board, state.settings.size],
  );

  const hand: PieceHand = {
    piece,
    cells,
    next,
    turns,
    flipped,
    layingSingle,
    singlesLeft: singles,
    mustPass: passDue,
    footprintFor,
  };

  return { hand, rotate, flip, toggleSingle };
}
