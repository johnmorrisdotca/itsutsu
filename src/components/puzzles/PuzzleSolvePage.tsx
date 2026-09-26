import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { PlayerName } from "@/components/players/PlayerName";
import { gamePath, historyPath, matchPath, myGamePath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_RECORD_SORTS, puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";
import { anySolveOf, finishedSameGrid } from "@/lib/puzzles/server/puzzleRecord";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { clockText } from "@/lib/puzzles/clockText";
import { guessesTaken, guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hadHeadStart, hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { memberNamesOf, ownSolveOf } from "@/lib/puzzles/server/puzzleSolves";
import { FUTAGO_DISPLAY, hiddenWordsOf, wordsShown } from "@/lib/puzzles/gomoji/futago";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";

import { FinishedPuzzle } from "./FinishedPuzzle";
import { sizeWord } from "./puzzles.constants";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrail } from "@/components/games/GameTrail";
import { unsolvedWords } from "@/lib/puzzles/countdown";

/** A word puzzle's hidden word, or a Futago's two (`futago.ts`), in the case it is played in. */
function wordOf(kind: PuzzleKind, givens: string, size: number): string {
  const words = hiddenWordsOf(kind, size, givens)?.words ?? [];
  return words.length > 1 ? `${wordsShown(kind, words)} (${FUTAGO_DISPLAY.label} ${FUTAGO_DISPLAY.kanji})` : wordsShown(kind, words);
}

/** Whether a moment falls on today's date in UTC, the day today's puzzle is everybody's (`dailySeed`). */
function isTodayUtc(at: Date, now = new Date()): boolean {
  return at.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

/**
 * ONE FINISHED PUZZLE: the grid as it ended (`FinishedPuzzle`), and how it
 * went — who, when, what size and level, how long, what it scored, and the
 * checks and hints it took. John, 2026-09-25: "Drilldown into solved puzzles
 * doesn't work. Sudoku I couldn't see a game." Every row that lists a solve
 * leads here.
 *
 * TWO ADDRESSES, ONE PAGE. `mine` is /games/<slug>/me/<id>, the reader's own
 * place for their own solve, and answers anybody else, or nobody signed in,
 * with no such puzzle. `anyone` is /games/<slug>/history/<id>, where every
 * time on a board of solves leads (John, 2026-09-26: "No way to view played
 * games"): any member's solve, to any member, behind the invite as a game's
 * record is (`src/proxy.ts`). A child's solve is shown as a child's games
 * are: to members, never to a stranger.
 *
 * AND IT KEEPS TODAY'S PUZZLE A PUZZLE. Today's puzzle is the same grid for
 * everybody (`daily.ts`), so somebody else's answer from today is not shown to
 * a reader who has not finished that grid themselves: the page draws it as it
 * was dealt and says when the answer opens. From tomorrow, or once the reader
 * has finished it, it is shown whole.
 */
export async function PuzzleSolvePage({ kind, solveId, whose }: { kind: PuzzleKind; solveId: string; whose: "mine" | "anyone" }) {
  const me = await currentMemberId();
  const found = whose === "mine" ? (me === null ? null : await ownSolveOf(me, kind, solveId)) : await anySolveOf(kind, solveId);
  if (found === null) notFound();
  const solverId = "memberId" in found ? (found.memberId as string) : me!;
  const own = solverId === me;
  const kept = own || !isTodayUtc(found.finishedAt) || (await finishedSameGrid(me, kind, found.givens));
  const solve = kept ? found : { ...found, answer: null, steps: null };
  const solver = (await memberNamesOf([solverId])).get(solverId) ?? "";
  const copy = PUZZLE_DISPLAY[kind];
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort";
  const { wordStyle } = words ? await preferencesFor() : { wordStyle: undefined };
  const outcome = solve.solved ? (words ? "Found" : "Solved") : unsolvedWords(solve);
  const taken = guessesTaken(kind, solve.size, solve.level, solve.givens, found.answer);
  const helped = [
    solve.checksUsed ? `${solve.checksUsed} ${solve.checksUsed === 1 ? "check" : "checks"}${solve.checksAllowed === null ? "" : ` of ${solve.checksAllowed}`}` : null,
    hintsWords(kind, solve.level, solve.hintsUsed),
  ].filter((part) => part !== null);
  const headStart = hadHeadStart(kind, solve.level, solve.hintsUsed);
  const facts: { label: string; value: string; testId: string }[] = [
    { label: "How it ended", value: outcome, testId: "solve-outcome" },
    // A word puzzle says its word, found or not: a word not found is the one thing the grid cannot show.
    ...(words ? [{ label: "The word", value: kept ? wordOf(kind, solve.givens, solve.size) : "Kept back until tomorrow", testId: "solve-word" }] : []),
    { label: "Puzzle", value: `${sizeWord(solve.size, kind)} · ${PUZZLE_LEVEL_DISPLAY[solve.level as PuzzleLevel]?.label ?? solve.level}${headStart ? " · Head start" : ""}`, testId: "solve-puzzle" },
    { label: "Time", value: clockText(solve.elapsedMs), testId: "solve-time" },
    // A word's guesses, out of the level's allowance: the other half of how it went.
    ...(taken === null ? [] : [{ label: taken.unit === "swaps" ? "Swaps" : "Guesses", value: `${guessesText(taken)}`, testId: "solve-guesses" }]),
    { label: "Points", value: String(solve.points), testId: "solve-points" },
    { label: "Help", value: helped.length === 0 ? "None" : helped.join(" · "), testId: "solve-help" },
    { label: "Finished", value: solve.finishedAt.toISOString().slice(0, 10), testId: "solve-date" },
  ];
  const day = solve.finishedAt.toISOString().slice(0, 10);
  const levelWord = (PUZZLE_LEVEL_DISPLAY[solve.level as PuzzleLevel]?.label ?? solve.level).toLowerCase();
  const trail = own ? [{ label: "Yours", href: myGamePath(kind) }, { label: day }] : [{ label: "Record", href: historyPath(kind) }, { label: day }];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={own ? `Your ${copy.label}` : copy.label}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={trail} />}
        lead={
          own ? (
            `${outcome}, ${day}.`
          ) : (
            <span data-testid="solve-solver">
              {outcome} by <PlayerName name={solver} memberId={solverId} fallback="A member" />, {day}.
            </span>
          )
        }
      />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4" data-testid="solve-page" data-solve={solve.id} data-kept={solve.answer === null ? "false" : "true"} data-own={own ? "true" : "false"}>
        <WordStyleProvider initial={wordStyle ?? WORD_STYLES.reversi} saves={false}>
          <FinishedPuzzle
            kind={kind}
            size={solve.size}
            level={solve.level as PuzzleLevel}
            givens={solve.givens}
            answer={solve.answer}
            steps={kept ? solve.steps : null}
            derive={kept && solve.solved}
            headStart={headStart}
            story={{
              kind: words ? "Word" : "Solve",
              kanji: copy.kanji,
              title: (
                <>
                  <PlayerName name={solver} memberId={solverId} fallback="A member" />
                  &apos;s {copy.label} · {sizeWord(solve.size, kind)} {levelWord}
                </>
              ),
              source: `Solved on Itsutsu · ${day}`,
            }}
          />
        </WordStyleProvider>
        {!kept ? (
          <p className="text-sm text-muted" data-testid="solve-kept-back">
            Today&apos;s puzzle is the same for everybody, so how it was solved is kept back until tomorrow, or until you have
            finished it yourself.{" "}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline underline-offset-2">
              Play today&apos;s
            </Link>
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
          {own ? null : (
            <Link href={puzzleRecordHref(kind, { member: solverId })} className="underline underline-offset-2" data-testid="solve-their-solves">
              All their {copy.label}
            </Link>
          )}
          <Link href={puzzleRecordHref(kind, { size: solve.size, level: solve.level as PuzzleLevel, sort: PUZZLE_RECORD_SORTS.fastest })} className="underline underline-offset-2" data-testid="solve-fastest-here">
            Fastest at this size
          </Link>
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
