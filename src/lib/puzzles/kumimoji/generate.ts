import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import { encodeGrid, squareAt } from "./grid";
import { KUMIMOJI_BAG, TILE_MIX } from "./tiles.constants";
import { tileWords, type TileWords } from "./tileWords";

/**
 * MAKING A KUMIMOJI, in the browser, from a seed: the bag the game is played
 * from, in the order its tiles come out.
 *
 * A bag drawn blind from the mix can be one nobody can finish — two Q's and
 * no U, and every tile must be laid before the game ends. So the bag is made
 * the other way round: a crossword is laid first, word by word, from letters
 * drawn from the mix (`TILE_MIX`), and the bag is that crossword's tiles,
 * shuffled. Every bag has at least one finished grid, which is the puzzle's
 * `solution` — kept only to prove that, never shown — and a player may build
 * any other.
 *
 * The crossword grows from a word across the middle: each next word crosses
 * a tile already down, its new tiles touching nothing at their sides, so every
 * run on it is a word by construction. Words are chosen to use the letters
 * drawn from the mix, and never a letter more times than the whole set holds,
 * so the bag reads like a handful from the full set.
 *
 * Deterministic in the seed, like every generator here: two browsers in a
 * race, or one tomorrow, deal the same bag in the same order.
 */
export function generateKumimoji(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const tiles = KUMIMOJI_BAG[size];
  if (tiles === undefined) throw new Error(`No Kumimoji with a hand of ${size}.`);
  const words = tileWords();
  const random = seededRandom(seed);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const squares = layCrossword(tiles, random, words);
    if (squares === null) continue;
    const bag = shuffled(
      squares.filter((letter) => letter !== ""),
      random,
    );
    return { kind: "kumimoji", size, level, seed, givens: bag.join(""), solution: encodeGrid(tilesOf(squares)) };
  }
  throw new Error(`Could not lay a Kumimoji of ${tiles} tiles from seed ${seed}.`);
}

/**
 * The generator lays its crossword on a square of its own, this wide, from
 * the middle out; only where the tiles stand beside each other is kept
 * (`encodeGrid`), so the square is scaffolding and not a board.
 */
const LAYING_SIDE = 21;

/** The laid square's tiles, by row and column. */
function tilesOf(squares: readonly string[]): Map<string, string> {
  const tiles = new Map<string, string>();
  squares.forEach((letter, index) => {
    if (letter !== "") tiles.set(squareAt(Math.floor(index / LAYING_SIDE), index % LAYING_SIDE), letter);
  });
  return tiles;
}

/** The longest word the generator lays: long words leave no room to cross. */
const LONGEST_LAID = 7;
/** How many tiles it tries to cross from, and how many words of a length it reads for each. */
const ANCHORS_TRIED = 8;
const WORDS_READ = 60;

type Placement = { word: string; start: number; across: boolean; fresh: number[]; score: number };

/** A crossword of exactly `tiles` tiles, or null where this try got stuck (the caller tries again). */
function layCrossword(tiles: number, random: Random, words: TileWords): string[] | null {
  const side = LAYING_SIDE;
  const squares = new Array<string>(side * side).fill("");
  // What the set still holds of each letter, and the handful drawn from it that the words are chosen to use.
  const left = new Map(Object.entries(TILE_MIX));
  const wanted = new Map<string, number>();
  const set = Object.entries(TILE_MIX).flatMap(([letter, count]) => new Array<string>(count).fill(letter));
  for (const letter of shuffled(set, random).slice(0, tiles)) wanted.set(letter, (wanted.get(letter) ?? 0) + 1);

  const lay = (placement: Placement) => {
    const step = placement.across ? 1 : side;
    [...placement.word].forEach((letter, at) => {
      const index = placement.start + at * step;
      if (squares[index] !== "") return;
      squares[index] = letter;
      left.set(letter, (left.get(letter) ?? 0) - 1);
      wanted.set(letter, (wanted.get(letter) ?? 0) - 1);
    });
  };

  // The first word, across the middle.
  const firstLength = Math.min(tiles, 3 + Math.floor(random() * 4));
  const first = bestOf(
    sample(words.byLength.get(firstLength) ?? [], WORDS_READ * 4, random).map((word) => {
      const start = Math.floor(side / 2) * side + Math.floor((side - firstLength) / 2);
      return scored(word, start, true, Array.from({ length: word.length }, (_, at) => start + at), left, wanted, random);
    }),
  );
  if (first === null) return null;
  lay(first);
  let laid = firstLength;

  while (laid < tiles) {
    const room = tiles - laid;
    const anchors = shuffled(
      squares.flatMap((letter, index) => (letter === "" ? [] : [index])),
      random,
    ).slice(0, ANCHORS_TRIED);
    const found: Placement[] = [];
    for (const anchor of anchors) {
      for (const across of [true, false]) {
        for (let length = 2; length <= Math.min(LONGEST_LAID, room + 1); length += 1) {
          const letter = squares[anchor]!;
          for (const word of sample(words.byLength.get(length) ?? [], WORDS_READ, random, letter)) {
            for (let at = 0; at < word.length; at += 1) {
              if (word[at] !== letter) continue;
              const placement = fit(squares, word, anchor, at, across, room, left, wanted, random);
              if (placement !== null) found.push(placement);
            }
          }
        }
      }
    }
    const next = bestOf(found);
    if (next === null) return null;
    lay(next);
    laid += next.fresh.length;
  }
  return squares;
}

