import type { ReactNode } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { playingAreaInset } from "@/components/board/margin";
import type { BoardThemeTokens } from "@/components/board/board.types";

/**
 * A PUZZLE'S GRID ON A BOARD: the wood, the frame and the rim every game's
 * board has (`BoardFrame`), with the grid inside it on white paper.
 *
 * John, 2026-09-24: "the inside of the board could be white because it's a
 * place where people write. But the rest of the board should look like the
 * rest of the boards." Then, 2026-09-25, finding no row numbers or column
 * letters on Gomoji's board beside a real Gomoku board's: "Do this for all
 * the boards" — so every puzzle grid now carries the same coordinates a
 * game's board does (`BoardFrame`'s own drawing, never a second one), the
 * whole side lettered and numbered as the board itself is sized.
 *
 * `theme` defaults to the reader's plain board wood: every puzzle but Gomoji
 * draws it that way. Gomoji reads the reader's own felt-or-wood choice
 * (`feltOrWoodTheme`) and hands it in, so its board carries the same colour
 * picker a Reversi or Gomoku board offers.
 */
export function PuzzleBoard({
  size,
  theme = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme],
  coordinates = true,
  children,
}: {
  size: number;
  theme?: BoardThemeTokens;
  /** Row numbers and column letters, as a game's board draws them; on by default, off only where a caller draws its own (Towers' ring of clues). */
  coordinates?: boolean;
  children: ReactNode;
}) {
  return (
    <BoardFrame
      size={size}
      theme={theme}
      flipped={false}
      inset={playingAreaInset(size, true)}
      lattice={false}
      shape="rhombus"
      coordinates={coordinates}
    >
      {children}
    </BoardFrame>
  );
}
