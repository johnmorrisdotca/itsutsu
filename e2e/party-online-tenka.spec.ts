import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * TENKA ON SEVERAL DEVICES (docs/plans/party-online/README.md, stage 6): set
 * from its own set-up by pressing "Several devices", two members of this
 * spec's own, a buddy row between them made through the site, every table
 * taken away at the end.
 *
 * Who plays first is drawn from the seed the set-up drew, so the spec reads
 * which seat the table waits on rather than assuming it. That player places
 * the turn's armies, is done attacking and ends the turn, by tapping the map
 * and pressing the phase bar, as on one device; the other device sees each of
 * it arrive by its own poll, and then has the bar. A desk's width, where every
 * territory's counter is drawn whole, so a tap lands on the territory named.
 */

const DESK = { width: 1280, height: 900 };
const stamp = Date.now().toString(36);
const host = { email: `tenka-host-${stamp}@example.test`, name: `Kai-${stamp}` };
const guest = { email: `tenka-guest-${stamp}@example.test`, name: `Mio-${stamp}` };
const made: string[] = [];

test.afterAll(async () => {
  await removeTables(made);
  for (const member of [host, guest]) await removeMember(member.email);
});

async function desk(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }): Promise<{ context: BrowserContext; page: Page }> {
  const context = await memberContext(browser, baseURL, member, { viewport: DESK });
  return { context, page: await context.newPage() };
}

const table = (page: Page) => page.getByTestId("online-table");
const tenka = (page: Page) => page.getByTestId("tenka-game");

test("Tenka: a turn placed, attacked and ended on the device whose turn it is, seen arriving on the other, which then has the bar", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const a = await desk(browser, baseURL!, host);
  const b = await desk(browser, baseURL!, guest);
  const guestId = await memberIdFor(guest.email);
  expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

  // Kai sets a table for two on several devices, Mio in seat 2.
  await a.page.goto("/games/tenka/pass-and-play");
  await ready(a.page, "tenka-set-up");
  await a.page.locator('[data-testid="tenka-count"][data-value="2"]').click();
  await a.page.locator('[data-testid="tenka-length"][data-value="10"]').click();
  await a.page.getByTestId("online-where-several").click();
  await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
  await a.page.getByTestId("tenka-start").click();
  await expect(a.page).toHaveURL(/\/games\/tenka\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
  const id = new URL(a.page.url()).pathname.split("/").at(-1)!;
  made.push(id);
  await ready(a.page, "online-table");
  await expect(tenka(a.page)).toHaveAttribute("data-phase", "reinforce");

  await b.page.goto(`/games/tenka/tables/${id}`);
  await ready(b.page, "online-table");

  // Whoever the seed put first plays; the other waits, with the map, their own cards and no bar.
  const first = Number(await table(a.page).getAttribute("data-to-play"));
  const [mover, waiter] = first === 0 ? [a.page, b.page] : [b.page, a.page];
  await expect(mover.getByTestId("online-status")).toHaveText("Your turn.");
  await expect(tenka(mover)).toHaveAttribute("data-handed", "true");
  await expect(tenka(waiter)).toHaveAttribute("data-handed", "false");
  await expect(waiter.getByTestId("tenka-hand")).toBeVisible();
  await expect(mover.getByTestId("tenka-bar")).toBeVisible();
  await expect(waiter.getByTestId("tenka-territory")).toHaveCount(42);
  await expect(waiter.getByTestId("tenka-bar")).toHaveCount(0);

  // The server refuses the waiting member a move for the seat to play.
  const other = first === 0 ? b : a;
  const wrong = await other.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 0, seat: first, move: [["e"]] } });
  expect(wrong.status()).toBe(403);

  // PLACE: tap a territory of the mover's own, one army; then all the rest onto it.
  const own = mover.locator(`[data-testid="tenka-territory"][data-owner="${first}"]`).first();
  await own.click();
  await expect(tenka(mover)).toHaveAttribute("data-moves", "1");
  await mover.getByTestId("tenka-place-all").click();
  await expect(tenka(mover)).toHaveAttribute("data-phase", "attack");
  const placed = Number(await tenka(mover).getAttribute("data-moves"));

  // The waiting device sees the armies arrive, by its own poll.
  await expect(tenka(waiter)).toHaveAttribute("data-moves", String(placed), { timeout: 20_000 });
  await expect(tenka(waiter)).toHaveAttribute("data-phase", "attack");

  // Done attacking, and the turn ended: the other device has the bar.
  await mover.getByTestId("tenka-end-attack").click();
  await expect(tenka(mover)).toHaveAttribute("data-phase", "fortify");
  await mover.getByTestId("tenka-end-turn").click();
  await expect(tenka(mover)).toHaveAttribute("data-to-play", String(1 - first));
  await expect(mover.getByTestId("tenka-bar")).toHaveCount(0);
  await expect(waiter.getByTestId("online-status")).toHaveText("Your turn.", { timeout: 20_000 });
  await expect(tenka(waiter)).toHaveAttribute("data-phase", "reinforce");
  await expect(waiter.getByTestId("tenka-bar")).toBeVisible();

  await a.context.close();
  await b.context.close();
});
