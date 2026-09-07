"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { assess, isSwapBlocked, newlyLost, suggestMove } from "@/lib/gomoku/analysis";
import {
  canSkip as engineCanSkip,
  canSwapSeats,
  createGame,
  otherStone,
  playMove,
  seatToPlay,
  skipMove,
  swapSeats,
} from "@/lib/gomoku/engine";
import { SEATS } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, GameState, Point, Seat } from "@/lib/gomoku/gomoku.types";
import type { Suggestion } from "@/lib/gomoku/analysis.types";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance, BoardMark } from "@/components/board/board.types";
import {
  AWARENESS_LEVELS,
  DEFAULT_SEAT_NAMES,
  DEFAULT_SESSION_SETTINGS,
  GAME_COPY,
  HINT_POLICIES,
} from "./game.constants";
import {
  clearSnapshot,
  loadSnapshot,
  restoreTimeline,
  saveSnapshot,
  toSnapshot,
} from "./gameStorage";
import type {
  FatalMove,
  GameActions,
  GameSession,
  SeatNames,
  SessionSettings,
} from "./game.types";

/**
 * One game and everything around it.
 *
 * The rules live in the engine; this hook keeps the timeline. Undo, redo and
 * jumping to a move are all one mechanism — an array of past states and an
 * index into it — which is why a swap or a skipped turn can be taken back the
 * same way an ordinary stone can.
 */
export function useGameSession(
  initial: Partial<GameSettings> = {},
  { persist = false }: { persist?: boolean } = {},
) {
  /*
   * Restored in the initialiser rather than an effect. The component that
   * calls this is mounted client-side only, so there is no server render for a
   * restored game to disagree with, and no flash of an empty board.
   */
  const restored = persist ? loadSnapshot() : null;

  const [timeline, setTimeline] = useState(() =>
    restored !== null ? restoreTimeline(restored) : [createGame(initial, Math.random())],
  );
  const [index, setIndex] = useState(() =>
    restored !== null ? restored.moves.length : 0,
  );
  const [fatalAt, setFatalAt] = useState<(FatalMove | null)[]>(() =>
    restored !== null ? restored.moves.map(() => null).concat([null]) : [null],
  );

  const [appearance, setAppearanceState] = useState<Appearance>(
    restored?.appearance ?? DEFAULT_APPEARANCE,
  );
  const [settings, setSettingsState] = useState<SessionSettings>(
    restored?.session ?? DEFAULT_SESSION_SETTINGS,
  );
  const [names, setNames] = useState<SeatNames>(
    restored?.names ?? { ...DEFAULT_SEAT_NAMES },
  );

  const [hintsLeft, setHintsLeft] = useState<Record<Seat, number>>(
    restored?.hintsLeft ?? {
      one: DEFAULT_SESSION_SETTINGS.hintsPerSeat,
      two: DEFAULT_SESSION_SETTINGS.hintsPerSeat,
    },
  );
  const [hint, setHint] = useState<Suggestion | null>(null);
  const [helpRequest, setHelpRequest] = useState<Seat | null>(null);
  const [helpMark, setHelpMark] = useState<Point | null>(null);

  const state = timeline[index];
  const assessment = useMemo(() => assess(state), [state]);

  /*
   * Written on every change so a refresh, a closed tab or a crashed browser
   * all resume the same game. Writing to an external store is exactly what an
   * effect is for.
   */
  useEffect(() => {
    if (!persist) return;
    saveSnapshot(toSnapshot(state, appearance, settings, names, hintsLeft));
  }, [appearance, hintsLeft, names, persist, settings, state]);

  /** Advancing the timeline truncates any redo branch, as an edit should. */
  const advance = useCallback(
    (next: typeof state, fatal: FatalMove | null) => {
      setTimeline((current) => [...current.slice(0, index + 1), next]);
      setFatalAt((current) => [...current.slice(0, index + 1), fatal]);
      setIndex(index + 1);
      setHint(null);
      setHelpMark(null);
      setHelpRequest(null);
    },
    [index],
  );

  const commit = useCallback(
    (next: typeof state) => {
      if (next === state) return;
      advance(next, findFatalMove(assessment, assess(next), next));
    },
    [advance, assessment, state],
  );

  const play = useCallback(
    (point: Point) => {
      // While advice has been asked for, a click marks the board instead.
      if (helpRequest !== null) {
        setHelpMark(point);
        setHelpRequest(null);
        return;
      }
      commit(playMove(state, point));
    },
    [commit, helpRequest, state],
  );

  const skip = useCallback(() => {
    commit(skipMove(state, Math.random()));
  }, [commit, state]);

  /** A swap moves the timeline on without a stone, so it undoes like a move. */
  const swap = useCallback(() => {
    if (isSwapBlocked(assessment)) return;
    const next = swapSeats(state);
    if (next !== state) advance(next, null);
  }, [advance, assessment, state]);

  const undo = useCallback(() => {
    if (index > 0 && state.settings.allowUndo) setIndex(index - 1);
  }, [index, state.settings.allowUndo]);

  const redo = useCallback(() => {
    if (index < timeline.length - 1) setIndex(index + 1);
  }, [index, timeline.length]);

  const jumpTo = useCallback(
    (target: number) => {
      if (target >= 0 && target < timeline.length) setIndex(target);
    },
    [timeline.length],
  );

  const reset = useCallback((next: Partial<GameSettings> = {}) => {
    if (persist) clearSnapshot();
    setTimeline((current) => [
      createGame({ ...current[0].settings, ...next }, Math.random()),
    ]);
    setFatalAt([null]);
    setIndex(0);
    setHint(null);
    setHelpMark(null);
    setHelpRequest(null);
    setHintsLeft({
      one: DEFAULT_SESSION_SETTINGS.hintsPerSeat,
      two: DEFAULT_SESSION_SETTINGS.hintsPerSeat,
    });
  }, [persist]);

  const seat = seatToPlay(state);

  const askHint = useCallback(() => {
    if (settings.hintPolicy === HINT_POLICIES.off) return;
    if (settings.hintPolicy === HINT_POLICIES.limited) {
      if (hintsLeft[seat] <= 0) return;
      setHintsLeft((current) => ({ ...current, [seat]: current[seat] - 1 }));
    }
    setHint(suggestMove(state));
  }, [hintsLeft, seat, settings.hintPolicy, state]);

  /** Hands one of your own hints to the other seat. */
  const grantHint = useCallback(() => {
    if (settings.hintPolicy !== HINT_POLICIES.limited) return;
    if (hintsLeft[seat] <= 0) return;
    const other = seat === SEATS.one ? SEATS.two : SEATS.one;
    setHintsLeft((current) => ({
      ...current,
      [seat]: current[seat] - 1,
      [other]: current[other] + 1,
    }));
  }, [hintsLeft, seat, settings.hintPolicy]);

  const requestHelp = useCallback(() => setHelpRequest(seat), [seat]);
  const cancelHelp = useCallback(() => setHelpRequest(null), []);

  const setAppearance = useCallback((next: Partial<Appearance>) => {
    setAppearanceState((current) => ({ ...current, ...next }));
  }, []);

  const setSessionSettings = useCallback((next: Partial<SessionSettings>) => {
    setSettingsState((current) => {
      const merged = { ...current, ...next };
      if (next.hintsPerSeat !== undefined) {
        setHintsLeft({ one: next.hintsPerSeat, two: next.hintsPerSeat });
      }
      return merged;
    });
  }, []);

  const setName = useCallback((target: Seat, name: string) => {
    setNames((current) => ({ ...current, [target]: name }));
  }, []);

  const marks = useMemo(
    () => buildMarks(assessment, settings, hint, helpMark),
    [assessment, helpMark, hint, settings],
  );

  const fatalMoves = useMemo(
    () => fatalAt.slice(0, index + 1).filter((entry): entry is FatalMove => entry !== null),
    [fatalAt, index],
  );

  const swapBlockedReason = useMemo(() => {
    if (!state.settings.allowSwap) return null;
    if (isSwapBlocked(assessment)) return GAME_COPY.swapUnavailableDecided;
    if (!canSwapSeats(state) && state.moves.length > 0) {
      return GAME_COPY.swapUnavailableSpent;
    }
    return null;
  }, [assessment, state]);

  const session: GameSession = {
    state,
    appearance,
    settings,
    names,
    assessment,
    marks,
    hint,
    hintsLeft,
    fatalMoves,
    helpRequest,
    canUndo: index > 0 && state.settings.allowUndo,
    canRedo: index < timeline.length - 1,
    canSkip: engineCanSkip(state),
    canSwap: canSwapSeats(state) && !isSwapBlocked(assessment),
    swapBlockedReason,
    moveIndex: index,
    moveTotal: timeline.length - 1,
  };

  const actions: GameActions = {
    play,
    undo,
    redo,
    jumpTo,
    reset,
    skip,
    swap,
    askHint,
    grantHint,
    requestHelp,
    cancelHelp,
    setAppearance,
    setSessionSettings,
    setName,
  };

  return { session, actions };
}

