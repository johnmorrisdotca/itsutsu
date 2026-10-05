import type { MeikyuuMode, MeikyuuShape } from "@johnmorrisdotca/meikyuu";

import { MEIKYUU_LEVELS_A_SIZE } from "@/lib/puzzles/meikyuu/levelCounts";
import { MEIKYUU_SIZE_WORDS } from "@/lib/puzzles/meikyuu/sizes";

import type { LevelChipsCopy } from "./LevelChips";

/**
 * Meikyuu's screen: the words it says. One constants module for the Meikyuu
 * components. The package's own words for its shapes and ways to play
 * (`MEIKYUU_STRINGS`) are for a page of its own; these are the site's, in the
 * plain English of the glossary (`docs/plans/plain-english/GLOSSARY.md`).
 */

/** What a maze is cut from, as a chip on a level and the line a hover or a tap shows. */
export const MEIKYUU_SHAPE_COPY: Record<MeikyuuShape, { label: string; kanji: string; says: string }> = {
  square: { label: "Square", kanji: "四角", says: "Square cells, in columns and rows." },
  hex: { label: "Hex", kanji: "六角", says: "Hexagonal cells, six neighbours each, every other row shifted." },
  triangle: { label: "Triangle", kanji: "三角", says: "Triangular cells pointing up and down in turn, three neighbours each." },
  circle: { label: "Circle", kanji: "円", says: "Rings round a middle cell, the outer rings with more cells than the inner." },
  heart: { label: "Heart", kanji: "ハート", says: "Square cells inside the outline of a heart." },
  leaf: { label: "Leaf", kanji: "葉", says: "Square cells inside the outline of a leaf." },
  star: { label: "Star", kanji: "星", says: "Square cells inside the outline of a star." },
  ring: { label: "Ring", kanji: "輪", says: "Square cells in a ring, round a hole in the middle." },
  diamond: { label: "Diamond", kanji: "菱", says: "Square cells inside a diamond." },
  cross: { label: "Cross", kanji: "十字", says: "Square cells in the shape of a cross." },
  moon: { label: "Moon", kanji: "月", says: "Square cells in the shape of a crescent moon." },
  hexagon: { label: "Hexagon", kanji: "六角形", says: "Hexagonal cells, in the shape of one big hexagon." },
  pyramid: { label: "Pyramid", kanji: "ピラミッド", says: "Triangular cells, in the shape of one big triangle." },
};

/** The four ways to play a maze: where the line starts and where it has to get to. */
export const MEIKYUU_WAY_COPY: Record<MeikyuuMode, { label: string; kanji: string; says: string }> = {
  "enter-leave": { label: "In and out", kanji: "出入り", says: "In at one door in the outer wall, out at another, the two as far apart as the maze allows." },
  "to-goal": { label: "Find the goal", kanji: "探索", says: "From a cell inside the maze to a dot hidden deep in it." },
  "centre-out": { label: "Out from the middle", kanji: "中心から", says: "From the middle of the shape out through a door in the outer wall." },
  keys: { label: "Keys", kanji: "鍵", says: "From inside, picking up every key on the way to a door in the outer wall. A key is at the end of a branch, so each costs a detour. It is picked up by passing over it, and stays picked up when you draw back." },
};

/** The row of chips under a level (`LevelChips`): what its difficulty mark measures. The package's lists have no lessons, so a level is never a block's 15th or 16th. The marks are the score in fifths. */
export const MEIKYUU_CHIPS: LevelChipsCopy = {
  difficulty: {
    label: "Difficulty",
    says: "How hard this level is to play, on a scale of 0 to 100: how long the way through is, how many forks it has, how often heading straight for the goal goes wrong, and how far the wrong turns go.",
  },
  teaches: { says: "" },
  tests: { label: "", kanji: "", says: "" },
};

/** A choice of words in a row of a few: a pill a thumb can hit, in the set-up's ink when chosen (`PICK_CHIP_OPEN`). */
export const MEIKYUU_CHOICE = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss cursor-pointer";

/** Which way up a tall maze is shown (`meikyuu/turn.ts`): the chooser's words. Auto decides from the room there is, which on a phone held upright is upright. */
export const WAY_UP_COPY = {
  legend: "Tall mazes, which way up",
  auto: { label: "Auto", says: "Upright on a phone held upright, and lying on its side where the screen is wide enough for it to be bigger that way." },
  portrait: { label: "Upright", says: "Always stood up, two columns to three rows, as the maze was made." },
  landscape: { label: "Lying down", says: "Always on its side, a quarter turn, which fits a wide screen. The line you draw is the same line either way up." },
} as const;

/** The set-up's choice of the way a maze is shaped: the four sizes of squares and shapes, or the tall mazes for a phone held upright. */
export const SHAPE_COPY = {
  legend: "Shape",
  square: { label: "Square", kanji: "四角", says: "Mazes in a square box: four sizes, from small to huge." },
  tall: { label: "Tall", kanji: "縦", says: "Mazes in a tall box, two columns to three rows, made to be played on a phone held upright. They lie on their side on a wide screen." },
  moreTall: (to: string) => `Bigger, to ${to} →`,
  lessTall: (from: string) => `← Smaller, from ${from}`,
} as const;

export const MEIKYUU_COPY = {
  /** The set-up's note under the levels' options: what a level is. */
  levelsNote:
    `A level is a maze, the same for everybody, and each size has ${MEIKYUU_LEVELS_A_SIZE} levels in order from easy to hard. Pick any of them: Start plays the first one you have not solved. A level has no hint and no clock, so a time on it is one anybody can be compared with.`,
  /** The front door's line for the levels: how many there are of each size, read from the sizes and never typed. */
  levelsLine: `${MEIKYUU_LEVELS_A_SIZE} levels in each of four sizes (${MEIKYUU_SIZE_WORDS.join(", ")}) and in each of six tall ones for a phone held upright, each size easy to hard.`,
  /** The line under the board before the first stroke. */
  howTo: "Press the start dot and drag. The line follows the corridors, and drawing back shortens it.",
  /** The line under the board once there is a line: how far it has got. */
  status: (cells: number, keys: number, keysOf: number): string => {
    const drawn = `${cells} ${cells === 1 ? "cell" : "cells"} drawn.`;
    return keysOf === 0 ? drawn : `${drawn} ${keys} of ${keysOf} ${keysOf === 1 ? "key" : "keys"} picked up.`;
  },
} as const;
