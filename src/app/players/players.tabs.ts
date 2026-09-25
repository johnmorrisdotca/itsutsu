import type { Tab } from "@/lib/ui/tabs";

/*
 * Four lists that happen to be about players, so the page shows one at a
 * time. They were four headings stacked down one page — a directory of two
 * hundred, a ladder of fifty, the computer players and the kept records — and
 * the ladder was three screens below the fold on the day it was added.
 *
 * The members come first, so /players with nothing appended is still the list
 * of people it has always been, and a filtered directory is still an address
 * with no `view` on it.
 */
export const PLAYERS_TABS: Tab[] = [
  { key: "members", label: "Members", kanji: "会員" },
  /*
   * THE PEOPLE YOU PLAY, second — John, 2026-09-21: "We need Buddy LIst page."
   * Second rather than last because it is the shortest list and the one a
   * returning player wants: the members tab is two hundred names and this is
   * the handful of them you came for.
   */
  { key: "buddies", label: "Buddies", kanji: "仲間" },
  { key: "ladder", label: "Ladder", kanji: "番付" },
  /*
   * WHO IS BEST AT EACH GAME, a Players tab with a page of its own. John,
   * 2026-09-25: "Champions is a direct descendant of that, as it's a subset
   * of Players... yet there is no tab or link to view the Champs... bad
   * design." /champions draws this same strip with Champions open.
   */
  { key: "champions", label: "Champions", kanji: "名人", href: "/champions" },
  { key: "computers", label: "Computers", kanji: "機械" },
  { key: "remembered", label: "Remembered", kanji: "偲ぶ" },
];

/** The tabs drawn on /players itself; Champions is its own page. */
export const PLAYERS_OWN_TABS: Tab[] = PLAYERS_TABS.filter((tab) => tab.href === undefined);
