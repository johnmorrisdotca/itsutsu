import { Fragment } from "react";

import { BrandStones } from "@/components/layout/BrandMarks";
import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";

import { CONTACT, PRIVACY_CHANGED, PRIVACY_SUBTITLE, PRIVACY_TITLE, privacySections } from "./privacy.constants";

export const metadata = {
  title: PRIVACY_TITLE.en,
  description: PRIVACY_SUBTITLE,
};

/**
 * What Itsutsu keeps about a member, who can see it, and how to have it
 * removed.
 *
 * Open to strangers (`OPEN_EXACTLY` in `proxy.ts`), because the reader who
 * most needs it is deciding whether to ask for an invite, or whether a child
 * may. Every sentence is one the code keeps; see `privacy.constants.ts` and
 * the test beside it.
 *
 * The contact address is a link wherever it appears, because a page that
 * says "write to us" and makes the reader copy an address has not said it.
 */
export default function PrivacyPage() {
  const sections = privacySections(PLAYER_SESSION_DAYS);
  return (
    <Page>
      <SiteHeader />

      <PageTitle title={PRIVACY_TITLE.en} kanji={PRIVACY_TITLE.kanji} lead={PRIVACY_SUBTITLE}>
        <p className="text-xs text-muted" data-testid="privacy-changed">
          Last changed {longDate(PRIVACY_CHANGED)}
        </p>
      </PageTitle>

      {sections.map((section, index) => (
        <section key={section.id} id={section.id} className="flex flex-col gap-3" data-testid="privacy-section">
          {index > 0 ? <BrandStones className="mb-2 opacity-70" /> : null}
          <SectionHeading title={section.heading} kanji={section.kanji} />
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[0.95rem] leading-relaxed text-ink-soft">
              {withContactLink(paragraph)}
            </p>
          ))}
          {section.points ? (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.95rem] leading-relaxed text-ink-soft">
              {section.points.map((point) => (
                <li key={point}>{withContactLink(point)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </Page>
  );
}

/** "2026-09-24" as "24 September 2026", in the site's own language, without Intl in render. */
function longDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** The contact address, wherever a sentence names it, as a mailto link. */
function withContactLink(text: string) {
  const parts = text.split(CONTACT);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? (
        <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">
          {CONTACT}
        </a>
      ) : null}
    </Fragment>
  ));
}
