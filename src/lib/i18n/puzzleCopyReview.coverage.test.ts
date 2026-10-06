import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { puzzleCopyReview } from "./puzzleCopyReview";

/**
 * The review sheet for the words of puzzles (`docs/japanese-review-puzzles.md`): what John hands a reader of
 * Japanese, and so it has to be the text that ships. Regenerate with
 * `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`, as the phrase table's
 * sheet is.
 */
const SHEET = join("docs", "japanese-review-puzzles.md");

describe("the review sheet for a game's words", () => {
  const wanted = puzzleCopyReview();

  if (process.env.WRITE_JAPANESE_REVIEW === "1") {
    it("is written out", () => {
      writeFileSync(SHEET, wanted, "utf8");
      expect(existsSync(SHEET)).toBe(true);
    });
    return;
  }

  it("exists", () => {
    expect(existsSync(SHEET), `${SHEET} is missing`).toBe(true);
  });

  it("is the text that actually ships", () => {
    expect(
      readFileSync(SHEET, "utf8"),
      "the sheet is out of date: regenerate with WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n",
    ).toBe(wanted);
  });

  it("asks a reviewer to read no line twice", () => {
    const rows = wanted
      .split("\n")
      .filter((line) => line.startsWith("| ") && !line.startsWith("| Where") && !line.startsWith("| ---"))
      .map((line) => line.split("|").slice(2, 4).join("|").trim());
    expect(new Set(rows).size).toBe(rows.length);
  });

  it("names every line's reader", () => {
    expect(wanted).not.toContain("Drafted, unread");
  });
});
