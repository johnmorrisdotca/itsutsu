import { FeedList } from "@/components/feed/FeedList";
import { FEED_KANJI, FEED_WAYS_IN } from "@/components/feed/feed.constants";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { DAY_MS, FEED_PATH, FEED_TABS } from "@/lib/feed/feed.constants";
import { feedDays } from "@/lib/feed/feed";
import { readEveryoneFeed, readMineFeed } from "@/lib/feed/feedRead";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { activeTab, type Tab } from "@/lib/ui/tabs";
import { xpDayKey } from "@/lib/xp/xpDay";

export const metadata = { title: "Feed 近況" };

/* The reader's own stream, read once on each visit: never cached, never polled. */
export const dynamic = "force-dynamic";

/**
 * THE FEED (John, 2026-09-25, after Duolingo's): a stream of what the reader
 * and the people they keep have been doing — games begun and finished,
 * experience earned, levels reached, puzzles solved — and, on its second tab,
 * the games finished lately between players it is safe to show everybody.
 *
 * Behind the gate: it names members, and a visitor with no invite sees games,
 * never people (`src/proxy.ts`). One read per table per visit, bounded — see
 * `feedRead.ts`.
 */
export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const asked = await searchParams;
  const [say, member] = await Promise.all([currentSpeaker(), currentMemberRow()]);
  const tabs: Tab[] = [
    { key: FEED_TABS.mine, label: say.say("feed.tabMine"), kanji: FEED_KANJI[FEED_TABS.mine] },
    { key: FEED_TABS.everyone, label: say.say("feed.tabEveryone"), kanji: FEED_KANJI[FEED_TABS.everyone] },
  ];
  const open = activeTab(tabs, asked.view);
  const everyone = open === FEED_TABS.everyone;

  const now = new Date();
  const zone = member?.timeZone ?? null;
  const entries = everyone
    ? await readEveryoneFeed(member?.id ?? null, now)
    : member === null
      ? []
      : await readMineFeed({ id: member.id, timeZone: member.timeZone, xp: member.xp, xpEverywhere: member.xpEverywhere }, now);

  const beFirst = { label: say.say("feed.beFirst"), href: FEED_WAYS_IN.play, testId: "feed-be-first" };
  const findBuddies = { label: say.say("feed.findBuddies"), href: FEED_WAYS_IN.buddies, testId: "feed-find-buddies" };

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={say.say("feed.title")}
        kanji={FEED_KANJI.title}
        lead={everyone ? say.say("feed.leadEveryone") : say.say("feed.lead")}
      />
      <Tabs tabs={tabs} active={open} base={FEED_PATH} label={say.say("feed.tabsLabel")} />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="feed-panel" data-tab={open}>
        <FeedList
          days={feedDays(entries, zone)}
          today={xpDayKey(now, zone)}
          yesterday={xpDayKey(new Date(now.getTime() - DAY_MS), zone)}
          say={say}
          empty={everyone ? say.say("feed.emptyEveryone") : say.say("feed.emptyMine")}
          waysIn={everyone ? [beFirst] : [beFirst, findBuddies]}
        />
      </section>
    </Page>
  );
}
