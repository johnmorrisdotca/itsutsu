import { judgeGrid, type GridRules, type GridVerdict, type Tiles } from "./grid";
import type { TileWords } from "./tileWords";

/**
 * A GRID JUDGED AGAINST ITS LANGUAGE'S LIST, the one way the solo game, each
 * seat of a pass-and-play game and the server's check all ask it: a run is a
 * word when its tiles spell one the list holds (`wordOf`, so a wild reads as
 * the letter or kana it was given), and a run that is not is named as it
 * reads. `rules` says whether the diagonals are read (`GridRules`).
 */
export function judgeWithWords(tiles: Tiles, words: TileWords, rules: GridRules = {}): GridVerdict {
  return judgeGrid(
    tiles,
    (codes) => {
      const word = words.wordOf(codes);
      return word !== null && words.allowed.has(word);
    },
    (codes) => words.wordOf(codes) ?? codes,
    rules,
  );
}
