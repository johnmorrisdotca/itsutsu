import { decodeGrid, encodeGrid, lettersOf, sameLetters, type GridVerdict, type Tiles } from "./grid";
import { KUMIMOJI_DRAW, KUMIMOJI_TRADE } from "./tiles.constants";

/**
 * A KUMIMOJI BEING PLAYED: the bag, the tiles traded back into it, how many
 * have been taken out, the tiles on the table and the hand. Every move is a
 * function that returns a new state and leaves the one it was given alone,
 * the way the engine's moves are. Nothing here knows how the table is being
 * looked at — zoom and pan are the view's (`tableView.ts`), never the game's.
 *
 * THE BAG IS A LINE, not a heap. Its tiles come out in the order the seed dealt
 * them (`givens`), and a tile traded back joins the END of the line, so the
 * tiles still to come are always `bag + returned` from `taken` on. That keeps
 * a game the same for everybody at a seed, trades and all, and lets a kept
 * game be checked: what is held — hand and table — is exactly what was taken,
 * less what was given back.
 */
export type TilePlay = {
  /** The tiles in the order they come out: the puzzle's givens. */
  bag: string;
  /** Tiles traded back, in order; they come out after the bag. */
  returned: string;
  /** How many tiles have been taken from `bag + returned`. */
  taken: number;
  /** The tiles on the table, by square ("row,col"). */
  tiles: Tiles;
  /** The hand, in the order the player keeps it. */
  hand: readonly string[];
};

/** The opening hand: the first `handSize` tiles of the bag, and an empty table. */
export function deal(bag: string, handSize: number): TilePlay {
  const taken = Math.min(handSize, bag.length);
  return { bag, returned: "", taken, tiles: new Map(), hand: [...bag.slice(0, taken)] };
}

/** How many tiles are still in the bag. */
export function tilesLeft(play: TilePlay): number {
  return play.bag.length + play.returned.length - play.taken;
}

function withTiles(play: TilePlay, change: (tiles: Map<string, string>) => void): Map<string, string> {
  const tiles = new Map(play.tiles);
  change(tiles);
  return tiles;
}

/** A tile from the hand onto an empty square. */
export function placeFromHand(play: TilePlay, handAt: number, square: string): TilePlay {
  const letter = play.hand[handAt];
  if (letter === undefined || play.tiles.has(square)) return play;
  return { ...play, tiles: withTiles(play, (tiles) => tiles.set(square, letter)), hand: play.hand.filter((_, at) => at !== handAt) };
}

/** A tile on the table to another square: to an empty one it moves, onto a tile the two change places. */
export function moveOnTable(play: TilePlay, from: string, to: string): TilePlay {
  const moving = play.tiles.get(from);
  if (from === to || moving === undefined) return play;
  const there = play.tiles.get(to);
  return {
    ...play,
    tiles: withTiles(play, (tiles) => {
      tiles.delete(from);
      if (there !== undefined) tiles.set(from, there);
      tiles.set(to, moving);
    }),
  };
}

/** A tile from the hand onto a square that holds one: they change places, the table's tile going to the hand where the other was. */
export function swapWithHand(play: TilePlay, handAt: number, square: string): TilePlay {
  const letter = play.hand[handAt];
  const lifted = play.tiles.get(square);
  if (letter === undefined || lifted === undefined) return play;
  const hand = [...play.hand];
  hand[handAt] = lifted;
  return { ...play, tiles: withTiles(play, (tiles) => tiles.set(square, letter)), hand };
}

/** A tile on the table back to the end of the hand. */
export function liftToHand(play: TilePlay, square: string): TilePlay {
  const letter = play.tiles.get(square);
  if (letter === undefined) return play;
  return { ...play, tiles: withTiles(play, (tiles) => tiles.delete(square)), hand: [...play.hand, letter] };
}

/** Every tile on the table back to the hand. */
export function liftAll(play: TilePlay): TilePlay {
  return { ...play, tiles: new Map(), hand: [...play.hand, ...play.tiles.values()] };
}

/** Whether Draw may be pressed: the hand used, the grid sound, and a tile left to draw. */
export function mayDraw(play: TilePlay, verdict: GridVerdict): boolean {
  return play.hand.length === 0 && verdict.sound && tilesLeft(play) > 0;
}

/** The next tile or tiles out of the bag into the hand. */
export function draw(play: TilePlay, count: number = KUMIMOJI_DRAW): TilePlay {
  const coming = (play.bag + play.returned).slice(play.taken, play.taken + count);
  if (coming.length === 0) return play;
  return { ...play, taken: play.taken + coming.length, hand: [...play.hand, ...coming] };
}

/** Whether a trade may be made: the bag holds as many as a trade takes. */
export function mayTrade(play: TilePlay): boolean {
  return tilesLeft(play) >= KUMIMOJI_TRADE.take;
}

/** One tile from the hand to the bottom of the bag, and the next three out of it. */
export function trade(play: TilePlay, handAt: number): TilePlay {
  const letter = play.hand[handAt];
  if (letter === undefined || !mayTrade(play)) return play;
  const returned = play.returned + letter;
  const coming = (play.bag + returned).slice(play.taken, play.taken + KUMIMOJI_TRADE.take);
  return { ...play, returned, taken: play.taken + coming.length, hand: [...play.hand.filter((_, at) => at !== handAt), ...coming] };
}

/** Whether the game is over: the bag empty, the hand used, and the grid sound. */
export function isFinished(play: TilePlay, verdict: GridVerdict): boolean {
  return play.hand.length === 0 && tilesLeft(play) === 0 && verdict.sound;
}

/*
 * A GAME KEPT half way, as one string (`PuzzleRun.progress`): how many tiles
 * were taken, the tiles traded back, the hand in its order and the grid
 * (`encodeGrid`), as `12:q:ae:cat/2o/2w`. The bag is the puzzle's own, from
 * its seed, so it is not written again, and where on the table the grid stood
 * is the view's and not kept.
 */
export function encodeTileProgress(play: TilePlay): string {
  return `${play.taken}:${play.returned}:${play.hand.join("")}:${encodeGrid(play.tiles)}`;
}

/** The parts of a kept game, or null for a string that is not one: its shape only, with no bag to check it against. */
export function readTileProgress(code: string): { taken: number; returned: string; hand: string[]; tiles: Map<string, string> } | null {
  const parts = code.split(":");
  if (parts.length !== 4) return null;
  const [takenText, returned, hand, grid] = parts as [string, string, string, string];
  if (!/^\d{1,3}$/.test(takenText) || !/^[a-z]*$/.test(returned) || !/^[a-z]*$/.test(hand)) return null;
  const tiles = decodeGrid(grid);
  if (tiles === null) return null;
  return { taken: Number(takenText), returned, hand: [...hand], tiles };
}

/**
 * A kept game opened again on its own bag, or null where it does not belong
 * to it: every tile held — hand and table — must be one taken from the bag
 * and not given back. Null opens the game fresh rather than on a grid that
 * never came out of this bag.
 */
export function decodeTileProgress(code: string, bag: string): TilePlay | null {
  const read = readTileProgress(code);
  if (read === null) return null;
  const line = bag + read.returned;
  if (read.taken > line.length) return null;
  const held = lettersOf(line.slice(0, read.taken));
  for (const letter of read.returned) held.set(letter, (held.get(letter) ?? 0) - 1);
  for (const [letter, count] of held) if (count === 0) held.delete(letter);
  if (!sameLetters(held, lettersOf([...read.hand, ...read.tiles.values()]))) return null;
  return { bag, returned: read.returned, taken: read.taken, tiles: read.tiles, hand: read.hand };
}
