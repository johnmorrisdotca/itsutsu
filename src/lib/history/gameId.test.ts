import { describe, expect, it } from "vitest";

import { GAME_ID_PATTERN, makeGameId } from "./gameId";

describe("a game's id", () => {
  it("is four characters, a dash, and four more", () => {
    for (let i = 0; i < 200; i += 1) expect(makeGameId()).toMatch(GAME_ID_PATTERN);
  });

  it("never uses a character that argues with another on screen", () => {
    const ids = Array.from({ length: 500 }, () => makeGameId()).join("");
    for (const confusable of ["0", "o", "1", "i", "l"]) expect(ids).not.toContain(confusable);
  });

  it("draws every character of its alphabet, and reads the roll in order", () => {
    // A roll that walks the alphabet start to end gives the first, then the last.
    const rolls = [0, 0.9999, 0, 0.9999, 0, 0.9999, 0, 0.9999];
    let at = 0;
    const id = makeGameId(() => rolls[at++]);
    expect(id).toBe("2z2z-2z2z");
  });

  it("is unlikely enough to repeat that a thousand in a row are all different", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => makeGameId()));
    expect(ids.size).toBe(1000);
  });
});
