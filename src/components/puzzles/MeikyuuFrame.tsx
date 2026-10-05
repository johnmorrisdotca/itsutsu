"use client";

import type { ReactNode } from "react";

import { BOARD_FRAME, BOARD_THEMES } from "@/components/board/Board.constants";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { playingAreaInset } from "@/components/board/margin";
import { resolveFrame } from "@/lib/puzzles/meikyuu/look";
import { DEFAULT_LOOK, FRAMES, type FrameId } from "@/lib/puzzles/meikyuu/look.constants";

import { useMeikyuuLook } from "./meikyuuLookStore";
import { PuzzleBoard } from "./PuzzleBoard";

/**
 * A FRAME'S WOOD, as the board frame draws wood (`BoardThemeTokens`): the plain
 * wood every puzzle has always had for the default, and for every other frame its
 * colour lit at one corner and shaded towards the rim, as the site's own woods are.
 * The frame itself stays `BoardFrame`'s alone (`PuzzleBoard` draws it); only the
 * tokens it is handed differ.
 */
export function frameTheme(frame: FrameId): BoardThemeTokens {
  const plain = BOARD_THEMES.kaya;
  if (frame === DEFAULT_LOOK.frame) return plain;
  const { light, base, deep, rim } = resolveFrame(frame);
  return { ...plain, label: FRAMES[frame].label, kanji: FRAMES[frame].kanji, surface: `radial-gradient(120% 90% at 20% 0%, ${light} 0%, ${base} 45%, ${deep} 100%)`, frame: rim, dark: false };
}

/**
 * HOW A MAZE STANDS IN ITS WOOD: square, or a tall maze's box (two columns to three rows) upright, or lying on its side
 * (three to two), which is how a tall maze is shown on a wide screen (`meikyuu/turn.ts`). The wood keeps the rim of any
 * other maze (`rimOf`) and the squares of the frame are laid out two across and three down, so the playing area inside
 * it is exactly the box the package's board wants (`ratio`, 2:3, turned a quarter or not).
 */
export type MeikyuuStand = "square" | "upright" | "lying";

/** The wood's own shape, height over width, for a stand: what a box that has to hold the frame is sized by. */
export function frameAspect(stand: MeikyuuStand, rimSide: number = RIM_SIDE): number {
  if (stand === "square") return 1;
  const inset = playingAreaInset(rimSide, true);
  const tall = stand === "upright" ? 3 / 2 : 2 / 3;
  return (1 - 2 * inset) * tall + 2 * inset;
}

/** The side whose rim every maze's wood keeps: a maze has no rows to letter, so only its rim depends on it (`MeikyuuBoard`). */
const RIM_SIDE = 9;

/**
 * THE WOOD EVERY MEIKYUU BOARD IS DRAWN ON: the frame the player chose (`useMeikyuuLook`),
 * round whatever is drawn inside it. The play screen's board, a finished maze, the set-up's
 * preview and its empty frame before the maze arrives are all drawn in this, so a colour
 * chosen on one is on all of them, and none of them has its own copy of the frame.
 */
export function MeikyuuFrame({ size, stand = "square", children }: { size: number; stand?: MeikyuuStand; children: ReactNode }) {
  const { choice } = useMeikyuuLook();
  const oblong = stand === "square" ? {} : stand === "upright" ? { size: 2, rows: 3, rimOf: size } : { size: 3, rows: 2, rimOf: size };
  return (
    <PuzzleBoard size={size} {...oblong} coordinates={false} theme={frameTheme(choice.frame)}>
      {children}
    </PuzzleBoard>
  );
}

/**
 * A WOOD HELD IN A BOX THAT IS SQUARE AND DOES NOT CHANGE (the set-up's preview): a tall wood is as tall as the box, so as wide as
 * its shape makes it (the frame's own width is not part of the maze's shape, hence the two rims), and centred. A square wood is the box.
 */
export function MeikyuuHeld({ stand, children }: { stand: MeikyuuStand; children: ReactNode }) {
  if (stand === "square") return <>{children}</>;
  return (
    <div className="mx-auto" style={{ width: `min(100%, calc((100% - 2 * ${BOARD_FRAME}) / ${frameAspect(stand)} + 2 * ${BOARD_FRAME}))` }}>
      {children}
    </div>
  );
}

/** The frame with its paper and nothing drawn yet: what stands in the box until the maze arrives, so nothing moves. `stand` is held in the box, for a tall level's preview. */
export function MeikyuuBlank({ size = 9, stand = "square" }: { size?: number; stand?: MeikyuuStand }) {
  return (
    <MeikyuuHeld stand={stand}>
      <MeikyuuFrame size={size} stand={stand}>
        <div className="h-full w-full bg-[var(--mkl-paper,#fbf8f1)]" />
      </MeikyuuFrame>
    </MeikyuuHeld>
  );
}
