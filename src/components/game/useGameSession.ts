"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { assess, isSwapBlocked } from "@/lib/gomoku/analysis";
import { readAdvantage } from "@/lib/gomoku/advantage";
import { canPass as engineCanPass, canGrowBoard, canShrinkBoard, canSwapSeats, growBoard, shrinkBoard, chooseColour as engineChooseColour, extendOpening as engineExtendOpening, cellAt, inMovePhase, isLegalMove, movePiece, passTurn, pieceMoves, placePiece, playMove, seatToPlay, twistBoard, swapSeats, winOnTime } from "@/lib/gomoku/engine";
import { canSkip as engineCanSkip, skipMove } from "@/lib/gomoku/rules/record";
import {
  GAME_STATUS,
  MOVE_KINDS,
  STONES,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, Point, Seat, Stone } from "@/lib/gomoku/gomoku.types";
import type { Appearance } from "@/components/board/board.types";
import {
  DEFAULT_SEAT_NAMES,
  DEFAULT_SESSION_SETTINGS,
  GAME_COPY,
  HISTORY_MODES,
} from "./game.constants";
import { useGameClock } from "./useGameClock";
import { usePieceHand } from "./usePieceHand";
import { buildMarks, findFatalMove, nextGameSettings, resizeTarget } from "./sessionSupport";
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
import { clearSnapshot, saveSnapshot, toSnapshot } from "./gameStorage";
import type {
  GameActions,
  MatchStart,
  ResizeDirection,
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
   */
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    restoredAppearance(restored, accountAppearance),
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
  const [pendingBranch, setPendingBranch] = useState<Point | null>(null);
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

  const [selected, setSelected] = useState<Point | null>(null);
  const { hand, rotate: rotatePiece, flip: flipPiece, toggleSingle } = usePieceHand(state);
  // The choose-a-colour games: which colour the next stone will be. Black to begin with.
  const choosesColour = VARIANT_SPECS[state.settings.variant].anyColour;
  const [placingChoice, setPlacingChoice] = useState<Stone>(STONES.black);
  const placing = choosesColour ? placingChoice : null;
  const setPlacing = useCallback((stone: Stone) => setPlacingChoice(stone), []);

  const commit = useCallback(
    (next: typeof state) => {
      if (next === state) return;

      // A twist finishes the move already recorded; only a new entry is a new stone.
      const played =
        next.moves.length > state.moves.length ? next.moves[next.moves.length - 1] : undefined;
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
    [commit, hand, helpRequest, placing, reviewing, selected, settings.historyMode, state],
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

  const reset = useCallback((next: Partial<GameSettings> = {}) => {
    if (persist) clearSnapshot();
    setSelected(null);

    const gameSettings = nextGameSettings(timeline[0].settings, next);
    line.restart(gameSettings);
    setHelpMark(null);
    setHelpRequest(null);
    setPendingBranch(null);
    setResizeProposal(null);
    resetHints(settings.hintsPerSeat);
    setStats(emptyStats());
    setLostOnTime(null);
    lastMoveAt.current = Date.now();
    clock.reset(timeControlFor(settings.timeControl));
  }, [clock, line, persist, resetHints, settings.hintsPerSeat, settings.timeControl, timeline]);

  const seat = seatToPlay(state);

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
    [state],
  );

  const acceptResize = useCallback(() => {
    if (resizeProposal === null) return;
    const next =
      resizeProposal.direction === "grow" ? growBoard(state) : shrinkBoard(state);
    setResizeProposal(null);
    if (next !== state) line.advance(next, null);
  }, [line, resizeProposal, state]);

  const declineResize = useCallback(() => setResizeProposal(null), []);

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
    selected,
    hand,
    placing,
    pendingBranch,
    branchDiscards: timeline.length - 1 - index,
  };

  const actions: GameActions = {
    play,
    undo: line.undo,
    redo: line.redo,
    jumpTo: line.jumpTo,
    returnToLatest: line.returnToLatest,
    confirmBranch,
    cancelBranch,
    reset,
    skip,
    swap,
    chooseColour,
    extendOpening,
    twist,
    setPlacing,
    rotatePiece,
    flipPiece,
    toggleSingle,
    pass,
    askHint,
    grantHint,
    requestHelp,
    cancelHelp,
    proposeResize,
    acceptResize,
    declineResize,
    setAppearance,
    setSessionSettings,
    setName,
  };

  return { session, actions };
}
