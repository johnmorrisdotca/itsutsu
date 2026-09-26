import Link from "@/components/ui/Link";

import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { gamePath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { dailyDayPath, dailyPlayPath, dailyWordsPath, shownWord } from "@/lib/puzzles/dailyWords/dailyAddress";
import { DAILY_WORDS_EPOCH, dayAfter, dayLabel } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLengths, dailyWordOf } from "@/lib/puzzles/dailyWords/dailyPools";
import type { DailyFastest } from "@/lib/puzzles/dailyWords/dailyWords.types";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { fastestOfWord } from "@/lib/puzzles/server/dailyPlays";
import { memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";

/**
 * /games/<slug>/daily/<day>: one day's words, and the fastest to find each.
 *
 * For members, as every table of names is: the gate leaves `/daily/<day>`
 * shut, so a stranger is asked for an invite rather than shown who played.
 * TODAY'S PAGE KEEPS ITS WORDS BACK — the times race on, the words wait for
 * tomorrow — and a day to come has no page at all (the route answers 404
 * before this is drawn). The pools for the kind are fetched by the route.
 */
export async function DailyDayPage({ kind, day, today }: { kind: PuzzleKind; day: string; today: string }) {
  const copy = PUZZLE_DISPLAY[kind];
  const past = day < today;
  const lengths = dailyLengths(kind).flatMap((size) => {
    const word = dailyWordOf(kind, size, day)?.word;
    return word === undefined ? [] : [{ size, word }];
  });
  const boards = await Promise.all(lengths.map(async ({ size, word }) => ({ size, word, fastest: await fastestOfWord(kind, size, word) })));
  const names = await memberNamesOf(boards.flatMap((board) => board.fastest.map((row) => row.memberId)));
  const before = dayAfter(day, -1);
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={past ? dayLabel(day) : `Today, ${dayLabel(day)}`}
        kanji={past ? "" : "今日"}
        crumb={
          <GameTrail
            game={{ label: copy.label, href: gamePath(kind) }}
            steps={[{ label: "Daily words", href: dailyWordsPath(kind) }, { label: day }]}
          />
        }
        lead={past ? "The words of this day, and the fastest to find each — on the day or since." : "Today's words stay hidden until tomorrow. The times are already racing."}
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          {before >= DAILY_WORDS_EPOCH ? (
            <Link href={dailyDayPath(kind, before)} className="text-muted underline-offset-2 hover:underline" data-testid="daily-day-before">
              ← The day before
            </Link>
          ) : null}
          {past ? (
            <Link href={dailyDayPath(kind, dayAfter(day))} className="text-muted underline-offset-2 hover:underline" data-testid="daily-day-after">
              The day after →
            </Link>
          ) : null}
          <Link href={dailyWordsPath(kind)} className="text-muted underline-offset-2 hover:underline">
            Every past day
          </Link>
        </p>
      </PageTitle>
      {boards.map((board) => (
        <section key={board.size} className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="daily-day-length" data-size={board.size}>
          <h2 className={SECTION_TITLE}>
            {board.size} {kind === "gomojiKana" ? "kana" : "letters"}
            {past ? (
              <span className="ml-2 font-mono text-base tracking-wide normal-case text-ink" data-testid="daily-day-word">
                {shownWord(kind, board.word)}
              </span>
            ) : null}
          </h2>
          <FastestOfDay rows={board.fastest} names={names} playHref={dailyPlayPath(kind, board.size, day)} />
        </section>
      ))}
    </Page>
  );
}

function FastestOfDay({ rows, names, playHref }: { rows: readonly DailyFastest[]; names: Map<string, string>; playHref: string }) {
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full text-sm" data-testid="daily-day-fastest-table">
        <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
          <tr>
            <th className="py-1 pr-2 text-left">Time</th>
            <th className="py-1 pr-2 text-left">Guesses</th>
            <th className="py-1 pr-2 text-left">Player</th>
            <th className="py-1 text-left">Level</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={4} className="py-2 text-muted" data-testid="daily-day-nobody">
                Nobody has found this one yet.{" "}
                <Link href={playHref} className="font-semibold text-ink underline-offset-2 hover:underline">
                  Be the first →
                </Link>
              </td>
            </tr>
          ) : (
            rows.map((row, at) => (
              <tr key={`${row.memberId}-${at}`} className="border-t border-rule" data-testid="daily-day-fastest-row">
                <td className="py-1 pr-2 font-mono tabular-nums">{clockText(row.elapsedMs)}</td>
                <td className="py-1 pr-2 tabular-nums text-muted">{row.guesses === null ? "—" : guessesText(row.guesses)}</td>
                <td className="py-1 pr-2">
                  <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback="A member" />
                </td>
                <td className="py-1 text-muted">{PUZZLE_LEVEL_DISPLAY[row.level as PuzzleLevel]?.label ?? row.level}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rows.length === 0 ? null : (
        <p className="pt-1 text-xs">
          <Link href={playHref} className="font-semibold underline-offset-2 hover:underline" data-testid="daily-day-play">
            Play it yourself →
          </Link>
        </p>
      )}
    </div>
  );
}
