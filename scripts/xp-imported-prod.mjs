/**
 * Runs the imported-XP payer against PRODUCTION. Nothing to set up, ever.
 *
 * The same shape as `xp-backfill-prod.mjs`, for the same reasons: a command of
 * its own so the name is the warning, the connection string asked of Neon every
 * run and handed to one process, and an injected `DATABASE_URL` that wins over
 * whatever `.env` says.
 *
 * AND IT STILL WRITES NOTHING WITHOUT BEING ASKED TWICE:
 *
 *   node scripts/xp-imported-prod.mjs                     what production would be paid
 *   XP_IMPORTED_RUN=1 node scripts/xp-imported-prod.mjs   pay it
 *
 * BEFORE THE SECOND: John's word, and a Neon branch. The migration that adds
 * `xpImported` and `xpEverywhere` must already be deployed, and AGENTS.md's
 * "Back It Up Before You Migrate It" applies to this write as it does to the
 * backfill's:
 *
 *   neonctl branches create --project-id calm-boat-93104880 \
 *     --org-id org-old-wave-97887412 --name before-xp-imported-<yyyy-mm-dd>
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"));
  process.exit(1);
}

const writing = process.env.XP_IMPORTED_RUN === "1";

console.log(`\nPRODUCTION — about to use: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The runner prints the host, the row");
console.log("counts and every member's plan before it writes anything.\n");
console.log(
  writing
    ? "XP_IMPORTED_RUN=1 — THIS WILL WRITE. Take a Neon branch first if you have not.\n"
    : "Report only: nothing will be written. Set XP_IMPORTED_RUN=1 to pay it.\n",
);

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/xp/importedXpPay.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, XP_IMPORTED: "1" } },
);
process.exit(result.status ?? 1);
