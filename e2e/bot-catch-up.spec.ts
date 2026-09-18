import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { BROWSER_REPLY_GRACE_MS } from "../src/lib/bots/bots.constants";
import { isBotId } from "../src/lib/bots/bots";
import { memberContext } from "./members";
import { aComputerOpponent, chooseOpponent, openMoreSettings, openSetUpPage, ready } from "./support";

/**
 * THE COMPUTER'S MOVE NOBODY STAYED FOR, MADE BY THE BROWSER THAT COMES BACK.
 *
 * A computer's reply is worked out in the player's own browser, and the server
 * is told not to bother (`botReply`). A tab closed mid-thought therefore leaves
 * a game waiting on a move nobody is making. The server used to play those on
 * the next read of the player's games; it costs nothing now, because the games
 * page hands them to the browser reading it — `BotCatchUp`.
 *
 * DRIVEN THE WAY A PLAYER MEETS IT: the game is set up from the setup screen,
 * and the catch-up is reached by OPENING /play and doing nothing else. Nothing
 * here calls the worker, and nothing reaches past the page to make the move.
 *
 * TWO STEPS ARE FIXTURE RATHER THAN DRIVING, and both are the world this
 * feature exists for rather than the feature itself. The abandoned move is
 * posted directly, because a spec cannot reliably close a tab inside the two
 * seconds a browser thinks for; and the game's clock is wound back, because the
 * grace is a minute of real time (`BROWSER_REPLY_GRACE_MS`) and a spec that
 * waited it out would be a minute of nothing on every run.
 *
 * IT BRINGS ITS OWN WORLD: its own member, its own game, and every assertion is
 * about that one game's record. The suite's shared database holds hundreds of
 * other people's games, and a count over any of them would be a test about this
 * machine's history.
 */

/** The record as the server holds it, read from the page so its cookies go with the request. */
async function record(page: Page, id: string): Promise<{ moves: unknown[]; size: number } | null> {
  return page.evaluate(async (gameId) => {
    const answer = await fetch(`/api/games/${gameId}`, { cache: "no-store" });
    return answer.ok ? ((await answer.json()) as { moves: unknown[]; size: number }) : null;
  }, id);
}

/**
 * A live game against a computer with the player's move played and the
 * computer's reply claimed and never posted — a tab closed mid-thought.
 *
 * Returns the game and how many moves are on it, which is the number the
 * catch-up has to beat.
 */
async function abandonedGame(context: BrowserContext): Promise<{ page: Page; id: string; played: number }> {
  const page = await context.newPage();
  await openSetUpPage(page, "gomoku");
  await openMoreSettings(page);
  await chooseOpponent(page, await aComputerOpponent(page));
  await page.getByTestId("set-up-start").click();
  await ready(page, "doorstep");
  await page.getByTestId("doorstep-begin").click();
  await page.waitForURL(/\/games\/gomoku\/match\//, { timeout: 30_000 });
  const id = /match\/([^/?#]+)/.exec(page.url())?.[1] ?? "";
  expect(id, "the match address carries the game's id").not.toBe("");

  /*
   * OFF THE BOARD FIRST. While the match page is open it answers for the
   * computer itself, which is the other path and not this one — so the
   * abandoned move has to be made from somewhere that is not thinking.
   */
  await page.goto("/games");
  const before = await record(page, id);
  expect(before, "the game just created can be read back").not.toBeNull();

  const prisma = new PrismaClient();
  try {
    /*
     * The seat key this member holds, read from the row — the fixture standing
     * in for the board, which is handed the same key by the server.
     */
    const row = await prisma.game.findUnique({
      where: { id },
      select: { blackToken: true, whiteToken: true, blackMemberId: true },
    });
    const mine = isBotId(row!.blackMemberId) ? "white" : "black";
    if (mine === "black") {
      // The move a player makes just before the tab goes: this browser claims
      // the computer's reply (`botReply`) and then never posts one.
      const middle = Math.floor(before!.size / 2);
      const posted = await page.evaluate(
        async ({ gameId, row: at, col, key }) => {
          const answer = await fetch(`/api/games/${gameId}/moves`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: key, row: at, col, botReply: true }),
          });
          return answer.status;
        },
        { gameId: id, row: middle, col: middle, key: row!.blackToken },
      );
      expect(posted, "the player's own move goes on the record").toBe(201);
    }
  } finally {
    await prisma.$disconnect();
  }

  const stuck = await record(page, id);
  return { page, id, played: stuck!.moves.length };
}

