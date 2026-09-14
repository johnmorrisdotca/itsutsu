import { describe, expect, it } from "vitest";

import { LEGACY_PLAYERS, findLegacyPlayer } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyGameRecord, LegacyPlayer, LegacySource } from "@/lib/legacy/legacyPlayers.types";

import {
  IMPORTED_CLASS_KINDS,
  IMPORTED_TWIN_OF,
  IMPORTED_XP_CANDIDATES,
  IMPORTED_XP_EVENTS,
  IMPORTED_XP_RULES,
  IMPORTED_XP_SPECS,
  IMPORTED_XP_TYPES,
} from "./importedXp.constants";
import {
  classKindOf,
  importedPlayedOn,
  importedSubject,
  importedXpEligible,
  importedXpFor,
  planImportedPay,
  resultsPerGame,
  stakeOfImportedSubject,
} from "./importedXp";
import { IMPORTED_SKIP_REASONS, type ImportedXpRules } from "./importedXp.types";
import { XP_EVENT_SPECS, wholeYearsBetween } from "./xp.constants";

/** A record of one's own making, so a case is about the rule and not about Chibi. */
function record(sources: LegacySource[]): LegacyPlayer {
  return { slug: "someone", name: "Someone", kind: "honorary", sources };
}

function source(
  site: string,
  classes: [string, number, number, number, LegacyGameRecord[]?][],
  joined?: string,
  lastActive?: string,
): LegacySource {
  return {
    site,
    joined,
    lastActive,
    summary: classes.map(([name, won, lost, drawn, detail]) => ({ class: name, record: { game: name, won, lost, drawn }, detail })),
  };
}

const APPROVED: ImportedXpRules = IMPORTED_XP_CANDIDATES.approved;
const VOLUME_ONLY: ImportedXpRules = { ...APPROVED, years: false, gameMilestones: false };

describe("what a kept record is worth", () => {
  it("prices a small record at the site's rates, tournaments at one and a half times, rounded once", () => {
    const small = record([
      source("Somewhere.com", [["Regular games", 3, 1, 1], ["Tournament games", 1, 2, 0]], "2020-01-01", "2021-06-01"),
    ]);
    const { claims, total } = importedXpFor([small], APPROVED);
    // 5 ordinary games × 25, 3 wins × 50, 3 tournament games × 37.5 = 112.5 → 113, 1 win × 75.
    expect(claims.map((one) => [one.type, one.figure, one.points])).toEqual([
      [IMPORTED_XP_EVENTS.importedGames, 5, 125],
      [IMPORTED_XP_EVENTS.importedWins, 3, 150],
      [IMPORTED_XP_EVENTS.importedTournamentGames, 3, 113],
      [IMPORTED_XP_EVENTS.importedTournamentWins, 1, 75],
    ]);
    // Eight games is under the hundred the years guard needs, so the year it spans pays nothing.
    expect(total).toBe(463);
  });

  it("pays Chibi's fourteen thousand games in full, from the class records", () => {
    const chibi = findLegacyPlayer("chibi")!;
    // The controller's figures, checked: 13,029 / 7,131 ordinary; 1,577 / 698 tournament.
    expect(importedXpFor([chibi], IMPORTED_XP_CANDIDATES.siteRatesOnly).total).toBe(14_606 * 25 + 7_829 * 50);
    expect(importedXpFor([chibi], VOLUME_ONLY).total).toBe(13_029 * 25 + 7_131 * 50 + Math.round(1_577 * 37.5) + 698 * 75);
  });

  it("pays nothing for a class it has not priced, and says which", () => {
    const odd = record([source("Elsewhere.com", [["Blitz games", 10, 0, 0], ["Regular games", 1, 0, 0]])]);
    const reckoning = importedXpFor([odd], APPROVED);
    expect(reckoning.unknownClasses).toEqual([{ site: "Elsewhere.com", className: "Blitz games" }]);
    expect(reckoning.total).toBe(25 + 50);
  });

  it("claims nothing at all for a record with no games", () => {
    const empty = record([source("Quiet.com", [["Regular games", 0, 0, 0]], "2001-01-01", "2020-01-01")]);
    expect(importedXpFor([empty], APPROVED)).toEqual({ claims: [], total: 0, unknownClasses: [] });
    expect(importedPlayedOn([empty])).toEqual({ sites: [], games: 0 });
  });

  it("counts a site's years only with a hundred games there, at an anniversary's prices, both milestones at ten", () => {
    const played = record([source("Long.com", [["Friendly games", 60, 40, 0]], "2001-05-29", "2011-05-29")]);
    expect(importedXpFor([played], APPROVED).claims.filter((one) => one.type.startsWith("importedYears"))).toEqual([
      { type: IMPORTED_XP_EVENTS.importedYears, stake: "Long.com", figure: 10, points: 10 * XP_EVENT_SPECS.yearHere.points },
      { type: IMPORTED_XP_EVENTS.importedYears5, stake: "Long.com", figure: 5, points: XP_EVENT_SPECS.yearsHere5.points },
      { type: IMPORTED_XP_EVENTS.importedYears10, stake: "Long.com", figure: 10, points: XP_EVENT_SPECS.yearsHere10.points },
    ]);
    const joinedAndLeft = record([source("Long.com", [["Friendly games", 60, 39, 0]], "2001-05-29", "2011-05-29")]);
    expect(importedXpFor([joinedAndLeft], APPROVED).claims.some((one) => one.type.startsWith("importedYears"))).toBe(false);
  });

  it("prices every class in the kept records, through one table", () => {
    for (const legacy of LEGACY_PLAYERS) {
      for (const one of legacy.sources) {
        for (const row of one.summary) expect(classKindOf(row.class), `${legacy.slug} ${one.site} ${row.class}`).not.toBeNull();
      }
    }
    expect(classKindOf("toString")).toBeNull();
    expect(Object.values(IMPORTED_CLASS_KINDS)).toContain("tournament");
  });
});

