import { describe, expect, it } from "vitest";

import { LEVEL_NAMES } from "./levelNames.constants";
import { XP_LEVELS } from "./xpCurve";

/**
 * A numbered series is one name with different trailing numerals, "Cartridge I"
 * / "Cartridge II" or "Pixel 1" / "Pixel 2". Two of them close together read as
 * counting, which is the one thing John asked the ladder not to do.
 */
const SERIES = /^(.+?)\s+(\d+|[IVX]+)$/;

/** The site's bots, which the ladder must not hand out as ranks. */
const BOT_NAMES = ["kyu", "dan", "meijin"];

describe("LEVEL_NAMES", () => {
  it("has exactly one hundred entries, one per level of the curve", () => {
    expect(LEVEL_NAMES).toHaveLength(100);
    expect(LEVEL_NAMES).toHaveLength(XP_LEVELS);
  });

  it("runs level 1 to 100 in order with no gaps", () => {
    LEVEL_NAMES.forEach((entry, index) => {
      expect(entry.level).toBe(index + 1);
    });
  });

  it("gives every level a unique name, case-insensitively", () => {
    const seen = new Map<string, number>();
    for (const { level, name } of LEVEL_NAMES) {
      const key = name.trim().toLowerCase();
      expect(key, `level ${level} has an empty name`).not.toBe("");
      expect(seen.has(key), `level ${level} repeats "${name}" from level ${seen.get(key)}`).toBe(false);
      seen.set(key, level);
    }
  });

  it("gives every level a one-line note", () => {
    for (const { level, note } of LEVEL_NAMES) {
      expect(note.trim(), `level ${level} has an empty note`).not.toBe("");
      expect(note, `level ${level}'s note spans lines`).not.toMatch(/[\r\n]/);
    }
  });

  it("writes kanji in Japanese, never in Latin letters", () => {
    for (const { level, kanji } of LEVEL_NAMES) {
      if (kanji === undefined) continue;
      expect(kanji.trim(), `level ${level} has an empty kanji`).not.toBe("");
      expect(kanji, `level ${level}'s kanji "${kanji}" contains Latin letters`).not.toMatch(/[A-Za-z]/);
    }
  });

  it("never hands out a bot's name as a rank", () => {
    for (const { level, name, kanji } of LEVEL_NAMES) {
      expect(BOT_NAMES, `level ${level} is named for a bot`).not.toContain(name.trim().toLowerCase());
      expect(kanji ?? "", `level ${level}'s kanji names a bot`).not.toContain("名人");
    }
  });

  it("keeps the entries of a numbered series more than three levels apart", () => {
    const series = new Map<string, number[]>();
    for (const { level, name } of LEVEL_NAMES) {
      const match = SERIES.exec(name);
      if (!match) continue;
      const base = match[1].toLowerCase();
      series.set(base, [...(series.get(base) ?? []), level]);
    }
    for (const [base, levels] of series) {
      const sorted = [...levels].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(
          sorted[i] - sorted[i - 1],
          `"${base}" series has entries at levels ${sorted[i - 1]} and ${sorted[i]}, too close to read as spaced out`,
        ).toBeGreaterThan(3);
      }
    }
  });
});
