"use client";

import { useEffect, useMemo, useState } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { Button } from "@/components/ui/Controls";
import { replayTimeline } from "@/lib/gomoku/replay";
import { pointName } from "@/lib/gomoku/notation";
import type { GameDetail } from "@/lib/history/gameHistory.types";

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
      </aside>
    </div>
  );
}
