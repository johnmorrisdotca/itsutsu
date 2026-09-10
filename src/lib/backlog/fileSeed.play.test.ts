import { describe, expect, it } from "vitest";

import { BACKLOG_SEED } from "@/lib/backlog/backlog.seed.data";
import { addItem, fetchBoard } from "@/lib/backlog/backlogStore";
import { prisma } from "@/lib/prisma";

/**
 * Puts seeded rows onto a board that is already seeded.
 *
 * `BACKLOG_SEED` is only written into an EMPTY board — deliberately, so an
 * item somebody dropped never comes back. That leaves no way to add a request
 * written down after the board went live, which is how four of them ended up
 * in the repo and on nobody's board.
 *
 * Idempotent by key: a row already there is left alone, so running this twice
 * changes nothing the second time.
 */
const ASKED = process.env.FILE_SEED === "1";
const run = process.env.FILE_SEED_RUN === "1";
/** Which keys to file. Named, so this can never sweep the whole seed onto a live board. */
const WANTED = (process.env.FILE_SEED_KEYS ?? "").split(",").map((one) => one.trim()).filter(Boolean);

describe("requests written down after the board went live", () => {
  it.skipIf(!ASKED)("files them", async () => {
    console.log(`\nConnected to a database holding ${await prisma.game.count()} game(s).\n`);
    const board = await fetchBoard();
    const already = new Set(board.map((one) => one.title.toLowerCase()));

    const missing = BACKLOG_SEED.filter(
      (one) => WANTED.includes(one.key) && !already.has(one.title.toLowerCase()),
    );
    for (const one of missing) console.log(`  would file: ${one.key} — ${one.title}`);
    if (missing.length === 0) console.log("  nothing to file; all of them are already on the board.");

    if (!run) {
      console.log("\nReport only — nothing written. Set FILE_SEED_RUN=1 to file them.\n");
      await prisma.$disconnect();
      return;
    }

    for (const one of missing) {
      const outcome = await addItem(
        { title: one.title, detail: one.detail, kind: one.kind, askedBy: one.askedBy },
        null,
      );
      console.log(`  ${one.key}: ${outcome.ok ? "filed" : `refused — ${outcome.problems.join("; ")}`}`);
      expect(outcome.ok).toBe(true);
    }
    await prisma.$disconnect();
  }, 120_000);
});
