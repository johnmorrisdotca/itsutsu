"use client";

import { phraseWith } from "@/components/i18n/phraseWith";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "@/components/live/live.constants";
import { meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { meikyuuLevelsAt, meikyuuLevelsLoaded, type MeikyuuLevelRow } from "@/lib/puzzles/meikyuu/levels";
import { isMeikyuuTall, meikyuuSizeInWords } from "@/lib/puzzles/meikyuu/sizes";

import { MeikyuuStill } from "./MeikyuuStill";
import { MeikyuuBlank } from "./MeikyuuFrame";
import { SolveTime } from "./SolveTime";

/**
 * THE CHOSEN LEVEL'S OWN MAZE, in the set-up's preview box: the rule every set-up
 * keeps, that a preview is always a live one (`PuzzleBoardPreview`, `BoardPreview`),
 * in the one box (`SET_UP_PREVIEW_BOX`) so the page never moves when a level or a
 * size is chosen.
 *
 * The level is drawn as it will be played: its walls, its start and goal or doors,
 * and its keys (`MeikyuuStill`, pressing nothing). A level solved shows the way
 * through it, drawn as it is when it is won. The list of levels is one script, read
 * in the browser (by the set-up, which says when it has `ready`); until it arrives
 * the frame stands empty, so nothing moves.
 */
export function MeikyuuLevelPreview({
  size,
  level,
  best,
  solveId = null,
  ready,
}: {
  size: number;
  level: number;
  /** Its best time, where solved. */
  best: number | undefined;
  /** The member's best solve of it, which its time opens; null for a solve kept only in this browser. */
  solveId?: string | null;
  /** Whether the levels have arrived (`loadMeikyuuLevels`). */
  ready: boolean;
}) {
  const say = useSpeaker();
  const solved = best !== undefined;
  const row: MeikyuuLevelRow | undefined = ready && meikyuuLevelsLoaded(size) ? meikyuuLevelsAt(size)[level - 1] : undefined;
  // A tall maze stands upright in the box, which is the one size whatever is chosen: the wood is as tall as the box.
  const tall = isMeikyuuTall(size);
  const count = meikyuuLevelCount(size);
  return (
    <figure className="flex w-full flex-col items-center gap-2" data-testid="meikyuu-preview" data-size={size} data-level={level} data-state={solved ? "solved" : "open"} data-drawn={row !== undefined ? "true" : "false"} data-maze={row?.code}>
      <div className={`${SET_UP_PREVIEW_BOX} relative`} aria-hidden="true">
        {row === undefined ? (
          <MeikyuuBlank stand={tall ? "upright" : "square"} />
        ) : (
          <MeikyuuStill key={`${size}-${level}-${solved ? "solved" : "dealt"}`} code={row.code} solved={solved} testId="meikyuu-preview-maze" tall={tall} stand={tall ? "upright" : undefined} picture />
        )}
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION} data-testid="meikyuu-preview-caption">
        {solved
          ? phraseWith(say.say("pmaze.preview.solved", { level: String(level), count: String(count), size: meikyuuSizeInWords(size, say) }), {
              time: <SolveTime kind="meikyuu" solveId={solveId} elapsedMs={best} mine testId="meikyuu-preview-best" />,
            })
          : say.say("pmaze.preview.open", { level: String(level), count: String(count), size: meikyuuSizeInWords(size, say) })}
      </figcaption>
    </figure>
  );
}
