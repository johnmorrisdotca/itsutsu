import { describe, expect, it } from "vitest";

import { PUZZLE_KIND_LIST, PUZZLE_SPECS, sizesOffered } from "@/lib/puzzles/puzzles.constants";

import { SIZE_TILES, shelfFor, shelvesOf } from "./sizeShelves";

describe("the shelves of sizes a set-up turns between", () => {
  it("are every four, the last moved back to be full", () => {
    expect(shelvesOf(5)).toEqual([0, 1]);
    expect(shelvesOf(6)).toEqual([0, 2]);
    expect(shelvesOf(7)).toEqual([0, 3]);
    expect(shelvesOf(9)).toEqual([0, 4, 5]);
    expect(shelvesOf(16)).toEqual([0, 4, 8, 12]);
  });

  it("open, for every puzzle with shelves, on the first shelf that shows the size asked for, and its default size is on the first shelf unless the first does not show it", () => {
    for (const kind of PUZZLE_KIND_LIST.filter((each) => PUZZLE_SPECS[each].shelves === true)) {
      const every = [...sizesOffered(kind)];
      const spec = PUZZLE_SPECS[kind];
      for (const size of every) {
        const start = shelfFor(every, size);
        expect(every.slice(start, start + SIZE_TILES), `${kind} ${size}`).toContain(size);
        // No earlier shelf shows it.
        for (const earlier of shelvesOf(every.length).filter((each) => each < start)) expect(every.slice(earlier, earlier + SIZE_TILES), `${kind} ${size}`).not.toContain(size);
        // A size the first shelf of the spec offers opens on the spec's first shelf, as it did before shelves were generalised.
        if (spec.offered.includes(size) && every.slice(0, SIZE_TILES).includes(size)) expect(start, `${kind} ${size}`).toBe(0);
      }
      expect(shelfFor(every, 9999)).toBe(0);
    }
  });

  it("open Pop Gomoji's ordinary five letters on 3 to 6 and its seven on 4 to 7", () => {
    const every = [...sizesOffered("gomojiPop")];
    expect(every.slice(shelfFor(every, 5), shelfFor(every, 5) + SIZE_TILES)).toEqual([3, 4, 5, 6]);
    expect(every.slice(shelfFor(every, 7), shelfFor(every, 7) + SIZE_TILES)).toEqual([4, 5, 6, 7]);
  });
});
