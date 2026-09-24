import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { ensureMember, memberIdFor, removeMember } from "./members";
import { readPageWidth } from "./pageWidth";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * EVERY PAGE IS ONE WIDTH, AND ITS TEXT RUNS THAT WIDTH.
 *
 * John, 2026-09-24: "We can't have pages be one width on one page, and then
 * change width in other pages. It needs to be consistent." He had watched the
 * header jump sideways between the games list and the players list for
 * months, and text stop at half the page on the games list and the XP page,
 * and nothing caught either. This visits every route the site has at a desk's
 * width and measures what was drawn: the left and right edge of everything
 * under the masthead, and any wrapped paragraph held short of its box by a
 * `max-width` (see `pageWidth.ts` for exactly what is measured).
 *
 * A FAILURE NAMES THE PAGE, THE WIDTHS AND THE ELEMENT, so it can be fixed
 * from the report. The frame is `PAGE_WIDTH` in `src/components/layout/Page.tsx`
 * and nothing else; a paragraph narrower on purpose carries
 * `data-width-reason="…"` in the source, which this reads and leaves alone.
 *
 * EVERY ROUTE IS LISTED, and the first test fails when one is not: a page
 * added without an entry here is a page nobody measured, which is how the
 * width drifted in the first place. A route that is not a page of the site's
 * frame at all is listed too, with the reason it is skipped.
 */

const VIEWPORT = { width: 1440, height: 900 };

/**
 * The frame, read from where it is decided. Read as text rather than imported:
 * `Page.tsx` is a React component, and its one constant is the only part of it
 * this file wants.
 */
const PAGE_WIDTH = /export const PAGE_WIDTH = "([^"]+)"/.exec(
  readFileSync(join(process.cwd(), "src/components/layout/Page.tsx"), "utf8"),
)?.[1] ?? "";

/** Tailwind's container sizes, which is all `PAGE_WIDTH` may be. */
const MAX_W_PX: Record<string, number> = {
  "max-w-3xl": 768,
  "max-w-4xl": 896,
  "max-w-5xl": 1024,
  "max-w-6xl": 1152,
  "max-w-7xl": 1280,
};
const FRAME_PX = MAX_W_PX[PAGE_WIDTH] ?? Number.NaN;

/** Ids this file makes before the run, filled in `beforeAll`. */
const made = { filed: "", live: "", member: "" };

/**
 * Where a route is measured: the address, plus any other views of the same
 * page that draw a different table or list under the same frame — a tab, a
 * layout — since each is a page to the reader moving between them.
 */
type Route = { url: () => string; also?: readonly string[] } | { skip: string };

/**
 * Every `page.tsx` under `src/app`, by its route, and the address it is
 * measured at. A dynamic segment is filled with a game, a member or a lesson
 * that exists on any database — the catalogue is code, and the two games and
 * the member are made below.
 */
const ROUTES: Record<string, Route> = {
  "/": { url: () => "/" },
  "/about": { url: () => "/about" },
  "/admin": { url: () => "/admin" },
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
  "/games/[slug]/match/[id]": { url: () => `/games/gomoku/match/${made.live}` },
  "/games/[slug]/match/[id]/[move]": { url: () => `/games/gomoku/match/${made.filed}/5` },
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
  "/messages/[memberId]": { url: () => `/messages/${made.member}` },
  "/play": { url: () => "/play" },
  "/players": {
    url: () => "/players",
    also: ["/players?view=buddies", "/players?view=ladder", "/players?view=computers", "/players?view=remembered"],
  },
  "/players/[slug]": { url: () => `/players/${made.member}` },
  "/releases": { url: () => "/releases" },
  "/thanks": { url: () => "/thanks" },
  "/xp": { url: () => "/xp" },
  "/xp/levels": { url: () => "/xp/levels" },
  "/xp/levels/[level]": { url: () => "/xp/levels/1" },
  "/xp/promotions": { url: () => "/xp/promotions" },
};

/** Every route `src/app` serves a page at, as `/games/[slug]`. */
function appRoutes(dir = join(process.cwd(), "src/app"), prefix = ""): string[] {
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

const WIDTH_MEMBER = { email: "page-width@example.test", name: "Width Check" };

test.describe("page width", () => {
  test.use({ viewport: VIEWPORT });
  const under = namesPlayedUnder();
  const track = gamesMade();

  test("every page the site serves is measured here, or says why not", () => {
    expect(FRAME_PX, `PAGE_WIDTH is "${PAGE_WIDTH}", which is not a size this spec knows`).not.toBeNaN();
    const missing = appRoutes().filter((route) => !(route in ROUTES));
    const stale = Object.keys(ROUTES).filter((route) => !appRoutes().includes(route));
    expect(missing, "pages with no entry in ROUTES in e2e/page-width.spec.ts: add each, with an address to measure").toEqual([]);
    expect(stale, "entries in ROUTES for pages that no longer exist: take them out").toEqual([]);
  });

  test.beforeAll(async ({ playwright, baseURL }) => {
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
        blackName: under("Width Black"),
        whiteName: under("Width White"),
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
    made.filed = track(((await filed.json()) as { id: string }).id);
    const live = await request.post("/api/games/live", {
      data: { blackName: under("Width Kai"), whiteName: under("Width Mio"), size: 15 },
    });
    expect(live.status()).toBe(201);
    made.live = track(((await live.json()) as { id: string }).id);
    await request.dispose();
    await ensureMember(WIDTH_MEMBER);
    made.member = await memberIdFor(WIDTH_MEMBER.email);
  });

  test.afterAll(async () => {
    await removeMember(WIDTH_MEMBER.email);
  });

  const measured = Object.entries(ROUTES).flatMap(([route, entry]) =>
    "skip" in entry
      ? []
      : [
          { route, name: route, url: entry.url },
          ...(entry.also ?? []).map((view) => ({ route, name: view, url: () => view })),
        ],
  );
  for (const { route, name, url: address } of measured) {
    test(`${name} is the site's width, and so is its text`, async ({ page }) => {
      const url = address();
      const answered = await page.goto(url, { waitUntil: "load" });
      expect(answered?.status(), `${url} did not load`).toBeLessThan(400);
      // What loads after the first paint — a table, a list — changes the edges.
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

      const { left, right, atLeft, atRight, capped } = await readPageWidth(page);
      const expectedLeft = Math.round((VIEWPORT.width - FRAME_PX) / 2);
      const expectedRight = expectedLeft + FRAME_PX;
      expect.soft(
        { left, right },
        `${url} (${route}): the page runs ${left}–${right}px, ${right - left}px wide; every page is ` +
          `${expectedLeft}–${expectedRight}px, ${FRAME_PX}px (PAGE_WIDTH = "${PAGE_WIDTH}" in ` +
          "src/components/layout/Page.tsx). Something on this page is wider or narrower than the frame: " +
          `a max-w-… of its own, or content that does not fill it. At the left edge: ${atLeft}. ` +
          `At the right edge: ${atRight}.`,
      ).toEqual({ left: expectedLeft, right: expectedRight });

      const report = capped.map(
        (cap) =>
          `${cap.element} is ${cap.width}px of the ${cap.available}px it sits in (max-width ${cap.maxWidth}, ` +
          `class "${cap.classes}"), so "${cap.sample}…" stops part way`,
      );
      expect.soft(
        report,
        `${url} (${route}): text held short of the page by a max-width. Take the max-w-… off so it runs the ` +
          'frame, or put data-width-reason="…" on that element saying why it is narrower.',
      ).toEqual([]);
    });
  }
});
