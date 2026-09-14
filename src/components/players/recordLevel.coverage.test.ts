import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A LEVEL BESIDE A NAME GOES THROUGH `LevelName`, AND THROUGH `levelShown`.
 *
 * The twin of `gameLinks.coverage.test.ts` and `playerLinks.coverage.test.ts`,
 * for the third thing this site prints beside a person. Those two exist because
 * a game's name and a player's name were both printed flat on pages nobody had
 * checked; a level is the next figure with a page behind it, and it arrives in
 * the same place — the subject cell of `RecordTable`, which five lists draw
 * through.
 *
 * TWO FAULTS, AND THEY ARE OPPOSITE, which is why one test cannot be a subset of
 * the other:
 *
 * - **A level printed with nothing behind it.** `Level 42` or a bare `Lv 7`
 *   interpolated into a cell is a rank a reader cannot follow up, and it is what
 *   every surface on this site did until 0.164.0 — the toasts, the ledger and
 *   this table's own callers. `LevelName` carries the link to `/xp/levels/<n>`
 *   and is the only thing that may put a level on screen.
 * - **A level printed for something that has no standing.** Nought IS level 1
 *   for a person — John: "Everyone is level 1 if 0xp." — but a PROGRAM is not on
 *   this ladder at all, and `xpLevelFor` cannot know that: handed a bot's nought
 *   it answers 1 and badges Meijin with a rung it can never climb. `levelShown`
 *   is the rule, it is handed the whole member so it can see `botTier`, and a
 *   caller reaching past it to `xpLevelFor` — or handing it `entry.xp` alone —
 *   has skipped it.
 *
 * Crude on purpose, in the shape this codebase already checks `.tsx` files with:
 * read the source and look for the shape that goes wrong. These components are
 * `server-only` or draw in a browser, and the unit runner has no DOM.
 */

const RECORD_TABLE = "src/components/players/RecordTable.tsx";

/** The lists that draw a person and CAN know their XP — see each file's own note. */
const WITH_LEVELS = [
  "src/components/players/Directory.tsx",
  "src/components/players/ComputerPlayers.tsx",
  "src/components/auth/AdminBots.tsx",
];

/**
 * The tables of people built from RATING rows — a `Player` or a
 * `VariantStanding`, keyed by a folded name — whose XP total arrives already
 * decided: `fetchLadderPage` and `fetchVariantLeaders` read it in one query
 * over the page's member ids through `xpByMemberId`, which asks `xpShown`, so
 * a program's total is null before it reaches the table. These files pass the
 * level through `levelShown` from that total, and never past it to the curve.
 */
