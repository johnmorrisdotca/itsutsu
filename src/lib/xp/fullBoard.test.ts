import { describe, expect, it } from "vitest";

import {
  boardDay,
  countsFrom,
  dayBounds,
  daysToJudge,
  fullBoardAwards,
  hasOpponent,
  overdueAt,
  runEndingAt,
  turnAt,
} from "./fullBoard";
import type { BoardDay, BoardGame } from "./fullBoard.types";
import { XP_EVENTS, XP_FULL_BOARD_GAMES } from "./xp.constants";

/**
 * A full board, kept moving — as a table of cases, with fixed dates and zones.
 *
 * Every game here is one this file made, and every instant is written out, so
 * a case is a statement about the rule and not about the day the suite ran.
 */

const ME = "m-me";
const at = (iso: string) => new Date(iso);
const HOUR = 3_600_000;

let made = 0;
/** A game against a person, me on black, with moves at the given instants (alternating from black). */
function game(over: Partial<BoardGame> & { moves?: BoardGame["moves"] } = {}): BoardGame {
  made += 1;
  return {
    id: `g${made}`,
    blackMemberId: ME,
    whiteMemberId: `m-them-${made}`,
    hotSeat: false,
    playedAt: at("2026-09-01T00:00:00Z"),
    blackClaimedAt: null,
    whiteClaimedAt: null,
    finishedAt: null,
    moves: [],
    toPlayNow: null,
    ...over,
  };
}

/** Moves alternating black, white, … at these instants. */
const alternating = (...instants: string[]) =>
  instants.map((instant, index) => ({ stone: index % 2 === 0 ? "black" : "white", at: at(instant) }));

/** A board of `count` games, each answered by its opponent before the day, each on the opponent's turn. */
function board(count: number, over: Partial<BoardGame> = {}): BoardGame[] {
  return Array.from({ length: count }, () =>
    game({ moves: alternating("2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z", "2026-09-12T10:00:00Z"), toPlayNow: "white", ...over }),
  );
}

describe("what counts toward a full board", () => {
  it("counts a game from the opponent's first move, a computer opponent included", () => {
    const vsBot = game({ whiteMemberId: "bot-dan", moves: alternating("2026-09-10T08:00:00Z", "2026-09-10T08:00:05Z") });
    expect(countsFrom(vsBot, ME)).toEqual(at("2026-09-10T08:00:05Z"));
  });

  it("never counts a hot-seat game, a game against yourself, an untaken seat, or one the opponent has not moved in", () => {
    const moves = alternating("2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z");
    expect(countsFrom(game({ hotSeat: true, moves }), ME)).toBeNull();
    expect(countsFrom(game({ whiteMemberId: ME, moves }), ME)).toBeNull();
    expect(countsFrom(game({ whiteMemberId: null, moves: alternating("2026-09-10T08:00:00Z") }), ME)).toBeNull();
    expect(countsFrom(game({ moves: alternating("2026-09-10T08:00:00Z") }), ME)).toBeNull();
    expect(hasOpponent(game({ blackMemberId: "m-somebody" }), ME)).toBe(false);
  });

  it("is full at twenty games at some moment of the day, and a game finishing does not break it", () => {
    const twenty = board(XP_FULL_BOARD_GAMES);
    expect(boardDay(twenty, ME, "2026-09-12", "UTC")).toMatchObject({ peak: 20, full: true });
    // One finishes at noon: the board was still full that morning.
    const finishing = [...board(19), ...board(1, { finishedAt: at("2026-09-12T12:00:00Z") })];
    expect(boardDay(finishing, ME, "2026-09-12", "UTC").full).toBe(true);
    expect(boardDay(finishing, ME, "2026-09-13", "UTC").full).toBe(false);
    expect(boardDay(board(19), ME, "2026-09-12", "UTC").full).toBe(false);
  });

  it("does not count a game ending and another beginning at the same instant as two", () => {
    const ends = board(1, { finishedAt: at("2026-09-12T12:00:00Z") });
    const begins = [game({ moves: alternating("2026-09-12T11:00:00Z", "2026-09-12T12:00:00Z"), toPlayNow: "black" })];
    expect(boardDay([...board(19), ...ends, ...begins], ME, "2026-09-12", "UTC").peak).toBe(20);
  });
});

