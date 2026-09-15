/**
 * Reports what the cut-over copy of PRODUCTION's SiteSetting rows onto Sumilabu
 * would PUT. Reads production; writes nothing anywhere.
 *
 * A command of its own rather than a flag, for the reason `bots:play:prod` is:
 * the name is the warning. `site-settings:copy` reads this machine's database
 * and refuses anything else; this reads production and refuses this machine.
 * It asks Neon for the address every run (`neon-production.mjs` says why Neon),
 * and the runner reads inside a READ ONLY transaction.
 *
 * It is also the one place that may opt in to Sumilabu's LIVE project,
 * `itsutsu`, by setting SUMILABU_LIVE_OPT_IN to its own name. The opt-in does
 * not choose the project: that still needs SUMILABU_PROJECT_KEY=itsutsu and the
 * live settings token, which no checkout holds. Without them the comparison is
 * against itsutsu-dev.
 *
 *   SUMILABU_PROJECT_KEY=itsutsu pnpm site-settings:copy:prod
 */
import { spawnSync } from "node:child_process";

import { NEON_HELP, fromNeon, serverOf } from "./neon-production.mjs";

const url = fromNeon();

if (url === null) {
  console.error(["", "Could not get the production connection string from Neon, so nothing ran.", NEON_HELP].join("\n"));
  process.exit(1);
}

console.log(`\nPRODUCTION source, read only: ${serverOf(url)}`);
console.log("Fetched from Neon just now. The report writes nothing.\n");

const result = spawnSync("npx", ["vitest", "run", "src/lib/site/siteSettingsCopy.play.test.ts", "--disable-console-intercept"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    SITE_SETTINGS_COPY: "1",
    SITE_SETTINGS_SOURCE: "production",
    SUMILABU_LIVE_OPT_IN: "site-settings:copy:prod",
  },
});
process.exit(result.status ?? 1);
