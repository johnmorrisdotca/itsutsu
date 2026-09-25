import { describe, expect, it } from "vitest";

import { MOVE_FORMATS, readMoves } from "./readMoves";
import { MOVE_FORMAT_CHOICES, linesOf, pointIn } from "./moveFormats";

/** A game's points on a 15 board, including corners and the column I. */
const SIZE = 15;
const POINTS = [
  { row: 7, col: 7 },
  { row: 7, col: 8 },
  { row: 0, col: 0 },
  { row: 14, col: 14 },
  { row: 3, col: 8 },
];

const READ_AS = {
  itsutsu: MOVE_FORMATS.coordinates,
  itsYourTurn: MOVE_FORMATS.itsYourTurn,
  goldToken: MOVE_FORMATS.goldToken,
} as const;

describe("a record written in each format reads back as the same game", () => {
  for (const format of MOVE_FORMAT_CHOICES) {
    it(`${format}: what is shown is what the paste box takes`, () => {
      const text = linesOf(format, POINTS)
        // GoldToken numbers its lines bare; the others as a forum does, "1.", which our own reader takes too.
        .map((line) => `${line.number}${format === "goldToken" ? "" : "."} ${line.moves.map(({ move }) => pointIn(format, SIZE, move)).join(" ")}`)
        .join("\n");
      const read = readMoves(text, SIZE, [READ_AS[format]]);
      expect(read.problem, text).toBeNull();
      expect(read.points).toEqual(POINTS);
    });
  }

  it("writes each site's own spelling", () => {
    expect(pointIn("itsYourTurn", SIZE, { row: 9, col: 5 })).toBe("f6");
    expect(pointIn("goldToken", SIZE, { row: 7, col: 8 })).toBe("I8");
  });

  it("pairs two moves a line in the paired formats, one in ours", () => {
    expect(linesOf("itsutsu", POINTS)).toHaveLength(5);
    expect(linesOf("itsYourTurn", POINTS).map((line) => line.moves.length)).toEqual([2, 2, 1]);
    expect(linesOf("goldToken", POINTS)[1]?.moves.map(({ index }) => index)).toEqual([2, 3]);
  });
});
