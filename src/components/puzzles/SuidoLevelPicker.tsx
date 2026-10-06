"use client";

import { suidoRole } from "@johnmorrisdotca/suido/levels-info";

import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { blockRange, suidoLevelBand, suidoLevelCount } from "@/lib/puzzles/suido/levels";
import { suidoLevelSeed } from "@/lib/puzzles/suido/seed";
import { suidoSizeKey } from "@/lib/puzzles/suido/sizes";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { LevelPicker } from "./LevelPicker";
import { suidoWords } from "./mazeWords";
import { readerName } from "./readerName";

/** The address of one level: the solve's own, its number in it (`number=12`). */
export function suidoLevelPath(size: number, level: number): string {
  return `${playPath("suido")}${puzzleQuery({ size, level: suidoLevelBand(size, level), seed: suidoLevelSeed(level) })}`;
}

/**
 * SUIDO'S LEVEL PICKER: one block of a size's levels under the preview of the
 * one chosen (`LevelPicker`, which every game of levels shares). What is Suido's
 * is how a solved level is marked, which is its number on a mossy tile, and
 * which levels are lessons (`suidoRole`).
 */
export function SuidoLevelPicker({
  size,
  block,
  best,
  open,
  next,
  chosen,
  onChoose,
}: {
  size: number;
  /** Which block of sixteen is shown, from 1. */
  block: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** Levels 1 to this are open. */
  open: number;
  /** The first level not yet solved: where Start goes unless another is chosen. */
  next: number;
  /** The level the preview shows and Start plays. */
  chosen: number;
  onChoose: (level: number) => void;
}) {
  const say = useSpeaker();
  const words = suidoWords(say.locale);
  const { first, last } = blockRange(block, suidoLevelCount(size));
  const key = suidoSizeKey(size);
  return (
    <LevelPicker
      prefix="suido"
      size={size}
      first={first}
      last={last}
      block={block}
      best={best}
      open={open}
      next={next}
      chosen={chosen}
      onChoose={onChoose}
      roleOf={(level) => {
        const role = key === null ? null : suidoRole(key, level);
        return role === null ? null : { role: role.role, words: say.list(role.twists.map((twist) => readerName(say, words.twists[twist]).toLowerCase())) };
      }}
      solvedMark={(level) => (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-moss text-[0.7rem] font-semibold text-paper tabular-nums" data-testid="suido-level-mark">
          {level}
        </span>
      )}
    />
  );
}
