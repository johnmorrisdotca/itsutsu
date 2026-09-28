import { beforeAll, describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS } from "../puzzles.constants";
import { checkKumimoji, kumimojiPoints } from "./check";
import { generateKumimoji } from "./generate";
import { BASE_KANA } from "./kana";
import { decodeGrid, encodeGrid, judgeGrid, lettersOf, runsOf, squareAt } from "./grid";
import {
  deal,
  assignHandTile,
  decodeTileProgress,
  draw,
  encodeTileProgress,
  isFinished,
  liftAll,
  liftToHand,
  mayDraw,
  mayTrade,
  moveOnTable,
  placeFromHand,
  readTileProgress,
  swapWithHand,
  tilesLeft,
  trade,
} from "./play";
import { KUMIMOJI_BAG, KUMIMOJI_HANDS, KUMIMOJI_TRADE, KUMIMOJI_WILDS, kumimojiTileCount, TILE_MIX, TILE_MIX_TOTAL } from "./tiles.constants";
import { loadTileWords, tileWords, unpackLength } from "./tileWords";

beforeAll(async () => {
  await loadTileWords();
});

const isWord = (word: string) => tileWords().allowed.has(word);

/** A grid from rows of text, "." for an empty square, its first row and column at 0. */
function gridOf(...rows: string[]): Map<string, string> {
  const tiles = new Map<string, string>();
  rows.forEach((line, row) => [...line].forEach((letter, col) => letter !== "." && tiles.set(squareAt(row, col), letter)));
  return tiles;
}

describe("the kumimoji tile mix", () => {
  it("is the 144-tile mix, letter for letter", () => {
    expect(TILE_MIX_TOTAL).toBe(144);
    expect(TILE_MIX.e).toBe(18);
    expect(TILE_MIX.a).toBe(13);
    expect(Object.keys(TILE_MIX)).toHaveLength(26);
  });

  it("offers Quick 7 and Classic 11, eleven by default, and a bag for every hand", () => {
    expect(PUZZLE_SPECS.kumimoji.offered).toEqual([7, 11]);
    expect(PUZZLE_SPECS.kumimoji.defaultSize).toBe(11);
    for (const size of PUZZLE_SPECS.kumimoji.sizes) expect(KUMIMOJI_BAG[size]).toBeGreaterThan(size);
  });

  it("sizes short, medium and full games for one or two tile sets", () => {
    expect([kumimojiTileCount(7, "short"), kumimojiTileCount(11, "short"), kumimojiTileCount(7, "medium"), kumimojiTileCount(7, "full")]).toEqual([40, 50, 72, 144]);
    expect([kumimojiTileCount(7, "short", TILE_MIX_TOTAL, true), kumimojiTileCount(11, "short", TILE_MIX_TOTAL, true), kumimojiTileCount(7, "medium", TILE_MIX_TOTAL, true), kumimojiTileCount(7, "full", TILE_MIX_TOTAL, true)]).toEqual([80, 100, 144, 288]);
    expect(kumimojiTileCount(7, "medium", 200)).toBe(100);
  });
});

