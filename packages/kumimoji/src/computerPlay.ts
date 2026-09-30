import { boundsOf, placeOf, squareAt, type GridRules, type GridVerdict, type Tiles } from "./grid.ts";
import { judgeWithWords } from "./judge.ts";
import { crossingFit, type Square } from "./placement.ts";
import { assignHandTile, placeFromHand, type TilePlay } from "./play.ts";
import { KUMIMOJI_GRID_MOST } from "./tiles.constants.ts";
import type { TileWords } from "./tileWords.ts";

/**
 * WHAT A COMPUTER PLAYER LAYS: one word at a time, from its own hand, onto its
 * own table. Pure, and with no randomness at all — the same hand on the same
 * table lays the same word — so a computer's turn replays exactly after a
 * reload (`computerTurn.ts`).
 *
 * On an empty table it lays the longest word its hand spells, across. After
 * that, each word crosses a tile already down, laid by the generator's own
 * rule (`crossingFit`): nothing at either end and nothing at a new tile's
 * sides, so a sound grid stays sound, and every laying is judged once more
 * (`judgeGrid`) before it is kept. At a table set up with Diagonals it lays
 * only where every diagonal run of three or more stays a word, and judges
 * by that rule too, so it never leaves an unsound diagonal either. It never moves a tile it has laid, which is
 * what a good player does and it does not: that, and not looking for words
 * that run beside others, is what keeps it beatable.
 *
 * WILDS are played, never left: a word short of a letter or two the hand
 * lacks uses a wild for each, given that letter as it is laid — but a word
 * that needs none is always preferred to one as long that does.
 */

/** A tile's letter as the word list spells it (`a`, or a kana's base code), whatever wild it is on; "" for a wild with none. */
function plainOf(tile: string, words: TileWords): string {
  const sound = words.soundOf(tile);
  return sound === null ? "" : (words.codeOf(sound) ?? "");
}

/** Whether a grid is sound, read against the loaded word list by the game's rules: the same judgement the desk shows. */
export function judgeTiles(tiles: Tiles, words: TileWords, rules: GridRules = {}): GridVerdict {
  return judgeWithWords(tiles, words, rules);
}

/** A hand as letters: how many of each, and how many wilds. */
type HandCount = { letters: Map<string, number>; wilds: number };

function countHand(hand: readonly string[], words: TileWords): HandCount {
  const letters = new Map<string, number>();
  let wilds = 0;
  for (const tile of hand) {
    if (words.isWild(tile)) wilds += 1;
    else letters.set(plainOf(tile, words), (letters.get(plainOf(tile, words)) ?? 0) + 1);
  }
  return { letters, wilds };
}

/** How many letters of `word` the hand lacks, stopping once past `most`. */
function lacking(word: string, hand: HandCount, most: number): number {
  const used = new Map<string, number>();
  let short = 0;
  for (const letter of word) {
    const count = (used.get(letter) ?? 0) + 1;
    used.set(letter, count);
    if (count > (hand.letters.get(letter) ?? 0)) {
      short += 1;
      if (short > most) return short;
    }
  }
  return short;
}

/** How many tiles already down one word may run through: two lets it bridge a gap, as players do. */
const CROSSED_MOST = 2;

/** How many placements are tried in one search at most, so a turn's thinking stays a fraction of a second on a phone. */
const FITS_MOST = 20_000;

/** A laying found: the word, where its new tiles go with their letters, and its worth. */
type Laying = { word: string; fresh: { square: string; letter: string }[]; wilds: number; score: number };

/** A laying's worth: tiles used first, rare letters next, wilds spent last. */
function worth(fresh: readonly { letter: string }[], wilds: number, words: TileWords): number {
  let rare = 0;
  for (const { letter } of fresh) rare += 1 / Math.max(1, words.mix.get(letter) ?? 1);
  return fresh.length * 10 + rare * 2 - wilds * 4;
}

/** The letters new tiles need, covered by the hand: how many wilds that takes, or null where even the wilds cannot cover it. */
function wildsNeeded(fresh: readonly { letter: string }[], hand: HandCount): number | null {
  const used = new Map<string, number>();
  let wilds = 0;
  for (const { letter } of fresh) {
    const count = (used.get(letter) ?? 0) + 1;
    used.set(letter, count);
    if (count > (hand.letters.get(letter) ?? 0)) wilds += 1;
  }
  return wilds > hand.wilds ? null : wilds;
}

