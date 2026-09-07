"use client";

import { useEffect, useRef } from "react";

import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameSession } from "./game.types";

/**
 * Records a game to the history API the moment it finishes.
 *
 * A game is written once. The guard is the move list rather than a flag, so
 * taking a move back and playing on records the new ending too, while
 * re-rendering the same finished position does not write it twice.
 */
export function useGameRecording(session: GameSession) {
  const recorded = useRef(new Set<string>());
  const { state, names } = session;

  useEffect(() => {
    const finished =
      state.status === GAME_STATUS.won || state.status === GAME_STATUS.draw;
    if (!finished) return;

    const signature = state.moves
      .map((move) => `${move.row},${move.col},${move.stone}`)
      .join("|");
    if (recorded.current.has(signature)) return;
    recorded.current.add(signature);

    const nameFor = (stone: "black" | "white") => names[state.seats[stone]].trim();

    const body = {
      blackName: nameFor(STONES.black),
      whiteName: nameFor(STONES.white),
      size: state.settings.size,
      winLength: state.settings.winLength,
      variant: state.settings.variant,
      obstacles: state.settings.obstacles,
      opener: state.opener,
      result: state.winner ?? "draw",
      winner: state.winner,
      moves: state.moves.map((move) => ({
        row: move.row,
        col: move.col,
        stone: move.stone,
        kind: move.kind,
      })),
    };

    void fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {
      // A game that could not be filed is not a reason to interrupt play.
      recorded.current.delete(signature);
    });
  }, [names, state]);
}
