import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom, shuffled, type Random } from "../random";
import { DIAGONAL_RUN_LEAST, encodeGrid, squareAt } from "./grid";
import { kumimojiTileCount, kumimojiWildCount, TILE_MIX_TOTAL } from "./tiles.constants";
import type { KumimojiOptions } from "./kumimoji.types";
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
 * With Diagonals, the crossword must read as a word along its diagonals too:
 * a new tile that would make a diagonal run of three or more is laid only
 * where that run is a word (`fit`), so the proof holds under the rule the
 * game is played by. Without, nothing about the laying changes, and a seed
 * deals the bag it always dealt.
 *
 * Deterministic in the seed, like every generator here: two browsers in a
 * race, or one tomorrow, deal the same bag in the same order.
 */
export function generateKumimoji(size: number, level: PuzzleLevel, seed: number, options: KumimojiOptions = {}): Puzzle {
  const gameLength = options.gameLength ?? "short";
  const language = options.language ?? "english";
  const doubleSet = language === "english" && (options.doubleSet ?? false);
  const diagonals = options.diagonals === true;
  const multiplier = doubleSet ? 2 : 1;
  const words = tileWords(language);
  const setSize = [...words.mix.values()].reduce((sum, count) => sum + count, 0);
  const tiles = kumimojiTileCount(size, gameLength, language === "english" ? TILE_MIX_TOTAL : setSize, doubleSet);
  const wilds = kumimojiWildCount(size, level, tiles);
  const random = seededRandom(seed);
  const side = layingSideFor(tiles);
  let bestProgress = 0;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const squares = layCrossword(tiles, random, words, side, multiplier, words.mix, (laid) => { bestProgress = Math.max(bestProgress, laid); }, diagonals);
    if (squares === null) continue;
    const positions = shuffled(squares.flatMap((tile, at) => tile === "" ? [] : [at]), random);
    const wildAt = new Set(positions.slice(0, wilds));
    const bag = squares.flatMap((tile, at) => {
      if (tile === "") return [];
      if (!wildAt.has(at)) return [tile];
      const assigned = words.wildFor(words.soundOf(tile) ?? tile);
      if (assigned === null) throw new Error(`No wild tile can represent ${tile}.`);
      squares[at] = assigned;
      return ["*"];
    });
    return { kind: "kumimoji", size, level, seed, givens: shuffled(bag, random).join(""), solution: encodeGrid(tilesOf(squares, side)), gameLength, doubleSet, language, ...(diagonals ? { diagonals } : {}) };
  }
  throw new Error(`Could not lay a Kumimoji of ${tiles} tiles from seed ${seed}; furthest attempt laid ${bestProgress}.`);
}

/**
 * The generator lays its crossword on a square of its own, this wide, from
 * the middle out; only where the tiles stand beside each other is kept
 * (`encodeGrid`), so the square is scaffolding and not a board.
 */
const MIN_LAYING_SIDE = 21;

function layingSideFor(tiles: number): number {
  return Math.max(MIN_LAYING_SIDE, Math.ceil(Math.sqrt(tiles * 4)));
}

/** The laid square's tiles, by row and column. */
function tilesOf(squares: readonly string[], side: number): Map<string, string> {
  const tiles = new Map<string, string>();
  squares.forEach((letter, index) => {
    if (letter !== "") tiles.set(squareAt(Math.floor(index / side), index % side), letter);
  });
  return tiles;
}

/** The longest word the generator lays: long words leave no room to cross. */
const LONGEST_LAID = 7;
/** How many tiles it tries to cross from, and how many words of a length it reads for each. */
const ANCHORS_TRIED = 8;
const WORDS_READ = 60;
const FINISH_BRANCHES = 40;
const FINISH_NODES = 2_000;
/**
 * With Diagonals the last tiles are placed from every tile but a sample of
 * words, and a try that cannot finish is given up sooner: a crossword read
 * along its diagonals too has fewer ways to finish, and reading every word
 * from every tile of a full game at each step took minutes where starting
 * again takes a moment. Measured 2026-09-28, a try that finishes does so in
 * under ten steps; fifteen keeps a full game to a second or two.
 */
const DIAGONAL_FINISH_NODES = 15;

type Placement = { word: string; start: number; across: boolean; fresh: number[]; score: number };