describe("milestones at one game, from the detail rows", () => {
  const detailed = record([
    source("One.com", [["Regular games", 120, 60, 12, [
      { game: "Backgammon", won: 60, lost: 55, drawn: 12 },
      { game: "Chess", won: 60, lost: 5, drawn: 0 },
    ]]]),
    source("Two.com", [["Friendly games", 50, 0, 0, [{ game: "Backgammon", won: 50, lost: 0, drawn: 0 }]]]),
  ]);

  it("adds one game's rows up by the site's own name, across sites and classes", () => {
    expect(resultsPerGame([detailed]).get("Backgammon")).toEqual({ won: 110, lost: 55, drawn: 12 });
  });

  it("pays each milestone reached, at the Itsutsu price, keyed on the game — whether or not Itsutsu has that game", () => {
    const milestones = importedXpFor([detailed], APPROVED).claims.filter((one) => IMPORTED_TWIN_OF[one.type] !== undefined && !one.type.startsWith("importedYears"));
    expect(milestones.map((one) => [one.type, one.stake, one.points])).toEqual([
      [IMPORTED_XP_EVENTS.importedWins10, "Backgammon", XP_EVENT_SPECS.wins10.points],
      [IMPORTED_XP_EVENTS.importedWins100, "Backgammon", XP_EVENT_SPECS.wins100.points],
      [IMPORTED_XP_EVENTS.importedLosses10, "Backgammon", XP_EVENT_SPECS.losses10.points],
      [IMPORTED_XP_EVENTS.importedLosses50, "Backgammon", XP_EVENT_SPECS.losses50.points],
      [IMPORTED_XP_EVENTS.importedDraws10, "Backgammon", XP_EVENT_SPECS.draws10.points],
      [IMPORTED_XP_EVENTS.importedWins10, "Chess", XP_EVENT_SPECS.wins10.points],
    ]);
  });

  it("pays none where a setting leaves them out", () => {
    expect(importedXpFor([detailed], VOLUME_ONLY).claims.every((one) => IMPORTED_TWIN_OF[one.type] === undefined)).toBe(true);
  });
});

describe("whole years", () => {
  it("counts anniversaries reached, not calendar years touched", () => {
    expect(wholeYearsBetween("2001-07-27", "2013-07-30")).toBe(12);
    expect(wholeYearsBetween("2001-07-27", "2013-07-26")).toBe(11);
    expect(wholeYearsBetween("2003-03-13", "2020-11-10")).toBe(17);
    expect(wholeYearsBetween("2020-01-01", "2020-12-31")).toBe(0);
  });

  it("answers null — never nought — for what it cannot measure", () => {
    expect(wholeYearsBetween(undefined, "2013-07-30")).toBeNull();
    expect(wholeYearsBetween("2001", "2013-07-30")).toBeNull();
    expect(wholeYearsBetween("2013-07-30", "2001-07-27")).toBeNull();
    expect(wholeYearsBetween("2001-13-01", "2013-07-30")).toBeNull();
  });
});

