"use client";

import Link from "@/components/ui/Link";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { playPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { CountdownKey } from "@/lib/puzzles/countdown";
import { TSUNAGI_LEVEL_COUNTS, TSUNAGI_ROW, tsunagiBand } from "@/lib/puzzles/tsunagi/levels";

import { PuzzleBoard } from "./PuzzleBoard";
import { TSUNAGI_MARBLE, tsunagiMarbleLook, type TsunagiMarks } from "./puzzles.constants";

/** The address of one level: the solve's own, its number the seed, and the countdown it is played against if one was chosen (`countdown.ts`). */
export function tsunagiLevelPath(size: number, level: number, countdown: CountdownKey | null = null): string {
  return `${playPath("tsunagi")}${puzzleQuery({ size, level: tsunagiBand(size, level), seed: level, ...(countdown === null ? {} : { countdown }) })}`;
}

/**
 * THE BOARD OF LEVELS: a size's hundred levels as a board of ten by ten, level
 * 1 at the top left and 100 at the bottom right. John, 2026-09-26: "the level
 * should probably just show up in a game board where the top left level is
 * level one". In the site's wood or felt (`PuzzleBoard`), with no letters or
 * numbers down its edges, since the cells carry their own.
 *
 * A cell is a level, in one of three states:
 *  - SOLVED: a marble sits on it, its number on the marble and the best time
 *    under it. Still a link, to play it again.
 *  - OPEN: its number, a link to play it.
 *  - LOCKED: its number faint, a small lock, nothing to press. Rows open ten
 *    at a time (`openTsunagiLevels`).
 */
export function TsunagiLevelBoard({
  size,
  best,
  open,
  next,
  marks,
  theme,
  countdown = null,
}: {
  size: number;
  /** The levels solved, each with its best time. */
  best: Record<number, number>;
  /** Levels 1 to this are open. */
  open: number;
  /** The level Start would play, ringed. */
  next: number;
  marks: TsunagiMarks;
  theme: BoardThemeTokens;
  /** The countdown chosen at set-up, which every level's link carries (`countdown.ts`). */
  countdown?: CountdownKey | null;
}) {
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;
  const side = Math.ceil(count / TSUNAGI_ROW);
  return (
    <div className="w-full select-none" data-testid="tsunagi-levels" data-size={size} data-open={open}>
      <PuzzleBoard size={TSUNAGI_ROW} theme={theme} coordinates={false}>
        <div
          className="grid h-full w-full"
          style={{ gridTemplateColumns: `repeat(${TSUNAGI_ROW}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${side}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: count }, (_, at) => at + 1).map((level) => {
            const time = best[level];
            const solved = time !== undefined;
            const locked = level > open;
            const row = Math.floor((level - 1) / TSUNAGI_ROW);
            const common = {
              "data-testid": "tsunagi-level",
              "data-level": level,
              "data-state": solved ? "solved" : locked ? "locked" : "open",
            };
            // Each cell rules its right and bottom; the first row and column rule their top and left too, so the grid is closed
            // on all four sides (John, 2026-09-26: "missing the TOP and LEFT borders").
            const edges = `${row === 0 ? "border-t" : ""} ${(level - 1) % TSUNAGI_ROW === 0 ? "border-l" : ""}`;
            const rules = `relative flex flex-col items-center justify-center border-r border-b ${edges} text-xs font-semibold tabular-nums leading-none sm:text-sm`;
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
                href={tsunagiLevelPath(size, level, countdown)}
                className={`${rules} hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-moss ${level === next ? "ring-2 ring-inset ring-ochre" : ""}`}
                style={{ ...ruled, color: theme.dark ? "#f7f3ea" : "#2a1d0e" }}
                aria-label={solved ? `Level ${level}, solved in ${clockText(time)}` : `Level ${level}${level === next ? ", next" : ""}`}
                title={solved ? `Level ${level}: best ${clockText(time)}` : `Level ${level}`}
                {...common}
              >
                {solved ? (
                  <>
                    <span className={`${TSUNAGI_MARBLE} size-[62%] text-[0.62rem] sm:text-xs`} style={tsunagiMarbleLook(row, marks)}>
                      {level}
                    </span>
                    <span className="absolute bottom-[3%] hidden text-[0.5rem] font-normal sm:block" data-testid="tsunagi-level-time">
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
