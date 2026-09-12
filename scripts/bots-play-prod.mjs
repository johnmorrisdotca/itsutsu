/**
 * Plays the bot series against PRODUCTION. Nothing to set up, ever.
 *
 * A command of its own rather than a flag on the ordinary one, because the
 * name is the warning: `pnpm bots:play` writes to the database in your .env,
 * and `pnpm bots:play:prod` writes to the live site. Nothing about the two can
 * be confused at a glance, and no argument decides which.
 *
 * The safety property is unchanged and is the point: forgetting something can
 * only ever leave you on your own database. Production is reached by asking
 * for it by name, never by omission.
 *
 * IT ASKS NEON, EVERY RUN — `scripts/neon-production.mjs` is that ask, shared
 * with `xp-backfill-prod.mjs` since a second runner needed the same answer. The
 * whole reasoning for asking Neon rather than a file or Vercel lives there.
 *
 * The connection string never reaches shell history, a scrollback, a screen
 * share, or the disk. It goes from Neon into one process's environment.
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

console.log(`\nPRODUCTION — about to use: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The runner prints how many games that");
console.log("database already holds before it writes anything.\n");

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/bots/botSeries.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, BOT_GAMES: "1" } },
);
process.exit(result.status ?? 1);
