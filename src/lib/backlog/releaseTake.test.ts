import { describe, expect, it } from "vitest";

// scripts/ is deliberately outside src/ — see that file's own header — so
// this reaches it by relative path rather than the @/ alias, which only
// resolves under src/. Importing it runs nothing but the pure functions
// below: main() is guarded to fire only when the file is the entry point.
import {
  compareVersions,
  higherVersion,
  isRetryRun,
  nextVersion,
  planRelease,
  planRetry,
  releaseVersionOfSubject,
  retryAdvice,
  retryDone,
  versionAlreadyTaken,
  type RetryIo,
  type RetryState,
} from "../../../scripts/release-take.ts";

const CHANGELOG = `# Changelog

Prose.

## 0.150.0
- Something that shipped
`;

const PACKAGE_JSON = `{
  "name": "gomoku",
  "version": "0.150.0",
  "private": true
}
`;

const NOW = new Date("2026-09-12T03:04:05.000Z");

describe("nextVersion", () => {
  it("moves the minor and resets the patch, by default", () => {
    expect(nextVersion("0.150.0", "minor")).toBe("0.151.0");
    expect(nextVersion("0.150.7", "minor")).toBe("0.151.0");
  });

  it("moves the patch alone with --patch", () => {
    expect(nextVersion("0.150.0", "patch")).toBe("0.150.1");
  });
});

describe("higherVersion", () => {
  it("takes the remote when there is no local version yet", () => {
    expect(higherVersion("0.150.0", null)).toBe("0.150.0");
    expect(higherVersion("0.150.0", undefined)).toBe("0.150.0");
  });

  it("takes whichever of the two is further along", () => {
    expect(higherVersion("0.150.0", "0.151.0")).toBe("0.151.0");
    expect(higherVersion("0.151.0", "0.150.0")).toBe("0.151.0");
  });
});

describe("compareVersions", () => {
  it("orders by each part in turn", () => {
    expect(compareVersions("0.151.0", "0.150.9")).toBeGreaterThan(0);
    expect(compareVersions("0.150.1", "0.150.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  });
});

describe("versionAlreadyTaken", () => {
  it("finds an exact heading", () => {
    expect(versionAlreadyTaken(CHANGELOG, "0.150.0")).toBe(true);
  });

  it("says no for a version the file has never named", () => {
    expect(versionAlreadyTaken(CHANGELOG, "0.151.0")).toBe(false);
  });

  it("says no for an empty changelog", () => {
    expect(versionAlreadyTaken("", "0.150.0")).toBe(false);
  });
});

describe("planRelease", () => {
  it("plans a minor release: a dated heading inserted above the rest, and the version replaced once", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["A thing a player would notice"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.151.0");
    expect(plan.changelog).toContain("## 0.151.0 — 2026-09-12\n- A thing a player would notice");
    // Above the existing heading, not below it.
    expect(plan.changelog.indexOf("0.151.0")).toBeLessThan(plan.changelog.indexOf("0.150.0"));
    expect(plan.packageJson).toContain('"version": "0.151.0"');
  });

  it("refuses a minor with no summary — a player-noticeable release says what it is", () => {
    const plan = planRelease({ published: "0.150.0", changelog: CHANGELOG, packageJson: PACKAGE_JSON, step: "minor", summaries: [], now: NOW });
    expect(plan).toMatchObject({ ok: false });
  });

  it("refuses a minor whose only summary is blank", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["   "],
      now: NOW,
    });
    expect(plan).toMatchObject({ ok: false });
  });

  it("plans a patch with a summary: an entry is written, same as a minor", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "patch",
      summaries: ["A fix a player might notice"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.150.1");
    expect(plan.changelog).toContain("## 0.150.1 — 2026-09-12");
  });

  it("plans a patch with no summary: the version moves, and the changelog is untouched", () => {
    const plan = planRelease({ published: "0.150.0", changelog: CHANGELOG, packageJson: PACKAGE_JSON, step: "patch", summaries: [], now: NOW });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.version).toBe("0.150.1");
    expect(plan.changelog).toBe(CHANGELOG);
    expect(plan.packageJson).toContain('"version": "0.150.1"');
  });

  it("refuses a version the changelog already holds", () => {
    const alreadyThere = CHANGELOG.replace("## 0.150.0", "## 0.151.0");
    const plan = planRelease({
      published: "0.150.0",
      changelog: alreadyThere,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["Anything"],
      now: NOW,
    });
    expect(plan).toEqual({ ok: false, error: "0.151.0 is already taken; fetch and try again." });
  });

  it("refuses when package.json does not hold the published version string", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON.replace("0.150.0", "0.149.9"),
      step: "minor",
      summaries: ["Anything"],
      now: NOW,
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toContain("does not hold");
  });

  it("writes one bullet per summary, in the order given", () => {
    const plan = planRelease({
      published: "0.150.0",
      changelog: CHANGELOG,
      packageJson: PACKAGE_JSON,
      step: "minor",
      summaries: ["First thing", "Second thing"],
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.changelog).toContain("## 0.151.0 — 2026-09-12\n- First thing\n- Second thing\n");
  });
});

