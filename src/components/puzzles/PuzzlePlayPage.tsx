import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { appearanceFor } from "@/lib/auth/members";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { gamePath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { DAILY_PARAM, dailySeed } from "@/lib/puzzles/daily";
import { dailyWordSeed, dayKeyOf } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLanguageOf } from "@/lib/puzzles/dailyWords/dailyPools";
import { futagoDailySeed } from "@/lib/puzzles/gomoji/futagoSeed";
import { redirect } from "next/navigation";
import { puzzleRulesPage } from "@/lib/puzzles/puzzleRulesPage";
import { runOf } from "@/lib/puzzles/server/puzzleRuns";
import { PUZZLE_DISPLAY, PUZZLE_SPECS, drawnOnBoard } from "@/lib/puzzles/puzzles.constants";
import { tsunagiSolvedBy } from "@/lib/puzzles/server/tsunagiRecords";
import { TsunagiLevelFastest } from "./TsunagiLevelFastest";
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
  /* Today's puzzle, asked for by `?daily=1`: resolved to the day's seed and an ordinary address (`daily.ts`) —
     for a Gomoji, the seed of today's word at the length asked (`dailyWords/dailyDay.ts`). */
  if (query[DAILY_PARAM] === "1" && asked.seed === null) {
    const today = new Date();
    // A Futago's day has two words at a seed of its own (`futagoSeed.ts`).
    const seed = dailyLanguageOf(kind) === null ? dailySeed(today) : asked.twins === true ? futagoDailySeed(dayKeyOf(today)) : dailyWordSeed(dayKeyOf(today));
    redirect(`${playPath(kind)}${puzzleQuery({ ...asked, seed })}`);
  }
  const reader = await currentReader();
  /* The run this member kept of this very grid, if they left it unfinished: opened where it was left. One indexed read. */
  const kept = reader.memberId !== null && asked.seed !== null ? await runOf(reader.memberId, kind, asked.size, asked.level, asked.seed) : null;
  const resumed = kept === null ? null : { progress: kept.progress, steps: kept.steps, elapsedMs: kept.elapsedMs, checksUsed: kept.checksUsed, hintsUsed: kept.hintsUsed };
  /* How a Gomoji grid is drawn, as this member last chose (`wordStyles.ts`); read only for the four Gomojis. */
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort";
  const tsunagi = kind === "tsunagi";
  const { wordStyle, tsunagiMarks } = words || tsunagi ? await preferencesFor() : { wordStyle: undefined, tsunagiMarks: undefined };
  /* The reader's board colour, so the picker starts where a Reversi or Gomoku board's would (`feltOrWoodTheme`), and their stone set for a
     puzzle played with stones; read only for a puzzle drawn on the board, Kumimoji's table, and the stone puzzles. */
  const appearance = drawnOnBoard(kind) || kind === "kumimoji" || PUZZLE_SPECS[kind].stones === true ? ((await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE) : DEFAULT_APPEARANCE;
  /* Tsunagi's levels this member has solved at this size, so a level past the open rows is shut (`TsunagiSolve`). One read, for Tsunagi only. */
  const solved = tsunagi && reader.memberId !== null ? await tsunagiSolvedBy(reader.memberId) : null;
  const known = Object.fromEntries(Object.entries(solved?.[asked.size] ?? {}).map(([level, best]) => [level, best.elapsedMs]));
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
          <PuzzlePlayClient kind={kind} size={asked.size} level={asked.level} seed={asked.seed} checks={asked.checks ?? null} hints={asked.hints === true} strict={asked.strict === true} headStart={asked.headStart === true} twins={asked.twins === true} countdown={asked.countdown ?? null} resumed={resumed} hasAccount={reader.hasAccount} appearance={appearance} tsunagi={tsunagi ? { known, marks: tsunagiMarks ?? null } : null} />
        </WordStyleProvider>
      </div>
      {/* A fixed level is the same board for everybody, so it has a leaderboard of its own. */}
      {tsunagi && asked.seed !== null ? <TsunagiLevelFastest size={asked.size} level={asked.seed} /> : null}
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
