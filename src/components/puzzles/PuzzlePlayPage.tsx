import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentReader } from "@/lib/auth/currentReader";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { gamePath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { DAILY_PARAM, dailySeed } from "@/lib/puzzles/daily";
import { redirect } from "next/navigation";
import { puzzleRulesPage } from "@/lib/puzzles/puzzleRulesPage";
import { runOf } from "@/lib/puzzles/server/puzzleRuns";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzlePlayClient } from "./PuzzlePlayClient";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrailNav } from "@/components/games/GameTrail";

/**
 * /games/<slug>/play for a puzzle: the solve, at the size, level and seed the
 * address asks for. The server reads the query and who is reading, and
 * nothing else; the puzzle itself is made in the browser (`PuzzlePlay`).
 */
export async function PuzzlePlayPage({ kind, query }: { kind: PuzzleKind; query: Record<string, string | string[] | undefined> }) {
  const copy = PUZZLE_DISPLAY[kind];
  const rules = puzzleRulesPage(kind);
  const asked = puzzleAsked(kind, query);
  // Today's puzzle, asked for by `?daily=1`: resolved to the day's seed and an ordinary address (`daily.ts`).
  if (query[DAILY_PARAM] === "1" && asked.seed === null) redirect(`${playPath(kind)}${puzzleQuery({ ...asked, seed: dailySeed(new Date()) })}`);
  const reader = await currentReader();
  /* The run this member kept of this very grid, if they left it unfinished: opened where it was left. One indexed read. */
  const kept = reader.memberId !== null && asked.seed !== null ? await runOf(reader.memberId, kind, asked.size, asked.level, asked.seed) : null;
  const resumed = kept === null ? null : { progress: kept.progress, steps: kept.steps, elapsedMs: kept.elapsedMs, checksUsed: kept.checksUsed, hintsUsed: kept.hintsUsed };
  /* How a Gomoji grid is drawn, as this member last chose (`wordStyles.ts`); read only for the two Gomojis. */
  const { wordStyle } =
    kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" ? await preferencesFor() : { wordStyle: undefined };
  return (
    <Page>
      <SiteHeader />
      {/*
        A board page, like a game's: the grid is the page and there is no title
        over it (see NO_TITLE in pageShape.coverage.test.ts). The trail stays,
        because it is the way back to the puzzle and its set-up.
      */}
      <GameTrailNav
        game={{ label: copy.label, href: gamePath(kind), testId: "play-up" }}
        steps={[{ label: "Set up", href: setUpPath(kind) }, { label: "Play" }]}
      />
      <div className="mx-auto w-full max-w-xl" data-width-reason="a puzzle grid wider than a hand is a grid nobody can reach across">
        <WordStyleProvider initial={wordStyle ?? WORD_STYLES.reversi} saves={reader.hasAccount}>
          <PuzzlePlayClient kind={kind} size={asked.size} level={asked.level} seed={asked.seed} checks={asked.checks ?? null} hints={asked.hints === true} strict={asked.strict === true} resumed={resumed} hasAccount={reader.hasAccount} />
        </WordStyleProvider>
      </div>
      <footer className="border-t border-rule pt-5 text-sm text-muted">
        <p>
          {copy.tagline}{" "}
          {/* Over the puzzle, not a page away from it: see `RulesModal`. */}
          <RulesModal rules={{ title: rules.title, kanji: rules.kanji, object: rules.object, board: rules.board, play: rules.play, house: rules.house }} />.
        </p>
      </footer>
    </Page>
  );
}
