import Link from "next/link";

import { PageTitle } from "@/components/layout/Headings";
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
export function PuzzleSetUpPage({ kind, hasAccount }: { kind: PuzzleKind; hasAccount: boolean }) {
  const copy = PUZZLE_DISPLAY[kind];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`Solve ${copy.label}`}
        kanji={copy.kanji}
        crumb={
          <>
            <Link href={gamePath(kind)} className="underline-offset-2 hover:underline" data-testid="set-up-up">
              {copy.label}
            </Link>{" "}
            / Set up
          </>
        }
        lead={
          <>
            {copy.tagline}{" "}
            <Link href={rulesPath(kind)} className="underline underline-offset-2">
              The rules <span className="font-mincho">規則</span>
            </Link>
          </>
        }
      />
      <PuzzleSetUp kind={kind} hasAccount={hasAccount} />
    </Page>
  );
}
