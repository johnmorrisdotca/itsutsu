import { expect, test } from "@playwright/test";

import { gameMax } from "../src/lib/points/gamePoints";
import { memberContext, memberIdFor, removeMember, seatTokensFor, seedMember } from "./members";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * THE IP LEADERBOARDS: every game's, every family's, and the site's at /points.
 * John, 2026-09-25: "EVERY game in every family is also going to have a
 * Leaderboard. So IP matters."
 *
 * Two members of this file play Gomoku on 9×9 to a win. The winner is on the
 * site's board, which lists two hundred, with the 70 the game paid. The game's
 * and the family's boards, ten rows each, are drawn and not empty, without
 * asserting where this member stands among whoever else this database has
 * seen. A stranger is shown the shut state, never the names.
 */
test("a game won puts the winner on the IP boards, and a stranger sees them shut", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const me = { email: `ipboard-${stamp}@example.test`, name: `Ipboard ${stamp}` };
  const them = { email: `ipother-${stamp}@example.test`, name: `Ipother ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL!, me);
  try {
    const made = await context.request.post("/api/games/live", { data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 } });
    expect(made.status(), await made.text()).toBe(201);
    const { id } = (await made.json()) as { id: string };
    tidyAway(id);
    const theirs = await memberContext(browser, baseURL!, them);
    expect((await theirs.request.post(`/api/games/${id}/offer/accept`, {})).status()).toBe(200);
    await theirs.close();
    const tokens = await seatTokensFor(id);
    const moves: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${id}/moves`, {
        data: { token: index % 2 === 0 ? tokens.blackToken : tokens.whiteToken, row, col },
      });
      expect(played.status()).toBe(201);
    }
    const mine = await memberIdFor(me.email);

    const page = await context.newPage();
    // The site's board: all time, this month and this week, the winner on all three with what the game paid.
    await page.goto("/points");
    const site = page.getByTestId("site-ip-board");
    for (const table of ["site-ip-board-all", "site-ip-board-month", "site-ip-board-week"]) {
      await expect(site.getByTestId(table).locator(`[data-testid="ip-row"][data-member="${mine}"]`)).toHaveAttribute("data-ip", String(gameMax("freestyle", 9)));
    }
    // The winner's own page says the IP they won and where it puts them; the loser's says none yet.
    await page.goto(`/players/${mine}`);
    await expect(page.getByTestId("player-ip")).toHaveAttribute("data-ip", String(gameMax("freestyle", 9)));
    await expect(page.getByTestId("player-ip-all")).toHaveAttribute("data-place", /^[1-9]\d*$/);
    await expect(page.getByTestId("player-ip-month")).toHaveAttribute("href", "/points");
    await expect(page.getByTestId("player-ip-week")).toHaveAttribute("data-place", /^[1-9]\d*$/);
    await page.goto(`/players/${await memberIdFor(them.email)}`);
    await expect(page.getByTestId("player-ip")).toHaveAttribute("data-ip", "0");
    await expect(page.getByTestId("player-ip-none")).toBeVisible();

    await page.goto("/points");
    // And how a game is priced, read from the same table that pays it.
    await expect(page.locator('[data-testid="ip-maximum"][data-variant="go"]')).toContainText("19: 200");

    // The game's own board and the family's: drawn, and not empty now that a game of it has paid.
    await page.goto("/games/gomoku");
    await expect(page.getByTestId("ip-board-all").getByTestId("ip-row").first()).toBeVisible();
    await page.goto("/games/gomoku/family");
    await expect(page.getByTestId("family-ip-board-all").getByTestId("ip-row").first()).toBeVisible();

    // A stranger reads about the game and sees the board shut, not the names.
    const stranger = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const outside = await stranger.newPage();
    await outside.goto("/games/gomoku");
    await expect(outside.getByTestId("ip-board-shut")).toBeVisible();
    await expect(outside.getByTestId("ip-row")).toHaveCount(0);
    await stranger.close();
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
