import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * PAIR GO ON SEVERAL DEVICES, WITH TWO OF THE SITE'S GO PROGRAMS AT THE TABLE:
 * the first browser spec that drives a computer seat.
 *
 * Two members of this spec's own, each in a phone-sized browser, a buddy row
 * between them made through the site. Aoi takes Black's first seat and gives
 * White's first to her buddy Kaito; Black's second and White's second go to a
 * Go program each. The order round the table is Black 1, White 1, Black 2,
 * White 2 — so after Kaito's stone both programs are to play, and the browser
 * that works their moves out must be Kaito's, whose move handed them the turn
 * (`computerDriver`). The spec reads that off the table itself: the member
 * whose browser sent the last move. Aoi's device sees all three arrive by its
 * own poll. Then the server refuses her a move for somebody else's seat, she
 * resigns for her team, and both find the table on Completed.
 */

const PHONE = { width: 390, height: 844 };
const stamp = Date.now().toString(36);
// One word each (a hyphen joins, `shownName`), so the name the site prints is the whole of it.
const host = { email: `go-host-${stamp}@example.test`, name: `Aoi-${stamp}` };
const guest = { email: `go-guest-${stamp}@example.test`, name: `Kaito-${stamp}` };
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

/** Tap an empty point on the device whose turn it is, and wait for the table's answer to show the stone there. */
async function playAt(page: Page, point: string) {
  const board = page.getByTestId("pairgo");
  const before = Number(await board.getAttribute("data-moves"));
  await page.getByRole("button", { name: `${point}, empty` }).click();
  await expect(board).toHaveAttribute("data-moves", String(before + 1));
}

test("Pair Go: two members and two Go programs, the programs' moves worked out in the browser whose move handed them the turn", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const a = await phone(browser, baseURL!, host);
  const b = await phone(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  // Aoi sets the table from Pair Go's own set-up: several devices, Kaito White's first, a program in each of the other two seats.
  await a.page.goto("/games/go/pass-and-play");
  await ready(a.page, "pairgo-set-up");
  await a.page.getByTestId("online-where-several").click();
  await expect(a.page.locator('[data-testid="online-seat-choice"][data-seat="0"]')).toHaveText("You");
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
  const program = await a.page.locator('[data-testid="online-seat-choice"][data-seat="2"] option[value^="computer:"]').first().getAttribute("value");
  expect(program).not.toBeNull();
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="2"]').selectOption(program!);
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="3"]').selectOption(program!);
  await fitsThePhone(a.page);
  await a.page.getByTestId("pairgo-start").click();
  await expect(a.page).toHaveURL(/\/games\/go\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
  const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(a.page, "online-table");
  await expect(a.page.locator('[data-testid="online-seat"][data-kind="computer"]')).toHaveCount(2);
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");

  // Kaito opens it from his inbox; it is Aoi's turn there, and his board takes no stone.
  await b.page.goto("/inbox");
  await b.page.locator('[data-testid="inbox-item"][data-kind="table-invite"]').getByTestId("inbox-open").click();
  await ready(b.page, "online-table");
  await expect(b.page.getByTestId("online-table")).toHaveAttribute("data-my-seat", "1");
  await expect(b.page.getByTestId("pairgo")).toBeVisible();
  await expect(b.page.getByRole("button", { name: "E5, empty" })).toBeDisabled();

  // Aoi's stone, from her device; Kaito's sees it arrive, and it is his turn.
  await playAt(a.page, "E5");
  await expect(b.page.getByTestId("pairgo")).toHaveAttribute("data-moves", "1", { timeout: 20_000 });
  await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");

  // Kaito's stone. Both programs are then to play, and his browser answers for them, one after the other.
  await playAt(b.page, "C3");
  await expect(b.page.getByTestId("pairgo")).toHaveAttribute("data-moves", "4", { timeout: 30_000 });
  await expect(b.page.getByTestId("online-status")).toHaveText(`Waiting on ${host.name}.`);
  // The table says whose browser sent the last move: Kaito's — the programs' moves were worked out there, not on the server.
  const table = (await (await a.context.request.get(`/api/tables/${id}`)).json()) as { lastMoverId: string; toPlay: number; moveCount: number };
  expect(table.lastMoverId).toBe(guestId);
  expect(table.toPlay).toBe(0);
  expect(table.moveCount).toBe(4);

  // Aoi's device sees all three arrive by its own poll, and it is her turn again.
  await expect(a.page.getByTestId("pairgo")).toHaveAttribute("data-moves", "4", { timeout: 20_000 });
  await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
  await fitsThePhone(a.page);

  // The server refuses a move for a seat that is not to play, even from a member at the table.
  const wrong = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 4, seat: 1, move: { kind: "pass" } } });
  expect(wrong.status()).toBe(403);
  const forAProgram = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 4, seat: 2, move: { kind: "pass" } } });
  expect(forAProgram.status()).toBe(403);

  // Aoi resigns for Black; White's two seats win, and both members find it on Completed.
  await a.page.getByTestId("pairgo-resign").click();
  await a.page.getByTestId("pairgo-resign-yes").click();
  await expect(a.page.getByTestId("online-table")).toHaveAttribute("data-state", "finished");
  await expect(a.page.getByTestId("pairgo-result")).toHaveAttribute("data-winner", "white");
  await expect(b.page.getByTestId("pairgo-result")).toHaveAttribute("data-winner", "white", { timeout: 20_000 });
  for (const [page, result] of [
    [a.page, "lost"],
    [b.page, "shared"],
  ] as const) {
    await page.goto("/play/completed");
    await expect(page.locator(`[data-testid="my-games-finished"] [data-testid="my-table"][data-table="${id}"]`)).toHaveAttribute("data-result", result);
    await fitsThePhone(page);
  }

  await a.context.close();
  await b.context.close();
});
