import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY QUERY THAT LISTS OR COUNTS MORE THAN ONE `Member` ROW GOES THROUGH
 * `hiddenMembersWhere`, OR SAYS WHY NOT — the same shape
 * `xpColumn.coverage.test.ts` and `gameLinks.coverage.test.ts` already hold
 * this codebase to: read the source, look for the call, and name every
 * honest exception by file with its reason beside it, so a hole in the rule
 * is a decision somebody can see and argue with rather than a silent gap.
 *
 * WHAT THIS LOOKS FOR: `prisma.member.findMany(`, `.count(`, `.groupBy(` and
 * `.aggregate(` — the four Prisma calls that can return or count MORE THAN
 * ONE row. `findFirst` and `findUnique` are deliberately not matched: a
 * lookup of one already-known member (banning them, reading their own row to
 * render their own page) is not a place a test member needs hiding from —
 * there is nothing to hide it AMONG.
 *
 * WHAT PASSING HERE DOES NOT MEAN. It means the file CALLS `hiddenMembersWhere`
 * somewhere in it, not that every one of its `prisma.member` calls uses it —
 * grepping for the true AND of "this call" and "this rule" would need a real
 * parser, and `gameLinks.coverage.test.ts`'s own note says why that trade is
 * made deliberately here too: crude and readable beats precise and unmaintained.
 * A file named as converted that stops truly filtering is exactly the kind of
 * regression a REVIEW catches; what this buys is that nobody adds a brand new,
 * completely unfiltered listing query without the build telling them so.
 *
 * See `docs/plans/test-mode/README.md` for the full surface list this was
 * built from, which surfaces are converted today, and what is left.
 */

const ROOTS = ["src/lib", "src/app", "src/components"];

/** Every file, and why it lists or counts `Member` rows without going through the rule. */
const EXCEPTIONS: Record<string, string> = {
  "src/lib/xp/nameTagsOf.ts": "reads an explicit list of ids an upstream, already-filtered query chose — nothing to hide it among",
  "src/lib/auth/memberRoster.ts": "the operator's own Members tab: an admin with Test Mode on is exactly who should see everything, and everyone else cannot reach it — not yet threaded, see the plan's remaining work",
  "src/lib/auth/members.ts": "member lookups and admin actions on named accounts — remaining work, see the plan",
  "src/lib/auth/operatorLog.ts": "the operator's own audit log of actions taken — remaining work, see the plan",
  "src/lib/feed/feedRead.ts": "the activity feed — remaining work, see the plan",
  "src/lib/history/activeGames.ts": "the active-game cap's own bookkeeping, keyed by member id — remaining work, see the plan",
  "src/lib/history/currentNames.ts": "resolves names for a list of ids already chosen elsewhere, the same shape as nameTagsOf — remaining work, see the plan",
  "src/lib/history/gameHistory.ts": "the site's game record — remaining work, see the plan",
  "src/lib/history/posterStandingRead.ts": "who is posted where in a game's history — remaining work, see the plan",
  "src/lib/phrase/phraseStore.ts": "four-word credential bookkeeping, keyed by member — remaining work, see the plan",
  "src/lib/phrase/seatPick.ts": "candidate names offered by the four-word picker — remaining work, see the plan",
  "src/lib/puzzles/server/puzzleSolves.ts": "puzzle leaderboards — remaining work, see the plan, named explicitly as a next surface",
  "src/lib/rating/directoryPage.ts": "the /players directory's paged query — remaining work, see the plan, named explicitly as a next surface",
  "src/lib/rating/directoryRows.ts": "the directory's row-building helpers, including the computer players' own list — remaining work, see the plan",
  "src/lib/rating/directorySettled.ts": "who has settled where in the directory's own order — remaining work, see the plan",
  "src/lib/rating/playedRun.ts": "a member's own played-games streak — remaining work, see the plan",
  "src/lib/rating/players.ts": "a game's own ladder — remaining work, see the plan, named explicitly as a next surface",
  "src/lib/record/rivalryRead.ts": "head-to-head record between two named members — remaining work, see the plan",
  "src/lib/site/siteNumbers.ts": "the site's own headline counts (About, home page) — remaining work, see the plan",
  "src/lib/social/childReach.ts": "who a child member may reach — a safety rule, deliberately untouched until reviewed with John",
  "src/lib/social/presence.ts": "who is here now — remaining work, see the plan, named explicitly as a next surface",
  "src/lib/xp/importedXpPay.ts": "the imported-XP payer's own runner, which only ever touches kept records, never test members — out of scope by construction",
  "src/lib/xp/xpOfMembers.ts": "reads an explicit list of ids an upstream, already-filtered query chose, the same shape as nameTagsOf",
};

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: readFileSync(path, "utf8") }));

const LISTS_OR_COUNTS = /prisma\.member\.(findMany|count|groupBy|aggregate)\(/;

describe("test mode: every list or count of Member rows hides test members, or says why not", () => {
  it("calls hiddenMembersWhere, or is a named exception", () => {
    const found: string[] = [];
    for (const { path, source } of FILES) {
      if (path === "src/lib/testMode/testMode.ts") continue;
      if (!LISTS_OR_COUNTS.test(source)) continue;
      if (source.includes("hiddenMembersWhere(")) continue;
      if (path in EXCEPTIONS) continue;
      found.push(path);
    }
    expect(
      found,
      "This file lists or counts more than one Member row and never calls hiddenMembersWhere() " +
        "(src/lib/testMode/testMode.ts). Thread a TestModeReader through to it, or name the file " +
        "in EXCEPTIONS above with the reason it does not need to.",
    ).toEqual([]);
  });

  it("names no exception for a file that no longer exists, or that no longer needs one", () => {
    const stale = Object.keys(EXCEPTIONS).filter((path) => {
      const file = FILES.find((f) => f.path === path);
      if (file === undefined) return true;
      return !LISTS_OR_COUNTS.test(file.source) || file.source.includes("hiddenMembersWhere(");
    });
    expect(stale, "An EXCEPTIONS entry for a file that has moved on: take the line out.").toEqual([]);
  });
});
