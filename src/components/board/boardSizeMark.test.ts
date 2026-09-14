import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ALL_BOARD_SIZES } from "@/lib/gomoku/gomoku.constants";

import { boardSizeWords } from "./Board.constants";
import type { BoardSizeMarkForm, BoardSizeMarkWords } from "./board.types";
import { BoardSizeMark } from "./BoardSizeMark";
import { boardSizeMarkVoice, boardSizeNumeralPx } from "./boardSizeVoice";

/**
 * The board-size mark, in its two forms and its two ways of being heard.
 *
 * These run in node, so the component is drawn to a string with
 * `renderToStaticMarkup` — which is exactly what reaches a screen reader: the
 * attributes on the element, and the text inside it.
 */
function draw(size: number, form: BoardSizeMarkForm, words: BoardSizeMarkWords, px = 48): string {
  return renderToStaticMarkup(createElement(BoardSizeMark, { size, form, px, words }));
}

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
  it("draws the lattice at the density of its size, in both forms", () => {
    for (const form of ["plain", "numbered"] as const) {
      expect(draw(4, form, "beside")).toContain("background-size:25% 25%");
      expect(draw(10, form, "beside")).toContain("background-size:10% 10%");
    }
  });

  it("carries no number in the plain form and the size's own number in the numbered one", () => {
    const plain = draw(13, "plain", "beside");
    expect(plain).not.toContain(">13<");
    expect(plain).toContain('data-form="plain"');

    const numbered = draw(13, "numbered", "beside");
    expect(numbered).toContain(">13<");
    expect(numbered).toContain('data-form="numbered"');
    expect(numbered).toContain("tabular-nums");
  });

  it("is hidden from a screen reader when told the size is beside it, whichever form", () => {
    for (const form of ["plain", "numbered"] as const) {
      const html = draw(9, form, "beside");
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toContain("role=");
      expect(html).not.toContain("aria-label");
    }
  });

  it("says the size in words when told nothing beside it does, whichever form", () => {
    for (const form of ["plain", "numbered"] as const) {
      const html = draw(9, form, "none");
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="9 by 9 board"');
      // Hidden AND named would be a name nobody hears.
      expect(html).not.toContain("aria-hidden");
    }
  });

  it("is drawn at the size it is asked for", () => {
    expect(draw(8, "numbered", "none", 70)).toContain("width:70px;height:70px");
  });
});

describe("boardSizeNumeralPx", () => {
  it("sets every size a game is played on in one type size", () => {
    const sizes = new Set(ALL_BOARD_SIZES.map((size) => boardSizeNumeralPx(48, size)));
    expect(sizes.size).toBe(1);
    // Large: past 20px, the site's big figures, on the 48px block.
    expect(boardSizeNumeralPx(48, 19)).toBeGreaterThanOrEqual(20);
  });

  it("keeps two digits and their plate inside the board", () => {
    // A mono digit is at most 0.62em wide; the plate adds 0.24em of padding.
    for (const px of [24, 48, 70]) {
      const font = boardSizeNumeralPx(px, 19);
      expect(font * (2 * 0.62 + 0.24)).toBeLessThan(px - 2);
    }
  });

  it("shrinks a number too long for the scale rather than spilling out of the frame", () => {
    expect(boardSizeNumeralPx(48, 100)).toBeLessThan(boardSizeNumeralPx(48, 19));
  });
});
