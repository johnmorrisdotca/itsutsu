/**
 * WHERE A WORD CAN CROSS A CROSSWORD WITHOUT SPOILING IT: the one rule the
 * generator lays its bags by (`generate.ts`) and the computer player lays its
 * own table by (`computerPlay.ts`), written once.
 *
 * A word laid across or down through a tile already down, with nothing at
 * either end of it and no new tile touching anything at its sides, makes one
 * new run — the word itself — and leaves every other run as it was. So on a
 * grid that was sound, the grid after it is sound too: that is what lets the
 * generator promise every bag can be finished, and what keeps the computer
 * from ever leaving a misspelt table.
 *
 * Pure, and blind to what the squares are kept in: the caller answers what
 * letter stands at a square (`""` for none) and whether a square may be used
 * at all, so the generator's fixed laying square and the computer's table
 * with no edges ask the same question.
 */
export type Square = { row: number; col: number };

/** A word's place: its first square, and the squares it lays a new tile on, in the word's order. */
export type CrossingFit = { first: Square; fresh: Square[] };

/**
 * Where `word` stands with its letter `at` on the tile at `anchor`, running
 * across or down, or null where it cannot: a square outside what may be used,
 * a tile at either end, a different letter in its way, a new tile with a
 * neighbour at its side, or no new tile at all.
 */
export function crossingFit(
  letterAt: (row: number, col: number) => string,
  inside: (row: number, col: number) => boolean,
  word: string,
  anchor: Square,
  at: number,
  across: boolean,
): CrossingFit | null {
  const dr = across ? 0 : 1;
  const dc = across ? 1 : 0;
  const row = anchor.row - at * dr;
  const col = anchor.col - at * dc;
  const length = word.length;
  if (!inside(row, col) || !inside(row + (length - 1) * dr, col + (length - 1) * dc)) return null;
  const taken = (r: number, c: number) => inside(r, c) && letterAt(r, c) !== "";
  if (taken(row - dr, col - dc) || taken(row + length * dr, col + length * dc)) return null;
  const fresh: Square[] = [];
  for (let k = 0; k < length; k += 1) {
    const r = row + k * dr;
    const c = col + k * dc;
    const there = letterAt(r, c);
    if (there !== "") {
      if (there !== word[k]) return null;
      continue;
    }
    // Its sides: above and below a word across, left and right of one down.
    if (taken(r - dc, c - dr) || taken(r + dc, c + dr)) return null;
    fresh.push({ row: r, col: c });
  }
  if (fresh.length === 0) return null;
  return { first: { row, col }, fresh };
}
