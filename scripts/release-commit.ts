/**
 * The half of `pnpm release:take` that makes a release a commit.
 *
 * It used to write `package.json` and `CHANGELOG.md` and stop, printing a
 * next step that went straight to the push. The merging session followed it
 * to the letter on 2026-09-14: merge commit `4c96876` reached `main` carrying
 * the code at 0.173.3 while 0.173.4 sat uncommitted in the working tree, and
 * `563d2bd` had to follow with nothing in it but the version. Every release
 * before it is one `0.x.y — <summary>` commit, so the convention was right and
 * the hint was wrong — and a hint is a habit, which fails exactly once in the
 * way this one did. So the tool commits the two files itself.
 *
 * Three rules, each for a reason:
 *
 * - **It refuses before writing anything** when either file already has
 *   changes of its own, staged or not, or when a merge is still open. The
 *   commit takes those two paths as they stand in the working tree, so a
 *   dirty file would sweep somebody's edit into a release commit; and git
 *   refuses a partial commit mid-merge, which would otherwise be found only
 *   after the files were written.
 * - **It commits those two paths and nothing else**, with `git commit --only`,
 *   so whatever else is staged stays staged and out of the release.
 * - **A write or commit that fails puts both files back** as they were read,
 *   so a refusal halfway leaves the tree exactly as the tool found it — the
 *   rule the rest of `release-take.ts` already keeps — and says so. If even
 *   that fails, it says precisely what the tree now holds and the two
 *   commands that settle it either way.
 *
 * Git and the filesystem arrive through `ReleaseIo`, so the order
 * (write → commit → report) is tested with a fake rather than trusted.
 */

/**
 * The co-author trailer a release commit carries when `RELEASE_CO_AUTHOR` is
 * not set in the environment. It names the assistant that made the release,
 * not the person committing it, which is why it is never read from git
 * config.
 *
 * Update this line whenever the attribution line the sessions are given
 * changes: copy the `Co-Authored-By:` line from the end of the newest
 * ordinary commit on main. Until it is updated, set `RELEASE_CO_AUTHOR` for
 * the run instead, because a stale trailer fails nothing and simply goes into
 * history under the wrong name.
 */
export const RELEASE_CO_AUTHOR = "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>";

/**
 * The trailer for this run: `RELEASE_CO_AUTHOR` from the environment when it
 * is set and not blank, otherwise the constant above. A value given as
 * `Name <email>` gets the `Co-Authored-By: ` prefix, so a trailer is never
 * written without the key git reads it by.
 */
export function releaseCoAuthor(env: Readonly<Record<string, string | undefined>>): string {
  const value = env.RELEASE_CO_AUTHOR?.trim() ?? "";
  if (value === "") return RELEASE_CO_AUTHOR;
  return /^co-authored-by:/i.test(value) ? value : `Co-Authored-By: ${value}`;
}

/** The only two paths a release commit may contain, in the order they are written. */
export const RELEASE_FILES = ["CHANGELOG.md", "package.json"] as const;

export type ReleaseFileContents = { changelog: string; packageJson: string };

/** What `main()` gives this module to touch the world with. */
export type ReleaseIo = {
  /** Runs git and returns its stdout; throws when git exits non-zero. */
  git(args: readonly string[], input?: string): string;
  write(path: string, content: string): void;
};

/** The paths `git status --porcelain -- <release files>` reports as changed. */
export function dirtyReleaseFiles(porcelain: string): string[] {
  return porcelain
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.slice(3).trim());
}

/**
 * Why the tool will not start, or null when it may. Checked before the fetch
 * and long before any file is written.
 */
export function releaseRefusal(state: { dirty: readonly string[]; merging: boolean }): string | null {
  if (state.merging) {
    return (
      "A merge is still open. Commit it first: release:take commits package.json and CHANGELOG.md " +
      "on their own, and git refuses a partial commit in the middle of a merge. Nothing was written."
    );
  }
  if (state.dirty.length > 0) {
    return (
      `${state.dirty.join(" and ")} already ${state.dirty.length === 1 ? "has" : "have"} uncommitted changes. ` +
      "release:take commits those files, and would sweep the changes into the release commit. " +
      "Commit or put them back, then run it again. Nothing was written."
    );
  }
  return null;
}

/**
 * `0.x.y — <first summary>`, in the house form. More than one summary puts
 * every one in the body as written, in the changelog's order; a patch with none is
 * named by its number alone, since there is nothing else true to say.
 */
