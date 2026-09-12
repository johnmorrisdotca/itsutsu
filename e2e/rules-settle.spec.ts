import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { openBoardRules } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * The rules settle when the other player arrives, not when somebody moves.
 *
 * The panel stayed a form until the first stone, so between somebody sitting
 * down and somebody playing there was a window where one seat could change
 * what the other had just agreed to. That is the door the setup screen was
 * built to close, standing open at the far end.
 */
test.describe("when a shared game's rules settle", () => {
  async function posted(request: import("@playwright/test").APIRequestContext) {
    const response = await request.post("/api/games/live", {
      data: {
        variant: "freestyle",
        size: 9,
        open: true,
        moveTimeMs: null,
        blackName: `Poster ${Date.now().toString(36)}`,
      },
    });
    expect(response.status()).toBe(201);
    /*
     * Only the poster's own token comes back for a posted seat — handing out
     * the other would be handing away the seat. Somebody answers it the way
     * anybody answers it, through /sit.
     */
    const game = (await response.json()) as { id: string; blackToken: string };
    tidyAway(game.id);
    return game;
  }

  async function answered(
    browser: import("@playwright/test").Browser,
    baseURL: string,
    id: string,
  ) {
    const stamp = Date.now().toString(36);
    const other = await memberContext(browser, baseURL, {
      email: `answerer-${stamp}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      name: `Answerer ${stamp}`,
    });
    expect((await other.request.post(`/api/games/${id}/sit`)).status()).toBe(200);
  }

  test("stay open at the route while the seat is still waiting for somebody", async ({
    page,
    request,
  }) => {
    /*
     * ASKED AT THE ROUTE, BECAUSE THE PAGE NO LONGER ASKS IT.
     *
     * This used to assert that the panel beside the board was a FORM until
     * somebody else arrived. There is no form there at any stage now: a game's
     * rules are agreed on the doorstep before the game is written, and John's
     * sentence about the board was "we do not want to see that Game board with all
     * the settings on the side". A creator who got the clock wrong cancels a board
     * with no stones on it and sets it up again.
     *
     * The RULE this file is about has not changed and is still worth a case: the
     * settings route allows a change while nobody else is in the game and refuses
     * one afterwards. That is where it lives, so that is where it is asked — and
     * it is checked BOTH ways round in the case below, because a refusal that
     * refuses everything is not a rule.
     */
    const game = await posted(request);
    const allowed = await request.put(`/api/games/${game.id}/settings`, {
      data: {
        token: game.blackToken,
        variant: "freestyle",
        size: 19,
        obstacles: "none",
        opening: "free",
        moveTimeMs: null,
        timeoutPenalty: "turn",
        drawLimit: "none",
        clockMode: "move",
        rated: true,
        allowResign: true,
        open: true,
        handicap: null,
      },
    });
    expect(allowed.status(), await allowed.text()).toBe(200);

    // And the board says the new rules rather than the ones it was written with.
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);
    await expect(page.getByTestId("shared-rules-line")).toContainText("19×19");
  });

  test("are stated beside the board whether or not anybody has arrived", async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    /*
     * The board reads the same before and after the other seat is taken, which is
     * the change: it used to be a form and then a statement, and the shape of the
     * page told a player which of two states their game was in — a distinction
     * that belongs in the panel that says a seat is still posted, not in whether
     * the rules are editable.
     */
    const game = await posted(request);
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await page.waitForURL(/\/games\/gomoku\/match\//);
    await openBoardRules(page);
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);

    await answered(browser, baseURL!, game.id);

    await page.reload();
    await openBoardRules(page);
    await expect(page.getByTestId("rules-statement")).toBeVisible();
    await expect(page.getByTestId("shared-rules-size")).toHaveCount(0);
  });

  test("are settled for a challenge from the moment it is sent", async ({ browser, baseURL }) => {
    /*
     * A CHALLENGE IS SETTLED BEFORE EITHER PLAYER LOOKS AT IT, and that is a
     * reversal of what this case used to assert.
     *
     * It used to say the rules stayed open until the invited player opened the
     * board, and that was the best answer available: the old Challenge button
     * settled nothing at all — it posted a game of Gomoku on the schema's
     * defaults — so the form beside the board was the only place a challenged
     * game's rules were ever chosen, and closing it would have left nowhere to
     * choose them.
     *
     * Every challenge is now sent FROM the setup screen with the board, the
     * clock and the rules already agreed. So the form afterwards is not a last
     * chance to decide anything; it is only a chance to move the rules under
     * somebody who already has the game in their list and has not seen it yet.
     * A challenge binds both seats the moment it is written, and being handed a
     * game is arriving at it.
     */
    const stamp = Date.now().toString(36);
    const asks = { email: `asker-${stamp}@example.com`, name: `Asker ${stamp}` };
    const answers = { email: `asked-${stamp}@example.com`, name: `Asked ${stamp}` };
    const one = await memberContext(browser, baseURL!, asks);
    const two = await memberContext(browser, baseURL!, answers);

    const started = await one.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null, challenge: answers.email },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string };
    tidyAway(game.id);

    /*
     * The challenger opens it first and sees a statement rather than a form.
     * The statement is waited FOR before the form's absence is asserted: a
     * `toHaveCount(0)` on its own passes the instant it is asked, so it cannot
     * tell "not offered" from "the page has not answered yet".
     */
    const asker = await one.newPage();
    await asker.goto(`/games/gomoku/match/${game.id}`);
    await openBoardRules(asker);
    await expect(asker.getByTestId("shared-rules-size")).toHaveCount(0);

    // And the invited player, who never agreed to anything twice.
    const asked = await two.newPage();
    await asked.goto(`/games/gomoku/match/${game.id}`);
    await openBoardRules(asked);
    await expect(asked.getByTestId("shared-rules-size")).toHaveCount(0);
  });

  test("and the server refuses a challenge's change too, not only the page", async ({
    browser,
    baseURL,
  }) => {
    /*
     * Hiding a control whose route still answers is how the seat links went
     * wrong, so the refusal is checked where it lives. The token is read from
     * the row rather than from the response, because a challenge binds white to
     * the other member and its token is deliberately never returned.
     */
    const stamp = Date.now().toString(36);
    const asks = { email: `refuser-${stamp}@example.com`, name: `Refuser ${stamp}` };
    const answers = { email: `refused-${stamp}@example.com`, name: `Refused ${stamp}` };
    const one = await memberContext(browser, baseURL!, asks);
    await memberContext(browser, baseURL!, answers);

    const started = await one.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null, challenge: answers.email },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    const refused = await one.request.put(`/api/games/${game.id}/settings`, {
      data: { token: game.blackToken, size: 19 },
    });
    expect(refused.status(), "a challenge's rules are what the other player was handed").toBe(409);
    expect((await refused.json()).reason).toBe("settled");
  });

  test("and the server refuses the change, not just the page", async ({ request, browser, baseURL }) => {
    const game = await posted(request);
    await answered(browser, baseURL!, game.id);

    // Straight at the API with a good token, past the panel that stopped offering.
    const changed = await request.put(`/api/games/${game.id}/settings`, {
      data: {
        token: game.blackToken,
        variant: "freestyle",
        size: 19,
        opening: "free",
        obstacles: "none",
        moveTimeMs: null,
        timeoutPenalty: "turn",
        drawLimit: "none",
        clockMode: "move",
        rated: true,
        allowResign: true,
        open: false,
        handicap: null,
      },
    });
    expect(changed.status()).toBe(409);
    expect(((await changed.json()) as { reason?: string }).reason).toBe("settled");

    const after = await (await request.get(`/api/games/${game.id}`)).json();
    expect(after.size).toBe(9);
  });
});
