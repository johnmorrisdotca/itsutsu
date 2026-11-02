import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TSUNAGI'S BOARD IS DRAWN IN ONE PLACE, AND IT IS THE PACKAGE. John, 2026-10-01: "bridges for Tsunagi don't look like
 * the ones in Itsutsu... are bridges rendered differently per consumer? Is it part of a repo?" They were: the site kept
 * a drawing of its own beside the package's, and each changed without the other. Now the site brings the wood, its
 * colours for it and the words, and the package draws the rest. This reads the source and fails if a second drawing
 * comes back, whichever file it arrives in.
 */
const DIR = join(process.cwd(), "src/components/puzzles");
const tsunagiFiles = readdirSync(DIR).filter((name) => /^tsunagi/i.test(name) && /\.tsx?$/.test(name) && !name.endsWith(".test.ts"));
const read = (name: string) => readFileSync(join(DIR, name), "utf8");

/** What only a drawing of the board writes: the package's job. */
const DRAWS = [
  { what: "a line's stroke", pattern: /<polyline\b/ },
  { what: "a hexagon's outline", pattern: /<polygon\b/ },
  { what: "a marble or ring", pattern: /<circle\b/ },
  { what: "a line's runs worked out here", pattern: /\brunsOf\b/ },
  { what: "the honeycomb's arithmetic", pattern: /\bhexagonFit\b|\bHEX_LATTICE\b|\bhexagonPoints\b/ },
];

describe("Tsunagi's board has one drawing", () => {
  it("found the files to read", () => {
    expect(tsunagiFiles).toContain("TsunagiGrid.tsx");
    expect(tsunagiFiles.length).toBeGreaterThan(5);
  });

  for (const { what, pattern } of DRAWS) {
    it(`draws ${what} nowhere on the site`, () => {
      expect(tsunagiFiles.filter((name) => pattern.test(read(name)))).toEqual([]);
    });
  }

  it("takes the board from the package, on the wood every board has", () => {
    const grid = read("TsunagiGrid.tsx");
    expect(grid).toMatch(/from "@johnmorrisdotca\/tsunagi\/draw"/);
    expect(grid).toMatch(/\btsunagiDrawing\(/);
    expect(grid).toMatch(/surface: true/);
    expect(grid).toMatch(/<PuzzleBoard\b/);
    // A press is found by the arithmetic that placed the drawing, so the two cannot disagree.
    expect(grid).toMatch(/\bcellAtPoint\(/);
  });

  it("keeps no colours of its own for a pair's marble or line", () => {
    const constants = read("puzzles.constants.ts");
    expect(constants).not.toMatch(/\bTSUNAGI_COLOURS\b|\btsunagiLineColour\b|\btsunagiWash\b|\btsunagiPortalColour\b/);
  });
});
