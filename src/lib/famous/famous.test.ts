import { describe, expect, it } from "vitest";

import { famousFrames, famousTimeline } from "./famous";
import { FAMOUS_NOTATIONS, FAMOUS_SOURCES } from "./famous.constants";
import type { FamousGame } from "./famous.types";
import { FAMOUS_GAMES } from "./famousGames.data";

describe("every famous game replays by this site's rules", () => {
  it.each(FAMOUS_GAMES.map((game) => [game.id, game] as const))("%s", (_id, game) => {
    const timeline = famousTimeline(game);
    const moves = game.moves.split(" ").filter((token) => token !== "").length;
    // Every recorded move is a position; an Othello forced pass adds one more.
    expect(timeline.length).toBeGreaterThanOrEqual(moves + 1);
  });
});

describe("famousFrames", () => {
  it("names an Othello tile by the square as Othello writes it, counted from the top", () => {
    // Not a record: the first five moves of the most common opening, as a fixture for the notation.
    const opening: FamousGame = {
      id: "fixture-opening",
      variant: "reversi",
      size: 8,
      notation: FAMOUS_NOTATIONS.othello,
      event: "fixture",
      round: null,
      date: "",
      place: null,
      black: "Black",
      white: "White",
      result: "",
      source: "brouwer",
      moves: "f5 d6 c3 d3 c4",
    };
    const frames = famousFrames(opening);
    expect(frames.map((frame) => frame.name)).toEqual(["f5", "d6", "c3", "d3", "c4"]);
  });

  it("leaves Go's names as this site writes them, which is how Go records write them", () => {
    const game = FAMOUS_GAMES.find((one) => one.id === "alphago-leesedol-4")!;
    // The first move, "pd" in SGF: column p, fourth row from the top — Q16.
    expect(famousFrames(game)[0].name).toBe("Q16");
  });
});

describe("a famous game is shown only where its source allows it", () => {
  it("names a source for every game, and every source quotes the terms that grant use", () => {
    for (const game of FAMOUS_GAMES) {
      const source = FAMOUS_SOURCES[game.source];
      expect(source, game.id).toBeDefined();
      expect(source.openBecause.length, game.source).toBeGreaterThan(20);
    }
  });
});
