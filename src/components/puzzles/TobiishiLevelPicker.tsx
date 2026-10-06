"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { tobiishiGoalOf, tobiishiPackOf, tobiishiRefOf } from "@/lib/puzzles/tobiishi/levels";
import { tobiishiLevelCount } from "@/lib/puzzles/tobiishi/levelCounts";
import { tobiishiBand } from "@/lib/puzzles/tobiishi/sizes";

import { LevelPicker } from "./LevelPicker";

/** The levels in a row of the picker: a board's three goals, three boards a row. */
const ACROSS = 9;

/** The address of one level: its length, its band and its number in the length, which is its seed (`tobiishi/levels.ts`). */
export function tobiishiLevelPath(size: number, level: number): string {
  return `${playPath("tobiishi")}${puzzleQuery({ size, level: tobiishiBand(size), seed: level })}`;
}

/**
 * TOBIISHI'S LEVEL PICKER: a length's twenty-seven levels, all of them, under the preview of the one
 * chosen (`LevelPicker`, which every game of levels shares). What is Tobiishi's is how a solved level is
 * marked, which is its number on a mossy tile, and what a level is called after its number: the board and
 * the goal hole, since a number alone does not say which board it is. Every level is open: a peg
 * puzzle is not a lesson that needs the one before it, so nothing is locked and no level is a block's
 * lesson or test.
 */
export function TobiishiLevelPicker({
  size,
  best,
  next,
  chosen,
  onChoose,
}: {
  size: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** The first level not yet solved: where Start goes unless another is chosen. */
  next: number;
  /** The level the preview shows and Start plays. */
  chosen: number;
  onChoose: (level: number) => void;
}) {
  const say = useSpeaker();
  const count = tobiishiLevelCount(size);
  return (
    <LevelPicker
      prefix="tobiishi"
      size={size}
      first={1}
      last={count}
      block={1}
      best={best}
      open={count}
      next={next}
      chosen={chosen}
      onChoose={onChoose}
      roleOf={() => null}
      across={ACROSS}
      describe={(level) => {
        const ref = tobiishiRefOf(size, level);
        if (ref === null) return "";
        const pack = tobiishiPackOf(ref.pack).title;
        const goal = tobiishiGoalOf(ref).names;
        return `${say.pairName(pack.en, pack.ja).text}${say.locale === "ja" ? "、" : ", "}${say.pairName(goal.en, goal.ja).text}`;
      }}
      solvedMark={(level) => (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-moss text-[0.7rem] font-semibold text-paper tabular-nums" data-testid="tobiishi-level-mark">
          {level}
        </span>
      )}
    />
  );
}
