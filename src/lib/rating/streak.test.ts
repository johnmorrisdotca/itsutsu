import { describe, expect, it } from "vitest";

import {
  NO_STREAK_TEXT,
  PLAYER_STREAK_SCOPES,
  STREAK_COLUMNS,
  VARIANT_STREAK_SCOPES,
  extendStreak,
  streakFrom,
  streakIn,
  streakLabel,
  streakText,
  streakWrite,
} from "./streak";

describe("what a streak is", () => {
  it("counts consecutive results of the same kind, most recent first", () => {
    expect(streakFrom(["win", "win", "win", "loss"])).toEqual({ kind: "win", count: 3 });
    expect(streakFrom(["loss", "loss", "win"])).toEqual({ kind: "loss", count: 2 });
  });

  it("makes a draw its own streak rather than skipping it", () => {
    // The decision this module exists to write down. A draw between two wins
    // does not join them into "W2" — it ends the run and starts one of its own.
    expect(streakFrom(["draw", "win", "win"])).toEqual({ kind: "draw", count: 1 });
    expect(streakFrom(["draw", "draw", "loss"])).toEqual({ kind: "draw", count: 2 });
  });

  it("ends a win streak on a draw rather than counting it as a loss", () => {
    expect(streakFrom(["win", "draw", "win", "win"])).toEqual({ kind: "win", count: 1 });
  });

  it("is null with nothing to count, never nought", () => {
    expect(streakFrom([])).toBeNull();
    expect(streakText(null)).toBe(NO_STREAK_TEXT);
    expect(streakText({ kind: "win", count: 0 })).toBe(NO_STREAK_TEXT);
  });
});

describe("extending a streak, which is how a stored one moves", () => {
  it("carries a run forward when the result matches", () => {
    expect(extendStreak({ kind: "win", count: 2 }, "win")).toEqual({ kind: "win", count: 3 });
  });

  it("starts again from one when it does not", () => {
    expect(extendStreak({ kind: "win", count: 9 }, "loss")).toEqual({ kind: "loss", count: 1 });
    expect(extendStreak({ kind: "win", count: 9 }, "draw")).toEqual({ kind: "draw", count: 1 });
  });

  it("starts from one with nothing before it", () => {
    expect(extendStreak(null, "draw")).toEqual({ kind: "draw", count: 1 });
  });

  it("agrees with reading the whole run back, which is what the backfill does", () => {
    // The two ways a streak can be arrived at must never disagree: one is
    // written a game at a time, the other reads the games. A backfill that
    // produced a different answer from the writer would be a silent rewrite.
    const results = ["win", "draw", "draw", "loss", "win", "win"] as const;
    const built = [...results].reverse().reduce<ReturnType<typeof extendStreak> | null>(
      (streak, result) => extendStreak(streak, result),
      null,
    );
    expect(built).toEqual(streakFrom(results));
  });
});

describe("how a streak is written", () => {
  it("is a letter and a number", () => {
    expect(streakText({ kind: "win", count: 3 })).toBe("W3");
    expect(streakText({ kind: "loss", count: 2 })).toBe("L2");
    expect(streakText({ kind: "draw", count: 1 })).toBe("D1");
  });

  it("says in words what the letter means", () => {
    expect(streakLabel({ kind: "loss", count: 2 })).toContain("lost in a row");
    expect(streakLabel(null)).not.toContain("0");
  });
});

describe("reading a stored streak", () => {
  const row = {
    peopleStreakKind: "win",
    peopleStreakCount: 3,
    computerStreakKind: "loss",
    computerStreakCount: 1,
    ratedStreakKind: "win",
    ratedStreakCount: 2,
  };

  it("reads each scope from its own pair of columns", () => {
    expect(streakIn(row, "people")).toEqual({ kind: "win", count: 3 });
    expect(streakIn(row, "computer")).toEqual({ kind: "loss", count: 1 });
    expect(streakIn(row, "all")).toEqual({ kind: "win", count: 2 });
  });

  it("believes the pair only together", () => {
    // A kind with no count and a count with no kind are both "nothing said".
    expect(streakIn({ peopleStreakKind: "win", peopleStreakCount: 0 }, "people")).toBeNull();
    expect(streakIn({ peopleStreakKind: null, peopleStreakCount: 4 }, "people")).toBeNull();
    expect(streakIn({}, "people")).toBeNull();
  });

  it("refuses a kind it does not recognise rather than passing it on", () => {
    expect(streakIn({ peopleStreakKind: "forfeit", peopleStreakCount: 2 }, "people")).toBeNull();
  });
});

describe("writing a streak", () => {
  it("moves the pool's run and the both-pools run together on the ladder", () => {
    const row = { peopleStreakKind: "win", peopleStreakCount: 2, ratedStreakKind: "win", ratedStreakCount: 5 };
    expect(streakWrite(row, "win", ["people", "all"])).toEqual({
      peopleStreakKind: "win",
      peopleStreakCount: 3,
      ratedStreakKind: "win",
      ratedStreakCount: 6,
    });
  });

  it("moves only the pool's run on a per-game standing", () => {
    const write = streakWrite({ computerStreakKind: "loss", computerStreakCount: 1 }, "loss", ["computer"]);
    expect(write).toEqual({ computerStreakKind: "loss", computerStreakCount: 2 });
    expect(Object.keys(write)).not.toContain("ratedStreakKind");
  });

  it("only ever names columns the table it is for actually has", () => {
    const playerColumns = PLAYER_STREAK_SCOPES.flatMap((scope) => [
      STREAK_COLUMNS[scope].kind,
      STREAK_COLUMNS[scope].count,
    ]);
    for (const scope of VARIANT_STREAK_SCOPES) {
      expect(playerColumns).toContain(STREAK_COLUMNS[scope].kind);
    }
    // Every scope has its own pair: no two share a column, or one write would
    // silently overwrite another's answer about a different set of games.
    expect(new Set(playerColumns).size).toBe(playerColumns.length);
  });
});
