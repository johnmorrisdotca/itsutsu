import { describe, expect, it } from "vitest";

import type { GameSummary } from "./gameHistory.types";
import { recordAsText } from "./recordText";

/**
 * The whole record as plain text.
 *
 * What is worth holding here is not the wording but the shape of the file
 * somebody keeps: that the columns line up whatever the names are, that a
 * long name is never cut short to make them, that no line ends in spaces, and
 * that a listing which had to stop short says so rather than just ending.
 */
function game(over: Partial<GameSummary> = {}): GameSummary {
  return {
    id: "g1",
    playedAt: "2026-09-08T14:32:11.000Z",
    status: "finished",
    blackName: "John Morris",
    whiteName: "Ada Lovelace",
    size: 15,
    winLength: 5,
    variant: "freestyle",
    obstacles: "",
    opener: "black",
    opening: "free",
    handicap: { stone: null } as GameSummary["handicap"],
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: null,
    forfeits: { black: 0, white: 0 },
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
    result: "black",
    winner: "John Morris",
    moveCount: 41,
    durationMs: null,
    ...over,
  } as GameSummary;
}

function lines(text: string): string[] {
  return text.split("\n");
}

describe("the record as plain text", () => {
  it("prints a heading, a count, a header row and one line per game", () => {
    const text = recordAsText([game(), game({ id: "g2", moveCount: 7 })], {
      heading: "Itsutsu — every finished game",
      total: 2,
    });
    const out = lines(text);
    expect(out[0]).toBe("Itsutsu — every finished game");
    expect(out[1]).toBe("2 games.");
    expect(out[2]).toBe("");
    expect(out[3]).toContain("Date");
    expect(out[3]).toContain("Moves");
    expect(out[4]).toMatch(/^-+ {2}-+/);
    expect(out.filter((line) => line.startsWith("2026-09-08"))).toHaveLength(2);
  });

  it("says one game, not one games", () => {
    expect(recordAsText([game()], { heading: "x", total: 1 })).toContain("1 game.");
  });

  it("gives the date in ISO, not in whoever is reading's locale", () => {
    // A file kept for years is read by somebody who may not share the locale
    // that wrote it, and ISO dates sort.
    const text = recordAsText([game()], { heading: "x", total: 1 });
    expect(text).toContain("2026-09-08");
    expect(text).not.toContain("09/08/2026");
  });

  it("widens a column to fit the longest name rather than cutting the name", () => {
    const long = "Bartholomew Fotheringay-Whitworth";
    const text = recordAsText([game({ blackName: long }), game({ id: "g2" })], {
      heading: "x",
      total: 2,
    });
    expect(text).toContain(long);
    // Both rows still start their White column at the same offset.
    const rows = lines(text).filter((line) => line.startsWith("2026-09-08"));
    expect(rows[0].indexOf("Ada Lovelace")).toBe(rows[1].indexOf("Ada Lovelace"));
  });

  it("leaves no trailing spaces on any line", () => {
    const text = recordAsText([game({ blackName: "A" }), game({ id: "g2" })], {
      heading: "x",
      total: 2,
    });
    for (const line of lines(text)) expect(line).toBe(line.trimEnd());
  });

  it("names a seat nobody sat in rather than leaving a hole", () => {
    const text = recordAsText([game({ blackName: "  ", whiteName: "" })], {
      heading: "x",
      total: 1,
    });
    expect(text).toContain("Player 1");
    expect(text).toContain("Player 2");
  });

  it("says what it left out when it could not print everything", () => {
    const text = recordAsText([game()], { heading: "x", total: 4000 });
    expect(text).toContain("1 of 4000 games");
    expect(text).toContain("the rest are on the site");
  });

  it("says so plainly when there is nothing to print", () => {
    expect(recordAsText([], { heading: "Itsutsu", total: 0 })).toBe("Itsutsu\n\nNo games yet.\n");
  });

  it("sets the move counts to the right, so the digits line up", () => {
    const text = recordAsText([game({ moveCount: 7 }), game({ id: "g2", moveCount: 118 })], {
      heading: "x",
      total: 2,
    });
    const rows = lines(text).filter((line) => line.startsWith("2026-09-08"));
    expect(rows[0].endsWith("  7")).toBe(true);
    expect(rows[1].endsWith("118")).toBe(true);
    expect(rows[0]).toHaveLength(rows[1].length);
  });

  it("calls each game by the name the site calls it", () => {
    const text = recordAsText([game({ variant: "grandReversi" })], { heading: "x", total: 1 });
    expect(text).toContain("Grand Reversi");
  });

  it("says who won in words, not in a code", () => {
    expect(recordAsText([game({ result: "draw" })], { heading: "x", total: 1 })).toContain("Draw");
    expect(recordAsText([game({ result: "white" })], { heading: "x", total: 1 })).toContain(
      "White won",
    );
  });
});
