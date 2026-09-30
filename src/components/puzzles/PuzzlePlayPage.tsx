import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { appearanceFor } from "@/lib/auth/members";
import { onlineOfferFor } from "@/lib/party/online/server/onlineOffer";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { gamePath, joinQuery, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { DAILY_PARAM, dailySeed } from "@/lib/puzzles/daily";
import { dayKeyOf } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLanguageOf } from "@/lib/puzzles/dailyWords/dailyPools";
import { dailySeedOf } from "@/lib/puzzles/gomoji/wordsSeed";
import { redirect } from "next/navigation";
import { puzzleRulesPage } from "@/lib/puzzles/puzzleRulesPage";
import { runOf } from "@/lib/puzzles/server/puzzleRuns";
import { PUZZLE_DISPLAY, PUZZLE_SPECS, drawnOnBoard } from "@/lib/puzzles/puzzles.constants";
import { tsunagiAttemptsBy, tsunagiSolvedBy } from "@/lib/puzzles/server/tsunagiRecords";
import { TsunagiLevelFastest } from "./TsunagiLevelFastest";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { PuzzlePlayClient } from "./PuzzlePlayClient";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrailNav } from "@/components/games/GameTrail";
import { BoardScaled } from "@/components/board/BoardScaled";

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
    // A Futago's day has two words at a seed of its own (`futagoSeed.ts`), and a Yotsugo's four at another (`yotsugoSeed.ts`).
    const seed = dailyLanguageOf(kind) === null ? dailySeed(today) : dailySeedOf(asked.words ?? 1, dayKeyOf(today));
    redirect(joinQuery(playPath(kind), puzzleQuery({ ...asked, seed })));
  }
  const reader = await currentReader();
  /* The run this member kept of this very grid, if they left it unfinished: opened where it was left. One indexed read. */
  /* A pass-and-play Kumimoji is kept in the browser, never on the server (`kumimojiPartyKept.ts`): no read for it. */
  const party = (asked.players ?? 1) > 1;
  // Kumimoji's pass and play may be played on several devices instead: what its names screen offers for that (`onlineOfferFor`).
  const online = party ? await onlineOfferFor(kind, reader.memberId) : undefined;
  const kept = reader.memberId !== null && asked.seed !== null && !party ? await runOf(reader.memberId, kind, asked.size, asked.level, asked.seed, asked.gameLength, asked.doubleSet, asked.language, asked.diagonals, asked.clock) : null;
  const resumed = kept === null ? null : { progress: kept.progress, steps: kept.steps, elapsedMs: kept.elapsedMs, checksUsed: kept.checksUsed, hintsUsed: kept.hintsUsed };
  /* How a Gomoji grid is drawn, as this member last chose (`wordStyles.ts`); read only for the four Gomojis, and for Kumimoji's table, which is drawn on the same choice of board. */
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop";
  const tsunagi = kind === "tsunagi";
  const { wordStyle, tsunagiMarks, tsunagiFill, tsunagiExplosions, tsunagiCheats } =
    words || tsunagi || kind === "kumimoji" ? await preferencesFor() : { wordStyle: undefined, tsunagiMarks: undefined, tsunagiFill: undefined, tsunagiExplosions: undefined, tsunagiCheats: undefined };
  /* The reader's board colour, so the picker starts where a Reversi or Gomoku board's would (`feltOrWoodTheme`), and their stone set for a
     puzzle played with stones; read only for a puzzle drawn on the board, Kumimoji's table, and the stone puzzles. */
  // And Solitaire's table, laid on the reader's own wood (`SolitaireTable`).
  const appearance = drawnOnBoard(kind) || kind === "kumimoji" || kind === "mahjong" || PUZZLE_SPECS[kind].stones === true || PUZZLE_SPECS[kind].cards === true || PUZZLE_SPECS[kind].cube === true ? ((await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE) : DEFAULT_APPEARANCE;
  /* Tsunagi's levels this member has solved, so a level past the open rows is shut and a solved one opens solved (`TsunagiSolve`), and their attempts at each: two reads, for Tsunagi only. */
  const [solved, attempts] = tsunagi && reader.memberId !== null ? await Promise.all([tsunagiSolvedBy(reader.memberId), tsunagiAttemptsBy(reader.memberId)]) : [null, null];
  const known = Object.fromEntries(Object.entries(solved?.[asked.size] ?? {}).map(([level, best]) => [level, best.elapsedMs]));
  const bestSolves = Object.fromEntries(Object.entries(solved?.[asked.size] ?? {}).map(([level, best]) => [level, best.solveId]));
  // Levels solved only in a way that opens nothing (explosions off): solved, never counted to open a block.
  const closed = Object.entries(solved?.[asked.size] ?? {}).flatMap(([level, best]) => (best.opens ? [] : [Number(level)]));
  return (
    // A board page whose play draws "Just the board" beside its size (`BoardScale`).
    <Page board="play">
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
      {/* The solve at the size this reader keeps for this kind of screen (`BoardScaled`): Regular is the column it always had. */}
      <BoardScaled className="mx-auto w-full max-w-xl" widthReason="a puzzle grid wider than a hand is a grid nobody can reach across, until the reader asks for a bigger one">
        <WordStyleProvider initial={wordStyle ?? WORD_STYLES.reversi} saves={reader.hasAccount}>
          <PuzzlePlayClient kind={kind} size={asked.size} level={asked.level} seed={asked.seed} checks={asked.checks ?? null} hints={asked.hints === true} strict={asked.strict === true} headStart={asked.headStart === true} words={asked.words ?? 1} gameLength={asked.gameLength} language={asked.language} doubleSet={asked.doubleSet} diagonals={asked.diagonals} players={asked.players ?? 1} bonus={asked.bonus} online={online} clock={asked.clock ?? "none"} anyDeal={asked.anyDeal === true} resumed={resumed} hasAccount={reader.hasAccount} appearance={appearance} tsunagi={tsunagi ? { known, bestSolves, closed, attempts: attempts?.[asked.size] ?? {}, marks: tsunagiMarks ?? null, fill: tsunagiFill ?? null, explosions: tsunagiExplosions ?? null, cheats: tsunagiCheats ?? null } : null} />
        </WordStyleProvider>
      </BoardScaled>
      {/* A fixed level is the same board for everybody, so it has a leaderboard of its own. */}
      {tsunagi && asked.seed !== null ? (
        <div data-chrome>
          <TsunagiLevelFastest size={asked.size} level={asked.seed} />
        </div>
      ) : null}
      {/* Furniture, for just the board. */}
      <footer data-chrome className="border-t border-rule pt-5 text-sm text-muted">
        <p>
          {copy.tagline}{" "}
          {/* Over the puzzle, not a page away from it: see `RulesModal`. */}
          <RulesModal rules={{ title: rules.title, kanji: rules.kanji, object: rules.object, board: rules.board, play: rules.play, house: rules.house }} />.
        </p>
      </footer>
    </Page>
  );
}
