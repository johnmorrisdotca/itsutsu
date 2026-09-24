"use client";

import { useEffect, useRef, useState } from "react";

import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import type { MosaicFrame } from "@/lib/record/mosaic.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MosaicMaker } from "./MosaicMaker";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

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
 */
export function MosaicDialog({
  id,
  count,
  frames,
  size,
  grid,
  details,
  fileName,
  alt,
}: {
  id: string;
  count: number;
  frames: () => MosaicFrame[];
  size: number;
  grid: string;
  details: () => string[];
  fileName: string;
  alt: string;
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs text-muted underline underline-offset-4 hover:text-ink"
        data-testid="open-mosaic"
        {...readyMark(hydrated)}
      >
        {MOSAIC_COPY.openLabel} <span className="font-mincho">{MOSAIC_COPY.kanji}</span> ⤢
      </button>
      {open ? (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          aria-labelledby={`mosaic-title-${id}`}
          className="m-auto w-[min(72rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:p-6"
          data-testid="mosaic-dialog"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id={`mosaic-title-${id}`} className={SECTION_TITLE}>
                {MOSAIC_COPY.heading} <span className="font-mincho normal-case tracking-normal">{MOSAIC_COPY.kanji}</span>
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 text-lg leading-none text-muted hover:text-ink"
                aria-label="Close"
                data-testid="close-mosaic"
              >
                ×
              </button>
            </div>
            <MosaicMaker
              id={id}
              count={count}
              frames={frames}
              size={size}
              grid={grid}
              details={details}
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
