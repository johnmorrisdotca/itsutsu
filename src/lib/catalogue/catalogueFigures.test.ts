import { describe, expect, it } from "vitest";

import {
  familyFiguresOf,
  ladderOrder,
  sinceLastPlayed,
  topPlayersOf,
  type LadderEntry,
} from "./catalogueFigures";

const AT = new Date("2026-09-10T12:00:00Z");

function standing(overrides: Partial<LadderEntry> & Pick<LadderEntry, "key">): LadderEntry {
  return {
    name: overrides.key,
    memberId: `m-${overrides.key}`,
    variant: "ninuki",
    pool: "people",
    rating: 1600,
    ratedGames: 5,
    wins: 3,
    losses: 2,
    draws: 0,
    updatedAt: AT,
    ...overrides,
  };
}

describe("the top player of a game", () => {
  it("is the best rating on the ladder among people", () => {
    const tops = topPlayersOf([
      standing({ key: "kyu", rating: 1580 }),
      standing({ key: "dan", rating: 1712 }),
      standing({ key: "sumi", rating: 1650 }),
    ]);
    expect(tops.get("ninuki")?.key).toBe("dan");
  });

  it("is nobody for a game nobody holds a standing in", () => {
    expect(topPlayersOf([]).size).toBe(0);
    // A row with no rated games in its pool is a starting rating, not a standing.
    const tops = topPlayersOf([standing({ key: "ghost", rating: 1900, ratedGames: 0 })]);
    expect(tops.has("ninuki")).toBe(false);
  });

  describe("ties, settled the way the standings page settles them", () => {
    it("on rating, by more games played", () => {
      const tops = topPlayersOf([
        standing({ key: "a", rating: 1700, ratedGames: 4 }),
        standing({ key: "b", rating: 1700, ratedGames: 9 }),
      ]);
      expect(tops.get("ninuki")?.key).toBe("b");
    });

    it("on rating and games, by who played most recently", () => {
      const tops = topPlayersOf([
        standing({ key: "a", rating: 1700, updatedAt: new Date("2026-09-01T00:00:00Z") }),
        standing({ key: "b", rating: 1700, updatedAt: new Date("2026-09-09T00:00:00Z") }),
      ]);
      expect(tops.get("ninuki")?.key).toBe("b");
    });

    it("on everything else, by name, so the answer is the same on every load", () => {
      const both = [standing({ key: "zed" }), standing({ key: "amy" })];
      expect(topPlayersOf(both).get("ninuki")?.key).toBe("amy");
      expect(topPlayersOf([...both].reverse()).get("ninuki")?.key).toBe("amy");
    });

    it("orders exactly as LADDER_ORDER reads", () => {
      const sorted = [
        standing({ key: "c", rating: 1600 }),
        standing({ key: "b", rating: 1700, ratedGames: 2 }),
        standing({ key: "a", rating: 1700, ratedGames: 8 }),
      ].sort(ladderOrder);
      expect(sorted.map((one) => one.key)).toEqual(["a", "b", "c"]);
    });
  });

  it("comes from the computer ladder where only computer games have been played, and says so", () => {
    const tops = topPlayersOf([
      standing({ key: "meijin", pool: "computer", rating: 1820, memberId: "bot-meijin" }),
      standing({ key: "hana", pool: "computer", rating: 1540 }),
    ]);
    const top = tops.get("ninuki");
    expect(top?.key).toBe("meijin");
    expect(top?.pool).toBe("computer");
  });

  it("prefers a person's standing among people over a higher one against the programs", () => {
    /*
     * The case the two pools exist for. Meijin's 1900 was earned against
     * people who played it, in a pool of its own; Dan's 1610 is a place among
     * people, and the people's ladder is the one "top player" names first.
     */
    const tops = topPlayersOf([
      standing({ key: "meijin", pool: "computer", rating: 1900, memberId: "bot-meijin" }),
      standing({ key: "dan", pool: "computer", rating: 1650 }),
      standing({ key: "dan", pool: "people", rating: 1610 }),
    ]);
    expect(tops.get("ninuki")).toMatchObject({ key: "dan", pool: "people", rating: 1610 });
  });

  it("keeps each game's answer to itself", () => {
    const tops = topPlayersOf([
      standing({ key: "dan", variant: "ninuki", rating: 1700 }),
      standing({ key: "kyu", variant: "sannuki", rating: 1650 }),
      standing({ key: "dan", variant: "sannuki", rating: 1600 }),
    ]);
    expect(tops.get("ninuki")?.key).toBe("dan");
    expect(tops.get("sannuki")?.key).toBe("kyu");
  });
});

