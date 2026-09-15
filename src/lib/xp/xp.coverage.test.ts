import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";

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
import {
  XP_FULL_BOARD_PEOPLE_ONLY,
  XP_FULL_BOARD_TYPES,
  XP_PEOPLE_ONLY,
  earnableByProgram,
  xpPeopleOnlyWith,
} from "./xp.constants";
import type { XpEventType } from "./xp.types";
import { toToasts } from "./xpFlash";
import { readFileSync } from "node:fs";

import { RECORD_SCOPES } from "@/lib/rating/recordScope";

import { IMPORTED_XP_TYPES, isImportedXpType } from "./importedXp.constants";
import { XP_SCOPE_COLUMN } from "./xpScope";
import { readdirSync } from "node:fs";
import { join as joinPath } from "node:path";

/**
 * Files allowed to write a member's `xp` without `xpEverywhere`, each with its
 * reason. Empty on purpose: every seed today goes through `standingData`.
 */
const XP_SEED_EXCEPTIONS: Record<string, string> = {};

/** Every file that could seed a member: the browser suite, the scripts, and the play runners. */
function* seedingFiles(): Generator<string> {
  const walk = function* (dir: string): Generator<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = joinPath(dir, entry.name);
      if (entry.isDirectory()) yield* walk(path);
      else yield path;
    }
  };
  for (const path of walk("e2e")) if (/\.(ts|mjs)$/.test(path)) yield path;
  for (const path of walk("scripts")) if (/\.(ts|mjs)$/.test(path)) yield path;
  for (const path of walk("src")) if (path.endsWith(".play.test.ts")) yield path;
}

/**
 * Every Prisma member write in `source` — create, createMany, update,
 * updateMany, upsert — whose argument sets an `xp` key (`xp:` or shorthand
 * `xp,`) and neither writes `xpEverywhere` nor goes through `standingData`.
 * The argument is taken by matching its parentheses, so a call spread over
 * many lines is read whole; `xp: true` is a select, not a write.
 */