/** Up to `count` words of a list, read from a random place onward, only those holding `letter` when one is named. */
function sample(list: readonly string[], count: number, random: Random, letter?: string): string[] {
  if (list.length === 0) return [];
  const out: string[] = [];
  const from = Math.floor(random() * list.length);
  for (let read = 0; read < list.length && out.length < count; read += 1) {
    const word = list[(from + read) % list.length]!;
    if (letter === undefined || word.includes(letter)) out.push(word);
  }
  return out;
}

/**
 * Where `word` would stand crossing the tile at `anchor` with its letter at
 * `at`, or null where it cannot: off the board, over a different letter, a
 * tile at either end, a new tile with a neighbour at its side, more new tiles
 * than the bag has room for, or a letter the set has run out of.
 */
function fit(
  squares: readonly string[],
  word: string,
  anchor: number,
  at: number,
  across: boolean,
  room: number,
  left: Map<string, number>,
  wanted: Map<string, number>,
  random: Random,
): Placement | null {
  const side = LAYING_SIDE;
  const row = Math.floor(anchor / side);
  const col = anchor % side;
  const first = across ? col - at : row - at;
  if (first < 0 || first + word.length > side) return null;
  const step = across ? 1 : side;
  const start = anchor - at * step;
  const before = first > 0 ? start - step : -1;
  const after = first + word.length < side ? start + word.length * step : -1;
  if ((before !== -1 && squares[before] !== "") || (after !== -1 && squares[after] !== "")) return null;
  const fresh: number[] = [];
  for (let k = 0; k < word.length; k += 1) {
    const index = start + k * step;
    if (squares[index] !== "") {
      if (squares[index] !== word[k]) return null;
      continue;
    }
    const r = Math.floor(index / side);
    const c = index % side;
    const sides = across ? [r > 0 ? index - side : -1, r < side - 1 ? index + side : -1] : [c > 0 ? index - 1 : -1, c < side - 1 ? index + 1 : -1];
    if (sides.some((near) => near !== -1 && squares[near] !== "")) return null;
    fresh.push(index);
  }
  if (fresh.length === 0 || fresh.length > room) return null;
  return scored(word, start, across, fresh, left, wanted, random, squares);
}

/** A placement's worth: a letter drawn from the mix is worth two, any other costs three, and the set's own counts are a wall. */
function scored(
  word: string,
  start: number,
  across: boolean,
  fresh: number[],
  left: Map<string, number>,
  wanted: Map<string, number>,
  random: Random,
  squares?: readonly string[],
): Placement | null {
  const step = across ? 1 : LAYING_SIDE;
  const using = new Map<string, number>();
  let score = 0;
  for (let k = 0; k < word.length; k += 1) {
    const index = start + k * step;
    if (squares !== undefined && squares[index] !== "") continue;
    const letter = word[k]!;
    const count = (using.get(letter) ?? 0) + 1;
    using.set(letter, count);
    if (count > (left.get(letter) ?? 0)) return null;
    score += count <= (wanted.get(letter) ?? 0) ? 2 : -3;
  }
  return { word, start, across, fresh, score: score + 0.3 * fresh.length + 0.5 * random() };
}

function bestOf(placements: readonly (Placement | null)[]): Placement | null {
  let best: Placement | null = null;
  for (const placement of placements) if (placement !== null && (best === null || placement.score > best.score)) best = placement;
  return best;
}
