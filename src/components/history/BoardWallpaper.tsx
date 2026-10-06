"use client";

import { useEffect, useState } from "react";

import { snapshotBoard, type BoardSnapshot } from "@/lib/record/boardSnapshot";
import { boardWallpaperSvg, boardWallpaperTitle } from "@/lib/record/boardWallpaper";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BOARD_WALLPAPER_COPY, MOSAIC_SHAPES } from "@/lib/record/mosaic.constants";

import { MosaicPanel } from "./MosaicPanel";
import { MosaicWindow } from "./MosaicWindow";

/** Where a play marks the board a wallpaper is made of (`WinCoverOver`, `WinStack`): one to a page. */
export const WALLPAPER_BOARD = "[data-wallpaper-board]";

/**
 * A FINISHED GAME'S BOARD AS A WALLPAPER, for every game that is not a board
 * game — a puzzle, a party table, a card game. John, 2026-09-29, on a finished
 * Solitaire: "where is the option to see the Desktop / Mobile image of the
 * game?"
 *
 * The board games' own control and window, reused: `MosaicWindow` (the quiet
 * press, the window with the logo and the name, Close and Esc) and
 * `MosaicPanel` (Landscape and Portrait, the picture in the middle, Download).
 * What differs is the picture: a board game draws every position from its
 * moves (`MosaicDialog`); these have only the board they ended on, so the
 * picture is that board, taken from the page as it is drawn
 * (`snapshotBoard`) the moment the window opens, and framed with the game's
 * name, the day and how it ended (`boardWallpaperSvg`).
 *
 * COST: nothing on a page view. The board is read and drawn in this browser
 * when the press is made, and again only when the window is opened again;
 * nothing is sent anywhere and nothing is stored.
 */
export function BoardWallpaper({ id, name, details, fileName }: { id: string; name: string; details: () => string[]; fileName: string }) {
  const say = useSpeaker();
  const alt = say.say("mosaic.wallpaperAlt", { name });
  return (
    <MosaicWindow
      id={`wallpaper-${id}`}
      label={say.say("mosaic.heading")}
      heading={say.say("mosaic.heading")}
      kanji={BOARD_WALLPAPER_COPY.kanji}
      alt={alt}
      name={() => name}
      testId="open-board-wallpaper"
    >
      <BoardWallpaperPanel id={id} name={name} details={details} fileName={fileName} alt={alt} />
    </MosaicWindow>
  );
}

/** The picture, taken from the page once the window is open (it mounts only then). */
function BoardWallpaperPanel({ id, name, details, fileName, alt }: { id: string; name: string; details: () => string[]; fileName: string; alt: string }) {
  const say = useSpeaker();
  const [taken, setTaken] = useState<{ state: "drawing" } | { state: "ready"; board: BoardSnapshot } | { state: "failed" }>({ state: "drawing" });
  // The words read once, as the window opens: the day is this reader's, and nothing about the game changes under an open window.
  const [title] = useState(() => boardWallpaperTitle(name, details()));

  useEffect(() => {
    let stale = false;
    // The marked board, or the part of it a play says is the board proper (a word's grid, without its replay's keys).
    const marked = document.querySelector<HTMLElement>(WALLPAPER_BOARD);
    const board = marked?.querySelector<HTMLElement>("[data-wallpaper-focus]") ?? marked;
    if (board === null) {
      queueMicrotask(() => setTaken({ state: "failed" }));
      return;
    }
    snapshotBoard(board).then(
      (snapshot) => {
        if (!stale) setTaken({ state: "ready", board: snapshot });
      },
      (error: unknown) => {
        console.error("[board wallpaper] could not draw", error);
        if (!stale) setTaken({ state: "failed" });
      },
    );
    return () => {
      stale = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3" data-testid="board-wallpaper" data-state={taken.state}>
      {taken.state === "drawing" ? <p className="text-center text-sm text-muted">{say.say("mosaic.wallpaperDrawing")}</p> : null}
      {taken.state === "failed" ? <p className="text-center text-sm text-shu">{say.say("mosaic.wallpaperFailed")}</p> : null}
      {taken.state === "ready" ? (
        <MosaicPanel
          id={`wallpaper-${id}`}
          svgOf={(shape) => boardWallpaperSvg({ board: taken.board, ...MOSAIC_SHAPES[shape], title })}
          redraw={`${taken.board.width}x${taken.board.height}`}
          fileName={fileName}
          alt={alt}
          auto
        />
      ) : null}
    </div>
  );
}
