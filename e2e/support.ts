/** Where the signed-in cookies from `auth.setup.ts` are kept. */
export const ADMIN_STATE = ".auth/admin.json";
export const PLAYER_STATE = ".auth/player.json";
/** An embed token minted by the setup, for the embed specs to use. */
export const EMBED_TOKEN_FILE = ".auth/embed.json";

import { expect, type Page } from "@playwright/test";

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
  await openSetup(page);
  const summary = page.getByText(/^Advanced/);
  // The details that holds the Advanced summary, not whichever details comes first on the page.
  // The innermost details holding the summary: the set-up wraps it, and is not it.
  const details = page.locator("details", { has: summary }).last();
  if (!(await details.evaluate((node: HTMLDetailsElement) => node.open))) {
    await summary.click();
  }
}

/**
 * Opens the play page's set-up, which folds away once a stone is down. The
 * settings and appearance controls live inside it, so a test that changes
 * them mid-game reveals it first, the way a player would.
 */
export async function openSetup(page: Page) {
  const setup = page.getByTestId("game-setup");
  if ((await setup.count()) === 0) return;
  const open = await setup.evaluate((element) => (element as HTMLDetailsElement).open);
  // The panel's own summary, not any summary inside it: the settings grew an
  // Advanced section of their own, which is a second <details> under this one.
  if (!open) await setup.locator("> summary").click();
}

/**
 * Opens the games page and waits until its sentence is listening.
 *
 * The sentence is server-rendered, so its selects are real controls before
 * React has attached anything to them — and a choice made in that window is
 * dropped: the state never hears it, and the next render puts the select
 * back. A person cannot lose that race. A test that opens the page and
 * chooses in the same breath loses it whenever the page is a little slow, and
 * then fails somewhere else entirely — "started on 9×9 when I chose 19×19",
 * which reads as a bug in the board and is a bug in the clock. Three specs
 * chased that before the page grew somewhere to say it was ready.
 */
export async function openGamesPage(page: Page) {
  await page.goto("/games");
  await expect(page.getByTestId("start-game")).toHaveAttribute("data-ready", "true");
}
