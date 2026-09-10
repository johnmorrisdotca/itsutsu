import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A record is shown one way, and this is what keeps it that way.
 *
 * The same four figures were drawn in a different shape on every page that
 * showed them — table columns on the members directory, a line of text on the
 * Computers tab beside it, tiles and then another table on a player's own
 * page. None of it was wrong; it had simply drifted, a page at a time, and
 * nothing failed while it drifted.
 *
 * So the check is not that the figures are right — `rating/figures.ts` has
 * always worded them in one place, and its own tests cover that. It is that
 * nothing reinvents the SHAPE. A component wanting to print a record has one
 * way to do it, and adding a tenth spelling of the same three counts fails
 * the build rather than shipping and being noticed in a screenshot months
 * later.
 *
 * Crude on purpose: it reads the files and looks for the shapes that drifted.
 * A cleverer check would need the components rendered, which is a browser
 * test, and this is a rule about source rather than about output.
 */

const COMPONENTS = "src/components";

/** The module every other component must go through, and the tests beside it. */
const ALLOWED = new Set(["PlayerRecord.tsx"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !ALLOWED.has(entry.name)) out.push(path);
  }
  return out;
}

const FILES = filesUnder(COMPONENTS).map((path) => ({ path, source: readFileSync(path, "utf8") }));

describe("a record is shown one way", () => {
  it("has files to check, so a passing run means something", () => {
    // A glob that quietly matched nothing would pass every case below.
    expect(FILES.length).toBeGreaterThan(20);
  });

  it("nobody prints the three counts as their own row of cells", () => {
    /*
     * The exact shape that was copied into three tables: a table cell holding
     * wins, then one holding losses, then one holding draws. The directory,
     * the ladder and the per-variant standings each had their own copy, and
     * each had drifted to a slightly different set of columns around it.
     */
    // Bounded: adjacent cells, not a wins here and a losses two hundred lines
    // later, which would fail a file that never copied anything.
    const triple = /<td[^>]*>\{[^}]*\.wins\}<\/td>[\s\S]{0,120}?<td[^>]*>\{[^}]*\.losses\}<\/td>/;
    const offenders = FILES.filter((file) => triple.test(file.source)).map((file) => file.path);
    expect(offenders, "use RecordCells from PlayerRecord.tsx instead").toEqual([]);
  });

  it("nobody prints the three counts as their own line of text", () => {
    // "7W · 4L · 1D" and its near neighbours, which the Computers tab had.
    const line = /\{[^}]*\.wins\}W[^<]{0,4}\{[^}]*\.losses\}L/;
    const template = /\$\{[^}]*\.wins\}W[^`]{0,4}\$\{[^}]*\.losses\}L/;
    const offenders = FILES.filter(
      (file) => line.test(file.source) || template.test(file.source),
    ).map((file) => file.path);
    expect(offenders, "use RecordLine from PlayerRecord.tsx instead").toEqual([]);
  });

  it("nobody works out a win rate of their own", () => {
    /*
     * A percentage computed in a component is a second definition of the
     * figure, and the two disagree the first time somebody decides whether a
     * draw is half a win. `figuresOf` decides that once.
     */
    const homeMade = /(wins|won)\s*\/\s*\(?\s*(played|total|wins)/;
    const offenders = FILES.filter((file) => homeMade.test(file.source)).map((file) => file.path);
    expect(offenders, "take the rate from figuresOf in rating/figures.ts").toEqual([]);
  });

  it("nobody lays out a run of number cells of their own", () => {
    /*
     * Narrower than it first was, and deliberately. A single cell of figures
     * — a rating, a place — reasonably shares the shared classes, and failing
     * that would be a rule nobody could follow. Three or more in one file is
     * the triple again under another name, which is the thing that drifted.
     */
    const cell = /py-1(\.5)? pr-3 font-mono tabular-nums/g;
    const offenders = FILES.filter((file) => (file.source.match(cell) ?? []).length >= 3).map(
      (file) => file.path,
    );
    expect(offenders, "a run of figure cells belongs to PlayerRecord.tsx").toEqual([]);
  });
});