describe("the kumimoji word list", () => {
  it("reads front-coded words back", () => {
    expect(unpackLength("0cat2r1ow\n0dog", 3)).toEqual(["cat", "car", "cow", "dog"]);
  });

  it("holds every length from two to fifteen, everyday words, and no letter-plurals", () => {
    const words = tileWords();
    for (let length = 2; length <= 15; length += 1) expect(words.byLength.get(length)?.length ?? 0).toBeGreaterThan(0);
    for (const word of ["at", "qi", "cat", "quiz", "crossword", "extraordinary"]) expect(words.allowed.has(word), word).toBe(true);
    for (const word of ["ks", "lm", "mb", "zzq", "catz"]) expect(words.allowed.has(word), word).toBe(false);
    expect(words.allowed.size).toBeGreaterThan(100_000);
  });

  it("spells every Japanese word in the 45 base kana, so any kana plays as its tile", async () => {
    const words = await loadTileWords("japanese");
    expect(words.allowed.size).toBeGreaterThan(100_000);
    expect(words.mix.size).toBe(45);
    // がっこう is laid か, つ, こ, う; きゃく is き, や, く; を is お.
    for (const word of ["かつこう", "きやく", "はん"]) expect(words.allowed.has(word), word).toBe(true);
    expect(words.codeOf("が")).toBe(words.codeOf("か"));
    expect(words.codeOf("ぱ")).toBe(words.codeOf("は"));
    expect(words.codeOf("ゃ")).toBe(words.codeOf("や"));
    expect(words.codeOf("っ")).toBe(words.codeOf("つ"));
    expect(words.codeOf("を")).toBe(words.codeOf("お"));
    expect(words.codeOf("ー")).toBeNull();
    expect(words.codeOf("カ")).toBeNull();
  });

  it("shows the forms a tile also plays as in its corner, and a wild as the 五", async () => {
    const words = await loadTileWords("japanese");
    expect(words.formsOf(words.codeOf("は")!)).toBe("ばぱ");
    expect(words.formsOf(words.codeOf("ゆ")!)).toBe("ゅ");
    expect(words.formsOf(words.codeOf("つ")!)).toBe("っづ");
    expect(words.formsOf(words.codeOf("お")!)).toBe("を");
    expect(words.formsOf(words.codeOf("ん")!)).toBe("");
    expect(words.glyphOf("*")).toBe("五");
    const wild = words.wildFor("ぱ")!;
    expect(words.isWild(wild)).toBe(true);
    expect(words.wildSound(wild)).toBe("は");
    expect(words.glyphOf(wild)).toBe("は");
    expect(words.wordOf(wild)).toBe("は");
    expect(words.formsOf(wild)).toBe("");
    expect(tileWords().formsOf("a")).toBe("");
  });

  it("holds 144 Japanese tiles, the hard kana at one and the joining kana on top", async () => {
    const words = await loadTileWords("japanese");
    const count = (kana: string) => words.mix.get(words.codeOf(kana)!) ?? 0;
    expect([...words.mix.values()].reduce((sum, each) => sum + each, 0)).toBe(144);
    for (const kana of BASE_KANA) expect(count(kana), kana).toBeGreaterThanOrEqual(1);
    for (const kana of "ぬへねろれむの") expect(count(kana), kana).toBe(1);
    for (const kana of "うんいし") expect(count(kana), kana).toBeGreaterThanOrEqual(10);
  });
});

describe("a kumimoji grid", () => {
  it("is written from its own top-left tile, whatever squares it stands on", () => {
    const tiles = new Map([
      [squareAt(-3, 5), "c"],
      [squareAt(-3, 6), "a"],
      [squareAt(-3, 7), "t"],
      [squareAt(-2, 5), "o"],
      [squareAt(-1, 5), "w"],
    ]);
    expect(encodeGrid(tiles)).toBe("cat/o/w");
    expect(encodeGrid(decodeGrid("cat/o/w")!)).toBe("cat/o/w");
    expect(encodeGrid(gridOf("..a", "cab"))).toBe("2a/cab");
    expect(decodeGrid("2a/cab")!.get(squareAt(0, 2))).toBe("a");
  });

  it("round-trips multi-character kana tiles and an assigned wild without changing English codes", () => {
    const tiles = new Map([
      [squareAt(0, 0), "きゃ"],
      [squareAt(0, 1), "*しゃ"],
      [squareAt(1, 0), "ちゃ"],
    ]);
    expect(decodeGrid(encodeGrid(tiles))).toEqual(tiles);
    expect(encodeGrid(gridOf("cat", "o..", "w.."))).toBe("cat/o/w");
  });

  it("refuses a string that is not a grid", () => {
    expect(decodeGrid("CAT")).toBeNull();
    expect(decodeGrid("ca t")).toBeNull();
    expect(decodeGrid("99a")).toBeNull();
    expect(decodeGrid(new Array(61).fill("a").join("/"))).toBeNull();
  });

  it("finds every run across and down, and marks what is not a word or not joined", () => {
    const sound = gridOf("cat", "o..", "w..");
    expect(runsOf(sound).map((run) => run.word).sort()).toEqual(["cat", "cow"]);
    expect(judgeGrid(sound, isWord).sound).toBe(true);

    const misspelt = judgeGrid(gridOf("cat", "oz.", "w.."), isWord);
    expect(misspelt.sound).toBe(false);
    expect(misspelt.notWords).toEqual(expect.arrayContaining(["oz", "az"]));
    expect(misspelt.misspelt.has(squareAt(1, 1))).toBe(true);

    const apart = judgeGrid(gridOf("cat..", ".....", "...ox"), isWord);
    expect(apart.sound).toBe(false);
    expect([...apart.apart].sort()).toEqual([squareAt(2, 3), squareAt(2, 4)]);

    expect(judgeGrid(gridOf("a"), isWord).sound).toBe(false);
  });
});