/**
 * Attributes a newly decided game to the move that threw it away.
 *
 * The move that makes a win unstoppable belongs to the winner, so the mistake
 * is the loser's most recent stone — the one that failed to answer.
 */
function findFatalMove(
  before: ReturnType<typeof assess>,
  after: ReturnType<typeof assess>,
  next: GameState,
): FatalMove | null {
  const loser = newlyLost(before, after);
  if (loser === null) return null;

  for (let index = next.moves.length - 1; index >= 0; index -= 1) {
    if (next.moves[index].stone === loser) {
      return { moveNumber: index + 1, stone: loser };
    }
  }
  return null;
}

/**
 * Turns the reading of the position into things to draw. Forced points appear
 * only at the highest awareness level; a hint and a piece of advice always
 * appear, because they were explicitly asked for.
 */
function buildMarks(
  assessment: ReturnType<typeof assess>,
  settings: SessionSettings,
  hint: Suggestion | null,
  helpMark: Point | null,
): BoardMark[] {
  const marks: BoardMark[] = [];

  if (settings.awareness === AWARENESS_LEVELS.full) {
    for (const point of assessment.forcedPoints) {
      marks.push({ ...point, kind: "forced" });
    }
  }
  if (helpMark !== null) marks.push({ ...helpMark, kind: "help" });
  if (hint !== null) marks.push({ ...hint.point, kind: "hint" });

  return marks;
}

/** The colour a seat is holding right now, for labelling the controls. */
export function stoneForSeat(session: GameSession, seat: Seat) {
  return session.state.seats.black === seat
    ? "black"
    : session.state.seats.white === seat
      ? "white"
      : otherStone(session.state.toPlay);
}
