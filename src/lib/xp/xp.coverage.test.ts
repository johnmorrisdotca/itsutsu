import { describe, expect, it } from "vitest";

import {
  XP_DAY_STREAK_MILESTONES,
  XP_EVENTS,
  XP_EVENT_SPECS,
  XP_SUBJECTS,
  XP_UNWIRED,
  XP_WIN_STREAK_MILESTONES,
  dayStreakMilestoneFor,
  winStreakMilestoneFor,
  xpEventCopy,
} from "./xp.constants";
import type { XpEventType } from "./xp.types";
import { toToasts } from "./xpFlash";

/**
 * The gate on the catalogue, in the shape of `backlog.coverage.test.ts` and
 * `variants.coverage.test.ts`: an event that is priced and cannot explain itself
 * fails the build rather than reaching a member's history as a blank cell.
 *
 * TypeScript already forces a row to exist for every type, because
 * `XP_EVENT_SPECS` is a `Record<XpEventType, XpEventSpec>`. This covers what
 * types cannot see — that the strings in those rows are worth printing, that the
 * numbers are numbers somebody chose, and that the two lists beside the table
 * name real types.
 */

const types = Object.keys(XP_EVENT_SPECS) as XpEventType[];

describe("every event can explain itself", () => {
  it.each(types)("%s has a label, a kanji, a blurb and a sentence", (type) => {
    const copy = xpEventCopy(type);
    // Short enough to be a cell, long enough to mean something. A one-character
    // label is the sort of placeholder that ships.
    expect(copy.label.length, "label").toBeGreaterThan(2);
    expect(copy.kanji.length, "kanji").toBeGreaterThan(0);
    expect(copy.blurb.length, "blurb").toBeGreaterThan(15);
    expect(copy.sentence.length, "sentence").toBeGreaterThan(5);
  });

  it.each(types)("%s says what its subject is, so nobody has to guess", (type) => {
    // A firstOfVariant awarded with the game id instead of the variant pays
    // thirty-nine times over and nothing reports it. The note is the only thing
    // standing between a wirer and that.
    expect(XP_SUBJECTS[type]).toBeDefined();
    if (XP_SUBJECTS[type] !== "") expect(XP_SUBJECTS[type].length).toBeGreaterThan(5);
  });

  it.each(types)("%s is worth a positive number of points, ending in a 0 or a 5", (type) => {
    const { points } = XP_EVENT_SPECS[type];
    expect(points).toBeGreaterThan(0);
    expect(Number.isInteger(points)).toBe(true);
    // John's rule from the curve, applied to the awards as well: a number
    // ending in 0 or 5 reads as a decision rather than as arithmetic.
    expect(points % 5).toBe(0);
  });

  it("keys every row by its own name, so a lookup cannot miss", () => {
    for (const [key, value] of Object.entries(XP_EVENTS)) expect(value).toBe(key);
    expect(Object.keys(XP_EVENTS).sort()).toEqual(types.sort());
  });
});

describe("the economy holds its shape", () => {
  it("pays a win more than a finish, and a finish more than a visit", () => {
    // The three that decide whether this is a ladder for playing or a ladder for
    // opening tabs. If a visit ever out-earns a finished game, the site is
    // paying for attendance.
    expect(XP_EVENT_SPECS.gameWon.points).toBeGreaterThan(XP_EVENT_SPECS.gameFinished.points);
    expect(XP_EVENT_SPECS.gameFinished.points).toBeGreaterThan(XP_EVENT_SPECS.dailyVisit.points);
  });

  it("pays the tour enough to be worth taking", () => {
    // Thirty-nine games and eleven families, most of them barely played. The
    // tour is the problem this ladder exists to solve, so a first game of
    // something new must beat finishing another game of the usual.
    expect(XP_EVENT_SPECS.firstOfVariant.points).toBeGreaterThan(XP_EVENT_SPECS.gameFinished.points);
    expect(XP_EVENT_SPECS.firstOfFamily.points).toBeGreaterThan(XP_EVENT_SPECS.firstOfVariant.points);
    expect(XP_EVENT_SPECS.everyVariantPlayed.points).toBeGreaterThan(
      XP_EVENT_SPECS.everyFamilyPlayed.points,
    );
  });

  it("adds the once-only awards up to the figure the curve was solved against", () => {
    // 3,740, which is level 21 on its own. The curve's month-and-year claims in
    // XP_DESIGN.md rest on this number, so if it moves they have to be redone
    // rather than left standing.
    const perVariant = 39;
    const perFamily = 11;
    const grades = 5;
    const specialists = 2;
    const total =
      XP_EVENT_SPECS.joined.points +
      XP_EVENT_SPECS.firstGameEver.points +
      XP_EVENT_SPECS.firstOfVariant.points * perVariant +
      XP_EVENT_SPECS.firstWinAtVariant.points * perVariant +
      XP_EVENT_SPECS.firstOfFamily.points * perFamily +
      XP_EVENT_SPECS.everyFamilyPlayed.points +
      XP_EVENT_SPECS.everyVariantPlayed.points +
      XP_EVENT_SPECS.gradeBeaten.points * grades +
      XP_EVENT_SPECS.everyGradeBeaten.points +
      XP_EVENT_SPECS.specialistBeaten.points * specialists +
      XP_EVENT_SPECS.firstBuddy.points +
      XP_EVENT_SPECS.nameSet.points +
      XP_EVENT_SPECS.countrySet.points +
      XP_EVENT_SPECS.bioSet.points +
      XP_EVENT_SPECS.wordsSet.points;
    expect(total).toBe(3740);
  });

  it("caps only what can be farmed, and never a milestone", () => {
    // A cap on a first-time award would be a cap that can never bite, which is
    // not protecting an economy — it is only there to punish the day it does.
    const milestones: XpEventType[] = [
      "firstGameEver", "firstOfVariant", "firstWinAtVariant", "firstOfFamily",
      "everyFamilyPlayed", "everyVariantPlayed", "gradeBeaten", "everyGradeBeaten",
      "specialistBeaten", "firstBuddy", "winStreak3", "winStreak5", "winStreak10",
      "revengeWin", "comeback", "nameSet", "countrySet", "bioSet", "wordsSet",
      "seatClaimedElsewhere", "joined",
    ];
    for (const type of milestones) {
      expect(XP_EVENT_SPECS[type].cap, `${type} is capped`).toBeUndefined();
      expect(XP_EVENT_SPECS[type].ridesAllowance, `${type} rides the allowance`).toBeUndefined();
    }
  });

  it("only lets an award ride the allowance if the finish itself is capped", () => {
    // ridesAllowance means "fires only if this game's gameFinished was paid", so
    // it is meaningless unless gameFinished has an allowance to be outside of.
    expect(XP_EVENT_SPECS.gameFinished.cap).toBeGreaterThan(0);
    for (const type of types) {
      if (XP_EVENT_SPECS[type].ridesAllowance !== true) continue;
      expect(XP_EVENT_SPECS[type].cap, `${type} rides the allowance without one`).toBeGreaterThan(0);
    }
  });
});

