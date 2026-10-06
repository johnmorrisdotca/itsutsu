"use client";

import { useEffect, useMemo, useState } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { phraseWith } from "@/components/i18n/phraseWith";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "@/components/live/live.constants";
import { decodeLayout } from "@johnmorrisdotca/tsunagi";
import { blockOf } from "@johnmorrisdotca/tsunagi";
import { levelCountOf, loadTsunagiLevels, tsunagiLevelsOf, type TsunagiSet } from "@/lib/puzzles/tsunagi/levels";
import { linesOfAnswer, noLines } from "@johnmorrisdotca/tsunagi";

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
  set = "classic",
  best,
  solveId = null,
  locked,
  marks,
  fill,
  theme,
}: {
  size: number;
  /** The level's number in its set. */
  level: number;
  set?: TsunagiSet;
  /** Its best time, where solved. */
  best: number | undefined;
  /** The member's best solve of it, which its time opens; null for a solve kept only in this browser. */
  solveId?: string | null;
  locked: boolean;
  marks: TsunagiMarks;
  fill: TsunagiFill;
  theme: BoardThemeTokens;
}) {
  // The size and set whose levels have arrived: the data files load one size at a time.
  const [loaded, setLoaded] = useState<string | null>(null);
  const loadedKey = `${set}:${size}`;
  useEffect(() => {
    let live = true;
    void loadTsunagiLevels(size, set).then(() => live && setLoaded(loadedKey));
    return () => {
      live = false;
    };
  }, [size, set, loadedKey]);
  const drawn = useMemo(() => {
    if (loaded !== loadedKey) return null;
    const entry = tsunagiLevelsOf(size, set)[level - 1];
    const layout = entry === undefined ? null : decodeLayout(entry[0], size);
    if (entry === undefined || layout === null) return null;
    const lines = best !== undefined ? (linesOfAnswer(layout, entry[1]) ?? noLines(layout)) : noLines(layout);
    return { layout, lines };
  }, [loaded, loadedKey, size, set, level, best]);
  const count = levelCountOf(size, set);
  const say = useSpeaker();
  const sized = set === "portals" ? say.say("pmaze.tsunagi.withPortals", { size: String(size) }) : `${size}×${size}`;
  return (
    <figure className="flex w-full flex-col items-center gap-2" data-testid="tsunagi-preview" data-size={size} data-level={level} data-set={set} data-state={best !== undefined ? "solved" : locked ? "locked" : "open"} data-drawn={drawn !== null ? "true" : "false"}>
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
        {best !== undefined
          ? phraseWith(say.say("pmaze.preview.solved", { level: String(level), count: String(count), size: sized }), {
              time: <SolveTime kind="tsunagi" solveId={solveId} elapsedMs={best} mine testId="tsunagi-preview-best" />,
            })
          : say.say(locked ? "pmaze.preview.locked" : "pmaze.preview.open", { level: String(level), count: String(count), size: sized, block: String(blockOf(level) - 1) })}
      </figcaption>
    </figure>
  );
}