describe("a family's figures", () => {
  const games = ["ninuki", "sannuki"];

  it("counts nothing, and crowns nobody, where nothing has been played", () => {
    expect(familyFiguresOf(games, new Map(), new Map())).toEqual({
      played: 0,
      gamesPlayed: 0,
      games: 2,
      crowns: null,
    });
  });

  it("adds the family's games up and says how many of them have been tried", () => {
    const figures = familyFiguresOf(games, new Map([["ninuki", 7]]), new Map());
    expect(figures).toMatchObject({ played: 7, gamesPlayed: 1, games: 2, crowns: null });
  });

  it("ignores games outside the family", () => {
    const figures = familyFiguresOf(games, new Map([["ninuki", 2], ["hex", 40]]), new Map());
    expect(figures.played).toBe(2);
  });

  it("names the one player who tops the most of its games, and which", () => {
    const dan = standing({ key: "dan" });
    const tops = new Map([
      ["ninuki", dan],
      ["sannuki", { ...dan, variant: "sannuki" }],
    ]);
    const figures = familyFiguresOf(games, new Map([["ninuki", 3], ["sannuki", 1]]), tops);
    expect(figures.crowns).toMatchObject({ kind: "held", games: ["ninuki", "sannuki"] });
    expect(figures.crowns?.kind === "held" ? figures.crowns.holder.key : null).toBe("dan");
  });

  it("counts a person once across both pools", () => {
    const tops = new Map([
      ["ninuki", standing({ key: "dan", memberId: "m-dan" })],
      ["sannuki", standing({ key: "dan", memberId: "m-dan", pool: "computer", variant: "sannuki" })],
    ]);
    expect(familyFiguresOf(games, new Map(), tops).crowns).toMatchObject({ kind: "held" });
  });

  it("says the crowns are shared rather than picking one of two equal holders", () => {
    const tops = new Map([
      ["ninuki", standing({ key: "dan" })],
      ["sannuki", standing({ key: "kyu", variant: "sannuki" })],
    ]);
    expect(familyFiguresOf(games, new Map(), tops).crowns).toEqual({ kind: "shared", holders: 2, each: 1 });
  });

  it("tells two names with nobody behind them apart by the name", () => {
    const tops = new Map([
      ["ninuki", standing({ key: "sumi", memberId: null })],
      ["sannuki", standing({ key: "hana", memberId: null, variant: "sannuki" })],
    ]);
    expect(familyFiguresOf(games, new Map(), tops).crowns).toMatchObject({ kind: "shared", holders: 2 });
  });
});

describe("when a game was last played", () => {
  const now = new Date("2026-09-13T09:00:00Z");

  it("is today on the same calendar day, and never a negative count", () => {
    expect(sinceLastPlayed(new Date("2026-09-13T00:01:00Z"), now)).toEqual({ unit: "today" });
    expect(sinceLastPlayed(new Date("2026-09-13T11:00:00Z"), now)).toEqual({ unit: "today" });
  });

  it("is yesterday for the day before, however few hours ago", () => {
    expect(sinceLastPlayed(new Date("2026-09-12T23:59:00Z"), now)).toEqual({ unit: "yesterday" });
  });

  it("counts days, then months, then years, never as one of anything", () => {
    expect(sinceLastPlayed(new Date("2026-09-10T12:00:00Z"), now)).toEqual({ unit: "days", count: 3 });
    expect(sinceLastPlayed(new Date("2026-07-31T12:00:00Z"), now)).toEqual({ unit: "days", count: 44 });
    expect(sinceLastPlayed(new Date("2026-07-30T12:00:00Z"), now)).toEqual({ unit: "months", count: 2 });
    expect(sinceLastPlayed(new Date("2025-06-01T12:00:00Z"), now)).toEqual({ unit: "months", count: 15 });
    expect(sinceLastPlayed(new Date("2024-01-01T12:00:00Z"), now)).toEqual({ unit: "years", count: 3 });
  });
});
