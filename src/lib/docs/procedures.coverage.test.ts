import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * John, 2026-10-02: someone who reads only AGENTS.md, or only the README, must
 * still learn the procedures that live in the other. So both open with the same
 * numbered list between these markers, and this test fails when they differ.
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

describe("the procedures block", () => {
  it("is the same in AGENTS.md and the README", () => {
    expect(block("README.md")).toBe(block("AGENTS.md"));
  });

  it("names the rules a new agent must not miss", () => {
    const agents = block("AGENTS.md");
    for (const word of ["ticket before any work", "worktree", "preflight:prod", "release:take:prod", "first failed job", "No AI attribution"]) {
      expect(agents.toLowerCase(), word).toContain(word.toLowerCase());
    }
  });
});
