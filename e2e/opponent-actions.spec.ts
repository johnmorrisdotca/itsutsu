import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { removeMember, seedMember } from "./members";
import { gamesMade } from "./tidy";
import { RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import { playerPath } from "../src/lib/rating/playerKey";

/**
 * What a reader can do about the people in somebody's record.
 *
 * "Every opponent you are shown offers what you would want to do about them"
 * is on this repo's own checklist, and Recent Games was where it quietly went
 * unkept: ten opponents named, each one a link to go and read about them, and
 * the decision a reader actually makes here — whether to play somebody — made
 * two pages away.
 *
 * A rule written down and not kept is worse than one nobody wrote, so this
 * holds it.
 *
 * THE RECORD IS THIS FILE'S OWN. It used to open the first computer player and
 * trust that a program "always has some" games. The ROWS are guaranteed — the
 * players page writes them — but their GAMES are not: they exist on a machine
 * where bot batches have been run, and nowhere else. On CI's fresh database
 * every computer player's page said "No finished games yet", correctly, and
 * both cases failed looking for a table that page had no reason to draw. Green
 * on the shared database, red on a fresh one — a test about this machine's
 * history wearing a test about the code (AGENTS.md, "A Spec Should Bring Its
 * Own World").
 *
 * So each case files one finished game between that computer player and a
 * member it invents, and asserts about THAT row. The two content skips that
 * used to sit here ("no recent games with a named opponent") are assertions
 * now: the spec made the opponent, so their absence is a fault, not a bare
 * database.
 */
test.describe("the opponents in a record", () => {
  const stamp = Date.now().toString(36);
  /*
   * A member with an address, because that is who is offered something: a name
   * typed at one screen is nobody to ask. Invented per run, so no other game
   * or rating is keyed to it, and taken away with the file.
   */
  const rival = { email: `opponents-${stamp}@example.test`, name: `Rival${stamp} Tester` };
  const mine = gamesMade();
  let rivalId = "";
  let filed = 0;

  test.beforeAll(async () => {
    await seedMember(rival);
    const prisma = new PrismaClient();
    try {
      const row = await prisma.member.findUnique({ where: { email: rival.email }, select: { id: true } });
      if (row === null) throw new Error("seedMember did not make the rival's row");
      rivalId = row.id;
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    await removeMember(rival.email);
  });

  /**
   * Opens the computer players, files a game for the first one listed against
   * the rival, and follows that name to its page.
   *
   * Seeded AFTER the list is read, and against whichever program the list
   * leads with, so the case keeps asserting the thing it was written to catch
   * — that the computer players are ON the players page — rather than
   * assuming one by name.
   */
  async function openAComputerPlayersRecord(page: Page): Promise<void> {
    await page.goto("/players?view=computers");
    const first = page.getByTestId("computer-player-name").first();
    /*
     * ASSERTED, not skipped. This used to be `test.skip(count === 0, "no
     * computer players on this database")`, and that guard could only ever
     * fire on the one condition it must never swallow.
     *
     * The page awaits `ensureBotMembers()` before it renders, whichever tab
     * is open, so a database with no computer players in it is not a database
     * this page can produce — it writes them itself. An empty list here is
     * therefore never "this machine is a bit bare"; it is the computer
     * players having fallen off the players page, which AGENTS.md records as
     * a REAL bug that reached review and would have reached production, and
     * which was very nearly dismissed as local noise.
     *
     * A skip reports green. So the guard was arranged to stay silent for
     * exactly the fault this file is best placed to catch.
     */
    await expect(first).toBeVisible();
    const href = await first.getAttribute("href");
    expect(href, "a computer player's name leads to their page").toMatch(/^\/players\/[^/?#]+$/);
    const botId = decodeURIComponent(href!.slice("/players/".length));

    const prisma = new PrismaClient();
    try {
      const bot = await prisma.member.findUnique({ where: { id: botId }, select: { name: true, botTier: true } });
      expect(bot?.botTier, `the first name on the computers tab (${botId}) is a program`).toBeTruthy();
      filed += 1;
      const when = new Date();
      const row = await prisma.game.create({
        data: {
          id: `${stamp.slice(-6)}-op${filed}`,
          status: "finished",
          result: "black",
          winner: "black",
          moveCount: 9,
          // Nothing here should move a rating, on this database or any other.
          rated: false,
          size: 9,
          winLength: 5,
          variant: RULE_VARIANTS.freestyle,
          obstacles: "none",
          opener: "black",
          blackName: bot!.name,
          blackMemberId: botId,
          whiteName: rival.name,
          whiteMemberId: rivalId,
          playedAt: when,
          lastMoveAt: when,
        },
        select: { id: true },
      });
      mine(row.id);
    } finally {
      await prisma.$disconnect();
    }

    await first.click();
    await expect(page).toHaveURL(href!);
    /*
     * Wait for the record to be there before looking inside it. Counting first
     * skipped a case here every time — a skip that read as "this player has no
     * opponents" and meant "I asked before the page had answered", which is the
     * quietest way for a test to say nothing at all.
     */
    await expect(page.getByTestId("player-by-variant")).toBeVisible();
  }

  /** The rival's name in Recent Games: the link this file's own game put there. */
  function rivalLink(page: Page) {
    return page.locator(`a[data-testid="player-opponent"][href="${playerPath(rival.name, rivalId)}"]`).first();
  }

  test("offer a game, beside the game they were in", async ({ page }) => {
    await openAComputerPlayersRecord(page);

    /*
     * The row this file filed, and the offer in THAT row — not "some row
     * somewhere offers something", which a record full of other people's games
     * would satisfy whatever happened to this one. Not every row can offer: an
     * opponent who never signed in is not an account to ask anything of. The
     * rival is one, so their row must.
     */
    await expect(rivalLink(page)).toBeVisible();
    const row = page.locator("li").filter({ has: rivalLink(page) }).first();
    await expect(row.getByTestId("opponent-actions"), "the rival in the record is offered nothing").toBeVisible();
  });

  test("still lead to the person, which was the only thing they used to do", async ({ page }) => {
    await openAComputerPlayersRecord(page);

    // Driven, not read: the name is followed to the person it names.
    const opponent = rivalLink(page);
    await expect(opponent).toBeVisible();
    await opponent.click();
    await expect(page).toHaveURL(playerPath(rival.name, rivalId));
    await expect(page.getByTestId("player-profile")).toBeVisible();
  });
});
