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
  name: string;
  kanji: string;
  what: string;
  open: boolean;
};

export const SITE_PAGES: readonly SitePage[] = [
  { path: "/games", name: "Games", kanji: "種目", what: "Every game here, by family, with its rules, its board and its background.", open: true },
  { path: "/learn", name: "Learn", kanji: "学び", what: "Strategy guides: the shapes that win, the moves that force, the mistakes everyone makes once.", open: true },
  { path: "/about", name: "About", kanji: "五つについて", what: "This page: where the site and its games came from.", open: true },
  { path: "/join", name: "Join", kanji: "入会", what: "Use an invite code, or ask for one.", open: true },
  { path: "/play", name: "My games", kanji: "対局", what: "Your games in progress, the ones waiting on you first, and open seats to take.", open: false },
  { path: "/history", name: "Record", kanji: "棋譜", what: "Every finished game, replayable move by move.", open: false },
  { path: "/players", name: "Players", kanji: "対局者", what: "Everybody who plays, the ladder, and the computer players.", open: false },
  { path: "/champions", name: "Champions", kanji: "名人", what: "Who stands at the top of each game.", open: false },
  { path: "/famous", name: "Famous games", kanji: "名局", what: "Championship and historic games, replayed through this site's own rules.", open: false },
  { path: "/xp", name: "XP", kanji: "経験値", what: "Experience and levels: everybody by what they have earned.", open: false },
  { path: "/inbox", name: "Inbox", kanji: "受信", what: "What happened in your games while you were away.", open: false },
];
