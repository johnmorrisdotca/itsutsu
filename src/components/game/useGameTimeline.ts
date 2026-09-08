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
  /** The move to open at, when an address names one; the latest otherwise. */
  startAt?: number,
) {
  const [timeline, setTimeline] = useState(() =>
    restored !== null
      ? restoreTimeline(restored)
      : [createGame(initial, Math.random())],
  );
  const [index, setIndex] = useState(() => {
    const latest = timeline.length - 1;
    return startAt !== undefined && startAt >= 0 && startAt < latest ? startAt : latest;
  });
  const [fatalAt, setFatalAt] = useState<(FatalMove | null)[]>(() =>
    restored !== null ? restored.moves.map(() => null).concat([null]) : [null],
  );

  /*
   * How the position on show was reached. A move taken back with Undo may be
   * played over — that is what taking it back is for — while a position
   * reached by clicking the record is being read, and is protected.
   */
  const [undone, setUndone] = useState(false);

  const state = timeline[index];
  const atLatest = index === timeline.length - 1;
  const reviewing = !atLatest && !undone;

  /** Advancing truncates any redo branch, as an edit to the past should. */
  const advance = useCallback(
    (next: GameState, fatal: FatalMove | null) => {
      setTimeline((current) => [...current.slice(0, index + 1), next]);
      setFatalAt((current) => [...current.slice(0, index + 1), fatal]);
      setIndex(index + 1);
      setUndone(false);
    },
    [index],
  );

  const jumpTo = useCallback(
    (target: number) => {
      if (target >= 0 && target < timeline.length) {
        setIndex(target);
        setUndone(false);
      }
    },
    [timeline.length],
  );

  const returnToLatest = useCallback(() => {
    setIndex(timeline.length - 1);
    setUndone(false);
  }, [timeline.length]);

  const undo = useCallback(() => {
    if (index > 0 && state.settings.allowUndo) {
      setIndex(index - 1);
      setUndone(true);
    }
  }, [index, state.settings.allowUndo]);

  const redo = useCallback(() => {
    if (index < timeline.length - 1) {
      setIndex(index + 1);
      // Back at the latest, nothing is taken back any more.
      if (index + 1 === timeline.length - 1) setUndone(false);
    }
  }, [index, timeline.length]);

  const restart = useCallback((settings: GameSettings) => {
    setTimeline([createGame(settings, Math.random())]);
    setFatalAt([null]);
    setIndex(0);
    setUndone(false);
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

