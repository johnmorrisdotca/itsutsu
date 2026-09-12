/**
 * Takes the next release number, dates the changelog, and closes the rows it
 * shipped — in one pass, refusing rather than guessing.
 *
 *   pnpm release:take --summary "<one line a player reads>" [--summary "…"] [--patch] [--done <key>]...
 *
 * Why this exists, from AGENTS.md, "Every Landed Commit Bumps The Version":
 * the number used to be claimed by hand, in the merge commit, because a
 * branch cannot see what will land before it — and two branches guessed the
 * same one in a single night anyway. `CHANGELOG.md` has 151 releases and
 * dates none of them, because nothing recorded when they shipped. And a row
 * marked done used to carry `releaseStampFor`'s reading of the version
 * RUNNING at that moment, "usually the release before the one that carried
 * the work" — an imprecision said out loud rather than a lie, but still not
 * the true number. Fifteen rows shipped on one night and could not carry
 * their real release for exactly this reason.
 *
 * This fixes all three by taking the number immediately before pushing, the
 * one moment it is actually knowable, and writing everything from it: the
 * changelog heading, `package.json`, and — through the API, with `--done`,
 * never through Prisma — the rows that shipped.
 *
 * Self-contained like `scripts/tasks.ts`: no imports from `src/`, `fetch`
 * for the board, `node:child_process`/`node:fs` for git and the two files.
 * Everything is computed first and nothing is written until all of it can
 * be — a release that refuses halfway must leave the tree exactly as it
 * found it, not a version bumped with no changelog line, or the reverse.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Pure planning. Exported for release-take.test.ts, which is the only reason
// this file may be imported rather than run — see the entry-point guard at
// the bottom, which keeps that import from also fetching git and hitting the
// network.
// ---------------------------------------------------------------------------

export type ReleaseStep = "minor" | "patch";

/** The higher of two versions by semver parts — what has actually been published. */
export function higherVersion(remote: string, local: string | null | undefined): string {
  if (!local) return remote;
  return compareVersions(local, remote) > 0 ? local : remote;
}

function parts(version: string): number[] {
  return version.split(".").map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isNaN(value) ? 0 : value;
  });
}

/** Negative when `a` is older than `b`, positive when newer, zero when the same. */
export function compareVersions(a: string, b: string): number {
  const left = parts(a);
  const right = parts(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * The next release. A feature moves the minor and resets the patch to zero;
 * `--patch` moves the patch alone. The site has never offered a major bump
 * here — CHANGELOG.md reserves it for the day the invite gate comes down.
 */
export function nextVersion(published: string, step: ReleaseStep): string {
  const [major, minor, patch] = parts(published);
  return step === "patch" ? `${major}.${minor}.${patch + 1}` : `${major}.${minor + 1}.0`;
}

/** Whether a changelog already holds a heading for this exact version. */
export function versionAlreadyTaken(changelog: string, version: string): boolean {
  const escaped = version.replace(/\./g, "\\.");
  return new RegExp(`^##\\s+${escaped}\\b`, "m").test(changelog);
}

/** The heading and its bullets, in the shape `releases.ts` parses back. */
function composeEntry(version: string, day: string, summaries: readonly string[]): string {
  return `## ${version} — ${day}\n${summaries.map((line) => `- ${line}`).join("\n")}\n\n`;
}

/** The changelog with one new entry inserted above the first existing heading. */
function insertEntry(changelog: string, entry: string): string {
  const marker = "\n## ";
  const at = changelog.indexOf(marker);
  return at === -1 ? `${changelog}\n${entry}` : `${changelog.slice(0, at + 1)}${entry}${changelog.slice(at + 1)}`;
}

export type PlanInput = {
  /** The higher of `origin/main`'s version and this checkout's — see `higherVersion`. */
  published: string;
  /** The local CHANGELOG.md, as it stands before this release. */
  changelog: string;
  /** The local package.json, as it stands before this release. */
  packageJson: string;
  step: ReleaseStep;
  /** Zero or more `--summary` lines, in the order given. */
  summaries: readonly string[];
  now: Date;
};

export type PlanResult =
  | { ok: true; version: string; changelog: string; packageJson: string }
  | { ok: false; error: string };

/**
 * Everything a release changes, computed and returned — nothing here writes
 * a file. `scripts/release-take.ts`'s `main()` is the only writer, and only
 * once every check below has passed.
 */
export function planRelease(input: PlanInput): PlanResult {
  const version = nextVersion(input.published, input.step);

  if (versionAlreadyTaken(input.changelog, version)) {
    return { ok: false, error: `${version} is already taken; fetch and try again.` };
  }

  const summaries = input.summaries.map((line) => line.trim()).filter((line) => line.length > 0);
  if (input.step === "minor" && summaries.length === 0) {
    return {
      ok: false,
      error: "A minor release needs at least one --summary: a player-noticeable release says what it is.",
    };
  }

  const changelog =
    summaries.length === 0
      ? input.changelog
      : insertEntry(input.changelog, composeEntry(version, input.now.toISOString().slice(0, 10), summaries));

  const from = `"version": "${input.published}"`;
  if (!input.packageJson.includes(from)) {
    return {
      ok: false,
      error: `package.json does not hold "${input.published}" — has somebody else shipped since you started?`,
    };
  }
  const packageJson = input.packageJson.replace(from, `"version": "${version}"`);

  return { ok: true, version, changelog, packageJson };
}

// ---------------------------------------------------------------------------
// IO. Everything below touches git, the filesystem, or the network, and only
// `main()` (guarded at the bottom) calls into it.
// ---------------------------------------------------------------------------

function flags(name: string, argv: readonly string[]): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === `--${name}` && argv[index + 1] !== undefined) values.push(argv[index + 1]!);
  }
  return values;
}

