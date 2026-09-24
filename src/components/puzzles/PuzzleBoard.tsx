import type { ReactNode } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { playingAreaInset } from "@/components/board/margin";

/**
 * A PUZZLE'S GRID ON A BOARD: the wood, the frame and the rim every game's
 * board has (`BoardFrame`), with the grid inside it on white paper.
 *
 * John, 2026-09-24: "the inside of the board could be white because it's a
 * place where people write. But the rest of the board should look like the
 * rest of the boards." No coordinates: a solver writes in cells, and a row of
 * letters over a grid of numbers is noise. The set-up screen's preview keeps
 * them, to be the same size as a game's preview beside it
 * (`PuzzleBoardPreview`).
 */
export function PuzzleBoard({ size, children }: { size: number; children: ReactNode }) {
  return (
    <BoardFrame
      size={size}
      theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]}
      flipped={false}
      inset={playingAreaInset(size, true)}
      lattice={false}
      shape="rhombus"
      coordinates={false}
    >
      {children}
    </BoardFrame>
  );
}
