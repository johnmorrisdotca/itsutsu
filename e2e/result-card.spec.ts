import { join } from "node:path";

import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";

import { slugFor } from "../src/lib/gomoku/slugs";
import { memberContext, removeMember, seatTokensFor, seedMember } from "./members";
import { playAt, ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * WHEN A GAME ENDS, A CARD OVER THE BOARD SAYS WHO WON AND WHY.
 *
 * John, with a finished Mini Reversi board in front of him and nothing on it
 * saying who had won: "actually an overlay or banner or modal over the game might
 * be nice... where they just click OK or some game play options like rematch
 * right there... and they can just close it to enjoy the win screen to screenshot
 * it without the indicator."
 *
 * Tic-tac-toe, because it ends in five stones: black takes the top row. Every
 * stone is clicked by the player whose move it is, and each waits for the move to
 * land on the other board, so the game really does end in front of both of them.
 * Every card is waited for after the record's own hydration mark, and every
 * absence is asserted after something present on the same page.
 *
 * IT BRINGS ITS OWN WORLD: members, names and games made here, taken away after.
 */

const VARIANT = "tictactoe";
const SLUG = slugFor(VARIANT);
const SIZE = 3;
const SHOTS = process.env.SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

type Seat = { context: BrowserContext; page: Page; email: string };
type Options = { black?: Parameters<Browser["newContext"]>[0]; white?: Parameters<Browser["newContext"]>[0] };

test.describe("a result card over a finished board", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  async function twoPlayers(browser: Browser, baseURL: string, label: string, options: Options = {}) {
    const stamp = `${Date.now().toString(36)}${label}`;
    const kuro = { email: `result-black-${stamp}@example.test`, name: under(`Kuro${stamp} Result`) };
    const shiro = { email: `result-white-${stamp}@example.test`, name: under(`Shiro${stamp} Result`) };
    const blackContext = await memberContext(browser, baseURL, kuro, options.black);
    const whiteContext = await memberContext(browser, baseURL, shiro, options.white);
    return {
      black: { context: blackContext, page: await blackContext.newPage(), email: kuro.email } as Seat,
      white: { context: whiteContext, page: await whiteContext.newPage(), email: shiro.email } as Seat,
      names: { black: kuro.name, white: shiro.name },
    };
  }

  async function goodbye(...seats: Seat[]) {
    for (const one of seats) {
      await one.context.close();
      await removeMember(one.email);
    }
  }

  async function newGame(page: Page, names: { black: string; white: string }, extra: Record<string, unknown> = {}) {
    const started = await page.request.post("/api/games/live", {
      data: { variant: VARIANT, size: SIZE, moveTimeMs: null, rated: false, ...names, ...extra },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    mine(game.id);
    return game;
  }

  async function seat(page: Page, id: string, token: string): Promise<Locator> {
    await page.goto(`/games/${SLUG}/match/${id}/seat/${token}`);
    await ready(page, "shared-game");
    return page.getByTestId("shared-game");
  }

  /** A point's name as the move list writes it: column letter, then the row counted from the bottom. */
  const named = (row: number, col: number) => `${"ABC"[col]}${SIZE - row}`;

  /** Black A3, white A2, black B3, white B2, black C3: black's top row, clicked in turn. */
  async function blackTakesTheTopRow(black: Page, blackBoard: Locator, white: Page, whiteBoard: Locator) {
    const turns: [Page, Locator, number, number][] = [
      [black, whiteBoard, 0, 0],
      [white, blackBoard, 1, 0],
      [black, whiteBoard, 0, 1],
      [white, blackBoard, 1, 1],
    ];
    for (const [mover, otherBoard, row, col] of turns) {
      await playAt(mover, SIZE, row, col);
      await expect(otherBoard.getByTestId("live-moves")).toContainText(named(row, col), { timeout: 20_000 });
    }
    await playAt(black, SIZE, 0, 2);
  }

  /** The filed record, hydrated — the page a game hands back to when it ends. */
  async function theRecord(page: Page) {
    await expect(page.getByTestId("game-replay")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
  }

  test("a win and a loss in front of both players, and Rematch goes to the set-up page pre-filled", async ({
    browser,
    baseURL,
  }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "w", { white: { colorScheme: "dark" } });
    try {
      const game = await newGame(black.page, names);
      const blackBoard = await seat(black.page, game.id, game.blackToken);
      const whiteBoard = await seat(white.page, game.id, game.whiteToken);
      await blackTakesTheTopRow(black.page, blackBoard, white.page, whiteBoard);

      // The winner, where the winning stone was played.
      await theRecord(black.page);
      const won = black.page.getByRole("dialog", { name: /You won/ });
      await expect(won).toBeVisible();
      await expect(won).toHaveAttribute("data-outcome", "won");
      await expect(won).toBeFocused();
      await expect(won.getByTestId("result-card-reason")).toHaveText("You completed a winning line.");
      await expect(won.getByTestId("result-card-rivalry")).toBeVisible();
      await expect(won.getByTestId("result-card-rematch")).toHaveText(/Rematch/);
      // The game's XP is said on the card — and not again by toasts stacked over the board while it is open.
      await expect(won.getByTestId("result-card-xp")).toContainText("XP from this game");
      await expect(black.page.getByTestId("xp-toast")).toHaveCount(0);
      await shot(black.page, "resultcard-win-light-2");

      // The loser, on whose board the winning stone arrived.
      await theRecord(white.page);
      const lost = white.page.getByRole("dialog", { name: /You lost/ });
      await expect(lost).toBeVisible();
      await expect(lost).toHaveAttribute("data-outcome", "lost");
      await expect(lost.getByTestId("result-card-reason")).toContainText("completed a winning line.");
      await expect(lost.getByTestId("result-card-reason")).not.toContainText("You");
      await expect(lost.getByTestId("result-card-xp")).toContainText("XP from this game");
      await expect(white.page.getByTestId("xp-toast")).toHaveCount(0);
      await shot(white.page, "resultcard-loss-dark-2");

      // Rematch never starts a game: it lands on the set-up page, filled in from this one.
      await won.getByTestId("result-card-rematch").click();
      await black.page.waitForURL(new RegExp(`/games/new\\?rematch=${game.id}`));
      await ready(black.page, "set-up-game");
      await expect(black.page.getByTestId("set-up-again")).toBeVisible();
    } finally {
      await goodbye(black, white);
    }
  });

  test("Close and Escape leave the clean board, a reload does not bring the card back, and a watcher gets none", async ({
    browser,
    baseURL,
  }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "c");
    const stamp = Date.now().toString(36);
    const watcher = { email: `result-watch-${stamp}@example.test`, name: `Watch${stamp} Result` };
    const watching = await memberContext(browser, baseURL!, watcher);
    const watch: Seat = { context: watching, page: await watching.newPage(), email: watcher.email };
    try {
      const game = await newGame(black.page, names);
      const blackBoard = await seat(black.page, game.id, game.blackToken);
      const whiteBoard = await seat(white.page, game.id, game.whiteToken);
      await blackTakesTheTopRow(black.page, blackBoard, white.page, whiteBoard);

      // Close, on the loser's page: the board is left clean.
      await theRecord(white.page);
      const lost = white.page.getByTestId("result-card");
      await expect(lost).toBeVisible();
      await expect(lost.getByTestId("result-card-xp")).toContainText("XP from this game");
      await expect(white.page.getByTestId("xp-toast")).toHaveCount(0);
      await white.page.getByTestId("result-card-close").click();
      await expect(white.page.getByTestId("replay-scrubber")).toBeVisible();
      await expect(white.page.getByTestId("result-card")).toHaveCount(0);
      // Closing does not release the toasts over the clean board: the card's XP line was their announcement.
      await expect(white.page.getByTestId("xp-toast")).toHaveCount(0);
      await shot(white.page, "resultcard-closed-clean-board");

      // Escape, on the winner's page.
      await theRecord(black.page);
      await expect(black.page.getByTestId("result-card")).toBeVisible();
      await black.page.keyboard.press("Escape");
      await expect(black.page.getByTestId("replay-scrubber")).toBeVisible();
      await expect(black.page.getByTestId("result-card")).toHaveCount(0);

      // A reload of the finished game does not bring it back, for either of them.
      for (const seated of [white.page, black.page]) {
        await seated.reload();
        await theRecord(seated);
        await expect(seated.getByTestId("replay-scrubber")).toBeVisible();
        await expect(seated.getByTestId("result-card")).toHaveCount(0);
        // And the batch was recorded as shown: the flash was cleared, so no toast comes back either.
        await expect(seated.getByTestId("xp-toast")).toHaveCount(0);
      }

      // Somebody who did not play is shown the record, and no card.
      await watch.page.goto(`/games/${SLUG}/match/${game.id}`);
      await theRecord(watch.page);
      await expect(watch.page.getByTestId("replay-scrubber")).toBeVisible();
      await expect(watch.page.getByTestId("result-card")).toHaveCount(0);
    } finally {
      await goodbye(black, white, watch);
    }
  });

  /*
   * OPENING THE CARD MOVES NOTHING.
   *
   * It took focus with a plain `focus()`, which scrolls the focused element into
   * view — so a finished game opened from a link jumped 736px down to the board
   * the moment the browser took the page over, and "Play again as White" at the
   * top went off the screen. On a busy CI runner that jump landed between a
   * press being aimed and being made, and the press went nowhere: three
   * set-up-again and rematch specs sat on the finished game with the card open.
   * A player aiming at the same link met the same page moving under them.
   */
  test("opening the card does not scroll the page, so a link at the top stays where it was aimed", async ({
    browser,
    baseURL,
  }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "s");
    try {
      const game = await newGame(black.page, names);
      const blackBoard = await seat(black.page, game.id, game.blackToken);
      const whiteBoard = await seat(white.page, game.id, game.whiteToken);
      await blackTakesTheTopRow(black.page, blackBoard, white.page, whiteBoard);
      await theRecord(black.page);
      await expect(black.page.getByRole("dialog", { name: /You won/ })).toBeVisible();

      // The finished game opened again at the top, as from a link: nobody closed the card, so it opens here too.
      const again = await black.context.newPage();
      await again.goto(`/games/${SLUG}/match/${game.id}`);
      await theRecord(again);
      await expect(again.getByRole("dialog", { name: /You won/ })).toBeFocused();
      expect(await again.evaluate(() => window.scrollY), "opening the card scrolled the page").toBe(0);

      const playAgain = again.getByRole("link", { name: /Play again as/ });
      await expect(playAgain).toBeInViewport();
      await playAgain.click();
      await again.waitForURL(new RegExp(`/games/new\\?rematch=${game.id}`));
      await ready(again, "set-up-game");
    } finally {
      await goodbye(black, white);
    }
  });

  /*
   * XP TOASTS NEVER TAKE A CLICK MEANT FOR THE PAGE UNDER THEM.
   *
   * The stack sits over the top of every page, and each card took every press
   * that landed on it: with a game's XP waiting, the header's Play and New game
   * and a game's name under the heading could not be pressed until the toasts
   * went. A notice must not stand between a player and what they came to do, so
   * a press on a card now reaches what is under it, and the card is dismissed by
   * its own button, which is still there.
   */
  test("XP toasts over a header link let a press reach the link", async ({ browser, baseURL }) => {
    const stamp = `${Date.now().toString(36)}t`;
    const me = { email: `result-toast-${stamp}@example.test`, name: under(`Toast${stamp} Result`) };
    const them = { email: `result-toast-foe-${stamp}@example.test`, name: under(`Foe${stamp} Result`) };
    await seedMember(me);
    await seedMember(them);
    const context = await memberContext(browser, baseURL!, me);
    const theirs = await memberContext(browser, baseURL!, them);
    try {
      // A game won through the API, away from any page, so its XP is waiting as toasts for the next one.
      const made = await context.request.post("/api/games/live", {
        data: { challenge: them.email, variant: VARIANT, size: SIZE, moveTimeMs: null },
      });
      expect(made.status(), await made.text()).toBe(201);
      const { id } = (await made.json()) as { id: string };
      mine(id);
      const accepted = await theirs.request.post(`/api/games/${id}/offer/accept`, {});
      expect(accepted.status(), await accepted.text()).toBe(200);
      const tokens = await seatTokensFor(id);
      for (const [index, [row, col]] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [0, 2],
      ].entries()) {
        const played = await context.request.post(`/api/games/${id}/moves`, {
          data: { token: index % 2 === 0 ? tokens.blackToken : tokens.whiteToken, row, col },
        });
        expect(played.status(), await played.text()).toBe(201);
      }

      const page = await context.newPage();
      await page.goto("/play");
      await ready(page, "xp-toast-host");
      await expect(page.locator('[data-testid="xp-toast"][data-phase="shown"]').first()).toBeVisible();
      const newGameLink = page.getByRole("navigation").locator('a[href="/games/new"]').first();
      await expect(newGameLink).toBeVisible();

      const where = await newGameLink.evaluate((link) => {
        const r = link.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const under = [...document.querySelectorAll('[data-testid="xp-toast"]')].some((toast) => {
          const t = toast.getBoundingClientRect();
          return x >= t.left && x <= t.right && y >= t.top && y <= t.bottom;
        });
        const hit = document.elementFromPoint(x, y);
        return { under, reaches: hit !== null && link.contains(hit) };
      });
      // A toast really is over the link — or this would say nothing about toasts at all.
      expect(where.under, "no toast is over the New game link at this width").toBe(true);
      expect(where.reaches, "a press on the New game link lands on the toast instead").toBe(true);

      await newGameLink.click();
      await page.waitForURL(/\/games\/new(\?|$)/);
    } finally {
      await context.close();
      await theirs.close();
      await removeMember(me.email);
      await removeMember(them.email);
    }
  });

  test("a game at one screen says the winning colour, not you", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const host = { email: `result-hot-${stamp}@example.test`, name: under(`Host${stamp} Result`) };
    const context = await memberContext(browser, baseURL!, host);
    const page = await context.newPage();
    const me: Seat = { context, page, email: host.email };
    try {
      const game = await newGame(page, { black: host.name, white: under(`Guest${stamp} Result`) }, { hotSeat: true });
      // Both colours played from the one seat key, as two people at one screen do.
      for (const [row, col] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [0, 2],
      ]) {
        const moved = await page.request.post(`/api/games/${game.id}/moves`, {
          data: { token: game.blackToken, row, col },
        });
        expect(moved.status(), await moved.text()).toBeLessThan(300);
      }

      await page.goto(`/games/${SLUG}/match/${game.id}/seat/${game.blackToken}`);
      await theRecord(page);
      const card = page.getByRole("dialog", { name: /Black wins/ });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("data-outcome", "decided");
      await expect(card.getByTestId("result-card-reason")).toHaveText("Black completed a winning line.");
      await expect(card.getByTestId("result-card-rematch")).toHaveText(/Play again/);
      await shot(page, "resultcard-hot-seat");
    } finally {
      await goodbye(me);
    }
  });

  test("at 400px the card fits over the board, and nothing scrolls sideways", async ({ browser, baseURL }) => {
    const phone = { viewport: { width: 400, height: 860 } };
    const { black, white, names } = await twoPlayers(browser, baseURL!, "p", { black: phone, white: phone });
    try {
      const game = await newGame(black.page, names);
      const blackBoard = await seat(black.page, game.id, game.blackToken);
      const whiteBoard = await seat(white.page, game.id, game.whiteToken);
      await blackTakesTheTopRow(black.page, blackBoard, white.page, whiteBoard);

      await theRecord(black.page);
      const card = black.page.getByTestId("result-card");
      await expect(card).toBeVisible();
      const layer = (await black.page.getByTestId("result-card-layer").boundingBox())!;
      const box = (await card.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(layer.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(layer.x + layer.width + 1);
      const sideways = await black.page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways, "the record scrolls sideways at 400px").toBeLessThanOrEqual(0);
      await shot(black.page, "resultcard-win-phone");
    } finally {
      await goodbye(black, white);
    }
  });
});
