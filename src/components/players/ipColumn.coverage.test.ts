import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY TABLE THAT SHOWS XP SHOWS IP BESIDE IT, AND THIS KEEPS IT THAT WAY.
 *
 * John, 2026-09-26: "Entire Site, tables where we show XP should probably also
 * show IP. requires a sweep of site." XP is taking part and IP is winning, so a
 * table of people carries both, IP directly after XP. The XP column was added
 * to one table and not the rest three times before `xpColumn.coverage.test.ts`
 * existed; this is the same gate for its neighbour, written the day the column
 * arrived rather than the third time it went missing.
 *
 * Three things it holds:
 *
 * 1. **A `RecordTable` shows IP wherever it shows XP.** Both switches are on by
 *    default, and `ip: false` is only allowed beside `xp: false`, whose reason
 *    (the rows are games or sites, not people) `xpColumn.coverage.test.ts`
 *    already demands.
 * 2. **A table that shows the column fills it.** A file drawing IP sets `ip:`
 *    on its rows, or every cell would be a dash.
 * 3. **A table built by hand with an XP heading has an IP heading after it, and
 *    draws the shared `IpCell`** — except the few named below, each with why.
 */

const ROOTS = ["src/components", "src/app"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

/** The file with its comments blanked out, as `xpColumn.coverage.test.ts` reads it. */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: code(readFileSync(path, "utf8")) }));

/** Every `<RecordTable …>` call, as the source from its tag to the next one. */
function recordTables(source: string): string[] {
  const starts = [...source.matchAll(/<RecordTable\b/g)].map((match) => match.index);
  return starts.map((at, index) => source.slice(at, starts[index + 1] ?? source.length));
}

const XP_OFF = /columns=\{\{[^}]*xp:\s*false/;
const IP_OFF = /columns=\{\{[^}]*ip:\s*false/;

describe("every RecordTable shows IP wherever it shows XP", () => {
  const withTables = FILES.filter((file) => recordTables(file.source).length > 0);

  it("has tables to check, so a passing run means something", () => {
    expect(withTables.length).toBeGreaterThanOrEqual(8);
  });

  it("switches IP off only where XP is off too", () => {
    const offenders = withTables
      .filter((file) => recordTables(file.source).some((tag) => IP_OFF.test(tag) !== XP_OFF.test(tag)))
      .map((file) => file.path);
    expect(offenders, "IP goes on and off with XP: a table of people shows both, a table of games or sites neither").toEqual([]);
  });

  it("a table that shows the column fills it on its rows", () => {
    const showing = withTables.filter((file) => recordTables(file.source).some((tag) => !IP_OFF.test(tag)));
    expect(showing.length).toBeGreaterThanOrEqual(5);
    for (const file of showing) {
      expect(file.source, `${file.path} draws the IP column and never sets ip: on a row`).toMatch(/\bip:\s*(\{\s*ip:|[\w.]+\s*===)/);
    }
  });

  it("draws the heading directly after XP, and the cell after the XP cell", () => {
    const trailing = code(readFileSync("src/components/players/recordTrailing.tsx", "utf8"));
    expect(trailing).toMatch(/columns\.ip !== false \? <IpCell/);
    expect(trailing.indexOf("<IpCell ip={row.ip")).toBeGreaterThan(trailing.indexOf("<XpCell xp={row.xp"));
    const heads = trailing.slice(trailing.indexOf("export function trailingHeadings"));
    expect(heads.indexOf(">\n          IP\n")).toBeGreaterThan(heads.indexOf(">\n          XP\n"));
  });
});

/**
 * Tables built by hand with an XP heading and no IP column, each with why.
 *
 * The reason is the one `xpColumn.coverage.test.ts` gives for switching XP off,
 * seen from the other side: the rows are not people, so XP there is a sum of
 * awards, not a member's total, and there is no member on the row to have won
 * anything.
 */
const HAND_BUILT_WITHOUT_IP: Record<string, string> = {
  "src/components/xp/PlayerXpHistory.tsx": "one person's awards, day by day: XP here is what each award paid, and the rows are awards",
  "src/components/mine/MyXp.tsx": "the reader's own ledger: XP here is what each award paid, and the rows are awards",
};

/**
 * Boards RANKED by IP, where IP is the row's figure and leads it, with XP
 * beside it as the other half: the order is the other way round on purpose,
 * and the figure is drawn by the board's own link to the games behind it.
 */
const IP_LEADS: Record<string, string> = {
  "src/components/points/IpBoard.tsx": "the IP leaderboard: ranked by IP, so IP comes first and XP after it",
};

/** Files with a `<table>` and an XP heading, read as a `<th>` holding just "XP". */
const WITH_XP = FILES.filter((file) => /<table\b/.test(file.source) && /<th\b[^>]*>\s*XP\s*</.test(file.source));

describe("a table built by hand with an XP heading has IP after it", () => {
  it("finds such tables at all, so the check below is not vacuous", () => {
    // The champions (both views), the open seats and the rung, when this was written.
    expect(WITH_XP.length).toBeGreaterThanOrEqual(4);
  });

  it("every exception is a file that still has the table", () => {
    const known = new Set(WITH_XP.map((file) => file.path));
    expect(Object.keys(HAND_BUILT_WITHOUT_IP).filter((path) => !known.has(path))).toEqual([]);
  });

  it("names IP in a heading after XP, and draws the shared cell", () => {
    for (const file of WITH_XP) {
      if (HAND_BUILT_WITHOUT_IP[file.path] !== undefined) continue;
      const xp = file.source.search(/<th\b[^>]*>\s*XP\s*</);
      const ip = file.source.search(/<th\b[^>]*>\s*IP\s*</);
      if (IP_LEADS[file.path] !== undefined) {
        expect(ip, `${file.path} is an IP board with no IP heading`).toBeGreaterThan(-1);
        continue;
      }
      expect(ip, `${file.path} has an XP heading and no IP heading after it — or say in HAND_BUILT_WITHOUT_IP why not`).toBeGreaterThan(xp);
      expect(file.source, `${file.path} has an IP heading and no IpCell under it`).toContain("<IpCell");
    }
  });
});

describe("IP beside XP is read once for a page, never per row", () => {
  it("the reads a table's IP comes from are the grouped ones", () => {
    const reads = code(readFileSync("src/lib/points/ipBoards.ts", "utf8"));
    // Both group over the members a page already holds, in one statement.
    expect(reads).toMatch(/export async function ipTotalsOf\(/);
    expect(reads).toMatch(/export async function ipByGameOf\(/);
    expect(reads).toMatch(/GROUP BY "memberId", game/);
  });
});
