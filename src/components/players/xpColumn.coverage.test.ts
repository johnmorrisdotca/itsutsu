import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY TABLE OF PEOPLE'S RECORDS SHOWS XP, AND THIS IS WHAT KEEPS IT THAT WAY.
 *
 * John, on 2026-09-14, looking at a site where the members list had the column
 * and nothing else did:
 *
 *   "Make sure all STATS tables actually show the userXP in them too… never
 *    mind after the Rating column for now. This means everywhere in the site.
 *    why are some pages now showing it???"
 *
 * The "why" is the reason this file exists. A column had been added to ONE
 * table and not the rest — for the third time in this codebase's life — and
 * nothing failed, because nothing knew that "a table of people's records" was a
 * kind of thing with a rule about it. `gameLinks.coverage.test.ts` is the
 * shape this borrows: read the source, look for the shape that goes wrong, and
 * list every honest exception by name with its reason beside it, so that a
 * hole is a decision somebody can argue with rather than an oversight that
 * looks identical to one.
 *
 * Three things it holds:
 *
 * 1. **A `RecordTable` shows the column unless it says why not.** The switch
 *    is on by default, so only `xp: false` can take it off — and every
 *    `xp: false` on the site must be in `NOT_PEOPLE` with the reason, which is
 *    always the same reason: the rows are games or sites, and nobody is on the
 *    row to have earned anything.
 * 2. **A table that shows the column fills it by the one rule.** A row's `xp`
 *    comes from `xpShown` — either called in the file, or read off a figure the
 *    server already decided through `xpByMemberId`, which calls it. A file that
 *    draws the column and never sets `xp:` on a row would print a dash on every
 *    line, which is the column of nothing the whole rule is against.
 * 3. **A table built by hand, outside `RecordTable`, with a person's rating on
 *    it, has an XP heading after the rating.** The champions table is one; the
 *    two named exceptions each say why they are not.
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

/**
 * The file with its comments blanked out, character for character — the same
 * stripper `gameLinks.coverage.test.ts` uses, and for the same reason: every
 * one of these files EXPLAINS the rule in prose that quotes it, and a gate that
 * reads the explanation as a breach is a gate people delete.
 */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({
  path,
  source: code(readFileSync(path, "utf8")),
}));

/**
 * Every `<RecordTable …>` call site in a file, as the stretch of source from
 * that tag to the next one (or the end of the file).
 *
 * Not "up to the closing `/>`": a call's `rows` and `empty` props hold nested
 * elements — a `<GameThumb … />`, a `<Link>` — so the first `/>` after the tag
 * is somebody else's, and a matcher that stopped there read `MyRecord`'s
 * `columns` as belonging to no table at all. A call site's `columns` is the
 * only `columns=` between its tag and the next, which is what this reads.
 */
function recordTables(source: string): string[] {
  const starts = [...source.matchAll(/<RecordTable\b/g)].map((match) => match.index);
  return starts.map((at, index) => source.slice(at, starts[index + 1] ?? source.length));
}

/**
 * The tables that switch the column OFF, each with the reason it may.
 *
 * ONE REASON, STATED THREE TIMES, because it is the only reason there is: the
 * rows are not people. A person's XP is one number, and repeating it beside
 * every game they play or every site they played on would be a column about
 * the page's subject rather than about the row — it is in the header of the
 * page instead, where the person is. A fourth entry here needs the same reason
 * or it is the fault this gate exists for, wearing an exception.
 */
const NOT_PEOPLE: Record<string, string> = {
  "src/components/players/ItsutsuRecord.tsx": "one person's record game by game: the rows are games",
  "src/components/players/WholeRecord.tsx": "one person's record site by site: the rows are sites",
  "src/components/mine/MyRecord.tsx": "the reader's own standing at each game: the rows are games",
};

