import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * PARTY TABLES ON SEVERAL DEVICES: two members, each in their own browser,
 * each signed in as themselves, at one table (docs/plans/party-online).
 *
 * The spec brings its own world: two members made for it, a buddy row between
 * them made through the site's own buddy route, and every table it makes taken
 * away at the end. The table is made from the game's own set-up by pressing
 * "Several devices", as a member would; each move is a tap on the device whose
 * turn it is, and the other device is watched until the move arrives by its
 * own poll — at the suite's relief, every two and a half seconds
 * (`pollEvery`), so a wait here is a wait on a condition, never on a clock.
 *
 * Both browsers are phone-sized (390 wide), so every screen here is measured
 * for sideways scroll where it is drawn.
 */

const PHONE = { width: 390, height: 844 };
const SHOTS = process.env.ONLINE_SHOTS;

const stamp = Date.now().toString(36);
// One word each (a hyphen joins, `shownName`), so the name the site prints is the whole of it.
const host = { email: `table-host-${stamp}@example.test`, name: `Hana-${stamp}` };
const guest = { email: `table-guest-${stamp}@example.test`, name: `Kenji-${stamp}` };
const third = { email: `table-third-${stamp}@example.test`, name: `Mio-${stamp}` };
const made: string[] = [];

test.afterAll(async () => {
  await removeTables(made);
  for (const member of [host, guest, third]) await removeMember(member.email);
});

/** A page as wide as a phone, for a member of this spec. */
async function phone(browser: Parameters<typeof memberContext>[0], baseURL: string, member: { email: string; name: string }): Promise<{ context: BrowserContext; page: Page }> {
  const context = await memberContext(browser, baseURL, member, { viewport: PHONE });
  return { context, page: await context.newPage() };
}

/** Nothing on the page reaches past the phone's width. */
async function fitsThePhone(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
}

/** The table's id, from the address a page is at. */
function tableIdOf(page: Page): string {
  const id = new URL(page.url()).pathname.split("/").at(-1);
  if (id === undefined) throw new Error(`No table in ${page.url()}`);
  return id;
}

/** The table as the site answers its seated member: the poll's own route. */
async function tableFor(request: APIRequestContext, id: string): Promise<{ version: number; moveCount: number; toPlay: number | null; mySeat: number; status: string }> {
  const answer = await request.get(`/api/tables/${id}`);
  expect(answer.status()).toBe(200);
  return answer.json();
}

const line = (page: Page, number: number) => page.locator(`[data-testid="dots-line"][data-line="${number}"]`);

/** Tap a line on the device whose turn it is, and wait for the table's answer to draw it there. */
async function draw(page: Page, number: number) {
  const game = page.getByTestId("dots-game");
  const before = Number(await game.getAttribute("data-lines"));
  await line(page, number).click();
  await expect(game).toHaveAttribute("data-lines", String(before + 1));
  await expect(page.locator(`[data-testid="dots-drawn"][data-line="${number}"]`)).toHaveCount(1);
}

/** The other device, having asked on its own, shows the table at this version. */
async function arrives(page: Page, version: number) {
  await expect(page.getByTestId("online-table")).toHaveAttribute("data-version", String(version), { timeout: 20_000 });
}

