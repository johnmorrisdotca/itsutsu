import { describe, expect, it } from "vitest";

import { famousFrames, famousTimeline } from "./famous";
import { famousMoveNames, famousMoves } from "./famousMoves";
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

describe("a famous game's moves, for its scrubber and its list", () => {
  it("numbers one move for each step of the timeline, so move n is the position at timeline[n]", () => {
    for (const game of FAMOUS_GAMES) {
      const timeline = famousTimeline(game);
      const moves = famousMoves(timeline);
      expect(moves.length, game.id).toBe(timeline.length - 1);
      moves.forEach((move, index) => {
        expect(move.number).toBe(index + 1);
        expect(timeline[move.number]!.moves.at(-1)?.stone, game.id).toBe(move.stone);
      });
    }
  });

  it("names an Othello game's moves by its own record, and leaves Go's to the board's names", () => {
    // The same opening the frames test reads: Othello counts its rows from the top, so these are not the board's names.
    const othello: FamousGame = {
      id: "fixture-names",
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
    const names = famousMoveNames(othello, famousMoves(famousTimeline(othello)))!;
    expect([1, 2, 3, 4, 5].map((number) => names.get(number))).toEqual(["f5", "d6", "c3", "d3", "c4"]);
    const go = FAMOUS_GAMES.find((game) => game.notation !== FAMOUS_NOTATIONS.othello)!;
    expect(famousMoveNames(go, famousMoves(famousTimeline(go)))).toBeNull();
  });
});
