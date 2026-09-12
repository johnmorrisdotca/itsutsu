"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import {
  readTurned,
  subscribeTurned,
  turnedFor,
  writeTurned,
} from "@/components/board/turned";
import {
  cellAt,
  inMovePhase,
  pieceMoves,
  rulesFor,
  otherStone,
} from "@/lib/gomoku/engine";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { PieceTray } from "@/components/game/PieceTray";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PlayedMoves } from "@/components/history/PlayedMoves";
import { shownName } from "@/lib/rating/shownName";
import { useAdvanceToNextGame } from "./useAdvanceToNextGame";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { MatchClock } from "./MatchClock";
import { useMatchTalk } from "./useMatchTalk";
import { usePieceHand } from "@/components/game/usePieceHand";
import {
  GAME_STATUS,
  STONES,
  STONE_DISPLAY,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { ResignButton } from "@/components/mine/ResignButton";
import { GAME_COPY } from "@/components/game/game.constants";
import { ReactionBar, ReactionBubbles, ReactionLog } from "./Reactions";
import { TurnBanner } from "./TurnBanner";
import { readQuiet, subscribeQuiet, writeQuiet } from "./quiet";
import { settleFromRecord } from "@/lib/history/settle";
import { useLiveGame } from "./useLiveGame";
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
  appearance = DEFAULT_APPEARANCE,
}: {
  initial: GameDetail;
  token: string | null;
  seat: Stone | null;
  /**
   * How this reader likes a board dressed, from their account. The shared
   * board used to draw the default and nothing else, so a member's own board
   * followed them into a local game and stopped at the door of a real one.
   */
  appearance?: Appearance;
  /** The match's address; the bar shows it with the move count appended, kept current as play goes on. */
  basePath?: string;
  /** Who sits across the board, and where they are, when the seat is an account with a country set. */
  opponent?: {
    name: string;
    country: string;
    awayUntil?: string | null;
  } | null;
  /**
   * Colours whose player this reader has ignored — for a watcher as much as
   * for a player, since the ignore list is about who may reach you and not
   * about which chair you are in.
   */
  ignoring?: readonly Stone[];
}) {
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
  useEffect(() => {
    if (basePath === undefined) return;
    const next = `${basePath}/${played}`;
    if (window.location.pathname !== next)
      window.history.replaceState(null, "", next);
  }, [basePath, played]);
  const yourTurn = seat !== null && state.toPlay === seat;
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

      {VARIANT_SPECS[state.settings.variant].captures ? (
        <p className="text-xs text-muted" data-testid="shared-captures">
          {GAME_COPY.captures.label} · {STONE_DISPLAY.black.label}{" "}
          {state.captures.black} · {STONE_DISPLAY.white.label}{" "}
          {state.captures.white} ·{" "}
          {GAME_COPY.capturesToWin(state.settings.capturesToWin)}
        </p>
      ) : null}
      {state.status === GAME_STATUS.playing &&
      rulesFor(state.settings, state.toPlay).forbidden.length > 0 ? (
        <p className="text-xs text-muted">
          {STONE_DISPLAY[state.toPlay].label} may not play the points marked ✕.
        </p>
      ) : null}

      <ReactionBubbles reactions={shown} yourStone={seat} />

      {/*
        This game's own way up. Above the board rather than buried in the
        settings, because it is answering a question the board is asking right
        now — you are looking at your camp from the wrong end — and it must be
        one press away from the position that prompted it.
      */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => writeTurned(detail.id, !turned)}
          className="rounded-full border border-rule bg-ivory/70 px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-ivory"
          aria-pressed={turned}
          title="Your own view of this board. The other player's board does not move."
          data-testid="turn-board"
        >
          {turned ? "Turn the board back" : "Turn the board round"}{" "}
          <span className="font-mincho">盤反転</span>
        </button>
      </div>

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

      {choosesColour && playable ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="colour-chooser"
        >
          <span className="text-xs text-muted">{GAME_COPY.placeAs}</span>
          {Object.values(STONES).map((stone) => (
            <Button
              key={stone}
              onClick={() => setPlacing(stone)}
              strong={placing === stone}
            >
              {STONE_DISPLAY[stone].label}
            </Button>
          ))}
        </div>
      ) : null}

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
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={pass}
            disabled={!playable}
            title={GAME_COPY.passHint}
          >
            {GAME_COPY.pass.label}
          </Button>
        </div>
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

      {/* An empty board can be called off even where resigning is refused. */}
      {seat !== null &&
      (detail.allowResign || state.moves.length === 0) &&
      state.status === GAME_STATUS.playing ? (
        <div className="flex justify-end">
          <ResignButton
            id={detail.id}
            token={token}
            moves={state.moves.length}
            onDone={() => void mutate()}
            /*
              NOTHING MOVES WHILE THIS IS ASKING. A move carries a player to
              their next waiting game a moment after it lands, and somebody who
              plays a stone and reaches straight for Resign opened this question
              inside that moment — then watched the board and the question go
              together. Waved away, the held advance goes ahead; answered, it is
              dropped, because a game that has just ended is the board to be
              looking at.
            */
            onAsking={whileAsking}
          />
        </div>
      ) : null}

      {seat !== null && token !== null ? (
        <ReactionBar
          lastMove={state.moves.length > 0 ? state.moves.length : null}
          disabled={false}
          onSend={react}
        />
      ) : null}
      {/*
        Nothing to mute by hand when they are already ignored outright. Read
        from the ignore list rather than from `silenced`, which also holds the
        result of this very checkbox — testing that would make the box vanish
        the moment it was ticked.
      */}
      {seat !== null && !ignoring.includes(otherStone(seat)) ? (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={quiet}
            onChange={(event) => writeQuiet(initial.id, event.target.checked)}
            className="size-3.5 accent-ink"
            data-testid="mute-game"
          />
          Mute this opponent&apos;s messages in this game
        </label>
      ) : null}
      {opponent !== null && seat !== null ? (
        <p className="text-xs text-muted" data-testid="opponent-line">
          You are playing {STONE_DISPLAY[seat].label.toLowerCase()} against{" "}
          <span className="font-medium text-ink">{shownName(opponent.name)}</span>
          {opponent.country !== "" ? ` from ${opponent.country}` : ""}.
          {opponent.awayUntil
            ? ` Away until ${new Date(opponent.awayUntil).toLocaleDateString()}; their deadline waits.`
            : ""}
        </p>
      ) : null}
      <ReactionLog reactions={shown} />
    </div>
  );
}
