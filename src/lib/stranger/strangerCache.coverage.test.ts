import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { strangerPageFor } from "@/app/stranger/[[...path]]/strangerPages";
import { CASUAL_FAMILY_KEY } from "@/lib/casual/casual.constants";
import { CASUAL_SLUGS, GAME_SLUGS, HOUSEKI_SLUGS, PARTY_SLUGS, PUZZLE_SLUGS } from "@/lib/gomoku/slugs.data";
import { HOUSEKI_FAMILY_KEY } from "@/lib/houseki/houseki.constants";
import { GUIDES } from "@/lib/learn/strategy";
import { ABOUT_TABS } from "@/app/about/about.chapters";

import { strangerRouteFor } from "./strangerRoutes";

/**
 * THE KEPT COPIES OF THE OPEN PAGES, HELD TO THE RULES THEY LIVE UNDER.
 *
 * A reader with no session is answered from a copy of the open pages drawn at
 * most once an hour (`strangerRewrite.ts`, `app/stranger/[[...path]]`), so a
 * crawler's visit costs no render and no query. The copy is only as good as
 * four facts, each of which fails silently if it goes, and each is read from
 * the source here:
 *
 *  1. The route is `force-static` with an hourly `revalidate`, and draws
 *     nothing at build. Without the first it is a live route that nobody keeps;
 *     without the last the build reads the database, which once failed a deploy.
 *  2. Every address the gate sends there is a page the route can draw. An
 *     address with no page would be a 404 served to a stranger for a page that
 *     exists.
 *  3. Nothing a stranger's page draws reads the pathname with the bare hook. A
 *     page drawn at `/stranger/games/gomoku` and read in the browser at
 *     `/games/gomoku` would disagree at hydration (`strangerPath.ts`).
 *  4. The rewrite is reached from the gate's yes and nowhere else.
 */

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(ROOT, path)).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("the route that holds the copies", () => {
  const route = read("src/app/stranger/[[...path]]/page.tsx");

  it("is forced static, kept for an hour, and draws nothing while the site is built", () => {
    expect(route).toMatch(/export const dynamic = "force-static";/);
    const hours = Number(/export const revalidate = (\d+);/.exec(route)?.[1]);
    expect(hours, "revalidate must be a number the build can read").toBeGreaterThanOrEqual(600);
    expect(hours, "a copy older than a day is not the page a stranger would have had").toBeLessThanOrEqual(24 * 60 * 60);
    expect(route).toMatch(/export const dynamicParams = true;/);
    expect(route).toMatch(/export function generateStaticParams\(\) \{\s*return \[\];\s*\}/);
  });

  it("reads nothing of the request itself: a copy has none", () => {
    for (const path of ["src/app/stranger/[[...path]]/page.tsx", "src/app/stranger/[[...path]]/strangerPages.tsx"]) {
      expect(read(path), `${path} reads the request, which a kept copy does not have`).not.toMatch(/\b(cookies|headers|connection)\(\)|\bsearchParams\s*[:=]\s*await/);
    }
  });
});

describe("every address the gate sends there is a page the route draws", () => {
  const slugs = [
    ...Object.values(GAME_SLUGS),
    ...Object.values(PUZZLE_SLUGS),
    ...Object.values(PARTY_SLUGS),
    ...Object.values(CASUAL_SLUGS),
    ...Object.values(HOUSEKI_SLUGS),
    CASUAL_FAMILY_KEY,
    HOUSEKI_FAMILY_KEY,
  ];
  const addresses = [
    "/", "/join", "/about", "/learn", "/learn/cube", "/games", "/games/cards", "/games/list", "/privacy", "/terms", "/thanks", "/dice",
    ...ABOUT_TABS.slice(1).map((tab) => `/about/${tab.key}`),
    ...GUIDES.map((guide) => `/learn/${guide.slug}`),
    ...slugs.flatMap((slug) => [`/games/${slug}`, `/games/${slug}/rules`, `/games/${slug}/family`, `/games/${slug}/background`]),
  ];

  it("draws each of them", () => {
    const undrawn = addresses.filter((path) => strangerRouteFor(path) !== null && strangerPageFor(path.split("/").filter(Boolean)) === null);
    expect(undrawn, "the gate keeps these but the route has no page for them").toEqual([]);
    // And the list above is not vacuous: every address in it is kept.
    expect(addresses.filter((path) => strangerRouteFor(path) === null)).toEqual([]);
  });

  it("refuses an address the gate would not send, so the route cannot be asked to keep a made-up one", () => {
    for (const path of ["/games/not-a-game", "/about/not-a-chapter", "/learn/not-a-guide", "/players", "/games/gomoku/play"]) {
      expect(strangerPageFor(path.split("/").filter(Boolean)), path).toBeNull();
    }
  });
});

describe("the pathname a stranger's page reads", () => {
  it("is read with `useSitePathname`, never the bare hook", () => {
    const bare = [...filesUnder("src/components"), ...filesUnder("src/app")]
      .filter((path) => /\.(ts|tsx)$/.test(path) && !/\.test\./.test(path))
      .filter((path) => /\busePathname\b/.test(read(path)))
      .filter((path) => !path.endsWith("src/lib/stranger/useSitePathname.ts"));
    expect(
      bare,
      "read the pathname with useSitePathname (src/lib/stranger/useSitePathname.ts): inside a kept copy the bare hook says /stranger/…, which the browser does not",
    ).toEqual([]);
  });
});

describe("where the gate reaches the rewrite", () => {
  const gate = read("src/proxy.ts");

  it("calls it once, from the one place all three of the gate's yeses arrive", () => {
    expect(gate.match(/strangerRewrite\(request\)/g)?.length).toBe(1);
    const carryOn = gate.slice(gate.indexOf("async function carryOn"), gate.indexOf("export async function proxy"));
    expect(carryOn).toContain("strangerRewrite(request)");
    // After the shutter and the language, never before: the shutter refuses and the language redirects, and neither may be skipped by a copy.
    expect(carryOn.indexOf("maintenanceRefusal")).toBeLessThan(carryOn.indexOf("strangerRewrite"));
    expect(carryOn.indexOf("rememberLanguage")).toBeLessThan(carryOn.indexOf("strangerRewrite"));
  });
});
