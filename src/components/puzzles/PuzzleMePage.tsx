import Link from "@/components/ui/Link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gamePath, historyPath, matchPath, mySolvePath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { racesOf, readRace, seatOf } from "@/lib/puzzles/server/puzzleRaces";
import { ownSolvesOf, ownWordsOf } from "@/lib/puzzles/server/puzzleSolves";

import { sizeWord } from "./puzzles.constants";
import { SolveTime } from "./SolveTime";
import { WordHistory } from "./WordHistory";
import { isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { loadKanaWords } from "@/lib/puzzles/gomojiKana/kanaWords";
import { GameTrail } from "@/components/games/GameTrail";

/**
 * /games/<slug>/me for a puzzle: your own solves of it, newest first, and
 * your races at it. Two tables, each shown with its shape when empty and
 * the way in beside it, as every empty table here is. Gomoji's are its words
 * instead, found and not found, with their guesses (`WordHistory`).
 */
export async function PuzzleMePage({ kind }: { kind: PuzzleKind }) {
  const copy = PUZZLE_DISPLAY[kind];
  const me = await currentMemberId();
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort";
  const [solves, races, played] =
    me === null ? [[], [], { words: [], total: 0 }] : await Promise.all([words ? [] : ownSolvesOf(me, kind), racesOf(me, kind), words ? ownWordsOf(me, kind) : { words: [], total: 0 }]);
  // A kana dodger's word is where it stood at the end, replayed from its list (`wordOfPlay`): those lengths are loaded first.
  if (kind === "gomojiKana") await Promise.all([...new Set(played.words.filter((word) => isDodgeGivens(word.givens)).map((word) => word.size))].map((size) => loadKanaWords(size)));
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`Your ${copy.label}`}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={[{ label: "Yours" }]} />}
        lead={
          me === null
            ? "This page lists your own solves, and it does not know who you are yet."
            : words
              ? "Every word you have played, found or not, with your guesses and what each scored."
              : "Your solves of it, newest first, and your races."
        }
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={standingsPath(kind)} className="text-muted underline-offset-2 hover:underline">fastest here</Link>
          <Link href={historyPath(kind)} className="text-muted underline-offset-2 hover:underline" data-testid="me-everybody">everybody&apos;s solves</Link>
          <Link href={setUpPath(kind)} className="text-muted underline-offset-2 hover:underline">play one</Link>
        </p>
      </PageTitle>

      {words ? <WordHistory words={played.words} total={played.total} kind={kind} /> : null}

      {words ? null : (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-own-solves">
        <h2 className={SECTION_TITLE}>
          Your solves <span className="font-mincho normal-case tracking-normal">自分の解</span>
        </h2>
        {solves.length === 0 ? (
          <p className="text-sm text-muted">
            None yet.{" "}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
              Play one →
            </Link>
          </p>
        ) : (
          <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-2 text-left">Puzzle</th>
                <th className="py-1 pr-2 text-left">Time</th>
                <th className="py-1 text-left">When</th>
              </tr>
            </thead>
            <tbody>
              {solves.map((solve) => (
                <tr key={solve.id} className="border-t border-rule" data-testid="puzzle-own-solve">
                  <td className="py-1 pr-2">
                    <Link href={mySolvePath(kind, solve.id)} className="underline-offset-2 hover:underline" data-testid="puzzle-own-solve-open">
                      {sizeWord(solve.size, kind)} <span className="text-muted">{PUZZLE_LEVEL_DISPLAY[solve.level as PuzzleLevel].label.toLowerCase()}</span>
                    </Link>
                    {solve.raceId !== null ? (
                      <Link href={matchPath(kind, solve.raceId)} className="ml-2 text-xs underline-offset-2 hover:underline">
                        in a race
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-1 pr-2">
                    <SolveTime kind={kind} solveId={solve.id} elapsedMs={solve.elapsedMs} mine testId="puzzle-own-solve-time" />
                  </td>
                  <td className="py-1 text-muted">{solve.finishedAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
      )}

      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-own-races">
        <h2 className={SECTION_TITLE}>
          Your races <span className="font-mincho normal-case tracking-normal">競解</span>
        </h2>
        {races.length === 0 ? (
          <p className="text-sm text-muted">
            None yet.{" "}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
              Play a friend →
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {races.map((race) => {
              const read = readRace(race);
              const seat = seatOf(race, me);
              const other = seat === "host" ? race.guestName || "nobody yet" : race.hostName;
              const standing = !read.outcome.over ? "not over" : read.outcome.winner === null ? "nobody won" : read.outcome.winner === seat ? "you won" : "they won";
              return (
                <li key={race.id} data-testid="puzzle-own-race">
                  <Link href={matchPath(kind, race.id)} className="underline-offset-2 hover:underline">
                    {sizeWord(race.size, kind)} against {other}
                  </Link>{" "}
                  <span className="text-muted">— {standing}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}
