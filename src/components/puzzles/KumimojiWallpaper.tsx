"use client";

import { useMemo, useState } from "react";

import Link from "@/components/ui/Link";
import { MosaicPanel } from "@/components/history/MosaicPanel";
import { MosaicWindow } from "@/components/history/MosaicWindow";
import { setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY, PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import { MOSAIC_SHAPES } from "@/lib/record/mosaic.constants";
import { myFinishedCrosswords } from "@/lib/puzzles/kumimoji/wallpaper.actions";
import { dayOf, kumimojiWallpaperSvg, wallpaperCrosswords, wallpaperTitle } from "@/lib/puzzles/kumimoji/wallpaper";
import { KUMIMOJI_WALLPAPER_COPY, KUMIMOJI_WALLPAPER_MOST } from "@/lib/puzzles/kumimoji/wallpaper.constants";
import type { WallpaperCrossword, WallpaperFetch } from "@/lib/puzzles/kumimoji/wallpaper.types";

/**
 * EVERY CROSSWORD YOU HAVE BUILT, AS ONE WALLPAPER. John, 2026-09-28: "every
 * single game you play is saved and so you can have a history of all the nice
 * cool maps that you made… a wallpaper of all the cool games you've played,
 * similar to the other games where you have wallpapers."
 *
 * The game wallpaper's window (`MosaicWindow`) and panel (`MosaicPanel`) —
 * the same press, masthead, two shapes and download — with the member's own
 * finished crosswords in it, drawn by `kumimojiWallpaperSvg`.
 *
 * COST: the crosswords are asked for once, by the press itself
 * (`myFinishedCrosswords`, one small query of the member's own rows), and kept
 * in this component while the page is open, so opening the window again asks
 * nothing. Never on a page view and never on a timer; the picture is drawn in
 * the browser and stored nowhere.
 *
 * A member with none sees the window say so and the way to build one — the
 * press is never hidden for want of crosswords, since the page cannot know
 * without asking, and asking on every view is the cost this avoids.
 */
const NONE: readonly WallpaperCrossword[] = [];

export function KumimojiWallpaper() {
  const [fetched, setFetched] = useState<WallpaperFetch>({ state: "idle" });
  const game = PUZZLE_DISPLAY[PUZZLE_KINDS.kumimoji].label;

  function load() {
    if (fetched.state === "loading" || fetched.state === "ready") return;
    setFetched({ state: "loading" });
    myFinishedCrosswords().then(
      (rows) => setFetched({ state: "ready", rows }),
      (error: unknown) => {
        console.error("[kumimoji wallpaper] could not fetch", error);
        setFetched({ state: "failed" });
      },
    );
  }

  const rows = fetched.state === "ready" ? fetched.rows : NONE;
  // Read in the browser only: the window's inside mounts after the press, so the day is this reader's.
  const crosswords = useMemo(
    () => wallpaperCrosswords(rows, (row, tiles) => [dayOf(row.finishedAt), KUMIMOJI_WALLPAPER_COPY.tiles(tiles)].filter((part) => part !== null).join(" · ")),
    [rows],
  );
  const title = useMemo(() => wallpaperTitle(game, crosswords, rows.length >= KUMIMOJI_WALLPAPER_MOST), [game, crosswords, rows.length]);

  return (
    <MosaicWindow
      id="kumimoji-wallpaper"
      label={KUMIMOJI_WALLPAPER_COPY.openLabel}
      heading={KUMIMOJI_WALLPAPER_COPY.heading}
      kanji={KUMIMOJI_WALLPAPER_COPY.kanji}
      alt={KUMIMOJI_WALLPAPER_COPY.alt(crosswords.length)}
      name={() => (crosswords.length === 0 ? "" : title.name)}
      onOpen={load}
      testId="open-kumimoji-wallpaper"
    >
      <div className="flex flex-col gap-3" data-testid="kumimoji-wallpaper" data-state={fetched.state} data-count={crosswords.length}>
        {fetched.state === "loading" || fetched.state === "idle" ? <p className="text-sm text-muted">{KUMIMOJI_WALLPAPER_COPY.loading}</p> : null}
        {fetched.state === "failed" ? <p className="text-sm text-red-700">{KUMIMOJI_WALLPAPER_COPY.failed}</p> : null}
        {fetched.state === "ready" && crosswords.length === 0 ? (
          <p className="text-sm" data-testid="kumimoji-wallpaper-empty">
            {KUMIMOJI_WALLPAPER_COPY.empty}{" "}
            <Link href={setUpPath(PUZZLE_KINDS.kumimoji)} className="font-semibold underline-offset-2 hover:underline">
              {KUMIMOJI_WALLPAPER_COPY.emptyLink}
            </Link>
          </p>
        ) : null}
        {crosswords.length > 0 ? (
          <MosaicPanel
            id="kumimoji-wallpaper"
            svgOf={(shape) => kumimojiWallpaperSvg({ crosswords, ...MOSAIC_SHAPES[shape], title })}
            redraw={`${crosswords.length} ${rows[0]?.finishedAt ?? ""}`}
            fileName="itsutsu-kumimoji-wallpaper.png"
            alt={KUMIMOJI_WALLPAPER_COPY.alt(crosswords.length)}
            auto
          />
        ) : null}
      </div>
    </MosaicWindow>
  );
}
