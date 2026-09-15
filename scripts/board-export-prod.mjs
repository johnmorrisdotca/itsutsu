/**
 * Exports the PRODUCTION backlog for Sumilabu. Reads production; never writes to it.
 *
 * A command of its own rather than a flag on `pnpm board:export`, for the
 * reason `bots:play:prod` is: the name is the warning, and no argument decides
 * which database is read. `board:export` reads this machine's database and
 * refuses anything else; this reads production and refuses this machine.
 *
 * It asks Neon for the address every run (`neon-production.mjs`, which says
 * why Neon and not a file or Vercel), hands it to one process, and never
 * writes it down. The runner reads `BacklogItem` inside a READ ONLY
 * transaction, so production refuses a write from it at the database.
 *
 * This is also the one place that may opt in to Sumilabu's LIVE project,
 * `itsutsu`, by setting SUMILABU_LIVE_OPT_IN to its own name. The opt-in does
 * not choose the project: that still needs SUMILABU_PROJECT_KEY=itsutsu, and
 * the live board token, which no worktree holds. Leave either out and the
 * target is itsutsu-dev, where the runner allows a report and refuses --run.
 *
 *   pnpm board:export:prod --out /Users/john/Projects/sumilabu/backups
 *   SUMILABU_PROJECT_KEY=itsutsu pnpm board:export:prod --out … --run
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"));
  process.exit(1);
}

console.log(`\nPRODUCTION source, read only: ${serverOf(url)}`);
console.log("Fetched from Neon just now.\n");

const result = spawnSync(process.execPath, ["--env-file-if-exists=.env", "scripts/board-export.ts", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    BOARD_EXPORT_SOURCE: "production",
    SUMILABU_LIVE_OPT_IN: "board:export:prod",
  },
});
process.exit(result.status ?? 1);