test.describe("Dots and Boxes on several devices", () => {
  test("a buddy is given a seat, each plays from their own device, the server refuses the wrong seat, and the finished table waits on both members' Completed", async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    const a = await phone(browser, baseURL!, host);
    const b = await phone(browser, baseURL!, guest);
    const guestId = await memberIdFor(guest.email);
    // The world: Kenji on Hana's buddy list, through the site's own buddy route.
    expect((await a.context.request.post("/api/buddies", { data: { memberId: guestId } })).status()).toBeLessThan(300);

    // Hana sets the table from the game's own set-up: two players, the smallest board, several devices, Kenji in seat 2.
    await a.page.goto("/games/dots-and-boxes");
    await ready(a.page, "party-kind-offer");
    await a.page.getByTestId("game-set-up").click();
    await ready(a.page, "dots-set-up");
    await a.page.locator('[data-testid="dots-count"][data-count="2"]').click();
    await a.page.locator('[data-testid="dots-size"][data-size="3"]').click();
    await a.page.getByTestId("online-where-several").click();
    await expect(a.page.locator('[data-testid="online-seat-choice"][data-seat="0"]')).toHaveText("You");
    await a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption(`buddy:${guestId}`);
    await expect(a.page.getByTestId("dots-start")).toContainText("Start online game");
    await fitsThePhone(a.page);
    if (SHOTS) await a.page.screenshot({ path: `${SHOTS}/online-invite-390.png`, fullPage: true });
    await a.page.getByTestId("dots-start").click();
    await expect(a.page).toHaveURL(/\/games\/dots-and-boxes\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
    const id = tableIdOf(a.page);
    made.push(id);
    await ready(a.page, "online-table");
    await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
    await expect(a.page.locator('[data-testid="online-seat"][data-seat="1"]')).toContainText(guest.name);

    // Kenji is told in his inbox, and the line there opens the table.
    await b.page.goto("/inbox");
    const invite = b.page.locator('[data-testid="inbox-item"][data-kind="table-invite"]');
    await expect(invite).toContainText(host.name);
    await invite.getByTestId("inbox-open").click();
    await expect(b.page).toHaveURL(new RegExp(`/games/dots-and-boxes/tables/${id}$`));
    await ready(b.page, "online-table");
    await expect(b.page.getByTestId("online-table")).toHaveAttribute("data-my-seat", "1");
    await expect(b.page.getByTestId("online-status")).toHaveText(`Waiting on ${host.name}.`);
    // Hana is on the site, so Kenji's page asks at the fast cadence — at the suite's relief, the floor of both (`pollEvery`).
    await expect(b.page.getByTestId("online-table")).toHaveAttribute("data-poll-hurrying", "true");
    await expect(b.page.getByTestId("online-table")).toHaveAttribute("data-poll-every", "2500");
    // Not his turn: his board offers no line to tap (asked once the board is there).
    await expect(b.page.getByTestId("dots-board")).toBeVisible();
    await expect(line(b.page, 0)).toHaveCount(0);

    // Hana draws; Kenji's device sees it arrive by itself, and it is his turn there.
    await draw(a.page, 0);
    await arrives(b.page, 1);
    await expect(b.page.locator('[data-testid="dots-drawn"][data-line="0"]')).toHaveCount(1);
    await expect(b.page.getByTestId("online-status")).toHaveText("Your turn.");
    // On his own turn his page still asks, at the ordinary cadence, and never hurries for himself.
    await expect(b.page.getByTestId("online-table")).not.toHaveAttribute("data-poll-hurrying", "true");
    if (SHOTS) await b.page.screenshot({ path: `${SHOTS}/online-seat2-390.png`, fullPage: true });
    await fitsThePhone(b.page);

    // The server refuses what the page would never send: Hana moving for Kenji's seat, a line already drawn, a stale version.
    const wrongSeat = await a.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 1, seat: 1, move: 5 } });
    expect(wrongSeat.status()).toBe(403);
    const drawnTwice = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 1, seat: 1, move: 0 } });
    expect(drawnTwice.status()).toBe(422);
    const stale = await b.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 0, seat: 1, move: 5 } });
    expect(stale.status()).toBe(409);
    // A member not at the table is told there is no such table, for the table and its moves alike.
    const c = await phone(browser, baseURL!, third);
    expect((await c.context.request.get(`/api/tables/${id}`)).status()).toBe(404);
    expect((await c.context.request.post(`/api/tables/${id}/moves`, { data: { moves: 1, seat: 1, move: 5 } })).status()).toBe(404);
    await c.context.close();

    // Kenji draws from his own device; Hana's sees it arrive.
    await draw(b.page, 12);
    await arrives(a.page, 2);
    await expect(a.page.getByTestId("online-status")).toHaveText("Your turn.");
    if (SHOTS) await a.page.screenshot({ path: `${SHOTS}/online-seat1-390.png`, fullPage: true });

    // Both wait on My games, the table under "At a table", whose turn it is said on each.
    await b.page.goto("/play");
    await expect(b.page.locator(`[data-testid="my-table"][data-table="${id}"]`)).toContainText(`${host.name}’s move`);
    await b.page.goBack();
    await ready(b.page, "online-table");

    // The rest of the lines through the site's own move route, each from the member whose turn it is — all but the last.
    let table = await tableFor(a.context.request, id);
    for (let next = 1; next < 24; next += 1) {
      if (next === 12) continue;
      if (next === 23) break;
      const mover = table.toPlay === 0 ? a.context.request : b.context.request;
      const sent = await mover.post(`/api/tables/${id}/moves`, { data: { moves: table.moveCount, seat: table.toPlay, move: next } });
      expect(sent.status(), await sent.text()).toBe(200);
      table = await sent.json();
    }

    // The last line, tapped on the device whose turn it is; both devices end on the result.
    const last = table.toPlay === 0 ? a.page : b.page;
    const other = last === a.page ? b.page : a.page;
    await arrives(last, table.version);
    await draw(last, 23);
    await expect(last.getByTestId("online-table")).toHaveAttribute("data-state", "finished");
    await expect(last.getByTestId("dots-winner")).toBeVisible();
    // A finished table asks nothing more.
    await expect(last.getByTestId("online-table")).toHaveAttribute("data-poll-every", "0");
    // The other device was waiting on this one, so it sees the end arrive by itself.
    await arrives(other, table.version + 1);
    await expect(other.getByTestId("dots-winner")).toBeVisible();

    // Each finds it on Completed, with how it went for them; and each is told in their inbox.
    for (const one of [a.page, b.page]) {
      await one.goto("/play/completed");
      const row = one.locator(`[data-testid="my-games-finished"] [data-testid="my-table"][data-table="${id}"]`);
      await expect(row).toBeVisible();
      await expect(row).toHaveAttribute("data-result", /^(won|lost|shared)$/);
      await fitsThePhone(one);
      await one.goto("/inbox");
      await expect(one.locator('[data-testid="inbox-item"][data-kind="table-over"]').first()).toBeVisible();
    }
    // And it has left Going.
    await a.page.goto("/play");
    await expect(a.page.getByTestId("tables-going")).toBeVisible();
    await expect(a.page.locator(`[data-testid="my-table"][data-table="${id}"]`)).toHaveCount(0);

    await a.context.close();
    await b.context.close();
  });

  test("an open seat is taken by its link, and leaving gives it back", async ({ browser, baseURL }) => {
    const a = await phone(browser, baseURL!, host);
    const c = await phone(browser, baseURL!, third);

    await a.page.goto("/games/dots-and-boxes/pass-and-play");
    await ready(a.page, "dots-set-up");
    await a.page.locator('[data-testid="dots-count"][data-count="2"]').click();
    await a.page.getByTestId("online-where-several").click();
    await expect(a.page.locator('[data-testid="online-seat-choice"][data-seat="1"]')).toHaveAttribute("data-choice", "link");
    await a.page.getByTestId("dots-start").click();
    await expect(a.page).toHaveURL(/\/tables\/[a-z0-9-]+$/);
    const id = tableIdOf(a.page);
    made.push(id);
    await ready(a.page, "online-table");

    // The open seat's link, in the card every seat link is handed over in.
    const card = a.page.getByTestId("online-seat-link");
    await expect(card.getByRole("img")).toBeVisible();
    const link = new URL(await a.page.getByTestId("online-seat-link-address").inputValue()).pathname;
    expect(link).toMatch(new RegExp(`^/games/dots-and-boxes/tables/${id}/seat/`));
    await fitsThePhone(a.page);

    // Mio opens it, signed in, and is seated; Hana's table shows her there, and the link has gone.
    await c.page.goto(link);
    await expect(c.page).toHaveURL(new RegExp(`/tables/${id}$`));
    await ready(c.page, "online-table");
    await expect(c.page.getByTestId("online-table")).toHaveAttribute("data-my-seat", "1");
    await draw(a.page, 5);
    await arrives(c.page, 2);
    await expect(a.page.locator('[data-testid="online-seat"][data-seat="1"]')).toContainText(third.name);
    await expect(a.page.getByTestId("online-seat-link")).toHaveCount(0);

    // A used link seats nobody else: opened again by Hana, who is already at the table, it only brings her to it.
    await a.page.goto(link);
    await expect(a.page).toHaveURL(new RegExp(`/tables/${id}`));

    // Mio leaves; her seat opens again with a fresh link, and the table waits on it.
    await c.page.getByTestId("online-leave").click();
    await c.page.getByTestId("online-confirm-yes").click();
    await expect(c.page).toHaveURL(/\/play$/);
    await a.page.goto(`/games/dots-and-boxes/tables/${id}`);
    await ready(a.page, "online-table");
    await expect(a.page.locator('[data-testid="online-seat"][data-seat="1"]')).toHaveAttribute("data-kind", "open");
    await expect(a.page.getByTestId("online-status")).toHaveText("Waiting for somebody to take the open seat.");
    const fresh = new URL(await a.page.getByTestId("online-seat-link-address").inputValue()).pathname;
    expect(fresh).not.toBe(link);

    await a.context.close();
    await c.context.close();
  });
});
