import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

import { newsFromGames, newsFromSolves, type PlannedNews } from "./siteNewsBackfill";
import { SITE_NEWS_LIST } from "./siteNews.constants";

/**
 * WRITES THE SITE'S NEWS FROM BEFORE THE NEWS EXISTED: each game's first game,
 * every member's first win and first loss, the first person to beat each top
 * grade at each game, and every best time as it was set — derived from the
 * games and solves already kept, by the live writers' own rules
 * (`siteNewsBackfill.ts`). Who took first place, and when, is not written: the
 * ratings are stored as they stand now, so that history was never kept.
 *
 * IN PROCESS, ON THIS MACHINE, as every bulk job here is ("Bulk Play Runs Here,
 * Never Through the Site"): two reads and one batch of inserts, nothing through
 * the site.
 *
 * WRITES NOTHING UNLESS ASKED TWICE:
 *
 *   pnpm news:backfill                         your database, a report only
 *   SITE_NEWS_RUN=1 pnpm news:backfill         your database, written
 *   pnpm news:backfill:prod                    the live site, a report only
 *   SITE_NEWS_RUN=1 pnpm news:backfill:prod    the live site, written (a Neon branch first)
 *
 * SAFE TO RUN AGAIN. The unique on (kind, variant, subject) is what makes each
 * fact once, and the rows go in with `skipDuplicates`: a second run, or a run
 * after the live writers have told some of these already, writes only what is
 * missing.
 */
const ASKED = process.env.SITE_NEWS === "1";
const RUN = process.env.SITE_NEWS_RUN === "1";

/** The host and database, with the credentials left out. */
function serverOf(url: string | undefined): string {
  try {
    const parsed = new URL(url ?? "");
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(unreadable)";
  }
}

function byKind(rows: readonly PlannedNews[]): string {
  return SITE_NEWS_LIST.map((kind) => `${kind} ${rows.filter((row) => row.kind === kind).length}`).join(", ");
}

describe("backfilling the site's news", () => {
  it.skipIf(!ASKED)("derives the news already made and writes what is missing", async () => {
    const say = (line: string) => console.log(line);
    say(`\nDatabase: ${serverOf(process.env.DATABASE_URL)}`);
    const [games, solves, news] = await Promise.all([prisma.game.count(), prisma.puzzleSolve.count(), prisma.siteNews.count()]);
    say(`It holds ${games} games, ${solves} puzzle solves and ${news} news rows. Read that before believing the rest.`);

    const finished = await prisma.game.findMany({
      where: { status: "finished", result: { not: "abandoned" } },
      select: { id: true, variant: true, blackMemberId: true, whiteMemberId: true, winner: true, lastMoveAt: true, playedAt: true },
    });
    const solved = await prisma.puzzleSolve.findMany({
      where: { solved: true },
      select: { memberId: true, kind: true, size: true, level: true, elapsedMs: true, finishedAt: true },
    });
    const planned = [
      ...newsFromGames(finished.map((game) => ({ ...game, endedAt: game.lastMoveAt ?? game.playedAt }))),
      ...newsFromSolves(solved),
    ];
    say(`Read ${finished.length} finished games and ${solved.length} solved puzzles.`);
    say(`Planned ${planned.length} news rows: ${byKind(planned)}.`);
    say("tookFirstPlace: none. Who led a ladder after each past game was never kept, so it is told from now on only.");

    if (!RUN) {
      say("\nReport only. Nothing was written. Set SITE_NEWS_RUN=1 to write them.");
      return;
    }
    let written = 0;
    for (let at = 0; at < planned.length; at += 500) {
      const batch = await prisma.siteNews.createMany({ data: planned.slice(at, at + 500), skipDuplicates: true });
      written += batch.count;
    }
    const after = await prisma.siteNews.count();
    say(`\nWrote ${written} rows; ${planned.length - written} were already there. The table now holds ${after}.`);
    expect(after).toBeGreaterThanOrEqual(news + written);
  }, 3_600_000);

  it("does nothing unless it is asked for by name", () => {
    expect(ASKED || !RUN).toBe(true);
  });
});
