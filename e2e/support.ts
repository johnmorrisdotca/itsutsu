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
  /*
   * Waited for, not counted.
   *
   * The panel is rendered in the browser, so a spec that arrives and counts
   * finds nothing — and this used to READ that as "this page has no set-up"
   * and return quietly. It was harmless while the panel stood open of its own
   * accord: losing the race cost nothing, because there was nothing to open.
   * Folded, losing the race leaves every control in the DOM and invisible,
   * and the spec fails several lines later on a select it cannot see.
   *
   * A page genuinely without a set-up is still allowed, which is what the
   * catch is for; it just has to be told apart from a page that has not
   * finished arriving.
   */
  try {
    await setup.waitFor({ state: "attached", timeout: 5_000 });
  } catch {
    return;
  }
  const open = await setup.evaluate((element) => (element as HTMLDetailsElement).open);
  // The panel's own summary, not any summary inside it: the settings grew an
  // Advanced section of their own, which is a second <details> under this one.
  if (!open) await setup.locator("> summary").click();
  /*
   * And say so if it did not open. This used to be a no-op — the panel stood
   * open until somebody moved, so the click never ran and never had to work.
   * Folded from the start, a click that misses leaves every control in the
   * DOM and invisible, and the spec fails several lines later complaining
   * about a select, which is a long way from where the trouble is.
   */
  await expect(setup, "the set-up panel would not open").toHaveJSProperty("open", true);
}

/**
 * Opens the lobby.
 *
 * It waits for nothing, because there is nothing on it to wait for any more:
 * the one-line sentence with the selects in it has gone, and what stands in
 * its place is a link, which works before any script does.
 *
 * The RACE has not gone, it has moved — to the screen that settles a game.
 * See `openSetUpPage`, which is where that comment now lives, because that is
 * where the controls now live.
 */
export async function openGamesPage(page: Page) {
  await page.goto("/games");
}

/**
 * Opens the screen that settles a game and waits until it is listening.
 *
 * Its selects are server-rendered, so they are real controls before React has
 * attached anything to them — and a choice made in that window is dropped: the
 * state never hears it, and the next render puts the select back. A person
 * cannot lose that race. A test that opens the page and chooses in the same
 * breath loses it whenever the page is a little slow, and then fails somewhere
 * else entirely — "started on 9×9 when I chose 19×19", which reads as a bug in
 * the board and is a bug in the clock. Three specs chased that before the page
 * grew somewhere to say it was ready; do not let the fourth be this one.
 *
 * `slug` names a game where the address already does; leave it out for the
 * screen where the game is still to be chosen.
 */
export async function openSetUpPage(page: Page, slug?: string) {
  await page.goto(slug === undefined ? "/games/new" : `/games/${slug}/new`);
  await ready(page, "set-up-game");
}

/**
 * The page holding the games somebody has going.
 *
 * Its own page now, split out of the lobby: /games starts a game, /play
 * lists the ones you are playing. A spec that wants a queue wants this one.
 */
export async function openMyGamesPage(page: Page) {
  await page.goto("/play");
}

/**
 * Waits for one server-rendered panel to say the browser has taken it over.
 * See `useHydrated` for what the mark means and why a panel needs one.
 */
export async function ready(page: Page, testId: string) {
  await expect(page.getByTestId(testId)).toHaveAttribute("data-ready", "true");
}
