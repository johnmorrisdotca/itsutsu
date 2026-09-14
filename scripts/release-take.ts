/**
 * Takes the next release number, dates the changelog, and closes the rows it
 * shipped — in one pass, refusing rather than guessing.
 *
 *   pnpm release:take --summary "<one line a player reads>" [--summary "…"] [--patch] [--done <key>]...
 *   pnpm release:take --done <key>...   retry closing rows at the release HEAD already is
 *
 * The first --summary becomes the commit title after the dash, and the house
 * convention is to write it in lower case, as a continuation of that dash,
 * with proper nouns keeping their capitals:
 * `0.173.5 — the member filter refuses, two dates move, and a gate holds the line`,
 * `0.173.1 — Play apart renders the shared rules panel instead of copying it`.
 * The title takes it exactly as written: lower-casing would mangle Hex, John,
 * XP or `release:take`, which the tool cannot tell from an ordinary first word.
 * The changelog bullet capitalises the first letter instead, but only when the
 * first word is plain lower-case letters, so `/releases` keeps its capitalised
 * bullets and an identifier such as `xpCurve` is never turned into a typo.
 * See `changelogBullet`.
 *
 * The second form takes no number: see `planRetry` for how it knows HEAD is
 * a release commit, and why it refuses when it cannot be sure.
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
 * changelog heading, `package.json`, the release commit that carries both,
 * and — through the API, with `--done`, never through Prisma — the rows that
 * shipped. It commits the two files itself rather than printing a step that
 * says to: see `release-commit.ts` for the night the printed step was
 * followed and the version was left behind.
 *
 * Self-contained like `scripts/tasks.ts`: no imports from `src/` (its one
 * import is its sibling `release-commit.ts`), `fetch` for the board,
 * `node:child_process`/`node:fs` for git and the two files.
 * Everything is computed first and nothing is written until all of it can
 * be — a release that refuses halfway must leave the tree exactly as it
 * found it, not a version bumped with no changelog line, or the reverse.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

import {
  commitRelease,
  dirtyReleaseFiles,
  NEXT_STEP,
  RELEASE_FILES,
  releaseCoAuthor,
  releaseRefusal,
  UNDO_HINT,
  type ReleaseIo,
  type ReleaseOut,
} from "./release-commit.ts";

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

/** A first word of plain lower-case letters, optionally ending in one mark of punctuation. */
const PLAIN_FIRST_WORD = /^[a-z]+[,;:.!?]?$/;

/**
 * A summary as its changelog bullet. The summary is written in lower case for
 * the commit title, and every bullet on `/releases` starts with a capital, so
 * the bullet capitalises the first letter, but only when the first word (up
 * to the first whitespace) is plain lower-case letters: "the member filter
 * refuses" becomes "The member filter refuses".
 *
 * Every other first word is left exactly as written, because it is either
 * already capitalised or is an identifier that a capital would turn into a
 * typo nothing flags: `xpCurve` and `iOS` (a capital inside), `proxy.ts` and
 * `release:take` (a dot or colon inside), a digit, or a backtick. Upper-casing
 * plain prose is the safe direction: a proper noun already has its capital.
 */
export function changelogBullet(summary: string): string {
  const firstWord = summary.split(/\s/, 1)[0] ?? "";
  return PLAIN_FIRST_WORD.test(firstWord) ? `${summary[0]!.toUpperCase()}${summary.slice(1)}` : summary;
}

