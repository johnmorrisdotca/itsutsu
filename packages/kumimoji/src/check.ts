import { decodeGrid, lettersOf, sameLetters } from "./grid.ts";
import { judgeWithWords } from "./judge.ts";
import { kumimojiTileCount, kumimojiWildCount, KUMIMOJI_SCORE, TILE_MIX_TOTAL } from "./tiles.constants.ts";
import type { KumimojiCheck, KumimojiLevel, KumimojiOptions } from "./kumimoji.types.ts";
import { tileWords } from "./tileWords.ts";

/**
 * WHETHER A GRID FINISHES A KUMIMOJI: the one check the server also runs.
 * O(squares) and a lookup a word, nothing searched: the grid uses exactly the
 * tiles of the bag, as many of each, it is all one piece, and every run of two
 * or more across or down is in the list — and, for a game set up with
 * Diagonals, every run of three or more along a diagonal. Which tiles were
 * traded on the way does not matter — a finished game holds the whole bag
 * whatever came out of it when — so the answer is the grid alone.
 *
 * Written out here rather than asked of the play page, which is what made the
 * grid; the list must have been loaded (`loadTileWords`), and a check that
 * cannot read it refuses.
 */
export function checkKumimoji(size: number, givens: string, answer: string, options: KumimojiOptions & { level?: KumimojiLevel } = {}): KumimojiCheck {
  const gameLength = options.gameLength ?? "short";
  const language = options.language ?? "english";
  const doubleSet = language === "english" && (options.doubleSet ?? false);
  const level = options.level ?? "medium";
  const multiplier = doubleSet ? 2 : 1;
  let words: ReturnType<typeof tileWords>;
  let inBag: number;
  try {
    words = tileWords(language);
    const setSize = [...words.mix.values()].reduce((sum, count) => sum + count, 0);
    inBag = kumimojiTileCount(size, gameLength, language === "english" ? TILE_MIX_TOTAL : setSize, doubleSet);
  } catch {
    return { ok: false, reason: `no Kumimoji with a hand of ${size}` };
  }
  const bag = [...givens];
  if (typeof givens !== "string" || bag.length !== inBag) return { ok: false, reason: "the givens are not a bag of tiles" };
  const expectedWilds = kumimojiWildCount(size, level, inBag);
  if (bag.filter(words.isWild).length !== expectedWilds) return { ok: false, reason: "the bag has the wrong number of wild tiles" };
  for (const [tile, count] of lettersOf(bag.filter((each) => !words.isWild(each)))) {
    const face = words.inventoryKey(tile);
    const code = face === null ? null : words.codeOf(face);
    if (code === null || count > (words.mix.get(code) ?? 0) * multiplier) return { ok: false, reason: "the bag exceeds the tile set" };
  }
  const tiles = decodeGrid(answer);
  if (tiles === null) return { ok: false, reason: "the answer is not a grid" };
  const bagIdentities = bag.map(words.familyKey);
  const tileIdentities = [...tiles.values()].map(words.familyKey);
  if (bagIdentities.some((tile) => tile === null) || tileIdentities.some((tile) => tile === null) || !sameLetters(lettersOf(tileIdentities as string[]), lettersOf(bagIdentities as string[]))) {
    return { ok: false, reason: "the grid does not use exactly the tiles of the bag" };
  }
  const verdict = judgeWithWords(tiles, words, { diagonals: options.diagonals === true });
  if (verdict.apart.size > 0) return { ok: false, reason: "the tiles are not all joined" };
  if (verdict.notWords.length > 0) return { ok: false, reason: `${verdict.notWords[0]} is not in the word list` };
  if (!verdict.sound) return { ok: false, reason: "the grid is not finished" };
  return { ok: true };
}

/** A finished game's leaderboard points (`KUMIMOJI_SCORE`): ten a tile, and up to as much again for speed. */
export function kumimojiPoints(givens: string, elapsedMs: number): number {
  const tiles = givens.length;
  const base = KUMIMOJI_SCORE.tile * tiles;
  const slowest = KUMIMOJI_SCORE.slowestMsATile * tiles;
  const speed = Math.max(0, Math.round(base * (1 - Math.max(0, elapsedMs) / slowest)));
  return base + speed;
}
