import Link from "next/link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { appearanceFor } from "@/lib/auth/memberAccount";
import { gamePath, rulesPath } from "@/lib/gomoku/slugs";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzleSetUp } from "./PuzzleSetUp";
import { WordStyleProvider } from "./WordStyleContext";

/**
 * /games/<slug>/new for a puzzle: the heading, then the size and the level.
 *
 * Gated like a game's set-up (`OPEN_PATTERNS` in proxy.ts leaves `/new` shut),
 * so a stranger reads the rules and is invited in; a member arrives here from
 * the puzzle's Solve button and leaves for the solve with the choice in the
 * address.
 *
 * A puzzle drawn on the board itself (`wordGrid`: the Gomojis) is previewed in
 * the reader's own board colour and style, so those two are read for it, and
 * for nothing else: every other puzzle is paper, and its page reads no row.
 */
export async function PuzzleSetUpPage({ kind, hasAccount, memberId }: { kind: PuzzleKind; hasAccount: boolean; memberId: string | null }) {
  const copy = PUZZLE_DISPLAY[kind];
  const onBoard = PUZZLE_SPECS[kind].wordGrid !== undefined;
  const [appearance, preferences] = onBoard ? await Promise.all([appearanceFor(memberId), preferencesFor()]) : [null, null];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`Play ${copy.label}`}
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
      <WordStyleProvider initial={preferences?.wordStyle ?? WORD_STYLES.reversi} saves={false}>
        <PuzzleSetUp kind={kind} hasAccount={hasAccount} appearance={appearance ?? undefined} />
      </WordStyleProvider>
    </Page>
  );
}
