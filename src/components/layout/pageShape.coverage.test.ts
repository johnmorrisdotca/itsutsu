import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PAGE_TITLE, SECTION_HEADING, SECTION_TITLE } from "@/components/ui/ui.constants";

/**
 * ONE PAGE SHAPE, ONE HEADING SCALE.
 *
 * John, 2026-09-24, with five pages side by side: "each page has a different
 * page... some pages are in a box, others are not. Some headers are different
 * sizes for pages next to each other. This is HIGHLY INCONSISTENT." Measured
 * that day the page title was four sizes and two faces, and it sat inside a
 * panel on fourteen pages and on the paper on the rest. The rule is written
 * over `PAGE_TITLE` in ui.constants.ts; this is the half of it that reads
 * the source and runs in `pnpm test:unit`, so a page that drifts fails the
 * build before it is drawn. `e2e/page-shape.spec.ts` is the other half: it
 * measures what a browser drew on every page.
 *
 * What is refused here:
 *
 * - an `<h1>` written by hand anywhere but `Headings.tsx`, where `PageTitle`
 *   is the one place a title is drawn;
 * - a `page.tsx` that draws no `<PageTitle>` and is not named below with the
 *   component that draws it for it, or the reason it has none;
 * - an `<h2>` with a size of its own: every section heading is
 *   `<SectionHeading>` or carries `SECTION_HEADING`, and every panel's label
 *   carries `SECTION_TITLE`.
 *
 * Every exception is a line here with its reason beside it.
 */

const ROOTS = ["src/components", "src/app"];

/** Where an h1 is written by hand, and why that one is not a page title. */
const HAND_WRITTEN_H1: Record<string, string> = {
  "src/components/layout/Headings.tsx": "PageTitle itself: the one place the h1 is drawn",
  "src/app/page.tsx": "the home page's hero, which is a hero rather than a title — John's one exception",
  "src/app/not-found.tsx": "the 404, said in the brand's own voice with no page frame around it",
  "src/components/auth/JoinForm.tsx": "the doorstep a stranger sees: a centred card, no masthead and no frame",
};

/** Pages whose title is drawn by a component they render, and which one. */
const TITLE_DRAWN_BY: Record<string, { by: string; reason: string }> = {
  "/history": { by: "src/components/history/RecordPage.tsx", reason: "the record is one page at three addresses" },
  "/games/[slug]/history": { by: "src/components/history/RecordPage.tsx", reason: "the record of one game" },
  "/games/new": { by: "src/components/live/SetUpHeading.tsx", reason: "the set-up screen's heading, shared with a game's own" },
  "/games/[slug]/new": { by: "src/components/live/SetUpHeading.tsx", reason: "the set-up screen for one game" },
  "/games/[slug]/match/[id]": {
    by: "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx",
    reason: "a finished game is titled by its players; a live one is a board, and the board is its title",
  },
  "/games/[slug]/match/[id]/[move]": {
    by: "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx",
    reason: "one move of a finished game, the same page",
  },
  "/games/[slug]/me/[solveId]": { by: "src/components/puzzles/PuzzleSolvePage.tsx", reason: "one of the reader's own finished puzzles, titled by the puzzle" },
  "/games/[slug]/history/[id]": { by: "src/components/puzzles/PuzzleSolvePage.tsx", reason: "anybody's finished puzzle, from the puzzle's record, titled by the puzzle" },
};

/** An h2 that is neither a section heading nor a panel's label, and what it is instead. */
const H2_OF_ITS_OWN: Record<string, string> = {
  "src/components/history/ResultCard.tsx": "the verdict on a result card — WON, LOST, DREW — a headline in the result's colour, not a section",
};

/** Pages with no title at all, and why. */
const NO_TITLE: Record<string, string> = {
  "/": "the home page opens with its hero",
  "/embed": "a widget drawn inside another site's frame",
  "/join": "the doorstep: a centred card with the wordmark over it and no page frame",
  "/games/[slug]/play": "a board to play on, and the board is the page",
};

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: readFileSync(path, "utf8") }));

