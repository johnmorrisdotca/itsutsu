"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import type { MosaicFrame, MosaicTitle } from "@/lib/record/mosaic.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MosaicMaker } from "./MosaicMaker";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { BrandWordmark } from "@/components/layout/BrandMarks";

/** A small picture that opens the window: the picture itself is the press, with room for the icon over its corner. */
const MOSAIC_THUMB_BUTTON = "group relative shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-moss focus-visible:outline-none";

/** The expand icon floating over a small picture's corner, a fingertip to find on a phone and plain on the wood under it. */
const MOSAIC_EXPAND_ICON =
  "pointer-events-none absolute right-1 bottom-1 flex size-7 items-center justify-center rounded-full bg-ink/75 text-sm leading-none text-ivory shadow group-hover:bg-ink";

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
 *
 * `thumb`: a small picture to open it from instead of the quiet link — the
 * famous games' cards, where John asked for the pictures in a window, each
 * small one carrying an expand icon (2026-09-25). Esc closes it, as every
 * <dialog> opened with `showModal` does, and so does Close.
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
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  if (count === 0) return null;
  // Whose game it is, read from the picture's own title only while the window is open.
  const named = open ? title().name : "";

  return (
    <>
      {thumb === undefined ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start text-xs text-muted underline underline-offset-4 hover:text-ink"
          data-testid="open-mosaic"
          {...readyMark(hydrated)}
        >
          {MOSAIC_COPY.openLabel} <span className="font-mincho">{MOSAIC_COPY.kanji}</span> ⤢
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={MOSAIC_THUMB_BUTTON}
          aria-label={`${MOSAIC_COPY.openLabel}: ${alt}`}
          data-testid="open-mosaic"
          {...readyMark(hydrated)}
        >
          {thumb}
          <span aria-hidden="true" className={MOSAIC_EXPAND_ICON} data-testid="mosaic-expand-icon">
            ⤢
          </span>
        </button>
      )}
      {open ? (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          aria-labelledby={`mosaic-title-${id}`}
          className="m-auto max-h-[calc(100dvh-1rem)] w-[min(72rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-rule bg-paper p-3 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:p-6"
          data-testid="mosaic-dialog"
        >
          <div className="flex flex-col gap-3">
            {/* Headed as ours, simply: the logo, what this window is, and whose game it is (John, 2026-09-26: "Have a title for this Modal. also the Itsutsu branding"). */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1" data-testid="mosaic-masthead">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <BrandWordmark className="h-5 w-auto" />
                  <h2 id={`mosaic-title-${id}`} className={SECTION_TITLE}>
                    {MOSAIC_COPY.heading} <span className="font-mincho normal-case tracking-normal">{MOSAIC_COPY.kanji}</span>
                  </h2>
                </span>
                <p className="truncate text-base font-semibold" data-testid="mosaic-game-name">
                  {named}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-full border border-rule-strong px-4 text-sm font-semibold text-ink hover:bg-shade"
                data-testid="close-mosaic"
              >
                Close <span aria-hidden="true">×</span>
              </button>
            </div>
            <MosaicMaker
              id={id}
              count={count}
              frames={frames}
              size={size}
              grid={grid}
              title={title}
              fileName={fileName}
              alt={alt}
              auto
            />
          </div>
        </dialog>
      ) : null}
    </>
  );
}
