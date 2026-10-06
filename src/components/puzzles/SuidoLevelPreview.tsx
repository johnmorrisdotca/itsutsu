"use client";

import { useMemo } from "react";

import { decodeLayout, encodeLayout, type Layout } from "@johnmorrisdotca/suido";
import { levelAnswer } from "@johnmorrisdotca/suido/levels-info";

import { phraseWith } from "@/components/i18n/phraseWith";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playingAreaInset } from "@/components/board/margin";
import { SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "@/components/live/live.constants";
import { blockOf, suidoLevelCount, suidoLevelsAt } from "@/lib/puzzles/suido/levels";
import { suidoShapeOf, suidoSizeWord } from "@/lib/puzzles/suido/sizes";

import { PuzzleBoard } from "./PuzzleBoard";
import { SolveTime } from "./SolveTime";
import { SuidoBoard } from "./SuidoBoard";

/** The room a board's frame keeps for its coordinates and its rim on two sides (`BoardFrame`: `LABEL_GUTTER` and `BOARD_FRAME`), in rem. */
const FRAME_ROOM_REM = 1.9;

/**
 * HOW WIDE A BOARD'S FRAME IS DRAWN IN A SQUARE BOX, a CSS width in the box's own units. A long board (5×7, 6×10,
 * 8×14) is taller than it is wide, and the set-up's preview box is one square that never changes (`SET_UP_PREVIEW_BOX`):
 * the board is drawn truly, at its own shape, as large as the box holds. The frame is the wood and its rim and the
 * coordinates round it; its height is `aspect` times the playing surface's width plus the room on two sides
 * (`BoardFrame`, which this follows), so the width that fills the box's height is found from that, and a square's is the
 * box's width.
 */
export function suidoFrameWidth(width: number, height: number): string {
  const inset = playingAreaInset(width, true);
  const aspect = (1 - 2 * inset) * (height / width) + 2 * inset;
  return `min(100cqw, calc((100cqh - ${FRAME_ROOM_REM}rem) / ${aspect.toFixed(4)} + ${FRAME_ROOM_REM}rem))`;
}

/**
 * THE CHOSEN LEVEL'S OWN BOARD, in the set-up's preview box: the rule every
 * set-up keeps, that a preview is always a live one (`PuzzleBoardPreview`,
 * `BoardPreview`), in the one box (`SET_UP_PREVIEW_BOX`) so the page never moves
 * when a level or a size is chosen. A long board stands in the same square box
 * the others do, drawn at its own shape (`suidoFrameWidth`).
 *
 * The level is drawn as it will be played (`SuidoBoard`, pressing nothing): its
 * pieces as dealt, the water as far as it gets, and its locked pieces, walls and
 * joined edges as the package draws them. A level solved shows its answer, the
 * water running through all of it; a locked one shows its board under a lock,
 * and the caption says which block opens it.
 *
 * The levels are a size's data file, read in the browser once a size is chosen
 * (by the set-up, which says when it has `ready`); until it arrives the frame
 * stands empty at the size, so nothing moves.
 */
export function SuidoLevelPreview({
  size,
  level,
  best,
  solveId = null,
  locked,
  ready,
}: {
  size: number;
  level: number;
  /** Its best time, where solved. */
  best: number | undefined;
  /** The member's best solve of it, which its time opens; null for a solve kept only in this browser. */
  solveId?: string | null;
  locked: boolean;
  /** Whether this size's levels have arrived (`loadSuidoLevelsAt`): the data files load one size at a time. */
  ready: boolean;
}) {
  const say = useSpeaker();
  const solved = best !== undefined;
  const drawn = useMemo<{ layout: Layout; masks: number[] } | null>(() => {
    if (!ready) return null;
    const row = suidoLevelsAt(size)[level - 1];
    const layout = row === undefined ? null : decodeLayout(row[0]);
    if (row === undefined || layout === null) return null;
    /*
     * A SOLVED LEVEL IS DRAWN AS IT WAS SOLVED: the answer's own layout, every
     * piece turned into place. The drawing turns pieces from `layout` and reads
     * `masks` for the water, so handing it the dealt layout with the answer's
     * masks drew the scrambled pieces all wet (John, 2026-10-01: "this one is
     * completely scrambled up again").
     */
    const answer = solved ? decodeLayout(levelAnswer(row) ?? "") : null;
    return answer === null ? { layout, masks: layout.cells } : { layout: answer, masks: answer.cells };
  }, [ready, size, level, solved]);
  const shape = suidoShapeOf(size) ?? { width: size, height: size };
  const count = suidoLevelCount(size);
  return (
    <figure className="flex w-full flex-col items-center gap-2" data-testid="suido-preview" data-size={size} data-level={level} data-state={solved ? "solved" : locked ? "locked" : "open"} data-drawn={drawn !== null ? "true" : "false"} data-board={drawn === null ? undefined : encodeLayout(drawn.layout)}>
      <div className={`${SET_UP_PREVIEW_BOX} relative aspect-square [container-type:size]`} aria-hidden="true">
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ width: suidoFrameWidth(shape.width, shape.height) }}>
            {drawn === null ? (
              <PuzzleBoard size={shape.width} rows={shape.height === shape.width ? undefined : shape.height}>
                <div className="h-full w-full" />
              </PuzzleBoard>
            ) : (
              <SuidoBoard key={`${size}-${level}-${solved ? "solved" : "dealt"}`} layout={drawn.layout} masks={drawn.masks} quarters={drawn.masks.map(() => 0)} readOnly done />
            )}
          </div>
        </div>
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgb(0 0 0 / 0.38)" }} data-testid="suido-preview-lock">
            {/* A pale lock on the dimmed board in both themes: the light theme's paper (`surface-light`), since the dark theme's is charcoal on charcoal. */}
            <svg viewBox="0 0 10 12" className="surface-light h-12 w-12 text-paper drop-shadow" aria-hidden="true">
              <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1" y="5" width="8" height="6.5" rx="1" fill="currentColor" />
            </svg>
          </div>
        ) : null}
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION} data-testid="suido-preview-caption">
        {solved
          ? phraseWith(say.say("pmaze.preview.solved", { level: String(level), count: String(count), size: suidoSizeWord(size) }), {
              time: <SolveTime kind="suido" solveId={solveId} elapsedMs={best} mine testId="suido-preview-best" />,
            })
          : say.say(locked ? "pmaze.preview.locked" : "pmaze.preview.open", { level: String(level), count: String(count), size: suidoSizeWord(size), block: String(blockOf(level) - 1) })}
      </figcaption>
    </figure>
  );
}
