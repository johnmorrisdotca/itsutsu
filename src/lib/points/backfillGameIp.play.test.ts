import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { payGameIp } from "./payGameIp";

/**
 * PRICES EVERY FINISHED GAME THAT HAS NO IP YET: the games decided before IP
 * existed, and any that ended in the deploy window while the old code was
 * still live (AGENTS.md, "The deploy window drifts it"). John, 2026-09-25,
 * of games scoring nothing until now: "it's something we should've done from
 * the beginning".
 *
 * IN PROCESS, ON THIS MACHINE, as every bulk job here is ("Bulk Play Runs Here,
 * Never Through the Site"): one replay a game, on your CPU, and one small
 * update a game on the database. Nothing touches the site or Vercel.
 *
 * WRITES NOTHING UNLESS ASKED TWICE:
 *
 *   pnpm ip:backfill                         your database, a report only
 *   IP_BACKFILL_RUN=1 pnpm ip:backfill       your database, priced
 *   pnpm ip:backfill:prod                    the live site, a report only
 *   IP_BACKFILL_RUN=1 pnpm ip:backfill:prod  the live site, priced (a Neon branch first)
 *
 * A game priced here has no ratings from before it to read, so it is priced as
 * an unrated one: no bonus for an upset. Every other share is the real one, the
 * same pair the same day included. `payGameIp` prices only a game still null, so
 * a second run, or a run racing the site, pays nothing twice.
 */
const ASKED = process.env.IP_BACKFILL === "1";
const RUN = process.env.IP_BACKFILL_RUN === "1";

/** The host and database, with the credentials left out. */
function serverOf(url: string | undefined): string {
  try {
    const parsed = new URL(url ?? "");
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(unreadable)";
  }
}

describe("backfilling IP onto finished games", () => {
  it.skipIf(!ASKED)("prices every finished game that has none", async () => {
    const say = (line: string) => console.log(line);
    say(`\nDatabase: ${serverOf(process.env.DATABASE_URL)}`);
    const [games, finished] = await Promise.all([prisma.game.count(), prisma.game.count({ where: { status: "finished" } })]);
    say(`It holds ${games} games, ${finished} finished. Read that before believing the rest.`);
    const unpriced = await prisma.game.findMany({
      where: { status: "finished", blackPoints: null },
      orderBy: [{ lastMoveAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    say(`${unpriced.length} finished ${unpriced.length === 1 ? "game has" : "games have"} no IP yet.`);
    if (!RUN) {
      say("\nReport only. Nothing was written. Set IP_BACKFILL_RUN=1 to price them.");
      return;
    }
    let done = 0;
    for (const game of unpriced) {
      await payGameIp(game.id, null);
      done += 1;
      if (done % 200 === 0) say(`  ${done} of ${unpriced.length}`);
    }
    const left = await prisma.game.count({ where: { status: "finished", blackPoints: null } });
    say(`\nPriced ${done}. Finished games still without IP: ${left}.`);
    expect(left).toBe(0);
  }, 3_600_000);

  it("does nothing unless it is asked for by name", () => {
    expect(ASKED || !RUN).toBe(true);
  });
});
