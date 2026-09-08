import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ABOUT_SECTIONS } from "./about.constants";

export const metadata = {
  title: "About",
  description:
    "Where Itsutsu comes from: the turn-based sites a family played on for years, a thousand years of five in a row, and the Japanese thread through all of it.",
};

/** The story of the site. Open to anyone, like the rules. */
export default function AboutPage() {
  return (
    <Page width="prose" gap="gap-10">
      <SiteHeader />

      <header className="flex flex-col gap-2">
        <h1 className="flex items-baseline gap-3 text-2xl font-semibold">
          About <span className="font-mincho text-lg font-normal opacity-70">五つについて</span>
        </h1>
        <p className="text-sm text-muted">
          A tribute to the sites a family played on, and to a game a thousand years old.
        </p>
      </header>

      {ABOUT_SECTIONS.map((section, index) => (
        <section key={section.title} className="flex flex-col gap-4" data-testid="about-section">
          {index > 0 ? <BrandStones className="mb-2 opacity-70" /> : null}
          <h2 className="flex items-baseline gap-2 text-lg font-semibold">
            {section.title}
            <span className="font-mincho text-sm font-normal opacity-70">{section.kanji}</span>
          </h2>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-[0.95rem] leading-relaxed text-ink-soft">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
  </Page>
  );
}