/** Winds a game's clock back, so it is past the grace on this visit. */
async function waitedLongEnough(id: string, ms: number): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.game.update({ where: { id }, data: { lastMoveAt: new Date(Date.now() - ms) } });
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("the computer's move nobody stayed for", () => {
  test("is made by the browser that opens the games page", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `catch-up-${stamp}@example.test`,
      name: `Catch up ${stamp}`,
    });
    const { page, id, played } = await abandonedGame(context);
    await waitedLongEnough(id, BROWSER_REPLY_GRACE_MS * 3);

    // And now the only act this spec is really about: opening the page.
    await page.goto("/play");

    await expect
      .poll(async () => (await record(page, id))?.moves.length ?? 0, { timeout: 60_000 })
      .toBeGreaterThan(played);

    /*
     * AND THE PAGE SAYS SO WITHOUT BEING RELOADED. A move that lands while the
     * list still files the game under "waiting on them" is a page that has to
     * be reloaded to be true, which is the half of this a record check cannot
     * see — the catch-up refreshes the page it is on.
     */
    await expect(page.getByTestId("my-games-yourMove")).toContainText(/gomoku|五目/i, { timeout: 30_000 });

    await context.close();
  });

  test("leaves a move alone while the browser that claimed it may still be thinking", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `catch-up-grace-${stamp}@example.test`,
      name: `Grace ${stamp}`,
    });
    const { page, id, played } = await abandonedGame(context);
    // Seconds old, not minutes: the board that claimed this reply has had two
    // seconds to think and is well inside its grace.
    await waitedLongEnough(id, 5_000);

    await page.goto("/play");
    /*
     * An absence after a presence: the queue is drawn and the game is in it,
     * under "waiting on them". Only then is "no move was made" a statement
     * about a page that answered rather than about how fast this ran.
     */
    await expect(page.getByTestId("my-games-theirMove")).toContainText(/gomoku|五目/i, { timeout: 30_000 });
    await page.waitForTimeout(5_000);
    expect((await record(page, id))?.moves.length, "a game inside the grace was played anyway").toBe(played);

    await context.close();
  });
});

/**
 * THE COMPUTER'S OPENING STONE, ALSO A BROWSER MOVE.
 *
 * Here for the same reason as the tests above: a computer move that used to be
 * worked out on a paid function, now worked out where every other one is. A
 * game whose OPENER is a computer — a rematch swaps the colours, a fork carries
 * a position — had its first stone played inside `POST /api/games/live`. The
 * doorstep now sends `botReply`, the same promise it makes for every move
 * after, and the board it lands you on answers.
 *
 * The game is created by request rather than by playing a game out and asking
 * for a rematch, because what is under test is the BOARD playing that stone —
 * and that is reached the way anybody reaches it, by opening the match page.
 * `opener: "white"` with the asker on black is exactly the position a rematch
 * hands over.
 */
test.describe("the computer's opening stone", () => {
  test("is played by the board, not inside the request that made the game", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `opener-${stamp}@example.test`,
      name: `Opener ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games");

    const made = await page.evaluate(async () => {
      const answer = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // What the doorstep sends for a rematch against a computer: they open,
        // and this browser promises to play their stone.
        body: JSON.stringify({
          // The variant's own name; "gomoku" is the address it is shown at.
          variant: "freestyle",
          size: 15,
          challengeId: "kyu",
          opener: "white",
          rated: false,
          botReply: true,
        }),
      });
      return { status: answer.status, body: (await answer.json()) as { id?: string } };
    });
    expect(made.status, "the game was created").toBe(201);
    const id = made.body.id ?? "";
    expect(id).not.toBe("");

    /*
     * NOTHING WAS PLAYED IN THAT REQUEST, which is the saving itself and the
     * half a "there is a stone on the board" assertion cannot see: the stone
     * appearing later proves the browser played it only if the server did not.
     */
    expect((await record(page, id))?.moves.length, "the request worked out a move after all").toBe(0);

    // The only act under test: opening the board.
    await page.goto(`/games/gomoku/match/${id}`);
    await expect
      .poll(async () => (await record(page, id))?.moves.length ?? 0, { timeout: 60_000 })
      .toBe(1);

    await context.close();
  });
});
