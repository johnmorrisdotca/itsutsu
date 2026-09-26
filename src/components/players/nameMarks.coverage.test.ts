import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY LIST DRAWS A PLAYER'S NAME THE SAME WAY: NAME, FLAG, BADGE, LEVEL.
 *
 * John, 2026-09-26: "Inconsistent Player Names: Buddies has totally different
 * name formatting. Larger font and no flags etc... Ladder also is weird since
 * it doesn't have Flag. fix this issue." The members list drew a name with its
 * flag, kind badge and level; the ladder drew it bare, Buddies drew it larger
 * with no badge, and twenty-odd other lists each drew it their own way —
 * because `PlayerName` drew whatever marks a caller remembered to hand it.
 *
 * So a caller hands it one thing, `tag` (`NameTag`: flag, kind, level, read
 * for a whole page by `nameTagsOf`), and this gate fails the build for a
 * `<PlayerName>` without one. The honest exceptions are a name inside a
 * sentence or a heading, where marks read as a typo (`tagged={false}` says so
 * in the source), and the few below, each with its reason.
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

/** The file with its comments blanked out, so prose quoting the rule is not read as a breach. */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

/** Every `<PlayerName … />` call in a file, as its attributes. */
function calls(source: string): string[] {
  return [...source.matchAll(/<PlayerName\b([\s\S]*?)\/>/g)].map((match) => match[1] ?? "");
}

/**
 * Names drawn without marks, by file, with how many and why. Each reason is a
 * sentence or a heading — the name is a word in a line, or the line is about
 * that one person — or a list whose marks come from elsewhere.
 */
const UNMARKED: Record<string, { count: number; why: string }> = {
  "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx": { count: 2, why: "the game's title, 'Hanako vs Kuro': a heading" },
  "src/app/messages/[memberId]/page.tsx": { count: 1, why: "'Messages with Hanako': a sentence heading the thread" },
  "src/components/history/RivalryBoard.tsx": { count: 1, why: "the rivalry's two names as its headline, each with its level drawn large beside it" },
  "src/components/puzzles/PuzzleSolvePage.tsx": { count: 2, why: "whose solve this is, in the page's heading and its caption" },
  "src/components/puzzles/PuzzleRacePage.tsx": { count: 1, why: "a race's two seats, each named as the heading of its card" },
  "src/components/feed/FeedLine.tsx": { count: 1, why: "a feed line is a sentence: 'Hanako won 70 IP'" },
  "src/components/feed/FeedNewsLine.tsx": { count: 1, why: "a news line is a sentence: 'Hanako leads Reversi'" },
  "src/components/inbox/InboxList.tsx": { count: 1, why: "an inbox item is a sentence: 'Hanako challenged you to Reversi'" },
  "src/components/xp/AwardAbout.tsx": { count: 1, why: "what an award was for, in a sentence: 'beat Hanako'" },
  "src/components/games/GameStats.tsx": { count: 1, why: "one word of a game card's figure line: 'most wins: Hanako'" },
  "src/components/auth/AdminOperatorLog.tsx": { count: 1, why: "the operator's log, a sentence a line: 'shut Hanako'" },
  "src/components/auth/AdminMembers.tsx": {
    count: 1,
    why: "the operator's own list: whole names for telling two Hanakos apart, with the kind badge; a table for administering, not for reading who plays",
  },
  "src/components/about/MeasuredGrades.tsx": {
    count: 1,
    why: "the programs on /about, which a stranger reads: a program's flag and badge come from its id, and the chart is about their grades, not their levels",
  },
};

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: code(readFileSync(path, "utf8")) }));

describe("every list draws a player's name with its marks", () => {
  const withNames = FILES.filter((file) => calls(file.source).length > 0);

  it("finds the names at all, so a passing run means something", () => {
    expect(withNames.length).toBeGreaterThanOrEqual(30);
  });

  it("hands every PlayerName its tag, or says it is in a sentence", () => {
    const offenders: string[] = [];
    for (const file of withNames) {
      const bare = calls(file.source).filter((attributes) => !/\btag=/.test(attributes) && !/tagged=\{false\}/.test(attributes));
      const allowed = UNMARKED[file.path]?.count ?? 0;
      if (bare.length > allowed) offenders.push(`${file.path}: ${bare.length} without a tag, ${allowed} allowed`);
    }
    expect(offenders, "pass `tag` from `nameTagsOf` (or `withoutLevel` where the table has its own level) — or name the file in UNMARKED with why").toEqual([]);
  });

  it("names no exception that is no longer there", () => {
    const stale: string[] = [];
    for (const [path, { count }] of Object.entries(UNMARKED)) {
      const file = FILES.find((one) => one.path === path);
      const bare = file === undefined ? 0 : calls(file.source).filter((attributes) => !/\btag=/.test(attributes) && !/tagged=\{false\}/.test(attributes)).length;
      if (bare !== count) stale.push(`${path}: ${bare} bare, listed as ${count}`);
    }
    expect(stale, "an exception nobody uses is a hole nobody knows is open").toEqual([]);
  });

  it("draws the three marks in one place, in the name component", () => {
    const name = code(readFileSync("src/components/players/PlayerName.tsx", "utf8"));
    expect(name).toContain("<CountryMark");
    expect(name).toContain("<MemberKindBadge");
    expect(name).toContain("<LevelName");
    // And the read behind them fills all three, once for a page.
    const read = code(readFileSync("src/lib/xp/nameTagsOf.ts", "utf8"));
    expect(read).toMatch(/level: levelShown\(/);
    expect(read).toMatch(/id: \{ in: wanted \}/);
  });
});
