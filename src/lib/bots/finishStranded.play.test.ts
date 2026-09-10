import { describe, expect, it } from "vitest";

import { playBotTurns } from "@/lib/bots/botPlay";
import { prisma } from "@/lib/prisma";

/**
 * Plays out games a stopped batch left in the middle.
 *
 * Interrupting a run leaves real two-seated games with stones on them and
 * nobody to take the next turn — a bot only moves when something asks it to,
 * and the thing that was asking has gone. Finishing them is better than
 * deleting them: they are games that were played, and the moves are already
 * there.
 *
 * Guarded the same way the batch is: it reports what it would finish and does
 * nothing until asked twice.
 */
const ASKED = process.env.FINISH_STRANDED === "1";
const run = process.env.FINISH_STRANDED_RUN === "1";
/** A game with more moves than this is not stalled, it is not terminating. */
const RUNAWAY = Number(process.env.FINISH_STRANDED_MAX ?? "500");

describe("games a stopped run left in the middle", () => {
  it.skipIf(!ASKED)("plays them out", async () => {
    const held = await prisma.game.count();
    console.log(`\nConnected to a database holding ${held} game(s).\n`);

    /*
     * Only games a computer is actually sitting in, and only from the run
     * being cleaned up. A database also holds older half-played games with
     * nobody in either seat — hot-seat boards somebody walked away from — and
     * those are not this to finish: nothing would move them, and they belong
     * to whoever left them.
     */
    const since = new Date(process.env.FINISH_STRANDED_SINCE ?? "2026-09-10T00:00:00Z");
    const stranded = await prisma.game.findMany({
      where: {
        status: "active",
        openSeat: null,
        moveCount: { gt: 0 },
        playedAt: { gte: since },
        NOT: [{ blackName: "" }, { whiteName: "" }],
      },
      select: { id: true, variant: true, size: true, blackName: true, whiteName: true, moveCount: true },
      orderBy: { playedAt: "desc" },
    });

    for (const game of stranded) {
      const runaway = game.moveCount > RUNAWAY;
      console.log(
        `  ${game.id} ${game.variant} ${game.size}x${game.size}: ${game.blackName} vs ${game.whiteName}` +
          ` — ${game.moveCount} moves${runaway ? "  ← LEFT ALONE, past the runaway mark" : ""}`,
      );
    }

    if (!run) {
      console.log("\nReport only — nothing played. Set FINISH_STRANDED_RUN=1 to finish them.\n");
      await prisma.$disconnect();
      return;
    }

    for (const game of stranded) {
      /*
       * A game past the mark is left where it is on purpose. Something that
       * has run hundreds of moves without ending is not waiting for a nudge,
       * it is a game that cannot finish — and playing it further would bury
       * the evidence under another few hundred moves.
       */
      if (game.moveCount > RUNAWAY) continue;

      for (let pass = 0; pass < 400; pass += 1) {
        const before = await prisma.game.findUnique({
          where: { id: game.id },
          select: { status: true, moveCount: true },
        });
        if (before === null || before.status !== "active") break;
        await playBotTurns(game.id);
        const after = await prisma.game.findUnique({
          where: { id: game.id },
          select: { status: true, moveCount: true },
        });
        // Nothing moved: asking again would spin rather than finish.
        if (after === null || after.status !== "active" || after.moveCount === before.moveCount) break;
      }

      const ended = await prisma.game.findUnique({
        where: { id: game.id },
        select: { status: true, moveCount: true, result: true },
      });
      console.log(`  ${game.id} → ${ended?.status} ${ended?.result} after ${ended?.moveCount} moves`);
    }

    expect(stranded.length).toBeGreaterThanOrEqual(0);
    await prisma.$disconnect();
  }, 600_000);
});