describe("releaseVersionOfSubject", () => {
  it("reads the version from a release commit's subject, with or without a summary", () => {
    expect(releaseVersionOfSubject("0.173.6 — The tool that takes a version now commits it")).toBe("0.173.6");
    expect(releaseVersionOfSubject("0.150.1")).toBe("0.150.1");
  });

  it("says null for any other commit, including one that only mentions a version", () => {
    expect(releaseVersionOfSubject("Merge the release tool fix: release:take commits the version it takes")).toBeNull();
    expect(releaseVersionOfSubject("Bump to 0.173.6")).toBeNull();
    expect(releaseVersionOfSubject("0.173.6 - a hyphen is not the house dash")).toBeNull();
  });
});

describe("isRetryRun", () => {
  it("is only --done with nothing else — the run that used to be refused as a minor with no summary", () => {
    expect(isRetryRun({ summaries: [], patch: false, doneKeys: ["a-row"] })).toBe(true);
  });

  it("leaves every run that asks for a new release planned as one", () => {
    expect(isRetryRun({ summaries: ["A thing"], patch: false, doneKeys: ["a-row"] })).toBe(false);
    expect(isRetryRun({ summaries: [], patch: true, doneKeys: ["a-row"] })).toBe(false);
    expect(isRetryRun({ summaries: [], patch: false, doneKeys: [] })).toBe(false);
  });
});

const RELEASE_HEAD: RetryState = {
  headSubject: "0.151.0 — A thing a player would notice",
  headVersion: "0.151.0",
  parentVersion: "0.150.0",
  changes: [],
  origin: { version: "0.150.0", hasHead: false },
};

describe("planRetry", () => {
  it("closes at HEAD's own version when HEAD is the commit that took it and the tree is clean", () => {
    expect(planRetry(RELEASE_HEAD)).toEqual({ ok: true, version: "0.151.0" });
  });

  it("still closes at HEAD's version once HEAD has been pushed, even with origin/main moved on past it", () => {
    expect(planRetry({ ...RELEASE_HEAD, origin: { version: "0.152.0", hasHead: true } })).toEqual({ ok: true, version: "0.151.0" });
  });

  it("refuses when HEAD is not a release commit, naming the subject and the way to take a new release", () => {
    const plan = planRetry({ ...RELEASE_HEAD, headSubject: "Some work on top of the release" });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.error).toContain('HEAD is not a release commit ("Some work on top of the release")');
    expect(plan.error).toContain("pass --summary (or --patch)");
    expect(plan.error).toContain("No row was closed");
  });

  it("refuses a tree with uncommitted tracked changes", () => {
    expect(planRetry({ ...RELEASE_HEAD, changes: ["src/app/page.tsx"] })).toMatchObject({ ok: false });
  });

  it("refuses when package.json at HEAD does not hold the version the subject names", () => {
    const plan = planRetry({ ...RELEASE_HEAD, headVersion: "0.150.0" });
    expect(plan).toMatchObject({ ok: false });
    if (plan.ok) return;
    expect(plan.error).toContain("names 0.151.0 but its package.json holds 0.150.0");
  });

  it("refuses a commit written in the release form that did not move the number", () => {
    const plan = planRetry({ ...RELEASE_HEAD, parentVersion: "0.151.0" });
    expect(plan).toMatchObject({ ok: false });
    if (plan.ok) return;
    expect(plan.error).toContain("did not take it");
  });

  it("refuses when another push has reached the number since this unpushed release commit was made", () => {
    const plan = planRetry({ ...RELEASE_HEAD, origin: { version: "0.151.0", hasHead: false } });
    expect(plan).toMatchObject({ ok: false });
    if (plan.ok) return;
    expect(plan.error).toContain("taken by another push");
  });
});

