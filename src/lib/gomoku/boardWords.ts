import { VARIANT_SPECS } from "./gomoku.constants";
import type { RuleVariant } from "./gomoku.types";
import type { VariantSpec } from "./variantSpec.types";
import { starCells } from "./rules/chineseCheckers";
import { hexagonCells } from "./rules/hexagon";

/**
 * THE BOARD, SAID THE WAY THAT BOARD IS ACTUALLY SHAPED.
 *
 * Nearly every game here is played on a square, and "15×15" says everything
 * about one: the two numbers are the two sides, and their product is the
 * points. Three of the games are not squares. They are embedded in a square
 * array — a hexagon for Honeycomb, a hexagram for Chinese Checkers, the same
 * trick Hex's rhombus uses — so the `size` stored on the row is the side of
 * the array they sit in and NOT a side of the board anybody plays on.
 *
 * Printed as "11×11", that number is not merely unhelpful, it is false: it
 * announces 121 squares on a board of 91 cells, thirty of which do not exist,
 * and the set-up screen said exactly that under a drawing of the hexagon.
 * A reader comparing the picture with the caption would have concluded one of
 * the two was wrong, and they would have been right.
 *
 * So a game says the count of cells it is really played on where a square
 * says its two sides. Both come out of the same call, so nothing has to
 * remember which games are which — the spec knows.
 */
/*
 * A `string` and not only a `RuleVariant`, because several of the callers
 * hold a variant read out of a stored row and typed as a string — the same
 * ones `GameName` takes a string from. A name this build does not know has
 * no spec to ask, and the answer for it is the square, which is what every
 * one of those rows was drawn as before this existed.
 */
function specOf(variant: RuleVariant | string): VariantSpec | null {
  return variant in VARIANT_SPECS ? VARIANT_SPECS[variant as RuleVariant] : null;
}

export function boardWords(variant: RuleVariant | string, size: number): string {
  const spec = specOf(variant);
  if (spec?.hexagon) return `${hexagonCells(size)} cells`;
  if (spec?.chineseCheckers) return `${starCells(size)} cells`;
  return `${size}×${size}`;
}

/**
 * The same board inside a sentence, article and all: "an 8×8 board", "a
 * hexagon of 91 cells", "a hexagram of 121 cells".
 *
 * A separate function rather than a flag, because these are two different
 * jobs. A chip in a row of chips wants the shortest true thing; a sentence
 * wants a noun with a shape in it, and "a 91 cells board" is neither.
 */
export function boardPhrase(variant: RuleVariant | string, size: number): string {
  const spec = specOf(variant);
  if (spec?.hexagon) return `a hexagon of ${hexagonCells(size)} cells`;
  if (spec?.chineseCheckers) return `a hexagram of ${starCells(size)} cells`;
  // 8, 11, 18 — the sizes an English speaker says "an" before.
  const article = /^(8|11|18)/.test(String(size)) ? "an" : "a";
  return `${article} ${size}×${size} board`;
}
