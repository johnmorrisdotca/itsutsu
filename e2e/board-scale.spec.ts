import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { removeTables } from "./tables";
import { freshPuzzleSeed, matchIdIn, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/**
 * EVERY BOARD, REGULAR, LARGE OR FULL, ON A WIDE SCREEN — AND REMEMBERED FOR
 * EACH KIND OF SCREEN.
 *
 * John, 2026-09-28, with a 16×16 Number Place in a narrow column on a wide
 * screen: "Desktop should get the offer to have multiple sizes... like regular
 * and full or large.. giving the user more real estate. and hopefully make the
 * boxes bigger too." Then: "Desktop sizing must be offered for ALL games" and
 * "must have memory when on similar devices".
 *
 * Driven the way a reader does it: a size is chosen by pressing it, the board's
 * squares are measured before and after, the controls that play the board must
 * still be on the screen, a reload must bring the size back, and then the way
 * back to Regular, because a size you cannot un-choose is a trap. The memory is
 * per kind of screen, so the last case moves between a laptop's width and a
 * big monitor's and back.
 *
 * A member of its own each time, so the sizes chosen are nobody else's and
 * every other spec's board stays Regular.
 */

const tidyAway = gamesMade();

const LAPTOP = { width: 1280, height: 800 };
const DESK = { width: 1440, height: 900 };
const WIDE = { width: 1920, height: 1080 };
const PHONE = { width: 390, height: 844 };

async function freshMember(browser: Browser, baseURL: string, viewport: { width: number; height: number }) {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const member = { email: `board-scale-${stamp}@example.test`, name: `Scale ${stamp}` };
  const context = await memberContext(browser, baseURL, member, { viewport });
  return { context, page: await context.newPage(), email: member.email };
}

/** The request that keeps a choice on the account: ten seconds, so a choice never sent fails here by name. */
function keeping(page: Page) {
  return page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH", { timeout: 10_000 });
}

function play(page: Page): Locator {
  return page.getByTestId("board-scaling");
}

/** The play has taken its size: the chooser's answer is drawn and measured. */
async function settledAt(page: Page, scale: string) {
  await expect(play(page)).toHaveAttribute("data-board-scale-chosen", scale);
  await expect(play(page)).toHaveAttribute("data-board-scale", scale);
  await expect(play(page)).toHaveAttribute("data-scale-settled", "true");
}

async function choose(page: Page, scale: string) {
  const kept = keeping(page);
  await page.locator(`[data-testid="board-scale-option"][data-scale="${scale}"]`).click();
  await settledAt(page, scale);
  expect((await kept).status(), `the choice of ${scale} was not kept on the account`).toBe(200);
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  expect(box, "the thing measured is not drawn").not.toBeNull();
  return box!.width;
}

/** Wholly on the screen: nothing of it above the top or below the bottom of the window. */
async function onScreen(page: Page, locator: Locator, what: string) {
  const box = (await locator.boundingBox())!;
  const height = page.viewportSize()!.height;
  expect(box.y, `${what} is above the top of the window`).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height, `${what} runs off the bottom of the window`).toBeLessThanOrEqual(height + 1);
}

type Board = {
  name: string;
  /** Opens the board and waits until it is drawn and answering. */
  open: (page: Page) => Promise<void>;
  /** A square, or a thing that is a fixed number of squares wide: what grows. */
  square: (page: Page) => Locator;
  /** What a player must still be able to reach: the keys, the turn, the hand. */
  controls: (page: Page) => Locator;
};

