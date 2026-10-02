"use client";

import { playPath } from "@/lib/gomoku/slugs";
import { meikyuuBlockRange, meikyuuLevelBand, meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";

import { LevelPicker } from "./LevelPicker";

/** The address of one level: its size, its band and its number in the size, which is its seed (`meikyuu/levels.ts`). */
export function meikyuuLevelPath(size: number, level: number): string {
  return `${playPath("meikyuu")}${puzzleQuery({ size, level: meikyuuLevelBand(size, level), seed: level })}`;
}

/**
 * MEIKYUU'S LEVEL PICKER: one block of a size's levels under the preview of the one
 * chosen (`LevelPicker`, which every game of levels shares). What is Meikyuu's is how
 * a solved level is marked, which is its number on a mossy tile. Every level is open: a
 * maze is not a lesson that needs the one before it, so nothing is locked and no
 * level is a block's lesson or test.
 */
export function MeikyuuLevelPicker({
  size,
  block,
  best,
  next,
  chosen,
  onChoose,
}: {
  size: number;
  /** Which block of sixteen is shown, from 1. */
  block: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** The first level not yet solved: where Start goes unless another is chosen. */
  next: number;
  /** The level the preview shows and Start plays. */
  chosen: number;
  onChoose: (level: number) => void;
}) {
  const count = meikyuuLevelCount(size);
  const { first, last } = meikyuuBlockRange(block, count);
  return (
    <LevelPicker
      prefix="meikyuu"
      size={size}
      first={first}
      last={last}
      block={block}
      best={best}
      open={count}
      next={next}
      chosen={chosen}
      onChoose={onChoose}
      roleOf={() => null}
      solvedMark={(level) => (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-moss text-[0.7rem] font-semibold text-paper tabular-nums" data-testid="meikyuu-level-mark">
          {level}
        </span>
      )}
    />
  );
}
