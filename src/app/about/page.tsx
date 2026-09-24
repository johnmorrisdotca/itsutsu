import { Fragment } from "react";

import { BrandStones } from "@/components/layout/BrandMarks";
import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { activeTab } from "@/lib/ui/tabs";
import { ABOUT_TABS } from "./about.chapters";
import { ABOUT_SECTIONS } from "./about.constants";

export const metadata = {
  title: "About",
  description:
    "Where Itsutsu comes from, how a game here goes and how to get an invite, its games in charts, and the Japanese thread through all of it.",
};

/**
 * The story of the site, a chapter at a time. Open to anyone, like the rules.
 *
 * IT USED TO BE ONE PAGE OF ELEVEN SECTIONS, 28,589 pixels tall on a phone —
 * thirty-four screens — so the computer players and the elder sites were
 * written for readers who would never scroll that far. John's standing rule is
 * tabs rather than a long page, and this was the page that most needed it.
 *
 * The open chapter is in the address (`?view=`), so it can be linked to and
 * survives a reload, and the first chapter is the bare /about — an ordinary
 * link to the page is still an ordinary link to its opening.
 */
export default async function AboutPage({ searchParams }: PageProps<"/about">) {
  const asked = await searchParams;
  const open = activeTab(ABOUT_TABS, asked.view);
  const shown = ABOUT_SECTIONS.filter((section) => section.chapter === open);
  return (
    <Page>
      <SiteHeader />

      <PageTitle
        title="About"
        kanji="五つについて"
        lead="A tribute to the sites a family played on, and to a game a thousand years old."
      />

      <Tabs tabs={ABOUT_TABS} active={open} base="/about" label="Which part of the story to read" />

      {shown.map((section, index) => (
        <section key={section.title} className="flex flex-col gap-4" data-testid="about-section">
          {index > 0 ? <BrandStones className="mb-2 opacity-70" /> : null}
          <SectionHeading title={section.title} kanji={section.kanji} />
          {section.paragraphs.map((paragraph, i) => (
            <Fragment key={i}>
              <p className="text-[0.95rem] leading-relaxed text-ink-soft">{paragraph}</p>
              {section.figures?.[i] ? <div className="py-2">{section.figures[i]}</div> : null}
            </Fragment>
          ))}
        </section>
      ))}
    </Page>
  );
}
