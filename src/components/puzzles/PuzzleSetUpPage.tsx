import Link from "@/components/ui/Link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { appearanceFor } from "@/lib/auth/memberAccount";
import { listedGameOf } from "@/lib/catalogue/gameSettings";
import { gamePath, joinQuery, playPath, rulesPath } from "@/lib/gomoku/slugs";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { PUZZLE_DISPLAY, PUZZLE_SPECS, drawnOnBoard } from "@/lib/puzzles/puzzles.constants";
import { meikyuuSolvedBy } from "@/lib/puzzles/server/meikyuuRecords";
import { isMeikyuuSize, meikyuuSizeFromAddress } from "@/lib/puzzles/meikyuu/sizes";
import { tobiishiSolvedBy } from "@/lib/puzzles/server/tobiishiRecords";
import { isTobiishiSize } from "@/lib/puzzles/tobiishi/sizes";
import { suidoSolvedBy } from "@/lib/puzzles/server/suidoRecords";
import { tsunagiAttemptsBy, tsunagiSolvedBy } from "@/lib/puzzles/server/tsunagiRecords";
import { suidoModeOf } from "@/lib/puzzles/suido/mode";
import { suidoSizeFromAddress } from "@/lib/puzzles/suido/sizes";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { keptRunAsked, puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { latestRunOf } from "@/lib/puzzles/server/puzzleRuns";

import { dailyLanguageOf } from "@/lib/puzzles/dailyWords/dailyPools";
import { Suspense } from "react";

import { DailyWordButtonsLive, DailyWordButtonsShell } from "./DailyWordButtonsLive";
import { PuzzleSetUp } from "./PuzzleSetUp";
import { MeikyuuSetUp } from "./MeikyuuSetUp";
import { TobiishiSetUp } from "./TobiishiSetUp";
import { SuidoModeSwitch } from "./SuidoModeSwitch";
import { SuidoSetUp } from "./SuidoSetUp";
import { TsunagiSetUp } from "./TsunagiSetUp";
import { MeikyuuAccountLook } from "./MeikyuuAccountLook";
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
  // One Gomoji, whatever its language: its name, its front door and its rules are the game's (`gameSettings.ts`).
  const copy = PUZZLE_DISPLAY[listedGameOf(kind)];
  const onBoard = drawnOnBoard(kind);
  // One of this puzzle already going leads the Start column, as it leads the front door (`PuzzlePlayOrResume`).
  const run = memberId === null ? null : await latestRunOf(memberId, kind);
  const resumeHref = run === null ? null : joinQuery(playPath(kind), puzzleQuery(keptRunAsked(kind, run)));
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
              How to play
            </Link>
            .
          </>
        }
      />
      {/* Suido is played two ways, each its own screen under this switch: its levels first, and Make a board, a new one from a seed (`SuidoModeSwitch`). */}
      {kind === "suido" ? <SuidoModeSwitch mode={suidoModeOf(query)} size={suidoSizeAsked(query)} /> : null}
      {kind === "suido" && suidoModeOf(query) === "levels" ? (
        <SuidoSetUp
          hasAccount={hasAccount}
          {...(memberId === null ? { solved: {} } : setUpSuidoSolves(await suidoSolvedBy(memberId)))}
          initialSize={suidoSizeAsked(query)}
          resumeHref={resumeHref}
        />
      ) : kind === "meikyuu" ? (
        <>
          <MeikyuuAccountLook />
          <MeikyuuSetUp
            hasAccount={hasAccount}
            {...(memberId === null ? { solved: {} } : setUpSuidoSolves(await meikyuuSolvedBy(memberId)))}
            initialSize={meikyuuSizeAsked(query)}
            resumeHref={resumeHref}
          />
        </>
      ) : kind === "tobiishi" ? (
        <TobiishiSetUp
          hasAccount={hasAccount}
          {...(memberId === null ? { solved: {} } : setUpSuidoSolves(await tobiishiSolvedBy(memberId)))}
          initialSize={tobiishiSizeAsked(query)}
          resumeHref={resumeHref}
        />
      ) : kind === "tsunagi" ? (
        <TsunagiSetUp
          hasAccount={hasAccount}
          appearance={appearance ?? undefined}
          marksChosen={preferences?.tsunagiMarks ?? null}
          fillChosen={preferences?.tsunagiFill ?? null}
          explosionsChosen={preferences?.tsunagiExplosions ?? null}
          cheatsChosen={preferences?.tsunagiCheats ?? null}
          {...(memberId === null ? { solved: {}, closed: {}, bestSolves: {} } : setUpSolves(await tsunagiSolvedBy(memberId)))}
          attempts={memberId === null ? {} : await tsunagiAttemptsBy(memberId)}
          initialSize={sizeAsked(kind, query)}
          initialSet={(Array.isArray(query.set) ? query.set[0] : query.set) === "portals" ? "portals" : "classic"}
          resumeHref={resumeHref}
        />
      ) : (
        <WordStyleProvider initial={preferences?.wordStyle ?? WORD_STYLES.reversi} saves={hasAccount}>
          <PuzzleSetUp kind={kind} hasAccount={hasAccount} appearance={appearance ?? undefined} asked={setUpAsked(kind, query)} resumeHref={resumeHref} />
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

/**
 * A member's solved Tsunagi levels as the board of levels reads them: each
 * level's best time, and the levels solved only in a way that opens nothing
 * (explosions off, `solveHelp.ts`) — shown solved, never counted to open a block.
 */
function setUpSolves(solved: Awaited<ReturnType<typeof tsunagiSolvedBy>>): {
  solved: Record<number, Record<number, number>>;
  closed: Record<number, number[]>;
  bestSolves: Record<number, Record<number, string>>;
} {
  const entries = Object.entries(solved);
  return {
    // Each level's best solve, which its time on the preview opens.
    bestSolves: Object.fromEntries(entries.map(([size, levels]) => [size, Object.fromEntries(Object.entries(levels).map(([level, best]) => [level, best.solveId]))])),
    solved: Object.fromEntries(entries.map(([size, levels]) => [size, Object.fromEntries(Object.entries(levels).map(([level, best]) => [level, best.elapsedMs]))])),
    closed: Object.fromEntries(entries.map(([size, levels]) => [size, Object.entries(levels).flatMap(([level, best]) => (best.opens ? [] : [Number(level)]))])),
  };
}

/** The size a Meikyuu set-up opens on: any of its four, as `2`, or a tall one, as `6x9`; the puzzle's usual otherwise. */
function meikyuuSizeAsked(query: Record<string, string | string[] | undefined>): number {
  const text = Array.isArray(query.size) ? query.size[0] : query.size;
  const asked = text === undefined ? null : meikyuuSizeFromAddress(text);
  return asked !== null && isMeikyuuSize(asked) ? asked : PUZZLE_SPECS.meikyuu.defaultSize;
}

/** The length a Tobiishi set-up opens on: any of its three, as `6`; the puzzle's usual otherwise. */
function tobiishiSizeAsked(query: Record<string, string | string[] | undefined>): number {
  const asked = Number(Array.isArray(query.size) ? query.size[0] : query.size);
  return isTobiishiSize(asked) ? asked : PUZZLE_SPECS.tobiishi.defaultSize;
}

/** The size a Suido levels' set-up opens on: any of the sixteen the levels come in, as `7` or `5x7`; the puzzle's usual otherwise. */
function suidoSizeAsked(query: Record<string, string | string[] | undefined>): number {
  const text = Array.isArray(query.size) ? query.size[0] : query.size;
  const asked = text === undefined ? null : suidoSizeFromAddress(text);
  return asked !== null && PUZZLE_SPECS.suido.sizes.includes(asked) ? asked : PUZZLE_SPECS.suido.defaultSize;
}

/**
 * What the puzzle's own set-up opens on: the address's choice, except that a Suido's "Make a board" offers four
 * boards and an address naming another size of its levels (a 14×14, a 5×7) opens on the usual one.
 */
function setUpAsked(kind: PuzzleKind, query: Record<string, string | string[] | undefined>): ReturnType<typeof puzzleAsked> {
  const asked = puzzleAsked(kind, query);
  return kind === "suido" && !PUZZLE_SPECS.suido.offered.includes(asked.size) ? { ...asked, size: PUZZLE_SPECS.suido.defaultSize } : asked;
}

/** A member's solved Suido, Meikyuu or Tobiishi levels as the board of levels reads them: each level's best time, and the solve it was, which its time opens. */
function setUpSuidoSolves(solved: Awaited<ReturnType<typeof suidoSolvedBy>> | Awaited<ReturnType<typeof meikyuuSolvedBy>> | Awaited<ReturnType<typeof tobiishiSolvedBy>>): { solved: Record<number, Record<number, number>>; bestSolves: Record<number, Record<number, string>> } {
  const entries = Object.entries(solved);
  return {
    bestSolves: Object.fromEntries(entries.map(([size, levels]) => [size, Object.fromEntries(Object.entries(levels).map(([level, best]) => [level, best.solveId]))])),
    solved: Object.fromEntries(entries.map(([size, levels]) => [size, Object.fromEntries(Object.entries(levels).map(([level, best]) => [level, best.elapsedMs]))])),
  };
}
