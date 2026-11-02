import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contrastRatio, leastColourDistance } from "@/lib/ui/colourVision";

import { WORD_TILE_MARK } from "./puzzles.constants";

/**
 * THE WORD GAMES' TILES CAN BE TOLD APART BY SOMEBODY WHO SEES COLOUR
 * DIFFERENTLY, IN DARK MODE AS IN LIGHT.
 *
 * Found while the Colour guide was written (2026-11-02): the dark theme's tiles
 * were its own moss, ochre, kana yellow and muted grey, and a reader with
 * protanopia, deuteranopia or tritanopia saw green and grey 10 to 19 apart, orange
 * and yellow 9 to 18 apart. The letters and `aria-label`s still said each mark, so
 * it was a legibility fault, but a tile is there to be read at a glance. The
 * dark colours in `WORD_TILE_MARK` are now chosen for that and this holds them:
 * every pair at least `LEAST_APART` apart in all three simulations
 * (`colourVision.ts`), and every letter at least WCAG's 4.5:1 on its tile.
 *
 * It reads the colours out of the class lists rather than from a second table, so
 * a later edit to a tile is measured, and a tile whose dark colour goes missing
 * fails by name instead of quietly falling back to a theme colour nobody measured.
 */

const LEAST_APART = 31;
const LEAST_CONTRAST = 4.5;

const CSS = readFileSync("src/app/globals.css", "utf8");

/** A token's value in the dark theme's block. */
function darkToken(name: string): string {
  const block = CSS.slice(CSS.indexOf("@media (prefers-color-scheme: dark)"));
  const value = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(block)?.[1];
  if (value === undefined) throw new Error(`globals.css has no dark --${name}`);
  return value;
}

/** The tile's dark fill, from its `dark:bg-[#…]`. */
function darkFill(mark: keyof typeof WORD_TILE_MARK): string {
  const value = /dark:bg-\[(#[0-9a-f]{6})\]/i.exec(WORD_TILE_MARK[mark])?.[1];
  if (value === undefined) throw new Error(`${mark} has no dark:bg-[#rrggbb] colour`);
  return value;
}

/**
 * The ink of the letter on the tile in dark mode. A tile marked `surface-light`
 * carries the light theme's ink whatever the page's theme; the others read the
 * dark theme's, `text-ivory` being the raised charcoal and `dark:text-ink` the pale one.
 */
function darkInk(mark: keyof typeof WORD_TILE_MARK): string {
  const classes = WORD_TILE_MARK[mark];
  if (classes.includes("surface-light")) return "#22231f";
  return classes.includes("dark:text-ink") ? darkToken("ink") : darkToken("ivory");
}

const MARKS = Object.keys(WORD_TILE_MARK) as (keyof typeof WORD_TILE_MARK)[];

describe("the word games' tiles in dark mode", () => {
  for (let first = 0; first < MARKS.length; first += 1) {
    for (let second = first + 1; second < MARKS.length; second += 1) {
      const [a, b] = [MARKS[first], MARKS[second]] as [keyof typeof WORD_TILE_MARK, keyof typeof WORD_TILE_MARK];
      it(`${a} and ${b} are at least ${LEAST_APART} apart to a reader with any kind of colour blindness`, () => {
        expect(leastColourDistance(darkFill(a), darkFill(b))).toBeGreaterThanOrEqual(LEAST_APART);
      });
    }
  }

  for (const mark of MARKS) {
    it(`the letter on a ${mark} tile reads at ${LEAST_CONTRAST}:1`, () => {
      expect(contrastRatio(darkFill(mark), darkInk(mark))).toBeGreaterThanOrEqual(LEAST_CONTRAST);
    });
  }
});
