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
 * - **A level printed where nobody has earned one.** `xpLevelFor(0)` is 1, so a
 *   table handed raw XP draws "Lv 1" on every row of a site whose XP is not
 *   backfilled — a column about a default. `levelShown` is the rule and returns
 *   null for nought; a caller reaching past it to `xpLevelFor` has skipped it.
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
 * The tables of people whose rows cannot know an XP total.
 *
 * Both build from rating rows — a `Player` or a `VariantStanding`, keyed by a
 * folded name — and XP is on `Member`. They are listed here so that the absence
 * is a decision this test can see: if one of them ever passes a level, it has to
 * pass it through `levelShown` like everything else, and if the reason changes
 * the file has to say so.
 */
const WITHOUT_LEVELS = [
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

describe("a table of people that shows no level says why", () => {
  for (const path of WITHOUT_LEVELS) {
    it(`${path} states the absence rather than leaving it to look like an oversight`, () => {
      /*
       * "No level" and "nobody remembered the level" are identical in a diff,
       * which is the whole reason this codebase writes an absence down — the
       * same argument as `of={{ here: false }}` for a figure that cannot link.
       * So: either the file passes a level through the rule, or it names the
       * rule in a comment explaining why it does not.
       */
      const source = read(path);
      expect(source.length).toBeGreaterThan(500);
      const passes = /level:\s*levelShown\(/.test(source);
      const explains = source.includes("levelShown") || /No `level`|NO `level`/.test(source);
      expect(passes || explains).toBe(true);
      // And if it does pass one, it goes through the rule like everywhere else.
      if (source.includes("level:")) {
        expect(source).not.toContain("xpLevelFor");
      }
    });
  }
});
