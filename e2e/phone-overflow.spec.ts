import { expect, test, type Locator, type Page } from "@playwright/test";

import { memberContext, removeMember, removePlayedUnder } from "./members";
import { readyHere } from "./support";
import { namesPlayedUnder, removeGame } from "./tidy";

/**
 * NOTHING ON MY GAMES SPILLS OUT OF ITS BOX ON A PHONE.
 *
 * Two of John's iPhone screenshots, 2026-09-26. In Open seats the Game cell
 * wrapped "Tic-tac-toe" over three lines and the next column's "No clock" and
 * "3×3" were drawn over it; on Their move, Resign opened its question in a
 * green panel wider than the card, cut off at the screen's edge. Both are
 * measured here as boxes at 390×844, since a picture that overlaps still has
 * every element present and visible: each cell's content inside its own cell,
 * and the question inside its card and the screen, with both answers on it.
 */
const PHONE = { width: 390, height: 844 };
const under = namesPlayedUnder();

type Box = { left: number; right: number; top: number; bottom: number };

/**
 * Each cell of a row, with the box its content actually covers: every piece
 * of text and every element inside it, measured one by one. (A range over the
 * whole cell is not enough: WebKit reports it clipped to the cell, which is
 * the very overflow this looks for.)
 */
async function cellsOf(row: Locator): Promise<{ cell: Box; content: Box; text: string }[]> {
  return row.locator("td").evaluateAll((cells) =>
    cells.map((td) => {
      const cell = td.getBoundingClientRect();
      const rects: DOMRect[] = [...td.querySelectorAll("*")].map((element) => element.getBoundingClientRect());
      const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if ((node.textContent ?? "").trim() === "") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        rects.push(...range.getClientRects());
      }
      const drawn = rects.filter((rect) => rect.width > 0 && rect.height > 0);
      return {
        cell: { left: cell.left, right: cell.right, top: cell.top, bottom: cell.bottom },
        content: {
          left: Math.min(cell.right, ...drawn.map((rect) => rect.left)),
          right: Math.max(cell.left, ...drawn.map((rect) => rect.right)),
          top: Math.min(cell.bottom, ...drawn.map((rect) => rect.top)),
          bottom: Math.max(cell.top, ...drawn.map((rect) => rect.bottom)),
        },
        text: (td.textContent ?? "").trim(),
      };
    }),
  );
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = (await locator.boundingBox())!;
  return { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height };
}

/** Half a pixel for sub-pixel rounding, never more. */
const SLACK = 0.5;

function expectInside(inner: Box, outer: Box, what: string) {
  expect(inner.left, `${what}: left`).toBeGreaterThanOrEqual(outer.left - SLACK);
  expect(inner.right, `${what}: right`).toBeLessThanOrEqual(outer.right + SLACK);
}

async function noSidewaysScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
}

test.describe("My games on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test("an open seat's cells never overlap: the game's name, its time limit and its board each keep to their own column", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const poster = { email: `overflow-poster-${stamp}@example.test`, name: `Overflow-${stamp}`, country: "Canada" };
    const theirs = await memberContext(browser, baseURL ?? "http://localhost:6700", poster);
    const gameIds: string[] = [];
    try {
      // The screenshot's two seats: Tic-tac-toe with no clock on 3×3, and
      // Gomoku at a day a move — one word too long for what WebKit left it.
      for (const seat of [
        { variant: "tictactoe", size: 3, moveTimeMs: null },
        { variant: "freestyle", size: 9, moveTimeMs: 86_400_000 },
      ]) {
        const posted = await theirs.request.post("/api/games/live", { data: { blackName: poster.name, open: true, ...seat } });
        expect(posted.status(), await posted.text()).toBe(201);
        gameIds.push(((await posted.json()) as { id: string }).id);
      }

      await page.goto("/play");
      const seats = page.getByTestId("waiting-room").getByTestId("open-game").filter({ hasText: poster.name });
      await expect(seats).toHaveCount(2);
      await expect(seats.getByTestId("open-game-clock").filter({ hasText: "No clock" })).toContainText("3×3");
      await expect(seats.getByTestId("open-game-clock").filter({ hasText: "1 day a move" })).toContainText("9×9");

      for (const seat of await seats.all()) {
        const cells = await cellsOf(seat);
        expect(cells.length).toBeGreaterThan(2);
        for (const [at, { cell, content, text }] of cells.entries()) {
          expectInside(content, cell, `cell ${at} (${text.slice(0, 20)})`);
          const next = cells[at + 1];
          if (next !== undefined) expect(content.right, `cell ${at} runs into cell ${at + 1}`).toBeLessThanOrEqual(next.content.left + SLACK);
        }
        // The game's name on one line, never a syllable a line.
        const name = await boxOf(seat.locator("td").first().getByRole("link").first());
        expect(name.bottom - name.top, `${cells[0].text}: its name is on one line`).toBeLessThan(30);
      }

      await noSidewaysScroll(page);
    } finally {
      for (const id of gameIds) await removeGame(id);
      await removePlayedUnder([poster.name]);
      await theirs.close();
      await removeMember(poster.email);
    }
  });

  test("Resign's question wraps inside its card, with both answers on the screen", async ({ browser, request }) => {
    const stamp = Date.now().toString(36);
    const started = await request.post("/api/games/live", {
      data: { blackName: under(`Narrow ${stamp}`), whiteName: under(`Phone ${stamp}`), size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });

    const context = await browser.newContext({ storageState: ".auth/admin.json", viewport: PHONE, hasTouch: true, isMobile: true });
    try {
      const page = await context.newPage();
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
      await page.goto("/play");

      const row = page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);
      await readyHere(row.getByTestId("resign"));
      await row.getByTestId("resign").click();
      const asking = row.getByTestId("resign-confirm");
      await expect(asking).toContainText("The other side wins");

      const card = await boxOf(row);
      const screen: Box = { left: 0, right: PHONE.width, top: 0, bottom: PHONE.height };
      expectInside(card, screen, "the card");
      expectInside(await boxOf(asking), card, "the question");
      for (const answer of ["resign-yes", "resign-no"]) {
        const box = await boxOf(row.getByTestId(answer));
        expectInside(box, card, answer);
        expectInside(box, screen, answer);
      }
      await noSidewaysScroll(page);

      // Still a question that can be refused: no leaves the game going.
      await row.getByTestId("resign-no").click();
      await expect(asking).toHaveCount(0);
      expect((await (await request.get(`/api/games/${game.id}`)).json()).status).toBe("active");
    } finally {
      await context.close();
      await removeGame(game.id);
    }
  });
});
