import type { HousekiCampaign, HousekiKind } from "./houseki.types";

/**
 * How hard each level is, 1 to 5, one digit a level in the order of the
 * package's own campaign (`levelManifest`'s `marks`, or Gem Swap's
 * `difficultyMarks`): what a level's tile shows and what a win is priced by
 * (`src/lib/points/housekiLadder.ts`). The levels themselves, boards and
 * witnesses, are the package's and reach only the browser; this is the small
 * table every page may read. `houseki.coverage.test.ts` holds it to the package.
 */
export const HOUSEKI_MARKS: { readonly [K in HousekiKind]: Partial<Record<HousekiCampaign, string>> } = {
  fallingTriplets: { classic: "1122222222222222222222222233333333333333333333333333333333333333333333444444444444444444444444444444" },
  colourChains: {
    classic: "11111111111222222222222222222222222222223333333333",
    shizen: "11111111111111111111111111111111111111111222222222",
    arashi: "12222222222222222222222222222222222222222222222333",
  },
  stoneCollapse: { classic: "1111112222222222222222222222222333333333333333333333333333333333344444444444444444444444444444555555" },
  gemSwap: { classic: "11111122222222333333333333333333333333333334444444" },
  magneticBlocks: { classic: "11111111111111111111111111111133333333335555555555" },
};

/** A level's marks, 1 to 5, or null for a level the game does not have. */
export function marksOf(kind: HousekiKind, campaign: HousekiCampaign, number: number): number | null {
  const digit = HOUSEKI_MARKS[kind][campaign]?.[number - 1];
  return digit === undefined ? null : Number(digit);
}
