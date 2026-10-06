"use client";

import { BoardWallpaper } from "@/components/history/BoardWallpaper";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { slugFor } from "@/lib/gomoku/slugs";
import { fixedLevelOf } from "@/lib/puzzles/fixedLevel";
import { levelLabel, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";

/**
 * A FINISHED PUZZLE'S WALLPAPER (`BoardWallpaper`): the grid as it was
 * finished, named with the puzzle, its size and level, how it ended and its
 * number, as the line over the grid names them (`SolveHeader`).
 */
export function PuzzleWallpaper({ puzzle, result }: { puzzle: Puzzle; result: string }) {
  // A Suido, Meikyuu or Tobiishi level is named by its number (`fixedLevelOf`), as every other board is by its level and its seed.
  const say = useSpeaker();
  const number = puzzle.kind === "suido" || puzzle.kind === "meikyuu" || puzzle.kind === "tobiishi" ? fixedLevelOf(puzzle.kind, puzzle.seed) : null;
  const level = number !== null ? say.say("puzzle.level.number", { number: String(number) }) : PUZZLE_SPECS[puzzle.kind].levels.length < 2 ? null : levelLabel(puzzle.level, say.locale);
  return (
    <BoardWallpaper
      id={`puzzle-${puzzle.kind}`}
      name={puzzleName(puzzle.kind, say.locale)}
      details={() => [[sizeWordIn(puzzle.size, puzzle.kind, say), level].filter((part) => part !== null).join(" · "), result, number !== null ? "" : `№ ${puzzle.seed}`].filter((part) => part !== "")}
      fileName={`itsutsu-${slugFor(puzzle.kind)}-${number !== null ? `level-${number}` : puzzle.seed}.png`}
    />
  );
}
