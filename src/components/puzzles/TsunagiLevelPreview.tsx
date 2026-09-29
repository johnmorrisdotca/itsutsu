"use client";

import { useEffect, useMemo, useState } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "@/components/live/live.constants";
import { decodeLayout } from "@/lib/puzzles/tsunagi/code";
import { blockOf } from "@/lib/puzzles/tsunagi/levelBlocks";
import { loadTsunagiLevels, TSUNAGI_LEVEL_COUNTS, tsunagiLevelsOf } from "@/lib/puzzles/tsunagi/levels";
import { linesOfAnswer, noLines } from "@/lib/puzzles/tsunagi/lines";

import { PuzzleBoard } from "./PuzzleBoard";
import { SolveTime } from "./SolveTime";
import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { TsunagiGrid } from "./TsunagiGrid";

/**
 * THE CHOSEN LEVEL'S OWN BOARD, in the set-up's preview box. John, 2026-09-26:
 * "the board should be a preview that changes with each choice: the chosen
 * level's board drawn in the preview box" — the rule every set-up keeps, that a
 * preview is always a live one (`PuzzleBoardPreview`, `BoardPreview`), in the
 * one box (`SET_UP_PREVIEW_BOX`) so the page never moves when a level or a size
 * is chosen.
 *
 * The level is drawn as it will be played (`TsunagiGrid`, pressing nothing),
 * in the reader's board colour, marks and fill: its marbles, and whatever it
 * asks — bridges, walls, waypoints, the wrapped edge, a hexagon. A level
 * solved shows its lines, as it opens (`TsunagiSolvedView`); a locked one shows
 * its board under a lock, and the caption says which block opens it.
 *
 * The levels are a size's data file, read in the browser once a size is
 * chosen; until it arrives the frame stands empty at the size, so nothing moves.
 */
export function TsunagiLevelPreview({
  size,
  level,
  best,
  solveId = null,
  locked,
  marks,
  fill,
  theme,
}: {
  size: number;
  level: number;
  /** Its best time, where solved. */
  best: number | undefined;
  /** The member's best solve of it, which its time opens; null for a solve kept only in this browser. */
  solveId?: string | null;
  locked: boolean;
  marks: TsunagiMarks;
  fill: TsunagiFill;
  theme: BoardThemeTokens;
}) {
  // The size whose levels have arrived: the data files load one size at a time.
  const [loaded, setLoaded] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void loadTsunagiLevels(size).then(() => live && setLoaded(size));
    return () => {
      live = false;
    };
  }, [size]);
  const drawn = useMemo(() => {
    if (loaded !== size) return null;
    const entry = tsunagiLevelsOf(size)[level - 1];
    const layout = entry === undefined ? null : decodeLayout(entry[0], size);
    if (entry === undefined || layout === null) return null;
    const lines = best !== undefined ? (linesOfAnswer(layout, entry[1]) ?? noLines(layout)) : noLines(layout);
    return { layout, lines };
  }, [loaded, size, level, best]);
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  return (
    <figure className="flex w-full flex-col items-center gap-2" data-testid="tsunagi-preview" data-size={size} data-level={level} data-state={best !== undefined ? "solved" : locked ? "locked" : "open"} data-drawn={drawn !== null ? "true" : "false"}>
      <div className={`${SET_UP_PREVIEW_BOX} relative`} aria-hidden="true">
        {drawn === null ? (
          <PuzzleBoard size={size} theme={theme} coordinates={false}>
            <div className="h-full w-full" />
          </PuzzleBoard>
        ) : (
          <TsunagiGrid layout={drawn.layout} lines={drawn.lines} marks={marks} fill={fill} theme={theme} done={best !== undefined} readOnly />
        )}
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgb(0 0 0 / 0.38)" }} data-testid="tsunagi-preview-lock">
            {/* A pale lock on the dimmed board in both themes: the light theme's paper (`surface-light`), since the dark theme's is charcoal on charcoal. */}
            <svg viewBox="0 0 10 12" className="surface-light h-12 w-12 text-paper drop-shadow" aria-hidden="true">
              <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1" y="5" width="8" height="6.5" rx="1" fill="currentColor" />
            </svg>
          </div>
        ) : null}
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION} data-testid="tsunagi-preview-caption">
        Level {level} of {count} at {size}×{size}
        {best !== undefined ? (
          <>
            : solved, best <SolveTime kind="tsunagi" solveId={solveId} elapsedMs={best} mine testId="tsunagi-preview-best" />.
          </>
        ) : locked ? (
          `: locked until every level of block ${blockOf(level) - 1} is solved.`
        ) : (
          ": not solved yet."
        )}
      </figcaption>
    </figure>
  );
}
