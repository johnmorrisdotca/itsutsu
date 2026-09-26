import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gamePath, matchPath, myGamePath, setUpPath } from "@/lib/gomoku/slugs";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { clockText } from "@/lib/puzzles/clockText";
import { guessesTaken, guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hadHeadStart, hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { ownSolveOf } from "@/lib/puzzles/server/puzzleSolves";
import { decodeHidden, languageOf } from "@/lib/puzzles/gomoji/code";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { decodeKanaGivens } from "@/lib/puzzles/gomojiKana/kanaCode";

import { FinishedPuzzle } from "./FinishedPuzzle";
import { sizeWord } from "./puzzles.constants";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrail } from "@/components/games/GameTrail";

/** A word puzzle's hidden word, in the case it is played in. */
function wordOf(kind: PuzzleKind, givens: string, size: number): string {
  return kind === "gomojiKana" ? (decodeKanaGivens(givens, size)?.word ?? "") : (decodeHidden(givens, size, languageOf(kind)) ?? "").toUpperCase();
}

/**
 * ONE FINISHED PUZZLE OF THE READER'S OWN, at /games/<slug>/me/<id>: the grid
 * as it ended (`FinishedPuzzle`), and how it went — when, what size and level,
 * how long, what it scored, and the checks and hints it took. John,
 * 2026-09-25: "Drilldown into solved puzzles doesn't work. Sudoku I couldn't
 * see a game." Every row that lists a solve leads here.
 *
 * Only its solver sees it: anybody else, or nobody signed in, is told there is
 * no such puzzle, the same answer as for an address that never was one.
 */
export async function PuzzleSolvePage({ kind, solveId }: { kind: PuzzleKind; solveId: string }) {
  const me = await currentMemberId();
  const solve = me === null ? null : await ownSolveOf(me, kind, solveId);
  if (solve === null) notFound();
  const copy = PUZZLE_DISPLAY[kind];
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort";
  const { wordStyle } = words ? await preferencesFor() : { wordStyle: undefined };
  const outcome = solve.solved ? (words ? "Found" : "Solved") : "Not found";
  const taken = guessesTaken(kind, solve.size, solve.level, solve.givens, solve.answer);
  const helped = [
    solve.checksUsed ? `${solve.checksUsed} ${solve.checksUsed === 1 ? "check" : "checks"}${solve.checksAllowed === null ? "" : ` of ${solve.checksAllowed}`}` : null,
    hintsWords(kind, solve.level, solve.hintsUsed),
  ].filter((part) => part !== null);
  const headStart = hadHeadStart(kind, solve.level, solve.hintsUsed);
  const facts: { label: string; value: string; testId: string }[] = [
    { label: "How it ended", value: outcome, testId: "solve-outcome" },
    // A word puzzle says its word, found or not: a word not found is the one thing the grid cannot show.
    ...(words ? [{ label: "The word", value: wordOf(kind, solve.givens, solve.size), testId: "solve-word" }] : []),
    { label: "Puzzle", value: `${sizeWord(solve.size, kind)} · ${PUZZLE_LEVEL_DISPLAY[solve.level as PuzzleLevel]?.label ?? solve.level}${headStart ? " · Head start" : ""}`, testId: "solve-puzzle" },
    { label: "Time", value: clockText(solve.elapsedMs), testId: "solve-time" },
    // A word's guesses, out of the level's allowance: the other half of how it went.
    ...(taken === null ? [] : [{ label: "Guesses", value: `${guessesText(taken)}`, testId: "solve-guesses" }]),
    { label: "Points", value: String(solve.points), testId: "solve-points" },
    { label: "Help", value: helped.length === 0 ? "None" : helped.join(" · "), testId: "solve-help" },
    { label: "Finished", value: solve.finishedAt.toISOString().slice(0, 10), testId: "solve-date" },
  ];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`Your ${copy.label}`}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={[{ label: "Yours", href: myGamePath(kind) }, { label: solve.finishedAt.toISOString().slice(0, 10) }]} />}
        lead={`${outcome}, ${solve.finishedAt.toISOString().slice(0, 10)}.`}
      />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4" data-testid="solve-page" data-solve={solve.id} data-kept={solve.answer === null ? "false" : "true"}>
        <WordStyleProvider initial={wordStyle ?? WORD_STYLES.reversi} saves={false}>
          <FinishedPuzzle kind={kind} size={solve.size} level={solve.level as PuzzleLevel} givens={solve.givens} answer={solve.answer} headStart={headStart} />
        </WordStyleProvider>
        {solve.answer === null ? (
          <p className="text-sm text-muted" data-testid="solve-not-kept">
            This one was finished before the finished grid was kept, so it shows the puzzle as it was dealt. Every puzzle finished from now on keeps its grid.
          </p>
        ) : null}
        <dl className={`${PANEL_CLASS} grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm`} data-testid="solve-facts">
          {facts.map((fact) => (
            <div key={fact.testId} className="contents">
              <dt className="text-muted">{fact.label}</dt>
              <dd className="tabular-nums" data-testid={fact.testId}>
                {fact.value}
              </dd>
            </div>
          ))}
          {solve.raceId !== null ? (
            <div className="contents">
              <dt className="text-muted">Race</dt>
              <dd>
                <Link href={matchPath(kind, solve.raceId)} className="underline underline-offset-2">
                  The race it was
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="flex flex-wrap gap-x-4 text-sm">
          <Link href={myGamePath(kind)} className="underline underline-offset-2">
            All your {copy.label}
          </Link>
          <Link href={setUpPath(kind)} className="font-semibold underline underline-offset-2">
            Play another
          </Link>
        </p>
      </div>
    </Page>
  );
}
