import Link from "next/link";

import { PageTitle } from "@/components/layout/Headings";
import { Tabs } from "@/components/ui/Tabs";
import { GAMES_TABS } from "@/lib/gomoku/catalogueView";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, STRETCHED_CARD } from "@/components/ui/ui.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { GUIDES } from "@/lib/learn/strategy";

export const metadata = { title: "Learn" };

/**
 * The strategy guides, one card each, with the games they cover.
 *
 * This page's own address did not move when Learn left the navigation. Only
 * the way in did: it is offered from /games now, where a reader has just met a
 * game, rather than costing a word of chrome on every page of the site.
 */
export default async function LearnIndexPage() {
  /*
   * `nav.learn` names this heading now rather than a row in the bar. The
   * phrase went looking for a home when the bar lost its Learn entry — the
   * dead-phrase gate said so, correctly — and this is where the word is
   * actually said, so it is where the key belongs. The heading was printing
   * "Learn" untranslated to every reader until it got one.
   */
  const say = await currentSpeaker();
  return (
    <Page>
      <SiteHeader />
      {/*
        A TAB OF GAMES, drawn as one: the Games heading and strip with the
        learning shelf open (`GAMES_TABS`). The shelf's own name is the tab.
      */}
      <PageTitle title={say.say("nav.games")} kanji="種目" />
      <Tabs tabs={GAMES_TABS} active="learn" base="/games" label="How to show the games" />
      <p className="text-sm text-muted">
        {say.say("nav.learn")}: the shapes that win, the moves that force, and the mistakes everyone makes once.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2" data-testid="learn-index">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            {/* A whole-card link, with the arrow every card that opens carries. */}
            <Link
              href={`/learn/${guide.slug}`}
              data-card-link=""
              className={`${PANEL_CLASS} ${STRETCHED_CARD} flex h-full items-center justify-between gap-3`}
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex items-baseline gap-2 font-semibold">
                  {guide.title}
                  <span className="font-mincho text-xs font-normal opacity-70">{guide.kanji}</span>
                </span>
                <span className="text-xs text-muted">{guide.summary}</span>
                <span className="text-[0.65rem] text-muted">
                  {guide.variants.map((variant) => RULE_VARIANT_DISPLAY[variant].label).join(" · ")}
                </span>
              </span>
              <CardArrow />
            </Link>
          </li>
        ))}
      </ul>
  </Page>
  );
}