describe("what is priced and not yet paid", () => {
  it("names only real types", () => {
    for (const type of XP_UNWIRED) expect(types).toContain(type);
  });

  it("names each of them once", () => {
    expect(new Set(XP_UNWIRED).size).toBe(XP_UNWIRED.length);
  });

  it("leaves exactly the wired ones out of the list", () => {
    // A page listing the ways to earn XP reads this catalogue, and a promise of
    // 500 XP that nothing pays is the same broken promise as a count with
    // nothing behind it. A type leaves the list when its ticket wires it, so
    // this case is meant to be edited by XP-03 to XP-06 — and to fail loudly if
    // a kind is wired and nobody says so.
    //
    // XP-02 wired four. XP-03 added the tour and the long game; XP-04 added
    // everything a WIN pays, both on `recordPlayed` — see `xpGame.ts`. XP-05
    // added turning up: the run of days and coming back from away on the
    // `lastSeenAt` write (`dailyVisit.ts`), and the weekend on the finish.
    const wired = types.filter((type) => !XP_UNWIRED.includes(type));
    expect(wired.sort()).toEqual([
      "backFromAway",
      "dailyVisit",
      "dayStreak100",
      "dayStreak30",
      "dayStreak365",
      "dayStreak7",
      "everyFamilyPlayed",
      "everyGradeBeaten",
      "everyVariantPlayed",
      "firstGameEver",
      "firstOfFamily",
      "firstOfVariant",
      "firstWinAtVariant",
      "gameFinished",
      "gameWon",
      "gradeBeaten",
      "joined",
      "longGame",
      "revengeWin",
      "specialistBeaten",
      "weekendGame",
      "winStreak10",
      "winStreak3",
      "winStreak5",
      "wonVsBuddy",
      "wonVsPerson",
    ]);
  });

  it("says why `comeback` is priced and unpaid, rather than leaving it out", () => {
    // The one type in the catalogue that nothing is going to pay. It stays in
    // the list because that is what tells a page it is not yet earned, and the
    // refusal is written where it would have fired — `xpGame.ts` — rather than
    // left as an absence somebody would eventually read as an oversight.
    expect(XP_UNWIRED).toContain("comeback");
  });
});

