import { describe, expect, it } from "vitest";

import { PUZZLE_KIND_LIST } from "../puzzles/puzzles.constants";
import { puzzleCopy } from "../puzzles/puzzleCopy";
import { RULE_VARIANT_LIST } from "./gomoku.constants";
import { inspiredByIn } from "./inspiredBy";
import { variantCopy } from "./variantCopy";
import { RULE_VARIANT_DISPLAY } from "./variants.constants";

const JAPANESE = /[぀-ヿ一-鿿]/;

describe("what a game is inspired by, said to a reader of Japanese", () => {
  it("says a description in Japanese and leaves a name as the other game is called", () => {
    expect(inspiredByIn("Connect Four", "ja")).toBe("Connect Four");
    expect(inspiredByIn("the seven tetromino shapes", "en")).toBe("the seven tetromino shapes");
    expect(inspiredByIn("the seven tetromino shapes", "ja")).toMatch(JAPANESE);
    expect(inspiredByIn(undefined, "ja")).toBeUndefined();
  });

  it("leaves no game of ours naming its inspiration with an English description, board games and puzzles alike", () => {
    const lines = [
      ...RULE_VARIANT_LIST.map((variant) => ({ game: variant, line: variantCopy(variant, "ja").inspiredBy, english: RULE_VARIANT_DISPLAY[variant].inspiredBy })),
      ...PUZZLE_KIND_LIST.map((kind) => ({ game: kind, line: puzzleCopy(kind, "ja").inspiredBy, english: puzzleCopy(kind, "en").inspiredBy })),
    ];
    // A description starts with "the" (the seven tetromino shapes) or has a qualifier in brackets, and is not a name.
    const described = lines.filter(({ line }) => line !== undefined && /^the [a-z]|\([a-z ]+\)$/.test(line));
    // "the Game of the Amazons" is a title, which stays as it is written.
    expect(described.filter(({ line }) => line !== "the Game of the Amazons").map(({ game, line }) => `${game}: ${line}`)).toEqual([]);
    expect(lines.some(({ line, english }) => line !== undefined && line !== english)).toBe(true);
  });
});
