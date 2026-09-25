import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentReader } from "@/lib/auth/currentReader";
import { gamePath, rulesPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleAsked } from "@/lib/puzzles/puzzleAddress";
import { runOf } from "@/lib/puzzles/server/puzzleRuns";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzlePlayClient } from "./PuzzlePlayClient";

/**
 * /games/<slug>/play for a puzzle: the solve, at the size, level and seed the
 * address asks for. The server reads the query and who is reading, and
 * nothing else; the puzzle itself is made in the browser (`PuzzlePlay`).
 */
export async function PuzzlePlayPage({ kind, query }: { kind: PuzzleKind; query: Record<string, string | string[] | undefined> }) {
  const copy = PUZZLE_DISPLAY[kind];
  const asked = puzzleAsked(kind, query);
  const reader = await currentReader();
  /* The run this member kept of this very grid, if they left it unfinished: opened where it was left. One indexed read. */
  const kept = reader.memberId !== null && asked.seed !== null ? await runOf(reader.memberId, kind, asked.size, asked.level, asked.seed) : null;
  const resumed = kept === null ? null : { progress: kept.progress, elapsedMs: kept.elapsedMs, checksUsed: kept.checksUsed };
  return (
    <Page>
      <SiteHeader />
      {/*
        A board page, like a game's: the grid is the page and there is no title
        over it (see NO_TITLE in pageShape.coverage.test.ts). The trail stays,
        because it is the way back to the puzzle and its set-up.
      */}
      <nav aria-label="Where this puzzle is" className="flex flex-col gap-1">
        <p className="text-xs text-muted">
          <Link href={gamePath(kind)} className="underline-offset-2 hover:underline" data-testid="play-up">
            {copy.label}
          </Link>{" "}
          /{" "}
          <Link href={setUpPath(kind)} className="underline-offset-2 hover:underline">
            Set up
          </Link>{" "}
          / Solve
        </p>
      </nav>
      <div className="mx-auto w-full max-w-xl" data-width-reason="a puzzle grid wider than a hand is a grid nobody can reach across">
        <PuzzlePlayClient kind={kind} size={asked.size} level={asked.level} seed={asked.seed} checks={asked.checks ?? null} resumed={resumed} hasAccount={reader.hasAccount} />
      </div>
      <footer className="border-t border-rule pt-5 text-sm text-muted">
        <p>
          {copy.tagline}{" "}
          <Link href={rulesPath(kind)} className="underline underline-offset-4">
            Rules
          </Link>
          .
        </p>
      </footer>
    </Page>
  );
}
