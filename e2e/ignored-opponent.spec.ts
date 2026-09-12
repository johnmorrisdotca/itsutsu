import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { openMoreSettings, openSetUpPage } from "./support";
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
 * There used to be TWO places to check, because there were two lists: the
 * one-line sentence on /games and the setup screen. The sentence has gone and
 * with it its copy of the list — which was the half that had the bug. So this
 * is narrowed to the screen that remains rather than deleted: the behaviour
 * still matters, and dropping the assertion because one of its two surfaces
 * went away would quietly lose real coverage of the half that was correct.
 *
 * Both screens that offer an opponent are still covered: /games/new, where no
 * game has been chosen, and /games/<game>/new, where one has.
 */
test.describe("the opponent chooser obeys the ignore list", () => {
  test("drops somebody after they are ignored, wherever an opponent is chosen", async ({ browser, baseURL }) => {
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

    /*
     * The chooser is behind the summary line now, so it is OPENED rather
     * than reached past: a reader who wants to pick somebody taps that line,
     * and a test asserting about a control nobody could see would be
     * asserting about markup instead of about the screen.
     */
    const chooser = page.getByTestId("set-up-with");
    await openSetUpPage(page);
    await openMoreSettings(page);
    await expect(chooser).toContainText(shownName(them.name));

    // And where the address has already named the game, which reads the same list.
    await openSetUpPage(page, "gomoku");
    await openMoreSettings(page);
    await expect(chooser).toContainText(shownName(them.name));

    const shut = await mine.request.post("/api/ignores", { data: { email: them.email } });
    expect(shut.status()).toBeLessThan(300);

    await openSetUpPage(page);
    await openMoreSettings(page);
    await expect(chooser).toBeVisible();
    await expect(chooser).not.toContainText(shownName(them.name));
    await openSetUpPage(page, "gomoku");
    await openMoreSettings(page);
    await expect(chooser).toBeVisible();
    await expect(chooser).not.toContainText(shownName(them.name));

    await mine.close();
  });
});
