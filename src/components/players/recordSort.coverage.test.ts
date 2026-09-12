import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
