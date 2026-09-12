import { expect, request as playwrightRequest, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

/**
 * Every person's name on the site leads to that person.
 *
 * A standing rule, the twin of "every game name leads to that game", and the
 * same kind of rule: obeyed in one list, forgotten in the next list somebody
 * writes, and nobody notices until they click a name and nothing happens.
 * John found it on a finished game's header, where both players were named
 * and neither was a link.
 *
 * The test walks the rendered pages rather than checking that a component is
 * imported, because a name printed by a page that never calls the component
 * is exactly the failure this is guarding.
 */
test.describe("a person's name leads to their page", () => {
  test("on a finished game's header, and on the games somebody has going", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    /*
     * The unique part is the FIRST word, because the first name is what the
     * site now prints — a surname is not on display, so a fixture that made
     * itself unique with one could no longer find itself.
     */
    const me = { email: `named-${stamp}@example.test`, name: `Named${stamp} Tester` };
    const them = { email: `foe-${stamp}@example.test`, name: `Foe${stamp} Tester` };
    await seedMember(me);
    await seedMember(them);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    const made = await context.request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: them.name, size: 9, winLength: 3 },
    });
    expect(made.status()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };

    // The game shows in "your games" once this browser holds a seat in it.
    await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await page.goto("/play");
    const mine = page.getByTestId("my-game").filter({ hasText: shownName(me.name) }).first();
    await expect(mine).toBeVisible();
    await expect(mine.getByTestId("player-name").first()).toHaveAttribute("href", /\/players\//);

    // Play it out so there is a record with a header to look at.
    const moves: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${game.id}/moves`, {
        data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row, col },
      });
      expect(played.status()).toBe(201);
    }

    await page.goto(`/games/gomoku/match/${game.id}`);
    const header = page.getByRole("heading", { level: 1 });
    await expect(header).toContainText(shownName(me.name));
    // Both names in the header are links, which is what John reported missing.
    const named = header.getByTestId("player-name");
    await expect(named).toHaveCount(2);
    await expect(named.first()).toHaveAttribute("href", /\/players\//);

    // And following one really arrives at that person.
    await named.first().click();
    await expect(page.getByTestId("player-profile")).toContainText(shownName(me.name));

    await context.close();
  });

  test("a seat nobody has taken is described, not linked", async ({ page, request, baseURL }) => {
    /*
     * The two honest exceptions: an empty chair is not a person, so it stays
     * plain rather than pointing at a page that does not exist.
     *
     * `memberContext` cannot produce that scenario any more. Posting an open
     * seat while signed in as a real member now binds that member's id to it
     * — "Whoever starts a game is sitting at it" (games/live's route), closing
     * an exploit where a poster answered their own invitation — and a bound
     * seat is shown under its member's CURRENT name (currentNames.ts's
     * seatName) rather than under whatever the row's own field says. So a
     * blank name from a signed-in member no longer reads as nobody; it reads
     * as them, linked, which is correct for them and wrong for this test. An
     * invite-only identity is never bound, so it is the one that still is.
     *
     * Posted by somebody else, since a seat is not shown back to whoever put
     * it up — posting it as this reader would leave nothing on their board.
     */
    const minted = await request.post("/api/invites", { data: { note: "names-link-poster" } });
    expect(minted.status()).toBe(201);
    const { code } = (await minted.json()) as { code: string };
    const other = await playwrightRequest.newContext({ baseURL });
    const signedIn = await other.post("/api/session", { data: { kind: "invite", code } });
    expect(signedIn.ok()).toBe(true);

    const made = await other.post("/api/games/live", {
      data: { blackName: "", whiteName: "", size: 9, open: true },
    });
    expect(made.status()).toBe(201);
    await other.dispose();
    await page.goto("/games");
    const open = page.getByTestId("open-game").first();
    if (await open.isVisible()) {
      await expect(open.getByTestId("player-name")).toHaveCount(0);
    }
  });
});
