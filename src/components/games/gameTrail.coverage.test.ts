import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GameTrail } from "./GameTrail";
import { code } from "./sourceScan";

/**
 * EVERY PAGE UNDER A GAME OPENS ITS TRAIL WITH GAMES.
 *
 * John, 2026-09-25: a game's page read "Games / Gomoji Mot", its set-up
 * "Gomoji Mot / Set up" and its board "Gomoji Mot / Set up / Play" — the root
 * gone one step down, because each page wrote its own trail and most began at
 * the game. `GameTrail` draws it once. This reads the source and fails the
 * build when:
 *
 * - a page under /games/[slug]/ is not listed below with the files that draw
 *   it, or a file listed there draws no `GameTrail`;
 * - a listed file hands the page to another component that draws a whole
 *   page (a `<Page>`) and that component is not listed too — a puzzle's
 *   branch, a match's finished or refused state;
 * - anywhere, a `crumb` leads up to a game by hand instead of through
 *   `GameTrail`.
 *
 * A new page fails until it is listed, which is the point: the trail is
 * decided when the page is made, not remembered afterwards.
 */

const GAME_ROUTES = "src/app/games/[slug]";

/** A match in each of its states: the hot-seat board, the live one, filed, refused, and a puzzle's race. */
const MATCH = [
  "src/app/games/[slug]/match/[id]/MatchPage.tsx",
  "src/app/games/[slug]/match/[id]/LiveMatch.tsx",
  "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx",
  "src/app/games/[slug]/match/[id]/RefusedOfferPage.tsx",
  "src/components/puzzles/PuzzleRacePage.tsx",
] as const;

/** Every file that draws a page under a game, by route: the page itself where it draws its own. */
const TRAIL_DRAWN_BY: Record<string, readonly string[]> = {
  "/games/[slug]": ["src/app/games/[slug]/page.tsx", "src/components/puzzles/PuzzleFrontDoor.tsx"],
  "/games/[slug]/rules": ["src/app/games/[slug]/rules/page.tsx"],
  "/games/[slug]/family": ["src/app/games/[slug]/family/page.tsx"],
  "/games/[slug]/background": ["src/app/games/[slug]/background/page.tsx"],
  "/games/[slug]/standings": ["src/app/games/[slug]/standings/page.tsx", "src/components/puzzles/PuzzleStandingsPage.tsx"],
  "/games/[slug]/new": ["src/components/live/SetUpHeading.tsx", "src/components/puzzles/PuzzleSetUpPage.tsx"],
  "/games/[slug]/begin": ["src/app/games/[slug]/begin/page.tsx"],
  "/games/[slug]/play": ["src/app/games/[slug]/play/page.tsx", "src/components/puzzles/PuzzlePlayPage.tsx"],
  "/games/[slug]/history": ["src/components/history/RecordPage.tsx", "src/components/puzzles/PuzzleRecordPage.tsx"],
  "/games/[slug]/history/[id]": ["src/components/puzzles/PuzzleSolvePage.tsx"],
  "/games/[slug]/me": ["src/app/games/[slug]/me/page.tsx", "src/components/history/RecordPage.tsx", "src/components/puzzles/PuzzleMePage.tsx"],
  "/games/[slug]/me/[solveId]": ["src/components/puzzles/PuzzleSolvePage.tsx"],
  "/games/[slug]/match/[id]": MATCH,
  // One move of a match is the same page, in all its states.
  "/games/[slug]/match/[id]/[move]": MATCH,
};

const DRAWS_TRAIL = /<GameTrail(Nav)?\b/;

/** Every route under a game that serves a page, with its file. */
function pages(dir = GAME_ROUTES, route = "/games/[slug]"): { route: string; path: string }[] {
  const found: { route: string; path: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") found.push({ route, path: join(dir, entry.name) });
    if (entry.isDirectory()) found.push(...pages(join(dir, entry.name), `${route}/${entry.name}`));
  }
  return found;
}