export function releaseCommitMessage(version: string, summaries: readonly string[], coAuthor: string): string {
  const lines = summaries.map((line) => line.trim()).filter((line) => line.length > 0);
  // The summary continues the dash, so the convention is lower case with proper
  // nouns keeping their capitals: `0.173.3 — the Paired gate sees every name, and
  // the six number faults`. It goes in exactly as written. Changing case here
  // would mangle Hex, John, XP or an identifier, which this cannot tell from an
  // ordinary first word. The CHANGELOG.md bullet made from the same line is
  // capitalised instead: see `changelogBullet` in release-take.ts.
  const subject = lines.length === 0 ? version : `${version} — ${lines[0]!.replace(/\.$/, "")}`;
  const body = lines.length > 1 ? `${lines.map((line) => `- ${line}`).join("\n")}\n\n` : "";
  return `${subject}\n\n${body}${coAuthor}\n`;
}

export type CommitOutcome =
  | { ok: true; commit: string }
  | { ok: false; error: string; restored: true }
  | { ok: false; error: string; restored: false; restoreError: string };

function messageOf(error: unknown): string {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = String((error as { stderr: unknown }).stderr ?? "").trim();
    if (stderr.length > 0) return stderr;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Writes both files and commits exactly those two, or puts both back.
 * `before` is what was read — clean, because `releaseRefusal` said so — and
 * `after` is the plan.
 */
export function writeAndCommit(
  io: ReleaseIo,
  before: ReleaseFileContents,
  after: ReleaseFileContents,
  message: string,
): CommitOutcome {
  try {
    io.write("CHANGELOG.md", after.changelog);
    io.write("package.json", after.packageJson);
    io.git(["commit", "--only", "--quiet", "--file=-", "--", ...RELEASE_FILES], message);
  } catch (error) {
    const reason = messageOf(error);
    try {
      io.write("CHANGELOG.md", before.changelog);
      io.write("package.json", before.packageJson);
      return { ok: false, error: reason, restored: true };
    } catch (restoreFailure) {
      return { ok: false, error: reason, restored: false, restoreError: messageOf(restoreFailure) };
    }
  }
  return { ok: true, commit: io.git(["rev-parse", "--short", "HEAD"]).trim() };
}

/** What a failed commit prints, so the tree it leaves is never a mystery. */
export function commitFailureReport(
  version: string,
  outcome: Extract<CommitOutcome, { ok: false }>,
  message: string,
  coAuthor: string,
): string[] {
  const head = [`Could not commit ${version}: ${outcome.error}`];
  if (outcome.restored) {
    return [
      ...head,
      "package.json and CHANGELOG.md are put back as they were, so the tree is exactly as release:take found it:",
      "nothing committed, nothing pushed, no row closed. Deal with what git said and run it again;",
      "the number is not taken until something carrying it is pushed.",
    ];
  }
  const subject = message.split("\n")[0]!;
  return [
    ...head,
    `Putting the files back failed too (${outcome.restoreError}).`,
    `The tree may hold ${version} in package.json and CHANGELOG.md, uncommitted, and no row was closed. Either:`,
    `  git commit --only -m "${subject.replace(/"/g, '\\"')}" -m "${coAuthor}" -- ${RELEASE_FILES.join(" ")}`,
    `or take the release back off:`,
    `  git checkout -- ${RELEASE_FILES.join(" ")}`,
  ];
}

export type ReleaseOut = { log(line: string): void; error(line: string): void };

/**
 * Write, commit, and only then say so. True when the release commit exists;
 * false when it does not, having printed why and what the tree now holds.
 * `main()` prints the next step only after a true.
 */
export function commitRelease(
  io: ReleaseIo,
  out: ReleaseOut,
  release: {
    version: string;
    published: string;
    before: ReleaseFileContents;
    after: ReleaseFileContents;
    summaries: readonly string[];
    /** The trailer, from `releaseCoAuthor(process.env)` — required, so no caller falls back by forgetting it. */
    coAuthor: string;
  },
): boolean {
  const message = releaseCommitMessage(release.version, release.summaries, release.coAuthor);
  const outcome = writeAndCommit(io, release.before, release.after, message);
  if (!outcome.ok) {
    for (const line of commitFailureReport(release.version, outcome, message, release.coAuthor)) out.error(line);
    return false;
  }
  out.log(
    `${release.version} committed as ${outcome.commit} ("${message.split("\n")[0]}"): ` +
      `CHANGELOG.md and package.json, nothing else. Published was ${release.published}.`,
  );
  return true;
}

/** The printed next step — the same chain AGENTS.md gives, which now needs no commit in it. */
export const NEXT_STEP = "Now: pnpm preflight:prod && git fetch origin && git push origin HEAD:main";

/** Printed beside the next step: the way back if the gate goes red after the commit. */
export const UNDO_HINT =
  "If the gate goes red, `git reset --keep HEAD~1` takes the release commit back off (other local edits stay), and the number is free again.";