const BOARDS: Board[] = [
  {
    name: "a 16×16 Number Place",
    open: async (page) => {
      await page.goto(`/games/number-place/play?size=16&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    square: (page) => page.getByTestId("puzzle-cell").first(),
    controls: (page) => page.getByTestId("puzzle-keys"),
  },
  {
    name: "Gomoji",
    open: async (page) => {
      await page.goto(`/games/gomoji/play?size=5&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    square: (page) => page.getByTestId("puzzle-play").getByTestId("board-surface").first(),
    controls: (page) => page.getByTestId("word-said"),
  },
  {
    name: "Kumimoji",
    open: async (page) => {
      await page.goto(`/games/kumimoji/play?seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    // The fitted tile: the table's own square, drawn at the size the table can hold.
    square: (page) => page.getByTestId("kumimoji-square").first(),
    controls: (page) => page.getByTestId("kumimoji-tray"),
  },
  {
    name: "a Dots and Boxes table",
    open: async (page) => {
      await page.goto("/games/dots-and-boxes/pass-and-play");
      await ready(page, "dots-set-up");
      await page.getByTestId("dots-start").click();
      await ready(page, "dots-game");
    },
    square: (page) => page.getByTestId("dots-game").getByTestId("board-surface"),
    controls: (page) => page.getByTestId("dots-turn"),
  },
  {
    name: "a Bridges puzzle",
    open: async (page) => {
      await page.goto(`/games/bridges/play?size=7&level=easy&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
    square: (page) => page.getByTestId("puzzle-play").getByTestId("board-surface").first(),
    controls: (page) => page.getByTestId("puzzle-check"),
  },
  {
    name: "a Mancala table",
    open: async (page) => {
      await page.goto("/games/mancala/pass-and-play");
      await page.getByTestId("mancala-start").click();
      await expect(page.getByTestId("mancala-turn")).toBeVisible();
    },
    square: (page) => page.locator("[data-scale-board]").getByTestId("board-surface").first(),
    controls: (page) => page.getByTestId("mancala-turn"),
  },
  {
    // A wide board (`data-scale-wide`): at Regular already the page's width, with nothing beside it; Large and Full go past the page.
    name: "a Tenka table",
    open: async (page) => {
      await page.goto("/games/tenka/pass-and-play");
      await ready(page, "tenka-set-up");
      await page.getByTestId("tenka-start").click();
      await ready(page, "tenka-game");
    },
    square: (page) => page.getByTestId("tenka-game").getByTestId("board-surface"),
    controls: (page) => page.getByTestId("tenka-bar"),
  },
  {
    name: "a gomoku practice board",
    open: async (page) => {
      await page.goto("/games/gomoku/play");
      await ready(page, "game-view");
    },
    square: (page) => page.getByTestId("game-view").getByTestId("board-surface"),
    controls: (page) => page.getByTestId("to-play"),
  },
];

/**
 * THE PRACTICE BOARD ON A LAPTOP IS ALREADY AS TALL AS THE WINDOW at Regular:
 * its board ends at the bottom of an 800-pixel screen with the record above it,
 * so Full has nothing to give it there and says so by staying the same size.
 * It is measured on the wide screen, where there is room. So is Tenka's map:
 * a wide board is the page's whole width at Regular, 1024 by 512, which is as
 * tall as an 800-pixel window has room for with its phase bar under it.
 */
const HEIGHT_BOUND_ON_A_LAPTOP = new Set(["a gomoku practice board", "a Tenka table"]);

for (const viewport of [LAPTOP, WIDE]) {
  test.describe(`at ${viewport.width}×${viewport.height}`, () => {
    for (const board of BOARDS) {
      if (viewport === LAPTOP && HEIGHT_BOUND_ON_A_LAPTOP.has(board.name)) continue;
      test(`${board.name}: Large and Full grow its squares, keep its controls on the screen, come back on a reload, and go back to Regular`, async ({ browser, baseURL }) => {
        const { context, page, email } = await freshMember(browser, baseURL!, viewport);
        try {
          await board.open(page);
          await ready(page, "board-scaling");
          await settledAt(page, "regular");
          await expect(page.getByTestId("board-scale")).toBeVisible();
          const regular = await widthOf(board.square(page));

          await choose(page, "large");
          const large = await widthOf(board.square(page));
          expect(large, `Large drew ${board.name}'s squares no bigger`).toBeGreaterThan(regular * 1.04);
          await onScreen(page, board.controls(page), `${board.name}'s controls at Large`);

          await choose(page, "full");
          const full = await widthOf(board.square(page));
          expect(full, `Full drew ${board.name}'s squares smaller than Large`).toBeGreaterThanOrEqual(large - 1);
          expect(full, `Full drew ${board.name}'s squares no bigger than Regular`).toBeGreaterThan(regular * 1.08);
          await onScreen(page, board.controls(page), `${board.name}'s controls at Full`);

          // Kept: the same board opened again arrives at Full and grows to it once measured.
          await page.reload();
          await ready(page, "board-scaling");
          await settledAt(page, "full");
          // Waited for, not read once: the board settles a frame or two after the size is taken, later on a busy machine.
          await expect.poll(async () => Math.abs((await widthOf(board.square(page))) - full), { message: "Full was not the same size after a reload" }).toBeLessThan(3);

          // And back.
          await choose(page, "regular");
          await expect.poll(async () => Math.abs((await widthOf(board.square(page))) - regular), { message: "Regular did not go back to the size it was" }).toBeLessThan(2);
        } finally {
          await context.close();
          await removeMember(email);
        }
      });
    }
  });
}

test.describe("a number puzzle's digits", () => {
  test("grow with their squares, and shrink back with them", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, WIDE);
    try {
      await BOARDS[0]!.open(page);
      await ready(page, "board-scaling");
      const cell = page.getByTestId("puzzle-cell").first();
      const size = () => cell.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      const regular = await size();
      await choose(page, "full");
      expect(await size(), "the digits stayed the size they were in squares nearly twice as big").toBeGreaterThan(regular * 1.4);
      await choose(page, "regular");
      expect(await size()).toBe(regular);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});

test.describe("Gomoji's letters", () => {
  test("are sized from their squares, so they grow at Large and Full and shrink back", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, WIDE);
    try {
      await BOARDS[1]!.open(page);
      await ready(page, "board-scaling");
      await page.keyboard.type("a");
      const typed = page.locator('[data-testid="word-tile"][data-mark="typed"]').first();
      await expect(typed).toContainText(/a/i);
      // The element the letter is drawn in, wherever the style puts it.
      const size = () =>
        typed.evaluate((tile) => {
          const drawn = [tile, ...tile.querySelectorAll("*")].find((node) => node.children.length === 0 && /^a$/i.test(node.textContent?.trim() ?? ""));
          return parseFloat(getComputedStyle(drawn ?? tile).fontSize);
        });
      const regular = await size();
      await choose(page, "large");
      const large = await size();
      expect(large, "a letter stayed its size in a bigger square").toBeGreaterThan(regular * 1.15);
      await choose(page, "full");
      expect(await size()).toBeGreaterThan(large);
      await choose(page, "regular");
      expect(Math.abs((await size()) - regular)).toBeLessThan(0.5);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});

test.describe("a table played online", () => {
  const made: string[] = [];
  test.afterAll(async () => {
    await removeTables(made);
  });

  test("grows at Large and Full with whose turn it is on the screen, and opens and leaves just the board", async ({ browser, baseURL }) => {
    const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const guest = { email: `board-scale-guest-${stamp}@example.test`, name: `Guest-${stamp}` };
    const { context, page, email } = await freshMember(browser, baseURL!, WIDE);
    const other = await memberContext(browser, baseURL!, guest, { viewport: WIDE });
    try {
      const guestId = await memberIdFor(guest.email);
      expect((await context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);
      await page.goto("/games/dots-and-boxes/pass-and-play");
      await ready(page, "dots-set-up");
      await page.getByTestId("online-where-several").click();
      await page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
      await page.getByTestId("dots-start").click();
      await expect(page).toHaveURL(/\/games\/dots-and-boxes\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
      made.push(new URL(page.url()).pathname.split("/").at(-1)!);
      await ready(page, "online-table");
      await ready(page, "board-scaling");
      const surface = () => page.getByTestId("online-table").getByTestId("board-surface");
      const regular = await widthOf(surface());
      await choose(page, "large");
      expect(await widthOf(surface())).toBeGreaterThan(regular * 1.04);
      await choose(page, "full");
      expect(await widthOf(surface())).toBeGreaterThan(regular * 1.08);
      await onScreen(page, page.getByTestId("online-status"), "whose turn it is at the online table, at Full");
      await choose(page, "regular");

      await page.getByTestId("bare-board-toggle").click();
      await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
      await expect(page.getByTestId("online-status")).toBeVisible();
      await expect(page.getByTestId("dots-board")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("html")).not.toHaveAttribute("data-bare", "true");
    } finally {
      await other.close();
      await context.close();
      await removeMember(email);
      await removeMember(guest.email);
    }
  });
});

test.describe("remembered for each kind of screen", () => {
  test("a laptop and a big monitor each keep their own size, on a live game", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, DESK);
    try {
      await page.goto("/games/new?game=go&board=19");
      await ready(page, "set-up-game");
      await startAndBegin(page);
      await page.waitForURL(/\/games\/go\/match\//, { timeout: 30_000 });
      const boardAt = page.url();
      tidyAway(matchIdIn(boardAt));
      await ready(page, "board-scaling");
      await expect(play(page)).toHaveAttribute("data-device-class", "desk");
      const surface = () => page.getByTestId("board-column").getByTestId("board-surface");
      const regular = await widthOf(surface());

      /*
       * Large at 1440, kept on a reload at 1440. A live board at Regular is
       * already fitted to the height of a 900-pixel screen, under the notices
       * above it, so Large has little to give it here; it must not be smaller,
       * and whose turn it is must still be on the screen.
       */
      await choose(page, "large");
      expect(await widthOf(surface()), "Large drew the live board smaller than Regular").toBeGreaterThanOrEqual(regular - 1);
      await onScreen(page, page.getByTestId("turn-banner").first(), "whose turn it is, at Large");
      await page.reload();
      await ready(page, "board-scaling");
      await settledAt(page, "large");

      // A big monitor has a choice of its own: Regular, until one is made there.
      const monitor = await context.newPage();
      await monitor.setViewportSize(WIDE);
      await monitor.goto(boardAt);
      await ready(monitor, "board-scaling");
      await expect(play(monitor)).toHaveAttribute("data-device-class", "wide");
      await settledAt(monitor, "regular");
      const monitorRegular = await widthOf(monitor.getByTestId("board-column").getByTestId("board-surface"));
      await choose(monitor, "full");
      // On a big monitor there is room: Full's board is bigger, and whose turn it is still on the screen.
      expect(await widthOf(monitor.getByTestId("board-column").getByTestId("board-surface")), "Full drew the live board no bigger on a 1920 screen").toBeGreaterThan(monitorRegular * 1.08);
      await onScreen(monitor, monitor.getByTestId("turn-banner").first(), "whose turn it is, at Full");
      await monitor.close();

      // Back at a laptop's width the laptop's choice stands, whatever the monitor chose.
      const again = await context.newPage();
      await again.goto(boardAt);
      await ready(again, "board-scaling");
      await expect(play(again)).toHaveAttribute("data-device-class", "desk");
      await settledAt(again, "large");
      // And the way back, on this kind of screen only.
      await choose(again, "regular");
      await again.close();

      const wideAgain = await context.newPage();
      await wideAgain.setViewportSize(WIDE);
      await wideAgain.goto(boardAt);
      await ready(wideAgain, "board-scaling");
      await settledAt(wideAgain, "full");
      await wideAgain.close();
    } finally {
      await context.close();
      await removeMember(email);
    }
  });

  test("a phone is offered no size, and a size kept for a desk changes nothing on it", async ({ browser, baseURL }) => {
    const { context, page, email } = await freshMember(browser, baseURL!, WIDE);
    try {
      await BOARDS[0]!.open(page);
      await ready(page, "board-scaling");
      await choose(page, "full");

      await page.setViewportSize(PHONE);
      // The play is there and answering before anything is said about what is not.
      await expect(play(page)).toHaveAttribute("data-device-class", "none");
      await expect(play(page)).toHaveAttribute("data-board-scale", "regular");
      await expect(page.getByTestId("puzzle-cell").first()).toBeVisible();
      await expect(page.getByTestId("board-scale"), "a phone was offered sizes that change nothing on it").toBeHidden();
      expect(await widthOf(play(page)), "the play is wider than the phone").toBeLessThanOrEqual(PHONE.width);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "the page scrolls sideways on a phone").toBeLessThanOrEqual(0);
    } finally {
      await context.close();
      await removeMember(email);
    }
  });
});
