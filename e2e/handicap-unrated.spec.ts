import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { playerKey } from "../src/lib/rating/playerKey";
import { memberContext, memberIdFor, removeMember, seatTokensFor, seedMember } from "./members";
import { chosenOpponent, openMoreSettings, ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

const prisma = new PrismaClient();
test.afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * A GAME WITH A HANDICAP MOVES NOBODY'S RATING, AND EVERY PAGE SAYS SO.
 *
 * A handicap game was rated like any other, so both players' ratings moved over
 * a game one of them had agreed to play on harder rules. John, asked whether it
 * should: "Fine don't".
 *
 * Driven the way a reader gets there: choose a handicap on the set-up screen and
 * see it will not count, take it off and see the choice come back, put it on
 * again and see the doorstep say the same, begin, play it out, and open the
 * filed game — which says why it did not count. And then the ladder itself, for
 * the two names this spec made: no rating row for either.
 *
 * Its own world: two fresh members, and the one game between them.
 */
test("a handicap chosen on the set-up screen makes a game that says it will not count, and does not", async ({
  browser,
  baseURL,
}) => {
  const stamp = Date.now().toString(36);
  const me = { email: `handicap-giver-${stamp}@example.test`, name: `Giver ${stamp}` };
  const them = { email: `handicap-taker-${stamp}@example.test`, name: `Taker ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL!, me);
  const theirId = await memberIdFor(them.email);
  const page = await context.newPage();

  try {
    await page.goto(`/games/gomoku/new?against=${theirId}`);
    await ready(page, "set-up-game");
    await openMoreSettings(page);
    await expect(chosenOpponent(page)).toHaveAttribute("data-opponent", `m:${theirId}`);

    // Played straight, whether it counts is a choice: two tiles, and no refusal.
    await expect(page.getByTestId("set-up-rated")).toHaveCount(2);
    await expect(page.getByTestId("set-up-rated-fact")).toHaveCount(0);

    // A handicap on black: the choice is replaced by the fact.
    const colour = page.getByTestId("set-up-handicap-stone");
    await colour.selectOption("black");
    await page.getByRole("checkbox", { name: /No double three/i }).first().check();
    const fact = page.getByTestId("set-up-rated-fact");
    await expect(fact).toHaveAttribute("data-refused", "handicap");
    await expect(fact).toContainText("This game will not count");
    await expect(fact).toContainText("handicap");
    // And the line over Continue, which says what the press will carry, says it too.
    await expect(page.getByTestId("set-up-recap")).toContainText("Will not count");
    // The tiles are gone — asserted after the fact that took their place was seen.
    await expect(page.getByTestId("set-up-rated")).toHaveCount(0);

    // And the way back: take the handicap off, and the choice is offered again.
    await colour.selectOption("none");
    await expect(page.getByTestId("set-up-rated")).toHaveCount(2);
    await expect(page.getByTestId("set-up-rated-fact")).toHaveCount(0);

    // On again, and on to the doorstep, which states the same fact.
    await colour.selectOption("black");
    await page.getByRole("checkbox", { name: /No double three/i }).first().check();
    await expect(page.getByTestId("set-up-rated-fact")).toHaveAttribute("data-refused", "handicap");
    await page.getByTestId("set-up-start").click();
    await ready(page, "doorstep");
    await expect(page.getByTestId("rules-statement")).toContainText("Will not count — a handicap");
    await expect(page.getByTestId("doorstep-facts")).toContainText("Will not count");
    await page.getByTestId("doorstep-begin").click();
    await page.waitForURL(/\/games\/gomoku\/match\/[^/]+$/, { timeout: 30_000 });

    const id = page.url().split("/").pop()!;
    tidyAway(id);
    const made = await context.request.get(`/api/games/${id}`);
    expect(made.status()).toBe(200);
    const game = (await made.json()) as { rated: boolean; handicap: { stone: string | null } };
    expect(game.handicap.stone, "the handicap it was set up with").toBe("black");
    expect(game.rated, "stored as a game that does not count").toBe(false);

    // A challenge is an offer; the other player accepts it before either side can move.
    const theirs = await memberContext(browser, baseURL!, them);
    const accepted = await theirs.request.post(`/api/games/${id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);
    await theirs.close();

    // Played out: five in a row for black, white well out of the way.
    const tokens = await seatTokensFor(id);
    const moves: [number, number][] = [
      [2, 1],
      [6, 1],
      [2, 2],
      [6, 3],
      [2, 3],
      [6, 5],
      [2, 4],
      [6, 7],
      [2, 5],
    ];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${id}/moves`, {
        data: { token: index % 2 === 0 ? tokens.blackToken : tokens.whiteToken, row, col },
      });
      expect(played.status(), await played.text()).toBe(201);
    }

    // The filed game says why it did not count.
    await page.goto(`/games/gomoku/match/${id}`);
    const unrated = page.getByTestId("record-unrated");
    await expect(unrated).toContainText("This game did not count");
    await expect(unrated).toContainText("One side took a handicap");

    // And it did not: no rating row for either name, asked after the result was seen on the page.
    const standings = await prisma.playerVariantRating.findMany({
      where: { key: { in: [playerKey(me.name), playerKey(them.name)] } },
      select: { key: true, variant: true, ratedGames: true },
    });
    expect(standings, "a handicap game moved a rating").toEqual([]);
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
