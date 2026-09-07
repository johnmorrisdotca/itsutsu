import type { Page } from "@playwright/test";

/** Column letters as the board labels them, with "I" skipped as in go. */
const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

/**
 * Clicks an intersection by its board coordinates.
 *
 * Tests address the board the way a player reads it — "H8" — rather than by
 * grid index, so a spec still says what it means if the DOM changes.
 */
export async function playAt(page: Page, size: number, row: number, col: number) {
  const name = `${COLUMN_LETTERS[col]}${size - row}`;
  await page.getByRole("button", { name: new RegExp(`^${name}, empty$`) }).click();
}

/** Plays a run of stones for one colour, interleaving the opponent elsewhere. */
export async function playSequence(
  page: Page,
  size: number,
  moves: [number, number][],
) {
  for (const [row, col] of moves) {
    await playAt(page, size, row, col);
  }
}

/** A game where black makes five along row 7 while white answers on row 0. */
export function winningSequence(): [number, number][] {
  const moves: [number, number][] = [];
  for (let i = 0; i < 5; i += 1) {
    moves.push([7, 3 + i]);
    if (i < 4) moves.push([0, i]);
  }
  return moves;
}

/**
 * Opens the Advanced settings block. The awareness, hint and rule toggles live
 * behind a `<details>`, so a spec has to open it before it can reach them.
 */
export async function openAdvanced(page: Page) {
  const summary = page.getByText(/^Advanced/);
  const details = page.locator("details");
  if (!(await details.first().evaluate((node: HTMLDetailsElement) => node.open))) {
    await summary.click();
  }
}
