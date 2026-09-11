import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { removeGame } from "./tidy";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

/**
 * A seat posted by somebody you ignore is not on your board.
 *
 * The code said so and the code did not do it. The ignore list is kept by
 * address, because that is what somebody types when they ignore a person, and
 * a seat is keyed by member id — so the board was asking a set of addresses
 * whether it contained an id, which is a question with only one answer. The
 * comment beside it read "a seat is a way in", and the way in was open.
 */
test.describe("a seat from somebody you ignore", () => {
  test("is not offered on your board", async ({ page, browser, baseURL }) => {
    /*
     * A real second member, not the invite-holding context the rest of the
     * suite uses: an ignore is kept against an address, and that context has
     * no member row and no address to be ignored by.
     */
    const other = { email: "ignored-poster@example.test", name: "Ignored Poster" };
    const theirs = await memberContext(browser, baseURL ?? "http://localhost:6600", other);
    const posted = await theirs.request.post("/api/games/live", {
      // Named, so the board prints something this test can point at.
      data: { blackName: other.name, variant: "trapThree", size: 5, open: true, moveTimeMs: null },
    });
    expect(posted.status(), await posted.text()).toBe(201);
    const game = (await posted.json()) as { id: string };

    // Before ignoring them, their seat is on the board. By name, because that
    // is what the board prints — the id is only in the link.
    const theirSeat = page.getByTestId("open-game").filter({ hasText: shownName(other.name) });
    await page.goto("/games");
    // At least one: an earlier run may have left one of theirs standing too,
    // and the rule is about all of them, not about a particular seat.
    await expect(theirSeat.first(), "their seat was not on the board to begin with").toBeVisible();

    // Ignore them, and it goes.
    const ignored = await page.request.post("/api/ignores", { data: { email: other.email } });
    expect([200, 201]).toContain(ignored.status());
    try {
      await page.goto("/games");
      await expect(
        page.getByTestId("open-game").filter({ hasText: shownName(other.name) }),
        "a seat from an ignored member was still on the board",
      ).toHaveCount(0);
    } finally {
      /*
       * Put both back, so the next spec meets the site as it found it. The
       * seat matters as much as the ignore: a Trap Three seat left standing
       * here changed the sentence another spec was reading, and that is
       * precisely the litter this suite has been tripping over all day.
       */
      await page.request.delete("/api/ignores", { data: { email: other.email } });
      await removeGame(game.id);
      await theirs.close();
    }
  });
});
