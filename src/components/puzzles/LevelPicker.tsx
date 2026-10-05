"use client";

import type { ReactNode } from "react";

import { clockText } from "@/lib/puzzles/clockText";

/** A block's sixteen levels, in two rows of eight: short enough to sit under the preview. */
export const LEVEL_PICKER_ACROSS = 8;

/** Where a level sits in its block's lesson: the 15th teaches a twist, the 16th tests it; `words` is what the twists are called, read aloud and shown on the tile's hover. */
export type LevelPickerRole = { role: "teaches" | "tests"; words: string };

/**
 * THE LEVEL PICKER, FOR ANY GAME OF FIXED LEVELS: one block of a size's levels,
 * sixteen tiles in two rows, under the preview of the one chosen. John,
 * 2026-09-26, of Tsunagi's 256 levels: "the grid of level numbers cannot stay.
 * Like every other game's set-up, the board should be a preview that changes
 * with each choice: the chosen level's board drawn in the preview box, and a
 * level picker below it … showing solved and locked levels and the next one."
 * A press chooses; Start plays the one chosen, and the preview above shows it
 * before it is started.
 *
 * A tile is a level, in one of three states:
 *  - SOLVED: the game's own mark for it (`solvedMark`: a marble with its number
 *    for Tsunagi) and the best time under it.
 *  - OPEN: its number.
 *  - LOCKED: its number faint and a small lock. It can still be chosen, to be
 *    looked at: the preview draws it, and Start says it is locked.
 * The next level is ringed in ochre, the one chosen in moss; a block's 15th
 * and 16th carry New and Test.
 *
 * What a game says of itself is its `prefix` (the tiles' test ids:
 * `tsunagi-level`, `suido-level`), how it marks a solved level, and which
 * levels are lessons; the tiles, their states and their words are one component.
 */
export function LevelPicker({
  prefix,
  size,
  first,
  last,
  block,
  best,
  attempts = {},
  open,
  next,
  chosen,
  onChoose,
  roleOf,
  solvedMark,
  across = LEVEL_PICKER_ACROSS,
  describe,
}: {
  prefix: string;
  /** The size's own number, for a test to read. */
  size: number;
  /** The block's first and last level (`blockRange`). */
  first: number;
  last: number;
  /** Which block of sixteen is shown, from 1. */
  block: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** How many times each level has been started, where the game counts that. */
  attempts?: Record<number, number>;
  /** Levels 1 to this are open. */
  open: number;
  /** The first level not yet solved: where Start goes unless another is chosen. */
  next: number;
  /** The level the preview shows and Start plays. */
  chosen: number;
  onChoose: (level: number) => void;
  roleOf: (level: number) => LevelPickerRole | null;
  /** A solved level's mark: what stands over its time. */
  solvedMark: (level: number) => ReactNode;
  /** How many tiles stand in a row, where the game's levels do not make two rows of eight (Tobiishi's twenty-seven make three of nine). */
  across?: number;
  /** What a level is, in words a hover and a screen reader read after its number: the board it is on, where a number says too little. */
  describe?: (level: number) => string;
}) {
  return (
    <div
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${across}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={`Levels ${first} to ${last}`}
      data-testid={`${prefix}-levels`}
      data-size={size}
      data-open={open}
      data-block={block}
    >
      {Array.from({ length: last - first + 1 }, (_, at) => first + at).map((level) => {
        const time = best[level];
        const tries = attempts[level] ?? 0;
        const role = roleOf(level);
        const roleWords = role === null ? "" : role.role === "teaches" ? `, teaches ${role.words}` : ", the block's test";
        const triesWords = tries === 0 ? "" : `, ${tries} ${tries === 1 ? "attempt" : "attempts"}`;
        const aboutWords = describe === undefined ? "" : `, ${describe(level)}`;
        const solved = time !== undefined;
        // A level solved is never locked: a board solved before the levels were renumbered may sit in a block not yet open, and it is still yours.
        const locked = level > open && !solved;
        const ring = level === chosen ? "ring-2 ring-moss" : level === next ? "ring-2 ring-ochre" : "";
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={level === chosen}
            onClick={() => onChoose(level)}
            className={`relative flex min-h-12 flex-col items-center justify-center rounded-sm border border-rule-strong/60 bg-ivory px-0.5 py-1 text-sm font-semibold tabular-nums leading-none ${locked ? "text-muted" : "text-ink"} ${ring} hover:bg-paper focus-visible:outline-2 focus-visible:outline-moss`}
            aria-label={`Level ${level}${solved ? `, solved in ${clockText(time)}` : locked ? ", locked" : level === next ? ", next" : ""}${roleWords}${triesWords}${aboutWords}`}
            title={`Level ${level}${solved ? `: best ${clockText(time)}` : locked ? ": locked" : ""}${roleWords}${triesWords}${aboutWords}`}
            data-testid={`${prefix}-level`}
            data-level={level}
            data-state={solved ? "solved" : locked ? "locked" : "open"}
            data-attempts={tries}
            data-role={role?.role}
          >
            {role === null ? null : (
              <span
                className={`absolute -top-1 -right-1 rounded-sm px-0.5 text-[0.5rem] font-bold uppercase ${role.role === "tests" ? "bg-shu text-paper" : "bg-ochre text-ink"}`}
                data-testid={`${prefix}-level-role`}
              >
                {role.role === "teaches" ? "New" : "Test"}
              </span>
            )}
            {solved ? (
              <>
                {solvedMark(level)}
                <span className="mt-0.5 text-[0.55rem] font-normal" data-testid={`${prefix}-level-time`}>
                  {clockText(time)}
                </span>
              </>
            ) : (
              <>
                <span className={locked ? "opacity-60" : ""}>{level}</span>
                {locked ? (
                  <svg viewBox="0 0 10 12" className="mt-0.5 h-2 w-2" aria-hidden="true" data-testid={`${prefix}-level-lock`}>
                    <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="1" y="5" width="8" height="6.5" rx="1" fill="currentColor" />
                  </svg>
                ) : null}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
