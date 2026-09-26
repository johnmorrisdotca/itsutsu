"use client";

import Link from "@/components/ui/Link";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { playPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { blockRange, TSUNAGI_BLOCK } from "@/lib/puzzles/tsunagi/levelBlocks";
import { TSUNAGI_LEVEL_COUNTS, tsunagiBand } from "@/lib/puzzles/tsunagi/levels";

import { PuzzleBoard } from "./PuzzleBoard";
import { TSUNAGI_MARBLE, tsunagiMarbleLook, type TsunagiMarks } from "./puzzles.constants";

/** A block's sixteen levels drawn four by four. */
const SIDE = Math.sqrt(TSUNAGI_BLOCK);

/** The address of one level: the solve's own, its number the seed. */
export function tsunagiLevelPath(size: number, level: number): string {
  return `${playPath("tsunagi")}${puzzleQuery({ size, level: tsunagiBand(size, level), seed: level })}`;
}

/**
 * THE BOARD OF LEVELS: one block of a size's levels, sixteen as a board of four
 * by four, its first level at the top left. John, 2026-09-26: "the level
 * should probably just show up in a game board where the top left level is
 * level one" — and then sixteen to a block, 256 a size, which a phone could
 * never hold at once, so the set-up shows a block at a time (`TsunagiSetUp`).
 * In the site's wood or felt (`PuzzleBoard`), with no letters or numbers down
 * its edges, since the cells carry their own.
 *
 * A cell is a level, in one of three states:
 *  - SOLVED: a marble sits on it in the block's colour, its number on the
 *    marble and the best time under it. Still a link, which opens it solved (`TsunagiSolvedView`).
 *  - OPEN: its number, a link to play it.
 *  - LOCKED: its number faint, a small lock, nothing to press. Blocks open
 *    sixteen at a time (`openTsunagiLevels`).
 */
export function TsunagiLevelBoard({
  size,
  block,
  best,
  attempts = {},
  open,
  next,
  marks,
  theme,
}: {
  size: number;
  /** Which block of sixteen is drawn, from 1. */
  block: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** How many times each level has been started, where it has. */
  attempts?: Record<number, number>;
  /** Levels 1 to this are open. */
  open: number;
  /** The level Start would play, ringed. */
  next: number;
  marks: TsunagiMarks;
  theme: BoardThemeTokens;
}) {
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  const { first, last } = blockRange(block, count);
  return (
    <div className="w-full select-none" data-testid="tsunagi-levels" data-size={size} data-open={open} data-block={block}>
      <PuzzleBoard size={SIDE} theme={theme} coordinates={false}>
        <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${SIDE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${SIDE}, minmax(0, 1fr))` }}>
          {Array.from({ length: last - first + 1 }, (_, at) => first + at).map((level) => {
            const time = best[level];
            const tries = attempts[level] ?? 0;
            const triesWords = tries === 0 ? "" : `, ${tries} ${tries === 1 ? "attempt" : "attempts"}`;
            const solved = time !== undefined;
            // A level solved is never locked: a board solved before the levels were renumbered may sit in a block not yet open, and it is still yours.
            const locked = level > open && !solved;
            const place = level - first;
            const row = Math.floor(place / SIDE);
            const common = {
              "data-testid": "tsunagi-level",
              "data-level": level,
              "data-state": solved ? "solved" : locked ? "locked" : "open",
              "data-attempts": tries,
            };
            // Each cell rules its right and bottom; the first row and column rule their top and left too, so the grid is closed
            // on all four sides (John, 2026-09-26: "missing the TOP and LEFT borders").
            const edges = `${row === 0 ? "border-t" : ""} ${place % SIDE === 0 ? "border-l" : ""}`;
            const rules = `relative flex flex-col items-center justify-center border-r border-b ${edges} text-sm font-semibold tabular-nums leading-none sm:text-base`;
            const ruled = { borderColor: `color-mix(in srgb, ${theme.line} 45%, transparent)` };
            if (locked) {
              return (
                <div key={level} className={`${rules} opacity-45`} style={{ ...ruled, color: theme.coordinate }} aria-label={`Level ${level}, locked`} {...common}>
                  <span>{level}</span>
                  <svg viewBox="0 0 10 12" className="mt-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5" aria-hidden="true" data-testid="tsunagi-level-lock">
                    <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="1" y="5" width="8" height="6.5" rx="1" fill="currentColor" />
                  </svg>
                </div>
              );
            }
            return (
              <Link
                key={level}
                href={tsunagiLevelPath(size, level)}
                className={`${rules} hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-moss ${level === next ? "ring-2 ring-inset ring-ochre" : ""}`}
                style={{ ...ruled, color: theme.dark ? "#f7f3ea" : "#2a1d0e" }}
                aria-label={solved ? `Level ${level}, solved in ${clockText(time)}${triesWords}` : `Level ${level}${level === next ? ", next" : ""}${triesWords}`}
                title={solved ? `Level ${level}: best ${clockText(time)}${triesWords}` : `Level ${level}${triesWords}`}
                {...common}
              >
                {solved ? (
                  <>
                    <span className={`${TSUNAGI_MARBLE} size-[50%] text-sm sm:text-base`} style={tsunagiMarbleLook(block - 1, marks)}>
                      {level}
                    </span>
                    <span className="mt-1 text-[0.6rem] font-normal sm:text-xs" data-testid="tsunagi-level-time">
                      {clockText(time)}
                    </span>
                  </>
                ) : (
                  level
                )}
              </Link>
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}
