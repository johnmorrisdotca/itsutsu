/**
 * Runs the timeout-pass repair against PRODUCTION. Nothing to set up.
 *
 * A command of its own rather than a flag on the local one, because the name
 * is the warning — the same bargain as `xp-backfill-prod.mjs`: forgetting
 * something can only ever leave you on your own database. The connection
 * string comes from Neon, into this one child's environment, where it wins
 * over whatever `.env` says.
 *
 * AND IT STILL WRITES NOTHING WITHOUT BEING ASKED TWICE. This decides WHICH
 * database; `FORFEIT_ROWS_RUN=1` decides whether anything is written, and the
 * runner checks it, not this. So the naked command is a report:
 *
 *   node scripts/forfeit-rows-prod.mjs                       what production would have repaired
 *   FORFEIT_ROWS_RUN=1 node scripts/forfeit-rows-prod.mjs    repair it
 *
 * BEFORE THE SECOND, TAKE A NEON BRANCH. AGENTS.md's "Back It Up Before You
 * Migrate It" applies: `main` is unprotected and keeps twenty-four hours. It is
 * one column on a handful of rows, and it is still a write to games people
 * played.
 *
 *   neonctl branches create --project-id calm-boat-93104880 \
 *     --org-id org-old-wave-97887412 --name before-forfeit-rows-<yyyy-mm-dd>
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"));
  process.exit(1);
}

const writing = process.env.FORFEIT_ROWS_RUN === "1";

console.log(`\nPRODUCTION — about to use: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The runner prints the database it reached, its");
console.log("game count, and every verdict before it writes anything.\n");
if (writing) {
  console.log("FORFEIT_ROWS_RUN=1 — THIS WILL WRITE. Take a Neon branch first if you have not:");
  console.log("see the header of this script.\n");
} else {
  console.log("Report only: nothing will be written. Set FORFEIT_ROWS_RUN=1 to repair.\n");
}

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/history/forfeitRows.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, FORFEIT_ROWS: "1" } },
);
process.exit(result.status ?? 1);
