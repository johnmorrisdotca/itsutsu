/**
 * Runs the site's news backfill against PRODUCTION: the firsts, first wins and
 * losses, top grades beaten and best times from before the news was written.
 * Nothing to set up, ever.
 *
 * A command of its own rather than a flag on the ordinary one, because the name
 * is the warning: `pnpm news:backfill` reaches the database in your .env, and
 * `pnpm news:backfill:prod` reaches the live site. Production is reached by
 * asking for it by name, never by omission — `ip-backfill-prod.mjs` says it at
 * length, and this is the same shape.
 *
 * The connection string comes from Neon each run and is injected into the one
 * child process, where it wins over the project's `.env`.
 *
 * AND IT STILL WRITES NOTHING WITHOUT BEING ASKED TWICE:
 *
 *   pnpm news:backfill:prod                    what it would write, a report only
 *   SITE_NEWS_RUN=1 pnpm news:backfill:prod    write it
 *
 * BEFORE THE SECOND, TAKE A NEON BRANCH (AGENTS.md, "Back It Up Before You
 * Migrate It"). It only inserts into `SiteNews`, and a second run inserts
 * nothing, but a bulk write to production is one.
 *
 *   neonctl branches create --project-id calm-boat-93104880 \
 *     --org-id org-old-wave-97887412 --name before-news-backfill-<yyyy-mm-dd>
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"));
  process.exit(1);
}

const writing = process.env.SITE_NEWS_RUN === "1";

console.log(`\nPRODUCTION — about to use: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The runner prints the host and the row");
console.log("counts, and what it plans, before it writes anything.\n");
if (writing) {
  console.log("SITE_NEWS_RUN=1 — THIS WILL WRITE. Take a Neon branch first if");
  console.log("you have not: see the header of this script.\n");
} else {
  console.log("Report only: nothing will be written. Set SITE_NEWS_RUN=1 to write the news.\n");
}

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/feed/siteNewsBackfill.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, SITE_NEWS: "1" } },
);
process.exit(result.status ?? 1);
