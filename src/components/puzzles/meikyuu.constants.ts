import type { MeikyuuMode, MeikyuuShape } from "@johnmorrisdotca/meikyuu";

import { MEIKYUU_COLOSSAL_LEVELS_A_SIZE, MEIKYUU_LEVELS_A_SIZE, MEIKYUU_SOLID_LEVELS_A_SIZE } from "@/lib/puzzles/meikyuu/levelCounts";
import { MEIKYUU_SIZE_WORDS, MEIKYUU_SOLID_STEPS, type MeikyuuSolidKind, type MeikyuuSolidStep } from "@/lib/puzzles/meikyuu/sizes";

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

/** The solids a maze can be over (`meikyuu/sizes.ts`), as a chip on a level: what each is, and how its surface is cut into cells. */
export const MEIKYUU_SOLID_COPY: Record<MeikyuuSolidKind, { label: string; kanji: string; says: string }> = {
  cube: { label: "Cube", kanji: "立方体", says: "Six square faces, each cut into squares, joined across every edge: four ways out of every cell." },
  sphere: { label: "Sphere", kanji: "球", says: "A globe cut into hexagons, like a football, with twelve pentagons for corners: six ways out of a cell, five at a corner." },
  octahedron: { label: "Octahedron", kanji: "八面体", says: "Eight triangular faces, each cut into small triangles: three ways out of every cell." },
  icosahedron: { label: "Icosahedron", kanji: "二十面体", says: "Twenty triangular faces, each cut into small triangles: three ways out of every cell." },
};

/** How a maze over a solid is played, as the chip where a flat maze says its way to play. */
export const MEIKYUU_SURFACE_COPY = { label: "Over the surface", kanji: "表面", says: "From a cell on one side of the solid to a dot far across it, over the whole surface. Turn the solid to follow your line: it turns by itself when the line reaches the edge of the side you can see." } as const;

/** The three steps of a solid, as the set-up's choice of size under its tiles reads them. */
export const SOLID_STEP_COPY: Record<MeikyuuSolidStep, { label: string; says: string }> = {
  small: { label: "Small", says: "About a hundred cells: the quick ones." },
  medium: { label: "Medium", says: "About three hundred cells." },
  large: { label: "Large", says: "About six hundred and fifty cells: they take a while, and want the solid turned again and again." },
};

/**
 * TURNING A SOLID, in the plain English of the glossary (`docs/plans/plain-english/GLOSSARY.md`): "Turn" for the solid, "Face me" for bringing the end of the line
 * round to the front, and "Turn only" for the press that makes every drag turn the solid, as Move makes every drag move a zoomed maze.
 */
export const TURN_COPY = {
  legend: "Turn the solid",
  left: "Turn left",
  right: "Turn right",
  up: "Turn up",
  down: "Turn down",
  faceMe: "Face me",
  faceMeSays: "Turn the solid so that the end of your line faces you. With no line yet it is the start.",
  only: "Turn only",
  onlySays: "While it is on, a finger turns the solid wherever it drags and draws nothing. Press it again to draw. Dragging away from the end of your line turns the solid anyway.",
  /** The line under the board before the first stroke, for a maze over a solid. */
  howTo: "Press the green start and drag along the passages. Drag away from your line, or press the arrows, to turn the solid; it turns by itself when your line reaches the edge of the side you can see. Face me brings the end of the line to the front.",
} as const;

/** The solid's steps in order, as the chips under the tiles run. */
export const SOLID_STEPS = MEIKYUU_SOLID_STEPS;

/** The row of chips under a level (`LevelChips`): what its difficulty mark measures. The package's lists have no lessons, so a level is never a block's 15th or 16th. The marks are the score in fifths. */
export const MEIKYUU_CHIPS: LevelChipsCopy = {
  difficulty: {
    label: "Difficulty",
    says: "How hard this level is to play, on a scale of 0 to 100: how long the way through is, how many forks it has, how often heading straight for the goal goes wrong, how far the wrong turns go, and how much of the map the way crosses. A way that stays in one corner counts for less.",
  },
  teaches: { says: "" },
  tests: { label: "", kanji: "", says: "" },
};

/** A choice of words in a row of a few: a pill a thumb can hit, in the set-up's ink when chosen (`PICK_CHIP_OPEN`). */
export const MEIKYUU_CHOICE = "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss cursor-pointer";

/** Which way up a tall maze is shown (`meikyuu/turn.ts`): the chooser's words. Auto decides from the room there is, which on a phone held upright is upright. */
export const WAY_UP_COPY = {
  legend: "Tall mazes, which way up",
  auto: { label: "Auto", says: "Upright on a phone held upright, and lying on its side where the screen is wide enough for it to be bigger that way." },
  portrait: { label: "Upright", says: "Always stood up, two columns to three rows, as the maze was made." },
  landscape: { label: "Lying down", says: "Always on its side, a quarter turn, which fits a wide screen. The line you draw is the same line either way up." },
} as const;

/**
 * Finishing a size, in place of locks (John, 2026-10-02: "I like the small levels being all playable I think but encouraging
 * people to finish them all"): every level is open, a size shows how many of its levels are solved, and a size that is whole
 * is marked and cheered, in a line and never a window.
 */
