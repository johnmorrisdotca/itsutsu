"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SECTION_TITLE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { BrandWordmark } from "@/components/layout/BrandMarks";

/** A small picture that opens the window: the picture itself is the press, with room for the icon over its corner. */
const MOSAIC_THUMB_BUTTON = "group relative shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-moss focus-visible:outline-none";

/** The expand icon floating over a small picture's corner, a fingertip to find on a phone and plain on the wood under it. */
const MOSAIC_EXPAND_ICON =
  "pointer-events-none absolute right-1 bottom-1 flex size-7 items-center justify-center rounded-full bg-ink/75 text-sm leading-none text-ivory shadow group-hover:bg-ink";

/**
 * THE WINDOW A WALLPAPER OPENS IN: a quiet press on the page, and a <dialog>
 * headed with the logo, what the picture is, and whose it is. John,
 * 2026-09-23: "images should be collapsed, or not be too obvious and when
 * clicked on, a modal would show the entire thing" — and 2026-09-26: "Have a
 * title for this Modal. also the Itsutsu branding".
 *
 * Shared by a game's picture of every position (`MosaicDialog`) and a
 * member's crossword wallpaper (`KumimojiWallpaper`). What is inside is the
 * caller's, and is only mounted while the window is open, so nothing in it is
 * made until the press. `onOpen` is told of the press, for a caller that
 * fetches what it draws then and only then.
 *
 * `thumb`: a small picture to open it from instead of the quiet link — the
 * famous games' cards, where John asked for the pictures in a window, each
 * small one carrying an expand icon (2026-09-25). Esc closes it, as every
 * <dialog> opened with `showModal` does, and so does Close.
 */
export function MosaicWindow({
  id,
  label,
  heading,
  kanji,
  alt,
  name,
  thumb,
  onOpen,
  testId = "open-mosaic",
  children,
}: {
  id: string;
  /** The quiet press's words. */
  label: string;
  /** The window's name, beside the logo. */
  heading: string;
  kanji: string;
  /** What the thumb's press says it opens. */
  alt: string;
  /** Whose picture it is, read only while the window is open. */
  name: () => string;
  /** A small picture to open the window from, with an expand icon over its corner. */
  thumb?: ReactNode;
  onOpen?: () => void;
  testId?: string;
  children: ReactNode;
}) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function press() {
    setOpen(true);
    onOpen?.();
  }

  return (
    <>
      {thumb === undefined ? (
        <button
          type="button"
          onClick={press}
          className={`inline-flex items-center gap-1 self-start text-xs text-muted underline underline-offset-4 hover:text-ink ${TAP_HEIGHT}`}
          data-testid={testId}
          {...readyMark(hydrated)}
        >
          <Paired en={label} kanji={kanji} kanjiClassName="" inReadersLanguage /> ⤢
        </button>
      ) : (
        <button
          type="button"
          onClick={press}
          className={MOSAIC_THUMB_BUTTON}
          aria-label={`${label}: ${alt}`}
          data-testid={testId}
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1" data-testid="mosaic-masthead">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <BrandWordmark className="h-5 w-auto" />
                  <h2 id={`mosaic-title-${id}`} className={SECTION_TITLE}>
                    <Paired en={heading} kanji={kanji} kanjiClassName="normal-case tracking-normal" inReadersLanguage />
                  </h2>
                </span>
                <p className="truncate text-base font-semibold" data-testid="mosaic-game-name">
                  {name()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-full border border-rule-strong px-4 text-sm font-semibold text-ink hover:bg-shade"
                data-testid="close-mosaic"
              >
                {say.say("mosaic.close")} <span aria-hidden="true">×</span>
              </button>
            </div>
            {children}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
