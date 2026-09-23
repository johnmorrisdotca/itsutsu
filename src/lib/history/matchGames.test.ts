import { describe, expect, it } from "vitest";

import { matchGameState } from "./matchGames";

const base = { status: "finished", winner: null, offeredAt: null, declinedAt: null, withdrawnAt: null };

describe("how a game of a match stands", () => {
  it("reads an unanswered offer and a game in play apart", () => {
    expect(matchGameState({ ...base, status: "active", offeredAt: new Date() })).toBe("offered");
    expect(matchGameState({ ...base, status: "active" })).toBe("playing");
  });

  it("names the colour that won, and a draw as a draw", () => {
    expect(matchGameState({ ...base, winner: "black" })).toBe("black");
    expect(matchGameState({ ...base, winner: "white" })).toBe("white");
    expect(matchGameState(base)).toBe("drawn");
  });

  it("says a refused offer was refused, never that it was drawn", () => {
    expect(matchGameState({ ...base, declinedAt: new Date() })).toBe("declined");
    expect(matchGameState({ ...base, withdrawnAt: new Date() })).toBe("withdrawn");
  });
});
