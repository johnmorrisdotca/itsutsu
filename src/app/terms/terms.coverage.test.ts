import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { TERMS_CHANGED, TERMS_SECTIONS } from "./terms.constants";

/**
 * THE TERMS SAY ONLY WHAT THE SITE DOES (PRIV-05).
 *
 * Every sentence in `terms.constants.ts` is either a request, and says so, or
 * a fact about the code. This holds the facts: the ban and the ignore list
 * exist, ignoring really stops messages and offers, Report a problem really is
 * in the footer, the page is really open to a stranger and reachable from the
 * footer and the join page, and the date is a real one.
 */

const read = (path: string) => readFileSync(path, "utf8");
const text = TERMS_SECTIONS.flatMap((section) => [...section.paragraphs, ...(section.points ?? [])]).join("\n");
const said = (id: string) => {
  const section = TERMS_SECTIONS.find((one) => one.id === id);
  if (section === undefined) throw new Error(`No terms section ${id}`);
  return section.paragraphs.join("\n");
};

describe("the terms of play", () => {
  it("asks, rather than claims, what nothing enforces", () => {
    expect(said("one-account")).toContain("We ask each person");
    expect(said("own-moves")).toContain("We ask that");
  });

  it("describes a shut account the way the code shuts one", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/bannedAt\s+DateTime\?/);
    expect(said("shut")).toContain("invite it came in with stops working too");
    expect(read("src/components/auth/AdminMembers.tsx")).toContain("revokes the invite it came in by");
  });

  it("promises of Ignore exactly what ignoring does", () => {
    expect(said("be-kind")).toContain("can no longer send you a message or offer you a game");
    expect(read("src/lib/messages/messages.ts")).toContain("isIgnoring(toId, fromId)");
    expect(read("src/lib/history/liveAgainst.ts")).toMatch(/isIgnoring\(them\.id, mineId\)/);
  });

  it("points at a Report a problem that is on every page", () => {
    expect(said("be-kind")).toContain("Report a problem, at the foot of every page");
    expect(read("src/components/layout/SiteFooter.tsx")).toContain("<ReportProblem");
  });

  it("says a finished game is kept, which removal honours", () => {
    expect(said("ending")).toContain("neither of them can delete it");
    expect(read("src/lib/auth/removeMember.ts")).not.toMatch(/prisma\.(game|move)\.delete/);
  });

  it("is open to a stranger and reachable from the footer and the join page", () => {
    expect(read("src/proxy.ts")).toMatch(/^\s+"\/terms",$/m);
    expect(read("src/app/robots.ts")).toContain('"/terms"');
    expect(read("src/components/layout/SiteFooter.tsx")).toContain('href: "/terms"');
    expect(read("src/app/join/page.tsx")).toContain('href="/terms"');
  });

  it("carries a real date, not one in the future", () => {
    expect(TERMS_CHANGED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(TERMS_CHANGED))).toBe(false);
    expect(Date.parse(TERMS_CHANGED)).toBeLessThanOrEqual(Date.now());
  });

  it("says nothing it will do later", () => {
    expect(text).not.toMatch(/\bwill\b/);
  });
});