/** The heading and its bullets, in the shape `releases.ts` parses back. */
function composeEntry(version: string, day: string, summaries: readonly string[]): string {
  return `## ${version} — ${day}\n${summaries.map((line) => `- ${changelogBullet(line)}`).join("\n")}\n\n`;
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
      error:
        "A minor release needs at least one --summary: a player-noticeable release says what it is. " +
        'Write it in lower case, continuing the title\'s dash, with proper nouns keeping their capitals: --summary "the member filter refuses, two dates move, and a gate holds the line".',
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
// Retrying --done. When closing a row fails, the release commit already
// exists and is right; what is left is the rows. The advice used to be
// "re-run with only --done", and that run was planned as a minor with no
// summary and refused before it reached a row — advice that could never work.
// So a run with --done and nothing else is its own mode: it closes the rows at
// the release HEAD already is, and takes no number, writes no file, and makes
// no commit.
// ---------------------------------------------------------------------------

/** A release commit's subject: `0.x.y — <summary>`, or `0.x.y` alone for a patch with none. */
const RELEASE_SUBJECT = /^(\d+\.\d+\.\d+)(?: — .+)?$/;

/** The version a commit subject names in the release form, or null when it is not one. */
export function releaseVersionOfSubject(subject: string): string | null {
  return RELEASE_SUBJECT.exec(subject.trim())?.[1] ?? null;
}

/**
 * Whether this run only retries closing rows: `--done` and no `--summary` or
 * `--patch`. Any of those two means a new release was asked for, and that run
 * is planned exactly as before — so no run that used to take a number stops
 * taking one. The only run this changes is the one that was always refused.
 */
export function isRetryRun(run: { summaries: readonly string[]; patch: boolean; doneKeys: readonly string[] }): boolean {
  return run.doneKeys.length > 0 && run.summaries.length === 0 && !run.patch;
}

export type RetryState = {
  /** `git log -1 --format=%s HEAD`. */
  headSubject: string;
  /** package.json's version at HEAD; null when it cannot be read. */
  headVersion: string | null;
  /** package.json's version at HEAD's first parent; null when HEAD has none. */
  parentVersion: string | null;
  /** Tracked paths with changes, staged or not. Untracked files are not counted: no push carries them. */
  changes: readonly string[];
  /** origin/main after a fetch: its version, and whether HEAD is already in it. */
  origin: { version: string; hasHead: boolean };
};

export type RetryPlan = { ok: true; version: string } | { ok: false; error: string };

const NOTHING_CLOSED = "No row was closed and nothing was written.";

/**
 * The version to close rows at, or why there is none. Every check is a way
 * the version could be something other than the release HEAD is:
 *
 * - HEAD's subject must be in the release form. It is the only place the
 *   release and the commit are tied together; a work commit on top of a
 *   release carries work that release does not.
 * - package.json at HEAD must hold the version the subject names, and HEAD's
 *   parent must hold an older one — so HEAD is the commit that moved the
 *   number, not a commit that merely reads like one.
 * - The tracked tree must be clean. Uncommitted changes are work that is not
 *   in HEAD, and an edited package.json would make "the version" two answers.
 * - If HEAD is not yet on origin/main, origin/main must not have reached the
 *   version since: that number now belongs to somebody else's push, and this
 *   release has to be taken again rather than rows stamped with it.
 */
export function planRetry(state: RetryState): RetryPlan {
  const named = releaseVersionOfSubject(state.headSubject);
  if (named === null) {
    return {
      ok: false,
      error:
        `HEAD is not a release commit ("${state.headSubject}"). A run with only --done closes rows at the release HEAD ` +
        `already is, and takes no number; to take a new release, pass --summary (or --patch) with --done. ${NOTHING_CLOSED}`,
    };
  }
  if (state.changes.length > 0) {
    return {
      ok: false,
      error:
        `${state.changes.join(", ")} ${state.changes.length === 1 ? "has" : "have"} uncommitted changes, so the tree is ` +
        `not the ${named} release commit. Commit or put them back, then retry. ${NOTHING_CLOSED}`,
    };
  }
  if (state.headVersion !== named) {
    return {
      ok: false,
      error: `HEAD's subject names ${named} but its package.json holds ${state.headVersion ?? "no version"}. ${NOTHING_CLOSED}`,
    };
  }
  if (state.parentVersion !== null && compareVersions(named, state.parentVersion) <= 0) {
    return {
      ok: false,
      error:
        `HEAD names ${named} but did not take it: its parent already holds ${state.parentVersion}. ` +
        `Only the commit that moved the number is a release commit. ${NOTHING_CLOSED}`,
    };
  }
  if (!state.origin.hasHead && compareVersions(state.origin.version, named) >= 0) {
    return {
      ok: false,
      error:
        `origin/main already holds ${state.origin.version}, so ${named} has been taken by another push since this release ` +
        "commit was made. Take the release again — `git reset --keep HEAD~1`, then release:take with its --summary and " +
        `--done — rather than stamping rows with a number that is not this one. ${NOTHING_CLOSED}`,
    };
  }
  return { ok: true, version: named };
}

/** What a failed close prints: the exact command that retries it, and what that command will and will not do. */
export function retryAdvice(version: string, doneKeys: readonly string[]): string {
  const command = ["pnpm release:take", ...doneKeys.map((key) => `--done ${key}`)].join(" ");
  return (
    `The release commit is correct either way. To retry closing, run \`${command}\` with ${version}'s release commit ` +
    `as HEAD and a clean tree: it closes the rows at ${version} and takes no new number.`
  );
}

/** How a retry touches the world. There is no write: a retry has nothing to write. */
export type RetryIo = {
  /** Runs git and returns its stdout; throws when git exits non-zero. */
  git(args: readonly string[]): string;
  /** Closes every row at the version; false when any of them was not closed. */
  close(keys: readonly string[], version: string, releasedAt: string): Promise<boolean>;
};

function gitOrNull(io: RetryIo, args: readonly string[]): string | null {
  try {
    return io.git(args);
  } catch {
    return null;
  }
}

function versionInPackageJson(raw: string | null): string | null {
  if (raw === null) return null;
  try {
    return (JSON.parse(raw) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/**
 * The retry run, start to finish. True when every row closed. `releasedAt`
 * is HEAD's commit time rather than now: the release happened when its
 * commit was made, and a retry an hour later should not move that.
 */
export async function retryDone(io: RetryIo, out: ReleaseOut, doneKeys: readonly string[]): Promise<boolean> {
  io.git(["fetch", "origin", "--quiet"]);
  const originVersion = versionInPackageJson(gitOrNull(io, ["show", "origin/main:package.json"]));
  if (originVersion === null) {
    out.error(`Could not read origin/main:package.json. Fetch, and check the remote. ${NOTHING_CLOSED}`);
    return false;
  }

  const hasHead = gitOrNull(io, ["merge-base", "--is-ancestor", "HEAD", "origin/main"]) !== null;
  const plan = planRetry({
    headSubject: io.git(["log", "-1", "--format=%s", "HEAD"]).trim(),
    headVersion: versionInPackageJson(gitOrNull(io, ["show", "HEAD:package.json"])),
    parentVersion: versionInPackageJson(gitOrNull(io, ["show", "HEAD~1:package.json"])),
    changes: dirtyReleaseFiles(io.git(["status", "--porcelain", "--untracked-files=no"])),
    origin: { version: originVersion, hasHead },
  });
  if (!plan.ok) {
    out.error(plan.error);
    return false;
  }

  const releasedAt = new Date(io.git(["log", "-1", "--format=%cI", "HEAD"]).trim()).toISOString();
  out.log(`HEAD is the ${plan.version} release commit. Closing ${doneKeys.join(", ")} at ${plan.version}; no number is taken.`);
  const closed = await io.close(doneKeys, plan.version, releasedAt);
  // Not pushed yet, so the chain still has its push to make.
  if (!hasHead) {
    out.log(NEXT_STEP);
    out.log(UNDO_HINT);
  }
  if (!closed) out.log(retryAdvice(plan.version, doneKeys));
  return closed;
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

/** Whether git is part-way through a merge — a partial commit is refused until it is finished. */
function mergeInProgress(): boolean {
  try {
    execFileSync("git", ["rev-parse", "-q", "--verify", "MERGE_HEAD"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Closes every row through the API at one version. False when any was not closed, having said why. */
async function closeRows(keys: readonly string[], version: string, releasedAt: string): Promise<boolean> {
  if (BOARD_TOKEN === "") {
    console.error("BOARD_TOKEN is not set, so the rows named with --done were not closed.");
    return false;
  }
  const actor = process.env.BOARD_ACTOR ?? "release:take";
  let allClosed = true;
  for (const key of keys) {
    const closed = await closeRow(key, version, releasedAt, actor);
    if (!closed) allClosed = false;
  }
  return allClosed;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const summaries = flags("summary", argv);
  const patch = hasFlag("patch", argv);
  const step: ReleaseStep = patch ? "patch" : "minor";
  const doneKeys = flags("done", argv);

  const io: ReleaseIo = {
    git: (args, input) => execFileSync("git", [...args], { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] }),
    write: (path, content) => writeFileSync(path, content),
  };
  const out: ReleaseOut = { log: (line) => console.log(line), error: (line) => console.error(line) };

  if (isRetryRun({ summaries, patch, doneKeys })) {
    const closed = await retryDone({ git: (args) => io.git(args), close: closeRows }, out, doneKeys);
    if (!closed) process.exitCode = 1;
    return;
  }

  // Before the fetch, before anything is read for the plan: the release
  // commit takes these two files as they stand, so either one already
  // changed would carry somebody's edit into it.
  const refusal = releaseRefusal({
    dirty: dirtyReleaseFiles(io.git(["status", "--porcelain", "--", ...RELEASE_FILES])),
    merging: mergeInProgress(),
  });
  if (refusal !== null) {
    console.error(refusal);
    process.exit(1);
  }

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

  const committed = commitRelease(
    io,
    out,
    {
      version: plan.version,
      published,
      before: { changelog: localChangelog, packageJson: localPackageJson },
      after: { changelog: plan.changelog, packageJson: plan.packageJson },
      summaries,
      coAuthor: releaseCoAuthor(process.env),
    },
  );
  if (!committed) process.exit(1);

  const allClosed = doneKeys.length === 0 || (await closeRows(doneKeys, plan.version, now.toISOString()));

  console.log(NEXT_STEP);
  console.log(UNDO_HINT);
  if (!allClosed) {
    console.log(retryAdvice(plan.version, doneKeys));
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
