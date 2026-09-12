import { describe, expect, it } from "vitest";

import { BOARD_THEMES, DEFAULT_APPEARANCE, STONE_SETS } from "./Board.constants";

/**
 * Whether a board can actually be READ, in numbers.
 *
 * Checkers is the reason this exists. Its dark squares are the whole board —
 * every piece stands on one and every move runs along them — and they were
 * drawn as the frame colour at 22% opacity, which came out at a contrast of
 * 1.24 on kaya and 1.06 on sumi. That is to say: invisible. It shipped that
 * way for months and nothing failed, because nothing measured it.
 *
 * A colour is a judgement and a test cannot make it. What a test CAN do is
 * refuse a judgement that has stopped being legible, which is the failure
 * that actually happened — so the floors below sit well under the values the
 * themes were tuned to and well over the ones that shipped. They catch a
 * theme going invisible, not a theme being restyled.
 */

/** WCAG relative luminance, the standard curve. */
function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type RGB = [number, number, number];

/** Every `#rrggbb` in a gradient string, in the order it paints. */
function stops(css: string): RGB[] {
  return [...css.matchAll(/#([0-9a-f]{6})\b/gi)].map(([, hex]) => [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]);
}

/** An `rgba(r, g, b, a)` fill laid over a colour, as the browser composites it. */
function over(fill: string, base: RGB): RGB {
  const parts = fill.match(/rgba?\(([^)]+)\)/);
  if (parts === null) throw new Error(`not an rgba fill: ${fill}`);
  const [r, g, b, alpha = 1] = parts[1].split(",").map((n) => Number(n.trim()));
  return [r, g, b].map((c, i) => Math.round(base[i] + alpha * (c - base[i]))) as RGB;
}

const THEMES = Object.entries(BOARD_THEMES);

describe("a square in play reads against the rest of the board", () => {
  /*
   * Every stop of the surface gradient, not just one. A board is lit from a
   * corner, so a fill that separates at the light end can close up at the
   * dark end, and a player looks at the whole board at once.
   */
  it.each(THEMES)("%s", (_name, theme) => {
    for (const stop of stops(theme.surface)) {
      expect(contrast(over(theme.playSquare, stop), stop)).toBeGreaterThan(1.7);
    }
  });

  it("is not the frame colour, which is a rim and cannot do this job", () => {
    // On the two extreme boards the frame is already at the surface's own end
    // of the scale, so no opacity of it could ever have separated them.
    for (const [, theme] of THEMES) expect(theme.playSquare).not.toBe(theme.frame);
  });
});

describe("a stone still reads on the square it stands on", () => {
  /*
   * The regression this caught: darkening shinkaya's squares made the
   * checkering plain and buried the black pieces on it at 1.16. Both halves
   * have to hold, which is why a board can need a LIGHTER square in play.
   *
   * THE DEFAULT STONES ONLY, and the limit is worth stating rather than
   * leaving to be discovered. A theme and a stone set are two independent
   * choices, so there are twenty-five pairs, and this token is one half of
   * one of them — it cannot answer for the other. The worst pair today is
   * jade on sumi, where the black stone is a dark green on ink: 1.27 on a
   * square in play, and 1.66 on a bare one, so it was already the weakest
   * thing on that board before any of this. Recorded here as a number
   * somebody measured rather than as a silent pass, and left for its own
   * ticket: mending it means changing a stone set, which reaches every game.
   */
  const stones = STONE_SETS[DEFAULT_APPEARANCE.stoneSet];

  it.each(THEMES)("%s", (_name, theme) => {
    for (const stop of stops(theme.surface)) {
      const square = over(theme.playSquare, stop);
      for (const colour of [stones.black, stones.white]) {
        /*
         * The stone's BULK — the middle stop, which a radial gradient gives
         * most of the face to. Not the last stop: that is the shaded rim
         * where the stone turns away, and judging a white stone by its own
         * shadow fails every light board for the wrong reason.
         */
        const body = (stops(colour)[1] ?? stops(colour)[0]) as RGB;
        expect(contrast(body, square)).toBeGreaterThan(1.4);
      }
    }
  });
});
