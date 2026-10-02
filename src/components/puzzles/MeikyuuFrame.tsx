"use client";

import type { ReactNode } from "react";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import type { BoardThemeTokens } from "@/components/board/board.types";
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
 * THE WOOD EVERY MEIKYUU BOARD IS DRAWN ON: the frame the player chose (`useMeikyuuLook`),
 * round whatever is drawn inside it. The play screen's board, a finished maze, the set-up's
 * preview and its empty frame before the maze arrives are all drawn in this, so a colour
 * chosen on one is on all of them, and none of them has its own copy of the frame.
 */
export function MeikyuuFrame({ size, children }: { size: number; children: ReactNode }) {
  const { choice } = useMeikyuuLook();
  return (
    <PuzzleBoard size={size} coordinates={false} theme={frameTheme(choice.frame)}>
      {children}
    </PuzzleBoard>
  );
}

/** The frame with its paper and nothing drawn yet: what stands in the box until the maze arrives, so nothing moves. */
export function MeikyuuBlank({ size = 9 }: { size?: number }) {
  return (
    <MeikyuuFrame size={size}>
      <div className="h-full w-full bg-[var(--mkl-paper,#fbf8f1)]" />
    </MeikyuuFrame>
  );
}
