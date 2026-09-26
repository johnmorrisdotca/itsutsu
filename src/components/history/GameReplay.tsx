"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { readTurned, subscribeTurned, turnedFor, writeTurned } from "@/components/board/turned";
import { Button } from "@/components/ui/Controls";
import { LocalTime } from "@/components/ui/LocalTime";
import { ReplayAdvanced } from "./ReplayAdvanced";
import { PlayedMoves } from "./PlayedMoves";
import { ReplayScrubber } from "./ReplayScrubber";
import { MovesFold, type MovesShown } from "./MovesFold";
import { useMoveFormat } from "@/components/game/MoveFormatContext";
import { MoveFormatPicker } from "@/components/game/MoveFormatPicker";
import { useSavedAppearance } from "@/components/game/useSavedAppearance";
import { GameMosaic } from "./GameMosaic";
import { PdnDownload } from "./PdnDownload";
import { SgfDownload } from "./SgfDownload";
import { replayTimeline } from "@/lib/gomoku/replay";
import { pointIn, type MoveFormatChoice } from "@/lib/record/moveFormats";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { moveNumberAt, timelineIndexForMove } from "@/lib/history/replayIndex";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardFocus } from "@/components/board/BoardFocus";

/**
 * The whole game as text, the way a printed record or the elder sites give
 * it: "1. h8 i9  2. h9 h10 …", one pair a turn. Each move is a link to its
 * position, and the plain text can be copied in one go.
 */
