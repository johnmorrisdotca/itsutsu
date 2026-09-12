import { describe, expect, it } from "vitest";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { GameSummary } from "./gameHistory.types";
import { streakIn, winStreak } from "./streaks";

function game(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
): GameSummary {
  return {
    id: `${blackName}-${whiteName}-${winner}`,
    playedAt: "2026-09-06T00:00:00.000Z",
    status: "finished",
    blackName,
    whiteName,
    // A streak is read off the names a listing SHOWS, so the fixture's two are
    // the same: this file is about runs of wins, not about renaming.
    playedAs: { black: blackName, white: whiteName },
    size: 15,
    winLength: 5,
    variant: "freestyle",
    obstacles: "none",
    opener: "black",
    opening: "free",
    handicap: NO_HANDICAP,
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: null,
    forfeits: { black: 0, white: 0 },
    result: winner ?? "draw",
    winner,
    moveCount: 20,
    durationMs: null,
  allowResign: true,
  drawLimit: "none",
  clockMode: "move",
  blackTimeMs: null,
  whiteTimeMs: null,
  deadlineAt: null,
  extraMs: 0,
  rated: true,
  openSeat: null,
  blackMemberId: null,
  whiteMemberId: null,
  };
}

describe("winStreak", () => {
  it("counts wins from the newest game back to the first non-win", () => {
    const games = [
      game("Aki", "Ren", "black"),
      game("Ren", "Aki", "white"),
      game("Aki", "Ren", "white"),
      game("Aki", "Ren", "black"),
    ];
    expect(winStreak(games, "Aki")).toBe(2);
    expect(winStreak(games, "Ren")).toBe(0);
  });

  it("ends on a draw", () => {
    const games = [game("Aki", "Ren", "black"), game("Aki", "Ren", null), game("Aki", "Ren", "black")];
    expect(winStreak(games, "Aki")).toBe(1);
  });

  it("ignores games the player was not in, and case", () => {
    const games = [game("aki", "Ren", "black"), game("Sora", "Ren", "white"), game("Ren", "AKI", "white")];
    expect(winStreak(games, "Aki")).toBe(2);
  });

  it("is zero for an anonymous seat", () => {
    expect(winStreak([game("", "Ren", "black")], "")).toBe(0);
  });
});

describe("whose seat it was", () => {
  /**
   * A game as the listing now hands it over: the seats resolved to each
   * member's CURRENT name, with `playedAs` carrying the names as played, and
   * the member ids on the row. See `currentNames.ts`.
   */
  function played(
    black: { shown: string; as: string; id: string | null },
    white: { shown: string; as: string; id: string | null },
    winner: "black" | "white" | null,
  ): GameSummary {
    return {
      ...game(black.shown, white.shown, winner),
      playedAs: { black: black.as, white: white.as },
      blackMemberId: black.id,
      whiteMemberId: white.id,
    };
  }

  const HANAKO = { shown: "Hanachan", as: "Hanako Morris", id: "m-hanako" };
  const NOW = { shown: "Hanachan", as: "Hanachan", id: "m-hanako" };
  const REN = { shown: "Ren", as: "Ren", id: "m-ren" };

  it("follows a member through a rename, by id", () => {
    /*
     * THE BUG THIS EXISTS FOR, and the case is built so that the name alone
     * CANNOT answer it — otherwise the test would pass on the code it is
     * about.
     *
     * Every game here is shown under her current name, which is what
     * `toSummary` resolves a seat to. The caller asks under the name she
     * PLAYED as. Keyed by name, not one game matches and the run is null;
     * keyed by the id on the row, it is the four wins it really is.
     */
    const games = [
      played(NOW, REN, "black"),
      played(NOW, REN, "black"),
      played(HANAKO, REN, "black"),
      played(HANAKO, REN, "black"),
      played(HANAKO, REN, "white"),
    ];
    expect(streakIn(games, { memberId: "m-hanako", name: "Hanako Morris" })).toEqual({
      kind: "win",
      count: 4,
    });
    /*
     * And this is the wrong answer the id exists to avoid, pinned so nobody
     * can quietly go back to it: asked under the old name with no id, only the
     * three games she played under that name are found, so the run of four
     * reads as a run of TWO. Not an error, not nought — a plausible number,
     * which is the dangerous kind.
     */
    expect(streakIn(games, { name: "Hanako Morris" })).toEqual({ kind: "win", count: 2 });
  });

  it("follows the rename by name too, for a caller with no id to offer", () => {
    // The post-game note runs in the browser, and a client is never told its
    // own member id. It matches on the name, and must match BOTH spellings.
    const games = [played(NOW, REN, "black"), played(HANAKO, REN, "black")];
    expect(winStreak(games, "Hanachan")).toBe(2);
  });

  it("reads the run from the seat the id names, not the one the name does", () => {
    // Two seats, one spelling, and the id says which is theirs.
    const games = [played({ ...REN, shown: "Ren" }, { ...HANAKO, shown: "Ren" }, "white")];
    expect(streakIn(games, { memberId: "m-hanako", name: "Ren" })).toEqual({ kind: "win", count: 1 });
    expect(streakIn(games, { memberId: "m-ren", name: "Ren" })).toEqual({ kind: "loss", count: 1 });
  });
});

describe("a run of any kind", () => {
  it("counts losses and draws as runs of their own", () => {
    expect(streakIn([game("Aki", "Ren", "white"), game("Aki", "Ren", "white")], { name: "Aki" })).toEqual({
      kind: "loss",
      count: 2,
    });
    expect(streakIn([game("Aki", "Ren", null), game("Aki", "Ren", null)], { name: "Aki" })).toEqual({
      kind: "draw",
      count: 2,
    });
  });

  it("is null with no games of theirs at all, rather than a run of nought", () => {
    expect(streakIn([game("Sora", "Ren", "black")], { name: "Aki" })).toBeNull();
    expect(streakIn([], { name: "Aki" })).toBeNull();
  });
});
