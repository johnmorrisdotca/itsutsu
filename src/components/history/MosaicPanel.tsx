"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Controls";
import { MOSAIC_COPY, MOSAIC_SHAPES, type MosaicShape } from "@/lib/record/mosaic.constants";
import { nextPaint, pngOf, saveAs, shapeForScreen } from "@/lib/record/mosaicImage";

/** The longer side of the picture drawn for the page itself; the full size is made only for a download. */
const SHOWN_MOST_PX = 1600;

/**
 * A WALLPAPER ON THE PAGE AND THE WAY TO KEEP IT, whatever it is a picture
 * of: a game's positions (`MosaicMaker`) or a member's crosswords
 * (`KumimojiWallpaper`). It is handed `svgOf`, which writes the picture at a
 * shape's size, and does the rest in the browser — the shape, the drawing,
 * the download — asking the site for nothing.
 *
 * TWO WAYS OF BEING THERE. `auto` draws the picture by itself, at the size it
 * is shown, the moment it mounts and again whenever `redraw` changes — John,
 * 2026-09-23: "can't we already have it made every move… After I refresh, I
 * lost the image… so that they can always see it?" A refresh redraws it from
 * what the page already holds, so there is nothing to lose and nothing to
 * store. The full screen's worth, which is the costly one, is made only when
 * Download is pressed.
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
export function MosaicPanel({
  id,
  svgOf,
  redraw,
  fileName,
  alt,
  auto = false,
  extra,
}: {
  /** Unique on the page, for the radio group's name. */
  id: string;
  /** The picture as SVG at this shape's size, asked for when it is drawn, in the browser. */
  svgOf: (shape: MosaicShape) => string;
  /** With `auto`, a change in it is what draws the picture again. */
  redraw: string;
  fileName: string;
  alt: string;
  auto?: boolean;
  /** Choices of the caller's own under the shapes, told which shape is chosen. */
  extra?: (shape: MosaicShape) => ReactNode;
}) {
  const [shape, setShape] = useState<MosaicShape>(shapeForScreen);
  // The picture on the page, and the shape it was drawn in — which lags the choice by a drawing.
  const [shown, setShown] = useState<{ url: string; shape: MosaicShape } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // The latest maker, read when a picture is drawn rather than written into the redraw's reasons.
  const latest = useRef(svgOf);
  useEffect(() => {
    latest.current = svgOf;
  });
  const { width, height } = MOSAIC_SHAPES[shape];

  /** A PNG of the picture, scaled by `scale`. */
  function pngAt(scale: number): Promise<Blob> {
    return pngOf(latest.current(shape), Math.round(width * scale), Math.round(height * scale));
  }

  // The picture on the page, drawn by itself: on arrival and whenever `redraw` changes.
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
    // `pngAt` reads the maker through a ref; these are the reasons to draw again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, redraw, shape]);

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
      {/*
        The picture first, in the middle of the window, and what to change about
        it underneath — John, 2026-09-26: "Move the image to the middle of the
        Modal. Move the landscape, portrait and download buttons below the image."
      */}
      {shown !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago; there is nothing to optimise
        <img
          src={shown.url}
          alt={alt}
          className="mx-auto h-auto max-h-[70dvh] w-auto max-w-full rounded-lg border border-rule"
          data-testid="mosaic-picture"
          data-shape={shown.shape}
        />
      ) : null}
      {failed ? <p className="text-center text-sm text-red-700">{MOSAIC_COPY.failed}</p> : null}
      <div className="flex flex-col items-center gap-2" data-testid="mosaic-controls">
        <fieldset className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm" data-testid="mosaic-shape">
          <legend className="sr-only">{MOSAIC_COPY.shapeLabel}</legend>
          {(Object.keys(MOSAIC_SHAPES) as MosaicShape[]).map((choice) => (
            <label key={choice} className="flex min-h-11 cursor-pointer items-center gap-2">
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
        {extra?.(shape)}
        <span className="flex flex-wrap items-center justify-center gap-2">
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
      </div>
    </div>
  );
}