export const PROGRESS_COPY = {
  legend: "Solved",
  of: (solved: number, count: number): string => `${solved} of ${count}`,
  whole: "All solved",
  /** The line over the preview's caption when the chosen size is whole. */
  cheer: (size: string, count: number): string => `Every ${size} level is solved: all ${count}. Well done!`,
  /** The line under a solved level that was the last of its size. */
  last: (size: string, count: number): string => `That was the last one: all ${count} ${size} levels are solved. Well done!`,
  /** The front door's line over a member's progress. */
  yours: "Your progress",
} as const;

/** The press that makes every one-finger drag move the view, for a hand that cannot find the line's end, and the switch for the view sliding when the line reaches the edge. */
export const MOVE_COPY = {
  press: "Move",
  says: "While it is on, a finger drags the view of a zoomed maze and draws nothing. Press it again to draw.",
  edge: {
    label: "Slide the view when the line reaches the edge",
    says: "On a zoomed maze, a line drawn to the edge of the board moves the view along with it, gently. Switch it off to move the view yourself, with Move or two fingers.",
  },
} as const;

/**
 * STONES, in the plain English of the glossary (`docs/plans/plain-english/GLOSSARY.md`): one word for the marble, "Stone", and "Stones left" for how many more
 * may be laid. John, who asked for them: "a helper to let you know that a given path is exhausted/useless/dead end... it has to be a carefully placed item that
 * you must lay adjacent to your existing path." So the words say where one goes (beside the line), and that it is a helper and not a pen.
 */
export const STONE_COPY = {
  press: "Stone",
  /** What the Stone press does, for its hover and its screen-reader name. */
  says: "Lay a stone: with it on, tap a cell beside your line to shut that passage, and the line cannot go in. Tap a stone to take it up. Press again to draw. A stone goes at most two cells along the passages from your line.",
  /** The line under the board while the Stone mode is on. */
  how: "Stone mode. Tap a cell beside your line, up to two cells along the passages from it, to lay a stone the line cannot enter. Tap a stone to take it up.",
  /** The other ways to lay one, said where the option is chosen and in the Stone press's hover. */
  other: "You can also hold a finger on a cell beside your line for half a second to lay a stone, or hold Shift and press an arrow key at the end of your line.",
  left: (n: number): string => `Stones left: ${n}`,
  /** With no limit there is no "left", so the count laid is said instead. */
  laid: (n: number): string => `Stones laid: ${n}`,
  /** The set-up's option: how many may lie at once. */
  legend: "Stones",
  limited: { label: "A few", says: "A few stones at once, more for a bigger maze: 4 for a small one, 9 for a huge one, 13 for a colossal one. Take one up and you have it back." },
  unlimited: { label: "As many as I like", says: "No limit on how many stones lie at once. They still go only beside your line." },
  note: "A stone is only for you: it is never part of your answer, and it is kept with your game, so it is still there when you come back.",
} as const;

/** The set-up's choice of the way a maze is shaped: the four sizes of squares and shapes, the tall mazes for a phone held upright, or the colossal ones, the biggest there are. */
export const SHAPE_COPY = {
  legend: "Shape",
  square: { label: "Square", kanji: "四角", says: "Mazes in a square box: four sizes, from small to huge." },
  tall: { label: "Tall", kanji: "縦", says: "Mazes in a tall box, two columns to three rows, made to be played on a phone held upright. They lie on their side on a wide screen." },
  colossal: { label: "Colossal", kanji: "巨", says: "The biggest mazes there are, about ten thousand cells: one in a square box and one in a tall one. Zoom in, and move about it." },
  solid: { label: "3D", kanji: "立体", says: "Mazes over the whole surface of a solid: a cube, a sphere, an octahedron or an icosahedron. Turn it to follow your line round." },
  stepLegend: "Size of the solid",
  moreTall: (to: string) => `Bigger, to ${to} →`,
  lessTall: (from: string) => `← Smaller, from ${from}`,
} as const;

export const MEIKYUU_COPY = {
  /** The set-up's note under the levels' options: what a level is. */
  levelsNote:
    `A level is a maze, the same for everybody, and each size has ${MEIKYUU_LEVELS_A_SIZE} levels in order from easy to hard (${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} for each colossal one, ${MEIKYUU_SOLID_LEVELS_A_SIZE} for each size of a solid). Pick any of them: Start plays the first one you have not solved. A level has no hint and no clock, so a time on it is one anybody can be compared with.`,
  /** The front door's line for the levels: how many there are of each size, read from the sizes and never typed. */
  levelsLine: `${MEIKYUU_LEVELS_A_SIZE} levels in each of four sizes (${MEIKYUU_SIZE_WORDS.join(", ")}) and in each of six tall ones for a phone held upright, each size easy to hard, ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} in each of two colossal ones of about ten thousand cells, and ${MEIKYUU_SOLID_LEVELS_A_SIZE} in each of three sizes of four solids to turn.`,
  /** The line under the board before the first stroke. */
  howTo: "Press the start dot and drag. The line follows the corridors, and drawing back shortens it. To shut a passage, press Stone and tap a cell beside your line, or hold a finger on it.",
  /** The line under the board once there is a line: how far it has got. */
  status: (cells: number, keys: number, keysOf: number): string => {
    const drawn = `${cells} ${cells === 1 ? "cell" : "cells"} drawn.`;
    return keysOf === 0 ? drawn : `${drawn} ${keys} of ${keysOf} ${keysOf === 1 ? "key" : "keys"} picked up.`;
  },
} as const;
