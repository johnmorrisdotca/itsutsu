import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * THE MAP OF THE SITE the About page prints, as data.
 *
 * `open` says whether somebody with no invite can read the page, and it is a
 * claim about `src/proxy.ts` that this file cannot enforce: the gate decides,
 * and this only describes. So `about.coverage.test.ts` asks the gate itself
 * (`wouldBeOpen`) about every row, and a row that has stopped telling the truth
 * fails the build rather than inviting a stranger to a door that is shut.
 */
export type SitePage = {
  path: string;
  /** The page's name and what it is for, as phrases: each is a word the reader meets in their own language. */
  name: PhraseKey;
  kanji: string;
  what: PhraseKey;
  open: boolean;
};

export const SITE_PAGES: readonly SitePage[] = [
  { path: "/games", name: "about.page.games", kanji: "種目", what: "about.page.gamesWhat", open: true },
  { path: "/learn", name: "about.page.learn", kanji: "学び", what: "about.page.learnWhat", open: true },
  { path: "/about", name: "about.page.about", kanji: "五つについて", what: "about.page.aboutWhat", open: true },
  { path: "/join", name: "about.page.join", kanji: "入会", what: "about.page.joinWhat", open: true },
  { path: "/play", name: "about.page.play", kanji: "対局", what: "about.page.playWhat", open: false },
  { path: "/history", name: "about.page.history", kanji: "棋譜", what: "about.page.historyWhat", open: false },
  { path: "/players", name: "about.page.players", kanji: "対局者", what: "about.page.playersWhat", open: false },
  { path: "/champions", name: "about.page.champions", kanji: "名人", what: "about.page.championsWhat", open: false },
  { path: "/famous", name: "about.page.famous", kanji: "名局", what: "about.page.famousWhat", open: false },
  { path: "/xp", name: "about.page.xp", kanji: "経験値", what: "about.page.xpWhat", open: false },
  { path: "/inbox", name: "about.page.inbox", kanji: "受信", what: "about.page.inboxWhat", open: false },
];