describe("the milestone tables", () => {
  it("names real types, longest run last", () => {
    for (const { type } of XP_WIN_STREAK_MILESTONES) expect(types).toContain(type);
    for (const { type } of XP_DAY_STREAK_MILESTONES) expect(types).toContain(type);

    const wins = XP_WIN_STREAK_MILESTONES.map((one) => one.wins);
    const days = XP_DAY_STREAK_MILESTONES.map((one) => one.days);
    expect([...wins].sort((a, b) => a - b)).toEqual(wins);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it("pays a longer run more than a shorter one", () => {
    for (let index = 1; index < XP_WIN_STREAK_MILESTONES.length; index += 1) {
      expect(XP_EVENT_SPECS[XP_WIN_STREAK_MILESTONES[index].type].points).toBeGreaterThan(
        XP_EVENT_SPECS[XP_WIN_STREAK_MILESTONES[index - 1].type].points,
      );
    }
  });

  it("fires on exactly the milestone length and not past it", () => {
    // At-least would ask for an eleventh win's award and lean on the index to
    // refuse it. Leaning on the index to refuse what the rule should never have
    // asked for is how a cap becomes the only thing keeping an economy honest.
    expect(winStreakMilestoneFor(3)).toBe(XP_EVENTS.winStreak3);
    expect(winStreakMilestoneFor(4)).toBeNull();
    expect(winStreakMilestoneFor(10)).toBe(XP_EVENTS.winStreak10);
    expect(winStreakMilestoneFor(11)).toBeNull();
    expect(dayStreakMilestoneFor(7)).toBe(XP_EVENTS.dayStreak7);
    expect(dayStreakMilestoneFor(8)).toBeNull();
    expect(dayStreakMilestoneFor(365)).toBe(XP_EVENTS.dayStreak365);
  });

  it("says nothing for a run of nought or a number that is not one", () => {
    expect(winStreakMilestoneFor(0)).toBeNull();
    expect(winStreakMilestoneFor(-3)).toBeNull();
    expect(dayStreakMilestoneFor(Number.NaN)).toBeNull();
  });
});

describe("a stored flash, read back", () => {
  it("turns awards into the items the component takes", () => {
    expect(
      toToasts({ at: "2026-09-12T00:00:00.000Z", awards: [{ type: "gameWon", points: 20 }] }),
    ).toEqual([
      {
        id: "2026-09-12T00:00:00.000Z-0",
        points: 20,
        label: XP_EVENT_SPECS.gameWon.label,
        kanji: XP_EVENT_SPECS.gameWon.kanji,
        sentence: XP_EVENT_SPECS.gameWon.sentence,
      },
    ]);
  });

  it("gives every item in a batch its own id, stable across a re-render", () => {
    // Stable so the host's dismiss keeps working, and not random: a random id
    // would differ between the server's markup and the browser's and be reported
    // as a hydration mismatch.
    const flash = {
      at: "2026-09-12T00:00:00.000Z",
      awards: [
        { type: "gameFinished", points: 10 },
        { type: "gameWon", points: 20 },
      ],
    };
    const first = toToasts(flash).map((item) => item.id);
    expect(new Set(first).size).toBe(2);
    expect(toToasts(flash).map((item) => item.id)).toEqual(first);
  });

  it("mentions a level once per batch, on the last award", () => {
    // A level is crossed once however many awards carried you over it. Saying
    // "you reached Level 12" on all three would say it three times in one stack.
    const items = toToasts({
      at: "t",
      awards: [
        { type: "gameFinished", points: 10 },
        { type: "gameWon", points: 20 },
      ],
      level: { level: 12, reached: true },
    });

    expect(items[0].level).toBeUndefined();
    expect(items[1].level).toEqual({ name: "Level 12", reached: true });
  });

  it("carries a level nobody has reached yet as the quiet next-level line", () => {
    const items = toToasts({ at: "t", awards: [{ type: "dailyVisit", points: 5 }], level: { level: 9, reached: false } });
    expect(items[0].level).toEqual({ name: "Level 9", reached: false });
  });

  it("drops a level it cannot read rather than naming Level NaN", () => {
    const rubbish = [
      { level: "twelve", reached: true },
      { level: 12 },
      { level: 0, reached: true },
      { level: 4.5, reached: true },
      {},
    ];
    for (const level of rubbish) {
      const items = toToasts({ at: "t", awards: [{ type: "gameWon", points: 20 }], level });
      expect(items[0].level, JSON.stringify(level)).toBeUndefined();
    }
  });

  it("drops an award this deploy cannot explain rather than showing a blank", () => {
    // A toast reading "+25" beside nothing is worse than no toast, and the
    // ledger still has the row — which is what makes the flash allowed to be lossy.
    expect(toToasts({ at: "x", awards: [{ type: "somethingRetiredLongAgo", points: 25 }] })).toEqual([]);
  });

  it("drops an award with no points rather than reporting a loss", () => {
    expect(toToasts({ at: "x", awards: [{ type: "gameWon", points: 0 }] })).toEqual([]);
    expect(toToasts({ at: "x", awards: [{ type: "gameWon", points: -5 }] })).toEqual([]);
    expect(toToasts({ at: "x", awards: [{ type: "gameWon" }] })).toEqual([]);
  });

  it("reads nothing out of nothing, and does not throw on rubbish", () => {
    // This is read by the masthead on every page. A malformed courtesy must not
    // be able to take the site down.
    expect(toToasts(null)).toEqual([]);
    expect(toToasts(undefined)).toEqual([]);
    expect(toToasts({})).toEqual([]);
    expect(toToasts({ at: "x", awards: "not an array" })).toEqual([]);
    expect(toToasts({ at: "x", awards: [null, 7, "no"] })).toEqual([]);
    expect(toToasts("a string")).toEqual([]);
  });
});
