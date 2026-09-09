import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";

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
    const me = { email: `named-${stamp}@example.test`, name: `Named ${stamp}` };
    const them = { email: `foe-${stamp}@example.test`, name: `Foe ${stamp}` };
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
    await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
    await page.goto("/games");
    const mine = page.getByTestId("my-game").filter({ hasText: me.name }).first();
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

    await page.goto(`/history/gomoku/${game.id}`);
    const header = page.getByRole("heading", { level: 1 });
    await expect(header).toContainText(me.name);
    // Both names in the header are links, which is what John reported missing.
    const named = header.getByTestId("player-name");
    await expect(named).toHaveCount(2);
    await expect(named.first()).toHaveAttribute("href", /\/players\//);

    // And following one really arrives at that person.
    await named.first().click();
    await expect(page.getByTestId("player-profile")).toContainText(me.name);

    await context.close();
  });

  test("a seat nobody has taken is described, not linked", async ({ page, request }) => {
    // The two honest exceptions: an empty chair is not a person, so it stays
    // plain rather than pointing at a page that does not exist.
    const made = await request.post("/api/games/live", {
      data: { blackName: "", whiteName: "", size: 9, open: true },
    });
    expect(made.status()).toBe(201);
    await page.goto("/games");
    const open = page.getByTestId("open-game").first();
    if (await open.isVisible()) {
      await expect(open.getByTestId("player-name")).toHaveCount(0);
    }
  });
});
