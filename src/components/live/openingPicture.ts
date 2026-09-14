import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";

import { OPENING_ZONE_REACH } from "./picker.constants";
import type { MarkStone, MarkZone } from "./picker.types";

/**
 * What an opening's little picture shows, worked out apart from drawing it.
 *
 * Not `openingMark.ts`: on a case-insensitive disk that name and
 * `OpeningMark.tsx` are one path, which is the trap `BoardSizeMark` already
 * fell into once.
 */

/**
 * The central square an opening sends the second black stone out of, or null
 * for an opening with no square.
 *
 * The reach is the engine's own — `PRO_EXCLUSION` and `LONG_PRO_EXCLUSION` in
 * `rules/opening.ts` — so the picture cannot come to draw a 5×5 while the rule
 * enforces something else.
 */
export function openingZone(opening: OpeningRule, size: number): MarkZone | null {
  const reach = OPENING_ZONE_REACH[opening];
  if (reach === undefined) return null;
  const centre = Math.floor(size / 2);
  return { from: centre - reach, span: reach * 2 + 1 };
}

/**
 * The stones the picture puts down.
 *
 * WITH A SQUARE: black on tengen, white beside it, and black's second stone
 * just outside the square — which is the whole of Pro and Long Pro in three
 * stones: the first where it must be, the third where it must go.
 *
 * WITHOUT ONE: three stones nowhere in particular, well away from the centre,
 * because "anywhere, in any order" is the rule.
 */
export function openingStones(opening: OpeningRule, size: number): MarkStone[] {
  const centre = Math.floor(size / 2);
  const zone = openingZone(opening, size);
  if (zone === null) {
    return [
      { row: 1, col: 1, colour: STONES.black },
      { row: size - 2, col: centre + 1, colour: STONES.white },
      { row: 2, col: size - 2, colour: STONES.black },
    ];
  }
  return [
    { row: centre, col: centre, colour: STONES.black },
    { row: centre - 1, col: centre, colour: STONES.white },
    { row: centre, col: zone.from + zone.span, colour: STONES.black },
  ];
}
