import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TABLE_SCROLL } from "./ui.constants";

/**
 * EVERY TABLE SCROLLS ITSELF, SO NO PAGE SCROLLS SIDEWAYS ON A PHONE.
 *
 * John, 2026-09-21: "Make sure these boards, etc fit on a mobile device."
 *
 * A table of records has six or seven columns that cannot be narrowed below
 * their own words, so on a 390-pixel phone it is simply wider than the screen.
 * Where it is not in a scroll box, the DOCUMENT takes that width instead:
 * /champions measured 570 pixels wide, and a browser answers that by drawing
 * the whole page — heading, prose, every other panel — small enough to fit.
 *
 * Eleven of the fourteen tables here already had `overflow-x-auto` on a
 * wrapper, which is why this is a gate and not a fix: the rule was known, most
 * of the code kept it, and nothing said so, so three tables were written
 * without it and nobody could tell. The eleven were also all subtly wrong —
 * see `TABLE_SCROLL`, where the missing `relative` is explained.
 *
 * IT READS THE SOURCE, like the other gates here, so a table added tomorrow
 * fails until it is either wrapped or named below with a reason.
 */

/**
 * Files that hold a `<table` and are allowed not to reach for `TABLE_SCROLL`,
 * each with its reason. A line here is a decision; the empty list is the
 * healthy state.
 */
const MAY_NOT_SCROLL = new Map<string, string>([
  [
    "tableScroll.coverage.test.ts",
    "This gate. It holds the strings it looks for, which is what makes it find them.",
  ],
  [
    "standings.coverage.test.ts",
    "A gate too: it holds \"<table\" to find the pages that draw standings.",
  ],
  [
    "xpColumn.coverage.test.ts",
    "A gate, not a page: it holds the STRING \"<table\" to find hand-built tables in other files.",
  ],
  [
    "ipColumn.coverage.test.ts",
    "A gate, not a page: it holds the STRING \"<table\" to find hand-built tables in other files.",
  ],
]);

/** Every source file under `src/`, since a table may be written in a page or a component alike. */
function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(path));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) found.push(path);
  }
  return found;
}

const FILES = sourceFiles("src").map((path) => ({ path, name: path.split("/").at(-1)!, source: readFileSync(path, "utf8") }));

describe("every table sits in a scroll box", () => {
  it("finds the tables at all, so a passing run is not an empty one", () => {
    const tables = FILES.filter((file) => file.source.includes("<table"));
    // Fourteen when this was written. The number is not the point; nought is.
    expect(tables.length).toBeGreaterThan(8);
  });

  it("wraps every table in TABLE_SCROLL", () => {
    const missing = FILES.filter(
      (file) => file.source.includes("<table") && !file.source.includes("TABLE_SCROLL") && !MAY_NOT_SCROLL.has(file.name),
    ).map((file) => file.path);
    expect(missing, "a table in a file that never mentions TABLE_SCROLL — wrap it, or name it in MAY_NOT_SCROLL with a reason").toEqual([]);
  });

  /*
   * And the class itself is not spelled out beside a table. A wrapper reading
   * `overflow-x-auto` is the shape that was wrong for eleven files at once:
   * it scrolls, and an absolutely positioned descendant — an `sr-only` column
   * label — still escapes it and widens the page.
   */
  it("leaves no table wrapped in a hand-written overflow class", () => {
    const handWritten = FILES.filter(
      (file) =>
        file.source.includes("<table") &&
        file.source.includes('"overflow-x-auto') &&
        !MAY_NOT_SCROLL.has(file.name),
    ).map((file) => file.path);
    expect(handWritten, "write TABLE_SCROLL rather than the class, so the `relative` half cannot be left off").toEqual([]);
  });

  it("is both halves: the box scrolls, and it contains what is positioned inside it", () => {
    expect(TABLE_SCROLL).toContain("overflow-x-auto");
    expect(TABLE_SCROLL).toContain("relative");
  });
});
