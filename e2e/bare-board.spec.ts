import { expect, test } from "@playwright/test";
import { freshPuzzleSeed, playSequence, ready, winningSequence } from "./support";

/**
 * Reading a page as the board alone.
 *
 * The switch is only worth anything if it survives the next visit, so the
 * test that matters is the reload: turn it on, come back, and the furniture
 * is still gone — and gone from the first paint rather than flickering away
 * after the page has settled.
 */
test.describe("just the board", () => {
  // The board is a facet of the game, not the game: /games/<slug> is the front
  // door and is a standard-width page, so the switch is not offered there.
  const board = "/games/gomoku/play";

  test("strips the page back, and brings it back again", async ({ page }) => {
    await page.goto(board);
    const header = page.locator("[data-chrome]").first();
    await expect(header).toBeVisible();

    // The switch is server-rendered in the masthead, so it is a real button
    // before React attaches — and a press then strips nothing.
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    // Hidden, not removed: the stylesheet takes them off the page rather than
    // the components declining to render, so count them as seen or not seen.
    await expect(header).toBeHidden();
    for (const aside of await page.locator("aside:not([data-bare-keep])").all()) await expect(aside).toBeHidden();
    // The practice board's side column keeps what plays the board — whose turn it is — and loses its furniture.
    await expect(page.getByTestId("to-play")).toBeVisible();
    await expect(page.getByTestId("practice-mark")).toBeHidden();

    // The switch is the one thing that stays: a mode you cannot leave is a trap.
    const toggle = page.getByTestId("bare-board-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.click();
    await expect(page.locator("[data-chrome]").first()).toBeVisible();
  });

  test("is still bare on the next visit, without the page flashing first", async ({ page }) => {
    await page.goto(board);
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    await page.reload();
    // Set by the script in the body before anything is drawn, so this is true
    // of the first paint and not only of the settled page.
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    // And it follows the reader to another board, not just the one it was set on.
    await page.goto("/games/renju/play");
    await expect(page.locator("[data-chrome]").first()).toBeHidden();

    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
  });

  /*
   * A game being played: what stays is what it takes to play. John, on a live
   * board: "we don't need Icons and Comments etc when it's just the board...
   * the board should be centered and almost all you see."
   */
  test("on a live game, leaves the board, centred, whose turn it is, and nothing else", async ({ page, request }) => {
    const made = await request.post("/api/games/live", { data: { size: 9 } });
    expect(made.status(), await made.text()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string };
    const played = await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    expect(played.status(), await played.text()).toBe(201);

    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await ready(page, "shared-game");
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");

    // Gone: the moves, the picture, the waves and the resigning.
    await expect(page.getByTestId("live-moves")).toBeHidden();
    await expect(page.getByTestId("open-mosaic")).toBeHidden();
    await expect(page.getByTestId("resign")).toBeHidden();
    // Still there: whose turn it is, and the board, in the middle of the screen and all of it in view.
    await expect(page.getByTestId("turn-banner")).toBeVisible();
    const board = await page.locator("[data-bare-board]").boundingBox();
    const view = page.viewportSize()!;
    expect(Math.abs(board!.x + board!.width / 2 - view.width / 2)).toBeLessThan(24);
    expect(board!.y + board!.height).toBeLessThanOrEqual(view.height);

    await page.getByTestId("bare-board-toggle").click();
    await expect(page.getByTestId("live-moves")).toBeVisible();
  });

  /*
   * A finished game, read as just the board, is a modal: the board, the
   * one-line scrubber under it, a Close, and Esc. John, on a finished game:
   * "a board that is still very busy… We don't need the header and applause
   * and chat probably. Maybe a nice simple scrubber with controls at the
   * bottom in this modal mode. and ESC key should take us out."
   */
  test("on a finished game, is a modal of the board and a scrubber, and Esc leaves it", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku/play");
    await playSequence(page, 15, winningSequence());
    // Stored once the address names the final position — see history.spec.ts.
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[^/]+\/9$/, { timeout: 30_000 });
    const filed = page.url().replace(/\/9$/, "");

    await page.goto(filed);
    await ready(page, "game-replay");
    await ready(page, "bare-board");
    await expect(page.getByTestId("applause")).toBeVisible();
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");

    // A modal: the column is a dialog over the page, and the page's own furniture is gone.
    const panel = page.locator("main[data-strippable]");
    await expect(panel).toHaveAttribute("role", "dialog");
    // A small header says what this is and where it was played.
    await expect(page.getByTestId("board-masthead-source")).toContainText("Played on Itsutsu");
    await expect(page.getByTestId("applause")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeHidden();
    await expect(page.getByTestId("replay-scrubber")).toBeHidden();
    // The scrubber under the board, on one line, moving the board.
    const scrubber = page.getByTestId("bare-replay-scrubber");
    await expect(scrubber).toBeVisible();
    await expect(page.getByRole("button", { name: "H8, Black stone" })).toBeVisible();
    await page.getByTestId("bare-replay-start").click();
    await expect(page.getByRole("button", { name: /^H8, empty$/ })).toBeVisible();
    await page.getByTestId("bare-replay-forward").click();
    await expect(page.getByRole("button", { name: "D8, Black stone" })).toBeVisible();
    const tops = await Promise.all(
      ["start", "back", "play", "forward", "end"].map(async (b) => (await page.getByTestId(`bare-replay-${b}`).boundingBox())!.y),
    );
    expect(new Set(tops).size, "the scrubber's buttons wrapped to a second line").toBe(1);

    // The win was said over the practice board as it was played (`WinCover`), so the filed game opens on no result card.
    await expect(page.getByTestId("result-card")).toHaveCount(0);
    // Esc takes the modal away, and the page is back as it was.
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
    await expect(panel).not.toHaveAttribute("role", "dialog");
    await expect(page.getByTestId("applause")).toBeVisible();
    await expect(page.getByTestId("bare-replay-scrubber")).toBeHidden();
  });

  /*
   * One line, always. John: "Scrubber should always be only 1 line. meaning we
   * might use < and > arrows just for the back and forward, keeping Play as
   * text." It wrapped in a finished game's side column; measured at a desk's
   * width, where the column is narrowest, and at a phone's.
   */
  for (const width of [1280, 390]) {
    test(`a finished game's scrubber buttons sit on one line at ${width} wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/games/gomoku/play");
      await page.evaluate(() => window.localStorage.clear());
      await page.goto("/games/gomoku/play");
      await playSequence(page, 15, winningSequence());
      await expect(page).toHaveURL(/\/games\/gomoku\/match\/[^/]+\/9$/, { timeout: 30_000 });
      await page.goto(page.url().replace(/\/9$/, ""));
      await ready(page, "game-replay");
      const tops = await Promise.all(
        ["start", "back", "play", "forward", "end"].map(async (b) => (await page.getByTestId(`replay-${b}`).boundingBox())!.y),
      );
      expect(new Set(tops).size, "the scrubber's buttons wrapped to a second line").toBe(1);
      // Play is a word; the four that step are arrows, and still named for a reader who cannot see them.
      await expect(page.getByTestId("replay-play")).toHaveText("Play");
      await expect(page.getByRole("button", { name: "Back" })).toHaveText("‹");
    });
  }

  test("is not offered on a page with nothing to strip", async ({ page }) => {
    // The wide pages are the ones with a board or a table and a sidebar.
    // About is read top to bottom; there is no furniture to take off it.
    await page.goto("/about");
    await expect(page.getByTestId("bare-board")).toHaveCount(0);
  });

  /*
   * The trap this design could have set, and the reason the effect is scoped
   * to the pages that offer the switch. The setting is remembered for the
   * whole browser; if it also took the masthead off pages with no switch on
   * them, a reader would be left on a page with no navigation and no way to
   * ask for it back.
   */
  test("leaves a page it does not offer itself on completely alone", async ({ page }) => {
    await page.goto(board);
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");

    await page.goto("/about");
    // Still on, and still doing nothing here: the masthead is where it was.
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    await expect(page.locator("[data-chrome]").first()).toBeVisible();
  });
});

/*
 * EVERY GAME OFFERS JUST THE BOARD. John, 2026-09-28: "we also have the
 * standing rule that all games should offer the standalone modal option/mode
 * where it's in a modal with just bare minimum stuff (like scrubber) and a few
 * buttons." Opened from the switch beside the board's size, on a phone and on
 * a laptop, with what plays each board still there, and left both ways: Close
 * and Esc.
 */
const PLAYS = [
  {
    name: "a Number Place",
    open: async (page: import("@playwright/test").Page) => {
      await page.goto(`/games/number-place/play?size=9&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    // The keys a number is written with, and the scrubber through the steps.
    stays: ["puzzle-keys", "puzzle-grid"],
  },
  {
    name: "Kumimoji",
    open: async (page: import("@playwright/test").Page) => {
      await page.goto(`/games/kumimoji/play?seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    // The table and the hand its tiles are laid from.
    stays: ["kumimoji-table", "kumimoji-tray"],
  },
  {
    name: "a Dots and Boxes table",
    open: async (page: import("@playwright/test").Page) => {
      await page.goto("/games/dots-and-boxes/pass-and-play");
      await ready(page, "dots-set-up");
      await page.getByTestId("dots-start").click();
      await ready(page, "dots-game");
    },
    // Whose turn it is, and the board; who is at the table is side matter.
    stays: ["dots-turn", "dots-board"],
  },
  {
    name: "Superghost",
    open: async (page: import("@playwright/test").Page) => {
      await page.goto("/games/superghost/pass-and-play");
      await ready(page, "ghost-set-up");
      await page.getByTestId("ghost-start").click();
      await ready(page, "ghost-game");
    },
    // Whose turn and the word being spelt, and the keys it is spelt with; a word game has no board to size.
    stays: ["ghost-stage", "ghost-turn-keys"],
  },
];

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test.describe(`just the board on every play, ${viewport.width} wide`, () => {
    test.use({ viewport });
    for (const play of PLAYS) {
      test(`${play.name}: opened beside the board's size, keeps what plays it, and leaves by Close and by Esc`, async ({ page }) => {
        await play.open(page);
        await ready(page, "board-scaling");
        await ready(page, "bare-board");
        // One switch, in the row with the board's size, not a second at the page's foot.
        await expect(page.getByTestId("bare-board-toggle")).toHaveCount(1);
        await expect(page.getByTestId("board-scaling").getByTestId("bare-board-toggle")).toBeVisible();

        await page.getByTestId("bare-board-toggle").click();
        await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
        await expect(page.locator("header[data-chrome]").first()).toBeHidden();
        for (const id of play.stays) await expect(page.getByTestId(id).first(), `${id} went with the furniture`).toBeVisible();
        await expect(page.getByTestId("board-scale"), "the board's size is offered inside just the board").toBeHidden();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, "just the board scrolls sideways").toBeLessThanOrEqual(0);

        // Close, at the top right.
        const close = page.getByTestId("bare-board-toggle");
        await expect(close).toHaveAttribute("aria-pressed", "true");
        await close.click();
        await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
        await expect(page.locator("header[data-chrome]").first()).toBeVisible();

        // And Esc.
        await page.getByTestId("bare-board-toggle").click();
        await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
        await page.keyboard.press("Escape");
        await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
        for (const id of play.stays) await expect(page.getByTestId(id).first()).toBeVisible();
      });
    }
  });
}
