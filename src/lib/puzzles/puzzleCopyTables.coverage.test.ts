import { describe, expect, it } from "vitest";

import { overlayLines } from "@/lib/i18n/copyTable";
import { orphaned, problemsWith, unanswered } from "@/lib/i18n/copyTableAudit";
import {
  KUMIMOJI_SHOTS_JA,
  KUMIMOJI_WALLPAPER_COPY_JA,
  LOOK_COPY_JA,
  WORD_STYLE_DISPLAY_JA,
} from "@/lib/i18n/dictionaries/puzzles.ja.misc.constants";
import {
  CARD_SIZE_WORDS_JA,
  JIRAI_GRID_DISPLAY_JA,
  JIRAI_LEVEL_BLURBS_JA,
  PUZZLE_CLOCK_DISPLAY_JA,
  PUZZLE_LEVEL_BLURBS_JA,
  PUZZLE_LEVEL_DISPLAY_JA,
  CHECK_ALLOWANCE_BLURB_JA,
} from "@/lib/i18n/dictionaries/puzzles.ja.levels.constants";

import { WORD_STYLE_DISPLAY } from "./gomoji/wordStyles";
import { JIRAI_GRID_DISPLAY, JIRAI_LEVEL_BLURBS } from "./jirai/jirai.constants";
import { KUMIMOJI_SHOTS } from "./kumimoji/shots.constants";
import { KUMIMOJI_WALLPAPER_COPY } from "./kumimoji/wallpaper.constants";
import { LOOK_COPY } from "./meikyuu/look.constants";
import {
  cardSizeWords,
  checkAllowanceWordsIn,
  clockDisplay,
  jiraiGridDisplay,
  jiraiLevelBlurbs,
  levelBlurbIn,
  levelDisplay,
  levelName,
  clockName,
} from "./puzzleCopy";
import {
  CARD_SIZE_WORDS,
  PUZZLE_CHECK_ALLOWANCES,
  PUZZLE_CLOCK_DISPLAY,
  PUZZLE_CLOCK_LIST,
  PUZZLE_KIND_LIST,
  PUZZLE_LEVEL_BLURBS,
  PUZZLE_LEVEL_DISPLAY,
  PUZZLE_LEVEL_EVERY,
  PUZZLE_SPECS,
  levelBlurb,
} from "./puzzles.constants";

/**
 * THE PUZZLES' TABLES OF WORDS, IN JAPANESE. Each English table in
 * `puzzles.constants.ts` and `jirai/jirai.constants.ts` has an overlay of the
 * same shape under `src/lib/i18n/dictionaries/puzzles.ja.levels.constants.ts`
 * (`copyTable.ts`); a sentence of the English with no Japanese beside it, a
 * Japanese line with nothing to answer, or a line that is not Japanese with an
 * English back-translation fails here.
 */
const TABLES = [
  ["level display", PUZZLE_LEVEL_DISPLAY, PUZZLE_LEVEL_DISPLAY_JA],
  ["clocks", PUZZLE_CLOCK_DISPLAY, PUZZLE_CLOCK_DISPLAY_JA],
  ["level blurbs", PUZZLE_LEVEL_BLURBS, PUZZLE_LEVEL_BLURBS_JA],
  ["card sizes", CARD_SIZE_WORDS, CARD_SIZE_WORDS_JA],
  ["Jirai levels", JIRAI_LEVEL_BLURBS, JIRAI_LEVEL_BLURBS_JA],
  ["Jirai neighbours", JIRAI_GRID_DISPLAY, JIRAI_GRID_DISPLAY_JA],
  ["Gomoji grid styles", WORD_STYLE_DISPLAY, WORD_STYLE_DISPLAY_JA],
  ["Kumimoji's pictures", KUMIMOJI_SHOTS, KUMIMOJI_SHOTS_JA],
  ["Kumimoji's wallpaper", KUMIMOJI_WALLPAPER_COPY, KUMIMOJI_WALLPAPER_COPY_JA],
  ["Meikyuu's colours", LOOK_COPY, LOOK_COPY_JA],
] as const;

/** A word of English that is a name and not a sentence: a way of drawing the grid, which is a game's own name. */
const NAMES = new Set(["Reversi", "Gomoku", "Tiles"]);

describe("the puzzles' tables of words speak Japanese", () => {
  it.each(TABLES)("%s: every English sentence has its Japanese, and none answers nothing", (_name, english, ja) => {
    expect(unanswered(english, ja as never, { skip: (_path, value) => NAMES.has(value) })).toEqual([]);
    expect(orphaned(english, ja)).toEqual([]);
  });

  it.each(TABLES)("%s: every line is Japanese with a back-translation", (_name, _english, ja) => {
    const lines = overlayLines(ja);
    expect(lines.length).toBeGreaterThan(0);
    for (const { path, line } of lines) expect(problemsWith(line), path).toEqual([]);
  });

  it("answers every allowance in Japanese, and at 1 and 3 says so in words", () => {
    for (const allowed of [...PUZZLE_CHECK_ALLOWANCES, 5]) {
      const line = (CHECK_ALLOWANCE_BLURB_JA.is[String(allowed) as "1"] ?? CHECK_ALLOWANCE_BLURB_JA.other) as unknown as [string, string];
      expect(problemsWith(line), String(allowed)).toEqual([]);
      expect(checkAllowanceWordsIn(allowed, "en").blurb).not.toMatch(/[ぁ-ヿ一-鿿]/);
      expect(checkAllowanceWordsIn(allowed, "ja").blurb).toMatch(/[ぁ-ヿ一-鿿]/);
    }
  });

  it("reads each table in the reader's language and keeps the names", () => {
    for (const level of PUZZLE_LEVEL_EVERY) {
      expect(levelDisplay("en")[level]).toBe(PUZZLE_LEVEL_DISPLAY[level]);
      expect(levelDisplay("ja")[level].blurb).toMatch(/[ぁ-ヿ一-鿿]/);
      expect(levelDisplay("ja")[level].kanji).toBe(PUZZLE_LEVEL_DISPLAY[level].kanji);
      expect(levelName(level, "ja")).toBe(PUZZLE_LEVEL_DISPLAY[level].kanji);
      expect(levelName(level, "en")).toBe(PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase());
    }
    for (const clock of PUZZLE_CLOCK_LIST) {
      expect(clockDisplay("ja")[clock].blurb).toMatch(/[ぁ-ヿ一-鿿]/);
      expect(clockDisplay("ja")[clock].ms).toBe(PUZZLE_CLOCK_DISPLAY[clock].ms);
      expect(clockName(clock, "ja")).toBe(PUZZLE_CLOCK_DISPLAY[clock].kanji);
    }
    expect(jiraiLevelBlurbs("ja").easy).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(jiraiGridDisplay("ja").hex.kanji).toBe(JIRAI_GRID_DISPLAY.hex.kanji);
    expect(cardSizeWords("ja").solitaire?.word(3)).toBe("3枚めくり");
    expect(cardSizeWords("en")).toBe(CARD_SIZE_WORDS);
  });

  it("gives every puzzle's every level a blurb in Japanese, as the English does", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      for (const level of PUZZLE_SPECS[kind].levels) {
        expect(levelBlurbIn(kind, level, "en")).toBe(levelBlurb(kind, level));
        expect(levelBlurbIn(kind, level, "ja"), `${kind} ${level}`).toMatch(/[ぁ-ヿ一-鿿]/);
      }
    }
  });
});
