/**
 * Sweeps up the rows e2e/backlog.spec.ts left on the real board before it
 * cleaned up after itself.
 *
 * That test now tracks every row it creates and deletes them in an
 * `afterAll` — see 62151fa. That fix does not reach the litter already
 * written before it landed, or the runs since that were killed mid-suite and
 * never reached their own `afterAll` (see AGENTS.md on why a Playwright run
 * must be stopped by task id, never `pkill -f playwright`). This is that
 * one-time catch-up, requested in the "End-to-end tests leave their requests
 * on the real board" ticket.
 *
 * It used to also restore two rows a since-removed test stole by grabbing
 * the board's first row and assigning it to "Tester" instead of making its
 * own — see 48f8565. Board convergence ITS-01 removed `assignedTo` outright
 * (a row is held through a claim with a lease now, never a free-text field a
 * test could steal), so that half of this script no longer has a column to
 * clear.
 *
 * It is a destructive write to the board every session reads from, so it
 * defaults to a dry run. Nothing is deleted until you pass --run:
 *
 *   node --env-file=.env scripts/cleanup-backlog-litter.ts            (report only)
 *   node --env-file=.env scripts/cleanup-backlog-litter.ts --run      (actually clean up)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Exactly the four titles e2e/backlog.spec.ts's `newTitle()` produces, each
// followed by the run's clock as a base36 stamp. Deliberately exact rather
// than a loose "starts with", so nothing a person titled by hand can match.
const LITTER_TITLE_PATTERNS: readonly RegExp[] = [
  /^Keyboard shortcut for the scrubber [0-9a-z]+$/,
  /^A request the API will not finish [0-9a-z]+$/,
  /^A test request that walks the board [0-9a-z]+$/,
  /^A request somebody has picked up [0-9a-z]+$/,
];

const run = process.argv.includes("--run");

const allItems = await prisma.backlogItem.findMany({
  select: { id: true, key: true, title: true, status: true },
});

const litter = allItems.filter((item) => LITTER_TITLE_PATTERNS.some((pattern) => pattern.test(item.title)));

console.log(`${litter.length} litter row(s) found out of ${allItems.length} on the board.`);
for (const item of litter) console.log(`  delete  [${item.status}]  ${item.title}`);

if (!run) {
  console.log("\nDry run only — nothing changed. Pass --run to apply.");
  await prisma.$disconnect();
  process.exit(0);
}

if (litter.length > 0) {
  await prisma.backlogItem.deleteMany({ where: { id: { in: litter.map((item) => item.id) } } });
}

console.log(`\nDeleted ${litter.length} row(s).`);
await prisma.$disconnect();
