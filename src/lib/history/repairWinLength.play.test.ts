import { describe, expect, it } from "vitest";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";

/**
 * Repairs games written with a win length their board cannot reach.
 *
 * A rematch or a fork took its rules from the game it copied and its win
 * length from the request, which sent none — so a three-by-three game of
 * noughts and crosses was stored asking for five in a row. Nobody can win
 * that, and the game never ends.
 *
 * The fix is in the route. This is for the games already written.
 */
const ASKED = process.env.REPAIR_WIN_LENGTH === "1";
const run = process.env.REPAIR_WIN_LENGTH_RUN === "1";

describe("games asking for a line their board cannot hold", () => {
  it.skipIf(!ASKED)("puts the win length back", async () => {
    console.log(`\nConnected to a database holding ${await prisma.game.count()} game(s).\n`);
    const games = await prisma.game.findMany({
      select: { id: true, variant: true, size: true, winLength: true, status: true, moveCount: true },
    });

    const wrong = games.filter((game) => {
      const spec = VARIANT_SPECS[game.variant as RuleVariant];
      return spec !== undefined && spec.winLength !== null && spec.winLength !== game.winLength;
    });

    for (const game of wrong) {
      const want = VARIANT_SPECS[game.variant as RuleVariant].winLength;
      console.log(
        `  ${game.id} ${game.variant} ${game.size}x${game.size}: winLength ${game.winLength} → ${want}` +
          `  (${game.status}, ${game.moveCount} moves)`,
      );
    }
    if (wrong.length === 0) console.log("  none; every game's rules fit its board.");

    if (!run) {
      console.log("\nReport only — nothing written. Set REPAIR_WIN_LENGTH_RUN=1 to repair them.\n");
      await prisma.$disconnect();
      return;
    }

    for (const game of wrong) {
      const want = VARIANT_SPECS[game.variant as RuleVariant].winLength;
      if (want === null) continue;
      await prisma.game.update({ where: { id: game.id }, data: { winLength: want } });
      console.log(`  ${game.id} repaired`);
    }
    expect(wrong.length).toBeGreaterThanOrEqual(0);
    await prisma.$disconnect();
  }, 300_000);
});
