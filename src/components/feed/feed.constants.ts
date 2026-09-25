import { FEED_TABS } from "@/lib/feed/feed.constants";

/**
 * The feed page's Japanese headings, shown small beside the English (and as
 * the heading itself for a Japanese reader). The words are the phrase
 * catalogue's; these are the kanji the site pairs with a heading.
 */
export const FEED_KANJI = {
  title: "近況",
  [FEED_TABS.mine]: "自分と仲間",
  [FEED_TABS.everyone]: "皆",
} as const;

/** Where a reader with an empty feed goes to make it less empty. */
export const FEED_WAYS_IN = {
  play: "/games/new",
  buddies: "/players?view=buddies",
} as const;

/** How a day heading's date is written, in the reader's language. */
export const FEED_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
};
