import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { playerSlug } from "../src/lib/rating/playerKey";
import { removeMember, seedMember } from "./members";
import { ready, winningSequence } from "./support";

/**
 * A player's games of one kind, each as it ended, on one picture made in the
 * browser. The spec brings its own world: a member nobody else has, and one
 * game they won, bound to their seat by hand — the queue and the ladder are
 * not what is being tested, the picture is.
 *
 * And it counts the server's part: one read for the moves, nothing else, so
 * the promise that the picture is made in the browser is checked rather than
 * believed.
 */
test("a player's won games become one picture of how each ended, with one read and nothing else", async ({ page, request }) => {
  process.loadEnvFile(".env");
  test.skip(!isLocalDatabase(process.env.DATABASE_URL), "binds a game to a member by hand, which only a local database may have done to it");
  const stamp = Date.now().toString(36);
  const member = { email: `endings-${stamp}@example.test`, name: `Endings ${stamp}` };
  await seedMember(member);
  const prisma = new PrismaClient();
  let gameId: string | null = null;
  try {
    const row = await prisma.member.findUniqueOrThrow({ where: { email: member.email }, select: { id: true } });

    const made = await request.post("/api/games/live", { data: { size: 9 } });
    expect(made.status(), await made.text()).toBe(201);
    const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };
    gameId = game.id;
    for (const [index, [r, c]] of winningSequence().entries()) {
      const played = await request.post(`/api/games/${game.id}/moves`, {
        data: { token: index % 2 === 0 ? game.blackToken : game.whiteToken, row: r, col: c },
      });
      expect(played.status(), await played.text()).toBe(201);
    }
    // Black made five: the game is theirs, won.
    await prisma.game.update({ where: { id: game.id }, data: { blackMemberId: row.id, blackName: member.name } });

    await page.goto(`/players/${playerSlug(member.name)}`);
    await ready(page, "end-positions");

    /*
     * The site's own answers, counted: every ask to /api/. Not every request —
     * the dev server loads a chunk of code the first time a panel is pressed,
     * which is a file, not work the server does for this picture.
     */
    const asked: string[] = [];
    page.on("request", (sent) => {
      if (!sent.url().startsWith("http")) return;
      const path = new URL(sent.url()).pathname;
      if (path.startsWith("/api/")) asked.push(path);
    });
    await page.getByTestId("endings-outcome").selectOption("won");
    await page.getByTestId("make-endings").click();
    const picture = page.getByTestId("endings-picture");
    await expect(picture).toBeVisible();
    expect(await picture.getAttribute("alt")).toBe("How 1 game ended");
    expect(asked).toEqual([`/api/members/${row.id}/endings`]);

    const download = page.waitForEvent("download");
    await page.getByTestId("download-endings").click();
    expect((await download).suggestedFilename()).toBe("itsutsu-gomoku-won-endings.png");

    // And the way back: nothing they lost, so asking for their losses draws nothing and says so.
    await page.getByTestId("endings-outcome").selectOption("lost");
    await page.getByTestId("make-endings").click();
    await expect(page.getByTestId("endings-note")).toContainText("No finished games");
  } finally {
    if (gameId !== null) await prisma.game.deleteMany({ where: { id: gameId } });
    await prisma.$disconnect();
    await removeMember(member.email);
  }
});