function hasFlag(name: string, argv: readonly string[]): boolean {
  return argv.includes(`--${name}`);
}

/** `origin/main:<path>`, or null if git cannot show it — a branch with no such file yet, say. */
function showRemote(path: string): string | null {
  try {
    return execFileSync("git", ["show", `origin/main:${path}`], { encoding: "utf8" });
  } catch {
    return null;
  }
}

const BOARD_URL = (process.env.BOARD_URL ?? "https://itsutsu.com").replace(/\/+$/, "");
const BOARD_TOKEN = process.env.BOARD_TOKEN ?? "";

function boardHeaders(actor: string, hasBody: boolean): Record<string, string> {
  return {
    Authorization: `Bearer ${BOARD_TOKEN}`,
    "X-Board-Actor": actor,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

/** Marks one row done through the API, never through Prisma. False on any refusal. */
async function closeRow(key: string, version: string, releasedAt: string, actor: string): Promise<boolean> {
  const listResponse = await fetch(`${BOARD_URL}/api/backlog`, { headers: boardHeaders(actor, false) });
  if (!listResponse.ok) {
    console.error(`${key}: could not read the board (${listResponse.status}).`);
    return false;
  }
  const { items } = (await listResponse.json()) as { items: Array<{ id: string; key: string }> };
  const found = items.find((item) => item.key === key);
  if (found === undefined) {
    console.error(`${key}: no such row on the board.`);
    return false;
  }

  const response = await fetch(`${BOARD_URL}/api/backlog/${found.id}`, {
    method: "PATCH",
    headers: boardHeaders(actor, true),
    body: JSON.stringify({ status: "done", releasedIn: version, releasedAt }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    console.error(`${key}: ${body.error ?? "that did not go through"}.`);
    return false;
  }
  console.log(`${key} marked done in ${version}.`);
  return true;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const summaries = flags("summary", argv);
  const step: ReleaseStep = hasFlag("patch", argv) ? "patch" : "minor";
  const doneKeys = flags("done", argv);

  execFileSync("git", ["fetch", "origin", "--quiet"], { stdio: "inherit" });

  const remotePackageRaw = showRemote("package.json");
  if (remotePackageRaw === null) {
    console.error("Could not read origin/main:package.json. Fetch, and check the remote.");
    process.exit(1);
  }
  const remoteVersion = (JSON.parse(remotePackageRaw) as { version?: string }).version;
  if (!remoteVersion) {
    console.error("origin/main's package.json has no version.");
    process.exit(1);
  }

  const localPackageJson = readFileSync("package.json", "utf8");
  const localVersion = (JSON.parse(localPackageJson) as { version?: string }).version ?? null;
  const published = higherVersion(remoteVersion, localVersion);

  const version = nextVersion(published, step);
  const remoteChangelog = showRemote("CHANGELOG.md") ?? "";
  if (versionAlreadyTaken(remoteChangelog, version)) {
    console.error(`${version} is already taken on origin/main; fetch and try again.`);
    process.exit(1);
  }

  const localChangelog = readFileSync("CHANGELOG.md", "utf8");
  const now = new Date();
  const plan = planRelease({ published, changelog: localChangelog, packageJson: localPackageJson, step, summaries, now });
  if (!plan.ok) {
    console.error(plan.error);
    process.exit(1);
  }

  writeFileSync("CHANGELOG.md", plan.changelog);
  writeFileSync("package.json", plan.packageJson);
  console.log(`${plan.version} written to CHANGELOG.md and package.json. Published was ${published}.`);

  let anyClosingFailed = false;
  if (doneKeys.length > 0) {
    if (BOARD_TOKEN === "") {
      console.error("BOARD_TOKEN is not set, so the rows named with --done were not closed.");
      anyClosingFailed = true;
    } else {
      const actor = process.env.BOARD_ACTOR ?? "release:take";
      const releasedAt = now.toISOString();
      for (const key of doneKeys) {
        const closed = await closeRow(key, plan.version, releasedAt, actor);
        if (!closed) anyClosingFailed = true;
      }
    }
  }

  console.log("Now: pnpm preflight:prod && git fetch origin && git push origin HEAD:main");
  if (anyClosingFailed) {
    console.log("The files above are correct either way — re-run with only --done to retry closing a row.");
    process.exitCode = 1;
  }
}

// Only run main() when this file is the entry point — release-take.test.ts
// imports the pure functions above and must not also fetch git or the
// network for doing so.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