/** Every route `src/app` serves a page at, with its file. */
function pages(dir = "src/app", prefix = ""): { route: string; path: string }[] {
  const found: { route: string; path: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") found.push({ route: prefix === "" ? "/" : prefix, path: join(dir, entry.name) });
    if (!entry.isDirectory()) continue;
    const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
    found.push(...pages(join(dir, entry.name), `${prefix}${segment}`));
  }
  return found;
}

/** The source with its comments blanked, so a rule quoted in prose is not a match. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/^\s*\/\/.*$/gm, "");
}

describe("page shape", () => {
  it("draws its scale from one place", () => {
    expect(PAGE_TITLE).toContain("text-2xl");
    expect(SECTION_HEADING).toContain("text-lg");
    expect(SECTION_TITLE).toContain("uppercase");
  });

  it("writes no h1 by hand outside PageTitle", () => {
    const found = FILES.filter(({ path, source }) => /<h1\b/.test(code(source)) && !(path in HAND_WRITTEN_H1)).map(
      ({ path }) => path,
    );
    expect(
      found,
      "An <h1> written by hand is a page choosing its own title size. Draw it with <PageTitle> " +
        "(src/components/layout/Headings.tsx), or name the file in HAND_WRITTEN_H1 with the reason it is not a page title.",
    ).toEqual([]);
    const stale = Object.keys(HAND_WRITTEN_H1).filter((path) => !FILES.some((file) => file.path === path && /<h1\b/.test(code(file.source))));
    expect(stale, "HAND_WRITTEN_H1 names a file that no longer writes an h1: take the line out").toEqual([]);
  });

  it("gives every page one PageTitle, or says who draws it or why there is none", () => {
    const problems: string[] = [];
    for (const { route, path } of pages()) {
      const source = code(readFileSync(path, "utf8"));
      const drawsItself = /<PageTitle\b/.test(source);
      if (route in NO_TITLE) {
        if (drawsItself) problems.push(`${route} is listed in NO_TITLE and draws a PageTitle: take the line out`);
        continue;
      }
      if (route in TITLE_DRAWN_BY) {
        const { by } = TITLE_DRAWN_BY[route];
        if (!/<PageTitle\b/.test(code(readFileSync(by, "utf8")))) problems.push(`${route} is titled by ${by}, which draws no PageTitle`);
        continue;
      }
      if (!drawsItself) {
        problems.push(
          `${route} (${path}) draws no <PageTitle>. Every page opens with one under the masthead; ` +
            "or name it in TITLE_DRAWN_BY with the component that draws it, or in NO_TITLE with the reason.",
        );
      }
    }
    expect(problems).toEqual([]);
    const routes = new Set(pages().map((page) => page.route));
    const stale = [...Object.keys(TITLE_DRAWN_BY), ...Object.keys(NO_TITLE)].filter((route) => !routes.has(route));
    expect(stale, "an exception for a page that no longer exists: take the line out").toEqual([]);
  });

  it("heads every section at one of the two sizes", () => {
    const found: string[] = [];
    for (const { path, source } of FILES) {
      if (path in H2_OF_ITS_OWN) continue;
      const stripped = code(source);
      for (const match of stripped.matchAll(/<h2\b([^>]*)>/g)) {
        const attributes = match[1];
        if (attributes.includes("SECTION_HEADING") || attributes.includes("SECTION_TITLE")) continue;
        const line = stripped.slice(0, match.index).split("\n").length;
        found.push(`${path}:${line}: <h2${attributes.trim() === "" ? "" : ` ${attributes.trim()}`}>`);
      }
    }
    expect(
      found,
      "An h2 with a size of its own. A section of a page is <SectionHeading> or carries SECTION_HEADING; " +
        "a panel's label from inside it carries SECTION_TITLE (both in src/components/ui/ui.constants.ts).",
    ).toEqual([]);
  });
});