describe("making a kumimoji", () => {
  it.each(PUZZLE_SPECS.kumimoji.sizes)("deals a bag of the right size at hand %i, laid out once as a sound crossword", (size) => {
    for (const seed of [1, 2, 3, 77, 20260926]) {
      const puzzle = generateKumimoji(size, "medium", seed);
      expect(puzzle.givens).toHaveLength(KUMIMOJI_BAG[size]!);
      expect(checkSolution("kumimoji", size, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      expect(generateKumimoji(size, "medium", seed)).toEqual(puzzle);
        expect([...puzzle.givens].filter(tileWords().isWild)).toHaveLength(KUMIMOJI_WILDS[size]!.medium);
        for (const [letter, count] of lettersOf(puzzle.givens).entries()) {
          if (tileWords().isWild(letter)) continue;
          expect(count).toBeLessThanOrEqual(TILE_MIX[letter]!);
        }
    }
  });

  it("deals different bags from different seeds", () => {
    expect(generateKumimoji(11, "medium", 1).givens).not.toBe(generateKumimoji(11, "medium", 2).givens);
  });

  it("lays and independently checks a full Double inventory", () => {
    const puzzle = generateKumimoji(7, "medium", 20260928, { gameLength: "full", doubleSet: true });
    expect(puzzle.givens).toHaveLength(288);
    expect(checkSolution("kumimoji", 7, puzzle.givens, puzzle.solution, "medium", { gameLength: "full", doubleSet: true })).toEqual({ ok: true });
  });

  it("lays a Japanese bag and independently checks its words and wilds", async () => {
    await loadTileWords("japanese");
    const words = tileWords("japanese");
    for (const seed of [1, 20260928]) {
      const puzzle = generateKumimoji(7, "medium", seed, { language: "japanese" });
      expect(puzzle.givens).toHaveLength(40);
      expect([...puzzle.givens].filter(words.isWild)).toHaveLength(3);
      expect(checkSolution("kumimoji", 7, puzzle.givens, puzzle.solution, "medium", { language: "japanese" })).toEqual({ ok: true });
    }
  });
});

describe("checking a finished kumimoji", () => {
  const puzzle = () => generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 42);

  it("refuses a grid missing a tile, one with a tile too many, and one that is not a grid", () => {
    const { givens, solution } = puzzle();
    const tiles = decodeGrid(solution)!;
    const first = [...tiles.keys()][0]!;
    const short = new Map(tiles);
    short.delete(first);
    expect(checkKumimoji(7, givens, encodeGrid(short)).ok).toBe(false);
    expect(checkKumimoji(7, givens, `${solution}/e`).ok).toBe(false);
    expect(checkKumimoji(7, givens, givens).ok).toBe(false);
    expect(checkKumimoji(7, givens.toUpperCase(), solution).ok).toBe(false);
  });

  it("takes any sound grid of the bag's tiles, not only the one it was dealt from", () => {
    const bag = "tacwo";
    expect(checkKumimoji(3, bag, "cat/o/w")).toEqual({ ok: true });
    expect(checkKumimoji(3, bag, "cat/2o/2w")).toEqual({ ok: true });
    expect(checkKumimoji(3, bag, "cat/1o/1w")).toEqual({ ok: false, reason: "aow is not in the word list" });
    expect(checkKumimoji(3, bag, "cat/5o/5w")).toEqual({ ok: false, reason: "the tiles are not all joined" });
  });

  it("scores ten a tile and as much again for speed, falling to nothing at half a minute a tile", () => {
    const bag = "a".repeat(50);
    expect(kumimojiPoints(bag, 0)).toBe(1000);
    expect(kumimojiPoints(bag, 10 * 60_000)).toBe(800);
    expect(kumimojiPoints(bag, 50 * 30_000)).toBe(500);
    expect(kumimojiPoints(bag, 60 * 60_000)).toBe(500);
  });
});

describe("playing a kumimoji", () => {
  it("keeps a Japanese wild's reading through a saved run", async () => {
    const words = await loadTileWords("japanese");
    const ha = words.codeOf("は")!;
    const wild = words.wildFor("ち")!;
    const assigned = assignHandTile(deal(`*${ha}`, 2), 0, wild);
    expect(assigned.hand).toEqual([wild, ha]);
    const saved = encodeTileProgress(placeFromHand(assigned, 1, "0,0"));
    expect(decodeTileProgress(saved, `*${ha}`, "japanese")?.hand).toEqual([wild]);

    const englishWild = tileWords().wildFor("x")!;
    const englishRun = encodeTileProgress(assignHandTile(deal("*", 1), 0, englishWild));
    expect(decodeTileProgress(englishRun, "*")?.hand).toEqual([englishWild]);
  });

  it("deals a hand, places, moves, swaps and lifts tiles without touching the state it was given", () => {
    const start = deal("catowxyz", 3);
    expect(start.hand).toEqual(["c", "a", "t"]);
    expect(tilesLeft(start)).toBe(5);
    const placed = placeFromHand(start, 0, squareAt(0, 0));
    expect(start.tiles.size).toBe(0);
    expect(placed.hand).toEqual(["a", "t"]);
    expect(placeFromHand(placed, 0, squareAt(0, 0))).toBe(placed);
    const moved = moveOnTable(placed, squareAt(0, 0), squareAt(4, -2));
    expect(moved.tiles.get(squareAt(4, -2))).toBe("c");
    const swapped = swapWithHand(moved, 1, squareAt(4, -2));
    expect(swapped.tiles.get(squareAt(4, -2))).toBe("t");
    expect(swapped.hand).toEqual(["a", "c"]);
    expect(liftToHand(swapped, squareAt(4, -2)).hand).toEqual(["a", "c", "t"]);
    expect(liftAll(swapped).tiles.size).toBe(0);
  });

  it("draws only when the hand is used and the grid is sound, and ends when the bag is empty", () => {
    let play = deal("catow", 3);
    play = placeFromHand(play, 0, squareAt(0, 0));
    play = placeFromHand(play, 0, squareAt(0, 1));
    expect(mayDraw(play, judgeGrid(play.tiles, isWord))).toBe(false);
    play = placeFromHand(play, 0, squareAt(0, 2));
    expect(mayDraw(play, judgeGrid(play.tiles, isWord))).toBe(true);
    play = draw(play);
    expect(play.hand).toEqual(["o"]);
    play = placeFromHand(play, 0, squareAt(1, 0));
    play = draw(play);
    play = placeFromHand(play, 0, squareAt(2, 0));
    expect(isFinished(play, judgeGrid(play.tiles, isWord))).toBe(true);
    expect(encodeGrid(play.tiles)).toBe("cat/o/w");
  });

  it("trades one tile to the bottom of the bag for the next three, and only while three are left", () => {
    const play = deal("qabcde", 1);
    const traded = trade(play, 0);
    expect(traded.hand).toEqual(["a", "b", "c"]);
    expect(traded.returned).toBe("q");
    expect(tilesLeft(traded)).toBe(tilesLeft(play) + KUMIMOJI_TRADE.give - KUMIMOJI_TRADE.take);
    // The bag is now d, e, q: the Q comes back last.
    expect(draw(draw(draw(traded))).hand.slice(-3)).toEqual(["d", "e", "q"]);
    expect(mayTrade(deal("abc", 1))).toBe(false);
  });

  it("keeps a game half way and opens it again on its own bag, and on no other", () => {
    let play = deal("qabcdefgh", 2);
    play = trade(play, 0);
    play = placeFromHand(play, 0, squareAt(-5, 9));
    const kept = encodeTileProgress(play);
    expect(kept).toBe("5:q:bcd:a");
    expect(readTileProgress(kept)).not.toBeNull();
    const opened = decodeTileProgress(kept, "qabcdefgh")!;
    expect(opened.hand).toEqual(["b", "c", "d"]);
    expect(encodeGrid(opened.tiles)).toBe("a");
    expect(tilesLeft(opened)).toBe(tilesLeft(play));
    expect(decodeTileProgress(kept, "zzzzzzzzz")).toBeNull();
    expect(readTileProgress("x:q:bcd:a")).toBeNull();
  });
});
