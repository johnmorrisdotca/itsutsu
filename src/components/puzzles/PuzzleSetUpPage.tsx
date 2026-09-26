import Link from "@/components/ui/Link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { appearanceFor } from "@/lib/auth/memberAccount";
import { gamePath, playPath, rulesPath } from "@/lib/gomoku/slugs";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { PUZZLE_DISPLAY, PUZZLE_SPECS, drawnOnBoard } from "@/lib/puzzles/puzzles.constants";
import { tsunagiSolvedBy } from "@/lib/puzzles/server/tsunagiRecords";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { keptRunAsked, puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { latestRunOf } from "@/lib/puzzles/server/puzzleRuns";

import { dailyLanguageOf } from "@/lib/puzzles/dailyWords/dailyPools";
import { Suspense } from "react";

import { DailyWordButtonsLive, DailyWordButtonsShell } from "./DailyWordButtonsLive";
import { PuzzleSetUp } from "./PuzzleSetUp";
import { TsunagiSetUp } from "./TsunagiSetUp";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrail } from "@/components/games/GameTrail";

/**
 * /games/<slug>/new for a puzzle: the heading, then the size and the level.
 *
 * Gated like a game's set-up (`OPEN_PATTERNS` in proxy.ts leaves `/new` shut),
 * so a stranger reads the rules and is invited in; a member arrives here from
 * the puzzle's Play button and leaves for the solve with the choice in the
 * address.
 *
 * A puzzle drawn on the board itself (`wordGrid`: the Gomojis; `lattice`: Koushi) is previewed in
 * the reader's own board colour and style, and a puzzle played with stones
 * (`stones`) in the reader's own stone set, so the reader's board is read for
 * those, and for nothing else: every other puzzle is paper, and its page
 * reads no row.
 */
export async function PuzzleSetUpPage({
  kind,
  hasAccount,
  memberId,
  query = {},
}: {
  kind: PuzzleKind;
  hasAccount: boolean;
  memberId: string | null;
  /** The address's query: Tsunagi's `?size=` opens its board of levels at that size. */
  query?: Record<string, string | string[] | undefined>;
}) {
  const copy = PUZZLE_DISPLAY[kind];
  const onBoard = drawnOnBoard(kind);
  // One of this puzzle already going leads the Start column, as it leads the front door (`PuzzlePlayOrResume`).
  const run = memberId === null ? null : await latestRunOf(memberId, kind);
  const resumeHref = run === null ? null : `${playPath(kind)}${puzzleQuery(keptRunAsked(kind, run))}`;
  // The stone puzzles read the reader's stone set too, for the preview's stones.
  const [appearance, preferences] = onBoard
    ? await Promise.all([appearanceFor(memberId), preferencesFor()])
    : PUZZLE_SPECS[kind].stones === true
      ? [await appearanceFor(memberId), null]
      : [null, null];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        /* The puzzle's name, as a game's set-up is headed (`SetUpHeading`): Play was the press that led here, and Start is the one below. */
        title={copy.label}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind), testId: "set-up-up" }} steps={[{ label: "Set up" }]} />}
        lead={
          <>
            {copy.tagline}{" "}
            <Link href={rulesPath(kind)} className="underline underline-offset-4">
              How it is played
            </Link>
            .
          </>
        }
      />
      {kind === "tsunagi" ? (
        <TsunagiSetUp
          hasAccount={hasAccount}
          appearance={appearance ?? undefined}
          marksChosen={preferences?.tsunagiMarks ?? null}
          fillChosen={preferences?.tsunagiFill ?? null}
          solved={memberId === null ? {} : bestTimes(await tsunagiSolvedBy(memberId))}
          initialSize={sizeAsked(kind, query)}
          resumeHref={resumeHref}
        />
      ) : (
        <WordStyleProvider initial={preferences?.wordStyle ?? WORD_STYLES.reversi} saves={hasAccount}>
          <PuzzleSetUp kind={kind} hasAccount={hasAccount} appearance={appearance ?? undefined} asked={puzzleAsked(kind, query)} resumeHref={resumeHref} />
        </WordStyleProvider>
      )}
      {dailyLanguageOf(kind) !== null ? (
        /* Today's word at each length, a button each, under the choosing of any other, so the chooser above never moves (`DailyWordButtons`). */
        <Suspense fallback={<DailyWordButtonsShell kind={kind} framed />}>
          <DailyWordButtonsLive kind={kind} framed />
        </Suspense>
      ) : null}
    </Page>
  );
}

/** The size an address asks for, where the puzzle has it; the puzzle's own default otherwise. */
function sizeAsked(kind: PuzzleKind, query: Record<string, string | string[] | undefined>): number {
  const asked = Number(Array.isArray(query.size) ? query.size[0] : query.size);
  return PUZZLE_SPECS[kind].sizes.includes(asked) ? asked : PUZZLE_SPECS[kind].defaultSize;
}

/** A member's solved Tsunagi levels as the board of levels reads them: each level's best time. */
function bestTimes(solved: Awaited<ReturnType<typeof tsunagiSolvedBy>>): Record<number, Record<number, number>> {
  return Object.fromEntries(
    Object.entries(solved).map(([size, levels]) => [size, Object.fromEntries(Object.entries(levels).map(([level, best]) => [level, best.elapsedMs]))]),
  );
}
