import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A REFUSED OFFER IS NOT A GAME, AND NO LISTING MAY SHOW IT AS ONE.
 *
 * A declined or withdrawn offer is filed `status: finished, result:
 * abandoned` — the filing a board called off before the first stone already
 * gets, and the only thing the stored result can honestly say about a game
 * nobody played. That was chosen over a third `GameLifecycle` value for the
 * reasons in the migration, and it has one cost, which is this: every query
 * asking for finished games sees it unless it is told not to.
 *
 * Most are safe for free, because they also ask `result: { not: "abandoned" }`
 * for their own reasons. Three were not, and were fixed. The trouble is the
 * FOURTH — the one somebody writes next month, which will look exactly like
 * the safe ones and will quietly put a game two people never agreed to on a
 * public page beside real ones.
 *
 * So the rule is a gate rather than a habit, in the manner of
 * `gameLinks.coverage.test.ts` and `doorstep.coverage.test.ts`: every query
 * against the `Game` table must say how it avoids refused offers, and a new
 * one that says nothing fails the build. Crude on purpose — it reads the
 * source, because this is a rule about what a query asks for.
 *
 * FOUR WAYS TO BE SAFE, and each is a real answer rather than a loophole:
 *
 *  1. **It asks for active games.** A refused offer is finished, so it cannot
 *     appear. This is the cap, the lobby and the bot sweeps.
 *  2. **It excludes abandoned results.** A refused offer is abandoned, so it
 *     cannot appear. This is the player records and the played counts.
 *  3. **It carries `NOT_A_REFUSED_OFFER`.** Said outright, for the queries
 *     that must include real abandoned games — the record itself does.
 *  4. **It is named below with its reason.** For the queries that cannot show
 *     a refused offer whatever it does, because of what else they require.
 */

const ROOTS = ["src/lib", "src/app", "src/components"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|coverage)\.tsx?$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

/** Every read of the Game table, as `file:offset` with the source that follows it. */
type Query = { path: string; at: number; source: string };

