"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { RESULT_CARD_TONE } from "@/components/history/resultCard.constants";
import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, TAP_HEIGHT } from "@/components/ui/ui.constants";

import { WIN_CALM_MS, WIN_COVER_COPY, WIN_FLASH_MS } from "./winCover.constants";
import type { WinNews } from "./winCover.types";

/**
 * THE COVER OVER A FINISHED BOARD, the moment it is won.
 *
 * John, 2026-09-29, looking at a won Solitaire whose only sign of the win was
 * a panel beside the board: "If you win the game, there should be a Modal like
 * we see in Pause or whatever, that indicates you win." And: "Should apply to
 * most games."
 *
 * In Pause's place (`SolvePaused`), over the board and nothing else, so the
 * panel beside the board and the rest of the page stay usable; and in the
 * result card's dress (`ResultCard`), which is this moment for a game played
 * live: its border and heading in the result's colour, a dialog that takes the
 * focus without trapping it. A large kanji, the headline, the XP where there is
 * one, the one strongest next step, and See the board — the finished board is
 * often the reward, a picture drawn or four foundations full.
 *
 * Closed by See the board, by Escape, or by a press on the board around it.
 * It is drawn by `WinCoverOver`, which puts it in the board's own grid cell:
 * the board keeps its size, and a board shorter than the card grows to hold it
 * rather than cutting it off.
 */
export function WinCover({ news, onClose }: { news: WinNews; onClose: () => void }) {
  const card = useRef<HTMLDivElement | null>(null);
  const heading = useId();
  const tone = RESULT_CARD_TONE[news.tone];

  /*
   * FIRST THE FLASH, THEN THE CARD (`WIN_FLASH_MS`). The flash takes no press:
   * the board under it is finished, and a press meant for the panel beside it
   * goes through. Less motion asked for: a calm fade, and the card sooner.
   */
  const [phase, setPhase] = useState<"flash" | "card">("flash");
  useEffect(() => {
    const calm = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase("card"), calm ? WIN_CALM_MS : WIN_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Focus into the card when it comes up, so the result is announced — without scrolling, as the result card does.
  useEffect(() => {
    if (phase === "card") card.current?.focus({ preventScroll: true });
  }, [phase]);

  // Escape closes it, and only it: just the board and a board opened on its own wait for an Escape nobody else took.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const next = news.next ?? null;
  const strong = `${BUTTON_BASE} ${BUTTON_STRONG} ${TAP_HEIGHT}`;
  if (phase === "flash") {
    return (
      <div className="pointer-events-none relative z-10 col-start-1 row-start-1 rounded-lg" data-testid="win-cover-layer" data-win-flash="on" aria-hidden="true">
        <div className="win-flash absolute inset-0 rounded-lg" />
      </div>
    );
  }
  return (
    <div
      className="win-wash relative z-10 col-start-1 row-start-1 flex items-center justify-center rounded-lg bg-paper/60 p-3 backdrop-blur-[1.5px]"
      data-testid="win-cover-layer"
      data-win-flash="done"
      // A press on the board around the card: the reader wants the board.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={card}
        role="dialog"
        aria-labelledby={heading}
        tabIndex={-1}
        className={`win-card flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border-2 bg-ivory p-5 text-center text-ink shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-moss ${tone.border}`}
        data-testid="win-cover"
        data-tone={news.tone}
      >
        <p className={`font-mincho text-6xl leading-none ${tone.text}`} aria-hidden="true" data-testid="win-cover-mark">
          {news.mark}
        </p>
        <h2 id={heading} className={`text-lg font-semibold ${tone.text}`} data-testid="win-cover-headline">
          <Paired en={news.headline.label} kanji={news.headline.kanji} kanjiClassName="text-base font-normal opacity-70" />
          {news.headline.after ?? ""}
        </h2>
        {news.detail ? (
          <p className="text-sm text-muted" data-testid="win-cover-detail">
            {news.detail}
          </p>
        ) : null}
        {news.xp === undefined ? null : (
          // Its room kept while the finish is still being recorded, so the card does not move when the XP arrives.
          <p className={`min-h-5 text-sm font-semibold text-moss ${news.xp === null ? "invisible" : ""}`} data-testid="win-cover-xp" aria-live="polite">
            {news.xp ?? " "}
          </p>
        )}
        <div className="mt-1 flex w-full flex-col gap-2">
          {next === null ? null : "href" in next ? (
            <Link href={next.href} className={strong} data-testid="win-cover-next">
              {next.label}
            </Link>
          ) : (
            <button type="button" className={strong} onClick={() => next.onPress()} data-testid="win-cover-next">
              {next.label}
            </button>
          )}
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={onClose} data-testid="win-cover-see-board">
            {WIN_COVER_COPY.seeBoard}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A BOARD WITH ITS COVER OVER IT: the board and the cover share one grid cell,
 * so the cover lies exactly over the board and nothing beside it.
 */
export function WinCoverOver({ news, onClose, children }: { news: WinNews | null; onClose: () => void; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)]" data-testid="win-cover-over" data-covered={news === null ? "false" : "true"}>
      {/* The board, marked as the one a finished game's wallpaper is taken of (`BoardWallpaper`). */}
      <div className="col-start-1 row-start-1 min-w-0" data-wallpaper-board>
        {children}
      </div>
      {news === null ? null : <WinCover news={news} onClose={onClose} />}
    </div>
  );
}

/** Where a game stands, as the cover asks it: not read yet (or no game at all), being played, or over. */
export type PlayState = "unknown" | "playing" | "ended";

/**
 * WHETHER THE COVER IS UP: it opens when this page watches a game go from
 * being played to over, and at no other time. A page opened on a game already
 * over — a reload, a finished table kept in the browser, a link — saw no play
 * and opens nothing; a game begun again closes it.
 *
 * Decided in render, from the state before and the state now, rather than in
 * an effect: the cover arrives in the same paint as the finished board.
 */
export function useWinMoment(state: PlayState): { open: boolean; close: () => void; playing: boolean } {
  const [seen, setSeen] = useState<PlayState>(state);
  const [open, setOpen] = useState(false);
  if (state !== seen) {
    setSeen(state);
    setOpen(seen === "playing" && state === "ended");
  }
  const close = useCallback(() => setOpen(false), []);
  // Whether it is being played now, for the mark that quiets the page around it (`PlayingNow`).
  return { open, close, playing: state === "playing" };
}
