"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { assess, isSwapBlocked } from "@/lib/gomoku/analysis";
import { readAdvantage } from "@/lib/gomoku/advantage";
import { canPass as engineCanPass, canGrowBoard, canShrinkBoard, canSwapSeats, seatToPlay, winOnTime } from "@/lib/gomoku/engine";
import { canSkip as engineCanSkip } from "@/lib/gomoku/rules/record";
import { passesOwed } from "@/lib/gomoku/rules/forcedPass";
import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, Point, Seat } from "@/lib/gomoku/gomoku.types";
import type { Appearance } from "@/components/board/board.types";
import {
  DEFAULT_SEAT_NAMES,
  DEFAULT_SESSION_SETTINGS,
  GAME_COPY,
  HISTORY_MODES,
} from "./game.constants";
import { useBoardInput } from "./useBoardInput";
import { useGameClock } from "./useGameClock";
import { buildMarks, findFatalMove, nextGameSettings } from "./sessionSupport";
import { emptyStats, missedThreat, recordHint, recordMove } from "./stats";
import { useGameHints } from "./useGameHints";
import {
  restoredAppearance,
  restoredHints,
  restoredSettings,
  restoredStats,
  timeControlFor,
  restoredSnapshot,
} from "./restoreSession";
import { useGameTimeline } from "./useGameTimeline";
import { useTurnDecisions } from "./useTurnDecisions";
import { clearSnapshot, saveSnapshot, toSnapshot } from "./gameStorage";
import { unsavedAppearance } from "./unsavedAppearance";
import type {
  GameActions,
  MatchStart,
  ResizeProposal,
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
  {
    persist = false,
    paused = false,
    fresh = false,
    match = null,
    accountAppearance = null,
  }: {
    persist?: boolean;
    paused?: boolean;
    fresh?: boolean;
    match?: MatchStart | null;
    /** The board this member keeps on their account, when somebody is signed in. */
    accountAppearance?: Appearance | null;
  } = {},
) {
  /*
   * Restored in the initialiser rather than an effect. The component that
   * calls this is mounted client-side only, so there is no server render for a
   * restored game to disagree with, and no flash of an empty board.
   */
  // `fresh` asks for this game: a stored game of the same kind still resumes.
  const restored = restoredSnapshot(persist, fresh, initial.variant, match);

  const line = useGameTimeline(initial, restored, match?.at);
  const { state, index, timeline, atLatest, reviewing } = line;

  /*
   * The account's board first, then whatever this browser last had. A member
   * who changed the wood on their phone should find that wood here, which is
   * the whole point of keeping it on the account; and a change made here is
   * written back, so the two agree again immediately.
   *
   * EXCEPT a choice made here that the account has not yet confirmed. A reload
   * reaches the server before the save the old page sent on its way out, so the
   * account's copy can be one choice behind for a moment; this browser's
   * unconfirmed choice is the newer truth, and `useSavedAppearance` sends it
   * again. Signed in only — nobody else has an account to be behind.
   */
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    restoredAppearance(restored, accountAppearance === null ? null : (unsavedAppearance() ?? accountAppearance)),
  );
  const [settings, setSettingsState] = useState<SessionSettings>(() =>
    restoredSettings(restored),
  );
  const [names, setNames] = useState<SeatNames>(
    restored?.names ?? { ...DEFAULT_SEAT_NAMES },
  );

  const [stats, setStats] = useState(() => restoredStats(restored));
  const { hintsLeft, hint, askHint, grantHint, forgetHint, resetHints } = useGameHints({
    start: restoredHints(restored, DEFAULT_SESSION_SETTINGS.hintsPerSeat),
    policy: settings.hintPolicy,
    state,
    onTaken: useCallback((who: Seat) => setStats((current) => recordHint(current, who)), []),
  });
  const [lostOnTime, setLostOnTime] = useState<Seat | null>(null);
  // Set on mount rather than during render, which must stay pure.
  const lastMoveAt = useRef(0);
  useEffect(() => {
    if (lastMoveAt.current === 0) lastMoveAt.current = Date.now();
  }, []);
  const [helpRequest, setHelpRequest] = useState<Seat | null>(null);
  const [resizeProposal, setResizeProposal] = useState<ResizeProposal | null>(null);
  const [helpMark, setHelpMark] = useState<Point | null>(null);

  const assessment = useMemo(() => assess(state), [state]);

  const control = timeControlFor(settings.timeControl);

  /** A flag falling ends the game properly, through the engine. */
  const handleFlag = useCallback(
    (seat: Seat) => {
      setLostOnTime(seat);
      line.replaceLatest((latest) => {
        const loser =
          latest.seats[STONES.black] === seat ? STONES.black : STONES.white;
        return winOnTime(latest, loser);
      });
    },
    [line],
  );

  const clock = useGameClock({
    control,
    seatToPlay: seatToPlay(state),
    // A clock stops while the game is over, the record is being reviewed, or nobody is there.
    running: state.status === GAME_STATUS.playing && atLatest && !paused,
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

  const commit = useCallback(
    (move: typeof state) => {
      if (move === state) return;
      // Any pass the move leaves owed is taken here, as the server takes it: nobody clicks for a turn with nothing in it.
      const next = passesOwed(move);

      // A twist finishes the move already recorded; only a new entry is a new stone.
      const played =
        move.moves.length > state.moves.length ? move.moves[move.moves.length - 1] : undefined;
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
      // A move settles the question; a stale offer or answer must not outlive it.
      setResizeProposal(null);
      forgetHint();
      line.advance(next, fatal);
    },
    [line, assessment, clock, forgetHint, state],
  );


  /*
   * What a click on the board means, and what is in hand while it is decided —
   * see `useBoardInput`. Every move it makes is recorded through `commit`.
   */
  const input = useBoardInput({ state, commit, reviewing, historyMode: settings.historyMode, helpRequest, setHelpRequest, setHelpMark });
  const { clearInput } = input;

  // The turns that are not a stone — a skip, a swap, a colour, an opening, a resize: see `useTurnDecisions`.
  const decisions = useTurnDecisions({ state, line, assessment, reviewing, commit, resizeProposal, setResizeProposal });

  const reset = useCallback((next: Partial<GameSettings> = {}) => {
    if (persist) clearSnapshot();
    clearInput();

    const gameSettings = nextGameSettings(timeline[0].settings, next);
    line.restart(gameSettings);
    setHelpMark(null);
    setHelpRequest(null);
    setResizeProposal(null);
    resetHints(settings.hintsPerSeat);
    setStats(emptyStats());
    setLostOnTime(null);
    lastMoveAt.current = Date.now();
    clock.reset(timeControlFor(settings.timeControl));
  }, [clearInput, clock, line, persist, resetHints, settings.hintsPerSeat, settings.timeControl, timeline]);

  const seat = seatToPlay(state);

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
        resetHints(next.hintsPerSeat);
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
    [clock, resetHints],
  );

  const setName = useCallback((target: Seat, name: string) => {
    setNames((current) => ({ ...current, [target]: name }));
  }, []);

  const marks = useMemo(
    () => buildMarks(assessment, settings, hint, helpMark),
    [assessment, helpMark, hint, settings],
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
    fatalMoves: line.fatalMoves,
    helpRequest,
    resizeProposal,
    canProposeGrow: resizeProposal === null && canGrowBoard(state),
    canProposeShrink: resizeProposal === null && canShrinkBoard(state),
    clocks: clock.clocks,
    lostOnTime,
    stats,
    advantage: readAdvantage(state, assessment),
    canUndo: index > 0 && state.settings.allowUndo,
    canRedo: index < timeline.length - 1,
    canSkip: engineCanSkip(state),
    canPass: !reviewing && engineCanPass(state),
    canSwap: canSwapSeats(state) && !isSwapBlocked(assessment),
    swapBlockedReason,
    moveIndex: index,
    moveTotal: timeline.length - 1,
    record: timeline[timeline.length - 1].moves,
    reviewing,
    boardReadOnly:
      reviewing && settings.historyMode !== HISTORY_MODES.branch,
    selected: input.selected,
    hand: input.hand,
    placing: input.placing,
    pendingBranch: input.pendingBranch,
    branchDiscards: timeline.length - 1 - index,
  };

  const actions: GameActions = {
    play: input.play,
    undo: line.undo,
    redo: line.redo,
    jumpTo: line.jumpTo,
    returnToLatest: line.returnToLatest,
    confirmBranch: input.confirmBranch,
    cancelBranch: input.cancelBranch,
    reset,
    skip: decisions.skip,
    swap: decisions.swap,
    chooseColour: decisions.chooseColour,
    extendOpening: decisions.extendOpening,
    twist: input.twist,
    setPlacing: input.setPlacing,
    rotatePiece: input.rotatePiece,
    flipPiece: input.flipPiece,
    toggleSingle: input.toggleSingle,
    pass: input.pass,
    askHint,
    grantHint,
    requestHelp,
    cancelHelp,
    proposeResize: decisions.proposeResize,
    acceptResize: decisions.acceptResize,
    declineResize: decisions.declineResize,
    setAppearance,
    setSessionSettings,
    setName,
  };

  return { session, actions };
}