/** Every laying of the hand on this table, best first; an empty table takes one word across from its first square. */
function layings(play: TilePlay, words: TileWords, rules: GridRules): Laying[] {
  const hand = countHand(play.hand, words);
  const empty = play.tiles.size === 0;
  const letterAt = (row: number, col: number) => {
    const tile = play.tiles.get(squareAt(row, col));
    return tile === undefined ? "" : plainOf(tile, words) || "?";
  };
  // With Diagonals, a laying must leave every diagonal run of three or more a word (`crossingFit`).
  const diagonalWord =
    rules.diagonals === true
      ? (run: string) => {
          const read = words.wordOf(run);
          return read !== null && words.allowed.has(read);
        }
      : null;
  const anchors = new Map<string, Square[]>();
  for (const square of [...play.tiles.keys()].sort()) {
    const letter = letterAt(placeOf(square).row, placeOf(square).col);
    anchors.set(letter, [...(anchors.get(letter) ?? []), placeOf(square)]);
  }
  const bounds = boundsOf(play.tiles);
  const fits = (first: Square, last: Square) =>
    bounds === null ||
    (Math.max(bounds.bottom, last.row) - Math.min(bounds.top, first.row) < KUMIMOJI_GRID_MOST && Math.max(bounds.right, last.col) - Math.min(bounds.left, first.col) < KUMIMOJI_GRID_MOST);

  const found: Laying[] = [];
  let tried = 0;
  let mostFresh = 0;
  const keep = (laying: Laying) => {
    found.push(laying);
    mostFresh = Math.max(mostFresh, laying.fresh.length);
  };
  const crossed = empty ? 0 : CROSSED_MOST;
  const longest = Math.min(play.hand.length + crossed, Math.max(...words.byLength.keys()));
  for (let length = longest; length >= 2 && tried < FITS_MOST; length -= 1) {
    // Nothing shorter can use more tiles than the best already found: a word crossing one tile lays one fewer than its length.
    if ((empty ? length : length - 1) < mostFresh) break;
    for (const word of words.byLength.get(length) ?? []) {
      if (lacking(word, hand, hand.wilds + crossed) > hand.wilds + crossed) continue;
      if (empty) {
        const fresh = [...word].map((letter, col) => ({ square: squareAt(0, col), letter }));
        const wilds = wildsNeeded(fresh, hand);
        if (wilds !== null) keep({ word, fresh, wilds, score: worth(fresh, wilds, words) });
        continue;
      }
      for (let at = 0; at < word.length && tried < FITS_MOST; at += 1) {
        for (const anchor of anchors.get(word[at]!) ?? []) {
          for (const across of [true, false]) {
            tried += 1;
            const fit = crossingFit(letterAt, () => true, word, anchor, at, across, diagonalWord);
            if (fit === null) continue;
            const step = across ? { row: 0, col: 1 } : { row: 1, col: 0 };
            if (!fits(fit.first, { row: fit.first.row + (length - 1) * step.row, col: fit.first.col + (length - 1) * step.col })) continue;
            const fresh = fit.fresh.map((square) => ({ square: squareAt(square.row, square.col), letter: word[(square.row - fit.first.row) + (square.col - fit.first.col)]! }));
            const wilds = wildsNeeded(fresh, hand);
            if (wilds !== null) keep({ word, fresh, wilds, score: worth(fresh, wilds, words) });
          }
        }
      }
    }
  }
  // A stable sort: equal worth keeps the list's own order, so the choice never depends on anything but the hand and the table.
  return found.sort((a, b) => b.score - a.score);
}

/** A laying made with the solo game's own moves: a tile of that letter from the hand, or a wild given it. */
function lay(play: TilePlay, laying: Laying, words: TileWords): TilePlay | null {
  let now = play;
  for (const { square, letter } of laying.fresh) {
    let at = now.hand.findIndex((tile) => !words.isWild(tile) && plainOf(tile, words) === letter);
    if (at === -1) {
      at = now.hand.findIndex((tile) => words.isWild(tile));
      const sound = words.soundOf(letter);
      const wild = sound === null ? null : words.wildFor(sound);
      if (at === -1 || wild === null) return null;
      now = assignHandTile(now, at, wild);
    }
    now = placeFromHand(now, at, square);
  }
  return now;
}

/** How many of the best layings are judged before giving up on a hand: each is sound by construction, so the first nearly always is. */
const JUDGED_MOST = 12;

/**
 * THE COMPUTER'S NEXT WORD: its play after laying the best word its hand can
 * lay on its table, and the word, or null when there is none. The grid after
 * it is judged against the list, by the game's rules (`rules`), and is
 * always sound.
 */
export function bestLaying(play: TilePlay, words: TileWords, rules: GridRules = {}): { play: TilePlay; word: string } | null {
  if (play.hand.length === 0) return null;
  if (play.tiles.size > 0 && !judgeTiles(play.tiles, words, rules).sound) return null;
  for (const laying of layings(play, words, rules).slice(0, JUDGED_MOST)) {
    const next = lay(play, laying, words);
    if (next !== null && judgeTiles(next.tiles, words, rules).sound) return { play: next, word: laying.word };
  }
  return null;
}

/** The tile a computer trades: its rarest letter in the set, the first of those in its hand; never a wild. Null for a hand of wilds. */
export function tradeChoice(hand: readonly string[], words: TileWords): number | null {
  let chosen: number | null = null;
  let fewest = Infinity;
  hand.forEach((tile, at) => {
    if (words.isWild(tile)) return;
    const count = words.mix.get(plainOf(tile, words)) ?? 0;
    if (count < fewest) {
      fewest = count;
      chosen = at;
    }
  });
  return chosen;
}
