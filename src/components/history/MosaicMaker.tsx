"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Controls";
import { mosaicPlan, mosaicSvg } from "@/lib/record/mosaic";
import { MOSAIC_COPY, MOSAIC_PICKS, MOSAIC_SHAPES, type MosaicPick, type MosaicShape } from "@/lib/record/mosaic.constants";
import type { MosaicFrame, MosaicTitle } from "@/lib/record/mosaic.types";
import { nextPaint, pngOf, shapeForScreen } from "@/lib/record/mosaicImage";

/** The longer side of the picture drawn for the page itself; the full size is made only for a download. */
const SHOWN_MOST_PX = 1600;

/** Hands a picture to the reader as a file, then lets the browser forget it. */
function saveAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked once the browser has taken the file; revoking in the same tick cancels it in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * One game's picture of every position, and the way to keep it — shared by a
 * finished game's page (`GameMosaic`), a game in play (`VisualMoves`) and the
 * famous games' gallery. Everything happens in the browser; the site is asked
 * for nothing.
 *
 * TWO WAYS OF BEING THERE. `auto` draws the picture by itself, at the size it
 * is shown, the moment the page has the moves and again whenever `count`
 * changes — John, 2026-09-23: "can't we already have it made every move…
 * After I refresh, I lost the image… so that they can always see it?" A
 * refresh redraws it from the moves the page already holds, so there is
 * nothing to lose and nothing to store. The full screen's worth, which is the
 * costly one, is made only when Download is pressed.
 *
 * Without `auto` — the famous games' gallery, where a page holds a dozen long
 * Go games and drawing them all on arrival would be work nobody asked for —
 * nothing is made until the press.
 *
 * TWO SHAPES, landscape and portrait (`MOSAIC_SHAPES`), starting on the one
 * this screen is. The page's picture and the download are one drawing at the
 * shape's own size, the page's only scaled down, so what is seen is what is
 * saved. This panel mounts only once its window is opened, after hydration,
 * so reading the screen as it starts cannot disagree with the server's HTML.
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
  const [shape, setShape] = useState<MosaicShape>(shapeForScreen);
  // The picture on the page, and the shape it was drawn in — which lags the choice by a drawing.
  const [shown, setShown] = useState<{ url: string; shape: MosaicShape } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // The latest makers, read when a picture is drawn rather than written into the redraw's reasons.
  const latest = useRef({ frames, title });
  useEffect(() => {
    latest.current = { frames, title };
  });
  const { width, height } = MOSAIC_SHAPES[shape];
  const holds = mosaicPlan(count, width, height).shown;

  /** The picture as SVG at its shape's size, from the positions as they are now. */
  function svgNow(): string {
    return mosaicSvg({ frames: latest.current.frames(), pick, size, grid, width, height, title: latest.current.title() });
  }

  /** A PNG of the picture, scaled by `scale`. */
  function pngAt(scale: number): Promise<Blob> {
    return pngOf(svgNow(), Math.round(width * scale), Math.round(height * scale));
  }

  // The picture on the page, drawn by itself: on arrival and after every move.
  useEffect(() => {
    if (!auto) return;
    let stale = false;
    void (async () => {
      await nextPaint();
      if (stale) return;
      try {
        const blob = await pngAt(Math.min(1, SHOWN_MOST_PX / Math.max(width, height)));
        if (stale) return;
        setShown({ url: URL.createObjectURL(blob), shape });
        setFailed(false);
      } catch (error) {
        console.error("[mosaic] could not draw", error);
        if (!stale) setFailed(true);
      }
    })();
    return () => {
      stale = true;
    };
    // `svgNow` reads the positions through a ref; these are the reasons to draw again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, count, pick, shape, size, grid]);

  // A picture replaced, or a page left, gives its memory back.
  useEffect(() => () => {
    if (shown !== null) URL.revokeObjectURL(shown.url);
  }, [shown]);

  /** Without `auto`: the press that makes the picture. With it: the full size, as a file. */
  async function make(download: boolean) {
    setBusy(true);
    setFailed(false);
    await nextPaint();
    try {
      const blob = await pngAt(1);
      if (download) saveAs(blob, fileName);
      else setShown({ url: URL.createObjectURL(blob), shape });
    } catch (error) {
      console.error("[mosaic] could not draw", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" data-testid="mosaic-shape">
        <legend className="sr-only">{MOSAIC_COPY.shapeLabel}</legend>
        {(Object.keys(MOSAIC_SHAPES) as MosaicShape[]).map((choice) => (
          <label key={choice} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name={`mosaic-shape-${id}`}
              checked={shape === choice}
              onChange={() => setShape(choice)}
              data-testid={`mosaic-shape-${choice}`}
            />
            <span>
              {MOSAIC_SHAPES[choice].label} <span className="text-muted">{MOSAIC_SHAPES[choice].note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {count > holds ? (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">
            {MOSAIC_COPY.pickLabel} ({count} positions, {holds} tiles):
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
      <span className="flex flex-wrap items-center gap-2">
        {auto ? null : (
          <Button onClick={() => void make(false)} disabled={busy} data-testid="make-mosaic">
            {busy ? MOSAIC_COPY.making : shown === null ? MOSAIC_COPY.make : MOSAIC_COPY.again}
          </Button>
        )}
        {auto || shown !== null ? (
          <Button onClick={() => void make(true)} disabled={busy} data-testid="download-mosaic">
            {busy && auto ? MOSAIC_COPY.making : MOSAIC_COPY.download}
          </Button>
        ) : null}
      </span>
      {failed ? <p className="text-sm text-red-700">{MOSAIC_COPY.failed}</p> : null}
      {shown !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago; there is nothing to optimise
        <img
          src={shown.url}
          alt={alt}
          className="mx-auto h-auto max-h-[75dvh] w-auto max-w-full rounded-lg border border-rule"
          data-testid="mosaic-picture"
          data-shape={shown.shape}
        />
      ) : null}
    </div>
  );
}
