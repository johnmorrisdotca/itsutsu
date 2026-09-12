/**
 * The production connection string, asked of Neon, every run.
 *
 * Extracted from `bots-play-prod.mjs` when a SECOND runner needed the same
 * answer (`xp-backfill-prod.mjs`), and extracted rather than copied for the
 * reason this project applies to every rule: two copies of the Neon project id
 * and two copies of the warning below are two things to keep in step, and the
 * warning is the half that cost an evening.
 *
 * IT ASKS NEON, EVERY RUN. Not a file, and not Vercel.
 *
 * Not a file, because a file is a thing to set up, to forget, and to go stale
 * pointing somewhere it should not. Neon is where the database actually is, so
 * the answer is fetched from there at the moment it is needed and never written
 * down.
 *
 * Not Vercel, and this one cost an evening between two people: DATABASE_URL is
 * marked Sensitive there, so `vercel env pull` writes the literal string
 * [SENSITIVE] into the file however it is invoked. It fails quietly and looks
 * exactly like a wrong flag or a permission problem — one of them read that
 * placeholder and concluded the environment was withholding it. It was Vercel
 * doing what sensitive variables do.
 *
 * The connection string never reaches shell history, a scrollback, a screen
 * share, or the disk. It goes from Neon into one process's environment.
 */
import { spawnSync } from "node:child_process";

/** Which database. Neither of these is a secret; the string they fetch is. */
const NEON = ["--project-id", "calm-boat-93104880", "--org-id", "org-old-wave-97887412"];

/**
 * Ask Neon for the connection string, or null.
 *
 * Tries an installed `neonctl` first and falls back to fetching it, so this
 * works on a machine that has never seen the tool.
 */
export function fromNeon() {
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

/** The host and database, with the credentials left out. */
export function serverOf(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "an address this script could not read";
  }
}

/** What to say when Neon would not answer. Printed by whoever asked. */
export const NEON_HELP = [
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
].join("\n");
