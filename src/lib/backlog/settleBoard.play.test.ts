import { describe, expect, it } from "vitest";

import { fetchBoard, moveItem } from "@/lib/backlog/backlogStore";
import { prisma } from "@/lib/prisma";

/**
 * Moves rows that finished but never left "in progress".
 *
 * John, reading the board: "the dashboard says 4 things in progress. is this
 * true??" It was not. All four had shipped days earlier and nobody had moved
 * the row — which is exactly what the Board Gate exists to prevent, since a
 * board is only worth taking work from if every line on it says something
 * true.
 *
 * Named rows only. A sweep that decided for itself what looked finished would
 * be the same fault pointing the other way.
 */
const ASKED = process.env.SETTLE_BOARD === "1";
const run = process.env.SETTLE_BOARD_RUN === "1";

/** Each with the evidence it is done, so the move is checkable rather than asserted. */
const SHIPPED: Record<string, string> = {
  "Start a game as one sentence, not five cards":
    "e2e/start.spec.ts — 'starting a game is one sentence', passing. Superseded rather than contradicted by the setup-screen ticket, which is a further iteration.",
  "A features board that can be added to and taken from":
    "/backlog is live, AddBacklogItem exists, rows have been added and dropped — this row is on it",
  "Let him watch the computers play, not just read the score":
    "97 computer-against-computer games written to production and readable in the record: every ladder pairing across three unalike boards, both specialists included",
};

/**
 * And the one that is NOT done, put back where it belongs.
 *
 * I nearly closed this on the strength of a passing spec whose name matched.
 * Its detail says John ESCALATED it — he called the shipped approach "very bad
 * design" and wants a dedicated setup screen before anybody lands on something
 * that looks like a board. `rulesAreSettled()` existing is not that.
 *
 * Nobody is working on it, so "in progress" is the untrue half. Open is what
 * is true: wanted, and unclaimed.
 */
const NOT_STARTED: Record<string, string> = {
  "Settle the rules before the game exists":
    "escalated by John as 'very bad design' and asking for a setup screen that does not exist; nobody is on it",
};

describe("rows that shipped and never left in progress", () => {
  it.skipIf(!ASKED)("moves them to done", async () => {
    console.log(`\nConnected to a database holding ${await prisma.game.count()} game(s).\n`);
    const board = await fetchBoard();
    const stuck = board.filter((one) => one.status === "inProgress" && SHIPPED[one.title] !== undefined);
    const back = board.filter((one) => one.status === "inProgress" && NOT_STARTED[one.title] !== undefined);
    const others = board.filter(
      (one) =>
        one.status === "inProgress" &&
        SHIPPED[one.title] === undefined &&
        NOT_STARTED[one.title] === undefined,
    );

    for (const one of stuck) console.log(`  done: ${one.title}\n        because ${SHIPPED[one.title]}`);
    for (const one of back) console.log(`  open: ${one.title}\n        because ${NOT_STARTED[one.title]}`);
    for (const one of others) console.log(`  LEFT ALONE, not named here: ${one.title}`);

    if (!run) {
      console.log("\nReport only — nothing moved. Set SETTLE_BOARD_RUN=1 to move them.\n");
      await prisma.$disconnect();
      return;
    }

    for (const [rows, to] of [
      [stuck, "done"],
      [back, "open"],
    ] as const) {
      for (const one of rows) {
        const outcome = await moveItem(one.id, to, "settleBoard sweep");
        console.log(`  ${one.title} → ${to}: ${outcome.ok ? "moved" : `refused — ${outcome.reason}`}`);
        expect(outcome.ok).toBe(true);
      }
    }
    await prisma.$disconnect();
  }, 120_000);
});
