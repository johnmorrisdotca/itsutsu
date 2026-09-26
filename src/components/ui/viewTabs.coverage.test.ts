import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A CHOICE OF WHAT A PAGE SHOWS IS DRAWN AS TABS, never as a row of filled pills.
 *
 * John, 2026-09-25, at /xp and /players beside My games: "we are using tabs vs
 * buttons... should be tabs everywhere right?" Seven rows of dark pills chose
 * what a page listed — who, which XP, which view of the champions, a game's
 * letter and kind, the open seats' pace, rating and penalty, the backlog's
 * status, the record's format — and each had its own copy of the classes. They
 * are `ViewTabs` now, and this fails the build when a file draws the filled pill
 * again beside a selected state.
 *
 * The files below draw the same fill for a reason that is not a view switch,
 * each with the reason beside it.
 */
const ALLOWED: Record<string, string> = {
  "src/components/ui/ViewTabs.tsx": "the ticked box of an on-and-off switch (`ToggleLink`)",
  "src/components/live/BeginBar.tsx": "the set-up form's answers (colour, how many games), a form's choices rather than a view of a page",
};

const FILLED_PILL = /border-ink bg-ink text-paper/;
const SELECTED = /aria-(current|pressed|checked)/;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return name.endsWith(".tsx") ? [path] : [];
  });
}

describe("every view switch is tabs", () => {
  it("draws no row of filled pills beside a selected state, outside the files named with their reason", () => {
    const root = process.cwd();
    const offenders = sources(join(root, "src")).filter((path) => {
      const name = relative(root, path);
      if (name in ALLOWED) return false;
      const text = readFileSync(path, "utf8");
      return FILLED_PILL.test(text) && SELECTED.test(text);
    });
    expect(offenders.map((path) => relative(root, path))).toEqual([]);
  });

  it("names only files that still draw the fill, so an exception cannot outlive its reason", () => {
    for (const name of Object.keys(ALLOWED)) {
      expect(FILLED_PILL.test(readFileSync(join(process.cwd(), name), "utf8")), `${name} no longer draws the fill; take it off the list`).toBe(true);
    }
  });
});
