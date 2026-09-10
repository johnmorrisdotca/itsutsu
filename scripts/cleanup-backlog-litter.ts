/**
 * Sweeps up the rows e2e/backlog.spec.ts left on the real board before it
 * cleaned up after itself, and puts back the two assignees a test stole.
 *
 * That test now tracks every row it creates and deletes them in an
 * `afterAll`, and the one that used to grab `.first()` and assign it to
 * "Tester" now makes its own row instead — see 62151fa and 48f8565. Neither
 * fix reaches the litter already written before it landed, or the runs since
 * that were killed mid-suite and never reached their own `afterAll` (see
 * AGENTS.md on why a Playwright run must be stopped by task id, never
 * `pkill -f playwright`). This is that one-time catch-up, requested in the
 * "End-to-end tests leave their requests on the real board" ticket.
 *
 * It is a destructive write to the board every session reads from, so it
 * defaults to a dry run. Nothing is deleted or changed until you pass --run:
 *
 *   node --env-file=.env scripts/cleanup-backlog-litter.ts            (report only)
 *   node --env-file=.env scripts/cleanup-backlog-litter.ts --run      (actually clean up)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Exactly the three titles e2e/backlog.spec.ts's `newTitle()` produces, each
// followed by the run's clock as a base36 stamp. Deliberately exact rather
// than a loose "starts with", so nothing a person titled by hand can match.
const LITTER_TITLE_PATTERNS: readonly RegExp[] = [
  /^Keyboard shortcut for the scrubber [0-9a-z]+$/,
  /^A request the API will not finish [0-9a-z]+$/,
  /^A test request that walks the board [0-9a-z]+$/,
  /^A request somebody has picked up [0-9a-z]+$/,
];

// The two rows the "an item says who has it" test used to steal by taking
// the board's first row instead of making its own. Restored to "" — the
// board's own default for an item nobody has claimed — rather than to any
// specific name, since neither seed row ever carried a real assignee.
const STOLEN_ASSIGNEE_KEYS: readonly string[] = ["features-board", "start-a-game-redesigned-as-one-sentence"];
const STOLEN_ASSIGNEE_VALUE = "Tester";

const run = process.argv.includes("--run");

const allItems = await prisma.backlogItem.findMany({
  select: { id: true, key: true, title: true, status: true, assignedTo: true },
});

const litter = allItems.filter((item) => LITTER_TITLE_PATTERNS.some((pattern) => pattern.test(item.title)));
const stolen = allItems.filter(
  (item) => STOLEN_ASSIGNEE_KEYS.includes(item.key) && item.assignedTo === STOLEN_ASSIGNEE_VALUE,
);

console.log(`${litter.length} litter row(s) found out of ${allItems.length} on the board.`);
for (const item of litter) console.log(`  delete  [${item.status}]  ${item.title}`);

console.log(`\n${stolen.length} stolen assignee(s) found.`);
for (const item of stolen) console.log(`  clear   ${item.key}  (assignedTo: "${STOLEN_ASSIGNEE_VALUE}" -> "")`);

if (!run) {
  console.log("\nDry run only — nothing changed. Pass --run to apply.");
  await prisma.$disconnect();
  process.exit(0);
}

if (litter.length > 0) {
  await prisma.backlogItem.deleteMany({ where: { id: { in: litter.map((item) => item.id) } } });
}
for (const item of stolen) {
  await prisma.backlogItem.update({ where: { id: item.id }, data: { assignedTo: "" } });
}

console.log(`\nDeleted ${litter.length} row(s), cleared ${stolen.length} assignee(s).`);
await prisma.$disconnect();
