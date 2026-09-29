"use client";

import { BoardWallpaper } from "@/components/history/BoardWallpaper";
import { slugFor } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { sizeWord } from "./puzzles.constants";

/**
 * A FINISHED PUZZLE'S WALLPAPER (`BoardWallpaper`): the grid as it was
 * finished, named with the puzzle, its size and level, how it ended and its
 * number, as the line over the grid names them (`SolveHeader`).
 */
export function PuzzleWallpaper({ puzzle, result }: { puzzle: Puzzle; result: string }) {
  const level = PUZZLE_SPECS[puzzle.kind].levels.length < 2 ? null : PUZZLE_LEVEL_DISPLAY[puzzle.level].label;
  return (
    <BoardWallpaper
      id={`puzzle-${puzzle.kind}`}
      name={PUZZLE_DISPLAY[puzzle.kind].label}
      details={() => [[sizeWord(puzzle.size, puzzle.kind), level].filter((part) => part !== null).join(" · "), result, `№ ${puzzle.seed}`]}
      fileName={`itsutsu-${slugFor(puzzle.kind)}-${puzzle.seed}.png`}
    />
  );
}
