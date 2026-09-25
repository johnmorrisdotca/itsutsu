import { activeTab, TAB_PARAM, type Tab } from "@/lib/ui/tabs";

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
 * So four views of one page. Going is the plain address, because it is what
 * the page is for.
 */
export const MY_GAMES_VIEWS = ["going", "completed", "pass-and-play", "puzzles"] as const;
export type MyGamesView = (typeof MY_GAMES_VIEWS)[number];

/** Which of the queue's groups each view draws. Puzzles are not in the queue at all. */
export const VIEW_GROUPS: Record<MyGamesView, readonly MyGameGroup[]> = {
  going: ["offered", "yourMove", "theirMove", "offerSent", "unstarted"],
  completed: ["finished"],
  "pass-and-play": ["hotSeat"],
  puzzles: [],
};

/** The view a group lives in: where `?all=<group>` opens, and where its "Show fewer" returns to. */
export function viewOfGroup(group: MyGameGroup): MyGamesView {
  return MY_GAMES_VIEWS.find((view) => VIEW_GROUPS[view].includes(group)) ?? "going";
}

/**
 * The view an address asks for. `?all=<group>` opens that group where it now
 * lives, so every "Show all 48" link and bookmark made before the tabs still
 * lands on the list it promised; otherwise `?view=`, and Going for anything
 * else.
 */
export function myGamesView(tabs: readonly Tab[], view: string | string[] | undefined, all: string | null): MyGamesView {
  const group = all === null ? undefined : Object.values(VIEW_GROUPS).flat().find((each) => each === all);
  if (group !== undefined) return viewOfGroup(group);
  return activeTab(tabs, view) as MyGamesView;
}

/** The address of a view: /play for Going, /play?view=<key> for the rest. */
export function viewHref(view: MyGamesView): string {
  return view === "going" ? "/play" : `/play?${TAB_PARAM}=${view}`;
}
