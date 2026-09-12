import { describe, expect, it } from "vitest";

import { levelNameRow, xpLevelKanji, xpLevelName } from "./levelNames";
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

/**
 * THE LOOKUP, AND ITS FLOOR.
 *
 * The catalogue above is data and the functions below are the only things that
 * read it, so what is tested here is the join: every one of the hundred is
 * reachable by number, and nothing outside the hundred throws. The floor gets
 * the most cases of anything here — it is what keeps a badge beside a name from
 * taking a page down, and a floor nobody tested is a floor nobody knows the
 * shape of.
 */
describe("xpLevelName", () => {
  it("names every level the catalogue holds", () => {
    for (const { level, name } of LEVEL_NAMES) {
      expect(xpLevelName(level)).toBe(name);
    }
  });

  it("names the two ends by hand, so a silent reindex is caught", () => {
    expect(xpLevelName(1)).toBe("Insert Coin");
    expect(xpLevelName(XP_LEVELS)).toBe("Divine Move");
  });

  it("falls back to the level itself past the top of the ladder", () => {
    expect(xpLevelName(XP_LEVELS + 1)).toBe("Level 101");
    expect(xpLevelName(4242)).toBe("Level 4242");
  });

  it("falls back below the bottom of it too", () => {
    expect(xpLevelName(0)).toBe("Level 0");
    expect(xpLevelName(-7)).toBe("Level -7");
  });

  /*
   * The reason the fallback drops the number rather than truncating: 4.7 is not
   * a level, and "Joystick" — level 4's name — would be this function telling a
   * caller that its rounding was a lookup.
   */
  it("refuses to round a fraction into the level below it", () => {
    expect(xpLevelName(4.7)).not.toBe("Joystick");
    expect(xpLevelName(4.7)).toBe("Level —");
  });

  it("never puts a JavaScript artefact on a page", () => {
    for (const nonsense of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(xpLevelName(nonsense)).toBe("Level —");
    }
  });

  it("never throws, whatever it is handed", () => {
    for (const value of [0, 1, 100, 101, -1, 0.5, Number.NaN, Number.MAX_SAFE_INTEGER]) {
      expect(() => xpLevelName(value)).not.toThrow();
      expect(typeof xpLevelName(value)).toBe("string");
      expect(xpLevelName(value).trim()).not.toBe("");
    }
  });
});

describe("levelNameRow", () => {
  it("hands back the whole row, kanji and note included", () => {
    const top = levelNameRow(XP_LEVELS);
    expect(top?.name).toBe("Divine Move");
    expect(top?.kanji).toBe("神の一手");
    expect(top?.note).toContain("Go");
  });

  it("is null rather than a part-filled row for a level with none", () => {
    expect(levelNameRow(XP_LEVELS + 1)).toBeNull();
    expect(levelNameRow(0)).toBeNull();
    expect(levelNameRow(7.5)).toBeNull();
    expect(levelNameRow(Number.NaN)).toBeNull();
  });

  it("answers for all hundred and only those", () => {
    const named = Array.from({ length: XP_LEVELS + 10 }, (_, index) => index - 4).filter(
      (level) => levelNameRow(level) !== null,
    );
    expect(named).toEqual(LEVEL_NAMES.map((entry) => entry.level));
  });
});

describe("xpLevelKanji", () => {
  it("gives the kanji where the catalogue has one", () => {
    expect(xpLevelKanji(XP_LEVELS)).toBe("神の一手");
  });

  /*
   * Empty and not null, so it can be handed straight to `Paired` — which reads
   * an empty kanji as "there is none, so pair nothing". Most of the hundred have
   * none, so a page must not have to branch on two kinds of absence.
   */
  it("gives an empty string where it has none, for Paired to read as absence", () => {
    const plain = LEVEL_NAMES.find((entry) => entry.kanji === undefined);
    expect(plain, "the catalogue has no level without kanji to test with").toBeDefined();
    expect(xpLevelKanji(plain!.level)).toBe("");
    expect(xpLevelKanji(XP_LEVELS + 1)).toBe("");
    expect(xpLevelKanji(Number.NaN)).toBe("");
  });
});