/** A crossword of exactly `tiles` tiles, or null where this try got stuck (the caller tries again). */
function layCrossword(tiles: number, random: Random, words: TileWords, side: number, multiplier: number, mix: ReadonlyMap<string, number>, progress: (laid: number) => void, diagonals: boolean): string[] | null {
  const squares = new Array<string>(side * side).fill("");
  // What the set still holds of each letter, and the handful drawn from it that the words are chosen to use.
  const left = new Map([...mix].map(([letter, count]) => [letter, count * multiplier]));
  const wanted = new Map<string, number>();
  const set = [...mix].flatMap(([letter, count]) => new Array<string>(count * multiplier).fill(letter));
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

  const lift = (placement: Placement) => {
    const step = placement.across ? 1 : side;
    [...placement.word].forEach((letter, at) => {
      const index = placement.start + at * step;
      if (!placement.fresh.includes(index)) return;
      squares[index] = "";
      left.set(letter, (left.get(letter) ?? 0) + 1);
      wanted.set(letter, (wanted.get(letter) ?? 0) + 1);
    });
  };

  // The first word, across the middle.
  const firstLength = Math.min(tiles, 3 + Math.floor(random() * 4));
  const first = bestOf(
    sample(words.byLength.get(firstLength) ?? [], WORDS_READ * 4, random).map((word) => {
      const start = Math.floor(side / 2) * side + Math.floor((side - firstLength) / 2);
      return scored(word, start, true, Array.from({ length: word.length }, (_, at) => start + at), left, wanted, random, undefined, side);
    }),
  );
  if (first === null) return null;
  lay(first);
  let laid = firstLength;
  progress(laid);

  /*
   * Where the next word could go: from a few tiles, a sample of words
   * (`sampled`); from every tile, a sample of words (`wide`, Diagonals only);
   * or from every tile, every word (`exhaustive`).
   */
  const placementsFor = (room: number, reach: "sampled" | "wide" | "exhaustive"): Placement[] => {
    const exhaustive = reach === "exhaustive";
    const anchors = shuffled(
      squares.flatMap((letter, index) => (letter === "" ? [] : [index])),
      random,
    ).slice(0, reach === "sampled" ? ANCHORS_TRIED : squares.length);
    const found: Placement[] = [];
    for (const anchor of anchors) {
      for (const across of [true, false]) {
        for (let length = 2; length <= LONGEST_LAID; length += 1) {
          const letter = squares[anchor]!;
          const candidates = words.byLength.get(length) ?? [];
          for (const word of sample(candidates, exhaustive ? candidates.length : WORDS_READ, random, letter)) {
            for (let at = 0; at < word.length; at += 1) {
              if (word[at] !== letter) continue;
              const placement = fit(squares, word, anchor, at, across, room, left, wanted, random, side, diagonals ? words : null);
              if (placement !== null) found.push(placement);
            }
          }
        }
      }
    }
    return found;
  };

  let finishNodes = 0;
  const finish = (room: number): boolean => {
    if (room === 0) return true;
    if (finishNodes >= (diagonals ? DIAGONAL_FINISH_NODES : FINISH_NODES)) return false;
    finishNodes += 1;
    const placements = placementsFor(room, diagonals ? "wide" : "exhaustive")
      .sort((a, b) => b.score - a.score || b.fresh.length - a.fresh.length)
      .slice(0, FINISH_BRANCHES);
    for (const placement of placements) {
      lay(placement);
      const nextRoom = room - placement.fresh.length;
      progress(tiles - nextRoom);
      if (finish(nextRoom)) return true;
      lift(placement);
    }
    return false;
  };

  while (laid < tiles) {
    const room = tiles - laid;
    if (room <= 10) {
      if (!finish(room)) return null;
      laid = tiles;
      break;
    }
    /* With Diagonals a few tiles often offer nothing the diagonals allow: every tile is tried before this try is given up. */
    const next = bestOf(placementsFor(room, "sampled")) ?? (diagonals ? bestOf(placementsFor(room, "wide")) : null);
    if (next === null) return null;
    lay(next);
    laid += next.fresh.length;
    progress(laid);
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
 * than the bag has room for, or a letter the set has run out of — and, where
 * the diagonals are read (`diagonalWords`), a new tile that would stand in a
 * diagonal run of three or more that is not a word.
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
  side: number,
  diagonalWords: TileWords | null = null,
): Placement | null {
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
  if (diagonalWords !== null && !diagonalsRead(squares, word, start, step, fresh, side, diagonalWords)) return null;
  return scored(word, start, across, fresh, left, wanted, random, squares, side);
}

/**
 * Whether every diagonal run a placement's new tiles would stand in reads as
 * a word: walked from its top end down, the word's own letters on its new
 * squares. Only a run through a new tile can change, and two new tiles of one
 * word never share a diagonal (they share a row or a column), so each is read
 * on its own.
 */
function diagonalsRead(squares: readonly string[], word: string, start: number, step: number, fresh: readonly number[], side: number, words: TileWords): boolean {
  const letterAt = (row: number, col: number): string => {
    if (row < 0 || col < 0 || row >= side || col >= side) return "";
    const index = row * side + col;
    if (squares[index] !== "") return squares[index]!;
    return fresh.includes(index) ? word[(index - start) / step]! : "";
  };
  for (const index of fresh) {
    const row = Math.floor(index / side);
    const col = index % side;
    for (const lean of [1, -1]) {
      let top = 0;
      while (letterAt(row - top - 1, col - (top + 1) * lean) !== "") top += 1;
      let run = "";
      for (let at = -top; letterAt(row + at, col + at * lean) !== ""; at += 1) run += letterAt(row + at, col + at * lean);
      if (run.length < DIAGONAL_RUN_LEAST) continue;
      const read = words.wordOf(run);
      if (read === null || !words.allowed.has(read)) return false;
    }
  }
  return true;
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
  side = MIN_LAYING_SIDE,
): Placement | null {
  const step = across ? 1 : side;
  const using = new Map<string, number>();
  let score = 0;
  for (let k = 0; k < word.length; k += 1) {
    const index = start + k * step;
    if (squares !== undefined && squares[index] !== "") continue;
    const letter = word[k]!;
    const count = (using.get(letter) ?? 0) + 1;
    using.set(letter, count);
    if (count > (left.get(letter) ?? 0)) return null;
    score += (count <= (wanted.get(letter) ?? 0) ? 2 : -3) + 8 / Math.max(1, left.get(letter) ?? 0);
  }
  return { word, start, across, fresh, score: score + 0.3 * fresh.length + 0.5 * random() };
}

function bestOf(placements: readonly (Placement | null)[]): Placement | null {
  let best: Placement | null = null;
  for (const placement of placements) if (placement !== null && (best === null || placement.score > best.score)) best = placement;
  return best;
}
