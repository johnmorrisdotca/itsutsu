import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { memberContext, memberIdFor, removeMember } from "./members";
import { freshPuzzleSeed, ready } from "./support";
import { removeTables } from "./tables";

/**
 * KUMIMOJI'S PASS AND PLAY ON SEVERAL DEVICES, WITH ITS OWN COMPUTER PLAYER AT
 * THE TABLE. Two members of this spec's own, each in a phone-sized browser,
 * and a computer in the third seat. Every hand is visible to every seat, and
 * the words are the browser's word (John, 2026-09-29); the server checks only
 * that the tiles are real — which this spec tests from both sides: trades from
 * each device land, and a turn claiming a tile the seat never had is refused.
 *
 * Each person trades a tile and presses Done, so the turn is allowed whatever
 * the bag dealt. After Hiro's Done the computer is to play, and it plays in
 * Hiro's browser — the word list loaded in a worker there — and Mei's device
 * sees its turn arrive.
 */

const PHONE = { width: 390, height: 844 };
const AT = `/games/${PUZZLE_SLUGS.kumimoji}`;
const TINY = KUMIMOJI_HANDS.tiny;
const stamp = Date.now().toString(36);
const host = { email: `kumi-host-${stamp}@example.test`, name: `Mei-${stamp}` };
const guest = { email: `kumi-guest-${stamp}@example.test`, name: `Hiro-${stamp}` };
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

/** On the device whose turn it is: trade the first tile in hand, then Done, and wait for the table to move on there. */
async function tradeAndDone(page: Page) {
  const online = page.getByTestId("kumimoji-online");
  await ready(page, "online-table");
  await expect(page.getByTestId("kumimoji-party-turn")).toBeVisible();
  const turns = Number(await online.getAttribute("data-turns"));
  await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(TINY);
  await page.getByTestId("kumimoji-hand-tile").first().click();
  await page.getByTestId("kumimoji-trade").click();
  await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(TINY - 1 + 3);
  await page.getByTestId("kumimoji-party-done").click();
  await expect(online).toHaveAttribute("data-turns", String(turns + 1));
}

test("Kumimoji: two members and a computer, each hand visible, trades from each device, and the computer's turn worked out in a browser", async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const a = await phone(browser, baseURL!, host);
  const b = await phone(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  // Mei sets the table from Kumimoji's pass-and-play page: three players, several devices, Hiro and a computer.
  await a.page.goto(`${AT}/play?size=${TINY}&level=medium&seed=${freshPuzzleSeed()}&length=medium&players=3`);
  await ready(a.page, "kumimoji-party");
  await a.page.getByTestId("online-where-several").click();
  await expect(a.page.getByTestId("kumimoji-online-seats")).toBeVisible();
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="2"]').selectOption("computer:computer");
  await fitsThePhone(a.page);
  await a.page.getByTestId("kumimoji-online-start").click();
  await expect(a.page).toHaveURL(new RegExp(`${AT}/tables/[a-z0-9]{4}-[a-z0-9]{4}$`));
  const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(a.page, "online-table");
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");

  // Hiro opens it; it is Mei's turn, and every table and hand is face up to him.
  await b.page.goto(`${AT}/tables/${id}`);
  await ready(b.page, "online-table");
  await expect(b.page.getByTestId("kumimoji-online")).toHaveAttribute("data-ready", "true");
  await expect(b.page.getByTestId("kumimoji-party-all")).toBeVisible();
  await expect(b.page.getByTestId("kumimoji-party-turn")).toHaveCount(0);

  // The server takes the browser's word for words, never for tiles: a Done claiming a tile Mei never had is refused.
  const view = (await (await a.context.request.get(`/api/tables/${id}`)).json()) as { state: string; moveCount: number };
  const kept = JSON.parse(view.state) as { bag: string; returned: string; taken: number; players: { hand: string; grid: string }[] };
  const mine = kept.players[0]!;
  const forged = { hand: `${mine.hand}e`, grid: mine.grid, returned: kept.returned, taken: kept.taken };
  const refused = await a.context.request.post(`/api/tables/${id}/moves`, { data: { moves: view.moveCount, seat: 0, move: { stages: [{ seat: forged, then: "done", sound: true, spells: true }] } } });
  expect(refused.status()).toBe(422);

  // Mei trades and presses Done on her device; Hiro's sees it arrive, and it is his turn.
  await tradeAndDone(a.page);
  await expect(b.page.getByTestId("kumimoji-online")).toHaveAttribute("data-turns", "1", { timeout: 20_000 });
  await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");
  await fitsThePhone(b.page);

  // Hiro's turn. Then the computer's, worked out in Hiro's browser, whose Done handed it the turn.
  await tradeAndDone(b.page);
  await expect(b.page.getByTestId("kumimoji-online")).toHaveAttribute("data-turns", "3", { timeout: 45_000 });
  const after = (await (await a.context.request.get(`/api/tables/${id}`)).json()) as { lastMoverId: string; toPlay: number };
  expect(after.lastMoverId).toBe(guestId);
  expect(after.toPlay).toBe(0);

  // Mei's device sees both turns arrive, and it is hers again.
  await expect(a.page.getByTestId("kumimoji-online")).toHaveAttribute("data-turns", "3", { timeout: 20_000 });
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
  await expect(a.page.locator('[data-testid="online-seat"][data-seat="2"]')).toHaveAttribute("data-kind", "computer");
  await fitsThePhone(a.page);

  // Both find the table waiting on My games, Mei's move.
  await b.page.goto("/play");
  await expect(b.page.locator(`[data-testid="my-table"][data-table="${id}"]`)).toContainText(`${host.name}’s move`);

  await a.context.close();
  await b.context.close();
});