/** The file an import of `name` in `path` comes from, when it is one of ours. */
function importedFrom(path: string, source: string, name: string): string | null {
  const match = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"([^"]+)"`).exec(source);
  if (match === null) return null;
  const spec = match[1];
  const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : spec.startsWith(".") ? join(dirname(path), spec) : null;
  if (base === null) return null;
  return [`${base}.tsx`, join(base, "index.tsx")].find((file) => existsSync(file)) ?? null;
}

/** The components a file hands its whole page to: what it returns, when that draws a `<Page>` of its own. */
function pagesHandedTo(path: string): string[] {
  const source = readFileSync(path, "utf8");
  const handed = new Set<string>();
  for (const match of code(source).matchAll(/return\s*\(?\s*<([A-Z]\w+)/g)) {
    const file = importedFrom(path, source, match[1]);
    if (file !== null && /<Page\b/.test(code(readFileSync(file, "utf8")))) handed.add(file);
  }
  return [...handed];
}

/** The `{…}` that opens at `from`, braces counted, so a crumb is read to its end however long it is. */
function braced(source: string, from: number): string {
  let depth = 0;
  for (let i = from; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(from, i + 1);
  }
  return source.slice(from);
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

describe("the trail under a game", () => {
  it("opens with Games, then the game, then the page's own steps, each a link but the last", () => {
    const html = renderToStaticMarkup(
      createElement(GameTrail, {
        game: { label: "Gomoji Mot", href: "/games/gomoji-mot" },
        steps: [{ label: "Set up", href: "/games/gomoji-mot/new" }, { label: "Play" }],
      }),
    );
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toBe("Games / Gomoji Mot / Set up / Play");
    expect([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual(["/games", "/games/gomoji-mot", "/games/gomoji-mot/new"]);
    // On the game's own page the game is where the reader is, not a link.
    const home = renderToStaticMarkup(createElement(GameTrail, { game: { label: "Gomoku" } }));
    expect(home.replace(/<[^>]+>/g, "")).toBe("Games / Gomoku");
    expect([...home.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual(["/games"]);
  });

  it("is drawn on every page under a game, by the files listed for it", () => {
    const problems: string[] = [];
    const routes = pages();
    for (const { route, path } of routes) {
      const listed = TRAIL_DRAWN_BY[route];
      if (listed === undefined) {
        problems.push(`${route} (${path}) is not in TRAIL_DRAWN_BY: list the files that draw it, each drawing <GameTrail>`);
        continue;
      }
      for (const file of listed) {
        if (!existsSync(file)) problems.push(`${route}: ${file} does not exist`);
        else if (!DRAWS_TRAIL.test(code(readFileSync(file, "utf8")))) problems.push(`${route}: ${file} draws no <GameTrail>`);
      }
      // Whatever a listed file (or the page) hands the whole page to draws the trail too, so it is listed.
      for (const file of [path, ...listed].filter((one) => existsSync(one))) {
        for (const handed of pagesHandedTo(file)) {
          if (!listed.includes(handed)) problems.push(`${route}: ${file} hands its page to ${handed}, which is not listed for it`);
        }
      }
    }
    expect(problems).toEqual([]);
    const stale = Object.keys(TRAIL_DRAWN_BY).filter((route) => !routes.some((page) => page.route === route));
    expect(stale, "TRAIL_DRAWN_BY lists a page that no longer exists: take the line out").toEqual([]);
  });

  it("is never written by hand: a crumb up to a game is a GameTrail", () => {
    const found: string[] = [];
    for (const path of ["src/components", "src/app"].flatMap(filesUnder)) {
      const source = code(readFileSync(path, "utf8"));
      for (const match of source.matchAll(/crumb=\{/g)) {
        const crumb = braced(source, match.index + "crumb=".length);
        if (/gamePath\(/.test(crumb) && !DRAWS_TRAIL.test(crumb)) found.push(path);
      }
    }
    expect(found, "A crumb leading up to a game is drawn by <GameTrail>, so it opens with Games like every other").toEqual([]);
  });
});
