import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * John, 2026-10-02: someone who reads only AGENTS.md, or only the README, must
 * still learn the procedures that live in the other. So both open with the same
 * checklist between these markers, and this test fails when they differ.
 *
 * John, 2026-10-07: "make sure the documentation and agents files are updated
 * so even the dumbest of AI agents knows how to make changes and deploy." The
 * checklist is commands, and a command that does not exist is worse than none,
 * so the second half of this file reads the block for what it names and checks
 * that each of it is real.
 */
const START = "<!-- procedures:start -->";
const END = "<!-- procedures:end -->";

function block(file: string): string {
  const text = readFileSync(join(process.cwd(), file), "utf8");
  const from = text.indexOf(START);
  const to = text.indexOf(END);
  expect(from, `${file} has no procedures block`).toBeGreaterThanOrEqual(0);
  expect(to).toBeGreaterThan(from);
  return text.slice(from, to + END.length);
}

function packageScripts(): Set<string> {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
  return new Set(Object.keys(pkg.scripts));
}

describe("the procedures block", () => {
  it("is the same in AGENTS.md and the README", () => {
    expect(block("README.md")).toBe(block("AGENTS.md"));
  });

  it("names the rules and the steps a new agent must not miss", () => {
    const agents = block("AGENTS.md");
    const required = [
      "ticket before any work",
      "pnpm task:prod add",
      "worktree",
      "before `pnpm install`",
      "quality:check",
      "E2E_SERVER=start",
      "PW_TEST_CONNECT_WS_ENDPOINT",
      "git -c user.name=\"John Morris\"",
      "preflight:prod",
      "release:take:prod",
      "git merge-base --is-ancestor origin/main HEAD",
      "git push -q --atomic origin HEAD:main",
      "first failed job",
      "gh run rerun $RUN --failed",
      "vercel@latest ls itsutsu --prod",
      "429",
      "neonctl branches create",
      "No AI attribution",
      "git add -A",
    ];
    for (const word of required) expect(agents.toLowerCase(), word).toContain(word.toLowerCase());
  });

  it("says no step is for the agent that is not the one that lands", () => {
    expect(block("AGENTS.md")).toContain("**Who lands.**");
  });

  it("no longer tells anybody to read the live version by loading the site", () => {
    const agents = block("AGENTS.md");
    // The site answers a plain curl with a 429 challenge since 2026-10-07; the
    // block may name curl only to say that it fails.
    expect(agents).not.toMatch(/curl -s https:\/\/itsutsu\.com/);
    expect(agents).not.toMatch(/grep -oE '0\\\./);
  });

  it("runs only pnpm scripts that exist", () => {
    const scripts = packageScripts();
    // pnpm's own commands, and the scripts that live in other checkouts: UmaKuma's
    // archive of a dump, and `check`, which each package repository has for itself.
    const NOT_SCRIPTS = new Set(["install", "exec", "dlx", "add", "audit", "run"]);
    const OTHER_CHECKOUT = new Set(["db:backup:archive", "check"]);
    const named = new Set<string>();
    // Only what is written as code: a fenced block, or a span between backticks
    // (the prose wraps a span across lines, so `pnpm` may be followed by a break).
    const text = block("AGENTS.md");
    const fenced = [...text.matchAll(/```[\s\S]*?```/g)].map((match) => match[0]);
    const spans = [...text.replace(/```[\s\S]*?```/g, "").matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    for (const code of [...fenced, ...spans]) {
      for (const match of code.matchAll(/pnpm\s+([a-z][a-z0-9:-]*)/g)) named.add(match[1]!);
    }
    expect(named.size, "the block names no pnpm script at all").toBeGreaterThan(8);
    for (const name of named) {
      if (NOT_SCRIPTS.has(name) || OTHER_CHECKOUT.has(name)) continue;
      expect(scripts.has(name), `the checklist runs "pnpm ${name}" and package.json has no such script`).toBe(true);
    }
  });

  it("names only spec files that exist", () => {
    const missing = [...block("AGENTS.md").matchAll(/e2e\/([a-z0-9-]+\.spec\.ts)/g)]
      .map((match) => match[1]!)
      .filter((file) => {
        try {
          readFileSync(join(process.cwd(), "e2e", file));
          return false;
        } catch {
          return true;
        }
      });
    expect(missing, "the checklist names browser specs that are not in e2e/").toEqual([]);
  });
});
