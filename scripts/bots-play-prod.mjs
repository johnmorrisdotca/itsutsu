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
 * IT ASKS NEON, EVERY RUN. Not a file, and not Vercel.
 *
 * Not a file, because a file is a thing to set up, to forget, and to go stale
 * pointing somewhere it should not. Neon is where the database actually is, so
 * the answer is fetched from there at the moment it is needed and never
 * written down.
 *
 * Not Vercel, and this one cost an evening between two people: DATABASE_URL is
 * marked Sensitive there, so `vercel env pull` writes the literal string
 * [SENSITIVE] into the file however it is invoked. It fails quietly and looks
 * exactly like a wrong flag or a permission problem — I read that placeholder
 * myself and concluded the environment was withholding it from me. It was
 * Vercel doing what sensitive variables do.
 *
 * The connection string never reaches shell history, a scrollback, a screen
 * share, or the disk. It goes from Neon into one process's environment.
 */
import { spawnSync } from "node:child_process";

/** Which database. Neither of these is a secret; the string they fetch is. */
const NEON = ["--project-id", "calm-boat-93104880", "--org-id", "org-old-wave-97887412"];

/**
 * Ask Neon for the connection string.
 *
 * Tries an installed `neonctl` first and falls back to fetching it, so this
 * works on a machine that has never seen the tool.
 */
function fromNeon() {
  for (const [command, ...prefix] of [["neonctl"], ["npx", "--yes", "neonctl"]]) {
    const got = spawnSync(
      command,
      [...prefix, "connection-string", "main", ...NEON, "--database-name", "neondb", "--pooled"],
      { encoding: "utf8" },
    );
    const value = (got.stdout ?? "").trim();
    if (got.status === 0 && value.startsWith("postgres")) return value;
  }
  return null;
}

const url = fromNeon();

if (url === null) {
  console.error(
    [
      "",
      "Could not get the production connection string from Neon, so nothing ran.",
      "",
      "Almost always this means the machine is not signed in to Neon:",
      "",
      "  npx neonctl auth",
      "",
      "Then run this again.",
      "",
      "Do NOT reach for `vercel env pull` instead. DATABASE_URL is marked",
      "Sensitive in Vercel, so a pull writes the literal string [SENSITIVE]",
      "into the file however it is invoked — it fails quietly and looks like a",
      "wrong flag. Neon is where the database is, so Neon is what to ask.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

/** The host and database, with the credentials left out. */
function serverOf(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "an address this script could not read";
  }
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
