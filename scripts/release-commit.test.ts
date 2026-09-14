import { describe, expect, it } from "vitest";

import {
  commitFailureReport,
  commitRelease,
  dirtyReleaseFiles,
  RELEASE_CO_AUTHOR,
  releaseCoAuthor,
  releaseCommitMessage,
  releaseRefusal,
  writeAndCommit,
  type ReleaseIo,
} from "./release-commit.ts";

const BEFORE = { changelog: "# Changelog\n\n## 0.150.0\n- Old\n", packageJson: '{ "version": "0.150.0" }\n' };
const AFTER = {
  changelog: "# Changelog\n\n## 0.151.0 — 2026-09-14\n- New\n\n## 0.150.0\n- Old\n",
  packageJson: '{ "version": "0.151.0" }\n',
};

/**
 * A git and a filesystem that record every call in one list, so the order
 * across the two is what gets asserted. `failOn` makes one step throw the
 * way execFileSync / writeFileSync would.
 */
function fakeIo(failOn?: { git?: string; write?: { path: string; nth: number } }) {
  const events: string[] = [];
  const written: Record<string, string> = {};
  const writes: Record<string, number> = {};
  const inputs: Array<string | undefined> = [];
  const io: ReleaseIo = {
    git(args, input) {
      events.push(`git ${args.join(" ")}`);
      inputs.push(input);
      if (failOn?.git && args[0] === failOn.git) {
        throw Object.assign(new Error("Command failed"), { stderr: "fatal: something git objected to\n" });
      }
      return args[0] === "rev-parse" ? "abc1234\n" : "";
    },
    write(path, content) {
      writes[path] = (writes[path] ?? 0) + 1;
      events.push(`write ${path}`);
      if (failOn?.write && failOn.write.path === path && failOn.write.nth === writes[path]) {
        throw new Error(`EACCES: ${path}`);
      }
      written[path] = content;
    },
  };
  return { io, events, written, inputs };
}

function fakeOut() {
  const lines: string[] = [];
  return { lines, out: { log: (line: string) => lines.push(`log ${line}`), error: (line: string) => lines.push(`error ${line}`) } };
}

describe("dirtyReleaseFiles", () => {
  it("reads nothing as clean", () => {
    expect(dirtyReleaseFiles("")).toEqual([]);
  });

  it("names a file changed in the working tree, one staged, and one both — the leading space is part of the status", () => {
    expect(dirtyReleaseFiles(" M CHANGELOG.md\nM  package.json\n")).toEqual(["CHANGELOG.md", "package.json"]);
    expect(dirtyReleaseFiles("MM CHANGELOG.md\n")).toEqual(["CHANGELOG.md"]);
  });
});

describe("releaseRefusal", () => {
  it("lets a clean tree with no open merge through", () => {
    expect(releaseRefusal({ dirty: [], merging: false })).toBeNull();
  });

  it("refuses a dirty CHANGELOG.md, naming it, before anything is written", () => {
    expect(releaseRefusal({ dirty: ["CHANGELOG.md"], merging: false })).toBe(
      "CHANGELOG.md already has uncommitted changes. release:take commits those files, and would sweep the changes " +
        "into the release commit. Commit or put them back, then run it again. Nothing was written.",
    );
  });

  it("names both files when both are dirty", () => {
    expect(releaseRefusal({ dirty: ["CHANGELOG.md", "package.json"], merging: false })).toMatch(
      /^CHANGELOG\.md and package\.json already have uncommitted changes\./,
    );
  });

  it("refuses an open merge, because git will not make a partial commit inside one", () => {
    expect(releaseRefusal({ dirty: [], merging: true })).toMatch(/^A merge is still open\..*Nothing was written\.$/);
  });
});

