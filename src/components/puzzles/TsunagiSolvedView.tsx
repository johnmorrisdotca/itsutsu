"use client";

import type { ReactNode } from "react";

import Link from "@/components/ui/Link";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import type { LinkLayout } from "@/lib/puzzles/tsunagi/code";
import type { Lines } from "@/lib/puzzles/tsunagi/lines";

import { SolveTime } from "./SolveTime";
import { TsunagiGrid } from "./TsunagiGrid";
import { TsunagiViewport } from "./TsunagiViewport";
import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";

/**
 * A LEVEL ALREADY SOLVED, OPENED AGAIN: its board as it was solved, not a
 * fresh one. John, 2026-09-26: "opening a level already completed should show
 * that game, solved, not a fresh board. Only a Restart press starts it
 * again." The lines are the level's answer drawn back (`linesOfAnswer`) — a
 * level has one answer, so it is the board the player finished — with their
 * best time and their attempts beside it, Restart to play it again, and the
 * way on to the next level not yet solved.
 */
export function TsunagiSolvedView({
  layout,
  lines,
  marks,
  fill,
  theme,
  best,
  attempts,
  next,
  all,
  onRestart,
  under = null,
}: {
  layout: LinkLayout;
  lines: Lines;
  marks: TsunagiMarks;
  fill: TsunagiFill;
  theme: BoardThemeTokens;
  /** The player's best time on it, and the solve it was where the account keeps it (a visitor's is only in their browser). */
  best: { elapsedMs: number; solveId: string | null } | null;
  attempts: number;
  next: { href: string; label: string } | null;
  all: { href: string; label: string };
  onRestart: () => void;
  /** What sits directly under the board: the level's row of chips. */
  under?: ReactNode;
}) {
  return (
    <>
      <TsunagiViewport size={layout.size}>
        <TsunagiGrid layout={layout} lines={lines} marks={marks} fill={fill} theme={theme} done readOnly />
      </TsunagiViewport>
      {under}
      <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="tsunagi-solved-already">
        <p className="text-sm">
          You have solved this level
          {best === null ? null : (
            <>
              , at best in <SolveTime kind="tsunagi" solveId={best.solveId} elapsedMs={best.elapsedMs} mine testId="tsunagi-best-time" />
            </>
          )}
          . This is your finished board.
        </p>
        <p className="flex flex-wrap gap-2">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onRestart} data-testid="tsunagi-restart-solved">
            Restart
          </button>
          {next === null ? null : (
            <Link href={next.href} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-next-level">
              {next.label}
            </Link>
          )}
          <Link href={all.href} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-all-levels">
            {all.label}
          </Link>
        </p>
        <p className="text-xs text-muted">
          Restart plays it again from an empty board{attempts > 0 ? `; it will be attempt ${attempts + 1}` : ""}.
        </p>
      </div>
    </>
  );
}
