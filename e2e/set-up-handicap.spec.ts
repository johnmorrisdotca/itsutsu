import { expect, test } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";
import { openMoreSettings, ready, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * GIVING THE OTHER PLAYER A START, BEFORE THE GAME EXISTS.
 *
 * John, in the same breath as asking for this screen in front of every way into
 * a game: "Or you're playing someone who's not very strong — you want to, in the
 * settings page, give yourself a handicap to help them out."
 *
 * The engine has had handicaps since early on. `rulesFor` lays one over the
 * variant's spec for a single colour, the local board has had a panel of nine
 * toggles for it, and a shared game could display one — but nothing anywhere
 * could ASK for one. The only control a shared game had was a button beside a
 * live board that could REMOVE a handicap, which meant the one control on the
 * subject could only undo something that had no way of being done.
 *
 * It belongs on this screen by definition: it is a rule of the game, and it is
 * something the two players have to have agreed before a stone goes down.
 */
test.describe("a handicap is chosen where the rest of the rules are", () => {
  test("is offered, folded away, and opens on a colour", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `handicap-${stamp}@example.test`,
      name: `Handicap ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    /*
     * The handicap is folded with the opening, the clock, the ratings and the
     * opponent: settings about a game already chosen, behind one line. So a
     * reader opens the drawer to reach it, and so does this.
     */
    await openMoreSettings(page);

    const colour = page.getByTestId("set-up-handicap-stone");
    await expect(colour).toBeVisible();
    // Almost every game is played straight, so it opens at none.
    await expect(colour).toHaveValue("none");
    /*
     * And the toggles are not there yet. Asserted after the control that IS
     * there, or the absence would be satisfied by a page that had not rendered.
     */
    await expect(page.getByTestId("set-up-handicap-second-stone")).toHaveCount(0);

    await colour.selectOption("black");
    await expect(page.getByTestId("set-up-handicap-second-stone")).toBeVisible();

    await context.close();
  });

  test("reaches the game it was agreed for", async ({ browser, baseURL }) => {
    /*
     * The whole errand, driven: set a game up against a named opponent with a
     * handicap on one colour, start it, and read the row back. A control that
     * showed the choice and did not carry it would be worse than no control.
     */
    const stamp = Date.now().toString(36);
    const me = { email: `giver-${stamp}@example.test`, name: `Giver ${stamp}` };
    const them = { email: `given-${stamp}@example.test`, name: `Given ${stamp}` };
    await seedMember(them);
    const context = await memberContext(browser, baseURL!, me);
    const theirId = await memberIdFor(them.email);

    const page = await context.newPage();
    await page.goto(`/games/gomoku/new?against=${theirId}`);
    await ready(page, "set-up-game");
    await openMoreSettings(page);
    await expect(page.getByTestId("set-up-with")).toHaveValue(`m:${theirId}`);

    // The stronger player takes on the rules of a harder game. Black is the
    // challenger's own seat, which is the case John described.
    await page.getByTestId("set-up-handicap-stone").selectOption("black");
    await page
      .getByRole("checkbox", { name: /No double three/i })
      .first()
      .check();

    /*
     * And the summary line says so before anything is started — the same
     * sentence the panel beside the board will show once it is a game, so what
     * somebody agreed to and what they are playing read the same.
     */
    await expect(page.getByTestId("set-up-summary")).toContainText(/handicap/i);

    await startAndBegin(page);
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const made = await context.request.get(`/api/games/${id}`);
    expect(made.status()).toBe(200);
    const game = (await made.json()) as { handicap: { stone: string | null; doubleThree: boolean } };
    expect(game.handicap.stone, "the colour that agreed to play harder").toBe("black");
    expect(game.handicap.doubleThree, "and the restriction it agreed to").toBe(true);

    await context.close();
  });

  test("a handicap chosen for one colour is not handed to the other", async ({ browser, baseURL }) => {
    /*
     * Switching the colour starts from the plain game rather than carrying the
     * toggles across. A set of restrictions chosen for one player is not a set
     * chosen for their opponent, and inheriting them silently is how somebody
     * ends up agreeing to the opposite of what they meant.
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `swap-${stamp}@example.test`,
      name: `Swap ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games/gomoku/new");
    await ready(page, "set-up-game");
    await openMoreSettings(page);

    await page.getByTestId("set-up-handicap-stone").selectOption("black");
    const rule = page.getByRole("checkbox", { name: /No double three/i }).first();
    await rule.check();
    await expect(rule).toBeChecked();

    await page.getByTestId("set-up-handicap-stone").selectOption("white");
    await expect(
      page.getByRole("checkbox", { name: /No double three/i }).first(),
      "white did not inherit what was chosen for black",
    ).not.toBeChecked();

    // And taking it off altogether leaves nothing behind: the way back out.
    await page.getByTestId("set-up-handicap-stone").selectOption("none");
    await expect(page.getByTestId("set-up-handicap-second-stone")).toHaveCount(0);
    await expect(page.getByTestId("set-up-summary")).not.toContainText(/handicap/i);

    await context.close();
  });
});
