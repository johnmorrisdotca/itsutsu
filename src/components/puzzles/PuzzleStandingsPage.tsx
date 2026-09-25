import Link from "next/link";
import { Suspense } from "react";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath, myGamePath, rulesPath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { fastestSolvesOf, memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";

import { FastestTable } from "./PuzzleFastest";
import { PuzzlePoints } from "./PuzzlePoints";

/**
 * /games/<slug>/standings for a puzzle: the whole leaderboard, all time and
 * this month (`PuzzlePoints`), then the fastest solves at every size and level. Members only, as every ladder is — the gate
 * leaves `/standings` shut — so nobody's name is printed to a stranger.
 */
export async function PuzzleStandingsPage({ kind }: { kind: PuzzleKind }) {
  const copy = PUZZLE_DISPLAY[kind];
  const board = await fastestSolvesOf(kind);
  const names = await memberNamesOf([...board.values()].flatMap((row) => row.fastest.map((solve) => solve.memberId)));
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={copy.label}
        kanji={copy.kanji}
        crumb={
          <>
            <Link href={gamePath(kind)} className="underline-offset-2 hover:underline">
              {copy.label}
            </Link>{" "}
            / Standings
          </>
        }
        lead="Everybody's points at it, all time and this month, then the fastest solves at every size and level. A solve on your own is timed by your browser; a race by the site."
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={rulesPath(kind)} className="text-muted underline-offset-2 hover:underline">rules</Link>
          <Link href={myGamePath(kind)} className="text-muted underline-offset-2 hover:underline">your solves</Link>
          <Link href={setUpPath(kind)} className="text-muted underline-offset-2 hover:underline">play one</Link>
        </p>
      </PageTitle>
      <Suspense fallback={null}>
        <PuzzlePoints kind={kind} title={copy.label} whole />
      </Suspense>
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-standings">
        <FastestTable kind={kind} board={board} names={names} whole />
      </section>
    </Page>
  );
}
