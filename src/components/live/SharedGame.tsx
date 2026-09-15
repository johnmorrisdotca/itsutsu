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
import { SectionTitle } from "@/components/ui/Controls";
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
import { useLiveGame } from "./useLiveGame";
import { useMatchAddress } from "./useMatchAddress";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { TONE_CLASS } from "@/components/ui/ui.constants";

/**
 * A game played from two devices.
 *
 * The server owns the rules — this only asks it to play a move and redraws
 * whatever comes back. Polling is deliberately plain: a board changes a few
 * times a minute at most, so a short poll costs less than the machinery a
 * socket would need, and it survives a phone locking and waking up.
 */
export function SharedGame({
  initial,
  token,
  seat,
  basePath,
  opponent = null,
  ignoring = [],
  offer = null,
  appearance = DEFAULT_APPEARANCE,
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
  const { game: detail, mutate } = useLiveGame(initial);
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
  const { advance, notice, whileAsking } = useAdvanceToNextGame();

  /** Sends one move, of any of the three shapes, and takes the server's answer as the truth. */
  async function send(body: Record<string, unknown>) {
    if (token === null) return;
    setError(null);
    const response = await fetch(`/api/games/${detail.id}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
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

  async function play(point: Point) {
    if (!playable) return;
    // The piece games: the click is the corner of the piece in hand.
    if (hand.piece !== null && !hand.layingSingle) {
      const footprint = hand.footprintFor(point);
      if (footprint !== null) await send({ cells: footprint });
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
        await send({ row: point.row, col: point.col, from });
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
    await send(
      choosesColour
        ? { row: point.row, col: point.col, stone: placing }
        : { row: point.row, col: point.col },
    );
  }

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

      {error !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}>
          {error}
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
        state={state}
        appearance={board}
        readOnly={!playable}
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
