import { ABOUT_TABS } from "@/app/about/about.chapters";
import { CASUAL_FAMILY_KEY } from "@/lib/casual/casual.constants";
import { CASUAL_SLUGS, GAME_SLUGS, HOUSEKI_SLUGS, PARTY_SLUGS, PUZZLE_SLUGS } from "@/lib/gomoku/slugs.data";
import { HOUSEKI_FAMILY_KEY } from "@/lib/houseki/houseki.constants";
import { GUIDES } from "@/lib/learn/strategy";

import { STRANGER_PREFIX } from "./strangerPath";

/**
 * WHICH OPEN PAGES A READER WITH NO SESSION IS ANSWERED FROM A KEPT COPY.
 *
 * The pages a stranger may read are the same for every stranger, in a given
 * language, and a crawler or a passer-by costs a server render and a cold start
 * each time for a page that has not changed since the last one. They are drawn
 * once an hour instead, at `/stranger/<the page's own address>`
 * (`app/stranger/[[...path]]`), and the gate rewrites a stranger's request
 * there (`strangerRewrite.ts`). Pure: a path in, a path out, nothing read.
 *
 * ONLY ADDRESSES THAT ARE REAL PAGES. A kept copy is made the first time an
 * address is asked for, whatever it was, so an address that is not a page
 * would be kept too — a crawler walking `/games/anything` would grow the store
 * without end. So a game is named by the slugs the site has, a chapter by the
 * chapters it has, and everything else is left to the live route, which says
 * not found as it always did.
 *
 * AND ONLY ADDRESSES THE GATE ALREADY OPENS. The rewrite runs after the gate's
 * yes and never decides anything; `strangerRoutes.test.ts` holds that every
 * address answered here is one `proxy.ts` lets a stranger through to.
 */

/** Pages with no query of any kind that changes what they say: a query on these is dropped, as the live page drops it. */
const IGNORES_QUERY = ["/", "/about", "/learn", "/learn/cube", "/privacy", "/terms", "/thanks", "/dice"] as const;

/**
 * Pages that DO read their query. A copy is made only of the bare address, so
 * the copy says what the page says with no query: the catalogue's cards and
 * list views filter by letter and kind in it, and the door reads where to go
 * afterwards (`next`), handled in the browser (`JoinForm`).
 */
const READS_QUERY = ["/games", "/games/cards", "/games/list", "/join"] as const;

/** The facets of a game a stranger may read: see `OPEN_PATTERNS` in the gate. */
const FACETS = new Set(["rules", "family", "background"]);

const GAME_SLUG_SET: ReadonlySet<string> = new Set([
  ...Object.values(GAME_SLUGS),
  ...Object.values(PUZZLE_SLUGS),
  ...Object.values(PARTY_SLUGS),
  ...Object.values(CASUAL_SLUGS),
  ...Object.values(HOUSEKI_SLUGS),
  CASUAL_FAMILY_KEY,
  HOUSEKI_FAMILY_KEY,
]);

const ABOUT_VIEWS: ReadonlySet<string> = new Set(ABOUT_TABS.slice(1).map((tab) => tab.key));
const GUIDE_SLUGS: ReadonlySet<string> = new Set(GUIDES.map((guide) => guide.slug));

export type StrangerRoute = {
  /** The route the kept copy is drawn at. */
  path: string;
  /** Whether a query on the request changes the page, so only the bare address may be answered from the copy. */
  readsQuery: boolean;
};

/** Where the kept copy of an address is drawn, or null when the address is answered live. */
export function strangerRouteFor(pathname: string): StrangerRoute | null {
  const kept = (path: string, readsQuery: boolean): StrangerRoute => ({
    path: pathname === "/" ? STRANGER_PREFIX : `${STRANGER_PREFIX}${path}`,
    readsQuery,
  });
  if ((IGNORES_QUERY as readonly string[]).includes(pathname)) return kept(pathname, false);
  if ((READS_QUERY as readonly string[]).includes(pathname)) return kept(pathname, true);

  const parts = pathname.split("/");
  // ["", "games", slug] and ["", "games", slug, facet]
  if (parts[1] === "games" && parts[2] !== undefined && GAME_SLUG_SET.has(parts[2])) {
    if (parts.length === 3) return kept(pathname, false);
    if (parts.length === 4 && parts[3] !== undefined && FACETS.has(parts[3])) return kept(pathname, false);
    return null;
  }
  if (parts.length === 3 && parts[1] === "about" && parts[2] !== undefined && ABOUT_VIEWS.has(parts[2])) return kept(pathname, false);
  if (parts.length === 3 && parts[1] === "learn" && parts[2] !== undefined && GUIDE_SLUGS.has(parts[2])) return kept(pathname, false);
  return null;
}
