import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALL_BOARD_SIZES, BOARD_SIZE_DISPLAY } from "@/lib/gomoku/gomoku.constants";

/**
 * EVERY BOARD BLOCK IS THE BIG NUMBER, AND NO SIZE LINE UNDER IT.
 *
 * John first asked "why do we show the size below icons in some places and
 * not others????" — Checkers' lone block was a big numbered board and its
 * name, Domino Five's blocks were a smaller board, "13×13" and a name. The
 * first answer put the "13×13" line under every block. He came back:
 *
 *   "Remember I don't want the 9x9 size under every board... i want
 *   consistency. Like checkers, just the big number now. easier to read"
 *
 * So the rule, site-wide: a board-size picture carries its size as the big
 * number in the picture, and nothing printed beside it says the size again.
 * This reads the source and holds it there:
 *
 * - no file that draws a `BoardSizeMark` prints a "{size}×{size}" line, unless
 *   it is named below with its reason;
 * - every mark is told nothing beside it says the size (`words="none"`), so it
 *   names itself — "8 by 8 board" — and the size is heard once;
 * - the board picker draws one mark, at the one big size, then the name,
 *   with nothing inside the block decided by how many sizes there are;
 * - the old small mark and the old lone-board mark are gone, since there is
 *   only one size of mark to draw;
 * - every size a game is played on has a name to print under its number.
 */

/**
 * Files that draw a board-size mark AND print the size in text beside it,
 * each with its reason. Empty today, and John has said what he wants instead;
 * a line belongs here only for a place where the picture cannot carry the
 * number, and then that caller passes `words="beside"` so the size is still
 * heard once.
 */
const SIZE_TEXT_BESIDE_MARK: Record<string, string> = {};

const PICKER = "src/components/live/BoardPicker.tsx";

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (path.endsWith(".ts") || path.endsWith(".tsx")) out.push(path);
  }
  return out;
}

/** Comments blanked, so prose quoting the old drawing is not read as the drawing. */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

const SOURCES = filesUnder("src")
  .filter((path) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"))
  .map((path) => ({ path, source: code(readFileSync(path, "utf8")) }));

/** `{size}×{size}`, `${side}×${side}` — a size printed as text, whatever the variable is called. */
const SIZE_TEXT = /\$?\{([\w.]+)\}×\$?\{\1\}/;

describe("no board-size mark has its size printed beside it", () => {
  const callers = SOURCES.filter((file) => file.source.includes("<BoardSizeMark"));

  it("finds the callers it is checking", () => {
    expect(callers.map((file) => file.path)).toContain(PICKER);
  });

  it.each(callers.map((file) => [file.path, file.source] as const))("%s draws the big number and no size line", (path, source) => {
    const marks = source.match(/<BoardSizeMark\b[^>]*>/g) ?? [];
    if (SIZE_TEXT_BESIDE_MARK[path] !== undefined) {
      for (const mark of marks) expect(mark, `${path}: excused, so its size text is heard`).toContain('words="beside"');
      return;
    }
    expect(source, `${path} prints a "{size}×{size}" line beside a BoardSizeMark`).not.toMatch(SIZE_TEXT);
    for (const mark of marks) {
      expect(mark, `${path}: a mark with nothing beside it names its own size`).toContain('words="none"');
    }
  });

  it("names no exception that no longer draws a mark", () => {
    const drawing = new Set(callers.map((file) => file.path));
    for (const path of Object.keys(SIZE_TEXT_BESIDE_MARK)) {
      expect(drawing.has(path), `${path} is excused but draws no BoardSizeMark`).toBe(true);
    }
  });
});

describe("the board picker draws one block, whatever the number of sizes", () => {
  const source = SOURCES.find((file) => file.path === PICKER)?.source ?? "";
  // The block's contents: everything between its radio and the end of its label.
  const block = source.slice(source.indexOf("<input"), source.indexOf("</label>"));

  it("has the block to check", () => {
    expect(block.length).toBeGreaterThan(200);
  });

  it("draws the mark once, not one per case", () => {
    expect(source.match(/<BoardSizeMark\b/g) ?? []).toHaveLength(1);
  });

  it("draws it at the one big size", () => {
    expect(block).toMatch(/<BoardSizeMark\b[^>]*\bpx=\{BOARD_MARK_PX\}/);
  });

  it("decides nothing inside the block by how many sizes there are", () => {
    // The fault as it was written: `{only ? <lone mark> : <mark, size line>}`.
    expect(block).not.toMatch(/\bonly\s*(\?|&&|\|\|)/);
    expect(block).not.toMatch(/sizes\.length/);
  });

  it("draws the mark, then the name", () => {
    const mark = block.indexOf("<BoardSizeMark");
    const name = block.indexOf("<Paired");
    expect(mark, "the mark").toBeGreaterThanOrEqual(0);
    expect(name, "the name after the mark").toBeGreaterThan(mark);
  });

  it("has no second size of mark anywhere", () => {
    for (const retired of ["BOARD_BLOCK_MARK_PX", "BOARD_ONLY_MARK_PX"]) {
      const using = SOURCES.filter((file) => file.source.includes(retired)).map((file) => file.path);
      expect(using, retired).toEqual([]);
    }
  });
});

describe("every board has a name to print under its number", () => {
  it.each([...ALL_BOARD_SIZES])("%i×%i has a label and a kanji", (size) => {
    const copy = BOARD_SIZE_DISPLAY[size];
    expect(copy, `${size}×${size}`).toBeDefined();
    expect(copy?.label.length).toBeGreaterThan(0);
    expect(copy?.kanji.length).toBeGreaterThan(0);
  });
});
