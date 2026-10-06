import { describe, expect, it } from "vitest";

import { overlayLines } from "@/lib/i18n/copyTable";
import { orphaned, problemsWith, unanswered } from "@/lib/i18n/copyTableAudit";
import {
  CUBE_COPY_JA,
  SUIDO_WORDS_JA,
  TOBIISHI_JA,
  TSUNAGI_CHIPS_JA,
} from "@/lib/i18n/dictionaries/puzzles.ja.mazeUi.constants";
import { MEIKYUU_WORDS_JA } from "@/lib/i18n/dictionaries/puzzles.ja.meikyuuUi.constants";
import {
  FREECELL_COPY_JA,
  MAHJONG_COPY_JA,
  SOLITAIRE_COPY_JA,
  SOLITAIRE_OPTIONS_JA,
  SPIDER_COPY_JA,
} from "@/lib/i18n/dictionaries/puzzles.ja.cards.constants";
import {
  BRIDGES_CELL_WORDS_JA,
  BRIDGES_COPY_JA,
  JIRAI_COPY_JA,
  PENCIL_COPY_JA,
  PICTURE_CELL_WORDS_JA,
  PICTURE_COPY_JA,
} from "@/lib/i18n/dictionaries/puzzles.ja.grid.constants";

import { speaker } from "@/lib/i18n/i18n";

import { cubeCopy, MAZE_TABLES, suidoWords, tobiishiWords, tsunagiChips, meikyuuWords } from "./mazeWords";
import { readerName } from "./readerName";
import { bridgesCellWords, bridgesCopy, jiraiCopy, pencilCopy, pictureCellWords, pictureCopy } from "./gridWords";
import { freeCellCopy, mahjongCopy, solitaireCopy, solitaireOptions, spiderCopy } from "./cardWords";
import { CUBE_COPY } from "./cube.constants";
import { JIRAI_COPY } from "./jirai.constants";
import { PENCIL_COPY } from "./pencil/pencil.constants";
import { BRIDGES_CELL_WORDS, BRIDGES_COPY, FREECELL_COPY, PICTURE_CELL_WORDS, PICTURE_COPY, SOLITAIRE_COPY, SPIDER_COPY, TSUNAGI_CHIPS } from "./puzzles.constants";
import { MAHJONG_COPY } from "./mahjong.constants";
import { SOLITAIRE_OPTIONS } from "./solitaireOptions.constants";

/**
 * THE SCREENS' TABLES OF WORDS, IN JAPANESE. Each English table of a puzzle's screen (Meikyuu's, Suido's,
 * Tobiishi's, the Cube's, Tsunagi's chips, the grid puzzles' and the card puzzles' lines under the board) has
 * an overlay of the same shape under `src/lib/i18n/dictionaries/` (`copyTable.ts`). A sentence of the English
 * with no Japanese beside it, a Japanese line that answers nothing, or a line that is not Japanese with an
 * English back-translation fails here. The English files sit in the pictures' stamp where they must
 * (`puzzleArtFingerprint.ts`), which is why the Japanese is laid over them instead.
 */
const TABLES = [
  ["Meikyuu", MAZE_TABLES.MEIKYUU, MEIKYUU_WORDS_JA],
  ["Suido", MAZE_TABLES.SUIDO, SUIDO_WORDS_JA],
  ["Tobiishi", MAZE_TABLES.TOBIISHI, TOBIISHI_JA],
  ["the Cube", CUBE_COPY, CUBE_COPY_JA],
  ["Tsunagi's chips", TSUNAGI_CHIPS, TSUNAGI_CHIPS_JA],
  ["Mahjong Solitaire", MAHJONG_COPY, MAHJONG_COPY_JA],
  ["FreeCell", FREECELL_COPY, FREECELL_COPY_JA],
  ["Spider", SPIDER_COPY, SPIDER_COPY_JA],
  ["Solitaire", SOLITAIRE_COPY, SOLITAIRE_COPY_JA],
  ["Solitaire's set-up", SOLITAIRE_OPTIONS, SOLITAIRE_OPTIONS_JA],
  ["Bridges", BRIDGES_COPY, BRIDGES_COPY_JA],
  ["Bridges' cells", BRIDGES_CELL_WORDS, BRIDGES_CELL_WORDS_JA],
  ["Picture logic", PICTURE_COPY, PICTURE_COPY_JA],
  ["Picture logic's cells", PICTURE_CELL_WORDS, PICTURE_CELL_WORDS_JA],
  ["the pencil puzzles", PENCIL_COPY, PENCIL_COPY_JA],
  ["Jirai", JIRAI_COPY, JIRAI_COPY_JA],
] as const;

