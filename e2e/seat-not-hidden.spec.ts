import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { openGamesPage } from "./support";

/**
 * My own seat does not hide somebody else's.
 *
 * The sentence asks whether anybody is already waiting for this game at this
 * pace on this board, and keeps one seat for each such combination. It used
 * to keep the newest and then drop the reader's own — so a seat I posted a
 * minute after an identical stranger's was the newer of the two, was the one
 * kept, and was then removed for being mine. The sentence then said nobody
 * was asking. Somebody was, and we had just been told about them.
 *
 * The same shape as the bug this list was built to fix, one layer deeper:
 * something is chosen before the thing that decides whether it counts.
 */
test.describe("a seat somebody else is waiting on", () => {
  test("is still offered when I have posted an identical one myself", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const pace = "259200000";

    // A stranger posts first.
    const them = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: `not-hidden-${stamp}@example.com`,
      name: `Waiting ${stamp}`,
    });
    const theirs = await them.request.post("/api/games/live", {
      data: {
        blackName: `Waiting ${stamp}`,
        variant: "notakto",
        size: 3,
        moveTimeMs: Number(pace),
        open: true,
      },
    });
    expect(theirs.status(), await theirs.text()).toBe(201);
    await them.close();

    // Then I post one exactly like it, which is the case that broke.
    const mine = await page.request.post("/api/games/live", {
      data: { blackName: "Me", variant: "notakto", size: 3, moveTimeMs: Number(pace), open: true },
    });
    expect(mine.status()).toBe(201);

    /*
     * Waits for the sentence to say it is listening. Choosing before React
     * has attached is a choice the state never hears, and this test would
     * then fail claiming a seat was hidden when the truth is the choice of
     * game never landed — which is exactly the misreading that helper exists
     * to stop.
     */
    await openGamesPage(page);
    await page.getByTestId("start-game-variant").selectOption("notakto");
    await page.getByTestId("start-game-pace").selectOption(pace);
    await page.getByTestId("start-game-with").selectOption("anyone");

    // Theirs is still there to sit at, and it is theirs I am offered.
    await expect(
      page.getByTestId("start-game-go"),
      "my own seat hid a stranger's identical one",
    ).toContainText("Sit down with");
    await expect(page.getByTestId("start-game-hint")).toContainText(`Waiting ${stamp}`);
  });
});
