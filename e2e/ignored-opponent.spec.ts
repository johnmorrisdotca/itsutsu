import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

/**
 * Somebody you have shut out is not offered back to you as an opponent.
 *
 * The ignore list is a rule about who may reach you, and being offered a game
 * against them is a way in. It was doing nothing on the games page: that page
 * kept its own copy of the opponent list, and the copy asked a set of member
 * IDS whether it held an ADDRESS — a question with only one answer. The
 * comment directly above it describes catching that exact mistake for posted
 * seats; the copy underneath had the mirror image and kept it.
 *
 * Both places are checked, because the point of the fix is that there is one
 * list rather than two: the sentence on /games, and the setup screen.
 */
test.describe("the opponent chooser obeys the ignore list", () => {
  test("drops somebody after they are ignored, on both screens", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `chooser-${stamp}@example.test`, name: `Chooser ${stamp}` };
    const them = { email: `shunned-${stamp}@example.test`, name: `Shunned ${stamp}` };
    await seedMember(me);
    await seedMember(them);

    const mine = await memberContext(browser, baseURL!, me);
    const page = await mine.newPage();

    /*
     * They have to be somewhere the chooser looks. Buddies is the steady one:
     * "here now" is a half-hour window and a test that raced it would be a
     * test that passed on a fast machine.
     */
    const starred = await mine.request.post("/api/buddies", { data: { email: them.email } });
    expect(starred.status()).toBeLessThan(300);

    const chooser = page.getByTestId("start-game-with");
    await page.goto("/games");
    await expect(chooser).toContainText(shownName(them.name));

    // And on the setup screen, which reads the same list.
    await page.goto("/games/gomoku/new");
    await expect(page.getByTestId("set-up-with")).toContainText(shownName(them.name));

    const shut = await mine.request.post("/api/ignores", { data: { email: them.email } });
    expect(shut.status()).toBeLessThan(300);

    await page.goto("/games");
    await expect(chooser).not.toContainText(shownName(them.name));
    await page.goto("/games/gomoku/new");
    await expect(page.getByTestId("set-up-with")).not.toContainText(shownName(them.name));

    await mine.close();
  });
});
