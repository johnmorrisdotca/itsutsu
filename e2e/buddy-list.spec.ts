import { expect, test } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file begins, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE PEOPLE YOU PLAY, ON A PAGE OF THEIR OWN.
 *
 * John, 2026-09-21: "We need Buddy LIst page." There was a buddy list before
 * this — folded into a tab of the account screen, beside the ignore roll and
 * the invitations — and no page anywhere whose subject was the handful of
 * people somebody actually plays.
 *
 * It is held to the rule the same message set: "no game or process should take
 * 3 screens/clicks." From this page to a board against a buddy is one press on
 * the offer and one on Begin, and the last case here counts them.
 *
 * Every case brings its own world: its own member, its own buddy, its own
 * games. Nothing here asserts anything about a row it did not make.
 */
test.describe("the buddy list", () => {
  test("is a tab of its own, and says what to do when it is empty", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `lonely-${stamp}@example.test`, name: `Lonely ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto("/players?view=buddies");
    /*
     * AN EMPTY LIST IS A LIST, and it shows the way in rather than an apology.
     * Asserted after the tab strip has been seen, so the absence of rows is a
     * statement about a rendered page and not about how fast it was asked.
     */
    await expect(page.locator('[data-testid="tab"][data-tab="buddies"]')).toBeVisible();
    const list = page.getByTestId("buddy-list");
    await expect(list).toBeVisible();
    await expect(list).toContainText("Nobody yet");
    await expect(page.getByTestId("buddy-row")).toHaveCount(0);

    await context.close();
  });

  test("lists the people you starred, with what is going and a game to offer", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `starrer-${stamp}@example.test`, name: `Starrer ${stamp}` };
    const them = { email: `starred-${stamp}@example.test`, name: `Starred ${stamp}` };
    const other = { email: `nobuddy-${stamp}@example.test`, name: `Nobuddy ${stamp}` };
    await seedMember(them);
    await seedMember(other);
    const theirId = await memberIdFor(them.email);

    const context = await memberContext(browser, baseURL!, me);
    const starred = await context.request.post("/api/buddies", { data: { memberId: theirId } });
    expect(starred.status(), await starred.text()).toBeLessThan(300);

    const page = await context.newPage();
    await page.goto("/players?view=buddies");

    const row = page.locator(`[data-testid="buddy-row"][data-member="${theirId}"]`);
    await expect(row).toBeVisible();
    // Exactly the people starred, and nobody else on the site.
    await expect(page.getByTestId("buddy-row")).toHaveCount(1);
    await expect(page.getByTestId("buddy-list")).not.toContainText(other.name.split(" ")[0]);

    // Their name leads to their page, like a player's name anywhere here.
    await expect(row.getByTestId("player-name")).toHaveAttribute("href", `/players/${theirId}`);
    // And nothing is going yet, said as itself rather than left blank.
    await expect(row.getByTestId("buddy-going")).toHaveText("no games going");

    await context.close();
  });

  test("reaches a board against a buddy in two presses", async ({ browser, baseURL }) => {
    /*
     * THE COUNT IS THE POINT. John measured three — open the list of people
     * you know on the set-up screen, press them, press Begin — and said it
     * should be two. From here it is the offer and Begin, and this fails if a
     * third screen ever comes back between them.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `presser-${stamp}@example.test`, name: `Presser ${stamp}` };
    const them = { email: `pressed-${stamp}@example.test`, name: `Pressed ${stamp}` };
    await seedMember(them);
    const theirId = await memberIdFor(them.email);

    const context = await memberContext(browser, baseURL!, me);
    expect((await context.request.post("/api/buddies", { data: { memberId: theirId } })).status()).toBeLessThan(300);

    const page = await context.newPage();
    await page.goto("/players?view=buddies");
    const row = page.locator(`[data-testid="buddy-row"][data-member="${theirId}"]`);
    await expect(row).toBeVisible();

    // One.
    await row.getByTestId("challenge").click();
    await ready(page, "set-up-game");
    // It arrives already against them, which is what makes the second press enough.
    await expect(page.getByTestId("set-up-seating")).toContainText(them.name.split(" ")[0]);

    // Two.
    await page.getByTestId("set-up-start").click();
    await page.waitForURL(/\/games\/[^/]+\/match\//, { timeout: 30_000 });
    tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");

    await context.close();
  });
});
