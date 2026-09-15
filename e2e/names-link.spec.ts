import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { shownName } from "../src/lib/rating/shownName";
import { namesPlayedUnder } from "./tidy";

/** The names this file's games are played under, which outlive the games. See `namesPlayedUnder`. */
const under = namesPlayedUnder();

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
      data: { blackName: under(me.name), whiteName: under(them.name), size: 9, winLength: 3 },
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

  test("a seat nobody has taken is described, not linked", async ({ page, browser, baseURL }) => {
    /*
     * The honest exception: a seat with nobody bound to it is not a person, so it
     * stays plain rather than pointing at a page that does not exist.
     *
     * No request can post one any more. Posting an open seat binds whoever posted
     * it — "Whoever starts a game is sitting at it" (games/live's route) — and a
     * bound seat is shown under its member's CURRENT name (currentNames.ts's
     * seatName), linked, which is correct for them. This used to post as an
     * invite-only identity because that one was never bound; since a code makes a
     * member account, every poster is bound. So the seat is made the way the rows
     * that ARE unbound stand — seats posted before posting bound anybody: posted
     * by a member, then the poster's id taken off the row.
     *
     * The poster is a signed member session rather than a redeemed code: a code
     * bought nothing a seeded member does not have, and redeeming spent the
     * redeem limit, which is strict and shared by every spec on the runner.
     *
     * Posted by somebody else, since a seat is not shown back to whoever put
     * it up — posting it as this reader would leave nothing on their board.
     */
    const stamp = Date.now().toString(36);
    const other = await memberContext(browser, baseURL!, {
      email: `seat-poster-${stamp}@example.test`,
      name: under(`Poster${stamp} Tester`),
    });
    const made = await other.request.post("/api/games/live", {
      data: { blackName: "", whiteName: "", size: 9, open: true },
    });
    expect(made.status(), await made.text()).toBe(201);
    const { id } = (await made.json()) as { id: string };
    await other.close();

    process.loadEnvFile(".env");
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      await prisma.game.update({ where: { id }, data: { blackMemberId: null, whiteMemberId: null } });
    } finally {
      await prisma.$disconnect();
    }

    await page.goto("/games");
    /*
     * Only the rows nobody is bound to, found by the attribute a bound row
     * carries and this one does not — rather than whichever seat happens to be
     * first on the board. One is waited for before anything is said about what
     * it lacks, so the absence below is read off a board that has answered.
     */
    const unbound = page.locator('[data-testid="open-game"]:not([data-member])');
    await expect(unbound.first()).toBeVisible();
    await expect(unbound.getByTestId("player-name")).toHaveCount(0);
  });
});
