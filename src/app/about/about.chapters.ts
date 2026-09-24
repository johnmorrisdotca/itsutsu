import type { Tab } from "@/lib/ui/tabs";

/**
 * THE ABOUT PAGE IN CHAPTERS, ONE AT A TIME.
 *
 * Measured at 390×844: /about was 28,589 pixels tall — thirty-four phone
 * screens of continuous prose, eleven sections deep, with the computer players
 * and the elder sites somewhere near the bottom of it. Nobody scrolls
 * thirty-four screens, so most of what this page says was written for readers
 * who would never reach it.
 *
 * John's standing rule is tabs rather than a long page for anything with
 * several sections, and Admin, /me and /players already follow it. This is the
 * page that most needed it and had it least.
 *
 * A CHAPTER IS DECLARED ON THE SECTION, never worked out from its title here.
 * A grouping that matched on titles would put a section in the wrong chapter —
 * silently, and on a page nobody reads all of — the day somebody reworded a
 * heading. `about.coverage.test.ts` holds every section to having one.
 */
export const ABOUT_CHAPTERS = {
  story: "story",
  start: "start",
  play: "play",
  games: "games",
  roots: "roots",
  japan: "japan",
  numbers: "numbers",
  programs: "programs",
} as const;

export type AboutChapter = (typeof ABOUT_CHAPTERS)[keyof typeof ABOUT_CHAPTERS];

/**
 * The chapters, in the order a reader meets them: why the site exists, how to
 * start playing and get in, what playing here is like, what is on it, where those games came from, the thread through all of them, how it
 * counts, and who else plays.
 *
 * SIX AND NOT FIVE. The games chapter held the catalogue AND four histories
 * and came to 13.5 phone screens on its own — which is the fault this was
 * meant to fix, moved rather than mended. What is HERE and where it CAME FROM
 * are two questions anyway, and a reader has one of them at a time.
 *
 * The first is the bare address, so a link to /about is still a link to the
 * page's opening rather than to a query string.
 */
export const ABOUT_TABS: Tab[] = [
  { key: ABOUT_CHAPTERS.story, label: "The story", kanji: "由来" },
  { key: ABOUT_CHAPTERS.start, label: "Getting started", kanji: "入門" },
  { key: ABOUT_CHAPTERS.play, label: "Playing here", kanji: "対局" },
  { key: ABOUT_CHAPTERS.games, label: "The games", kanji: "種目" },
  { key: ABOUT_CHAPTERS.roots, label: "Where they came from", kanji: "来歴" },
  { key: ABOUT_CHAPTERS.japan, label: "Japan", kanji: "和" },
  { key: ABOUT_CHAPTERS.numbers, label: "The numbers", kanji: "番付" },
  { key: ABOUT_CHAPTERS.programs, label: "The programs", kanji: "棋士" },
];
