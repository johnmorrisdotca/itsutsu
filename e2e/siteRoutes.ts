import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, type PlaywrightWorkerArgs } from "@playwright/test";

import { generatePuzzle } from "../src/lib/puzzles/generate";
import { makeKeptId } from "../src/lib/party/kept/kept.constants";
import { ensureMember, memberIdFor, newestSolveOf, removeMember } from "./members";
import { suiteOperator } from "./operator";
import { removeTables } from "./tables";

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
 * on any database — and a game's facets are measured for a puzzle too, since
 * a puzzle has the same addresses and its own pages under them — the catalogue is code, and the two games and the member
 * are made by `seedRouteRows` below.
 */

/** Ids the specs make before a run. */
export type MadeRows = { filed: string; kept: string; live: string; member: string; solve: string; table: string };

/**
 * Where a route is measured: the address, plus any other views of the same
 * page that draw a different table or list under the same frame — a tab, a
 * layout — since each is a page to the reader moving between them.
 */
export type Route = { url: (made: MadeRows) => string; also?: readonly string[] } | { skip: string };

export const ROUTES: Record<string, Route> = {
  "/": { url: () => "/" },
  "/about": { url: () => "/about" },
  "/about/[view]": { url: () => "/about/games" },
  "/admin": { url: () => "/admin" },
  "/admin/[view]": { url: () => "/admin/tickets", also: ["/admin/members"] },
  "/admin/player-journeys": { url: () => "/admin/player-journeys" },
  "/backlog": { url: () => "/backlog" },
  "/champions": { url: () => "/champions" },
  "/embed": { skip: "a widget drawn inside another site's frame, not a page of this one" },
  "/famous": { url: () => "/famous" },
  "/feed": { url: () => "/feed" },
  "/feed/[view]": { url: () => "/feed/everyone" },
  "/games": { url: () => "/games" },
  "/games/cards": { url: () => "/games/cards" },
  "/games/list": { url: () => "/games/list" },
  "/games/party": { url: () => "/games/party" },
  "/games/dominoes": { url: () => "/games/dominoes" },
  "/games/colour-cards": { url: () => "/games/colour-cards" },
  "/games/[slug]": { url: () => "/games/gomoku", also: ["/games/number-place"] },
  "/games/[slug]/background": { url: () => "/games/gomoku/background", also: ["/games/number-place/background"] },
  "/games/[slug]/begin": { url: () => "/games/gomoku/begin" },
  "/games/[slug]/daily": { url: () => "/games/gomoji/daily", also: ["/games/gomoji/daily?language=japanese&month=all"] },
  "/games/[slug]/daily/[day]": { url: () => `/games/gomoji/daily/${new Date().toISOString().slice(0, 10)}` },
  "/games/[slug]/family": { url: () => "/games/hex/family", also: ["/games/number-place/family"] },
  "/games/[slug]/history": { url: () => "/games/gomoku/history", also: ["/games/number-place/history"] },
  "/games/[slug]/history/[id]": { url: (made) => `/games/number-place/history/${made.solve}` },
  "/games/[slug]/match/[id]": { url: (made) => `/games/gomoku/match/${made.live}` },
  "/games/[slug]/me/[solveId]": { url: (made) => `/games/number-place/me/${made.solve}` },
  "/games/[slug]/match/[id]/[move]": { url: (made) => `/games/gomoku/match/${made.filed}/5` },
  "/games/[slug]/me": { url: () => "/games/gomoku/me", also: ["/games/number-place/me"] },
  "/games/[slug]/new": { url: () => "/games/gomoku/new", also: ["/games/number-place/new"] },
  "/games/[slug]/pass-and-play": { url: () => "/games/chinese-checkers/pass-and-play" },
  "/games/[slug]/tables/[id]": { url: (made) => `/games/dots-and-boxes/tables/${made.table}` },
  "/games/[slug]/kept/[id]": { url: (made) => `/games/dots-and-boxes/kept/${made.kept}` },
  "/games/[slug]/play": { url: () => "/games/gomoku/play", also: ["/games/number-place/play"] },
  "/games/[slug]/rules": { url: () => "/games/gomoku/rules", also: ["/games/number-place/rules"] },
  "/games/[slug]/standings": { url: () => "/games/gomoku/standings", also: ["/games/number-place/standings"] },
  "/games/new": { url: () => "/games/new" },
  "/history": { url: () => "/history" },
  "/inbox": { url: () => "/inbox" },
  "/join": { skip: "the doorstep a stranger without an invite sees: a centred card, no masthead and no frame" },
  "/learn": { url: () => "/learn" },
  "/stop/[token]": { skip: "reached only through a signed link from an email; mail-stop.spec opens it with a real token and measures it at 390px" },
  "/learn/[slug]": { url: () => "/learn/five-in-a-row" },
  "/me": { url: () => "/me" },
  "/me/[view]": { url: () => "/me/settings", also: ["/me/profile"] },
  "/messages/[memberId]": { url: (made) => `/messages/${made.member}` },
  "/play": { url: () => "/play" },
  "/play/[view]": { url: () => "/play/completed" },
  "/players": {
    url: () => "/players",
  },
  "/players/buddies": { url: () => "/players/buddies" },
  "/players/ladder": { url: () => "/players/ladder" },
  "/players/bots": { url: () => "/players/bots" },
  "/players/honors": { url: () => "/players/honors" },
  "/players/[slug]": { url: (made) => `/players/${made.member}` },
  "/players/[slug]/[view]": { url: (made) => `/players/${made.member}/xp` },
  "/privacy": { url: () => "/privacy" },
  "/releases": { url: () => "/releases" },
  "/terms": { url: () => "/terms" },
  "/thanks": { url: () => "/thanks" },
  "/xp": { url: () => "/xp" },
  "/points": { url: () => "/points" },
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
  // A finished puzzle of the operator's own, handed in through the site as a solver's browser does.
  const puzzle = generatePuzzle("numberPlace", 4, "easy", 424242);
  const solved = await request.post("/api/puzzles/solved", {
    data: { kind: "numberPlace", size: 4, level: "easy", seed: 424242, givens: puzzle.givens, answer: puzzle.solution, elapsedMs: 42_000 },
  });
  expect(solved.ok()).toBe(true);
  // A party table on several devices, the operator in seat 1 and a link in seat 2: made through the set-up's own route.
  const table = await request.post("/api/tables", { data: { game: "dotsAndBoxes", size: 3, seats: [{ kind: "me" }, { kind: "link" }] } });
  expect(table.status(), await table.text()).toBe(201);
  const tableId = ((await table.json()) as { id: string }).id;
  // A game passed round one screen, filed as the browser files it: the id is the browser's, so it is new each run.
  const keptId = makeKeptId((count) => Array.from({ length: count }, () => Math.floor(Math.random() * 1000)));
  const kept = await request.post(`/api/kept-games/${keptId}`, {
    data: {
      game: "dotsAndBoxes",
      state: "route-rows",
      seats: [
        { name: under(`${member.name} Ren`), computer: false },
        { name: "", computer: true },
      ],
      over: false,
      left: false,
      winners: [],
    },
  });
  expect(kept.status(), await kept.text()).toBe(200);
  await request.dispose();
  await ensureMember(member);
  return {
    filed: filedId,
    kept: keptId,
    live: liveId,
    member: await memberIdFor(member.email),
    solve: await newestSolveOf(suiteOperator().email, "numberPlace"),
    table: tableId,
  };
}

/** Takes the member and the table away; the games go with the spec's tidy. */
export async function removeRouteRows(member: { email: string }, made?: MadeRows): Promise<void> {
  await removeMember(member.email);
  if (made) await removeTables([made.table, made.kept].filter(Boolean));
}
