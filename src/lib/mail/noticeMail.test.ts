import { describe, expect, it } from "vitest";

import type { GameOverSummary, NoticeEvent } from "./mail.types";
import { gameOverWords, lengthWords, noticeMail } from "./noticeMail";

/**
 * THE EMAIL A FINISHED GAME SENDS, one to each person who sat at it: who won
 * and why, how long it took, the final position and a way to play again.
 */

const DAY = 24 * 60 * 60 * 1000;
const start = new Date("2026-09-21T10:00:00Z");

const reversi: GameOverSummary = {
  gameId: "k3m9-p2qx",
  variant: "reversi",
  facts: { outcome: "decided", winner: "black", reason: "count", score: { kind: "discs", black: 38, white: 26 } },
  names: { black: "Hanako Morris", white: "Kuro Tanaka" },
  moveCount: 60,
  startedAt: start,
  endedAt: new Date(start.getTime() + 2 * DAY),
  ratingChange: { black: 12, white: -12 },
};

const over = (stone: "black" | "white"): NoticeEvent => ({ kind: "game-over", gameId: "k3m9-p2qx", winner: "black", stone, memberId: `m-${stone}` });

describe("the email a finished game sends", () => {
  it("tells the winner they won, why, the score, how long it took and what it did to their rating", () => {
    const { subject, text } = gameOverWords(reversi, "black");
    expect(subject).toBe("You won at Reversi against Kuro T.");
    expect(text).toContain("You won your game of Reversi against Kuro T.");
    // The result card's own sentence, said to the person it is about.
    expect(text).toContain("You had more discs at the end.");
    expect(text).toContain("Discs: Black 38 · White 26");
    expect(text).toContain("It took 60 moves over 2 days.");
    expect(text).toContain("Your rating went up 12.");
  });

  it("tells the other seat the same game from their side", () => {
    const { subject, text } = gameOverWords(reversi, "white");
    expect(subject).toBe("Hanako M. won your game of Reversi");
    expect(text).toContain("You lost your game of Reversi to Hanako M.");
    expect(text).toContain("Hanako M. had more discs at the end.");
    expect(text).toContain("Your rating went down 12.");
  });

  it("says a draw is a draw, with the board's own reason and no rating line where nothing moved", () => {
    const drawn: GameOverSummary = { ...reversi, facts: { outcome: "decided", winner: null, reason: "boardFull", score: null }, ratingChange: null };
    const { subject, text } = gameOverWords(drawn, "white");
    expect(subject).toBe("Your game of Reversi with Hanako M. was a draw");
    expect(text).toContain("The board filled with nobody winning.");
    expect(text).not.toContain("rating");
    expect(text).not.toContain("Discs");
  });

  it("links to the final position and to playing again, both on the site", () => {
    const { text } = gameOverWords(reversi, "black");
    expect(text).toContain("The final position:\nhttps://itsutsu.com/games/reversi/match/k3m9-p2qx");
    // The result card's rematch: the set-up screen, filled in from this game.
    expect(text).toContain("Play again:\nhttps://itsutsu.com/games/new?rematch=k3m9-p2qx");
  });

  it("carries the footer and the way to the reader's games, like every notice", () => {
    const mail = noticeMail(over("black"), "hanako@example.test", reversi);
    expect(mail.to).toBe("hanako@example.test");
    expect(mail.subject).toBe("You won at Reversi against Kuro T.");
    expect(mail.text).toContain("Your games:\nhttps://itsutsu.com/play");
    expect(mail.text).toContain("hello@itsutsu.com");
  });

  it("says only what the event knows when the game could not be read, or is another game", () => {
    const unread = noticeMail(over("white"), "kuro@example.test");
    expect(unread.subject).toBe("Your game on Itsutsu has finished");
    expect(unread.text).toContain("Your game has finished, and you lost.");
    expect(unread.text).not.toContain("match/");
    const other = noticeMail(over("white"), "kuro@example.test", { ...reversi, gameId: "zzzz-zzzz" });
    expect(other.subject).toBe("Your game on Itsutsu has finished");
  });

  it("names a seat nobody named by its colour, never with a blank", () => {
    const { subject } = gameOverWords({ ...reversi, names: { black: "Hanako Morris", white: "" } }, "black");
    expect(subject).toBe("You won at Reversi against White");
  });
});

describe("how long a game took", () => {
  it("counts the moves always, and the time in the unit that reads", () => {
    expect(lengthWords(1, start, new Date(start.getTime() + 20_000))).toBe("It took 1 move in under a minute.");
    expect(lengthWords(23, start, new Date(start.getTime() + 25 * 60_000))).toBe("It took 23 moves in 25 minutes.");
    expect(lengthWords(40, start, new Date(start.getTime() + 60 * 60_000))).toBe("It took 40 moves over 1 hour.");
    expect(lengthWords(40, start, new Date(start.getTime() + 30 * 60 * 60_000))).toBe("It took 40 moves over 30 hours.");
    expect(lengthWords(90, start, new Date(start.getTime() + 9 * DAY))).toBe("It took 90 moves over 9 days.");
  });

  it("says no time where the game kept none, rather than a length nobody measured", () => {
    expect(lengthWords(12, start, null)).toBe("It took 12 moves.");
    expect(lengthWords(12, start, new Date(start.getTime() - 1000))).toBe("It took 12 moves.");
  });
});
