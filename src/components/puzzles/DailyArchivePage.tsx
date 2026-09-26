import Link from "@/components/ui/Link";

import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath } from "@/lib/gomoku/slugs";
import { archiveMonthAsked, archiveMonths, archiveWeeks } from "@/lib/puzzles/dailyWords/dailyArchive";
import { dayKeyOf } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLengths, loadDailyPools } from "@/lib/puzzles/dailyWords/dailyPools";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { DailyArchiveTable } from "./DailyArchiveTable";

/**
 * /games/<slug>/daily: every past day's words, a week at a time. John,
 * 2026-09-26: "we should publish the daily words in a page. Have a nice
 * presentation, per week or month... searchable maybe?"
 *
 * PAST DAYS ONLY — never today's word and never one to come, not in the table
 * and not in the page's source: the list is built on the server up to
 * yesterday (`dailyArchive.ts`), at request time, and nothing else is sent.
 *
 * Open to a reader with no invite, like the game's rules (`OPEN_PATTERNS` in
 * proxy.ts): words and dates are the game, and nobody is named here. Each word
 * leads to that day's puzzle and each day to its page of fastest finds, both
 * of which are the playing half and ask a stranger for an invite.
 */
export async function DailyArchivePage({ kind, monthAsked }: { kind: PuzzleKind; monthAsked: string | undefined }) {
  const copy = PUZZLE_DISPLAY[kind];
  const today = dayKeyOf(new Date());
  await loadDailyPools(kind);
  const months = archiveMonths(today);
  const month = archiveMonthAsked(monthAsked, months);
  const weeks = archiveWeeks(kind, today, month);
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`${copy.label} daily words`}
        kanji="毎日の言葉"
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={[{ label: "Daily words" }]} />}
        lead="Every day has one word at each length, the same for everybody, new at midnight UTC. Here are the days gone by, a word leading to its puzzle and a day to its fastest finds; today's words wait on the game's page until tomorrow."
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={gamePath(kind)} className="text-muted underline-offset-2 hover:underline" data-testid="daily-archive-today">
            Play today&apos;s words
          </Link>
        </p>
      </PageTitle>
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="daily-archive-panel">
        <DailyArchiveTable sizes={dailyLengths(kind)} weeks={weeks} months={months} month={month} unit={kind === "gomojiKana" ? "kana" : "letters"} />
      </section>
    </Page>
  );
}