/** `current` and `onJump` both speak move numbers (`move.number`), never a timeline position — see replayIndex.ts. */
function MoveList({
  game,
  current,
  onJump,
  offerSgf,
  format,
}: {
  game: GameDetail;
  current: number;
  onJump: (moveNumber: number) => void;
  offerSgf: boolean;
  /** How the moves are written, the reader's choice over the record above (`MoveFormatPicker`), so the text copied is the text shown. */
  format: MoveFormatChoice;
}) {
  const [copied, setCopied] = useState(false);
  const names = useMemo(() => game.moves.map((move) => stonelessWord(move.kind) ?? pointIn(format, game.size, move)), [game, format]);
  // A pair a turn; GoldToken writes the turn's number with no stop after it.
  const stop = format === "goldToken" ? "" : ".";
  const text = useMemo(() => {
    const turns: string[] = [];
    for (let i = 0; i < names.length; i += 2) {
      turns.push(`${i / 2 + 1}${stop} ${names[i]}${names[i + 1] !== undefined ? ` ${names[i + 1]}` : ""}`);
    }
    return turns.join("  ");
  }, [names, stop]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (names.length === 0) return null;
  return (
    <details className="group flex flex-col gap-2" data-testid="move-list">
      <summary className="cursor-pointer list-none text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase select-none hover:text-ink">
        Move list <span className="font-mincho normal-case tracking-normal">棋譜</span>
        <span className="ml-1 opacity-60 group-open:hidden">+</span>
        <span className="ml-1 hidden opacity-60 group-open:inline">−</span>
      </summary>
      <p className="mt-2 font-mono text-xs leading-relaxed break-words">
        {names.map((name, i) => (
          <span key={i}>
            {i % 2 === 0 ? <span className="text-muted">{`${i / 2 + 1}${stop} `}</span> : " "}
            <button
              type="button"
              onClick={() => onJump(i + 1)}
              className={`underline-offset-2 hover:underline ${current === i + 1 ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              {name}
            </button>
            {i % 2 === 1 ? "  " : ""}
          </span>
        ))}
      </p>
      <span className="flex flex-wrap gap-2">
        <Button onClick={copy} data-testid="copy-moves">
          {copied ? "Copied" : "Copy as text"}
        </Button>
        {/* The same record as a file other programs open, where SGF has a type for the game. */}
        {offerSgf ? <SgfDownload game={game} /> : null}
        {/* The draughts family's file, which SGF has no number for (`PdnDownload`). */}
        {offerSgf ? <PdnDownload game={game} /> : null}
      </span>
    </details>
  );
}

export function GameReplay({
  game,
  initialIndex,
  basePath,
  appearance = DEFAULT_APPEARANCE,
  seated = false,
  offerSgf = false,
  offerMosaic = false,
  overlay = null,
  savesToAccount = false,
  movesShown = "open",
}: {
  game: GameDetail;
  /** Whether the reader has an account to keep their move numbers and folded moves on. */
  savesToAccount?: boolean;
  /** Whether the moves open or folded, as the reader last left them (`movesShown`). */
  movesShown?: MovesShown;
  /**
   * Something drawn over the board and nothing else — the result card, the first
   * time a player opens a game that has just finished. Positioned inside the
   * board's own box, so it cannot move the page and always covers the board it
   * is about.
   */
  overlay?: ReactNode;
  /**
   * The MOVE to open at — a stone count, matching `game.moveCount` and the
   * number `matchPath` puts on the address — not a position in the engine's
   * own timeline. The two agree for a plain game and drift apart the moment
   * an opening choice or a twist adds an entry the timeline has and no move
   * ever claimed; the final position when not given.
   */
  initialIndex?: number;
  /** The match's address; a position is that with the move number appended, and it is kept in the bar as the scrubber moves. */
  basePath?: string;
  /**
   * How this reader likes a board dressed. The record drew the default and
   * nothing else, so somebody who had chosen a board played on it and then
   * went back through the game on a board they had never asked for — and it
   * is the record they will spend the most time looking at.
   */
  appearance?: Appearance;
  /**
   * Whether this reader held a seat in the game, rather than only watching
   * it. Gates the fork below the scrubber — see `forkOffered` — and defaults
   * to false so a caller with no seat to report (`KeptGames`, over a kept
   * record with no real row to fork from) never offers one by omission.
   */
  seated?: boolean;
  /**
   * Whether the move list offers the game as an .sgf file. Only a game filed
   * on this site: a kept record (`KeptGames`) was copied down from another
   * site, and its date and seats are what was written down, not what was
   * played here. Defaults to false so no caller offers a file by omission.
   */
  offerSgf?: boolean;
  /** Offer the game as one picture of every position, made in the browser — see `GameMosaic`. */
  offerMosaic?: boolean;
}) {
  const timeline = useMemo(() => replayTimeline(game), [game]);
  /*
   * `initialIndex` is a MOVE NUMBER, handed down from the address
   * (`matchPath`'s own contract) and validated by the page against
   * `game.moveCount` — so it has to be converted to a timeline position
   * through the same function everything else in this component uses,
   * rather than trusted as one directly. See replayIndex.ts.
   */
  const [index, setIndex] = useState(() =>
    initialIndex === undefined ? timeline.length - 1 : timelineIndexForMove(timeline, initialIndex),
  );

  useEffect(() => {
    if (basePath === undefined) return;
    // What travels in the address is a move number too, for the same
    // reason it arrived as one: a shareable scrub-bar link is `matchPath`'s
    // contract, and the engine's own timeline position is not what that
    // contract means by "move".
    const next = `${basePath}/${moveNumberAt(timeline[index])}`;
    if (window.location.pathname !== next) window.history.replaceState(null, "", next);
  }, [basePath, index, timeline]);
  /*
   * Move numbers on the stones: the reader's own board setting, and a press
   * here changes that setting, kept on the account the way the practice
   * board keeps it (`useSavedAppearance`). John, 2026-09-25: "Show move numbers
   * needs memory, we lose it on refresh." It started off on every page, whatever
   * the reader had chosen.
   */
  const [showNumbers, setShowNumbers] = useState(appearance.showMoveNumbers);
  useSavedAppearance({ ...appearance, showMoveNumbers: showNumbers }, savesToAccount);
  const { format } = useMoveFormat();
  /*
   * The same way up this game was being read while it was played. It is the
   * same game and the same reader, so somebody who turned the board round to
   * play from the far corner finds it that way round in the record rather than
   * having to turn it again.
   */
  const override = useSyncExternalStore(
    subscribeTurned,
    () => readTurned(game.id),
    () => null,
  );
  // A replay is read, not sat at: no seat, so no side to face.
  const turned = turnedFor(override, appearance.flipped ?? false);

  /*
   * The keys that walk a record, unless a field has focus.
   *
   * Left and right step; up and down jump to either end, and so do Home and
   * End. Two ways to the same place because a laptop keyboard often has no
   * Home key at all, and a reader who found the arrows will try the other two
   * arrows before they think of anything else. Doing nothing is the one answer
   * that teaches them the keyboard does not work here.
   */
  const last = timeline.length - 1;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && target.getAttribute("type") !== "range") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") setIndex((at) => Math.max(0, at - 1));
      else if (event.key === "ArrowRight") setIndex((at) => Math.min(last, at + 1));
      else if (event.key === "Home" || event.key === "ArrowUp") setIndex(0);
      else if (event.key === "End" || event.key === "ArrowDown") setIndex(last);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  const state = timeline[index];
  // The move number THIS POSITION is at, not the position's own index — see
  // replayIndex.ts. Equal for a plain game and only for a plain game.
  const moveNumber = moveNumberAt(state);
  const current = game.moves[moveNumber - 1];

  return (
    <BoardFocus label="this game">
    <div
      className="flex w-full flex-col items-start gap-8 lg:flex-row lg:items-stretch"
      data-testid="game-replay"
      {...readyMark(useHydrated())}
    >
      <div className="w-full min-w-0 flex-1">
        <div className="relative mx-auto w-full max-w-[min(100%,38rem)]" data-bare-board data-focus-board>
          {overlay}
          <Board
            state={state}
            /*
              The reader's own board, with the move numbers this panel's own
              button decides — that toggle belongs to reading one game and
              overrules the standing preference for as long as it is on.
            */
            appearance={{ ...appearance, flipped: turned, showMoveNumbers: showNumbers }}
            readOnly
            onPlay={() => {}}
          />
        </div>
        {/*
          Read as just the board, the side column goes and this comes instead:
          the move it is at and the one-line scrubber, under the board, the same
          width. John: "Maybe a nice simple scrubber with controls at the bottom
          in this modal mode." Drawn only in that mode (`data-bare-only`), and
          moved through the same `setIndex` as the one in the column.
        */}
        <div className="mx-auto mt-3 w-full max-w-[min(100%,38rem)]" data-bare-only data-bare-board>
          <p className="mb-1 text-sm text-muted">
            Move <span className="font-mono tabular-nums">{moveNumber}</span> of{" "}
            <span className="font-mono tabular-nums">{game.moveCount}</span>
          </p>
          <ReplayScrubber index={index} last={timeline.length - 1} onGo={setIndex} testId="bare-replay" />
        </div>
      </div>

      {/* The column matches the board's height on a wide screen, and the record
          hangs from the bottom of it rather than floating under the buttons. */}
      <aside className="flex w-full flex-col gap-4 lg:w-72">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            Move <span className="font-mono tabular-nums">{moveNumber}</span> of{" "}
            <span className="font-mono tabular-nums">{game.moveCount}</span>
            {current !== undefined ? (
              <>
                {" · "}
                <span className="font-mono">
                  {pointIn(format, game.size, current)}
                </span>
                {/* The line is always there, so the slider does not jump as the times come and go.
                    The last move is when the game ended, paired with move 0's "started" below. */}
                <span className="block text-xs" data-testid="move-made-at">
                  {current.createdAt ? (
                    <>
                      {moveNumber === game.moveCount ? "ended" : "made"} <LocalTime at={current.createdAt} />
                    </>
                  ) : (
                    "\u00a0"
                  )}
                </span>
              </>
            ) : (
              <span className="block text-xs" data-testid="replay-started-at">
                started <LocalTime at={game.playedAt} />
              </span>
            )}
          </p>
          <ReplayScrubber index={index} last={timeline.length - 1} onGo={setIndex} testId="replay" />
        </div>

        {/*
          The record itself, which this page did not have. A scrubber says
          WHERE you are and the list says WHAT was played — John asked twice
          where the moves had gone, and the answer was that only a practice
          game ever showed them.

          Each one is a position to go to, because on a finished game that is
          what a move is: the whole point of reading a record is stopping at
          the move you wanted to look at.
        */}
        <MovesFold count={game.moves.length} initial={movesShown} saves={savesToAccount}>
          {/* How they are written, ours or the other sites': the same choice the live record offers. */}
          <MoveFormatPicker />
          <PlayedMoves
            size={game.size}
            moves={game.moves}
            at={moveNumber}
            // PlayedMoves hands back a MOVE NUMBER (move.number), the same
            // thing it was given as `at` — never a timeline position.
            onJump={(number) => setIndex(timelineIndexForMove(timeline, number))}
            emptyNote="No stones were played in this game."
            // The engine's moves, for a draughts capture's colon (`capturePaths`).
            played={timeline[timeline.length - 1]?.moves}
            format={format}
          />
        </MovesFold>

        <Button onClick={() => writeTurned(game.id, !turned)} strong={turned} data-testid="turn-board">
          {turned ? "Turn the board back" : "Turn the board round"}
        </Button>
        <Button onClick={() => setShowNumbers(!showNumbers)} strong={showNumbers} data-testid="show-move-numbers">
          {showNumbers ? "Hide" : "Show"} move numbers
        </Button>
        {/* The whole game as one picture, in a window on demand — see `GameMosaic`. */}
        {offerMosaic ? <GameMosaic game={game} timeline={timeline} /> : null}

        <div className="lg:mt-auto">
          <MoveList
            game={game}
            current={moveNumber}
            onJump={(number) => setIndex(timelineIndexForMove(timeline, number))}
            offerSgf={offerSgf}
            format={format}
          />
        </div>

        {/*
          PLAY FROM MOVE N, under Advanced at the bottom, folded, saying what it
          does (`ReplayAdvanced`). MOVE NUMBER, not `index`: a fork's address is
          `matchPath`'s contract, the same space `game.moveCount` is in — see
          replayIndex.ts.
        */}
        <ReplayAdvanced gameId={game.id} variant={game.variant} move={moveNumber} last={game.moveCount} seated={seated} />
      </aside>
    </div>
    </BoardFocus>
  );
}
