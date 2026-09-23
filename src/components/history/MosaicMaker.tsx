"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Controls";
import { mosaicSvg, pickFrames } from "@/lib/record/mosaic";
import { MOSAIC_COPY, MOSAIC_MOST_TILES, MOSAIC_PICKS, type MosaicPick } from "@/lib/record/mosaic.constants";
import type { MosaicFrame } from "@/lib/record/mosaic.types";
import { nextPaint, pngOf, screenPixels } from "@/lib/record/mosaicImage";

/**
 * The controls that make one game's picture, and the picture once made — the
 * part a finished game's page (`GameMosaic`) and the famous games' gallery
 * share. Everything happens in the browser on a press: `frames` is asked for
 * only then, so a page of twenty games replays none of them until somebody
 * wants one.
 */
export function MosaicMaker({
  id,
  count,
  frames,
  size,
  grid,
  details,
  fileName,
  alt,
}: {
  /** Unique on the page, for the radio group's name. */
  id: string;
  /** How many positions `frames` will give, so the choice of which to show can be offered before any are made. */
  count: number;
  frames: () => MosaicFrame[];
  size: number;
  grid: string;
  /** The card's lines, asked for at the press, in the browser. */
  details: () => string[];
  fileName: string;
  alt: string;
}) {
  const [pick, setPick] = useState<MosaicPick>(MOSAIC_PICKS.spread);
  const [fillSpare, setFillSpare] = useState(true);
  const [made, setMade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // The picture is the reader's memory to give back: let go of it when it is replaced or the page goes.
  useEffect(() => () => {
    if (made !== null) URL.revokeObjectURL(made);
  }, [made]);

  const tooMany = count > MOSAIC_MOST_TILES;

  async function make() {
    setBusy(true);
    setFailed(false);
    await nextPaint();
    try {
      const { width, height } = screenPixels();
      const svg = mosaicSvg({
        frames: pickFrames(frames(), pick, MOSAIC_MOST_TILES),
        size,
        grid,
        width,
        height,
        fillSpare,
        details: details(),
      });
      const blob = await pngOf(svg, width, height);
      setMade(URL.createObjectURL(blob));
    } catch (error) {
      console.error("[mosaic] could not draw", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {tooMany ? (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">
            {MOSAIC_COPY.pickLabel} ({count} moves, {MOSAIC_MOST_TILES} tiles):
          </legend>
          {([MOSAIC_PICKS.spread, MOSAIC_PICKS.ending] as const).map((choice) => (
            <label key={choice} className="flex items-center gap-2">
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
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={fillSpare} onChange={(event) => setFillSpare(event.target.checked)} data-testid="mosaic-fill" />
        {MOSAIC_COPY.fill}
      </label>
      <span className="flex flex-wrap items-center gap-2">
        <Button onClick={make} disabled={busy} data-testid="make-mosaic">
          {busy ? MOSAIC_COPY.making : made === null ? MOSAIC_COPY.make : MOSAIC_COPY.again}
        </Button>
        {made !== null ? (
          <a href={made} download={fileName} className="text-sm font-semibold underline underline-offset-4" data-testid="download-mosaic">
            {MOSAIC_COPY.download}
          </a>
        ) : null}
      </span>
      {failed ? <p className="text-sm text-red-700">{MOSAIC_COPY.failed}</p> : null}
      {made !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago; there is nothing to optimise
        <img src={made} alt={alt} className="w-full rounded-lg border border-rule" data-testid="mosaic-picture" />
      ) : null}
    </>
  );
}
