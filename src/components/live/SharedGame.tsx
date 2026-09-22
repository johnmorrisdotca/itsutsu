"use client";

import { useState, useSyncExternalStore } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import {
  readTurned,
  subscribeTurned,
  turnedFor,
} from "@/components/board/turned";
import {
  cellAt,
  inMovePhase,
  pieceMoves,
} from "@/lib/gomoku/engine";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { PieceTray } from "@/components/game/PieceTray";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { BOT_SEAT_COPY, LIVE_PAUSED_COPY } from "./live.constants";
import { PlayedMoves } from "@/components/history/PlayedMoves";
import { useAdvanceToNextGame } from "./useAdvanceToNextGame";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { MatchClock } from "./MatchClock";
import { useMatchTalk } from "./useMatchTalk";
import { usePieceHand } from "@/components/game/usePieceHand";
import {
  GAME_STATUS,
  STONES,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { ReactionBubbles, ReactionLog } from "./Reactions";
import { ColourChooser, GoPassButton, RuleNotes, TurnBoardButton } from "./SharedGameControls";
import { SharedGameFooter } from "./SharedGameFooter";
import type { SharedGameProps } from "./sharedGame.types";
import { TurnBanner } from "./TurnBanner";
import { readQuiet, subscribeQuiet } from "./quiet";
import { settleFromRecord, settledSinceRendered } from "@/lib/history/settle";
import { useBotSeat } from "./useBotSeat";
import { useLiveGame } from "./useLiveGame";
import { useMatchAddress } from "./useMatchAddress";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { NextCheck } from "./NextCheck";
import { PendingMoveControls } from "./PendingMoveControls";
import { postTurn } from "./postTurn";
import { pendingMove, submitWords, type PendingMove } from "./pendingMove";
import { nudgedMove, nudgesAvailable, OPPOSITE, type NudgeDirection } from "./nudgeMove";
import { pointName } from "@/lib/gomoku/notation";
import type { BotTurn } from "@/lib/gomoku/opponent.types";
import { AFTER_MOVE, MOVE_CONFIRM } from "@/lib/preferences/turnFlow";
import { MOVE_KINDS } from "@/lib/gomoku/gomoku.constants";

/**
 * A game played from two devices.
 *
 * The server owns the rules — this only asks it to play a move and redraws
 * whatever comes back. Polling is deliberately plain: a board changes a few
 * times a minute at most, so a short poll costs less than the machinery a
 * socket would need, and it survives a phone locking and waking up.
 */
/** The site's own answers, for a reader whose account has not been asked. */
const DEFAULT_TURN_FLOW = { moveConfirm: MOVE_CONFIRM.preview, afterMove: AFTER_MOVE.nextWaiting } as const;

export function SharedGame({
  initial,
  token,
  seat,
  basePath,
  opponent = null,
  ignoring = [],
  offer = null,
  appearance = DEFAULT_APPEARANCE,
  turnFlow = DEFAULT_TURN_FLOW,
}: SharedGameProps) {
  const [error, setError] = useState<string | null>(null);
  // Mute this opponent's messages for this game only; remembered in this browser.
  const quiet = useSyncExternalStore(
    subscribeQuiet,
    () => readQuiet(initial.id),
    () => false,
  );
  /*
   * This board's own way up, when it has been given one. Unset means the
   * account's standing preference stands, so turning every board round in the
   * settings still turns the ones nobody has spoken about.
   */
  const override = useSyncExternalStore(
    subscribeTurned,
    () => readTurned(initial.id),
    () => null,
  );
  const { game: detail, mutate, paused, resume, pollEvery, asking, answeredAt } = useLiveGame(initial);
  const state = settleFromRecord(replayGame(detail), detail);
  /*
   * Three answers to which way up, in order of how particular they are: what
   * this person turned this game to, then what they prefer everywhere, then —
   * where they have said neither — their own side of the board, nearest them.
   */
  const turned = turnedFor(
    override,
    appearance.flipped ?? boardStartsFlipped(state.settings, seat),
  );
  const board: Appearance = { ...appearance, flipped: turned };


  const played = state.moves.length;
  // The address kept on the position, and the hand-back when the game ends
  // under the reader: one hook, because as two effects they fought.
  useMatchAddress({
    basePath,
    played,
    settled: settledSinceRendered(initial.status, detail.status),
  });
  /*
   * NOBODY'S TURN, AND NOTHING PLAYABLE, WHILE THIS IS AN OFFER.
   *
   * Both of these are folded in here rather than at each of the dozen places
   * they are read — the banner, the clock, the board's own `readOnly`, the
   * colour chooser, the piece tray, the pass button, the resign button — and
   * that is the reason to do it here: `POST /api/games/[id]/moves` refuses an
   * offered game outright, so anything left enabled would be a control that
   * fails rather than one that is not offered.
   *
   * A fork offer is what makes this more than tidiness: it carries moves
   * across, so the position has a real colour to move and `state.toPlay`
   * happily names it.
   */
  const yourTurn = offer === null && seat !== null && state.toPlay === seat;
  const playable = yourTurn && state.status === GAME_STATUS.playing;
  const [selected, setSelected] = useState<Point | null>(null);
  const { hand, rotate, flip, toggleSingle } = usePieceHand(state);
  const choosesColour = VARIANT_SPECS[state.settings.variant].anyColour;
  const [placing, setPlacing] = useState<Stone>(STONES.black);

  // A move played is a board finished with, so long as the turn actually ended
  // — and so long as nothing is being asked over the top of it.
  const { advance, notice, whileAsking } = useAdvanceToNextGame(turnFlow.afterMove);

  /*
   * THE MOVE PLACED BUT NOT SENT. A live game's record is final, so a misclick
   * on a phone used to be a permanent move in a rated game days old. The stone
   * is laid on the board — by the engine, so captures and endings show exactly
   * as they will — and nothing leaves this browser until Submit. See
   * `pendingMove.ts`, and `moveConfirm` for why preview is the default.
   */
  const [pending, setPending] = useState<PendingMove | null>(null);
  /*
   * THE PLACED STONE'S POINT, AND THE FOUR WAYS TO MOVE IT. On a phone a go
   * board's points are 17.6 pixels across and a finger is not, so the miss is
   * made cheap rather than the target made big — see `nudgeMove.ts`.
   *
   * THE ARROWS ARE TURNED WITH THE BOARD. A reader playing white sees the
   * board the other way up (`turned`), so the array's row+1 is UP the screen
   * for them: an arrow that moved the stone down the array while pointing up
   * would be a control lying about itself, on the one screen where a player
   * cannot check by eye. The flip is applied here, where the screen is known,
   * and `nudgeMove` stays a statement about the array.
   */
  const nudges = new Set(
    // Four directions at most, worked out from the engine's own answers — not
    // memoised, because asking is cheaper than the bookkeeping to avoid asking.
    [...nudgesAvailable(state, pending)].map((direction) => (turned ? OPPOSITE[direction] : direction)),
  );
  const nudge = (direction: NudgeDirection) => {
    if (pending === null) return;
    const moved = nudgedMove(state, pending, turned ? OPPOSITE[direction] : direction);
    if (moved !== null) setPending(moved);
  };
  const placedAt =
    pending !== null && pending.turn.kind === "place"
      ? pointName(state.settings.size, { row: pending.turn.row, col: pending.turn.col })
      : null;
  const previewing = turnFlow.moveConfirm === MOVE_CONFIRM.preview;

  /** Sends one move, of any of the three shapes, and takes the server's answer as the truth. */
  async function send(body: Record<string, unknown>) {
    if (token === null) return;
    setError(null);
    /*
     * `botReply` tells the server not to work the computer's answer out itself,
     * because this browser is about to. It is the whole of the saving — see the
     * moves route — and it is claimed only when a worker can actually be made,
     * so a browser that cannot think still gets its opponent's move back in the
     * response exactly as before. Claiming it and then failing to post would
     * leave the game waiting for a move nobody is working on.
     */
    const response = await fetch(`/api/games/${detail.id}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body, ...(bot.answering ? { botReply: true } : {}) }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "That move could not be played.");
      await mutate();
      return;
    }
    const after = (await response.json()) as GameDetail;
    await mutate(after, { revalidate: false });
    await advance(after, seat);
  }

  /**
   * A turn the player has chosen with a click on the board.
   *
   * Previewed or sent, and that is the only difference between the two
   * settings — the same turn, through the same `postTurn` mapping, either way.
   * A turn the engine refuses is not taken at all rather than previewed as a
   * board that did not change; see `pendingMove`.
   */
  async function chose(turn: BotTurn) {
    if (!previewing) {
      await postTurn(turn, send);
      return;
    }
    setPending(pendingMove(state, turn));
  }

  /** Sends the move that has been sitting on the board, and clears it either way. */
  async function submit() {
    if (pending === null) return;
    const turn = pending.turn;
    setPending(null);
    await postTurn(turn, send);
  }

  async function play(point: Point) {
    if (!playable) return;
    // A board with a move already on it is answered with Submit or Start over,
    // not with another click: the second stone would be the misclick this
    // whole thing exists to catch.
    if (pending !== null) return;
    // The piece games: the click is the corner of the piece in hand.
    if (hand.piece !== null && !hand.layingSingle) {
      const footprint = hand.footprintFor(point);
      if (footprint !== null) await chose({ kind: MOVE_KINDS.piece, cells: footprint });
      return;
    }
    // The sliding games: pick a piece up, then put it down.
    if (inMovePhase(state)) {
      const lands =
        selected !== null &&
        pieceMoves(state, selected).some(
          (to) => to.row === point.row && to.col === point.col,
        );
      if (lands && selected !== null) {
        const from = selected;
        setSelected(null);
        await chose({ kind: MOVE_KINDS.move, row: point.row, col: point.col, from });
        return;
      }
      if (cellAt(state, point) === state.toPlay) {
        setSelected(
          selected !== null &&
            selected.row === point.row &&
            selected.col === point.col
            ? null
            : point,
        );
      }
      return;
    }
    await chose(
      choosesColour
        ? { kind: MOVE_KINDS.place, row: point.row, col: point.col, stone: placing }
        : { kind: MOVE_KINDS.place, row: point.row, col: point.col },
    );
  }

  /*
   * The computer opposite answers in THIS browser rather than on a paid
   * function. It posts through `send` like any click, with this player's own
   * token, and the server re-checks it — see `appendMove`, which is the door
   * and explains what it grants. `playBotTurns` is still there on the server
   * for the tab that gets closed mid-think.
   */
  const bot = useBotSeat({
    state,
    seats: { blackMemberId: detail.blackMemberId, whiteMemberId: detail.whiteMemberId },
    mySeat: seat,
    send,
    enabled: token !== null && offer === null,
  });

  async function twist(quadrant: number, clockwise: boolean) {
    if (!playable) return;
    await send({ twist: { quadrant, clockwise } });
  }

  async function pass() {
    if (!playable) return;
    await send({ pass: true });
  }

  /** Sends an emoji to the other player. Refusals are quiet: it is only a wave. */
  const { shown, say: react } = useMatchTalk({
    detail,
    seat,
    token,
    ignoring,
    quiet,
    mutate,
  });

  /*
   * The board is marked as hydrated because a move played here now navigates,
   * and a click that lands before React has attached is dropped in silence —
   * the board looks like a board the whole time. A person always waits without
   * meaning to; a test has to be told to.
   *
   * Every intersection is server-rendered, which is what makes the window real
   * rather than theoretical: a stone placed in it is dropped on the floor and
   * the failure surfaces somewhere else entirely. Two branches reached for this
   * same marker independently, one from the navigation side and one from the
   * settle side, which is the argument for it being here rather than in either.
   */
  return (
    <div
      className="flex w-full flex-col gap-4"
      data-testid="shared-game"
      // The cadence this board asks at while awake, said for the spec that counts its asks.
      data-poll-every={pollEvery}
      {...readyMark(useHydrated())}
    >
      <TurnBanner
        state={state}
        seat={seat}
        yourTurn={yourTurn}
        // Posted for anyone and not yet answered: waiting, not playing.
        awaiting={detail.openSeat !== null && state.moves.length === 0}
        offer={offer}
        finished={state.status !== GAME_STATUS.playing}
        finishedAt={detail.status === "finished" ? detail.lastMoveAt : null}
      />
      {notice}

      {/* And while it IS asking, when the next check is due — so quiet and broken look different. */}
      <NextCheck asking={asking} answeredAt={answeredAt} every={pollEvery} />
      {/* A board that has stopped asking says so, rather than showing an old position as the current one. */}
      {paused ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted" data-testid="live-paused">
          <span>{LIVE_PAUSED_COPY.line}</span>
          <Button onClick={resume}>{LIVE_PAUSED_COPY.check}</Button>
        </p>
      ) : null}

      {error !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}>
          {error}
        </p>
      ) : null}

      {/*
        Said out loud, because it is now this browser doing the thinking and a
        move may take a couple of seconds. A board that simply sits there is
        indistinguishable from one that has stopped working, and the player has
        no other way to tell — the computer used to answer inside the request
        that carried their own stone, so there was never a gap to explain.
      */}
      {bot.thinking ? (
        <p className="text-sm text-muted" data-testid="bot-thinking" role="status">
          {BOT_SEAT_COPY.thinking}
        </p>
      ) : null}

      <MatchClock
        detail={detail}
        state={state}
        seat={seat}
        yourTurn={yourTurn}
        token={token}
        onError={setError}
        mutate={mutate}
      />

      <RuleNotes state={state} />

      <ReactionBubbles reactions={shown} yourStone={seat} />

      <TurnBoardButton gameId={detail.id} turned={turned} />

      <Board
        state={pending?.after ?? state}
        appearance={board}
        readOnly={!playable || pending !== null}
        onPlay={play}
        onTwist={twist}
        selected={selected}
        footprintFor={hand.piece !== null ? hand.footprintFor : undefined}
        placing={choosesColour ? placing : null}
      />

      {choosesColour && playable ? <ColourChooser placing={placing} onChoose={setPlacing} /> : null}

      {hand.piece !== null && seat !== null ? (
        <PieceTray
          hand={hand}
          disabled={!playable}
          onRotate={rotate}
          onFlip={flip}
          onToggleSingle={toggleSingle}
          onPass={pass}
        />
      ) : null}

      {/*
        The move placed and not yet sent, with the two things left to do about
        it. Directly under the board, because the stone it is about is on the
        board and a control for it belongs where the eye already is.
      */}
      {pending !== null ? (
        <PendingMoveControls
          onSubmit={() => void submit()}
          onStartOver={() => setPending(null)}
          onNudge={nudge}
          nudges={nudges}
          placedAt={placedAt}
          sending={false}
          where={submitWords(turnFlow.afterMove, state.settings.variant)}
        />
      ) : null}

      {VARIANT_SPECS[state.settings.variant].go && seat !== null ? (
        <GoPassButton disabled={!playable} onPass={pass} />
      ) : null}

      {/*
        What has been played, in a game that is still being played.
        
        No scrubber here — this board is live and shows the position as it
        stands — so the list is a record rather than a way to move about. It
        was missing entirely: a match showed a board and a move count, and
        John asked twice where the moves had gone.
      */}
      <div className="flex flex-col gap-2">
        <SectionTitle kanji="棋譜">Moves</SectionTitle>
        <PlayedMoves
          size={detail.size}
          moves={detail.moves}
          emptyNote="Nothing played yet."
          testId="live-moves"
        />
      </div>

      {/* Resigning, a wave across the board, muting, and who is opposite — see `SharedGameFooter`. */}
      <SharedGameFooter
        detail={detail}
        state={state}
        seat={seat}
        token={token}
        offer={offer}
        ignoring={ignoring}
        quiet={quiet}
        gameId={initial.id}
        opponent={opponent}
        onReact={react}
        onAsking={whileAsking}
        mutate={mutate}
      />
      <ReactionLog reactions={shown} />
    </div>
  );
}