const FROM_RATING_ROWS = [
  "src/components/players/LadderMore.tsx",
  "src/components/players/Standings.tsx",
];

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("the one table of records draws a level through LevelName", () => {
  it("has RecordTable to check, so a passing run means something", () => {
    // The guard playerLinks.coverage.test.ts keeps: a file read as "" would
    // satisfy every `not.toMatch` below and report green having looked at
    // nothing at all.
    expect(read(RECORD_TABLE).length).toBeGreaterThan(2_000);
  });

  it("renders the row's level with LevelName and nothing else", () => {
    const source = read(RECORD_TABLE);
    expect(source).toContain('import { LevelName } from "@/components/xp/LevelName"');
    expect(source).toMatch(/<LevelName\s+level=\{row\.level\}/);
  });

  it("never puts the level on screen except through that badge", () => {
    /*
     * THE ASSERTION ABOVE IS NOT ENOUGH ON ITS OWN, and this was found by
     * breaking the component on purpose to see whether the gate bit. Replacing
     * the badge with `<span>Lv {row.level}</span>` while the `<LevelName>` was
     * still somewhere in the file — behind a guard, in a comment, in a branch
     * nothing reaches — left every check above green over a table printing a
     * rank with nothing behind it. A grep for the right thing being PRESENT
     * cannot see the wrong thing being present beside it.
     *
     * So: every mention of `row.level` in this file is either the guard that
     * asks whether there is one, or the prop handing it to the badge. Nothing
     * interpolates it into markup of its own.
     */
    const source = read(RECORD_TABLE);
    const uses = [...source.matchAll(/row\.level/g)].map((match) => match.index ?? 0);
    expect(uses.length).toBeGreaterThan(0);
    for (const at of uses) {
      const before = source.slice(Math.max(0, at - 24), at);
      expect(
        /typeof\s+$/.test(before) || /level=\{$/.test(before),
        `row.level at ${at} is neither the guard nor the badge's prop: ...${before}`,
      ).toBe(true);
    }
  });

  it("draws it in the subject cell rather than as a column of its own", () => {
    /*
     * The measured reason is in the component's own head: the members list
     * already wants more pixels than its box has, and an eleventh column cut
     * "Challenge" off the end — the fault 0.164.2 had just fixed. So the badge
     * must sit in the subject `<td>`, after `{row.subject}`, and `width` — the
     * count that makes the empty row span the table — must not have grown a term
     * for it.
     */
    const source = read(RECORD_TABLE);
    const cell = source.indexOf("{row.subject}");
    const badge = source.indexOf("<LevelName");
    expect(cell).toBeGreaterThan(-1);
    expect(badge).toBeGreaterThan(cell);
    // Inside the same cell: the subject's `</td>` closes after the badge.
    expect(source.indexOf("</td>", cell)).toBeGreaterThan(badge);
    // No heading for it, and no eleventh column in the span.
    expect(source).not.toMatch(/<th[^>]*>\s*Level\s*</);
    expect(source).not.toMatch(/columns\.level/);
  });

  it("shows it compactly, so the cell it shares with a name still fits", () => {
    // The number on screen, the name and kanji in the `title` — `LevelName`'s
    // `compact` form. Without it the badge is "7 · Pac-Man" in a column that is
    // already the one that wrapped.
    expect(read(RECORD_TABLE)).toMatch(/<LevelName[\s\S]{0,200}?compact/);
  });
});

describe("every list that shows a level asks levelShown for it", () => {
  for (const path of WITH_LEVELS) {
    describe(path, () => {
      it("has the file to check", () => {
        expect(read(path).length).toBeGreaterThan(500);
      });

      it("passes the row a level from levelShown", () => {
        const source = read(path);
        expect(source).toContain('from "@/lib/xp/levelShown"');
        expect(source).toMatch(/level:\s*levelShown\(/);
      });

      it("hands the rule the whole member, so it can see a program", () => {
        /*
         * `levelShown(entry.xp)` was the call before nought became level 1, and
         * it would still typecheck against a looser signature. Handed only the
         * number, the rule cannot tell Meijin's nought from a new member's, and
         * every program on this table would wear "Lv 1".
         */
        const source = read(path);
        expect(source).toMatch(/level:\s*levelShown\(entry\)/);
        expect(source).not.toMatch(/levelShown\(\s*entry\.xp/);
      });

      it("does not reach past the rule to the raw curve", () => {
        /*
         * `xpLevelFor` answers 1 for nought, so a caller using it directly
         * badges every row on the site. That is not a wrong number — it is a
         * true one that says nothing, which is the harder fault to notice.
         */
        const source = read(path);
        expect(source).not.toContain("xpLevelFor");
        expect(source).not.toMatch(/level:\s*xpStanding/);
      });

      it("does not print a level as text of its own", () => {
        // `Level ${...}` or a bare "Lv" in this file would be a rank beside a
        // name with nothing behind it — the dead end, wearing a badge.
        const source = read(path);
        expect(source).not.toMatch(/`Level \$\{/);
        expect(source).not.toContain("xpLevelName");
      });
    });
  }
});

describe("a table built from rating rows draws its level from the decided total", () => {
  for (const path of FROM_RATING_ROWS) {
    it(`${path} passes the level through levelShown, guarded on a null total`, () => {
      /*
       * The total is `xpShown` already — null for a program, null for a name
       * with nobody behind it — so the rung follows it exactly: no total, no
       * rung; a nought, Level 1. Handed to `levelShown` as a member-shaped
       * object rather than to the raw curve, so the two halves of one fact
       * cannot disagree, and `xpLevelFor` never appears here.
       */
      const source = read(path);
      expect(source.length).toBeGreaterThan(500);
      expect(source).toContain('from "@/lib/xp/levelShown"');
      expect(source).toMatch(/level:\s*\w+\.xp === null \? null : levelShown\(\{ xp: \w+\.xp \}\)/);
      expect(source).not.toContain("xpLevelFor");
    });
  }
});

/**
 * A PERSON'S OWN PAGE, WHICH IS WHERE A STRANGER MEETS THEM.
 *
 * The same two faults as the tables above, one page over, and the second is the
 * one that only a profile page can have: a level printed for somebody whose XP
 * was never READ. `findMembersByNames` selects a narrow set of columns and XP is
 * not among them, so a row from it hands `undefined` — and `undefined ?? 0` on
 * the way into a badge would turn a missing read into a claim that this person
 * has earned nothing, which is indistinguishable on screen from the truth.
 */
describe("a person's public page shows their standing through MemberLevel", () => {
  const PAGE = "src/app/players/[slug]/page.tsx";
  const COMPONENT = "src/components/xp/MemberLevel.tsx";

  it("has both files to check, so a passing run means something", () => {
    expect(read(PAGE).length).toBeGreaterThan(2_000);
    expect(read(COMPONENT).length).toBeGreaterThan(500);
  });

  it("draws the standing in the header, under the record, as a block of its own", () => {
    /*
     * "Show The Data, Not The Way To It" decides that it is on the page at all;
     * John decided where: "a better header with the Name of the person,
     * Stats/Record and XP + XP level Name" — in that order. So the tag follows
     * the `<h1>` and the record figures, inside the profile section, and is
     * not a badge on the heading's line any more. `xpColumn.coverage.test.ts`
     * holds it to following `PlayerFigures`.
     */
    const source = read(PAGE);
    expect(source).toContain('import { MemberLevel } from "@/components/xp/MemberLevel"');
    const closed = source.indexOf("</h1>");
    const at = source.indexOf("<MemberLevel");
    const section = source.indexOf("</section>", closed);
    expect(closed).toBeGreaterThan(-1);
    expect(at, "the page does not draw MemberLevel at all").toBeGreaterThan(closed);
    expect(at).toBeLessThan(section);
  });

  it("hands the total over untouched, never defaulted to nought", () => {
    /*
     * THE FAULT THIS EXISTS FOR. `xp={member?.xp ?? 0}` typechecks, reads as
     * tidy, and silently converts "nobody asked" into "has earned nothing" —
     * AGENTS.md's own example of a value that happens to be in range standing
     * in for "I do not know". The page must pass the absence through and let
     * the component answer it.
     */
    const source = read(PAGE);
    expect(source).toMatch(/<MemberLevel\s+xp=\{member\?\.xp\}/);
    expect(source).not.toMatch(/xp=\{[^}]*\?\?\s*0/);
    /*
     * And whether this is a program, so a bot's own page draws no rung. Since
     * nought became level 1 this is the only thing between Meijin's page and an
     * "Insert Coin" badge.
     */
    expect(source).toMatch(/<MemberLevel[^>]*botTier=\{member\?\.botTier\}/);
  });

  it("prints no level of its own anywhere on the page", () => {
    // A rank beside a name with nothing behind it is the dead end, and a
    // profile page is the likeliest place to reach for one by hand.
    const source = read(PAGE);
    expect(source).not.toMatch(/`Level \$\{/);
    expect(source).not.toContain("xpLevelName");
    expect(source).not.toContain("xpLevelFor");
  });

  it("renders the badge through LevelName when there is a level, and nothing when there is not", () => {
    /*
     * Both directions, asserted on the component because a `.tsx` cannot be
     * rendered by this runner — vitest collects `.test.ts` and there is no DOM.
     * The rule itself is unit-tested in `src/lib/xp/levelShown.test.ts`; what
     * is checked here is that this component ASKS it, and returns early on
     * both kinds of absence rather than drawing a default.
     */
    const source = read(COMPONENT);
    expect(source).toContain('import { LevelName } from "./LevelName"');
    expect(source).toContain('from "@/lib/xp/levelShown"');
    /*
     * Two refusals, and they are about different things. `undefined` is nobody
     * having asked, and draws nothing. `levelShown` answering null is a member
     * with no standing — a program, since nought is level 1 for a person — and
     * draws nothing either. A nought is neither refusal: it draws Level 1.
     */
    expect(source).toMatch(/if \(xp === undefined\) return null;/);
    expect(source).toMatch(/levelShown\(\{\s*xp,\s*botTier\s*\}\)/);
    expect(source).toMatch(/if \(level === null\) return null;/);
    // And the level reaches the screen only through the badge.
    expect(source).toMatch(/<LevelName level=\{level\}/);
    expect(source).not.toContain("xpLevelFor");
    expect(source).not.toMatch(/`Level \$\{/);
  });
});

/**
 * THE XP TOTAL IS A COLUMN, DRAWN IN ONE PLACE, ON THE TABLES THAT CAN FILL IT.
 *
 * The twin of the level checks above for the other half of John's sentence —
 * "should also show your experience points and site level". The level is a
 * badge beside the name; the total is a column, because it is sorted by. What
 * can go wrong with it is the same three things that go wrong with any figure
 * here: printed by hand somewhere, leading nowhere, or shown on a table whose
 * rows cannot know it.
 */
describe("the XP total is one column, drawn by recordTrailing", () => {
  const TRAILING = "src/components/players/recordTrailing.tsx";

  it("has the module to check", () => {
    expect(read(TRAILING).length).toBeGreaterThan(2_000);
  });

  it("draws the cell from the row's xp, and leads every total to the board", () => {
    /*
     * `/xp`, one destination on every table — `XpCell`'s own comment argues it
     * against the reader's ledger and the level's page. Asserted on the source
     * because the runner has no DOM.
     */
    const source = read(TRAILING);
    expect(source).toMatch(/<XpCell xp=\{row\.xp \?\? null\} blankBecause=\{row\.xpBlankBecause\} \/>/);
    expect(source).toMatch(/href="\/xp"/);
    expect(source).toMatch(/countText\(xp\)/);
  });

  it("is on unless a caller switches it off, and sorts only through the declared slot", () => {
    /*
     * ON BY DEFAULT since John asked why some tables had it and others did
     * not: a switch that is off unless remembered is how one table came to
     * carry the column and the rest did not. `xpColumn.coverage.test.ts`
     * holds every `xp: false` to a reason.
     */
    const source = read(TRAILING);
    expect(source).toMatch(/columns\.xp !== false \? <XpCell/);
    expect(source).toMatch(/slot="xp"/);
    expect(source).toMatch(/columns\.xp !== false \? 1 : 0/);
  });

  it("is on the members directory and both tables of programs, from xpShown", () => {
    /*
     * The programs' tables print a dash on every line, and that is John's
     * answer for a program — "–", never 0 and never "Lv 1" — on a table that
     * otherwise reads exactly like the members list. `xpShown` decides the
     * dash, handed the whole entry so it can see `botTier`.
     */
    for (const path of WITH_LEVELS) {
      const source = read(path);
      expect(source, path).toMatch(/xp:\s*xpShown\(entry\)/);
      expect(source, path).not.toMatch(/columns=\{\{[^}]*xp: false/);
    }
  });

  for (const path of FROM_RATING_ROWS) {
    it(`${path} prints the total the read decided, and says why a name may have none`, () => {
      const source = read(path);
      expect(source).toMatch(/xp:\s*\w+\.xp,/);
      // A name nobody has claimed is the dash the members list cannot have, and
      // the hover has to say that rather than "a program".
      expect(source).toContain("XP_BLANK_BECAUSE.unclaimedName");
    });
  }
});