describe("every RecordTable shows the XP column unless it says why not", () => {
  const withTables = FILES.filter((file) => recordTables(file.source).length > 0);

  it("has tables to check, so a passing run means something", () => {
    // The members list, the ladder, two standings tables, two of programs, and
    // the three that switch it off: a count under this means the pattern has
    // stopped seeing the tag it is about.
    expect(withTables.length).toBeGreaterThanOrEqual(8);
  });

  it("every exception is a file that still exists and still switches it off", () => {
    const known = new Map(withTables.map((file) => [file.path, file.source]));
    for (const [path, reason] of Object.entries(NOT_PEOPLE)) {
      expect(known.has(path), `${path} (${reason}) has no RecordTable any more`).toBe(true);
      // An exception nobody uses is a hole nobody knows is open.
      expect(known.get(path), `${path} no longer says xp: false — take it off the list`).toMatch(/xp:\s*false/);
    }
  });

  it("only a table whose rows are not people switches it off", () => {
    const offenders = withTables
      .filter((file) => recordTables(file.source).some((tag) => /columns=\{\{[^}]*xp:\s*false/.test(tag)))
      .map((file) => file.path)
      .filter((path) => NOT_PEOPLE[path] === undefined);
    expect(
      offenders,
      "a table of people shows XP after the rating — or its rows are games or sites, said in NOT_PEOPLE with the reason",
    ).toEqual([]);
  });

  it("a table that shows the column fills it on every row, by the one rule", () => {
    /*
     * The column being ON is not the same as the column saying anything: a
     * caller that never sets `xp:` on its rows gets a dash down the whole
     * column, which is the fault a switched-off column at least admits to.
     * So a file that draws the column must set the field, and set it either
     * from `xpShown` directly or from a value that arrived already decided —
     * `player.xp` off a `LadderEntry`, `standing.xp` off a `LadderStanding`,
     * which `fetchLadderPage` and `fetchVariantLeaders` fill through
     * `xpByMemberId`, checked below.
     */
    const showing = withTables.filter((file) =>
      recordTables(file.source).some((tag) => !/columns=\{\{[^}]*xp:\s*false/.test(tag)),
    );
    expect(showing.length).toBeGreaterThanOrEqual(5);
    for (const file of showing) {
      expect(file.source, `${file.path} draws the XP column and never sets xp: on a row`).toMatch(
        /\bxp:\s*(xpShown\(|[A-Za-z_$][\w$]*\.xp\b)/,
      );
      // And never past the rule to the raw column of a member it holds itself.
      expect(file.source, `${file.path} hands a raw total to the column`).not.toMatch(/\bxp:\s*(entry|member|row)\.xp\b/);
    }
  });

  it("the reads behind the rating-row tables decide XP through xpByMemberId", () => {
    /*
     * `LadderMore` and `Standings` set `xp: player.xp` and `xp: standing.xp`,
     * which is only the rule kept if the value was decided by it upstream. The
     * two reads are named here so that a third table built from rating rows
     * has a pattern to follow, and so that either of these dropping the read
     * fails here rather than printing a nought for every program.
     */
    for (const path of ["src/lib/rating/ladder.ts", "src/lib/rating/variantRatings.ts"]) {
      const source = code(readFileSync(path, "utf8"));
      expect(source, path).toContain("xpByMemberId(");
    }
    const read = code(readFileSync("src/lib/xp/xpOfMembers.ts", "utf8"));
    expect(read).toContain("xpShown(");
    // One query per page, keyed on the ids the page already holds.
    expect(read).toMatch(/id:\s*\{\s*in:\s*ids\s*\}/);
  });

  it("puts XP directly after the rating, where John placed it", () => {
    /*
     * "display directly after the Played column... never mind after the Rating
     * column for now." The order is `recordTrailing.tsx`'s: the rating cell,
     * then the XP cell, then tier. Asserted on the cells rather than the
     * headings because a heading and its column drifting apart is the quietest
     * bug a table can have, and the headings are checked to match the cells by
     * `PlayerRecord.test.ts` already.
     */
    const trailing = code(readFileSync("src/components/players/recordTrailing.tsx", "utf8"));
    const rating = trailing.indexOf("<RatingCell");
    const xp = trailing.indexOf("<XpCell");
    const tier = trailing.indexOf("columns.tier === true ? (\n        <td");
    expect(rating).toBeGreaterThan(-1);
    expect(xp).toBeGreaterThan(rating);
    expect(tier).toBeGreaterThan(xp);
    // And the switch is on unless a caller says otherwise.
    expect(trailing).toMatch(/columns\.xp !== false \? <XpCell/);
    expect(trailing).not.toMatch(/columns\.xp === true/);
  });
});

/**
 * Tables built by hand, with a person's rating on them.
 *
 * Both are `<table>` elements outside `RecordTable` whose headings include a
 * Rating. Each says why it draws no XP beside it, and the reasons are
 * different, which is why they are two entries and not a pattern.
 */
const HAND_BUILT_WITHOUT_XP: Record<string, string> = {
  /*
   * `LadderSideView` on a game's page: rank, player, rating and nothing else,
   * because John asked for exactly that — "it should be a side-view so not the
   * real view you see in a full page obviously... less columns". The whole
   * ladder one link under it carries the column. The same file's
   * `StandingsTable` is a `RecordTable` and is held by the checks above.
   */
  "src/components/players/Standings.tsx": "a side-view John asked to keep to three columns; the whole ladder has XP",
};

describe("a table built by hand with a person's rating on it has XP after the rating", () => {
  /** Files with a `<table>` whose `<th>` headings include a Rating. */
  const rated = FILES.filter(
    (file) => /<table\b/.test(file.source) && /<th\b[^>]*>\s*Rating\s*</.test(file.source),
  );

  it("finds such tables at all, so the check below is not vacuous", () => {
    // The champions table and the side-view, when this was written.
    expect(rated.length).toBeGreaterThanOrEqual(2);
  });

  it("every exception is a file that still exists and still has the table", () => {
    const known = new Set(rated.map((file) => file.path));
    expect(Object.keys(HAND_BUILT_WITHOUT_XP).filter((path) => !known.has(path))).toEqual([]);
  });

  it("names XP in a heading, or is named here with the reason it does not", () => {
    const offenders = rated
      .filter((file) => !/<th\b[^>]*>\s*XP\s*</.test(file.source))
      .map((file) => file.path)
      .filter((path) => HAND_BUILT_WITHOUT_XP[path] === undefined);
    expect(offenders, "draw XpCell from recordTrailing.tsx after the rating — or say here why not").toEqual([]);
  });

  it("a hand-built table draws the cell through XpCell, not a copy of it", () => {
    /*
     * A second dash-or-number cell of its own would be the one way past every
     * check above: it would say XP in the heading and could print a nought for
     * a program. So the files that draw the heading draw the shared cell.
     */
    for (const file of rated) {
      if (HAND_BUILT_WITHOUT_XP[file.path] !== undefined) continue;
      expect(file.source, `${file.path} has an XP heading and no XpCell under it`).toContain("<XpCell");
    }
  });
});

describe("a person's own page shows their standing where a stranger reads it", () => {
  it("draws MemberLevel under the record figures, from the member row", () => {
    /*
     * The header John asked for: "the Name of the person, Stats/Record and XP
     * + XP level Name". The name is the `<h1>`, the record is `PlayerFigures`,
     * and the standing follows it — after, not inside the heading, and from
     * `member?.xp` untouched so that a member whose XP was never read draws
     * nothing rather than a nought. `recordLevel.coverage.test.ts` holds the
     * component itself to its three answers.
     */
    const page = code(readFileSync("src/app/players/[slug]/page.tsx", "utf8"));
    const figures = page.indexOf("<PlayerFigures");
    const standing = page.indexOf("<MemberLevel");
    expect(figures).toBeGreaterThan(-1);
    expect(standing).toBeGreaterThan(figures);
    expect(page).toMatch(/<MemberLevel\s+xp=\{member\?\.xp\}\s*\/>/);
  });

  it("draws it for a program too, so nothing hands the rule an engine name to refuse on", () => {
    /*
     * John, on the live site: "i still don't see Levels for all equally and
     * bots don't have XP". A program's page draws the block like anyone's, so
     * the page passes the total and nothing that says what kind of member it
     * is — and `MemberLevel` takes nothing of the sort.
     */
    const page = code(readFileSync("src/app/players/[slug]/page.tsx", "utf8"));
    expect(page).not.toMatch(/<MemberLevel[^>]*botTier/);
    const block = code(readFileSync("src/components/xp/MemberLevel.tsx", "utf8"));
    expect(block).not.toContain("botTier");
  });
});

/**
 * A PROGRAM'S CELL SHOWS ITS XP. It read "–" for two releases, on a reading of
 * "Everyone is level 1 if 0xp." as "everyone who is a person"; John, on the
 * live site: "i still don't see Levels for all equally and bots don't have XP".
 * So the rule that decides a standing takes a total and nothing about what
 * kind of member holds it, the awarder pays a program from its games, and the
 * board and the rungs list programs among everybody. This reads the source of
 * those four places so the old exclusion cannot come back in one of them
 * without failing here.
 */
describe("a program stands where its total puts it, like anyone", () => {
  it("the standing rule takes a total and no engine name", () => {
    const rule = code(readFileSync("src/lib/xp/levelShown.ts", "utf8"));
    expect(rule).not.toContain("botTier");
  });

  it("the board and the rungs do not keep programs out in the query", () => {
    for (const path of ["src/lib/xp/xpBoard.ts", "src/lib/xp/levelMembers.ts"]) {
      const source = code(readFileSync(path, "utf8"));
      expect(source, `${path} filters programs out of a list everybody is on`).not.toMatch(/botTier:\s*null/);
    }
  });

  it("the awarder refuses a program only what a person-only award is, never everything", () => {
    const awarder = code(readFileSync("src/lib/xp/awardXp.ts", "utf8"));
    expect(awarder).not.toContain("notAPerson");
    expect(awarder).toContain("earnableByProgram");
  });

  it("no cell explains a dash by saying the row is a program", () => {
    const reasons = code(readFileSync("src/components/players/players.constants.ts", "utf8"));
    expect(reasons).not.toMatch(/program:/);
  });
});