describe("releaseCoAuthor", () => {
  it("falls back to the constant when RELEASE_CO_AUTHOR is not set, or is blank", () => {
    expect(releaseCoAuthor({})).toBe(RELEASE_CO_AUTHOR);
    expect(releaseCoAuthor({ RELEASE_CO_AUTHOR: "" })).toBe(RELEASE_CO_AUTHOR);
    expect(releaseCoAuthor({ RELEASE_CO_AUTHOR: "   " })).toBe(RELEASE_CO_AUTHOR);
  });

  it("uses a whole trailer from the environment as it is given, trimmed", () => {
    expect(releaseCoAuthor({ RELEASE_CO_AUTHOR: "  Co-Authored-By: Claude Next <noreply@anthropic.com>\n" })).toBe(
      "Co-Authored-By: Claude Next <noreply@anthropic.com>",
    );
  });

  it("puts the key on a value given as a name and address alone", () => {
    expect(releaseCoAuthor({ RELEASE_CO_AUTHOR: "Claude Next <noreply@anthropic.com>" })).toBe(
      "Co-Authored-By: Claude Next <noreply@anthropic.com>",
    );
  });

  it("reads only RELEASE_CO_AUTHOR, never who is committing", () => {
    expect(releaseCoAuthor({ GIT_AUTHOR_NAME: "John Morris", GIT_AUTHOR_EMAIL: "someone@example.invalid" })).toBe(
      RELEASE_CO_AUTHOR,
    );
  });
});

describe("releaseCommitMessage", () => {
  it("is the version and the first summary, then the co-author trailer", () => {
    expect(releaseCommitMessage("0.151.0", ["A new game a player would notice"], RELEASE_CO_AUTHOR)).toBe(
      `0.151.0 — A new game a player would notice\n\n${RELEASE_CO_AUTHOR}\n`,
    );
  });

  it("drops a summary's closing full stop from the subject only", () => {
    expect(releaseCommitMessage("0.151.0", ["A fix."], RELEASE_CO_AUTHOR).split("\n")[0]).toBe("0.151.0 — A fix");
  });

  it("lists every summary in the body when there is more than one, in the order given", () => {
    expect(releaseCommitMessage("0.151.0", ["First thing", "  ", "Second thing"], RELEASE_CO_AUTHOR)).toBe(
      `0.151.0 — First thing\n\n- First thing\n- Second thing\n\n${RELEASE_CO_AUTHOR}\n`,
    );
  });

  it("names a patch with no summary by its number alone", () => {
    expect(releaseCommitMessage("0.150.1", [], RELEASE_CO_AUTHOR)).toBe(`0.150.1\n\n${RELEASE_CO_AUTHOR}\n`);
  });

  it("ends with whatever trailer it is given", () => {
    const trailer = "Co-Authored-By: Claude Next <noreply@anthropic.com>";
    expect(releaseCommitMessage("0.151.0", ["New"], trailer)).toBe(`0.151.0 — New\n\n${trailer}\n`);
  });
});

