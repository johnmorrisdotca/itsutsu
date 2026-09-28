"use client";

import { useState } from "react";

import { mosaicPlan, mosaicSvg } from "@/lib/record/mosaic";
import { MOSAIC_COPY, MOSAIC_PICKS, MOSAIC_SHAPES, type MosaicPick } from "@/lib/record/mosaic.constants";
import type { MosaicFrame, MosaicTitle } from "@/lib/record/mosaic.types";

import { MosaicPanel } from "./MosaicPanel";

/**
 * One game's picture of every position, and the way to keep it — shared by a
 * finished game's page (`GameMosaic`), a game in play (`VisualMoves`) and the
 * famous games' gallery. Everything happens in the browser; the site is asked
 * for nothing.
 *
 * The shapes, the drawing and the download are `MosaicPanel`'s, which a
 * member's crossword wallpaper shares. What is a game's own is here: which
 * positions to show when the game has more than the picture holds.
 */
export function MosaicMaker({
  id,
  count,
  frames,
  size,
  grid,
  title,
  fileName,
  alt,
  auto = false,
}: {
  /** Unique on the page, for the radio group's name. */
  id: string;
  /** How many positions `frames` will give; with `auto`, a change in it is what redraws the picture. */
  count: number;
  frames: () => MosaicFrame[];
  size: number;
  grid: string;
  /** The title bar's words, asked for when the picture is made, in the browser. */
  title: () => MosaicTitle;
  fileName: string;
  alt: string;
  auto?: boolean;
}) {
  const [pick, setPick] = useState<MosaicPick>(MOSAIC_PICKS.spread);

  return (
    <MosaicPanel
      id={id}
      svgOf={(shape) => mosaicSvg({ frames: frames(), pick, size, grid, ...MOSAIC_SHAPES[shape], title: title() })}
      redraw={`${count} ${pick} ${size} ${grid}`}
      fileName={fileName}
      alt={alt}
      auto={auto}
      extra={(shape) => {
        const holds = mosaicPlan(count, MOSAIC_SHAPES[shape].width, MOSAIC_SHAPES[shape].height).shown;
        return count > holds ? (
          <fieldset className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            <legend className="mb-1 w-full text-center">
              {MOSAIC_COPY.pickLabel} ({count} positions, {holds} tiles):
            </legend>
            {([MOSAIC_PICKS.opening, MOSAIC_PICKS.spread, MOSAIC_PICKS.ending] as const).map((choice) => (
              <label key={choice} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`mosaic-pick-${id}`}
                  checked={pick === choice}
                  onChange={() => setPick(choice)}
                  data-testid={`mosaic-pick-${choice}`}
                />
                {MOSAIC_COPY.picks[choice]}
              </label>
            ))}
          </fieldset>
        ) : null;
      }}
    />
  );
}