describe("the puzzle screens' tables of words speak Japanese", () => {
  it.each(TABLES)("%s: every English sentence has its Japanese, and none answers nothing", (_name, english, ja) => {
    expect(unanswered(english, ja as never)).toEqual([]);
    expect(orphaned(english, ja)).toEqual([]);
  });

  it.each(TABLES)("%s: every line is Japanese with a back-translation", (_name, _english, ja) => {
    const lines = overlayLines(ja);
    expect(lines.length).toBeGreaterThan(0);
    for (const { path, line } of lines) expect(problemsWith(line), path).toEqual([]);
  });

  it("reads each table in the reader's language, and the English reader's untouched", () => {
    expect(cubeCopy("en")).toBe(CUBE_COPY);
    expect(cubeCopy("ja").undo).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(tsunagiChips("ja").walls.says).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(tsunagiChips("en").walls.says).toBe(TSUNAGI_CHIPS.walls.says);
    expect(tobiishiWords("ja").copy.levelsLine).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(tobiishiWords("en").copy.levelsLine).toBe(MAZE_TABLES.TOBIISHI.copy.levelsLine);
    expect(mahjongCopy("ja").noMatch).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(freeCellCopy("en")).toBe(FREECELL_COPY);
    expect(spiderCopy("ja").dealsLeft(0)).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(solitaireCopy("ja").passesLeft(Infinity)).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(solitaireOptions("ja").scores.vegas.says).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(solitaireOptions("en")).toBe(SOLITAIRE_OPTIONS);
    expect(bridgesCopy("ja").howTo).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(bridgesCellWords("en")).toBe(BRIDGES_CELL_WORDS);
    expect(pictureCopy("en")).toBe(PICTURE_COPY);
    expect(pictureCellWords("ja")["#"]).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(pencilCopy("en")).toBe(PENCIL_COPY);
    expect(jiraiCopy("ja")).not.toBe(JIRAI_COPY);
  });

  it("names every chip, kind and way in Japanese a reader can use, never in English and never a bare kanji that says too little", () => {
    const say = speaker("ja");
    const japanese = /[぀-ヿ一-鿿]/;
    const sheets: [string, Record<string, { label: string; kanji?: string }>][] = [
      ["Suido kinds", suidoWords("ja").kinds],
      ["Suido squares", suidoWords("ja").squares],
      ["Suido twists", suidoWords("ja").twists],
      ["Suido modes", suidoWords("ja").modes],
      ["Meikyuu shapes", meikyuuWords("ja").shape],
      ["Meikyuu ways", meikyuuWords("ja").way],
      ["Meikyuu solids", meikyuuWords("ja").solid],
      ["Tsunagi chips", Object.fromEntries(Object.entries(tsunagiChips("ja")).filter(([key]) => key !== "difficulty" && key !== "teaches" && key !== "tests").map(([key, value]) => [key, value as { label: string; kanji?: string }]))],
    ];
    for (const [name, table] of sheets) {
      for (const [key, entry] of Object.entries(table)) expect(japanese.test(readerName(say, entry)), `${name} ${key}`).toBe(true);
    }
    // The four whose single kanji says too little have a name of their own.
    expect(readerName(say, suidoWords("ja").twists.wrap)).toBe("端がつながる");
    expect(readerName(say, tsunagiChips("ja").strokes)).toBe("線を引ける回数");
    expect(readerName(speaker("en"), suidoWords("en").twists.wrap)).toBe("Edges join");
  });
});