/** The reads that could list a game. A `findUnique` by id is not one: it names a row. */
const READS = /prisma\.game\.(findMany|count|groupBy|aggregate|findFirst)\s*\(/g;

/**
 * How much of the call to read when looking for its guards.
 *
 * Generous, because a `where` is often several lines below the call and often
 * spread from a constant declared above it — so the window also runs
 * backwards. Over-reading makes this gate LESS likely to fail wrongly and
 * more likely to miss one; the alternative, parsing TypeScript, is a worse
 * trade for a rule this shape.
 */
const BEFORE = 1400;
const AFTER = 900;

const QUERIES: Query[] = [];
for (const path of ROOTS.flatMap(filesUnder)) {
  const source = readFileSync(path, "utf8");
  for (const found of source.matchAll(READS)) {
    const at = found.index ?? 0;
    QUERIES.push({
      path,
      at,
      source: source.slice(Math.max(0, at - BEFORE), at + AFTER),
    });
  }
}

/**
 * The queries that are safe for a reason none of the three patterns can see,
 * each with the reason written out — which is the point of naming them. A
 * rule with unexplained holes rots; a rule whose holes say why can be argued
 * with.
 *
 * Keyed by file, because a file's queries are safe for one reason where they
 * are safe at all, and a line number in a test is a thing that goes stale on
 * the next edit above it.
 */
const SAFE_BECAUSE = new Map([
  [
    "src/lib/history/verdicts.ts",
    "requires a non-null verdict on a seat — a private read of your own play, which nobody ever left on an offer they refused",
  ],
  [
    "src/lib/history/timeGifts.ts",
    "requires at least one TimeGift row; no clock ever ran on an offer, so none can have been given on one",
  ],
  [
    "src/lib/xp/xpHistoryPage.ts",
    "looks up variants by a list of ids the ledger already holds, to LINK an XP row to its match — and an ask that was declined should still link to the offer it was about, which is the opposite of hiding it",
  ],
  [
    "src/lib/history/myGames.ts",
    "IS the queue: it is the one reader that must see offers, and `fetchMyGames` sorts them into their own two groups rather than into the playing ones",
  ],
  [
    "src/lib/auth/members.ts",
    "counts and sweeps member rows against their games by id, never listing a game to anybody",
  ],
  /*
   * FOUND BY THIS GATE on the hour it was written, which is the argument for
   * it existing: nothing in the sweep that preceded it had looked at the XP
   * side of the site at all.
   */
  [
    "src/lib/xp/xpGameServer.ts",
    "asks for a game with a WINNER in it — `hadBeatenMe` looks for a decided game between two members — and a refused offer has `winner: null`, so it cannot match whatever else is true of it",
  ],
]);

/** Whether this call answers the rule, and which of the ways. */
function guardedBy(query: Query): string | null {
  const said = SAFE_BECAUSE.get(query.path);
  if (said !== undefined) return `named: ${said}`;
  if (/NOT_A_REFUSED_OFFER/.test(query.source)) return "excludes refused offers outright";
  /*
   * OR IT GOES THROUGH THE RECORD'S OWN CHOKE POINT, which carries the
   * exclusion for every narrowing of /history at once. A query built from
   * `buildGameWhere` is answered by whatever that function asks, and the last
   * assertion in this file is what keeps that answer true — so this is a
   * pointer at a checked fact rather than a hole.
   */
  if (/buildGameWhere\(/.test(query.source)) return "filters built by buildGameWhere";
  if (/status:\s*"active"/.test(query.source)) return "asks for active games only";
  if (/result:\s*\{\s*not:\s*"abandoned"\s*\}/.test(query.source)) return "excludes abandoned results";
  return null;
}

describe("no listing shows a refused offer as a game", () => {
  it("finds the queries at all, so a rename cannot make this gate vacuous", () => {
    /*
     * The failure this catches is the quiet one: `prisma.game` renamed, or the
     * roots moved, and a gate that then passes because it is looking at
     * nothing. AGENTS.md: a green test must be a statement about the code, and
     * "I could not get far enough to look" is not one.
     */
    expect(QUERIES.length).toBeGreaterThan(8);
  });

  it("has an answer for every one of them", () => {
    const unguarded = QUERIES.filter((query) => guardedBy(query) === null).map(
      (query) => `${query.path} (at character ${query.at})`,
    );
    expect(
      unguarded,
      `These reads of the Game table could return a declined or withdrawn offer and show it as a finished game.\n` +
        `Give each one of them one of the four answers in the head of this file:\n` +
        `  · spread NOT_A_REFUSED_OFFER into its where (from @/lib/history/offers)\n` +
        `  · or ask status: "active"\n` +
        `  · or ask result: { not: "abandoned" }\n` +
        `  · or name the file in SAFE_BECAUSE with the reason it cannot show one.\n` +
        `Unanswered:\n${unguarded.join("\n")}`,
    ).toEqual([]);
  });

  it("keeps the record itself saying so outright, since it must include real abandoned games", () => {
    /*
     * `buildGameWhere` is the choke point for /history and every narrowing of
     * it, and it is the one that cannot take the cheap way out: an unfinished
     * game is part of the record, so `result: { not: "abandoned" }` is not
     * available to it. If this assertion ever fails, the fix is not to add that
     * clause — it is to put `NOT_A_REFUSED_OFFER` back.
     */
    const source = readFileSync("src/lib/history/gameHistoryQuery.ts", "utf8");
    expect(source).toContain("NOT_A_REFUSED_OFFER");
  });
});

/**
 * AND NOTHING MAY BE DONE TO AN OFFER BUT ANSWER IT.
 *
 * The five seat-bound acts each refuse an unanswered offer, and each does it
 * on the row it has already read rather than on a second query. The dangerous
 * one is `resignGame`: the offerer holds a real token for their own seat, so
 * without its guard they could resign an offer — writing a rated loss for
 * themselves and a win, on a permanent public record, for somebody who never
 * agreed to play.
 */
describe("nothing plays or ends a game nobody has accepted", () => {
  const GUARDED = [
    ["src/lib/history/liveGame.ts", ["appendMove"]],
    [
      "src/lib/history/liveGameEndings.ts",
      ["giveTime", "claimTimeout", "settleEnded", "cancelGame", "resignGame"],
    ],
  ] as const;

  for (const [path, functions] of GUARDED) {
    it(`${path} refuses an offer in all ${functions.length} of its doors`, () => {
      const source = readFileSync(path, "utf8");
      /*
       * Counted rather than merely found, because the failure to catch is one
       * guard added and the next one forgotten — which is exactly what
       * happened to `settleEnded`'s sibling rule about posted seats, where one
       * of the five had it and four did not.
       */
      const guards = source.match(/isOffered\(row\)/g) ?? [];
      expect(
        guards.length,
        `${path} declares ${functions.length} ways to play or end a game (${functions.join(", ")}) ` +
          `and ${guards.length} of them test isOffered(row).`,
      ).toBeGreaterThanOrEqual(functions.length);
    });
  }

  it("keeps no clock running against an offer, in the one place both the board and the claim ask", () => {
    const source = readFileSync("src/lib/history/deadline.ts", "utf8");
    expect(source).toContain("game.offeredAt");
  });

  it("leaves neither seat of an offer free, so no link and no four words can take one", () => {
    for (const path of ["src/lib/history/seats.ts", "src/lib/phrase/standInSeat.ts"]) {
      expect(readFileSync(path, "utf8"), `${path} lets a seat of an offer read as free`).toMatch(
        /offeredAt/,
      );
    }
  });
});
