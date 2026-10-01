"use client";

import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { blockRange } from "@johnmorrisdotca/tsunagi";
import { tsunagiRole } from "@johnmorrisdotca/tsunagi";
import { TSUNAGI_LEVEL_COUNTS, tsunagiBand } from "@/lib/puzzles/tsunagi/levels";

import { LevelPicker } from "./LevelPicker";
import { TSUNAGI_MARBLE, tsunagiMarbleLook, tsunagiNumberType, type TsunagiMarks } from "./puzzles.constants";

/** The address of one level: the solve's own, its number the seed. */
export function tsunagiLevelPath(size: number, level: number): string {
  return `${playPath("tsunagi")}${puzzleQuery({ size, level: tsunagiBand(size, level), seed: level })}`;
}

/**
 * TSUNAGI'S LEVEL PICKER: one block of a size's levels under the preview of the
 * one chosen (`LevelPicker`, which every game of levels shares). What is
 * Tsunagi's is how a solved level is marked: a marble in the block's colour
 * with its number, and which levels are lessons (`tsunagiRole`).
 */
export function TsunagiLevelPicker({
  size,
  block,
  best,
  attempts = {},
  open,
  next,
  chosen,
  onChoose,
  marks,
}: {
  size: number;
  /** Which block of sixteen is shown, from 1. */
  block: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** How many times each level has been started, where it has. */
  attempts?: Record<number, number>;
  /** Levels 1 to this are open. */
  open: number;
  /** The first level not yet solved: where Start goes unless another is chosen. */
  next: number;
  /** The level the preview shows and Start plays. */
  chosen: number;
  onChoose: (level: number) => void;
  marks: TsunagiMarks;
}) {
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  const { first, last } = blockRange(block, count);
  return (
    <LevelPicker
      prefix="tsunagi"
      size={size}
      first={first}
      last={last}
      block={block}
      best={best}
      attempts={attempts}
      open={open}
      next={next}
      chosen={chosen}
      onChoose={onChoose}
      roleOf={(level) => {
        const role = tsunagiRole(size, level);
        return role === null ? null : { role: role.role, words: role.challenges.join(" and ") };
      }}
      solvedMark={(level) => (
        <span className={`${TSUNAGI_MARBLE} size-6`} style={{ ...tsunagiMarbleLook(block - 1, marks), ...tsunagiNumberType(level, "1.5rem", "0.65rem") }} data-testid="tsunagi-level-marble">
          {level}
        </span>
      )}
    />
  );
}
