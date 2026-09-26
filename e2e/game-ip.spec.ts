import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { gameMax } from "../src/lib/points/gamePoints";
import { memberContext, removeMember, seatTokensFor, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file makes, taken away when it finishes. */
const tidyAway = gamesMade();

/**
 * IP, ITSUTSU POINTS, PAID WHEN A GAME ENDS. John, 2026-09-25: "IP aka Points
 * is only about games. Pure ability." A win pays the game's most, a loss pays
 * nothing for having taken part (that is XP's), and the Completed tab shows
 * what the game won beside the XP it earned.
 *
 * Two members of this file play Gomoku on 9×9 to a win on the top row, through
 * the site's own moves route, so the game ends where every game ends and the
 * price is written by the real writer. Two even newcomers, so the rating adds
 * nothing: 70 to the winner, the most a Gomoku on 9×9 pays, and 0 to the loser.
 */
test("a game won pays its IP to the winner, nothing to the loser, and the row says so", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const me = { email: `ipwin-${stamp}@example.test`, name: `Ipwin ${stamp}` };
  const them = { email: `iplose-${stamp}@example.test`, name: `Iplose ${stamp}` };
  await seedMember(me);
  await seedMember(them);
  const context = await memberContext(browser, baseURL!, me);
  try {
    const made = await context.request.post("/api/games/live", { data: { challenge: them.email, variant: "freestyle", size: 9, winLength: 3 } });
    expect(made.status(), await made.text()).toBe(201);
    const { id } = (await made.json()) as { id: string };
    tidyAway(id);
    const theirs = await memberContext(browser, baseURL!, them);
    const accepted = await theirs.request.post(`/api/games/${id}/offer/accept`, {});
    expect(accepted.status(), await accepted.text()).toBe(200);
    await theirs.close();
    const tokens = await seatTokensFor(id);
    const moves: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
    for (const [index, [row, col]] of moves.entries()) {
      const played = await context.request.post(`/api/games/${id}/moves`, {
        data: { token: index % 2 === 0 ? tokens.blackToken : tokens.whiteToken, row, col },
      });
      expect(played.status()).toBe(201);
    }

    process.loadEnvFile(".env");
    if (!isLocalDatabase(process.env.DATABASE_URL)) throw new Error("This spec reads a game's row, and only on a database on this machine.");
    const prisma = new PrismaClient();
    try {
      const row = await prisma.game.findUnique({ where: { id }, select: { blackPoints: true, whitePoints: true } });
      expect(row).toEqual({ blackPoints: gameMax("freestyle", 9), whitePoints: 0 });
    } finally {
      await prisma.$disconnect();
    }

    // On the winner's Completed tab, the game's row shows the IP it won.
    const page = await context.newPage();
    await page.goto("/play?view=completed");
    await ready(page, "tabs");
    const won = page.locator(`[data-testid="my-games-finished"] [data-testid="my-game"][data-id="${id}"] [data-testid="game-ip-won"]`);
    await expect(won).toHaveAttribute("data-ip", String(gameMax("freestyle", 9)));
    await expect(won).toContainText("IP");
  } finally {
    await context.close();
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
