"use client";

import { useCallback, useState } from "react";

import { createGame } from "@/lib/gomoku/engine";
import type { GameSettings, GameState } from "@/lib/gomoku/gomoku.types";
import type { FatalMove } from "./game.types";
import { restoreTimeline, type GameSnapshot } from "./gameStorage";

/**
 * The history of a game, as an array of states and an index into it.
 *
 * Undo, redo and jumping to a move in the record are all one mechanism, which
 * is why taking back a swap or a skipped turn works the same way as taking
 * back a stone: none of them are special, they are just earlier entries.
 */
export function useGameTimeline(
  initial: Partial<GameSettings>,
  restored: GameSnapshot | null,
) {
  const [timeline, setTimeline] = useState(() =>
    restored !== null
      ? restoreTimeline(restored)
      : [createGame(initial, Math.random())],
  );
  const [index, setIndex] = useState(() =>
    restored !== null ? restored.moves.length : 0,
  );
  const [fatalAt, setFatalAt] = useState<(FatalMove | null)[]>(() =>
    restored !== null ? restored.moves.map(() => null).concat([null]) : [null],
  );

  const state = timeline[index];
  const atLatest = index === timeline.length - 1;
  const reviewing = !atLatest;

  /** Advancing truncates any redo branch, as an edit to the past should. */
  const advance = useCallback(
    (next: GameState, fatal: FatalMove | null) => {
      setTimeline((current) => [...current.slice(0, index + 1), next]);
      setFatalAt((current) => [...current.slice(0, index + 1), fatal]);
      setIndex(index + 1);
    },
    [index],
  );

  const jumpTo = useCallback(
    (target: number) => {
      if (target >= 0 && target < timeline.length) setIndex(target);
    },
    [timeline.length],
  );

  const returnToLatest = useCallback(
    () => setIndex(timeline.length - 1),
    [timeline.length],
  );

  const undo = useCallback(() => {
    if (index > 0 && state.settings.allowUndo) setIndex(index - 1);
  }, [index, state.settings.allowUndo]);

  const redo = useCallback(() => {
    if (index < timeline.length - 1) setIndex(index + 1);
  }, [index, timeline.length]);

  const restart = useCallback((settings: GameSettings) => {
    setTimeline([createGame(settings, Math.random())]);
    setFatalAt([null]);
    setIndex(0);
  }, []);

  /**
   * Replaces the newest state without adding to the record — for a change that
   * happens *to* the game rather than in it, such as a clock running out.
   */
  const replaceLatest = useCallback((change: (latest: GameState) => GameState) => {
    setTimeline((current) => {
      const latest = current[current.length - 1];
      const next = change(latest);
      return next === latest ? current : [...current.slice(0, -1), next];
    });
  }, []);

  const fatalMoves = fatalAt
    .slice(0, index + 1)
    .filter((entry): entry is FatalMove => entry !== null);

  return {
    timeline,
    index,
    state,
    atLatest,
    reviewing,
    fatalMoves,
    advance,
    jumpTo,
    returnToLatest,
    undo,
    redo,
    restart,
    replaceLatest,
  };
}

