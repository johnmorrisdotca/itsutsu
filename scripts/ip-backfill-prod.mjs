/**
 * Runs the IP backfill against PRODUCTION: prices every finished game with no IP. Nothing to set up, ever.
 *
 * A command of its own rather than a flag on the ordinary one, because the name
 * is the warning: `pnpm ip:backfill` reaches the database in your .env, and
 * `pnpm ip:backfill:prod` reaches the live site. Nothing about the two can be
 * confused at a glance, and no argument decides which.
 *
 * The safety property is the one `bots:play:prod` has and is the point:
 * forgetting something can only ever leave you on your own database.
 * Production is reached by asking for it by name, never by omission.
 *
 * AND `.env` CANNOT UNDO THAT. The generated Prisma client loads the project's
 * own `.env` itself — which is what lets `pnpm ip:backfill` reach your database
 * with nothing set in the shell. This injects `DATABASE_URL` into the child's
 * environment, and an injected variable WINS over the file the client loads, so
 * a `.env` pointing at localhost cannot quietly redirect a production run.
 * Checked rather than reasoned: an inline `DATABASE_URL` naming a database that
 * does not exist makes the runner fail on that name, not fall back to `.env`.
 *
 * AND IT STILL WRITES NOTHING WITHOUT BEING ASKED TWICE. This only decides
 * WHICH database; `IP_BACKFILL_RUN=1` is what decides whether anything is
 * written, and it is checked by the runner and not here. So the naked command
 * is a report about production — which is exactly what somebody wants before
 * agreeing to a run:
 *
 *   pnpm ip:backfill:prod                     how many production games have no IP yet
 *   IP_BACKFILL_RUN=1 pnpm ip:backfill:prod   price them
 *
 * BEFORE THE SECOND OF THOSE, TAKE A NEON BRANCH. AGENTS.md's "Back It Up
 * Before You Migrate It" applies in full: `main` is unprotected, history
 * retention is twenty-four hours, and no snapshot has ever been taken. This
 * writes two numbers onto every finished game with none, so it is a bulk write
 * to the games table even though it is not a migration.
 *
 *   neonctl branches create --project-id calm-boat-93104880 \
 *     --org-id org-old-wave-97887412 --name before-ip-backfill-<yyyy-mm-dd>
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(
    ["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"),
  );
  process.exit(1);
}

const writing = process.env.IP_BACKFILL_RUN === "1";

console.log(`\nPRODUCTION — about to use: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The runner prints the host, the row");
console.log("counts and every member's plan before it writes anything.\n");
if (writing) {
  console.log("IP_BACKFILL_RUN=1 — THIS WILL WRITE. Take a Neon branch first if");
  console.log("you have not: see the header of this script.\n");
} else {
  console.log("Report only: nothing will be written. Set IP_BACKFILL_RUN=1 to price them.\n");
}

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/points/backfillGameIp.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, IP_BACKFILL: "1" } },
);
process.exit(result.status ?? 1);