describe("kept up: judged on the member's own turns, at the day's end", () => {
  const day = "2026-09-12";

  it("is broken by a game waiting on me for more than twenty-four hours, and not at exactly twenty-four", () => {
    const { end } = dayBounds(day, "UTC");
    const exactly = game({ moves: alternating("2026-09-10T08:00:00Z", new Date(end.getTime() - 24 * HOUR).toISOString()), toPlayNow: "black" });
    expect(overdueAt(exactly, ME, end)).toBe(false);
    const oneMore = game({ moves: alternating("2026-09-10T08:00:00Z", new Date(end.getTime() - 24 * HOUR - 1).toISOString()), toPlayNow: "black" });
    expect(overdueAt(oneMore, ME, end)).toBe(true);
    expect(boardDay([...board(19), oneMore], ME, day, "UTC")).toMatchObject({ full: true, keptUp: false, overdue: [oneMore.id] });
  });

  it("never counts a slow opponent against me", () => {
    const theirTurnForDays = game({ moves: alternating("2026-09-01T08:00:00Z", "2026-09-01T09:00:00Z", "2026-09-02T10:00:00Z"), toPlayNow: "white" });
    expect(overdueAt(theirTurnForDays, ME, dayBounds(day, "UTC").end)).toBe(false);
  });

  it("reads whose turn it was from the next move, so a past instant is judged exactly", () => {
    const g = game({ moves: alternating("2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z", "2026-09-13T10:00:00Z"), toPlayNow: "white" });
    expect(turnAt(g, at("2026-09-12T23:59:59Z"))).toBe("black");
    expect(overdueAt(g, ME, dayBounds(day, "UTC").end)).toBe(true);
  });

  it("does not let a resignation clear a game that had sat on my turn for more than a day", () => {
    const resigned = game({
      moves: alternating("2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z"),
      finishedAt: at("2026-09-12T20:00:00Z"),
    });
    const judged = boardDay([...board(20), resigned], ME, day, "UTC");
    expect(judged.keptUp).toBe(false);
    expect(judged.overdue).toEqual([resigned.id]);
    // A game that ended by a move is not caught by the guard.
    const won = game({ moves: alternating("2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z", "2026-09-12T20:00:00Z"), finishedAt: at("2026-09-12T20:00:00Z") });
    expect(boardDay([...board(20), won], ME, day, "UTC").keptUp).toBe(true);
  });

  it("ends the day in the member's own zone, across a clock change", () => {
    /*
     * PAST clock changes only. A future one is a guess about law nobody has
     * finished making: British Columbia's rule differs between tz releases, and
     * a newer Node answered 07:00Z for a 2026 date this case once asserted as
     * 08:00Z. The code is right to trust Intl; what it is tested on must be a
     * day no tz release will rewrite.
     */
    // Vancouver fell back on 2024-11-03: a twenty-five-hour day.
    const { start, end } = dayBounds("2024-11-03", "America/Vancouver");
    expect(start.toISOString()).toBe("2024-11-03T07:00:00.000Z");
    expect(end.toISOString()).toBe("2024-11-04T08:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(25 * HOUR);
    // And sprang forward on 2024-03-10: a twenty-three-hour day.
    const spring = dayBounds("2024-03-10", "America/Vancouver");
    expect(spring.start.toISOString()).toBe("2024-03-10T08:00:00.000Z");
    expect(spring.end.toISOString()).toBe("2024-03-11T07:00:00.000Z");
    expect(spring.end.getTime() - spring.start.getTime()).toBe(23 * HOUR);
    // Tokyo has no clock change and is ahead of UTC.
    expect(dayBounds("2026-09-12", "Asia/Tokyo").start.toISOString()).toBe("2026-09-11T15:00:00.000Z");
  });

  it("judges the same games differently in two zones, because their days end at different instants", () => {
    // My move is due from 2026-09-11T20:00Z. Tokyo's 12th ends at 15:00Z on the 12th — 19 hours on.
    const g = game({ moves: alternating("2026-09-10T08:00:00Z", "2026-09-11T20:00:00Z"), toPlayNow: "black" });
    expect(boardDay([g], ME, "2026-09-12", "Asia/Tokyo").keptUp).toBe(true);
    // UTC's 12th ends at 00:00Z on the 13th — 28 hours on.
    expect(boardDay([g], ME, "2026-09-12", "UTC").keptUp).toBe(false);
  });
});

describe("moves made that day", () => {
  it("needs a move by me that day, in a game that counts", () => {
    const noMoves = boardDay(board(20), ME, "2026-09-13", "UTC");
    expect(noMoves.moved).toBe(false);
    const withMove = boardDay(board(20), ME, "2026-09-12", "UTC");
    expect(withMove.moved).toBe(true);
    // A move in a hot-seat game does not count.
    const hot = game({ hotSeat: true, moves: alternating("2026-09-13T08:00:00Z") });
    expect(boardDay([...board(20), hot], ME, "2026-09-13", "UTC").moved).toBe(false);
  });
});

describe("which days a first action of a new day judges", () => {
  it("judges from the last action's day to yesterday, and reaches back no further than the lookback", () => {
    expect(daysToJudge("2026-09-10", "2026-09-13", 31)).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"]);
    expect(daysToJudge("2026-09-13", "2026-09-13", 31)).toEqual([]);
    expect(daysToJudge(null, "2026-09-13", 31)).toEqual([]);
    expect(daysToJudge("2026-01-01", "2026-09-13", 3)).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"]);
  });
});

const kept = (day: string, over: Partial<BoardDay> = {}): BoardDay => ({ day, peak: 20, full: true, keptUp: true, moved: true, overdue: [], ...over });

describe("what the judged days pay", () => {
  it("pays Full House and the first Clean Sweep once, and a Clean Sweep every kept day", () => {
    const awards = fullBoardAwards([kept("2026-09-11"), kept("2026-09-12")], []);
    expect(awards).toEqual([
      { type: XP_EVENTS.fullHouse },
      { type: XP_EVENTS.cleanSweep, subject: "2026-09-11" },
      { type: XP_EVENTS.cleanSweepFirst },
      { type: XP_EVENTS.cleanSweep, subject: "2026-09-12" },
    ]);
  });

  it("pays Full House for a full board that was not kept up, and no Clean Sweep", () => {
    expect(fullBoardAwards([kept("2026-09-12", { keptUp: false })], [])).toEqual([{ type: XP_EVENTS.fullHouse }]);
    expect(fullBoardAwards([kept("2026-09-12", { moved: false })], [])).toEqual([{ type: XP_EVENTS.fullHouse }]);
    expect(fullBoardAwards([kept("2026-09-12", { full: false, peak: 19 })], [])).toEqual([]);
  });

  it("pays the seven-day combo on the seventh Clean Sweep in a row, counting days the ledger already holds", () => {
    const held = ["2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"];
    const awards = fullBoardAwards([kept("2026-09-12")], held);
    expect(awards).toContainEqual({ type: XP_EVENTS.fullHouseCombo7, subject: "2026-09-12" });
  });

  it("does not pay a combo across a broken day, even after catching up days away", () => {
    // Away on the 9th: that day has no moves, so it is not kept, and the run restarts.
    const days = ["2026-09-06", "2026-09-07", "2026-09-08"].map((one) => kept(one));
    const away = kept("2026-09-09", { moved: false, keptUp: true });
    const after = ["2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"].map((one) => kept(one));
    const awards = fullBoardAwards([...days, away, ...after], []);
    expect(awards.some((award) => award.type === XP_EVENTS.fullHouseCombo7)).toBe(false);
  });

  it("asks for nothing new when a day is judged again: every row it asks for is one the index already holds", () => {
    const first = fullBoardAwards([kept("2026-09-12")], []);
    const again = fullBoardAwards([kept("2026-09-12")], ["2026-09-12"]);
    // The same keys — (type, subject) — so the unique index refuses every one the second time.
    const keys = (list: typeof first) => list.map((award) => `${award.type} ${award.subject ?? ""}`).sort();
    expect(keys(again)).toEqual(keys(first));
  });

  it("counts a run up to a thousand, and stops", () => {
    const days = new Set<string>();
    let day = "2026-09-12";
    for (let index = 0; index < 1100; index += 1) {
      days.add(day);
      const d = new Date(`${day}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      day = d.toISOString().slice(0, 10);
    }
    expect(runEndingAt(days, "2026-09-12")).toBe(1000);
  });
});
