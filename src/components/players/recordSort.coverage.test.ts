import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DIRECTORY_SORT_SPEC } from "@/lib/rating/directory.sort";
import { LADDER_SORT_SPEC } from "@/lib/rating/ladder.sort";
import { sortWords } from "@/lib/api/paging";

/**
 * WHAT A TABLE'S HEADINGS PRESS HAS TO BE WHAT ITS LIST SORTS BY.
 *
 * `RecordSort.by` maps a heading slot to a sort word, and it is the one place in
 * this design where two lists have to agree: the slots are `RecordTable`'s and
 * the words are the spec's. A word the spec does not have is a heading linking to
 * a 400 — `SortableHead` throws rather than drawing plain text, so the mistake is
 * loud at the point it is made, and this is the gate that makes sure it is loud
 * in `pnpm test:unit` rather than in front of a reader.
 *
 * IT READS THE SOURCE rather than rendering the component, because rendering
 * needs a DOM and this project has none by design — `vitest.config.mts` says so:
 * anything needing a browser is a Playwright test. What can be checked here is
 * the DECLARATION, which is the half that rots silently.
 */

const LADDER = readFileSync(
  join(process.cwd(), "src/components/players/Ladder.tsx"),
  "utf8",
);

const DIRECTORY = readFileSync(
  join(process.cwd(), "src/components/players/Directory.tsx"),
  "utf8",
);

/** The `by: { … }` object out of a component's source, as slot → word. */
function slotsIn(source: string, after: string): Record<string, string> {
  const start = source.indexOf(after);
  expect(start, `"${after}" is not in that file any more`).toBeGreaterThan(-1);
  const open = source.indexOf("{", source.indexOf("by:", start));
  const close = source.indexOf("}", open);
  const body = source.slice(open + 1, close);
  return Object.fromEntries(
    [...body.matchAll(/(\w+)\s*:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]]),
  );
}

/** The slots `RecordTable` and `RecordHeadings` actually draw. */
const DRAWN = [
  /*
   * The SUBJECT heading — "Member", "Player", "Game" — which became a sortable
   * slot when the members directory learned to order by name. It is the only
   * table that presses it; every other one leaves the slot out and keeps the
   * plain heading it has always had, which is what `SortableHead` does for a
   * slot no spec names.
   */
  "subject",
  "played",
  "won",
  "lost",
  "drawn",
  "winRate",
  "streak",
  "rating",
  "tier",
  "joined",
];

describe("the ladder's sortable headings", () => {
  const by = slotsIn(LADDER, "const sort: RecordSort");

  it("presses at least the five columns the ladder can order by", () => {
    expect(Object.keys(by).sort()).toEqual(["drawn", "lost", "played", "rating", "won"]);
  });

  it("presses only words the ladder actually sorts by", () => {
    const words = sortWords(LADDER_SORT_SPEC);
    for (const [slot, word] of Object.entries(by)) {
      expect(words, `the "${slot}" heading presses "${word}"`).toContain(word);
    }
  });

  it("names only headings the table draws", () => {
    for (const slot of Object.keys(by)) expect(DRAWN).toContain(slot);
  });

  /*
   * THE OTHER FOUR ARE ABSENT ON PURPOSE, and the reason is the point of the
   * whole design: a heading that looked like the others and sorted the loaded
   * page in the browser would reorder twenty-five rows of however many there are
   * and present the result as the ladder. `LADDER_SORT_SPEC` says why each of
   * them cannot be ordered by; this asserts nobody has quietly added one.
   */
  it("leaves the four that cannot be ordered by as plain text", () => {
    for (const slot of ["winRate", "streak", "tier", "joined"]) {
      expect(by[slot], `"${slot}" has become sortable — is there a column behind it?`).toBeUndefined();
    }
  });

  /*
   * Every word the spec declares is reachable from a heading. Without this, a
   * sortable column could exist in the declaration, be indexed, be tested, and
   * have nothing on any page that presses it — present and never reached, which
   * is the shape AGENTS.md keeps warning about one layer down.
   */
  it("offers every column the ladder declares", () => {
    const pressed = new Set(Object.values(by));
    for (const word of sortWords(LADDER_SORT_SPEC)) {
      expect(pressed, `nothing on the page presses "${word}"`).toContain(word);
    }
  });
});

/**
 * THE MEMBERS DIRECTORY'S HEADINGS, which could not sort at all until its rows
 * came from one ordered query.
 *
 * Two things here that the ladder's block above has no version of, and both are
 * the point rather than an exception being made:
 *
 *   - IT PRESSES THE SUBJECT HEADING. Sorting by name is what a directory of
 *     six hundred people wants most, and it is the only table on the site that
 *     can: a ladder's rows are keyed by a folded name and a table of games has
 *     no name at all.
 *   - ONE DECLARED COLUMN IS DELIBERATELY NOT PRESSABLE. `seen` is the
 *     directory's own order — "most recently seen first", which is what the page
 *     has always meant — and how recently somebody was seen is drawn as a MARK
 *     in the name cell rather than as a column, so there is no heading over it.
 *     It is asserted rather than tolerated: this is the ONE column that may be
 *     unpressable, and it has to be reachable as a control some other way, which
 *     is the link `Directory.tsx` offers whenever another order is in force.
 */
describe("the members directory's sortable headings", () => {
  const by = slotsIn(DIRECTORY, "const sort: RecordSort");

  it("presses the six columns the directory can order by", () => {
    expect(Object.keys(by).sort()).toEqual([
      "drawn",
      "joined",
      "lost",
      "played",
      "subject",
      "won",
    ]);
  });

  it("presses only words the directory actually sorts by", () => {
    const words = sortWords(DIRECTORY_SORT_SPEC);
    for (const [slot, word] of Object.entries(by)) {
      expect(words, `the "${slot}" heading presses "${word}"`).toContain(word);
    }
  });

  it("names only headings the table draws", () => {
    for (const slot of Object.keys(by)) expect(DRAWN).toContain(slot);
  });

  it("leaves win rate, streak, rating and tier as plain text", () => {
    /*
     * Win rate is arithmetic on three columns and rounded; a streak is two
     * columns with no order over them; a tier is read off a rating — and the
     * RATING is not on this table at all. `DIRECTORY_SORT_SPEC` argues each, and
     * the rating's reason ends by pointing at the Ladder tab, which sorts by it
     * on `Player_rating_idx`. Faking any of them in the browser would reorder
     * one page of six hundred rows and present the result as the directory.
     */
    for (const slot of ["winRate", "streak", "rating", "tier"]) {
      expect(by[slot], `"${slot}" has become sortable — is there a column behind it?`).toBeUndefined();
    }
  });

  it("offers every column it declares except the one with no heading", () => {
    const pressed = new Set(Object.values(by));
    const unpressed = sortWords(DIRECTORY_SORT_SPEC).filter((word) => !pressed.has(word));
    // Exactly one, and exactly this one. A second unpressable column is a sort
    // that exists in the declaration and on no page — present and never
    // reached, which is what this whole file is for.
    expect(unpressed).toEqual(["seen"]);
    // It is the order a bare visit runs, which is why it needs no heading…
    expect(DIRECTORY_SORT_SPEC.fallback.param).toBe("seen");
    // …and there is still a control for it, so a reader can get back out of a
    // sort they pressed. Test the way back, not just the way there.
    expect(DIRECTORY, "nothing on the page returns to the directory's own order").toContain(
      "directory-own-order",
    );
  });
});
