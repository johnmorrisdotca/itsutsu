"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { slugFor } from "@/lib/gomoku/slugs";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { framesOf, mosaicDraws, mosaicSvg, pickFrames } from "@/lib/record/mosaic";
import {
  MOSAIC_COPY,
  MOSAIC_LONGEST_SIDE,
  MOSAIC_MOST_TILES,
  MOSAIC_PICKS,
  type MosaicPick,
} from "@/lib/record/mosaic.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/** Lets the page paint "Drawing…" before the work starts, so a press is answered at once. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

/**
 * The picture's size: this screen, in its own pixels, no bigger on its longer
 * side than `MOSAIC_LONGEST_SIDE`. Read in the handler, never while rendering —
 * the server has no screen, and a size worked out there would be a guess.
 */
function screenPixels(): { width: number; height: number } {
  const ratio = window.devicePixelRatio || 1;
  let width = Math.round((window.screen.width || 1920) * ratio);
  let height = Math.round((window.screen.height || 1080) * ratio);
  const scale = Math.min(1, MOSAIC_LONGEST_SIDE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  return { width, height };
}

/** Rasterises an SVG string to a PNG blob, in the browser. */
async function pngOf(svg: string, width: number, height: number): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob === null ? reject(new Error("no blob")) : resolve(blob)), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}

/**
 * A FINISHED GAME AS ONE PICTURE, made in the reader's browser and theirs to
 * keep. John, 2026-09-23: "don't do them on the server if possible… async so
 * that it doesn't block the user."
 *
 * Nothing here asks the site for anything. The positions are the replay's own
 * timeline, already in memory for the board above; the drawing is
 * `mosaicSvg`, a string; the PNG is the browser's canvas. The first press
 * draws it, and the picture then sits here to look at and download.
 *
 * Offered for the square-grid games only — see `mosaicDraws`. A hexagon board
 * drawn on a square grid would be a wrong picture, which is worse than none.
 */
export function GameMosaic({ game, timeline }: { game: GameDetail; timeline: readonly GameState[] }) {
  const hydrated = useHydrated();
  const frames = useMemo(() => framesOf(timeline), [timeline]);
  const [pick, setPick] = useState<MosaicPick>(MOSAIC_PICKS.spread);
  const [made, setMade] = useState<{ url: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // The picture is the reader's memory to give back: let go of it when it is replaced or the page goes.
  useEffect(() => () => {
    if (made !== null) URL.revokeObjectURL(made.url);
  }, [made]);

  if (!mosaicDraws(game.variant) || frames.length === 0) return null;
  const tooMany = frames.length > MOSAIC_MOST_TILES;

  async function make() {
    setBusy(true);
    setFailed(false);
    await nextPaint();
    try {
      const { width, height } = screenPixels();
      const svg = mosaicSvg({
        frames: pickFrames(frames, pick, MOSAIC_MOST_TILES),
        size: game.size,
        grid: VARIANT_SPECS[game.variant].grid,
        width,
        height,
      });
      const blob = await pngOf(svg, width, height);
      setMade({ url: URL.createObjectURL(blob), name: `itsutsu-${slugFor(game.variant)}-${game.id}.png` });
    } catch (error) {
      console.error("[mosaic] could not draw", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="game-mosaic" {...readyMark(hydrated)}>
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {MOSAIC_COPY.heading} <span className="font-mincho normal-case tracking-normal">{MOSAIC_COPY.kanji}</span>
      </h2>
      <p className="text-sm text-ink-soft">{MOSAIC_COPY.blurb}</p>
      {tooMany ? (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">
            {MOSAIC_COPY.pickLabel} ({frames.length} moves, {MOSAIC_MOST_TILES} tiles):
          </legend>
          {([MOSAIC_PICKS.spread, MOSAIC_PICKS.ending] as const).map((choice) => (
            <label key={choice} className="flex items-center gap-2">
              <input
                type="radio"
                name={`mosaic-pick-${game.id}`}
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
        <Button onClick={make} disabled={busy} data-testid="make-mosaic">
          {busy ? MOSAIC_COPY.making : made === null ? MOSAIC_COPY.make : MOSAIC_COPY.again}
        </Button>
        {made !== null ? (
          <a
            href={made.url}
            download={made.name}
            className="text-sm font-semibold underline underline-offset-4"
            data-testid="download-mosaic"
          >
            {MOSAIC_COPY.download}
          </a>
        ) : null}
      </span>
      {failed ? <p className="text-sm text-red-700">{MOSAIC_COPY.failed}</p> : null}
      {made !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago; there is nothing to optimise
        <img src={made.url} alt={`Every position of this game, ${frames.length} moves`} className="w-full rounded-lg border border-rule" data-testid="mosaic-picture" />
      ) : null}
    </section>
  );
}
