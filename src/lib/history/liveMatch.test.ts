import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";

import { matchAsks, matchRefusal } from "./liveMatch";
import { readCreation, type CreationAsked } from "./liveRequest";

/** A request as the route reads it, from the body a caller would send. */
function asked(body: Record<string, unknown>): CreationAsked {
  const read = readCreation({ size: 15, variant: "freestyle", ...body });
  if ("refused" in read) throw new Error(JSON.stringify(read.refused));
  return read.asked;
}

describe("who may ask for a match", () => {
  it("lets one game through whatever else is asked, as it always was", () => {
    expect(matchRefusal(asked({ open: true }))).toBeNull();
    expect(matchRefusal(asked({ hotSeat: true }))).toBeNull();
  });

  it("makes a match against a named member or a computer", () => {
    expect(matchRefusal(asked({ games: 2, challengeId: "member-1" }))).toBeNull();
    expect(matchRefusal(asked({ games: 6, challenge: "friend@example.test" }))).toBeNull();
  });

  it("refuses one nobody is named for, rather than quietly making one game", () => {
    expect(matchRefusal(asked({ games: 2 }))?.status).toBe(422);
    expect(matchRefusal(asked({ games: 2, open: true, challengeId: "member-1" }))?.error).toMatch(/posted seat/);
    expect(matchRefusal(asked({ games: 4, hotSeat: true, challengeId: "member-1" }))?.error).toMatch(/one screen/);
    expect(matchRefusal(asked({ games: 2, rematch: "game-1", challengeId: "member-1" }))?.error).toMatch(/rematch/);
  });

  it("accepts only the sizes GoldToken offers", () => {
    expect("refused" in readCreation({ size: 15, variant: "freestyle", games: 3 })).toBe(true);
    expect("refused" in readCreation({ size: 15, variant: "freestyle", games: 8 })).toBe(true);
  });
});

describe("the games of a match", () => {
  it("alternates the asker's colour, starting from the one they chose", () => {
    const games = matchAsks(asked({ games: 4, challengeId: "member-1", asColour: STONES.white }));
    expect(games.map((game) => game.data.asColour)).toEqual([STONES.white, STONES.black, STONES.white, STONES.black]);
  });

  it("starts with black when no colour was said, as a single game does", () => {
    const games = matchAsks(asked({ games: 2, challengeId: "member-1" }));
    expect(games.map((game) => game.data.asColour)).toEqual([STONES.black, STONES.white]);
  });

  it("moves the typed names with the colours, so nobody is called by the other's name", () => {
    const [first, second] = matchAsks(asked({ games: 2, challengeId: "member-1", blackName: "Aki", whiteName: "Ben" }));
    expect([first.data.blackName, first.data.whiteName]).toEqual(["Aki", "Ben"]);
    expect([second.data.blackName, second.data.whiteName]).toEqual(["Ben", "Aki"]);
  });

  it("is one game, unchanged, when one was asked for", () => {
    const games = matchAsks(asked({ challengeId: "member-1" }));
    expect(games).toHaveLength(1);
  });
});
