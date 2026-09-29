import { beforeAll, describe, expect, it } from "vitest";

import { judgeGrid, squareAt } from "./grid";
import { BASE_KANA, CORNER_FORMS } from "./kana";
import { assignTableTile, deal, draw, isFinished, mayDraw, placeFromHand, type TilePlay } from "./play";
import { formsOfTile, lengthRows, mixShown, TRY_IT } from "./showcase";
import { JAPANESE_TILE_MIX, KUMIMOJI_HANDS, TILE_MIX, TILE_MIX_TOTAL, kumimojiTileCount } from "./tiles.constants";
import { loadTileWords, tileWords } from "./tileWords";

beforeAll(async () => {
  await loadTileWords();
});

/** The judge the game uses, over the English list. */
function verdictOf(play: TilePlay) {
  const words = tileWords();
  return judgeGrid(play.tiles, (codes) => {
    const word = words.wordOf(codes);
    return word !== null && words.allowed.has(word);
  });
}

describe("the Kumimoji pages' data", () => {
  it("shows each set as the game deals it: every tile, every count, 144 in all", () => {
    const english = mixShown("english");
    expect(english.total).toBe(TILE_MIX_TOTAL);
    expect(english.tiles.map((tile) => [tile.glyph, tile.count])).toEqual(Object.entries(TILE_MIX));
    expect(english.rarest).toEqual(Object.keys(TILE_MIX).filter((letter) => TILE_MIX[letter] === english.fewest));
    expect(english.rarest).toEqual(expect.arrayContaining(["j", "q", "x", "z"]));
    expect(english.commonest).toEqual(["e"]);

    const japanese = mixShown("japanese");
    expect(japanese.tiles.map((tile) => tile.glyph).join("")).toBe(BASE_KANA);
    expect(japanese.total).toBe(Object.values(JAPANESE_TILE_MIX).reduce((sum, count) => sum + count, 0));
    expect(japanese.fewest).toBe(1);
    expect(japanese.rarest).toEqual(expect.arrayContaining(["ぬ", "へ", "ね", "ろ", "れ"]));
    expect(japanese.tiles.find((tile) => tile.glyph === "は")!.forms).toBe(CORNER_FORMS["は"]);
  });

  it("lists every form a kana tile plays as, the corner's and the rare ones, and nothing that is not its own", () => {
    expect(formsOfTile("は")).toEqual(["は", "ば", "ぱ"]);
    expect(formsOfTile("つ")).toEqual(["つ", "っ", "づ"]);
    expect(formsOfTile("お")).toEqual(["お", "ぉ", "を"]);
    expect(formsOfTile("う")).toEqual(["う", "ぅ", "ゔ"]);
    expect(formsOfTile("ん")).toEqual(["ん"]);
    // Every corner form is in the tile's list: the corner shows a subset, never something else.
    for (const [kana, corner] of Object.entries(CORNER_FORMS)) for (const form of corner) expect(formsOfTile(kana)).toContain(form);
    // Not a tile: a voiced kana is played by its base, and says nothing of its own.
    expect(formsOfTile("が")).toEqual([]);
  });

  it("counts each length's tiles and wilds from the game's own tables", () => {
    const rows = lengthRows(KUMIMOJI_HANDS.classic);
    expect(rows.map((row) => row.tiles)).toEqual(["short", "medium", "full"].map((length) => kumimojiTileCount(KUMIMOJI_HANDS.classic, length as "short")));
    expect(rows[2]!.tiles).toBe(TILE_MIX_TOTAL);
    expect(rows[2]!.doubleTiles).toBe(TILE_MIX_TOTAL * 2);
    for (const row of rows) {
      expect(row.wilds.easy).toBeGreaterThan(row.wilds.medium);
      expect(row.wilds.hard).toBe(0);
    }
  });

  it("gives the try-it a bag that the game's own moves and word check can finish", () => {
    let play = deal(TRY_IT.bag, TRY_IT.hand);
    const lay = (letter: string, square: string) => {
      const at = play.hand.indexOf(letter);
      expect(at, `${letter} is in the hand`).toBeGreaterThanOrEqual(0);
      play = placeFromHand(play, at, square);
    };
    // SENATOR across; then AD down from its A, IT down onto its T, and the wild made X for OX under its O.
    for (const [col, letter] of [..."senator"].entries()) lay(letter, squareAt(0, col));
    expect(verdictOf(play).sound).toBe(true);
    for (const [letter, square] of [["d", squareAt(1, 3)], ["i", squareAt(-1, 4)], ["*", squareAt(1, 5)]] as const) {
      expect(mayDraw(play, verdictOf(play)), `the grid is sound before ${letter} is drawn`).toBe(true);
      play = draw(play);
      lay(letter, square);
    }
    play = assignTableTile(play, squareAt(1, 5), tileWords().wildFor("x")!);
    const verdict = verdictOf(play);
    expect(verdict.notWords).toEqual([]);
    expect(isFinished(play, verdict)).toBe(true);
    // And the bag holds exactly what the page says: a hand of seven, then three to draw, the last a wild.
    expect(TRY_IT.bag.length - TRY_IT.hand).toBe(3);
    expect(TRY_IT.bag.at(-1)).toBe("*");
  });
});
