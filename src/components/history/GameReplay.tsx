"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { readTurned, subscribeTurned, turnedFor, writeTurned } from "@/components/board/turned";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PlayedMoves } from "./PlayedMoves";
import { replayTimeline } from "@/lib/gomoku/replay";
import { pointName } from "@/lib/gomoku/notation";
import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * The whole game as text, the way a printed record or the elder sites give
 * it: "1. h8 i9  2. h9 h10 …", one pair a turn. Each move is a link to its
 * position, and the plain text can be copied in one go.
 */
function MoveList({ game, current, onJump }: { game: GameDetail; current: number; onJump: (index: number) => void }) {
  const [copied, setCopied] = useState(false);
  const names = useMemo(() => game.moves.map((move) => (move.kind === "pass" ? "pass" : pointName(game.size, move))), [game]);
  const text = useMemo(() => {
    const turns: string[] = [];
    for (let i = 0; i < names.length; i += 2) {
      turns.push(`${i / 2 + 1}. ${names[i]}${names[i + 1] !== undefined ? ` ${names[i + 1]}` : ""}`);
    }
    return turns.join("  ");
  }, [names]);

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
            {i % 2 === 0 ? <span className="text-muted">{i / 2 + 1}. </span> : " "}
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
      <span>
        <Button onClick={copy} data-testid="copy-moves">
          {copied ? "Copied" : "Copy as text"}
        </Button>
      </span>
    </details>
  );
}

export function GameReplay({
  game,
  initialIndex,
  basePath,
  appearance = DEFAULT_APPEARANCE,
}: {
  game: GameDetail;
  /** The move to open at; the final position when not given. */
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
}) {
  const timeline = useMemo(() => replayTimeline(game), [game]);
  const [index, setIndex] = useState(
    Math.min(initialIndex ?? timeline.length - 1, timeline.length - 1),
  );

  useEffect(() => {
    if (basePath === undefined) return;
    const next = `${basePath}/${index}`;
    if (window.location.pathname !== next) window.history.replaceState(null, "", next);
  }, [basePath, index]);
  const [showNumbers, setShowNumbers] = useState(false);
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
  const current = game.moves[index - 1];

  return (
    <div className="flex w-full flex-col items-start gap-8 lg:flex-row lg:items-stretch">
      <div className="w-full min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[min(100%,38rem)]">
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
      </div>

      {/* The column matches the board's height on a wide screen, and the record
          hangs from the bottom of it rather than floating under the buttons. */}
      <aside className="flex w-full flex-col gap-4 lg:w-72">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">
            Move <span className="font-mono tabular-nums">{index}</span> of{" "}
            <span className="font-mono tabular-nums">{game.moveCount}</span>
            {current !== undefined ? (
              <>
                {" · "}
                <span className="font-mono">
                  {pointName(game.size, current)}
                </span>
                {/* The line is always there, so the slider does not jump as the times come and go.
                    The last move is when the game ended, paired with move 0's "started" below. */}
                <span className="block text-xs" data-testid="move-made-at">
                  {current.createdAt
                    ? `${index === game.moveCount ? "ended" : "made"} ${new Date(current.createdAt).toLocaleString()}`
                    : "\u00a0"}
                </span>
              </>
            ) : (
              <span className="block text-xs" data-testid="replay-started-at">
                started {new Date(game.playedAt).toLocaleString()}
              </span>
            )}
          </p>
          <input
            type="range"
            min={0}
            max={timeline.length - 1}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="w-full accent-ink"
            aria-label="Move"
            data-testid="replay-scrubber"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIndex(0)} disabled={index === 0}>
            Start
          </Button>
          <Button onClick={() => setIndex(index - 1)} disabled={index === 0}>
            Back
          </Button>
          <Button
            onClick={() => setIndex(index + 1)}
            disabled={index >= timeline.length - 1}
            data-testid="replay-forward"
          >
            Forward
          </Button>
          <Button
            onClick={() => setIndex(timeline.length - 1)}
            disabled={index >= timeline.length - 1}
          >
            End
          </Button>
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
        <div className="flex flex-col gap-2">
          <SectionTitle kanji="棋譜">Moves</SectionTitle>
          <PlayedMoves
            size={game.size}
            moves={game.moves}
            at={index}
            onJump={(number) => setIndex(number)}
            emptyNote="No stones were played in this game."
          />
        </div>

        <Button onClick={() => writeTurned(game.id, !turned)} strong={turned} data-testid="turn-board">
          {turned ? "Turn the board back" : "Turn the board round"}
        </Button>
        <Button onClick={() => setShowNumbers(!showNumbers)} strong={showNumbers}>
          {showNumbers ? "Hide" : "Show"} move numbers
        </Button>

        <div className="lg:mt-auto">
          <MoveList game={game} current={index} onJump={setIndex} />
        </div>
      </aside>
    </div>
  );
}
