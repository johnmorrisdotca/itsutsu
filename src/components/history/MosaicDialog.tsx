"use client";

import type { ReactNode } from "react";

import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import type { MosaicFrame, MosaicTitle } from "@/lib/record/mosaic.types";

import { MosaicMaker } from "./MosaicMaker";
import { MosaicWindow } from "./MosaicWindow";

/**
 * A GAME'S PICTURE OF EVERY POSITION, IN A WINDOW OF ITS OWN. John,
 * 2026-09-23: "images should be collapsed, or not be too obvious and when
 * clicked on, a modal would show the entire thing. I don't want it to over
 * shine the board… a view of the board that is a Modal. not part of the page."
 *
 * So on the page it is one quiet button beside the move list, and the picture
 * is drawn when the window opens — from the positions as they are at that
 * moment, in the browser, with nothing asked of the site — and forgotten when
 * it closes. Opening it again draws it again, so it is never out of date.
 * The window is `MosaicWindow`, the picture `MosaicMaker`.
 */
export function MosaicDialog({
  id,
  count,
  frames,
  size,
  grid,
  title,
  fileName,
  alt,
  thumb,
}: {
  id: string;
  count: number;
  frames: () => MosaicFrame[];
  size: number;
  grid: string;
  title: () => MosaicTitle;
  fileName: string;
  alt: string;
  /** A small picture to open the window from, with an expand icon over its corner. */
  thumb?: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <MosaicWindow
      id={id}
      label={MOSAIC_COPY.openLabel}
      heading={MOSAIC_COPY.heading}
      kanji={MOSAIC_COPY.kanji}
      alt={alt}
      // Whose game it is, read from the picture's own title only while the window is open.
      name={() => title().name}
      thumb={thumb}
    >
      <MosaicMaker id={id} count={count} frames={frames} size={size} grid={grid} title={title} fileName={fileName} alt={alt} auto />
    </MosaicWindow>
  );
}
