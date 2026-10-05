import { describe, expect, it } from "vitest";

import { pencilEngine } from "@/lib/puzzles/pencil/engines";
import { PENCIL_KIND_LIST, PENCIL_SPECS } from "@/lib/puzzles/pencil/pencil.constants";

import { pencilSvg } from "./pencilDraw";

/**
 * EVERY PENCIL PUZZLE IS DRAWN from a board and from what is written on it, and marks what Show found wrong in a way
 * a plain drawing does not: Kazu's own drawing, with the one outline Hitori adds for a shaded square that is wrong.
 */
describe.each(PENCIL_KIND_LIST)("the drawing of %s", (kind) => {
  const size = PENCIL_SPECS[kind].defaultSize;
  const engine = pencilEngine(kind);
  const made = engine.make(size, "medium", 4);

  it("is drawn blank and as answered, and refuses a board that is not one", () => {
    const blank = pencilSvg(kind, size, made.givens, engine.blank(size, made.givens));
    const solved = pencilSvg(kind, size, made.givens, made.solution);
    expect(blank).toMatch(/^<svg /);
    expect(solved).toMatch(/^<svg /);
    expect(solved).not.toBe(blank);
    expect(pencilSvg(kind, size, "", made.solution)).toBeNull();
  });

  it("marks the mark Show found wrong, which a plain drawing does not", () => {
    // One right mark, and then the same board with that place called wrong.
    const next = engine.fix(size, engine.blank(size, made.givens), made.solution)!;
    expect(pencilSvg(kind, size, made.givens, next.code, { wrong: new Set([next.at]) })).not.toBe(pencilSvg(kind, size, made.givens, next.code));
  });
});
