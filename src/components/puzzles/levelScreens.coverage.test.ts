import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ONE SCREEN OF LEVELS, FOR EVERY GAME THAT HAS THEM. Tsunagi's levels came
 * first, and Suido's (2026-10-01) are the same screen: the sixteen tiles of a
 * block, the row of chips under a level, the table of its fastest times, and the
 * shelves a game with more sizes than four tiles turns through. Each was
 * written for Tsunagi, and each is now one component that both games draw, with
 * what is a game's own (how a solved level is marked, its words, its test ids)
 * handed in. A third game of levels draws these, and a second copy of any of
 * them is the fault this holds: two tile grids to keep in step, which is how
 * one game's locked block comes to look different from the other's.
 */
const FILES = readdirSync(join("src", "components", "puzzles"))
  .filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name))
  .map((name) => ({ name, source: readFileSync(join("src", "components", "puzzles", name), "utf8") }));

const defining = (pattern: RegExp) => FILES.filter(({ source }) => pattern.test(source)).map(({ name }) => name);

describe("the levels screen, one of each part", () => {
  it("draws a block's tiles in one component", () => {
    expect(defining(/aria-label=\{`Levels \$\{first\} to \$\{last\}`\}/)).toEqual(["LevelPicker.tsx"]);
  });

  it("draws the row of chips in one component", () => {
    expect(defining(/inline-flex items-center gap-1 rounded-full border px-2\.5 py-1 text-xs/)).toEqual(["LevelChips.tsx"]);
  });

  it("draws the table of a level's fastest times in one component", () => {
    expect(defining(/Fastest on level \{level\}/)).toEqual(["LevelFastestTable.tsx"]);
  });

  it("turns the shelves of sizes in one place", () => {
    expect(defining(/function shelvesOf\b/)).toEqual(["sizeShelves.ts"]);
    expect(defining(/\buseSizeShelves\(/).sort()).toEqual(["SuidoSetUp.tsx", "TsunagiSetUp.tsx", "sizeShelves.ts"]);
  });

  it("has each game's own pieces draw the shared one, never a copy", () => {
    for (const name of ["TsunagiLevelPicker.tsx", "SuidoLevelPicker.tsx"]) expect(FILES.find((file) => file.name === name)!.source, name).toContain("<LevelPicker");
    for (const name of ["TsunagiLevelChips.tsx", "SuidoLevelChips.tsx"]) expect(FILES.find((file) => file.name === name)!.source, name).toContain("<LevelChips");
    for (const name of ["TsunagiLevelFastest.tsx", "SuidoLevelFastest.tsx"]) expect(FILES.find((file) => file.name === name)!.source, name).toContain("<LevelFastestTable");
  });

  it("words the button to the next level in one place, for every game", () => {
    const lib = (path: string) => readFileSync(join("src", "lib", "puzzles", path), "utf8");
    expect(lib("fixedLevel.ts")).toMatch(/export function nextLevelLabel\b/);
    for (const path of [join("tsunagi", "levels.ts"), join("suido", "levels.ts")]) {
      expect(lib(path), path).not.toMatch(/function nextLevelLabel\b/);
      expect(lib(path), path).toContain('export { nextLevelLabel } from "../fixedLevel"');
    }
  });
});
