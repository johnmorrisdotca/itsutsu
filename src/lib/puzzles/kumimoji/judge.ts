import { judgeGrid, type GridRules, type GridVerdict, type Tiles } from "./grid";
import type { TileWords } from "./tileWords";
import { readWilds } from "./wilds";

/**
 * A GRID JUDGED AGAINST ITS LANGUAGE'S LIST, the one way the solo game, each
 * seat of a pass-and-play game and the server's check all ask it: a run is a
 * word when its tiles spell one the list holds (`wordOf`, so a wild reads as
 * the letter or kana it was given), and a run that is not is named as it
 * reads. A wild given no letter reads as whichever letter makes every run
 * through it a word (`readWilds`); where none does, the grid is judged as
 * laid and the run is named with its `*`. `rules` says whether the diagonals
 * are read (`GridRules`).
 */
export function judgeWithWords(tiles: Tiles, words: TileWords, rules: GridRules = {}): GridVerdict {
  const read = readWilds(tiles, words, rules) ?? tiles;
  return judgeGrid(
    read,
    (codes) => {
      const word = words.wordOf(codes);
      return word !== null && words.allowed.has(word);
    },
    (codes) => words.wordOf(codes) ?? codes,
    rules,
  );
}