function memberWritesMissingEverywhere(source: string): string[] {
  const found: string[] = [];
  const call = /member\.(create|createMany|update|updateMany|upsert)\(/g;
  for (let match = call.exec(source); match !== null; match = call.exec(source)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < source.length && depth > 0) {
      if (source[end] === "(") depth += 1;
      else if (source[end] === ")") depth -= 1;
      end += 1;
    }
    const argument = source.slice(match.index + match[0].length, end - 1);
    const writesXp = /(^|[{,\s])xp\s*(:(?!\s*true\b)|,|\s*\})/.test(argument);
    if (writesXp && !/xpEverywhere|standingData\(/.test(argument)) found.push(argument.replace(/\s+/g, " ").trim().slice(0, 120));
  }
  return found;
}

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
    // 23,440 when it was solved, which is level 30 on its own and 2.3% of the
    // ladder — the ceiling of everything that cannot repeat, a treadmill nobody
    // can run. The climb table in XP_DESIGN.md rests on this number, so if it
    // moves it has to be redone rather than left standing.
    //
    // 24,040 since International, Brazilian, Canadian and Russian draughts and
    // Pool checkers joined Checkers: five more first games (250), five more
    // first wins (50), and Checkers became a family that can be won (300).
    // XP_DESIGN.md's climb table has NOT been redone for that — it is the XP
    // owner's to redo, and it is said so here rather than the old figure being
    // left to pass.
    const perVariant = 44;
    const perFamily = 11;
    // A family won is only for a family of more than one game.
    const familiesToWin = GAME_FAMILIES.filter((family) => family.games.length > 1).length;
    expect(familiesToWin).toBe(9);
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
      XP_EVENT_SPECS.everyVariantWonInFamily.points * familiesToWin +
      XP_EVENT_SPECS.gradeBeaten.points * grades +
      XP_EVENT_SPECS.everyGradeBeaten.points +
      XP_EVENT_SPECS.specialistBeaten.points * specialists +
      XP_EVENT_SPECS.firstBuddy.points +
      XP_EVENT_SPECS.nameSet.points +
      XP_EVENT_SPECS.countrySet.points +
      XP_EVENT_SPECS.bioSet.points +
      XP_EVENT_SPECS.wordsSet.points;
    expect(total).toBe(24_040);
  });

  it("prices nothing at or below zero, so no award can ever take XP away", () => {
    // John: "You can never lose XP of course." A penalty award would be one row
    // in this table, so this is the half of the rule the catalogue owns;
    // `awardXp.test.ts` gates the writer, which only ever increments.
    for (const type of types) expect(XP_EVENT_SPECS[type].points, type).toBeGreaterThan(0);
  });

  it("puts the big money in the hard things, and keeps the routine small", () => {
    // A won game against a person is the routine ceiling. The things that take
    // an afternoon, or a stronger opponent, each pay more than one of those.
    const wonGame =
      XP_EVENT_SPECS.gameFinished.points + XP_EVENT_SPECS.gameWon.points + XP_EVENT_SPECS.wonVsPerson.points;
    const hard: XpEventType[] = ["upsetWin", "bigUpsetWin", "giantKilled", "gradeBeaten", "everyGradeBeaten", "specialistBeaten"];
    for (const type of hard) expect(XP_EVENT_SPECS[type].points, type).toBeGreaterThanOrEqual(wonGame);
    expect(XP_EVENT_SPECS.dailyVisit.points).toBeLessThan(XP_EVENT_SPECS.gameFinished.points);
  });

  it("prices a first win at a game as John asked, and a family won above a family met", () => {
    // "something like five or 10" for a first win. A family won was left to us
    // to balance: winning every game of a family is harder than playing one of
    // it, so it pays twice `firstOfFamily`. See the note on the row.
    expect(XP_EVENT_SPECS.firstWinAtVariant.points).toBeGreaterThanOrEqual(5);
    expect(XP_EVENT_SPECS.firstWinAtVariant.points).toBeLessThanOrEqual(10);
    expect(XP_EVENT_SPECS.everyVariantWonInFamily.points).toBe(XP_EVENT_SPECS.firstOfFamily.points * 2);
  });

  it("caps only what can be farmed, and never a milestone", () => {
    // A cap on a first-time award would be a cap that can never bite, which is
    // not protecting an economy — it is only there to punish the day it does.
    const milestones: XpEventType[] = [
      "firstGameEver", "firstOfVariant", "firstWinAtVariant", "firstOfFamily",
      "everyFamilyPlayed", "everyVariantPlayed", "everyVariantWonInFamily", "gradeBeaten", "everyGradeBeaten",
      "specialistBeaten", "firstBuddy", "winStreak3", "winStreak5", "winStreak10",
      "revengeWin", "comeback", "nameSet", "countrySet", "bioSet", "wordsSet",
      "seatClaimedElsewhere", "joined",
      // Once per game per member, and once per anniversary: nothing to farm.
      "wins10", "wins100", "wins250", "wins500", "wins1000",
      "losses10", "losses50", "losses100", "losses250", "losses500", "losses1000", "draws10",
      "yearHere", "yearsHere5", "yearsHere10",
      // Once ever, once a day, or once per run: a full board cannot be farmed by repetition.
      "fullHouse", "cleanSweepFirst", "cleanSweep",
      "fullHouseCombo7", "fullHouseCombo15", "fullHouseCombo30", "fullHouseCombo60",
      "fullHouseCombo120", "fullHouseCombo250", "fullHouseCombo500", "fullHouseCombo1000",
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
    // XP-06 added the ones about other people and about who you are.
    //
    // The rebalance added four, all paid on `recordPlayed`: the three upset
    // bands and a family won.
    //
    // Which leaves `comeback`, refused in writing. Every other kind in the
    // catalogue is paid by something.
    //
    // John's package of 2026-09-14 added fifteen: the milestones at one game on
    // `recordPlayed`, and the anniversaries on the first visit of a day.
    const wired = types.filter((type) => !XP_UNWIRED.includes(type));
    expect(wired.sort()).toEqual([
      "applauseGiven",
      "backFromAway",
      "bigUpsetWin",
      "bioSet",
      "buddyAdded",
      "challengeAnswered",
      "challengeSent",
      "cleanSweep",
      "cleanSweepFirst",
      "countrySet",
      "dailyVisit",
      "dayStreak100",
      "dayStreak30",
      "dayStreak365",
      "dayStreak7",
      "draws10",
      "everyFamilyPlayed",
      "everyGradeBeaten",
      "everyVariantPlayed",
      "everyVariantWonInFamily",
      "firstBuddy",
      "firstGameEver",
      "firstOfFamily",
      "firstOfVariant",
      "firstWinAtVariant",
      "forkPlayed",
      "fullHouse",
      "fullHouseCombo1000",
      "fullHouseCombo120",
      "fullHouseCombo15",
      "fullHouseCombo250",
      "fullHouseCombo30",
      "fullHouseCombo500",
      "fullHouseCombo60",
      "fullHouseCombo7",
      "gameFinished",
      "gameWon",
      "giantKilled",
      "gradeBeaten",
      "joined",
      "longGame",
      "losses10",
      "losses100",
      "losses1000",
      "losses250",
      "losses50",
      "losses500",
      "nameSet",
      "rematchPlayed",
      "revengeWin",
      "seatClaimedElsewhere",
      "specialistBeaten",
      "timeGiven",
      "upsetWin",
      "weekendGame",
      "winStreak10",
      "winStreak3",
      "winStreak5",
      "wins10",
      "wins100",
      "wins1000",
      "wins250",
      "wins500",
      "wonVsBuddy",
      "wonVsPerson",
      "wordsSet",
      "yearHere",
      "yearsHere10",
      "yearsHere5",
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

  it("mentions a level once per batch, on the last award, by its NAME", () => {
    // A level is crossed once however many awards carried you over it. Saying
    // "you reached ColecoVision" on all three would say it three times in one
    // stack. The name is the catalogue's since XP-10's follow-up patch — level
    // 12 is "ColecoVision" — and asserted as the name rather than as
    // `xpLevelName(12)`, so a catalogue edit that silently renamed a rung the
    // toasts are pinned to has to be looked at rather than absorbed.
    const items = toToasts({
      at: "t",
      awards: [
        { type: "gameFinished", points: 10 },
        { type: "gameWon", points: 20 },
      ],
      level: { level: 12, reached: true },
    });

    expect(items[0].level).toBeUndefined();
    expect(items[1].level).toEqual({ name: "ColecoVision", reached: true });
  });

  it("carries a level nobody has reached yet as the quiet next-level line", () => {
    const items = toToasts({ at: "t", awards: [{ type: "dailyVisit", points: 5 }], level: { level: 9, reached: false } });
    expect(items[0].level).toEqual({ name: "1-Up", reached: false });
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

/**
 * WHO MAY EARN WHAT. John: the programs earn from their games like anyone, and
 * "people will have to earn XP through other means which the Robots don't do."
 * So every award is on one side of the line: for an act only a person performs,
 * or a fact about a finished game. A new award has to be sorted the day it is
 * priced, and this is what makes forgetting fail.
 */
describe("every award is either people-only or a game result", () => {
  const XP_EVENT_TYPES = Object.keys(XP_EVENT_SPECS) as XpEventType[];
  const GAME_RESULTS = [
    XP_EVENTS.firstGameEver,
    XP_EVENTS.gameFinished,
    XP_EVENTS.gameWon,
    XP_EVENTS.wonVsPerson,
    XP_EVENTS.revengeWin,
    XP_EVENTS.longGame,
    XP_EVENTS.comeback,
    XP_EVENTS.winStreak3,
    XP_EVENTS.winStreak5,
    XP_EVENTS.winStreak10,
    XP_EVENTS.upsetWin,
    XP_EVENTS.bigUpsetWin,
    XP_EVENTS.giantKilled,
    XP_EVENTS.firstOfVariant,
    XP_EVENTS.firstWinAtVariant,
    XP_EVENTS.firstOfFamily,
    XP_EVENTS.everyFamilyPlayed,
    XP_EVENTS.everyVariantPlayed,
    XP_EVENTS.everyVariantWonInFamily,
    XP_EVENTS.gradeBeaten,
    XP_EVENTS.everyGradeBeaten,
    XP_EVENTS.specialistBeaten,
    XP_EVENTS.weekendGame,
    /* The milestones at one game — losses and draws too, which are as much a
       fact about finished games as a win is. */
    XP_EVENTS.wins10,
    XP_EVENTS.wins100,
    XP_EVENTS.wins250,
    XP_EVENTS.wins500,
    XP_EVENTS.wins1000,
    XP_EVENTS.losses10,
    XP_EVENTS.losses50,
    XP_EVENTS.losses100,
    XP_EVENTS.losses250,
    XP_EVENTS.losses500,
    XP_EVENTS.losses1000,
    XP_EVENTS.draws10,
    /* The full-board awards sit on this side only while John has not said they
       are for people only — `XP_FULL_BOARD_PEOPLE_ONLY`, one line. */
    ...(XP_FULL_BOARD_PEOPLE_ONLY ? [] : XP_FULL_BOARD_TYPES),
  ] as const;

  it("sorts every priced award onto exactly one side", () => {
    for (const type of XP_EVENT_TYPES) {
      const gameResult = (GAME_RESULTS as readonly string[]).includes(type);
      expect(
        XP_PEOPLE_ONLY.has(type) !== gameResult,
        `${type} is ${XP_PEOPLE_ONLY.has(type) && gameResult ? "on both sides" : "on neither side"} of the people-only line`,
      ).toBe(true);
    }
  });

  it("names nothing that is not a priced award", () => {
    for (const type of XP_PEOPLE_ONLY) expect(XP_EVENT_TYPES).toContain(type);
  });

  it("holds a program to the game results and a person to everything", () => {
    for (const type of GAME_RESULTS) expect(earnableByProgram(type)).toBe(true);
    for (const type of XP_PEOPLE_ONLY) expect(earnableByProgram(type)).toBe(false);
  });

  it("puts the full-board awards on whichever side the one line says, and both sides hold", () => {
    // Today: not people-only, so a program with a full board earns them.
    expect(XP_PEOPLE_ONLY).toEqual(xpPeopleOnlyWith(XP_FULL_BOARD_PEOPLE_ONLY));
    const earnsBoth = xpPeopleOnlyWith(false);
    for (const type of XP_FULL_BOARD_TYPES) expect(earnsBoth.has(type), type).toBe(false);
    // John's other answer: every one of them on the people side, and nothing else moved.
    const peopleOnly = xpPeopleOnlyWith(true);
    for (const type of XP_FULL_BOARD_TYPES) expect(peopleOnly.has(type), type).toBe(true);
    expect(peopleOnly.size - earnsBoth.size).toBe(XP_FULL_BOARD_TYPES.length);
  });
});

/**
 * IMPORTED EXPERIENCE IS NEVER ITSUTSU EXPERIENCE. John: "we will show filters,
 * that show worldwide XP ... and the Itsutsu only XP as well". Itsutsu only is
 * `Member.xp`, so nothing imported may ever be written there, looked up as an
 * Itsutsu award, or summed into the Itsutsu ledger check — and each of those is
 * a line of source a later change could get wrong with nothing else failing.
 */
describe("imported awards stay on their own side", () => {
  const read = (path: string) => readFileSync(path, "utf8");

  it("shares no type with the Itsutsu catalogue", () => {
    for (const type of IMPORTED_XP_TYPES) {
      expect(Object.keys(XP_EVENT_SPECS), type).not.toContain(type);
      expect(isImportedXpType(type)).toBe(true);
    }
    for (const type of types) expect(isImportedXpType(type), type).toBe(false);
  });

  it("is written only to xpImported and xpEverywhere, never to xp", () => {
    const payer = read("src/lib/xp/importedXpPay.ts");
    expect(payer).toMatch(/xpImported:\s*\{\s*increment: landed\s*\}/);
    expect(payer).toMatch(/xpEverywhere:\s*\{\s*increment: landed\s*\}/);
    expect(payer).not.toMatch(/\bxp:\s*\{/);
    // And awardXp, the Itsutsu writer, never reaches for the imported catalogue or its payer.
    expect(read("src/lib/xp/awardXp.ts")).not.toMatch(/importedXp|IMPORTED_XP/);
  });

  it("reaches a badge beside a name only through xpForBadge, never through a raw xp", () => {
    // The rivalry board read `levelShown({ xp: row.xp })` when it landed in
    // 0.183.0, so a kept record's credit would have been missing from exactly one
    // badge on the site. The badge's total is decided in one place.
    const rivalry = read("src/lib/record/rivalryRead.ts");
    expect(rivalry).toMatch(/levelShown\(\{ xp: xpForBadge\(row\) \}\)/);
    expect(rivalry).not.toMatch(/levelShown\(\{ xp: row\.xp \}\)/);
    expect(read("src/lib/xp/xpOfMembers.ts")).toMatch(/xpShown\(\{ xp: xpForBadge\(member\) \}\)/);
  });

  it("is never seeded by a fixture that writes xp without xpEverywhere", () => {
    // CI run 34825313782: `withLedger` in e2e/xp-history.spec.ts wrote
    // `{ xp: total }`, /me reads the badge's total (`xpEverywhere`), and the
    // spec saw "0 XP" where it had seeded 510. A seed must write all three
    // columns — `standingData` in e2e/xpStanding.ts — or say here why not.
    const offenders = [...seedingFiles()].flatMap((path) =>
      Object.hasOwn(XP_SEED_EXCEPTIONS, path) ? [] : memberWritesMissingEverywhere(read(path)).map((call) => `${path}: ${call}`),
    );
    expect(offenders, "write the standing through standingData(...) in e2e/xpStanding.ts").toEqual([]);
    for (const [path, reason] of Object.entries(XP_SEED_EXCEPTIONS)) expect(reason.length, path).toBeGreaterThan(20);
  });

  it("catches the fixture that broke CI, and passes the one that replaced it", () => {
    // The proof: the scanner run over withLedger's old line, as it stood at 06b288c5.
    const old = "await prisma.member.update({ where: { id: member.id }, data: { xp: total } });";
    expect(memberWritesMissingEverywhere(old)).toHaveLength(1);
    expect(memberWritesMissingEverywhere("await prisma.member.update({ where: { id }, data: standingData({ here: total }) });")).toEqual([]);
    // Shorthand and a create spread across lines are caught the same way…
    expect(memberWritesMissingEverywhere("prisma.member.create({\n  data: { email, id,\n    xp,\n    xpLastAt: new Date() },\n})")).toHaveLength(1);
    // …and reading a total is not writing one.
    expect(memberWritesMissingEverywhere("prisma.member.findUnique({ where: { id }, select: { xp: true } })")).toEqual([]);
    expect(memberWritesMissingEverywhere("prisma.member.update({ where: { id }, data: { name }, select: { xp: true } })")).toEqual([]);
  });

  it("is left out of the Itsutsu ledger check and ranked only under Everywhere", () => {
    expect(read("src/lib/xp/backfillXp.play.test.ts")).toMatch(/notIn: \[\.\.\.IMPORTED_XP_TYPES\]/);
    expect(XP_SCOPE_COLUMN[RECORD_SCOPES.here]).toBe("xp");
    expect(XP_SCOPE_COLUMN[RECORD_SCOPES.everywhere]).toBe("xpEverywhere");
  });
});
