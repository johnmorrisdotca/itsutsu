import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * MEXICAN TRAIN ON SEVERAL DEVICES (docs/plans/dominoes/README.md, "Several
 * devices"): set from its own set-up by pressing "Several devices", two
 * members of this spec's own each in a phone-sized browser, a buddy row
 * between them made through the site, and the table's own computer player in
 * the third seat; every table taken away at the end.
 *
 * Each device shows its own tiles and nobody else's. The first seat leads; a
 * turn is taken by a tap on a tile and a tap on a lit train, or by the draw or
 * pass the rules ask for, until the turn passes. The computer's turn is worked
 * out by the browser whose move handed it the turn, and both devices see it
 * arrive.
 */

const PHONE = { width: 390, height: 844 };
const stamp = Date.now().toString(36);
const host = { email: `train-host-${stamp}@example.test`, name: `Ada-${stamp}` };
const guest = { email: `train-guest-${stamp}@example.test`, name: `Bo-${stamp}` };
const made: string[] = [];

test.afterAll(async () => {
  await removeTables(made);
  for (const member of [host, guest]) await removeMember(member.email);
});

async function phone(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }): Promise<{ context: BrowserContext; page: Page }> {
  const context = await memberContext(browser, baseURL, member, { viewport: PHONE });
  return { context, page: await context.newPage() };
}

async function fitsThePhone(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
}

const train = (page: Page) => page.getByTestId("train-game");

/** The whole of one seat's turn on its own device: a tile laid where one goes, else the draw or pass the rules ask for, until the turn passes. */
async function takeTurn(page: Page, seat: number) {
  await expect(page.getByTestId("online-status")).toHaveText("Your turn.", { timeout: 30_000 });
  while ((await train(page).getAttribute("data-to-play")) === String(seat) && (await train(page).getAttribute("data-state")) === "playing") {
    await expect(page.getByTestId("train-hand")).toHaveAttribute("data-active", "true");
    const before = await train(page).getAttribute("data-moves");
    const tile = page.locator('[data-testid="train-hand"] [data-testid="train-hand-tile"][data-targets]:not([data-targets="0"])').first();
    if ((await tile.count()) > 0) {
      await tile.click();
      await expect(tile).toHaveAttribute("data-chosen", "true");
      await page.locator('[data-testid="train-row"][data-target="true"]').first().click();
    } else if (await page.getByTestId("train-draw").isEnabled()) {
      await page.getByTestId("train-draw").click();
    } else {
      await page.getByTestId("train-pass").click();
    }
    await expect(train(page)).not.toHaveAttribute("data-moves", before!);
    await expect(page.getByTestId("online-status")).not.toHaveText("Sending…");
  }
}

test("Mexican Train: two members and a computer, each hand only on its own device, a turn from each device and the computer's seen on both", async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const a = await phone(browser, baseURL!, host);
  const b = await phone(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  // Ada sets a table for three on several devices: Bo in seat 2, the computer in seat 3.
  await a.page.goto("/games/mexican-train/pass-and-play");
  await ready(a.page, "train-set-up");
  await a.page.locator('[data-testid="train-count"][data-count="3"]').click();
  await a.page.getByTestId("online-where-several").click();
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="2"]').selectOption("computer:computer");
  await fitsThePhone(a.page);
  await a.page.getByTestId("train-start").click();
  await expect(a.page).toHaveURL(/\/games\/mexican-train\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
  const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(a.page, "online-table");
  await expect(train(a.page)).toHaveAttribute("data-state", "playing");

  await b.page.goto(`/games/mexican-train/tables/${id}`);
  await ready(b.page, "online-table");

  // Each device holds its own tiles face up, and nobody else's.
  await expect(a.page.getByTestId("train-hand")).toHaveAttribute("data-seat", "0");
  await expect(b.page.getByTestId("train-hand")).toHaveAttribute("data-seat", "1");
  await expect(a.page.getByTestId("train-hand")).toHaveCount(1);
  await expect(b.page.getByTestId("train-hand")).toHaveAttribute("data-active", "false");

  // The server refuses Bo a move for Ada's seat.
  const wrong = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 0, seat: 0, move: { kind: "draw" } } });
  expect(wrong.status()).toBe(403);

  // Ada leads; Bo sees her turn arrive and takes his.
  await takeTurn(a.page, 0);
  const afterAda = await train(a.page).getAttribute("data-moves");
  await expect(train(b.page)).toHaveAttribute("data-moves", afterAda!, { timeout: 20_000 });
  await takeTurn(b.page, 1);

  // The computer's seat is played by Bo's browser, and both devices see the turn come round to Ada again.
  await expect(train(b.page)).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
  await expect(train(a.page)).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
  await expect(a.page.locator('[data-testid="online-seat"][data-seat="2"]')).toContainText("Computer");
  await fitsThePhone(a.page);
  await fitsThePhone(b.page);

  await a.context.close();
  await b.context.close();
});
