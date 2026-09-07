"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { assess, isSwapBlocked, suggestMove } from "@/lib/gomoku/analysis";
import { winChance } from "@/lib/gomoku/winChance";
import {
  canSkip as engineCanSkip,
  canSwapSeats,
  chooseColour as engineChooseColour,
  createGame,
  extendOpening as engineExtendOpening,
  isLegalMove,
  playMove,
  seatToPlay,
  skipMove,
  swapSeats,
  winOnTime,
} from "@/lib/gomoku/engine";
import {
  GAME_STATUS,
  SEATS,
  STONES,
  VARIANT_SPECS,
  WIN_LENGTH,
} from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, Point, Seat, Stone } from "@/lib/gomoku/gomoku.types";
import type { Suggestion } from "@/lib/gomoku/analysis.types";
import type { Appearance } from "@/components/board/board.types";
import {
  DEFAULT_SEAT_NAMES,
  DEFAULT_SESSION_SETTINGS,
  GAME_COPY,
  HINT_POLICIES,
  HISTORY_MODES,
} from "./game.constants";
import { useGameClock } from "./useGameClock";
import { buildMarks, findFatalMove } from "./sessionSupport";
import { emptyStats, missedThreat, recordHint, recordMove } from "./stats";
import {
  restoredAppearance,
  restoredHints,
  restoredSettings,
  restoredStats,
  timeControlFor,
} from "./restoreSession";
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

  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    restoredAppearance(restored),
  );
  const [settings, setSettingsState] = useState<SessionSettings>(() =>
    restoredSettings(restored),
  );
  const [names, setNames] = useState<SeatNames>(
    restored?.names ?? { ...DEFAULT_SEAT_NAMES },
  );

  const [hintsLeft, setHintsLeft] = useState<Record<Seat, number>>(() =>
    restoredHints(restored, DEFAULT_SESSION_SETTINGS.hintsPerSeat),
  );
  const [hint, setHint] = useState<Suggestion | null>(null);
  const [stats, setStats] = useState(() => restoredStats(restored));
  const [lostOnTime, setLostOnTime] = useState<Seat | null>(null);
  // Set on mount rather than during render, which must stay pure.
  const lastMoveAt = useRef(0);
  useEffect(() => {
    if (lastMoveAt.current === 0) lastMoveAt.current = Date.now();
  }, []);
  const [helpRequest, setHelpRequest] = useState<Seat | null>(null);
  const [pendingBranch, setPendingBranch] = useState<Point | null>(null);
  const [helpMark, setHelpMark] = useState<Point | null>(null);

  const state = timeline[index];
  const assessment = useMemo(() => assess(state), [state]);

  const control = timeControlFor(settings.timeControl);
  const atLatest = index === timeline.length - 1;

  /** A flag falling ends the game properly, through the engine. */
  const handleFlag = useCallback((seat: Seat) => {
    setLostOnTime(seat);
    setTimeline((current) => {
      const latest = current[current.length - 1];
      const loser =
        latest.seats[STONES.black] === seat ? STONES.black : STONES.white;
      const ended = winOnTime(latest, loser);
      if (ended === latest) return current;
      return [...current.slice(0, -1), ended];
    });
  }, []);

  const clock = useGameClock({
    control,
    seatToPlay: seatToPlay(state),
    // A clock stops while the game is over or the record is being reviewed.
    running: state.status === GAME_STATUS.playing && atLatest,
    onFlag: handleFlag,
  });

  /*
   * Written on every change so a refresh, a closed tab or a crashed browser
   * all resume the same game. Writing to an external store is exactly what an
   * effect is for.
   */
  useEffect(() => {
    if (!persist) return;
    saveSnapshot(toSnapshot(state, appearance, settings, names, hintsLeft, stats));
  }, [appearance, hintsLeft, names, persist, settings, state, stats]);

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

      const played = next.moves[next.moves.length - 1];
      const seat = seatToPlay(state);
      const fatal = findFatalMove(assessment, assess(next), next);

      const now = Date.now();
      const thinkingMs = lastMoveAt.current === 0 ? 0 : now - lastMoveAt.current;
      lastMoveAt.current = now;

      if (played !== undefined) {
        setStats((current) =>
          recordMove(current, seat, {
            thinkingMs,
            missed: missedThreat(assessment.forcedPoints, played),
            blunder: fatal !== null && fatal.stone === played.stone,
          }),
        );
      }
      // A stone that leaves the same seat to move, as in connect6, is not a completed turn.
      if (seatToPlay(next) !== seat || next.status !== GAME_STATUS.playing) {
        clock.onMoveComplete(seat);
      }
      advance(next, fatal);
    },
    [advance, assessment, clock, state],
  );

  const reviewing = index < timeline.length - 1;

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
        if (settings.historyMode !== HISTORY_MODES.branch) return;
        if (!isLegalMove(state, point)) return;
        setPendingBranch(point);
        return;
      }
      commit(playMove(state, point));
    },
    [commit, helpRequest, reviewing, settings.historyMode, state],
  );

  const confirmBranch = useCallback(() => {
    if (pendingBranch === null) return;
    setPendingBranch(null);
    commit(playMove(state, pendingBranch));
  }, [commit, pendingBranch, state]);

  const cancelBranch = useCallback(() => setPendingBranch(null), []);

  const skip = useCallback(() => {
    commit(skipMove(state, Math.random()));
  }, [commit, state]);

  /** A swap moves the timeline on without a stone, so it undoes like a move. */
  const swap = useCallback(() => {
    if (isSwapBlocked(assessment)) return;
    const next = swapSeats(state);
    if (next !== state) advance(next, null);
  }, [advance, assessment, state]);

  /** Opening decisions are timeline entries too, so they can be taken back. */
  const chooseColour = useCallback(
    (stone: Stone) => {
      if (reviewing) return;
      const next = engineChooseColour(state, stone);
      if (next !== state) advance(next, null);
    },
    [advance, reviewing, state],
  );

  const extendOpening = useCallback(() => {
    if (reviewing) return;
    const next = engineExtendOpening(state);
    if (next !== state) advance(next, null);
  }, [advance, reviewing, state]);

  const undo = useCallback(() => {
    if (index > 0 && state.settings.allowUndo) setIndex(index - 1);
  }, [index, state.settings.allowUndo]);

  const redo = useCallback(() => {
    if (index < timeline.length - 1) setIndex(index + 1);
  }, [index, timeline.length]);

  const jumpTo = useCallback(
    (target: number) => {
      if (target < 0 || target >= timeline.length) return;
      // Moving elsewhere abandons a branch that was waiting to be confirmed.
      setPendingBranch(null);
      setIndex(target);
    },
    [timeline.length],
  );

  const returnToLatest = useCallback(() => {
    setPendingBranch(null);
    setIndex(timeline.length - 1);
  }, [timeline.length]);

  const reset = useCallback((next: Partial<GameSettings> = {}) => {
    if (persist) clearSnapshot();
    setTimeline((current) => {
      const settings = { ...current[0].settings, ...next };
      // A new variant brings its own line length unless one was asked for.
      if (next.variant !== undefined && next.winLength === undefined) {
        settings.winLength = VARIANT_SPECS[next.variant].winLength ?? WIN_LENGTH;
      }
      return [createGame(settings, Math.random())];
    });
    setFatalAt([null]);
    setIndex(0);
    setHint(null);
    setHelpMark(null);
    setHelpRequest(null);
    setPendingBranch(null);
    setHintsLeft({
      one: settings.hintsPerSeat,
      two: settings.hintsPerSeat,
    });
    setStats(emptyStats());
    setLostOnTime(null);
    lastMoveAt.current = Date.now();
    clock.reset(timeControlFor(settings.timeControl));
  }, [clock, persist, settings.hintsPerSeat, settings.timeControl]);

  const seat = seatToPlay(state);

  const askHint = useCallback(() => {
    if (settings.hintPolicy === HINT_POLICIES.off) return;
    if (settings.hintPolicy === HINT_POLICIES.limited) {
      if (hintsLeft[seat] <= 0) return;
      setHintsLeft((current) => ({ ...current, [seat]: current[seat] - 1 }));
    }
    setStats((current) => recordHint(current, seat));
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

  const setSessionSettings = useCallback(
    (next: Partial<SessionSettings>) => {
      /*
       * Side effects run beside the state update, not inside the updater —
       * React may call an updater more than once, and resetting a clock twice
       * is not the same as resetting it once.
       */
      if (next.hintsPerSeat !== undefined) {
        setHintsLeft({ one: next.hintsPerSeat, two: next.hintsPerSeat });
      }
      /*
       * A new time control means new clocks. Without this the clocks kept
       * whatever state the old control left them in — and "no clock" leaves
       * them with no time at all, so every game started out already flagged.
       */
      if (next.timeControl !== undefined) {
        clock.reset(timeControlFor(next.timeControl));
      }
      setSettingsState((current) => ({ ...current, ...next }));
    },
    [clock],
  );

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
    clocks: clock.clocks,
    lostOnTime,
    stats,
    winChance: winChance(state, assessment),
    canUndo: index > 0 && state.settings.allowUndo,
    canRedo: index < timeline.length - 1,
    canSkip: engineCanSkip(state),
    canSwap: canSwapSeats(state) && !isSwapBlocked(assessment),
    swapBlockedReason,
    moveIndex: index,
    moveTotal: timeline.length - 1,
    reviewing,
    boardReadOnly:
      reviewing && settings.historyMode !== HISTORY_MODES.branch,
    pendingBranch,
    branchDiscards: timeline.length - 1 - index,
  };

  const actions: GameActions = {
    play,
    undo,
    redo,
    jumpTo,
    returnToLatest,
    confirmBranch,
    cancelBranch,
    reset,
    skip,
    swap,
    chooseColour,
    extendOpening,
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