describe("paying the difference, and only once", () => {
  const chibi = () => importedXpFor([findLegacyPlayer("chibi")!], APPROVED);

  it("pays everything the first time, and nothing the second", () => {
    const first = planImportedPay(chibi().claims, []);
    expect(first.points).toBe(chibi().total);
    expect(first.skipped).toEqual([]);
    const held = first.paying.map((row) => ({ type: row.type, subject: row.subject, points: row.points }));
    const second = planImportedPay(chibi().claims, held);
    expect(second.paying).toEqual([]);
    expect(second.points).toBe(0);
    expect(new Set(second.skipped.map((one) => one.reason))).toEqual(new Set([IMPORTED_SKIP_REASONS.alreadyPaid]));
  });

  it("pays only the growth when a record's figures grow, under a subject of its own", () => {
    const before = record([source("Grow.com", [["Regular games", 10, 10, 0]])]);
    const after = record([source("Grow.com", [["Regular games", 12, 10, 0]])]);
    const paid = planImportedPay(importedXpFor([before], APPROVED).claims, []).paying;
    const next = planImportedPay(importedXpFor([after], APPROVED).claims, paid);
    expect(next.paying).toEqual([
      { type: IMPORTED_XP_EVENTS.importedGames, stake: "Grow.com", subject: "Grow.com@22=550", points: 50 },
      { type: IMPORTED_XP_EVENTS.importedWins, stake: "Grow.com", subject: "Grow.com@12=600", points: 100 },
    ]);
  });

  it("takes nothing back when a record comes to less, and says so", () => {
    const before = record([source("Fix.com", [["Regular games", 12, 10, 0]])]);
    const corrected = record([source("Fix.com", [["Regular games", 10, 10, 0]])]);
    const paid = planImportedPay(importedXpFor([before], APPROVED).claims, []).paying;
    const next = planImportedPay(importedXpFor([corrected], APPROVED).claims, paid);
    expect(next.paying).toEqual([]);
    expect(next.skipped.find((one) => one.type === IMPORTED_XP_EVENTS.importedWins)).toEqual({
      type: IMPORTED_XP_EVENTS.importedWins,
      stake: "Fix.com",
      reason: IMPORTED_SKIP_REASONS.neverTakenBack,
      paid: 600,
      target: 500,
    });
  });

  it("reads a subject's stake back, and nothing out of a subject it did not write", () => {
    expect(stakeOfImportedSubject(importedSubject({ stake: "GoldToken.com", figure: 17, points: 17_000 }))).toBe("GoldToken.com");
    expect(stakeOfImportedSubject("")).toBeNull();
    expect(stakeOfImportedSubject("@5=5")).toBeNull();
  });
});

describe("who is eligible, and what a justification names", () => {
  it("counts every kept record as verified today, as John said", () => {
    expect(LEGACY_PLAYERS.every(importedXpEligible)).toBe(true);
  });

  it("names the sites a person played on, shortened, with the games behind them", () => {
    expect(importedPlayedOn([findLegacyPlayer("chibi")!])).toEqual({ sites: ["ItsYourTurn", "GoldToken"], games: 14_606 });
    expect(importedPlayedOn([findLegacyPlayer("kyokosan")!])).toEqual({ sites: ["ItsYourTurn"], games: 5_402 });
  });
});

describe("the settings table", () => {
  it("builds with John's approved setting: site rates, tournaments at one and a half, years and milestones", () => {
    expect(IMPORTED_XP_RULES).toEqual({
      game: XP_EVENT_SPECS.gameFinished.points,
      win: XP_EVENT_SPECS.gameWon.points,
      tournamentMultiple: 1.5,
      years: true,
      gameMilestones: true,
    });
  });

  it("never prices a tournament below an ordinary game", () => {
    for (const [name, rules] of Object.entries(IMPORTED_XP_CANDIDATES)) {
      expect(rules.tournamentMultiple, name).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every imported type something to say, and every twin a real Itsutsu award", () => {
    for (const type of IMPORTED_XP_TYPES) {
      expect(IMPORTED_XP_SPECS[type]?.label.length, type).toBeGreaterThan(5);
      expect(IMPORTED_XP_SPECS[type]?.blurb.length, type).toBeGreaterThan(15);
      const twin = IMPORTED_TWIN_OF[type];
      if (twin !== undefined) expect(XP_EVENT_SPECS[twin], type).toBeDefined();
    }
  });
});
