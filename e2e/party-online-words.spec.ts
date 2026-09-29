import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * SUPERGHOST AND MANCALA ON SEVERAL DEVICES: the two party kinds that joined
 * after Dots and Boxes, each set from its own set-up by pressing "Several
 * devices", two members of this spec's own, each in a phone-sized browser, a
 * buddy row between them made through the site, every table taken away at the
 * end. A move is made on the device whose turn it is, and the other sees it
 * arrive by its own poll.
 *
 * Superghost's words are judged in the browser — the list is loaded there —
 * and the server takes that word for them (John, 2026-09-29); the spec plays
 * a round to its end by a challenge and a concession, which needs no word.
 */

const PHONE = { width: 390, height: 844 };
const stamp = Date.now().toString(36);
const host = { email: `words-host-${stamp}@example.test`, name: `Rin-${stamp}` };
const guest = { email: `words-guest-${stamp}@example.test`, name: `Sho-${stamp}` };
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

/** Sets a two-seat table from a party game's set-up on several devices, the buddy in seat 2; its id. */
async function setTable(page: Page, slug: string, setUp: string, start: string, buddyId: string, count: boolean): Promise<string> {
  await page.goto(`/games/${slug}/pass-and-play`);
  await ready(page, setUp);
  if (count) await page.locator(`[data-testid="ghost-count"][data-count="2"]`).click();
  await page.getByTestId("online-where-several").click();
  await page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${buddyId}`);
  await fitsThePhone(page);
  await page.getByTestId(start).click();
  await expect(page).toHaveURL(new RegExp(`/games/${slug}/tables/[a-z0-9]{4}-[a-z0-9]{4}$`));
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(page, "online-table");
  return id;
}

/** On the device whose turn it is: a letter's key, then its end, and wait for the table to take it. */
async function add(page: Page, key: string, end: "before" | "after") {
  const version = Number(await page.getByTestId("online-table").getAttribute("data-version"));
  await page.getByTestId(`word-key-${key}`).click();
  await expect(page.getByTestId("ghost-turn-keys")).toHaveAttribute("data-pending", key);
  await page.getByTestId(`ghost-add-${end}`).click();
  await expect(page.getByTestId("online-table")).not.toHaveAttribute("data-version", String(version));
}

test("Superghost: letters from each device, a challenge from one and a concession from the other, the round seen ending on both", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const a = await phone(browser, baseURL!, host);
  const b = await phone(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  const id = await setTable(a.page, "superghost", "ghost-set-up", "ghost-start", guestId, true);
  await expect(a.page.getByTestId("ghost-game")).toHaveAttribute("data-words", "ready");
  await add(a.page, "c", "after");

  // Sho's device: the letter arrives, it is his turn, and his keys are there.
  await b.page.goto(`/games/superghost/tables/${id}`);
  await ready(b.page, "online-table");
  await expect(b.page.getByTestId("ghost-fragment")).toHaveAttribute("data-fragment", "c");
  await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");
  await expect(b.page.getByTestId("ghost-game")).toHaveAttribute("data-words", "ready");
  await add(b.page, "a", "after");

  // The server refuses Rin a move for Sho's seat.
  const wrong = await a.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 4, seat: 1, move: { move: { kind: "challenge" }, word: false } } });
  expect(wrong.status()).toBe(403);

  // Rin sees "ca" arrive and challenges; Sho, asked for a word, concedes; both devices see the round end.
  await expect(a.page.getByTestId("ghost-fragment")).toHaveAttribute("data-fragment", "ca", { timeout: 20_000 });
  await a.page.getByTestId("ghost-challenge").click();
  await expect(a.page.getByTestId("online-status")).toHaveText(`Waiting on ${guest.name}.`);
  await expect(b.page.getByTestId("ghost-concede")).toBeVisible({ timeout: 20_000 });
  await b.page.getByTestId("ghost-concede").click();
  await expect(b.page.getByTestId("ghost-game")).toHaveAttribute("data-rounds", "1");
  await expect(a.page.getByTestId("ghost-game")).toHaveAttribute("data-rounds", "1", { timeout: 20_000 });
  await expect(a.page.locator('[data-testid="online-seat"][data-seat="1"]')).toContainText("G");
  await fitsThePhone(b.page);

  await a.context.close();
  await b.context.close();
});

test("Mancala: a pit sown from each device, each seen arriving on the other", async ({ browser, baseURL }) => {
  const a = await phone(browser, baseURL!, host);
  const b = await phone(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  const id = await setTable(a.page, "mancala", "mancala-set-up", "mancala-start", guestId, false);
  const pit = (page: Page, hole: number) => page.locator(`[data-testid="mancala-pit"][data-pit="${hole}"]`);

  // Rin sows her first pit: four seeds that stop short of her store, so the turn passes.
  await pit(a.page, 0).click();
  await expect(a.page.getByTestId("mancala-game")).toHaveAttribute("data-moves", "1");

  await b.page.goto(`/games/mancala/tables/${id}`);
  await ready(b.page, "online-table");
  await expect(b.page.getByTestId("mancala-game")).toHaveAttribute("data-moves", "1");
  await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");
  // The server refuses Rin a pit on Sho's turn.
  expect((await a.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 1, seat: 1, move: 7 } })).status()).toBe(403);

  await pit(b.page, 7).click();
  await expect(b.page.getByTestId("mancala-game")).toHaveAttribute("data-moves", "2");
  await expect(a.page.getByTestId("mancala-game")).toHaveAttribute("data-moves", "2", { timeout: 20_000 });
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
  await fitsThePhone(a.page);
  await fitsThePhone(b.page);

  await a.context.close();
  await b.context.close();
});
