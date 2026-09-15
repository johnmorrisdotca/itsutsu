import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { PLAYER_STATE, ready, readyHere } from "./support";
import { namesPlayedUnder } from "./tidy";

/** The names this file's games are played under, which outlive the games. See `namesPlayedUnder`. */
const under = namesPlayedUnder();

/** Distinct per game, so two made in one millisecond are still two names. */
let made = 0;

/** Starts a server-side game and returns its id and both seat tokens. */
async function startGame(request: import("@playwright/test").APIRequestContext) {
  made += 1;
  const stamp = `${Date.now().toString(36)}${made}`;
  const response = await request.post("/api/games/live", {
    data: { blackName: under(`Kai ${stamp}`), whiteName: under(`Mio ${stamp}`), size: 9 },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; blackToken: string; whiteToken: string }>;
}

test.describe("your games", () => {
  test("a claimed seat shows in the queue, and moves between its groups", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);
    const black = await browser.newContext({ storageState: ".auth/admin.json" });
    const white = await browser.newContext({ storageState: ".auth/admin.json" });
    const blackPage = await black.newPage();
    const whitePage = await white.newPage();
    await blackPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await whitePage.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    // The row for this game, wherever it is listed: other games may be listed too.
    const row = (page: import("@playwright/test").Page) =>
      page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);

    // Nobody has moved: not started, for both.
    await blackPage.goto("/play");
    await expect(blackPage.getByTestId("my-games-unstarted").locator(row(blackPage))).toBeVisible();

    // Black plays; now it is white's move, and white's badge counts it.
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    await blackPage.goto("/play");
    await expect(blackPage.getByTestId("my-games-theirMove").locator(row(blackPage))).toBeVisible();
    await whitePage.goto("/play");
    await expect(whitePage.getByTestId("my-games-yourMove").locator(row(whitePage))).toBeVisible();
    await expect(whitePage.getByTestId("your-turn-badge")).not.toHaveText("0");

    await black.close();
    await white.close();
  });

  test("a game can be resigned from the queue, and is then filed", async ({ browser, request }) => {
    const game = await startGame(request);
    await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    const white = await browser.newContext({ storageState: ".auth/admin.json" });
    const page = await white.newPage();
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
    await page.goto("/play");

    const row = page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);
    /*
     * `readyHere` and not `ready`, because there is one of these per row: a
     * page-wide `getByTestId("resign")` on a queue with two games in it is a
     * strict-mode violation rather than a wait. The press itself needs it —
     * the trigger is server-rendered, so an early press puts no question up
     * and the line below then fails on a `-yes` button that never existed.
     */
    await readyHere(row.getByTestId("resign"));
    await row.getByTestId("resign").click();
    await row.getByTestId("resign-yes").click();
    await expect(page.getByTestId("my-games-finished").locator(row)).toBeVisible();

    // Black won by resignation, and the record says so.
    const detail = await request.get(`/api/games/${game.id}`);
    expect((await detail.json()).winner).toBe("black");
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${game.id}`));
    await white.close();
  });

  test("resigning needs a seat: the wrong token is refused, and so is none", async ({ request }) => {
    const game = await startGame(request);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: "nope" } })).status()).toBe(403);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: {} })).status()).toBe(403);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } })).status()).toBe(409);
  });
});

test.describe("open seats", () => {
  test("a game posted for anyone can be sat at by somebody else, once", async ({ browser, request, baseURL }) => {
    /*
     * Posted by a member of this case's own, not by this file's admin session.
     * "Whoever starts a game is sitting at it" (games/live's route) binds the
     * poster's member id to the seat they post, and seatName() (currentNames.ts)
     * shows a bound seat under that member's CURRENT name — so the noticeboard
     * names the host by their own member name, whatever the request typed.
     *
     * A signed member session, and not a code redeemed for the purpose. A code
     * makes a member account now, so redeeming one bought nothing a seeded member
     * does not have, and it spent the redeem limit — strict, never relieved, and
     * shared by every spec on the runner's one address, gate.spec among them. A
     * code-made account is what invite-player.spec is about; this is about a seat.
     *
     * One word, stamp and all, so the noticeboard prints it whole — `shownName`
     * shortens every word after the first to an initial — and the rows below are
     * found by the name THIS run gave its host, not by a word every earlier run's
     * seat carried too.
     */
    const stamp = Date.now().toString(36);
    const hostName = under(`Host${stamp}`);
    const host = await memberContext(browser, baseURL!, { email: `mygames-host-${stamp}@example.test`, name: hostName });
    const created = await host.request.post("/api/games/live", {
      data: { blackName: hostName, size: 9, open: true },
    });
    expect(created.status(), await created.text()).toBe(201);
    const game = (await created.json()) as { id: string; blackToken: string };
    await host.close();

    /*
     * Somebody else, and it has to be somebody else: this used to sign the
     * guest in as the same account that posted the seat, so it read as a
     * stranger answering an invitation while actually being the poster
     * answering their own — which the site now refuses.
     */
    const guest = await browser.newContext({ storageState: PLAYER_STATE });
    const page = await guest.newPage();
    await page.goto("/games");
    const row = page.getByTestId("open-game").filter({ hasText: hostName });
    await expect(row).toBeVisible();
    /*
     * Sit down is a link to the page that states the seat's game before anybody
     * sits at it; Begin there takes the seat. That button posts from the browser,
     * so it does nothing at all until React is holding it.
     */
    await row.getByTestId("sit").click();
    await expect(page).toHaveURL(new RegExp(`/begin\\?.*sit=${game.id}`));
    await ready(page, "doorstep");
    await page.getByTestId("doorstep-begin").click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/match/${game.id}`));
    await expect(page.getByTestId("turn-banner")).toContainText("Waiting");

    // The seat is gone from the board, and a second taker is refused.
    await page.goto("/games");
    await expect(page.getByTestId("open-game").filter({ hasText: hostName })).toHaveCount(0);
    expect((await request.post(`/api/games/${game.id}/sit`)).status()).toBe(409);
    await guest.close();
  });

  test("a game set up with no resigning refuses it", async ({ request }) => {
    const stamp = Date.now().toString(36);
    const created = await request.post("/api/games/live", {
      data: { blackName: under(`Kai ${stamp}`), whiteName: under(`Mio ${stamp}`), size: 9, allowResign: false },
    });
    const game = (await created.json()) as { id: string; whiteToken: string };
    const refused = await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } });
    expect(refused.status()).toBe(409);
    expect(((await refused.json()) as { reason: string }).reason).toBe("not-allowed");
  });
});

