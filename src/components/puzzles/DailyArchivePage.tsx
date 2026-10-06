import Link from "@/components/ui/Link";

import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath } from "@/lib/gomoku/slugs";
import { archiveMonthAsked, archiveMonths, archiveWeeks } from "@/lib/puzzles/dailyWords/dailyArchive";
import { dayKeyOf } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLengths } from "@/lib/puzzles/dailyWords/dailyPools";
import { loadDailyPoolsFromModule } from "@/lib/puzzles/dailyWords/dailyPoolsModule";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
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
  const say = await currentSpeaker();
  const name = puzzleName(kind, say.locale);
  const today = dayKeyOf(new Date());
  await loadDailyPoolsFromModule(kind);
  const months = archiveMonths(today);
  const month = archiveMonthAsked(monthAsked, months);
  const weeks = archiveWeeks(kind, today, month);
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={say.say("pword.daily.archive.title", { name })}
        kanji={say.pairsWithKanji ? "毎日の言葉" : ""}
        crumb={<GameTrail game={{ label: name, href: gamePath(kind) }} steps={[{ label: say.say("pword.daily.archive.crumb") }]} />}
        lead={say.say("pword.daily.archive.lead")}
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={gamePath(kind)} className="text-muted underline-offset-2 hover:underline" data-testid="daily-archive-today">
            {say.say("pword.daily.archive.playToday")}
          </Link>
        </p>
      </PageTitle>
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="daily-archive-panel">
        <DailyArchiveTable sizes={dailyLengths(kind)} weeks={weeks} months={months} month={month} unit={kind === "gomojiKana" ? "kana" : "letters"} />
      </section>
    </Page>
  );
}
