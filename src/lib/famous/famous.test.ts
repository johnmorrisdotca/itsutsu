import { describe, expect, it } from "vitest";

import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";

import { famousFrames, famousTimeline } from "./famous";
import { FAMOUS_GAMES } from "./famousGames.data";

describe("every famous game replays by this site's rules", () => {
  it.each(FAMOUS_GAMES.map((game) => [game.id, game] as const))("%s", (_id, game) => {
    const timeline = famousTimeline(game);
    const moves = game.moves.split(" ").filter((token) => token !== "").length;
    // Every recorded move is a position; an Othello forced pass adds one more.
    expect(timeline.length).toBeGreaterThanOrEqual(moves + 1);
  });

  /*
   * Othello's record carries its own check: the discs each side ended with.
   * WTHOR gives the empty squares at the end to the winner, so a game that
   * stopped short of a full board is compared on who won, and a full one on
   * the count itself.
   */
  it.each(FAMOUS_GAMES.filter((game) => game.variant === "reversi").map((game) => [game.id, game] as const))(
    "%s ends with the discs its record says",
    (_id, game) => {
      const last = famousTimeline(game).at(-1)!;
      const black = last.board.filter((cell) => cell === STONES.black).length;
      const white = last.board.filter((cell) => cell === STONES.white).length;
      const [recordBlack, recordWhite] = game.result.split("-").map(Number);
      expect(last.status).not.toBe(GAME_STATUS.playing);
      if (black + white === 64) expect([black, white]).toEqual([recordBlack, recordWhite]);
      else expect(Math.sign(black - white)).toBe(Math.sign(recordBlack - recordWhite));
    },
  );
});

describe("famousFrames", () => {
  it("names an Othello tile by its record's own square, counted from the top", () => {
    const final = FAMOUS_GAMES.find((game) => game.id === "woc-2025-kurita-takanashi-1")!;
    const frames = famousFrames(final);
    expect(frames).toHaveLength(60);
    expect(frames[0].name).toBe("f5");
    expect(frames.map((frame) => frame.name).join(" ")).toBe(final.moves);
  });

  it("leaves Go's names as this site writes them, which is how Go records write them", () => {
    const game = FAMOUS_GAMES.find((one) => one.id === "alphago-leesedol-4")!;
    // The first move, "pd" in SGF: column p, fourth row from the top — Q16.
    expect(famousFrames(game)[0].name).toBe("Q16");
  });
});
