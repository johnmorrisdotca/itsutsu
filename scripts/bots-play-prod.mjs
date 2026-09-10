/**
 * Plays the bot series against PRODUCTION, without anybody pasting a
 * connection string.
 *
 * A command of its own rather than a flag on the ordinary one, because the
 * name is the warning: `pnpm bots:play` writes to the database in your .env,
 * and `pnpm bots:play:prod` writes to the live site. Nothing about the two
 * commands can be confused at a glance, and no argument decides which.
 *
 * The safety property that matters is unchanged: with neither this script nor
 * a DATABASE_URL of your own, the runner writes to your local database. There
 * is no way to reach production by forgetting something — only by asking for
 * it by name.
 *
 * The string is read from a gitignored file rather than typed, so it never
 * reaches shell history, a scrollback, or a screen share. `.env*` is ignored
 * wholesale by this repo, and `vercel env pull` writes the second path below,
 * so for most people this needs no setting up at all.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/** Where the production string may live, in the order they are tried. */
const PLACES = [".env.production.local", ".vercel/.env.production.local"];

function urlFrom(path) {
  if (!existsSync(path)) return null;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/.exec(line);
    if (match === null) continue;
    const value = match[1].trim().replace(/^["']|["']$/g, "");
    if (value.startsWith("postgres")) return value;
  }
  return null;
}

const found = PLACES.map((path) => [path, urlFrom(path)]).find(([, url]) => url !== null);

if (found === undefined) {
  console.error(
    [
      "",
      "No production connection string to use, so nothing was run.",
      "",
      `Looked in: ${PLACES.join(", ")}`,
      "",
      "Put a line reading DATABASE_URL=postgres://… in one of those, or run",
      "`vercel env pull` which writes the second one for you. Both are",
      "gitignored, and neither is read by `pnpm bots:play`.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const [where, url] = found;
console.log(`\nPRODUCTION. Connection string read from ${where}.`);
console.log("The runner prints how many games that database already holds before it writes.\n");

const result = spawnSync(
  "npx",
  ["vitest", "run", "src/lib/bots/botSeries.play.test.ts", "--disable-console-intercept"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url, BOT_GAMES: "1" } },
);
process.exit(result.status ?? 1);