describe("writeAndCommit", () => {
  it("writes both files, then commits exactly those two with the message, then reads the commit back", () => {
    const { io, events, written, inputs } = fakeIo();
    const outcome = writeAndCommit(io, BEFORE, AFTER, "0.151.0 — New\n");
    expect(outcome).toEqual({ ok: true, commit: "abc1234" });
    expect(events).toEqual([
      "write CHANGELOG.md",
      "write package.json",
      "git commit --only --quiet --file=- -- CHANGELOG.md package.json",
      "git rev-parse --short HEAD",
    ]);
    expect(inputs[0]).toBe("0.151.0 — New\n");
    expect(written).toEqual({ "CHANGELOG.md": AFTER.changelog, "package.json": AFTER.packageJson });
  });

  it("puts both files back as they were read when the commit fails, and reports git's own words", () => {
    const { io, events, written } = fakeIo({ git: "commit" });
    const outcome = writeAndCommit(io, BEFORE, AFTER, "0.151.0 — New\n");
    expect(outcome).toEqual({ ok: false, error: "fatal: something git objected to", restored: true });
    expect(events).toEqual([
      "write CHANGELOG.md",
      "write package.json",
      "git commit --only --quiet --file=- -- CHANGELOG.md package.json",
      "write CHANGELOG.md",
      "write package.json",
    ]);
    expect(written).toEqual({ "CHANGELOG.md": BEFORE.changelog, "package.json": BEFORE.packageJson });
  });

  it("never commits when a write fails, and still puts back the file it had already written", () => {
    const { io, events, written } = fakeIo({ write: { path: "package.json", nth: 1 } });
    const outcome = writeAndCommit(io, BEFORE, AFTER, "0.151.0 — New\n");
    expect(outcome).toMatchObject({ ok: false, restored: true });
    expect(events.some((event) => event.startsWith("git"))).toBe(false);
    expect(written).toEqual({ "CHANGELOG.md": BEFORE.changelog, "package.json": BEFORE.packageJson });
  });

  it("says it could not put the files back, rather than claiming it did", () => {
    const { io } = fakeIo({ git: "commit", write: { path: "package.json", nth: 2 } });
    const outcome = writeAndCommit(io, BEFORE, AFTER, "0.151.0 — New\n");
    expect(outcome).toEqual({
      ok: false,
      error: "fatal: something git objected to",
      restored: false,
      restoreError: "EACCES: package.json",
    });
  });
});

describe("commitRelease", () => {
  const release = {
    version: "0.151.0",
    published: "0.150.0",
    before: BEFORE,
    after: AFTER,
    summaries: ["New"],
    coAuthor: RELEASE_CO_AUTHOR,
  };

  it("prints that it committed only after the commit exists: write → commit → print", () => {
    const { io, events } = fakeIo();
    const { out, lines } = fakeOut();
    const order: string[] = [];
    const tracked: ReleaseIo = {
      git: (args, input) => (order.push("git"), io.git(args, input)),
      write: (path, content) => (order.push("write"), io.write(path, content)),
    };
    const trackedOut = { log: (line: string) => (order.push("print"), out.log(line)), error: out.error };

    expect(commitRelease(tracked, trackedOut, release)).toBe(true);
    expect(order).toEqual(["write", "write", "git", "git", "print"]);
    expect(events[2]).toBe("git commit --only --quiet --file=- -- CHANGELOG.md package.json");
    expect(lines).toEqual([
      'log 0.151.0 committed as abc1234 ("0.151.0 — New"): CHANGELOG.md and package.json, nothing else. Published was 0.150.0.',
    ]);
  });

  it("commits with the trailer the run was given, not the constant", () => {
    const { io, inputs } = fakeIo();
    const { out } = fakeOut();
    const trailer = "Co-Authored-By: Claude Next <noreply@anthropic.com>";
    expect(commitRelease(io, out, { ...release, coAuthor: trailer })).toBe(true);
    expect(inputs[0]).toBe(`0.151.0 — New\n\n${trailer}\n`);
  });

  it("prints no success line when the commit fails, only what the tree now holds", () => {
    const { io } = fakeIo({ git: "commit" });
    const { out, lines } = fakeOut();
    expect(commitRelease(io, out, release)).toBe(false);
    expect(lines.every((line) => line.startsWith("error "))).toBe(true);
    expect(lines[0]).toBe("error Could not commit 0.151.0: fatal: something git objected to");
    expect(lines.join("\n")).toContain("put back as they were");
  });
});

describe("commitFailureReport", () => {
  it("gives both ways out when the files could not be put back", () => {
    const lines = commitFailureReport(
      "0.151.0",
      { ok: false, error: "fatal: no", restored: false, restoreError: "EACCES" },
      `0.151.0 — New\n\n${RELEASE_CO_AUTHOR}\n`,
      RELEASE_CO_AUTHOR,
    );
    expect(lines).toContain(`  git commit --only -m "0.151.0 — New" -m "${RELEASE_CO_AUTHOR}" -- CHANGELOG.md package.json`);
    expect(lines).toContain("  git checkout -- CHANGELOG.md package.json");
  });
});