describe("retryAdvice", () => {
  it("gives the exact command, and that it takes no new number", () => {
    expect(retryAdvice("0.151.0", ["one-row", "two-row"])).toBe(
      "The release commit is correct either way. To retry closing, run `pnpm release:take --done one-row --done two-row` " +
        "with 0.151.0's release commit as HEAD and a clean tree: it closes the rows at 0.151.0 and takes no new number.",
    );
  });
});

/**
 * A git that answers from a table, recording every call, and a board that
 * records what it was asked to close. A command missing from the table
 * throws, the way git exits non-zero.
 */
function fakeRetry(answers: Record<string, string>, closes = true) {
  const calls: string[] = [];
  const closed: Array<{ keys: readonly string[]; version: string; releasedAt: string }> = [];
  const lines: string[] = [];
  const io: RetryIo = {
    git(args) {
      const command = args.join(" ");
      calls.push(command);
      const answer = answers[command];
      if (answer === undefined) throw new Error(`git ${command} failed`);
      return answer;
    },
    async close(keys, version, releasedAt) {
      closed.push({ keys, version, releasedAt });
      return closes;
    },
  };
  const out = { log: (line: string) => lines.push(`log ${line}`), error: (line: string) => lines.push(`error ${line}`) };
  return { io, out, calls, closed, lines };
}

const RELEASE_REPO: Record<string, string> = {
  "fetch origin --quiet": "",
  "show origin/main:package.json": '{ "version": "0.150.0" }',
  "log -1 --format=%s HEAD": "0.151.0 — A thing a player would notice\n",
  "show HEAD:package.json": '{ "version": "0.151.0" }',
  "show HEAD~1:package.json": '{ "version": "0.150.0" }',
  "status --porcelain --untracked-files=no": "",
  "log -1 --format=%cI HEAD": "2026-09-14T10:11:12+09:00\n",
  // No "merge-base --is-ancestor HEAD origin/main": it throws, so HEAD is not pushed yet.
};

const READ_ONLY_GIT = /^(fetch origin --quiet|show |log -1 |status --porcelain |merge-base --is-ancestor )/;

describe("retryDone", () => {
  it("closes the rows at HEAD's release, stamped with HEAD's commit time, and runs nothing but reads", async () => {
    const { io, out, calls, closed, lines } = fakeRetry(RELEASE_REPO);
    expect(await retryDone(io, out, ["a-row"])).toBe(true);
    expect(closed).toEqual([{ keys: ["a-row"], version: "0.151.0", releasedAt: "2026-09-14T01:11:12.000Z" }]);
    // No commit, no add, no write: RetryIo has no way to write a file at all.
    expect(calls.every((command) => READ_ONLY_GIT.test(command))).toBe(true);
    expect(lines[0]).toBe("log HEAD is the 0.151.0 release commit. Closing a-row at 0.151.0; no number is taken.");
    expect(lines).toContain("log Now: pnpm preflight:prod && git fetch origin && git push origin HEAD:main");
  });

  it("closes nothing when HEAD is a work commit on top of the release", async () => {
    const { io, out, closed, lines } = fakeRetry({ ...RELEASE_REPO, "log -1 --format=%s HEAD": "Some work\n" });
    expect(await retryDone(io, out, ["a-row"])).toBe(false);
    expect(closed).toEqual([]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^error HEAD is not a release commit \("Some work"\)/);
  });

  it("prints no push step when HEAD is already on origin/main", async () => {
    const { io, out, lines } = fakeRetry({
      ...RELEASE_REPO,
      "show origin/main:package.json": '{ "version": "0.151.0" }',
      "merge-base --is-ancestor HEAD origin/main": "",
    });
    expect(await retryDone(io, out, ["a-row"])).toBe(true);
    expect(lines.some((line) => line.includes("git push"))).toBe(false);
  });

  it("gives the retry advice again when a row still does not close", async () => {
    const { io, out, lines } = fakeRetry(RELEASE_REPO, false);
    expect(await retryDone(io, out, ["a-row"])).toBe(false);
    expect(lines.at(-1)).toBe(`log ${retryAdvice("0.151.0", ["a-row"])}`);
  });
});
