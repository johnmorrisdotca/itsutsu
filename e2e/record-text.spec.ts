import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { memberContext, removeMember, seedMember } from "./members";
import { ready } from "./support";
import { removeGames } from "./tidy";

/**
 * The whole record, as text somebody can take with you.
 *
 * The point of the feature is that it can be selected and copied, so what is
 * checked here is that it really is on the page as text — a header row and
 * one line per game, inside a block a person can select — rather than a table
 * that only looks like text.
 */
test.describe("the record as plain text", () => {
  const stamp = Date.now().toString(36);
  const member = { email: `record-text-${stamp}@example.test`, name: `Record Reader ${stamp}` };
  const made: string[] = [];

  /*
   * THIS SPEC BRINGS ITS OWN GAME. An empty record prints "No games yet." and
   * no columns, so on a fresh database — a new worktree, a clean runner — the
   * headings below could never be there. It used to pass only where earlier
   * runs had left finished games behind. One friendly game, finished and
   * filed under this spec's own member: nobody's standing is written, and it
   * is removed afterwards.
   */
  test.beforeAll(async () => {
    process.loadEnvFile(".env");
    expect(isLocalDatabase(process.env.DATABASE_URL), "this spec writes rows, so only to a database on this machine").toBe(
      true,
    );
    await seedMember(member);
    const prisma = new PrismaClient();
    try {
      const row = await prisma.member.findUnique({ where: { email: member.email }, select: { id: true } });
      expect(row).not.toBeNull();
      const id = `rtx-${stamp}`;
      const at = new Date(Date.now() - 60_000);
      await prisma.game.create({
        data: {
          id,
          variant: "freestyle",
          size: 15,
          winLength: 5,
          obstacles: "none",
          opener: "black",
          status: "finished",
          result: "black",
          winner: "black",
          rated: false,
          playedAt: at,
          lastMoveAt: at,
          moveCount: 9,
          blackName: member.name,
          blackMemberId: row!.id,
          whiteName: `Rin${stamp}`,
        },
      });
      made.push(id);
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    await removeGames(made);
    await removeMember(member.email);
  });

  test("is on the record page, folded away, with the columns a listing needs", async ({
    browser,
    baseURL,
  }) => {
    const context = await memberContext(browser, baseURL!, member);
    const page = await context.newPage();
    await page.goto("/history");

    const block = page.getByTestId("record-text");
    await expect(block).toBeVisible();
    // The block is server-rendered, so seeing it proves only that the HTML
    // arrived. Its summary clicked before the page hydrates can end up shut
    // again, which is how this failed its first attempt on PR #26 (run
    // 35002182271). Wait for the mark before looking at the fold or opening it.
    await ready(page, "record-text");

    // Folded away until it is asked for: it is a long listing, and the page
    // is a table first.
    const listing = block.locator("pre");
    await expect(listing).toBeHidden();

    await block.locator("summary").click();
    await expect(listing).toBeVisible();

    const text = (await listing.textContent()) ?? "";
    expect(text).toContain("Itsutsu");
    for (const heading of ["Date", "Game", "Black", "White", "Result", "Moves"]) {
      expect(text).toContain(heading);
    }
    // At least the game this spec filed, as a dated line.
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}/);

    await expect(block.getByTestId("record-text-copy")).toBeVisible();
    await context.close();
  });
});
