import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { gamePath, rulesPath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzleSetUp } from "./PuzzleSetUp";

/**
 * /games/<slug>/new for a puzzle: the heading, then the size and the level.
 *
 * Gated like a game's set-up (`OPEN_PATTERNS` in proxy.ts leaves `/new` shut),
 * so a stranger reads the rules and is invited in; a member arrives here from
 * the puzzle's Solve button and leaves for the solve with the choice in the
 * address.
 */
export function PuzzleSetUpPage({ kind }: { kind: PuzzleKind }) {
  const copy = PUZZLE_DISPLAY[kind];
  return (
    <Page gap="gap-6">
      <SiteHeader />
      <header className="flex flex-col gap-1">
        <p className="text-xs text-muted">
          <Link href={gamePath(kind)} className="underline-offset-2 hover:underline" data-testid="set-up-up">
            {copy.label}
          </Link>{" "}
          / Set up
        </p>
        <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
          Solve {copy.label}
          <span className="font-mincho text-base font-normal opacity-70">{copy.kanji}</span>
        </h1>
        <p className="text-sm text-muted">
          {copy.tagline}{" "}
          <Link href={rulesPath(kind)} className="underline underline-offset-2">
            The rules <span className="font-mincho">規則</span>
          </Link>
        </p>
      </header>
      <PuzzleSetUp kind={kind} />
    </Page>
  );
}
