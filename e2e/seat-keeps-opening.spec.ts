import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { chooseBoard, chooseGame, chooseOpening, chooseOpponent, openMoreSettings, openSetUpPage, ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/** The seat this file posts, taken away when it finishes, and the name it was posted under. */
const made = gamesMade();
const under = namesPlayedUnder();

/**
 * A POSTED SEAT IS ONLY OFFERED WHEN ITS GAME IS THE ONE CHOSEN.
 *
 * Asking for a game somebody is already asking for sits you down at their
 * seat rather than posting a second one beside it. The set-up screen decided
 * "the same game" on the game, the board and the pace — so a reader who chose
 * Pro, with nobody named, was offered a stranger's Free seat on the same
 * board, and the page before the game then stated that stranger's rules:
 * Free, and "Sit down with" them. The opening they chose was quietly gone.
 *
 * This spec brings its own world: a stranger it makes posts a Free seat, and
 * everything asserted is about that seat, by the name it was posted under. It
 * is taken away afterwards. Driven by clicking, and nothing reloads.
 */
test.describe("a posted seat keeps the opening somebody chose", () => {
  test("a Free seat is not offered to a Pro chooser, and is offered again once Free is chosen", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const waiting = `Waiting ${stamp}`;
    // Three days a move: a pace the set-up offers, and one both sides say out loud.
    const pace = "259200000";

    const them = await memberContext(browser, baseURL ?? "http://localhost:6600", {
      email: `keeps-opening-${stamp}@example.com`,
      name: waiting,
    });
    const posted = await them.request.post("/api/games/live", {
      data: { blackName: under(waiting), variant: "freestyle", size: 15, moveTimeMs: Number(pace), open: true },
    });
    expect(posted.status(), await posted.text()).toBe(201);
    made(((await posted.json()) as { id: string }).id);
    await them.close();

    await openSetUpPage(page);
    await chooseGame(page, "freestyle");
    await chooseBoard(page, 15);
    await openMoreSettings(page);
    await page.getByTestId("shared-rules-move-time").selectOption(pace);
    await chooseOpponent(page, "anyone");

    // The control case: on Free, the stranger's seat IS what was asked for.
    await expect(page.getByTestId("set-up-match")).toContainText(waiting);

    // Pro is not what they posted. Asked after the Pro tile is chosen and the form re-read.
    await chooseOpening(page, "pro");
    await expect(page.getByTestId("set-up-start")).toBeVisible();
    await expect(page.getByTestId("set-up-game"), "offered a Free seat for a Pro game").not.toContainText(waiting);

    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    // What the page states, first: the opening chosen.
    await expect(page.getByTestId("rules-statement")).toContainText("Pro");
    // Then what it must not: sitting down with the stranger at their Free game.
    await expect(page.getByTestId("doorstep"), "the doorstep sits down at a Free seat").not.toContainText(waiting);

    // The way back: Free again, and the stranger's seat is offered again.
    await page.getByTestId("doorstep-change").click();
    await ready(page, "set-up-game");
    await openMoreSettings(page);
    await chooseOpening(page, "free");
    await expect(page.getByTestId("set-up-match")).toContainText(waiting);
  });
});
