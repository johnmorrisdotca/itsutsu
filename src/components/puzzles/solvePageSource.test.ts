import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The solve page's masthead said "Played on Itsutsu · [object Object]": `day` is a
 * LocalTime element, and a template string turns an element into that text. Read
 * the source, as the other coverage tests do: nothing that is JSX goes inside a
 * template literal here.
 */
describe("the solve page's masthead source", () => {
  it("never puts the day's element inside a template string", () => {
    const text = readFileSync(join(process.cwd(), "src/components/puzzles/PuzzleSolvePage.tsx"), "utf8");
    expect(text).not.toMatch(/`[^`]*\$\{day\}[^`]*`/);
  });
});
