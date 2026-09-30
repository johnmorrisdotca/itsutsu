"use client";

import { useMemo } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { generateCube } from "@/lib/puzzles/cube/generate";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { CubeBoard } from "./CubeBoard";

/**
 * The cube before it is scrambled for you: a live cube of this size, turned
 * from solved as far as the level chosen turns one, on the board the solve
 * draws. It can be looked round with a drag, and not turned.
 */
export function CubePreview({ size, level, appearance }: { size: number; level: PuzzleLevel; appearance: Appearance }) {
  const state = useMemo(() => generateCube(size, level, 7).givens, [size, level]);
  return <CubeBoard size={size} state={state} theme={BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} />;
}
