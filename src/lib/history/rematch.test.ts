import { describe, expect, it } from "vitest";

import {
  colourAfterSwap,
  opponentOf,
  seatOf,
  seatsForRematch,
  settingsToCarry,
  type PlayedGame,
} from "./rematch";

const played: PlayedGame = {
  size: 19,
  variant: "renju",
  obstacles: "3",
  opening: "swap2",
  handicap: null,
  seed: 4242,
  opener: "black",
  winLength: 5,
  blackName: "Aki",
  whiteName: "Kyu",
  blackMemberId: "aki",
  whiteMemberId: "kyu",
  moveTimeMs: 259_200_000,
  clockMode: "move",
  timeoutPenalty: "game-strict",
  allowResign: false,
  drawLimit: "half",
  rated: true,
};

describe("what a rematch carries over", () => {
  it("keeps the board it was played on", () => {
    const carried = settingsToCarry(played);
    expect(carried.size).toBe(19);
    expect(carried.variant).toBe("renju");
    expect(carried.obstacles).toBe("3");
    expect(carried.winLength).toBe(5);
  });

  it("keeps the clock, which is the half that was being lost", () => {
    /*
     * A rematch of a three-day-a-move game used to come back with whatever
     * the defaults happened to be. The pace is as much part of the game as
     * the board, and more likely to be noticed when it is wrong.
     */
    const carried = settingsToCarry(played);
    expect(carried.moveTimeMs).toBe(259_200_000);
    expect(carried.clockMode).toBe("move");
    expect(carried.timeoutPenalty).toBe("game-strict");
  });

  it("keeps the rules of play, including the ones that are off", () => {
    const carried = settingsToCarry(played);
    expect(carried.allowResign).toBe(false);
    expect(carried.drawLimit).toBe("half");
    expect(carried.rated).toBe(true);
  });

  it("keeps the seed, so a scattered board scatters the same way", () => {
    // A rematch on a different board would not be a rematch.
    expect(settingsToCarry(played).seed).toBe(4242);
  });

  it("carries nobody's name or seat: who sits where is decided separately", () => {
    const carried = settingsToCarry(played) as Record<string, unknown>;
    expect(carried.blackName).toBeUndefined();
    expect(carried.blackMemberId).toBeUndefined();
  });
});

describe("who was in the game", () => {
  it("finds the colour somebody held", () => {
    expect(seatOf(played, "aki")).toBe("black");
    expect(seatOf(played, "kyu")).toBe("white");
  });

  it("is nobody for a reader who did not play, or for a browser with no account", () => {
    expect(seatOf(played, "someone-else")).toBeNull();
    expect(seatOf(played, null)).toBeNull();
  });

  it("finds the opponent by id, which is what a computer player has instead of an address", () => {
    // The old rematch was addressed to an email, so it could never be offered
    // against Kyu, Dan or Meijin — the case it is most wanted for.
    expect(opponentOf(played, "aki")).toBe("kyu");
    expect(opponentOf(played, "kyu")).toBe("aki");
  });

  it("has no opponent to offer somebody who was not playing", () => {
    expect(opponentOf(played, "someone-else")).toBeNull();
  });
});

describe("who takes which chair next time", () => {
  const aki = { id: "aki", name: "Aki" };
  const kyu = { id: "kyu", name: "Kyu" };

  it("swaps the colours, because black moves first and that is worth something", () => {
    const seats = seatsForRematch(played, aki, kyu);
    expect(seats).toEqual({
      blackMemberId: "kyu",
      whiteMemberId: "aki",
      blackName: "Kyu",
      whiteName: "Aki",
    });
  });

  it("swaps the other way when the other one asks", () => {
    // Kyu held white, so Kyu takes black — the swap is about the asker's own
    // last colour, not about who is asking.
    const seats = seatsForRematch(played, kyu, aki);
    expect(seats?.blackMemberId).toBe("kyu");
    expect(seats?.whiteMemberId).toBe("aki");
  });

  it("refuses to seat somebody who was not in the game", () => {
    expect(seatsForRematch(played, { id: "nobody", name: "Nobody" }, kyu)).toBeNull();
  });

  it("says in advance which colour the asker will play", () => {
    // So the button can say it. A colour that changes without being mentioned
    // is the kind of surprise somebody finds out about three moves in.
    expect(colourAfterSwap(played, "aki")).toBe("white");
    expect(colourAfterSwap(played, "kyu")).toBe("black");
    expect(colourAfterSwap(played, null)).toBeNull();
  });
});
