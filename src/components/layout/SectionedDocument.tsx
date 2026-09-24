import { Fragment } from "react";

import { BrandStones } from "./BrandMarks";
import { SectionHeading } from "./Headings";

/** One section of a site document: an anchor, a paired heading, paragraphs, and points if it lists any. */
export type DocumentSection = {
  id: string;
  heading: string;
  kanji: string;
  paragraphs: readonly string[];
  points?: readonly string[];
};

/**
 * THE BODY OF A SITE DOCUMENT: /privacy and /terms, drawn one way.
 *
 * It was the privacy page's own markup; the terms of play (PRIV-05) are "built
 * exactly like /privacy", and a second copy of these twenty lines is the
 * duplicate this site keeps finding a day too late (a puzzle's own size
 * picture, a race's own seat box). So both pages hand their sections here:
 * each an anchor, a paired heading under the site's stones, full-width text,
 * and the contact address a link wherever a sentence names it — a page that
 * says "write to us" and makes the reader copy an address has not said it.
 */
export function SectionedDocument({
  sections,
  contact,
  testId,
}: {
  sections: readonly DocumentSection[];
  contact: string;
  /** Each section's test id, so a page's spec counts its own sections. */
  testId: string;
}) {
  return (
    <>
      {sections.map((section, index) => (
        <section key={section.id} id={section.id} className="flex flex-col gap-3" data-testid={testId}>
          {index > 0 ? <BrandStones className="mb-2 opacity-70" /> : null}
          <SectionHeading title={section.heading} kanji={section.kanji} />
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[0.95rem] leading-relaxed text-ink-soft">
              {withContactLink(paragraph, contact)}
            </p>
          ))}
          {section.points ? (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.95rem] leading-relaxed text-ink-soft">
              {section.points.map((point) => (
                <li key={point}>{withContactLink(point, contact)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}

/** "2026-09-24" as "24 September 2026", in the site's own language, without Intl in render. */
export function longDate(iso: string): string {
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
function withContactLink(text: string, contact: string) {
  const parts = text.split(contact);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? (
        <a href={`mailto:${contact}`} className="underline underline-offset-4">
          {contact}
        </a>
      ) : null}
    </Fragment>
  ));
}
