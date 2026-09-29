import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { PARTY_CHECKERS_RULES } from "../src/lib/gomoku/party/partyCheckers";
import { PARTY_HALMA_RULES } from "../src/lib/gomoku/party/partyHalma";
import type { PartyRaceRules, PartyRaceState } from "../src/lib/gomoku/party/partyRace.types";
import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * THE RACE TABLES AND BLOCK FIVE ON SEVERAL DEVICES: the same layer Dots and
 * Boxes is played on (`party-online.spec.ts`), with each game's own board and
 * its own way of making a move — a piece picked up and put down, a shape held,
 * turned and laid. Two members of this spec's own, each in a phone-sized
 * browser; a buddy row between them made through the site; every table taken
 * away at the end. A move is made on the device whose turn it is, and the
 * other device is watched until it arrives by its own poll.
 *
 * The moves are the first each game's own rules offer the player to move, read
 * from the same rules the page and the server use — so the spec plays a legal
 * game without knowing the board by heart.
 */

const PHONE = { width: 390, height: 844 };
const stamp = Date.now().toString(36);
const host = { email: `race-host-${stamp}@example.test`, name: `Sora-${stamp}` };
const guest = { email: `race-guest-${stamp}@example.test`, name: `Ren-${stamp}` };
const made: string[] = [];

test.afterAll(async () => {
  await removeTables(made);
  for (const member of [host, guest]) await removeMember(member.email);
});

async function phone(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }, touch = false): Promise<{ context: BrowserContext; page: Page }> {
  const context = await memberContext(browser, baseURL, member, { viewport: PHONE, hasTouch: touch });
  return { context, page: await context.newPage() };
}

async function fitsThePhone(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
}

const hole = (page: Page, row: number, col: number) => page.locator(`[data-testid="party-hole"][data-row="${row}"][data-col="${col}"]`);

/** The first move the rules offer the player to move: one of their pieces, and the first place it may go. */
function firstMove<S extends PartyRaceState, C extends number>(rules: PartyRaceRules<S, C>, game: S): { from: [number, number]; to: [number, number] } {
  for (const [index, owner] of game.board.entries()) {
    if (owner !== game.toPlay) continue;
    const from = { row: Math.floor(index / rules.size), col: index % rules.size };
    const to = rules.destinations(game, from)[0];
    if (to !== undefined) return { from: [from.row, from.col], to: [to.row, to.col] };
  }
  throw new Error("The player to move has no move.");
}

/** Pick a piece up and put it down on the device whose turn it is, and wait for the table's answer to show it there. */
async function race(page: Page, testId: string, move: { from: [number, number]; to: [number, number] }) {
  const board = page.getByTestId(testId);
  const before = Number(await board.getAttribute("data-moves"));
  await hole(page, ...move.from).click();
  await expect(hole(page, ...move.from)).toHaveAttribute("data-picked", "true");
  await expect(hole(page, ...move.to)).toHaveAttribute("data-target", "true");
  await hole(page, ...move.to).click();
  await expect(board).toHaveAttribute("data-moves", String(before + 1));
}

