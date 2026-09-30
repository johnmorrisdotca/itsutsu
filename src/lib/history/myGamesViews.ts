import { type Tab } from "@/lib/ui/tabs";

import type { MyGameGroup } from "./myGames";

/**
 * MY GAMES, AS TABS.
 *
 * John, 2026-09-25, at /play with every group stacked down one page: "Lately
 * Finished table is horrible idea. to place it above games that are still
 * going. in IYT, it's just a link to see 'View Recently Completed games' at
 * the bottom of the page… we can use Tabs and have a Completed games tab" —
 * and of the hot-seat games, "what is at this screen?… it's really a
 * different mode and not really attached to my Gaming account… new tab".
 *
 * So views of one page. Going is the plain address, because it is what the
 * page is for.
 *
 * AND HISTORY, EVERY GAME IN ONE LIST. John, 2026-09-30, finding his card
 * games nowhere: "Should contain all games ever. Card. Maps. Reversi. All
 * games. Even those that aren't completed or just passed around." The other
 * tabs sort games by what they wait on; this one is everything the member has
 * played, of every kind, newest first, each opening to be carried on with or
 * looked at (`everyGame.ts`).
 *
 * THREE, NOT FOUR. There was a Puzzles tab, and a finished puzzle was then in
 * two places at once. John, 2026-09-26: "All completed should be in ONE tab,
 * and perhaps differentiated in there... maybe 2 columns Left and Right for
 * games and puzzles... but not two areas." So a puzzle left part way is under
 * Going and a finished one under Completed, each beside the games.
 */
export const MY_GAMES_VIEWS = ["going", "completed", "pass-and-play", "history"] as const;
export type MyGamesView = (typeof MY_GAMES_VIEWS)[number];

/** Which of the queue's groups each view draws. Puzzles are not in the queue at all: they are drawn beside it. */
export const VIEW_GROUPS: Record<MyGamesView, readonly MyGameGroup[]> = {
  going: ["offered", "yourMove", "theirMove", "offerSent", "unstarted"],
  completed: ["finished"],
  "pass-and-play": ["hotSeat"],
  // Every game of every kind, going or over, in one list of its own (`everyGame.ts`), not the queue's groups.
  history: [],
};

/** The view a group lives in: where `?all=<group>` opens, and where its "Show fewer" returns to. */
export function viewOfGroup(group: MyGameGroup): MyGamesView {
  return MY_GAMES_VIEWS.find((view) => VIEW_GROUPS[view].includes(group)) ?? "going";
}

/**
 * The view an address asks for. `?all=<group>` opens that group where it now
 * lives, so every "Show all 48" link and bookmark made before the tabs still
 * lands on the list it promised; otherwise the path's tab, and Going for
 * anything else (the page has already refused a tab it does not have).
 */
export function myGamesView(tabs: readonly Tab[], view: string | string[] | undefined, all: string | null): MyGamesView {
  const group = all === null ? undefined : Object.values(VIEW_GROUPS).flat().find((each) => each === all);
  if (group !== undefined) return viewOfGroup(group);
  const wanted = Array.isArray(view) ? view[0] : view;
  return tabs.some((tab) => tab.key === wanted) ? (wanted as MyGamesView) : "going";
}

/** The address of a view: /play for Going, /play/<key> for the rest (tabs are paths: `tabs.ts`). */
export function viewHref(view: MyGamesView): string {
  return view === "going" ? "/play" : `/play/${view}`;
}
