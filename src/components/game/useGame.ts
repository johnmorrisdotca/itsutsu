"use client";

import { useCallback, useState } from "react";
import { createGame, playMove, undoMove } from "@/lib/gomoku/engine";
import { DEFAULT_SETTINGS } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, Point } from "@/lib/gomoku/gomoku.types";

/**
 * Holds one `GameState` and exposes the engine's transitions. All rules live
 * in `@/lib/gomoku/engine`; this hook only threads state through React.
 */
export function useGame(initial: GameSettings = DEFAULT_SETTINGS) {
  const [state, setState] = useState(() => createGame(initial));

  const play = useCallback((point: Point) => {
    setState((current) => playMove(current, point));
  }, []);

  const undo = useCallback(() => {
    setState((current) => undoMove(current));
  }, []);

  /** Starts a fresh game, keeping the current settings unless overridden. */
  const reset = useCallback((settings: Partial<GameSettings> = {}) => {
    setState((current) => createGame({ ...current.settings, ...settings }));
  }, []);

  return { state, play, undo, reset };
}
