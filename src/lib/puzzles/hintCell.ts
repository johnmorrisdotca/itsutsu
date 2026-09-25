/**
 * WHERE A HINT GOES: the cell a person could most nearly work out for
 * themselves. John, 2026-09-25: Hint is a real hint now — a correct cell — and
 * Show is what marks the wrong ones.
 *
 * Of the cells not yet right (empty, or holding the wrong thing), the one with
 * the most right cells already in its row and its column: the tightest place on
 * the grid, where the hint gives away least that the solver was not about to
 * see. Ties go to the first, reading across, so the same grid always gets the
 * same hint. Null when every cell is right, which a finished grid is.
 *
 * `fixed` says which cells were printed and so are never hinted. Pure and in the
 * browser, like everything else that thinks about a puzzle.
 */
export function cellHint(size: number, fixed: (index: number) => boolean, current: readonly number[], answer: readonly number[]): number | null {
  const right = (index: number) => current[index] === answer[index];
  let best: number | null = null;
  let bestPeers = -1;
  for (let index = 0; index < size * size; index += 1) {
    if (fixed(index) || right(index)) continue;
    const row = Math.floor(index / size);
    const col = index % size;
    let peers = 0;
    for (let k = 0; k < size; k += 1) {
      if (k !== col && right(row * size + k)) peers += 1;
      if (k !== row && right(k * size + col)) peers += 1;
    }
    if (peers > bestPeers) {
      best = index;
      bestPeers = peers;
    }
  }
  return best;
}

/**
 * Hidden Stones' hint: a row whose stone is not yet where the answer has it,
 * the one with the most crosses already ruled out in it — the row a person is
 * closest to — or the first such row. Null when every row's stone is right.
 * `stones` is each row's stone column, or -1 for none or more than one.
 */
export function rowHint(size: number, stones: readonly number[], answer: readonly number[], crossesIn: (row: number) => number): number | null {
  let best: number | null = null;
  let bestCrosses = -1;
  for (let row = 0; row < size; row += 1) {
    if (stones[row] === answer[row]) continue;
    const crosses = crossesIn(row);
    if (crosses > bestCrosses) {
      best = row;
      bestCrosses = crosses;
    }
  }
  return best;
}
