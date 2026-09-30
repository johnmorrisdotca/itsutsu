import { runsOf, type GridRules, type Run, type Tiles } from "./grid";
import type { TileWords } from "./tileWords";

/**
 * A WILD LAID WITHOUT A LETTER READS AS WHATEVER MAKES THE GRID WORDS. John,
 * 2026-09-29, having laid D, a blank wild, O, N, E and been told "Not a word:
 * D*ONE": "Either we are smarter and use a regex or something to know that
 * it's a valid possible word." Choosing the wild's letter is still offered,
 * and a wild given one reads as that letter only; a blank one is any letter
 * the list allows.
 *
 * One blank can stand in two runs, across and down, and two blanks can share
 * a run, so the letters are chosen together: blank by blank, each letter
 * kept only while every run through it could still be a word — a run with
 * blanks left in it is asked whether any word of its length fits the letters
 * it has, a run with none whether it is one. Blanks that share no run are
 * settled apart, so one crossword's wilds never multiply another's.
 *
 * `readWilds` hands back the grid with each blank given the wild of a letter
 * that works (`wildFor`), or null where no choice makes every run a word —
 * and the grid is then judged as laid, blank and all, so the line under the
 * table names the run as the player spelled it. It gives up, answering null,
 * past `WILD_SEARCH_MOST` steps: a grid it could not settle is not called
 * sound.
 */
export const WILD_SEARCH_MOST = 20_000;

/** The grid with every blank wild read as a letter that makes all its runs words, or null for none; the grid itself when it holds no blank. */
export function readWilds(tiles: Tiles, words: TileWords, rules: GridRules = {}): Tiles | null {
  const blanks = [...tiles].filter(([, tile]) => tile === "*").map(([square]) => square);
  if (blanks.length === 0) return tiles;
  const runs = runsOf(tiles, rules);
  const through = new Map<string, Run[]>(blanks.map((square) => [square, runs.filter((run) => run.squares.includes(square))]));
  const choices = words.wildOptions.flatMap((face) => {
    const code = words.wildFor(face);
    const sound = code === null ? null : words.soundOf(code);
    return code === null || sound === null ? [] : [{ code, sound }];
  });
  const fits = patternFits(words);
  const read = new Map(tiles);
  let steps = 0;

  const possible = (run: Run): boolean => {
    const sounds = run.squares.map((at) => {
      const tile = read.get(at)!;
      return tile === "*" ? null : words.soundOf(tile);
    });
    if (sounds.every((sound) => sound !== null)) return words.allowed.has(sounds.join(""));
    return fits(sounds);
  };

  const settle = (group: readonly string[], at: number): boolean => {
    if (at === group.length) return true;
    const square = group[at]!;
    for (const choice of choices) {
      steps += 1;
      if (steps > WILD_SEARCH_MOST) return false;
      read.set(square, choice.code);
      if (through.get(square)!.every(possible) && settle(group, at + 1)) return true;
    }
    read.set(square, "*");
    return false;
  };

  for (const group of blankGroups(blanks, through)) {
    if (!settle(group, 0)) return null;
  }
  return read;
}

/** The blanks in groups that share a run, directly or through one another. */
function blankGroups(blanks: readonly string[], through: ReadonlyMap<string, readonly Run[]>): string[][] {
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const start of blanks) {
    if (seen.has(start)) continue;
    const group: string[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length > 0) {
      const square = queue.shift()!;
      group.push(square);
      for (const run of through.get(square)!) {
        for (const other of run.squares) {
          if (through.has(other) && !seen.has(other)) {
            seen.add(other);
            queue.push(other);
          }
        }
      }
    }
    groups.push(group);
  }
  return groups;
}

/** Whether any word of the list spells a run whose null places may be anything, remembered by pattern. */
function patternFits(words: TileWords): (sounds: readonly (string | null)[]) => boolean {
  const known = new Map<string, boolean>();
  return (sounds) => {
    const key = sounds.map((sound) => sound ?? "\u0000").join("\u0001");
    const already = known.get(key);
    if (already !== undefined) return already;
    const found = (words.byLength.get(sounds.length) ?? []).some((word) => {
      const letters = [...word];
      return letters.length === sounds.length && sounds.every((sound, at) => sound === null || words.soundOf(letters[at]!) === sound);
    });
    known.set(key, found);
    return found;
  };
}
