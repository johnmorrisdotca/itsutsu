import { describe, expect, it } from "vitest";

import { HELD_ENGINES } from "@/lib/puzzles/pencil/held";
import { HELD_DISPLAY, HELD_PENCIL_KIND_LIST, HELD_SPECS } from "@/lib/puzzles/pencil/held.constants";
import { PENCIL_KIND_LIST } from "@/lib/puzzles/pencil/pencil.constants";

import { heldPencilSvg } from "./heldDraw";

/**
 * THE HELD PENCIL PUZZLES STAY WHOLE (`lib/puzzles/pencil/held.constants.ts`): not on the site, so nothing else
 * would notice if Kazu moved a drawing or a spec went stale. Each is drawn, from a board and from what is written
 * on it, and its tables say what a puzzle's would.
 */
describe.each(HELD_PENCIL_KIND_LIST)("the held %s", (kind) => {
  const size = HELD_SPECS[kind].defaultSize;
  const made = HELD_ENGINES[kind].make(size, "medium", 4);

  it("is drawn blank and as answered, and refuses a board that is not one", () => {
    const blank = heldPencilSvg(kind, size, made.givens, HELD_ENGINES[kind].blank(size, made.givens));
    const solved = heldPencilSvg(kind, size, made.givens, made.solution);
    expect(blank).toMatch(/^<svg /);
    expect(solved).toMatch(/^<svg /);
    expect(solved).not.toBe(blank);
    expect(heldPencilSvg(kind, size, "", made.solution)).toBeNull();
  });

  it("marks what Show found wrong, which a plain drawing does not", () => {
    const code = HELD_ENGINES[kind].blank(size, made.givens);
    const wrong = HELD_ENGINES[kind].fix(size, code, made.solution)!.at;
    const marked = heldPencilSvg(kind, size, made.givens, HELD_ENGINES[kind].fix(size, code, made.solution)!.code, { wrong: new Set([wrong]) });
    expect(marked).not.toBe(heldPencilSvg(kind, size, made.givens, HELD_ENGINES[kind].fix(size, code, made.solution)!.code));
  });

  it("has a spec, names and copy ready, none of them offered", () => {
    expect(HELD_DISPLAY[kind].rules.length).toBeGreaterThanOrEqual(3);
    expect(HELD_SPECS[kind].sizes).toContain(HELD_SPECS[kind].defaultSize);
    expect(PENCIL_KIND_LIST as readonly string[]).not.toContain(kind);
  });
});
