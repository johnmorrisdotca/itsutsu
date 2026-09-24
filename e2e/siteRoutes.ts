import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, type PlaywrightWorkerArgs } from "@playwright/test";

import { ensureMember, memberIdFor, removeMember } from "./members";

/**
 * EVERY PAGE THE SITE SERVES, listed once, with the address each is measured at.
 *
 * Two specs walk the whole site and measure what was drawn — `page-width`
 * (one frame, text that runs it) and `page-shape` (one title, one heading
 * scale, content in panels). They want the same list, and a list kept twice
 * is a page measured by one and missed by the other. So the routes live
 * here, and `appRoutes()` reads `src/app` so a page added without an entry
 * fails both specs rather than going unmeasured.
 *
 * A dynamic segment is filled with a game, a member or a lesson that exists
 * on any database — the catalogue is code, and the two games and the member
 * are made by `seedRouteRows` below.
 */

/** Ids the specs make before a run. */
export type MadeRows = { filed: string; live: string; member: string };

/**
 * Where a route is measured: the address, plus any other views of the same
 * page that draw a different table or list under the same frame — a tab, a
 * layout — since each is a page to the reader moving between them.
 */
export type Route = { url: (made: MadeRows) => string; also?: readonly string[] } | { skip: string };

export const ROUTES: Record<string, Route> = {
  "/": { url: () => "/" },
  "/about": { url: () => "/about", also: ["/about?view=games"] },
  "/admin": { url: () => "/admin", also: ["/admin?view=work"] },
  "/backlog": { url: () => "/backlog" },
  "/champions": { url: () => "/champions" },
  "/embed": { skip: "a widget drawn inside another site's frame, not a page of this one" },
  "/famous": { url: () => "/famous" },
  "/games": { url: () => "/games", also: ["/games?view=list"] },
  "/games/[slug]": { url: () => "/games/gomoku" },
  "/games/[slug]/background": { url: () => "/games/gomoku/background" },
  "/games/[slug]/begin": { url: () => "/games/gomoku/begin" },
  "/games/[slug]/family": { url: () => "/games/hex/family" },
  "/games/[slug]/history": { url: () => "/games/gomoku/history" },
  "/games/[slug]/match/[id]": { url: (made) => `/games/gomoku/match/${made.live}` },
  "/games/[slug]/match/[id]/[move]": { url: (made) => `/games/gomoku/match/${made.filed}/5` },
  "/games/[slug]/me": { url: () => "/games/gomoku/me" },
  "/games/[slug]/new": { url: () => "/games/gomoku/new" },
  "/games/[slug]/play": { url: () => "/games/gomoku/play" },
  "/games/[slug]/rules": { url: () => "/games/gomoku/rules" },
  "/games/[slug]/standings": { url: () => "/games/gomoku/standings" },
  "/games/new": { url: () => "/games/new" },
  "/history": { url: () => "/history" },
  "/inbox": { url: () => "/inbox" },
  "/join": { skip: "the doorstep a stranger without an invite sees: a centred card, no masthead and no frame" },
  "/learn": { url: () => "/learn" },
  "/learn/[slug]": { url: () => "/learn/five-in-a-row" },
  "/me": { url: () => "/me" },
  "/messages/[memberId]": { url: (made) => `/messages/${made.member}` },
  "/play": { url: () => "/play" },
  "/players": {
    url: () => "/players",
    also: ["/players?view=buddies", "/players?view=ladder", "/players?view=computers", "/players?view=remembered"],
  },
  "/players/[slug]": { url: (made) => `/players/${made.member}` },
  "/privacy": { url: () => "/privacy" },
  "/releases": { url: () => "/releases" },
  "/thanks": { url: () => "/thanks" },
  "/xp": { url: () => "/xp" },
  "/xp/levels": { url: () => "/xp/levels" },
  "/xp/levels/[level]": { url: () => "/xp/levels/1" },
  "/xp/promotions": { url: () => "/xp/promotions" },
};

/** Every route `src/app` serves a page at, as `/games/[slug]`. */
export function appRoutes(dir = join(process.cwd(), "src/app"), prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") found.push(prefix === "" ? "/" : prefix);
    if (!entry.isDirectory()) continue;
    // A route group names no segment of the address.
    const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
    found.push(...appRoutes(join(dir, entry.name), `${prefix}${segment}`));
  }
  return found;
}

/** The routes a spec visits: each address, and each extra view, as its own case. */
export function measuredRoutes(made: MadeRows): { route: string; name: string; url: () => string }[] {
  return Object.entries(ROUTES).flatMap(([route, entry]) =>
    "skip" in entry
      ? []
      : [
          { route, name: route, url: () => entry.url(made) },
          ...(entry.also ?? []).map((view) => ({ route, name: view, url: () => view })),
        ],
  );
}

/** The routes the list is missing, and the entries for pages that no longer exist. */
export function routeListProblems(): { missing: string[]; stale: string[] } {
  const served = appRoutes();
  return {
    missing: served.filter((route) => !(route in ROUTES)),
    stale: Object.keys(ROUTES).filter((route) => !served.includes(route)),
  };
}

/**
 * The rows the dynamic routes need: a filed game with moves, a live game, and
 * a member of the spec's own. `under` and `track` are the spec's tidy helpers,
 * so what is made here is taken away by the file that made it.
 */
export async function seedRouteRows(
  playwright: PlaywrightWorkerArgs["playwright"],
  baseURL: string | undefined,
  member: { email: string; name: string },
  under: (name: string) => string,
  track: (id: string) => string,
): Promise<MadeRows> {
  const request = await playwright.request.newContext({ baseURL, storageState: ".auth/admin.json" });
  const moves = [
    [7, 3],
    [0, 0],
    [7, 4],
    [0, 1],
    [7, 5],
    [0, 2],
    [7, 6],
    [0, 3],
    [7, 7],
  ].map(([row, col], index) => ({ row, col, stone: index % 2 === 0 ? "black" : "white" }));
  const filed = await request.post("/api/games", {
    data: {
      blackName: under(`${member.name} Black`),
      whiteName: under(`${member.name} White`),
      size: 15,
      winLength: 5,
      variant: "freestyle",
      obstacles: "none",
      opener: "black",
      result: "black",
      winner: "black",
      moves,
    },
  });
  expect(filed.status()).toBe(201);
  const filedId = track(((await filed.json()) as { id: string }).id);
  const live = await request.post("/api/games/live", {
    data: { blackName: under(`${member.name} Kai`), whiteName: under(`${member.name} Mio`), size: 15 },
  });
  expect(live.status()).toBe(201);
  const liveId = track(((await live.json()) as { id: string }).id);
  await request.dispose();
  await ensureMember(member);
  return { filed: filedId, live: liveId, member: await memberIdFor(member.email) };
}

/** Takes the member away; the games go with the spec's tidy. */
export async function removeRouteRows(member: { email: string }): Promise<void> {
  await removeMember(member.email);
}
