import { describe, expect, it } from "vitest";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { GameSummary } from "./gameHistory.types";
import { winStreak } from "./streaks";

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
  clockMode: "move",
  blackTimeMs: null,
  whiteTimeMs: null,
  deadlineAt: null,
  extraMs: 0,
  rated: true,
  openSeat: null,
  blackMember: null,
  whiteMember: null,
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