/** Sets a table from a game's set-up on several devices, the buddy in seat 2 and links in any others; its id. */
async function setTable(page: Page, slug: string, setUp: string, start: string, count: number | null, buddyId: string): Promise<string> {
  await page.goto(`/games/${slug}/pass-and-play`);
  await ready(page, setUp);
  if (count !== null) await page.locator(`[data-testid="party-count"][data-count="${count}"]`).click();
  await page.getByTestId("online-where-several").click();
  await page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${buddyId}`);
  await page.getByTestId(start).click();
  await expect(page).toHaveURL(new RegExp(`/games/${slug}/tables/[a-z0-9]{4}-[a-z0-9]{4}$`));
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(page, "online-table");
  return id;
}

/** One race's case, typed by its own rules. */
function raceBetweenTwoDevices<S extends PartyRaceState, C extends number>(slug: string, rules: PartyRaceRules<S, C>, testId: string, two: C) {
  test(`${slug}: a race between two devices, each moving only on their own turn`, async ({ browser, baseURL }) => {
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const guestId = await memberIdFor(guest.email);
    expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

    const id = await setTable(a.page, slug, "party-set-up", "party-start", 2, guestId);
    await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
    await fitsThePhone(a.page);

    // Ren opens it from My games, where it waits on Sora.
    await b.page.goto("/play");
    const row = b.page.locator(`[data-testid="my-table"][data-table="${id}"]`);
    await expect(row).toContainText(`${host.name}’s move`);
    await row.getByTestId("my-table-open").click();
    await ready(b.page, "online-table");
    await expect(b.page.getByTestId(testId)).toBeVisible();
    // Not his turn: none of the holes on his board can be pressed.
    await expect(b.page.locator('[data-testid="party-hole"]:not([disabled])')).toHaveCount(0);

    // Sora's move, from her device; Ren's sees it arrive.
    let game = rules.start(two);
    const first = firstMove(rules, game);
    await race(a.page, testId, first);
    game = rules.move(game, { row: first.from[0], col: first.from[1] }, { row: first.to[0], col: first.to[1] })!;
    await expect(b.page.getByTestId(testId)).toHaveAttribute("data-moves", "1", { timeout: 20_000 });
    await expect(hole(b.page, ...first.to)).toHaveAttribute("data-owner", "0");
    await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");

    // The server refuses Sora moving Ren's piece for him.
    const second = firstMove(rules, game);
    const wrong = await a.context.request.post(`/api/tables/${id}/moves`, {
      data: { moves: 1, seat: 1, move: { from: { row: second.from[0], col: second.from[1] }, to: { row: second.to[0], col: second.to[1] } } },
    });
    expect(wrong.status()).toBe(403);

    // Ren's move, from his device; Sora's sees it arrive.
    await race(b.page, testId, second);
    await expect(a.page.getByTestId(testId)).toHaveAttribute("data-moves", "2", { timeout: 20_000 });
    await expect(hole(a.page, ...second.to)).toHaveAttribute("data-owner", "1");
    await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
    await fitsThePhone(b.page);

    await a.context.close();
    await b.context.close();
  });
}

raceBetweenTwoDevices("chinese-checkers", PARTY_CHECKERS_RULES, "party-checkers", 2);
raceBetweenTwoDevices("halma", PARTY_HALMA_RULES, "party-halma", 2);

test("block-five: four seats, a buddy and two links, a shape laid from each of two devices", async ({ browser, baseURL }) => {
  // A finger, not a mouse: a tap shows the piece where it would lie, and a second tap lays it.
  const a = await phone(browser, baseURL!, host, true);
  const b = await phone(browser, baseURL!, guest, true);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  const id = await setTable(a.page, "block-five", "blocks-set-up", "blocks-start", null, guestId);
  await expect(a.page.locator('[data-testid="online-seat"][data-kind="open"]')).toHaveCount(2);
  await expect(a.page.getByTestId("online-seat-link")).toHaveCount(2);
  await fitsThePhone(a.page);

  await b.page.goto(`/games/block-five/tables/${id}`);
  await ready(b.page, "online-table");
  await expect(b.page.getByTestId("blocks-piece")).toHaveCount(0);

  // Sora lays the one-square piece on her corner, from her device.
  await a.page.locator('[data-testid="blocks-piece"][data-piece="one"]').tap();
  await a.page.locator('[data-testid="party-hole"][data-row="0"][data-col="0"]').tap();
  await expect(a.page.locator('[data-testid="party-hole"][data-row="0"][data-col="0"]')).toHaveAttribute("data-ghost", "allowed");
  await a.page.locator('[data-testid="party-hole"][data-row="0"][data-col="0"]').tap();
  await expect(a.page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "1");

  // Ren's device sees it, and it is his turn there, with his own tray.
  await expect(b.page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "1", { timeout: 20_000 });
  await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");
  await b.page.locator('[data-testid="blocks-piece"][data-piece="one"]').tap();
  await b.page.locator('[data-testid="party-hole"][data-row="0"][data-col="19"]').tap();
  await b.page.locator('[data-testid="party-hole"][data-row="0"][data-col="19"]').tap();
  await expect(b.page.getByTestId("party-blocks")).toHaveAttribute("data-moves", "2");

  // The next seat is open: both devices say the table waits for somebody to take it.
  await expect(b.page.getByTestId("online-status")).toHaveText("Waiting for somebody to take the open seat.");
  await expect(a.page.getByTestId("online-status")).toHaveText("Waiting for somebody to take the open seat.", { timeout: 20_000 });
  await fitsThePhone(b.page);

  await a.context.close();
  await b.context.close();
});
