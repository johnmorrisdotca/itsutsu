import Link from "@/components/ui/Link";

import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { levelLabelOf, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { gamePath } from "@/lib/gomoku/slugs";
import { dailyDayPath, dailyPlayPath, dailyWordsPath, shownWord } from "@/lib/puzzles/dailyWords/dailyAddress";
import { DAILY_WORDS_EPOCH, dayAfter, dayLabel } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLengths, dailyWordOf } from "@/lib/puzzles/dailyWords/dailyPools";
import type { DailyFastest } from "@/lib/puzzles/dailyWords/dailyWords.types";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { fastestOfWord } from "@/lib/puzzles/server/dailyPlays";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import type { NameTag } from "@/lib/xp/nameTag.types";
import { SolveTime } from "./SolveTime";

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
  const say = await currentSpeaker();
  const name = puzzleName(kind, say.locale);
  const past = day < today;
  const lengths = dailyLengths(kind).flatMap((size) => {
    const word = dailyWordOf(kind, size, day)?.word;
    return word === undefined ? [] : [{ size, word }];
  });
  const boards = await Promise.all(lengths.map(async ({ size, word }) => ({ size, word, fastest: await fastestOfWord(kind, size, word) })));
  const { names, tags } = await namesAndTagsOf(boards.flatMap((board) => board.fastest.map((row) => row.memberId)));
  const before = dayAfter(day, -1);
  const locale = say.locale;
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={past ? dayLabel(day, locale) : say.say("pword.daily.day.today", { day: dayLabel(day, locale) })}
        kanji={past || !say.pairsWithKanji ? "" : "今日"}
        crumb={
          <GameTrail
            game={{ label: name, href: gamePath(kind) }}
            steps={[{ label: say.say("pword.daily.archive.crumb"), href: dailyWordsPath(kind) }, { label: day }]}
          />
        }
        lead={say.say(past ? "pword.daily.day.lead" : "pword.daily.day.leadToday")}
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          {before >= DAILY_WORDS_EPOCH ? (
            <Link href={dailyDayPath(kind, before)} className="text-muted underline-offset-2 hover:underline" data-testid="daily-day-before">
              {say.say("pword.daily.day.before")}
            </Link>
          ) : null}
          {past ? (
            <Link href={dailyDayPath(kind, dayAfter(day))} className="text-muted underline-offset-2 hover:underline" data-testid="daily-day-after">
              {say.say("pword.daily.day.after")}
            </Link>
          ) : null}
          <Link href={dailyWordsPath(kind)} className="text-muted underline-offset-2 hover:underline">
            {say.say("pword.daily.day.every")}
          </Link>
        </p>
      </PageTitle>
      {boards.map((board) => (
        <section key={board.size} className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="daily-day-length" data-size={board.size}>
          <h2 className={SECTION_TITLE}>
            {say.count(kind === "gomojiKana" ? "puzzle.count.kana" : "puzzle.count.letter", board.size)}
            {past ? (
              <span className="ml-2 font-mono text-base tracking-wide normal-case text-ink" data-testid="daily-day-word">
                {shownWord(kind, board.word)}
              </span>
            ) : null}
          </h2>
          <FastestOfDay kind={kind} rows={board.fastest} names={names} tags={tags} playHref={dailyPlayPath(kind, board.size, day)} say={say} />
        </section>
      ))}
    </Page>
  );
}

function FastestOfDay({ kind, rows, names, tags, playHref, say }: { kind: PuzzleKind; rows: readonly DailyFastest[]; names: Map<string, string>; tags: ReadonlyMap<string, NameTag>; playHref: string; say: Speaker }) {
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full text-sm" data-testid="daily-day-fastest-table">
        <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
          <tr>
            <th className="py-1 pr-2 text-left">{say.say("pset.col.time")}</th>
            <th className="py-1 pr-2 text-left">{say.say("pset.col.guesses")}</th>
            <th className="py-1 pr-2 text-left">{say.say("points.board.player")}</th>
            <th className="py-1 text-left">{say.say("pword.daily.day.level")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={4} className="py-2 text-muted" data-testid="daily-day-nobody">
                {say.say("pword.daily.day.nobody")}{say.pairsWithKanji ? " " : ""}
                <Link href={playHref} className="font-semibold text-ink underline-offset-2 hover:underline">
                  {say.say("pset.fast.beFirst")}
                </Link>
              </td>
            </tr>
          ) : (
            rows.map((row, at) => (
              <tr key={`${row.memberId}-${at}`} className="border-t border-rule" data-testid="daily-day-fastest-row">
                <td className="py-1 pr-2 font-mono tabular-nums">
                  <SolveTime kind={kind} solveId={row.solveId} elapsedMs={row.elapsedMs} />
                </td>
                <td className="py-1 pr-2 tabular-nums text-muted">{row.guesses === null ? "—" : guessesText(row.guesses)}</td>
                <td className="py-1 pr-2">
                  <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback={say.say("points.board.aMember")} tag={tags.get(row.memberId)} />
                </td>
                <td className="py-1 text-muted">{levelLabelOf(row.level, say.locale)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rows.length === 0 ? null : (
        <p className="pt-1 text-xs">
          <Link href={playHref} className="font-semibold underline-offset-2 hover:underline" data-testid="daily-day-play">
            {say.say("pword.daily.day.playYourself")}
          </Link>
        </p>
      )}
    </div>
  );
}
