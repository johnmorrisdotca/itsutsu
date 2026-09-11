import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

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
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className="flex flex-col gap-2">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={say.say("nav.learn")} kanji="学び" kanjiClassName="text-sm font-normal opacity-70" />
        </h1>
        <p className="max-w-prose text-sm text-muted">
          How to think about each game: the shapes that win, the moves that force, and
          the mistakes everyone makes once. Each guide names the games it applies to.
        </p>
      </section>
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
