import Link from "@/components/ui/Link";

import { SECTION_TITLE } from "@/components/ui/ui.constants";
import type { FeedDay } from "@/lib/feed/feed.types";
import { dayHeading } from "@/lib/feed/feedWords";
import type { Speaker } from "@/lib/i18n/i18n";

import { FEED_KINDS } from "@/lib/feed/feed.constants";

import { FEED_DATE_FORMAT } from "./feed.constants";
import { FeedLine } from "./FeedLine";
import { FeedNewsLine } from "./FeedNewsLine";

/**
 * THE FEED, A DAY AT A TIME, newest first.
 *
 * An empty feed shows its shape — the day heading it would have, and the
 * sentence saying what arrives here — and a way to start filling it, rather
 * than hiding: an empty table is data, and "be the first to play" is the
 * invitation (AGENTS.md, "Show The Data, Not The Way To It").
 *
 * Server-rendered: a day heading's date is written by the server in the
 * reader's language, and nothing on this page is drawn a second time in the
 * browser to disagree with it. The time on each line is `LocalTime`'s, which
 * handles its own two drawings.
 */
export function FeedList({
  days,
  today,
  yesterday,
  say,
  empty,
  waysIn,
}: {
  days: readonly FeedDay[];
  /** The reader's own day keys, in the zone the lines were gathered in. */
  today: string;
  yesterday: string;
  say: Speaker;
  /** The sentence an empty feed says. */
  empty: string;
  /** Where an empty feed offers to go, as label and address. */
  waysIn: readonly { label: string; href: string; testId: string }[];
}) {
  if (days.length === 0) {
    return (
      <section className="flex flex-col gap-2" data-testid="feed-empty">
        <h2 className={SECTION_TITLE}>{say.say("feed.today")}</h2>
        <p className="text-sm text-muted">{empty}</p>
        <p className="flex flex-wrap gap-4 text-sm">
          {waysIn.map((way) => (
            <Link key={way.href} href={way.href} className="font-medium underline underline-offset-4" data-testid={way.testId}>
              {way.label}
            </Link>
          ))}
        </p>
      </section>
    );
  }
  const dates = new Intl.DateTimeFormat(say.tag, FEED_DATE_FORMAT);
  return (
    <div className="flex flex-col gap-6" data-testid="feed">
      {days.map((day) => {
        const heading = dayHeading(day.day, today, yesterday);
        return (
          <section key={day.day} className="flex flex-col" data-testid="feed-day" data-day={day.day}>
            <h2 className={SECTION_TITLE}>
              {"phrase" in heading ? say.say(heading.phrase) : dates.format(new Date(`${heading.date}T12:00:00Z`))}
            </h2>
            <ul className="flex flex-col divide-y divide-rule">
              {day.entries.map((entry) =>
                entry.kind === FEED_KINDS.news || entry.kind === FEED_KINDS.added ? (
                  <FeedNewsLine key={entry.id} entry={entry} say={say} />
                ) : (
                  <FeedLine key={entry.id} entry={entry} say={say} />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
