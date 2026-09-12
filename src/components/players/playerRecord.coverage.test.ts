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

/**
 * The two modules every other component must go through.
 *
 * `PlayerRecord.tsx` owns the figures — played, W, L, D, the win rate and the
 * streak. `RecordTable.tsx` owns everything AROUND them: the table, the
 * headings, the order, the rating, the tier, the empty state. They are two
 * files rather than one because they are two jobs and one would be near the
 * line limit; they are both exempt here for the same reason, which is that
 * somebody has to actually draw the thing.
 */
const ALLOWED = new Set(["PlayerRecord.tsx", "RecordTable.tsx"]);

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
    /*
     * Both vocabularies. `figuresOf` returns won/lost/drawn and the record
     * types carry wins/losses/draws, so the same drawing exists twice in this
     * codebase under two sets of names — and a check that knew only one of
     * them let a fourth spelling of the record sit on the kept-record panel
     * for as long as that panel has existed. A guard that can be escaped by
     * renaming a field is a guard about spelling rather than about shape.
     */
    const line = /\{[^}]*\.(wins|won)\}W[^<]{0,4}\{[^}]*\.(losses|lost)\}L/;
    const template = /\$\{[^}]*\.(wins|won)\}W[^`]{0,4}\$\{[^}]*\.(losses|lost)\}L/;
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

  it("nobody builds a table of records around the shared cells", () => {
    /*
     * THE CHECK THAT MAKES THE REST OF THIS FILE WORTH HAVING, and it is new
     * because the old rules only ever guarded the four counts. Every page had
     * dutifully used `RecordCells` and then built its own table around them —
     * so the figures agreed and the COLUMNS did not. Five pages, four column
     * orders, two spellings of the same three counts, and one of them a list
     * of cards rather than a table at all. John: "Stats tables have to look
     * the same… Make sure we show the same columns in all places."
     *
     * So the headings and the cells may only be drawn by the component that
     * owns the whole table. A page wanting a record table asks for one; a page
     * wanting a column the table does not have asks for the column to be
     * added, where every page gets it at once.
     */
    const raw = /<Record(Headings|Cells)\b/;
    const offenders = FILES.filter((file) => raw.test(file.source)).map((file) => file.path);
    expect(offenders, "use RecordTable from RecordTable.tsx, which owns the columns").toEqual([]);
  });

  it("every record table says whose games it is counting", () => {
    /*
     * The `of` that makes each number a way into exactly the games it counted
     * used to be checked by regex on `<RecordCells … of={…}>` call sites in
     * `gameLinks.coverage.test.ts`. Those call sites are now inside
     * `RecordTable.tsx`, so the guarantee has moved to the TYPE: `of` is
     * required on `RecordTableRow` and on `RecordCells`, and so is `streak`.
     *
     * That is stronger than a regex — a type cannot be satisfied by writing
     * the right characters in the right order — but it is invisible, and an
     * invisible guarantee is one somebody deletes while tidying. This says out
     * loud where it lives.
     *
     * AND IT MOVED, WHICH THIS TEST IS WHY WE KNOW. `RecordTableRow` was inline
     * in `RecordTable.tsx` until that file reached the 500-line gate and the
     * types were split into `recordTable.types.ts` — the split AGENTS.md asks
     * for anyway. This assertion went red on the move, which is the test doing
     * exactly the job the paragraph above claims for it: it reads the file the
     * contract is IN, so it must follow the contract rather than the component.
     */
    const table = FILES.find((file) => file.path.endsWith("RecordTable.tsx"));
    // Not in FILES: it is on the ALLOWED list, so read it directly.
    const component = readFileSync(join(COMPONENTS, "players", "RecordTable.tsx"), "utf8");
    const source = readFileSync(join(COMPONENTS, "players", "recordTable.types.ts"), "utf8");
    expect(table, "RecordTable.tsx is exempt from the shape checks above").toBeUndefined();
    expect(source).toContain("of: RecordOf");
    expect(source).toContain("streak: Streak | null");
    // Neither is optional, which is the whole of the guarantee.
    expect(source).not.toMatch(/\bof\?:/);
    expect(source).not.toMatch(/\bstreak\?:/);
    // And the component still hands the row out, so the four importers have one door.
    expect(component).toContain('from "./recordTable.types"');
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
