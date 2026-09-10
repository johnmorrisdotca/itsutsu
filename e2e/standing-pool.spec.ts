import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { clearComputerStandings, seedComputerStandings } from "./members";

/**
 * A game somebody has only ever played against the programs.
 *
 * This is the second half of a fix that was right and incomplete. The ladder
 * of people was listing players who had never played one — a standing row
 * exists from the first finished game in EITHER pool, so reading the people
 * columns alone put somebody on the human ladder at the starting rating over
 * no games at all. Filtering those out was correct.
 *
 * It left a different untruth in its place: the game then vanished from that
 * player's own page entirely. "You have never played Reversi" is not true of
 * somebody who has played it twenty times, and a page that answers a question
 * it was never asked is the fault this repo has a gate about.
 *
 * So the row is shown, from the pool that earned it, and says which pool that
 * was. Both halves are asserted here, because either alone is a bug: present,
 * and marked.
 */
const VARIANT = "reversi";

/** The signed-in operator, whose own record page this is. */
async function myKey(): Promise<string> {
  process.loadEnvFile(".env");
  const prisma = new PrismaClient();
  try {
    const email = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "john@spxis.com";
    const me = await prisma.member.findFirst({ where: { email }, select: { name: true } });
    return (me?.name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("a game played only against the computer", () => {
  let key = "";

  test.beforeEach(async () => {
    key = await myKey();
    test.skip(key === "", "the operator has no name on this database");
    await seedComputerStandings(VARIANT, [
      { key, name: key, rating: 1662, games: 12, wins: 9, losses: 3, draws: 0 },
    ]);
  });

  test.afterEach(async () => {
    if (key !== "") await clearComputerStandings(VARIANT, [key]);
  });

  test("is still on my record, and says which ladder it is from", async ({ page }) => {
    await page.goto("/me?view=record");
    const table = page.getByTestId("me-standings");
    await expect(table).toBeVisible();

    // Present: the whole point. Before this it was absent, which said the
    // twelve games never happened.
    const row = table.locator("tr", { has: page.locator(`[data-variant="${VARIANT}"]`) });
    await expect(row).toHaveCount(1);

    // And marked, because a rating earned against the programs is a real
    // figure and is not a place among people.
    await expect(row.getByTestId("standing-pool-computer")).toBeVisible();

    // The figures are the computer pool's, not the empty people columns —
    // this is what would break if the row were shown from the wrong side.
    await expect(row.getByTestId("record-played")).toHaveText("12");
  });

  test("its counts lead to the games behind them, in the pool that counted them", async ({ page }) => {
    await page.goto("/me?view=record");
    const row = page
      .getByTestId("me-standings")
      .locator("tr", { has: page.locator(`[data-variant="${VARIANT}"]`) });

    const links = row.getByTestId("game-count");
    const found = await links.count();
    // A count that links nowhere would pass a loop over nothing.
    expect(found, "no linked counts on the row at all").toBeGreaterThan(0);

    for (let i = 0; i < found; i += 1) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      // Both halves, together. Either alone opens a wider set than the number
      // it came from, which is the same fault as no link wearing a link.
      expect(href, `${href} must name the pool`).toContain("pool=computer");
      expect(href, `${href} must name rated`).toContain("rated=yes");
    }
  });
});
