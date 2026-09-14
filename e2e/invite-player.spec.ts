import { expect, test } from "@playwright/test";

import { ADMIN_STATE, PLAYER_STATE, chooseGame, chooseRated, ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * SOMEBODY WHO CAME IN WITH AN INVITE CODE IS SIGNED IN.
 *
 * Everybody John invites arrives with a code, and a code redeemed without
 * Google behind it makes a session with no address and no member row. The
 * lobby sentence, the set-up screen and the board decided "signed in" by
 * asking for the address, so those people were offered only a board at one
 * screen, shown every choice on the set-up screen inert with Continue disabled,
 * and told to sign in — under a masthead offering to sign them out.
 *
 * What they may do is what the routes let them do, and the specs below hold
 * the pages to exactly that, both ways: a seat for anyone is theirs to post, and
 * naming somebody — a challenge, which the route refuses without an address —
 * is not offered, and the page says why in words.
 *
 * `.auth/player.json` is that reader: minted by redeeming an invite, never a
 * copy of the operator's state. Every press is a click on the control a reader
 * presses, and every absence is asserted after something on the same page has
 * been waited for.
 */

test.describe("a reader who came in with an invite code", () => {
  test.use({ storageState: PLAYER_STATE });
  const mine = gamesMade();

  test("is offered a seat for anyone in the lobby sentence, and told why nobody is named", async ({ page }) => {
    await page.goto("/games");
    await ready(page, "start-game");

    const against = page.getByTestId("start-game-with");
    await expect(against).toHaveValue("anyone");
    await expect(page.getByTestId("start-game-ask-needs-account")).toBeVisible();

    // Waited for above, so these are statements about a rendered sentence.
    await expect(against.locator("optgroup")).toHaveCount(0);
    await expect(page.getByTestId("start-game-hint")).not.toContainText(/sign in/i);
  });

  test("posts a seat for anyone from the set-up screen and lands on that game's board", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("lobby-set-up").click();
    await expect(page).toHaveURL(/\/games\/new/);
    await ready(page, "set-up-game");
    // By variant, which is how the cards are keyed: Gomoku is `freestyle`, and its address says gomoku.
    await chooseGame(page, "freestyle");
    // Friendly, so a rated seat some other run left waiting cannot be the one this sits down at.
    await chooseRated(page, false);

    const anyone = page.locator('[data-testid="set-up-opponent"][data-opponent="anyone"]');
    await expect(anyone).toHaveAttribute("data-chosen", "true");
    await expect(anyone.locator("input")).toBeEnabled();
    await expect(page.getByTestId("set-up-ask-needs-account")).toBeVisible();
    await expect(page.locator('[data-testid="set-up-opponent"][data-computer="true"] input').first()).toBeDisabled();

    const go = page.getByTestId("set-up-start");
    await expect(go).toBeEnabled();
    await expect(go, "a friendly seat already waiting at exactly this game would be sat at instead").not.toContainText(/sit/i);
    await go.click();

    await ready(page, "doorstep");
    await page.getByTestId("doorstep-begin").click();
    // The board keeps the position in the address, so a new game reads /match/<id>/0.
    await expect(page).toHaveURL(/\/games\/gomoku\/match\/[^/?#]+(?:\/\d+)?$/);
    mine(new URL(page.url()).pathname.split("/")[4]);

    // The game's own board, as the person who posted it sees it.
    await expect(page.getByTestId("turn-banner")).toBeVisible();
  });

  test("is offered nothing on a player's page that the routes behind it would refuse", async ({ page }) => {
    await page.goto("/players/dan");
    await expect(page.getByTestId("player-profile")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dan");
    await expect(page.getByTestId("player-actions")).toHaveCount(0);
  });
});

test.describe("a member, beside a reader with only an invite", () => {
  test.use({ storageState: ADMIN_STATE });

  test("is offered a game on a player's page and nothing on their own, and a challenge link does not carry an invite holder past Continue", async ({
    page,
    request,
    browser,
  }) => {
    await page.goto("/players/dan");
    const actions = page.getByTestId("player-actions");
    await expect(actions).toBeVisible();
    const challenge = actions.getByTestId("challenge");
    await expect(challenge).toBeVisible();
    const href = (await challenge.getAttribute("href")) as string;

    // The press a member makes: to the set-up screen with the program chosen.
    await challenge.click();
    await ready(page, "set-up-game");
    await expect(page.locator('[data-testid="set-up-opponent"][data-chosen="true"]')).toHaveAttribute("data-computer", "true");
    await expect(page.getByTestId("set-up-start")).toBeEnabled();

    // Their own page, found by the roster's isYou — which is decided by member id now.
    const roster = await request.get("/api/members");
    expect(roster.status()).toBe(200);
    const { items } = (await roster.json()) as { items: { id: string; isYou: boolean }[] };
    const me = items.find((one) => one.isYou);
    expect(me, "the operator's own row is marked in the roster").toBeDefined();
    await page.goto(`/players/${me?.id}`);
    await expect(page.getByTestId("player-profile")).toBeVisible();
    await expect(page.getByTestId("player-actions")).toHaveCount(0);

    // The same link, opened by somebody with an invite and no account.
    const guest = await browser.newContext({ storageState: PLAYER_STATE });
    const theirs = await guest.newPage();
    await theirs.goto(href);
    await ready(theirs, "set-up-game");
    await expect(theirs.getByTestId("set-up-ask-needs-account")).toBeVisible();
    await expect(theirs.getByTestId("set-up-start")).toBeDisabled();
    await guest.close();
  });
});

test.describe("a reader with no session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is opened nothing: the lobby is the catalogue, and setting up and players are behind the door", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("games-join")).toBeVisible();
    await expect(page.getByTestId("lobby-start")).toHaveCount(0);

    await page.goto("/games/gomoku/new");
    await expect(page).toHaveURL(/\/join/);

    await page.goto("/players/dan");
    await expect(page).toHaveURL(/\/join/);
  });
});
