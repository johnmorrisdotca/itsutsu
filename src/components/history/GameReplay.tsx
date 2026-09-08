"use client";

import { useEffect, useMemo, useState } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { Button } from "@/components/ui/Controls";
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
}: {
  game: GameDetail;
  /** The move to open at; the final position when not given. */
  initialIndex?: number;
  /** The match's address; a position is that with the move number appended, and it is kept in the bar as the scrubber moves. */
  basePath?: string;
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

  const state = timeline[index];
  const current = game.moves[index - 1];

  return (
    <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <div className="w-full min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[min(100%,38rem)]">
          <Board
            state={state}
            appearance={{ ...DEFAULT_APPEARANCE, showMoveNumbers: showNumbers }}
            readOnly
            onPlay={() => {}}
          />
        </div>
      </div>

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
                {current.createdAt ? (
                  <span className="block text-xs" data-testid="move-made-at">
                    made {new Date(current.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </>
            ) : null}
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

        <Button onClick={() => setShowNumbers(!showNumbers)} strong={showNumbers}>
          {showNumbers ? "Hide" : "Show"} move numbers
        </Button>

        <MoveList game={game} current={index} onJump={setIndex} />
      </aside>
    </div>
  );
}
