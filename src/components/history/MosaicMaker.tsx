"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Controls";
import { mosaicSvg, pickFrames } from "@/lib/record/mosaic";
import { MOSAIC_COPY, MOSAIC_MOST_TILES, MOSAIC_PICKS, type MosaicPick } from "@/lib/record/mosaic.constants";
import type { MosaicFrame } from "@/lib/record/mosaic.types";
import { nextPaint, pngOf, screenPixels } from "@/lib/record/mosaicImage";

/** The widest picture drawn for the page itself; the full screen's worth is made only for a download. */
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
  auto = false,
}: {
  /** Unique on the page, for the radio group's name. */
  id: string;
  /** How many positions `frames` will give; with `auto`, a change in it is what redraws the picture. */
  count: number;
  frames: () => MosaicFrame[];
  size: number;
  grid: string;
  /** The card's lines, asked for when the picture is made, in the browser. */
  details: () => string[];
  fileName: string;
  alt: string;
  auto?: boolean;
}) {
  const [pick, setPick] = useState<MosaicPick>(MOSAIC_PICKS.spread);
  const [fillSpare, setFillSpare] = useState(true);
  const [shown, setShown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // The latest makers, read when a picture is drawn rather than written into the redraw's reasons.
  const latest = useRef({ frames, details });
  useEffect(() => {
    latest.current = { frames, details };
  });

  /** The picture as SVG at a given size, from the positions as they are now. */
  function svgAt(width: number, height: number): string {
    return mosaicSvg({
      frames: pickFrames(latest.current.frames(), pick, MOSAIC_MOST_TILES),
      size,
      grid,
      width,
      height,
      fillSpare,
      details: latest.current.details(),
    });
  }

  // The picture on the page, drawn by itself: on arrival and after every move.
  useEffect(() => {
    if (!auto) return;
    let stale = false;
    void (async () => {
      await nextPaint();
      if (stale) return;
      try {
        const screen = screenPixels();
        const across = box.current?.clientWidth ?? 640;
        const width = Math.min(SHOWN_MOST_PX, Math.max(480, Math.round(across * (window.devicePixelRatio || 1))));
        const height = Math.round((width * screen.height) / screen.width);
        const blob = await pngOf(svgAt(width, height), width, height);
        if (stale) return;
        setShown(URL.createObjectURL(blob));
        setFailed(false);
      } catch (error) {
        console.error("[mosaic] could not draw", error);
        if (!stale) setFailed(true);
      }
    })();
    return () => {
      stale = true;
    };
    // `svgAt` reads the positions through a ref; these are the reasons to draw again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, count, pick, fillSpare, size, grid]);

  // A picture replaced, or a page left, gives its memory back.
  useEffect(() => () => {
    if (shown !== null) URL.revokeObjectURL(shown);
  }, [shown]);

  /** Without `auto`: the press that makes the picture. With it: the full screen's worth, as a file. */
  async function make(download: boolean) {
    setBusy(true);
    setFailed(false);
    await nextPaint();
    try {
      const { width, height } = screenPixels();
      const blob = await pngOf(svgAt(width, height), width, height);
      if (download) saveAs(blob, fileName);
      else setShown(URL.createObjectURL(blob));
    } catch (error) {
      console.error("[mosaic] could not draw", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={box} className="flex flex-col gap-3">
      {count > MOSAIC_MOST_TILES ? (
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
        <img src={shown} alt={alt} className="w-full rounded-lg border border-rule" data-testid="mosaic-picture" />
      ) : null}
    </div>
  );
}
