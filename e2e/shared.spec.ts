import { expect, test } from "@playwright/test";

import { GAME_COPY } from "../src/components/game/game.constants";
import { ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** The games the Play apart case makes, taken away when the file finishes. */
const tidyAway = gamesMade();
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
  return response.json() as Promise<{
    id: string;
    blackToken: string;
    whiteToken: string;
  }>;
}

test.describe("a game played from two devices", () => {
  test("each seat link plays its own colour, and the other side sees it", async ({
    browser,
    request,
  }) => {
    const game = await startGame(request);

    const black = await browser.newContext();
    const white = await browser.newContext();
    const blackPage = await black.newPage();
    const whitePage = await white.newPage();

    await blackPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await whitePage.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);

    await expect(blackPage.getByTestId("turn-banner")).toContainText("Your move");
    await expect(whitePage.getByTestId("turn-banner")).toContainText("Waiting");

    // The live board is server-rendered and hydrated in place, so a stone
    // played before React has it is dropped — and the other seat then waits
    // fifteen seconds for a move that was never made.
    await ready(blackPage, "shared-game");
    await blackPage.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(blackPage.getByTestId("turn-banner")).toContainText("Waiting");

    // White's board catches up on its own, without a reload.
    await expect(whitePage.getByRole("button", { name: "E5, Black stone" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(whitePage.getByTestId("turn-banner")).toContainText("Your move");

    await black.close();
    await white.close();
  });

  test("a seat link claims the seat and leaves the token out of the address", async ({
    page,
    request,
  }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);

    // The claim is in a cookie now; the bar shows the match and nothing secret.
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/0$/);
    expect(page.url()).not.toContain(game.blackToken);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");

    // And it holds across a plain visit to the match.
    await page.goto(`/games/gomoku/match/${game.id}`);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
  });

  test("a seat link with a token that fits no seat is not a page", async ({ page, request }) => {
    const game = await startGame(request);
    const response = await page.goto(`/games/gomoku/match/${game.id}/seat/not-a-token`);
    expect(response?.status()).toBe(404);
  });

  test("a seat link shows a QR code for the seat still waiting, and not for the one taken", async ({
    page,
    request,
  }) => {
    /*
     * It used to show both. The token is the whole credential — it plays that
     * seat on its own — so showing Black's link to the person who has just
     * sat down in Black is pointless, and showing it to White is handing
     * White the ability to play Black's moves. Only a seat nobody is sitting
     * in has a link worth giving out. See e2e/seat-links.spec.ts.
     */
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);

    await expect(page.getByRole("img", { name: /QR code for the White seat/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code for the Black seat/ })).toHaveCount(0);
  });

  test("someone without a token can watch but not play", async ({ page, request }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}`);

    await expect(page.getByText(/You are watching\./).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeDisabled();
    // And is never shown the seat links.
    await expect(page.getByRole("img", { name: /QR code/ })).toHaveCount(0);
  });

  test("the server refuses a move played out of turn", async ({ request }) => {
    const game = await startGame(request);

    const first = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(first.status()).toBe(201);

    const outOfTurn = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 0, col: 0 },
    });
    expect(outOfTurn.status()).toBe(409);
    expect((await outOfTurn.json()).reason).toBe("not-your-turn");
  });

  test("the lobby's Post a seat lands on the sharing panel with the other seat already open", async ({ page }) => {
    // The lobby posts a seat from its own sentence now; the fragment is the
    // way in for a bookmark, or for somebody sent the address directly.
    await page.goto("/games/gomoku/play#post-seat");
    await expect(page.getByTestId("post-seat-note")).toBeVisible();
    await expect(page.getByLabel("Open to anyone")).toBeChecked();
    await page.getByTestId("start-shared-game").click();
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/0$/);
    await expect(page.getByTestId("shared-open-line")).toContainText("posted on the games page");
  });

  test("a match says when it started, and when it finished once it is over", async ({ page, request }) => {
    const game = await startGame(request);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await expect(page.getByTestId("shared-times-line")).toContainText("Started");
    await expect(page.getByTestId("shared-times-line")).not.toContainText("finished");
    /*
     * HELD, BECAUSE THE BANNER BELOW LIVES FOR A MOMENT. Since 1e8ce53 a board
     * that sees its game end calls `router.refresh()` at once (`useLiveGame`),
     * and the page it gets back is the filed record, which has no turn banner.
     * So "Black wins" and "Finished" are on the page only between the poll that
     * brings the result and that refresh landing — under a tenth of a second in
     * the traces — and whether the two assertions saw them depended on where
     * the 2.5s poll fell against Playwright's retry steps. It failed in full
     * runs and alone alike (1 of 10, the refresh landing between the two). The
     * refresh is held here until the settled board has been read, then let
     * through; the page does nothing it would not do on a slow connection.
     */
    const refresh = new RegExp(`/match/${game.id}\\?_rsc=`);
    let handBack = () => {};
    const heldUntilRead = new Promise<void>((resolve) => (handBack = resolve));
    await page.route(refresh, async (route) => {
      await heldUntilRead;
      await route.continue();
    });
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);
    // The board learns of the end on its next poll, without a reload, and says when it came.
    await expect(page.getByTestId("turn-banner")).toContainText("Black wins", { timeout: 15_000 });
    await expect(page.getByTestId("finished-at")).toContainText("Finished");
    // Let the hand-back through and wait for it to land, so the reload below
    // does not cancel a request the route is still holding.
    const handedBack = page.waitForResponse(refresh);
    handBack();
    await handedBack;
    await page.unroute(refresh);
    // A finished match STAYS at its own address — it does not move to a second
    // one — and the filed view it reloads into says both times in its heading.
    await page.reload();
    await expect(page).toHaveURL(/\/games\/gomoku\/match\//);
    await expect(page.getByText(/Started .* · finished /).first()).toBeVisible();
  });

  test("starting a shared game from the board lands on the match", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.getByTestId("start-shared-game").click();

    // The match, with its move count on the end: a fresh board is position 0.
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/0$/);
    await expect(page.getByTestId("turn-banner")).toContainText("Your move");
  });

  test("Play apart starts the game its rules form describes", async ({ page }) => {
    /*
     * The panel renders `RulesForm` now rather than its own copy of it, so what
     * is driven here is the shared form, by the controls a reader uses: a choice
     * made in it has to be the game the button makes, or the panel is a form
     * whose answers go nowhere. The practice board is `ssr: false`, so the panel
     * and its handlers arrive together and there is no hydration window to wait out.
     */
    await page.goto("/games/gomoku/play");
    const panel = page.locator("#post-seat");
    await panel.getByTestId("shared-rules-move-time").selectOption(String(5 * 60_000));
    await panel.getByTestId("shared-rules-rated").selectOption("friendly");
    await panel.getByLabel(GAME_COPY.allowResign.label, { exact: true }).uncheck();

    // The board beside it chose the game, the board and the opening; the panel
    // says so in a line and asks none of them. Asserted after the form above was
    // used, so the absence is of a rendered panel and not of an early one.
    await expect(panel.getByTestId("shared-rules-summary")).toContainText("Gomoku");
    for (const control of ["shared-rules-variant", "shared-rules-size", "shared-rules-opening"]) {
      await expect(panel.getByTestId(control), control).toHaveCount(0);
    }

    await panel.getByTestId("start-shared-game").click();
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[a-z0-9-]+\/0$/);
    tidyAway(page.url().match(/\/match\/([a-z0-9-]+)\//)![1]);

    const summary = page.getByTestId("shared-rules").getByTestId("more-settings-summary");
    await expect(summary).toContainText("5 minutes a move");
    await expect(summary).toContainText("Friendly");
    await expect(summary).toContainText("No resigning");
  });
});
