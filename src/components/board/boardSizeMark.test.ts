import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ALL_BOARD_SIZES } from "@/lib/gomoku/gomoku.constants";

import { boardSizeWords } from "./Board.constants";
import type { BoardSizeMarkWords } from "./board.types";
import { BoardSizeMark } from "./BoardSizeMark";
import { boardSizeMarkVoice, boardSizeNumeralPx } from "./boardSizeVoice";

/**
 * The board-size mark: its number, its density, and its two ways of being
 * heard.
 *
 * These run in node, so the component is drawn to a string with
 * `renderToStaticMarkup` — which is exactly what reaches a screen reader: the
 * attributes on the element, and the text inside it.
 *
 * THE NUMBER IS THE POINT OF THIS FILE. The mark had two forms, plain and
 * numbered, and the picker drew one of each — which is what John saw: "I
 * thought I already asked for the 9x9, 15x15 etc board images to also have a
 * set with the Number directly centered in the board… I see it's done for some
 * options but not consistently for all." So the tests below are over EVERY
 * size the site plays on rather than over a couple of them: a mark that comes
 * out without its number fails here whatever board it is drawing.
 */
function draw(size: number, words: BoardSizeMarkWords, px = 48): string {
  return renderToStaticMarkup(createElement(BoardSizeMark, { size, px, words }));
}

/**
 * The side the picker draws every block's mark at (70, `BOARD_MARK_PX`), and a
 * smaller one. The picker has one size since every block took the big number;
 * the smaller side stays in the sweep so the numeral's scale is checked at
 * more than the one size that happens to be in use.
 */
const PICKER_SIZES_PX = [48, 70] as const;

describe("boardSizeMarkVoice", () => {
  it("is silent where the size is in text beside it", () => {
    expect(boardSizeMarkVoice(19, "beside")).toEqual({ "aria-hidden": "true" });
  });

  it("names the size in words where nothing beside it does", () => {
    expect(boardSizeMarkVoice(19, "none")).toEqual({ role: "img", "aria-label": "19 by 19 board" });
    expect(boardSizeWords(3)).toBe("3 by 3 board");
  });
});

describe("BoardSizeMark", () => {
  it("draws the lattice at the density of its size", () => {
    expect(draw(4, "beside")).toContain("background-size:25% 25%");
    expect(draw(10, "beside")).toContain("background-size:10% 10%");
  });

  it("puts the size in the middle of every board the site offers, at either size, either voice", () => {
    for (const size of ALL_BOARD_SIZES) {
      for (const px of PICKER_SIZES_PX) {
        for (const words of ["beside", "none"] as const) {
          const html = draw(size, words, px);
          const where = `${size}×${size} at ${px}px, words=${words}`;
          // The number itself, as its own element in the middle of the mark.
          expect(html, where).toContain(`>${size}</span>`);
          // On its plate, in figures set the way the site sets figures.
          expect(html, where).toContain("tabular-nums");
          expect(html, where).toContain(`font-size:${boardSizeNumeralPx(px, size)}px`);
        }
      }
    }
  });

  it("has no way to draw a mark without its number", () => {
    // There is no second form to ask for: the props carry no `form`, so a
    // caller cannot get the bare lattice back by passing one. TypeScript says
    // so at every call site; this says so about the drawing itself.
    const html = draw(13, "beside");
    expect(html).toContain(">13</span>");
    expect(html).not.toContain("data-form");
  });

  it("is hidden from a screen reader when told the size is beside it", () => {
    const html = draw(9, "beside");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("role=");
    expect(html).not.toContain("aria-label");
  });

  it("says the size in words when told nothing beside it does", () => {
    const html = draw(9, "none");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="9 by 9 board"');
    // Hidden AND named would be a name nobody hears.
    expect(html).not.toContain("aria-hidden");
  });

  it("is drawn at the size it is asked for", () => {
    expect(draw(8, "none", 70)).toContain("width:70px;height:70px");
  });
});

describe("boardSizeNumeralPx", () => {
  it("sets every size a game is played on in one type size", () => {
    const sizes = new Set(ALL_BOARD_SIZES.map((size) => boardSizeNumeralPx(48, size)));
    expect(sizes.size).toBe(1);
    // Large: past 20px, the site's big figures, on the 48px block.
    expect(boardSizeNumeralPx(48, 19)).toBeGreaterThanOrEqual(20);
  });

  it("keeps every size the site plays on inside its own board, plate and all", () => {
    // A mono digit is at most 0.62em wide; the plate adds 0.24em of padding.
    // Two digits is the worst case here and 19 is the widest of them, but the
    // sweep is over every size so a board added later is measured rather than
    // assumed — an overflowing mark is the wrong way to find that out.
    for (const px of [24, ...PICKER_SIZES_PX]) {
      for (const size of ALL_BOARD_SIZES) {
        const font = boardSizeNumeralPx(px, size);
        const digits = String(size).length;
        expect(font * (digits * 0.62 + 0.24), `${size} at ${px}px`).toBeLessThan(px - 2);
      }
    }
  });

  it("shrinks a number too long for the scale rather than spilling out of the frame", () => {
    expect(boardSizeNumeralPx(48, 100)).toBeLessThan(boardSizeNumeralPx(48, 19));
  });
});

/**
 * ONE DRAWING OF THE BOARD-SIZE MARK, EVERYWHERE.
 *
 * The inconsistency John reported was not a component drawing the wrong thing;
 * it was two ways of drawing the same thing and a caller picking between them.
 * Deleting the second form fixes today's picker, and this is what keeps a
 * third from arriving: a file that draws a little board of its own out of the
 * shared gradient is a second board-size mark waiting to disagree with this
 * one, so every file that names the lattice is listed here with its reason.
 */
describe("the lattice is drawn in one place", () => {
  const ALLOWED = [
    // Where the gradient is defined.
    "src/components/board/Board.constants.ts",
    // The board-size mark itself: lattice, number, and nothing else.
    "src/components/board/BoardSizeMark.tsx",
    /*
     * An OPENING on the board the reader has chosen — Pro's square and its
     * three stones. It shares the gradient on purpose, so an opening's tile
     * and a board's block read as one family, and it is not a second
     * board-size mark: the fact it states is the opening, it carries stones
     * rather than a number, and the size it is drawn at is the one the board
     * blocks beside it already say.
     */
    "src/components/live/OpeningMark.tsx",
  ];

  function filesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...filesUnder(path));
      else if (path.endsWith(".ts") || path.endsWith(".tsx")) out.push(path);
    }
    return out;
  }

  /** Comments blanked, so the prose above — which quotes the rule — is not read as a breach. */
  function code(source: string): string {
    const blank = (text: string) => text.replace(/[^\n]/g, " ");
    return source
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
  }

  const FILES = filesUnder("src")
    .filter((path) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"))
    .map((path) => ({ path, source: code(readFileSync(path, "utf8")) }));

  it("names no board lattice outside the mark and its constants", () => {
    const drawn = FILES.filter((file) => file.source.includes("BOARD_SIZE_LATTICE")).map((file) => file.path);
    expect(drawn.sort()).toEqual([...ALLOWED].sort());
  });

  it("leaves no caller asking for a form of it", () => {
    const asking = FILES.filter((file) => /<BoardSizeMark[^>]*\bform=/.test(file.source)).map((file) => file.path);
    expect(asking).toEqual([]);
  });

  it("is used by the picker, which is the surface that shows board sizes as pictures", () => {
    const users = FILES.filter((file) => file.source.includes("<BoardSizeMark")).map((file) => file.path);
    expect(users).toContain("src/components/live/BoardPicker.tsx");
  });
});
