import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";

import { rematchTitle, swapNote } from "./setUpHeadingWords";

/**
 * A REMATCH'S HEADING, FROM WHERE THE CHOICES STAND.
 *
 * The same three answers the notice gives: a rematch while it is the same game
 * against the same player, and a new game — named for whoever it is against — as
 * soon as it is not.
 */

const plain = { en: "Gomoku", kanji: "五目並べ" };

describe("the heading of a rematch", () => {
  it("says play them again, and the swapped colour, while it is still a rematch", () => {
    const state = { repeat: true, opponent: { name: "Foe Tester" } };
    expect(rematchTitle({ againName: "Foe Tester", state, plain })).toEqual({ en: "Play Foe Tester again", kanji: "再戦" });
    expect(swapNote(state, STONES.white)).toBe("you take White");
  });

  it("names the player chosen instead, and swaps nothing, once it is a new game", () => {
    const state = { repeat: false, opponent: { name: "Razryad" } };
    expect(rematchTitle({ againName: "Foe Tester", state, plain })).toEqual({ en: "Against Razryad", kanji: "対局" });
    expect(swapNote(state, STONES.white)).toBeNull();
  });

  it("falls back to the game's own title when nobody in particular is chosen", () => {
    const state = { repeat: false, opponent: null };
    expect(rematchTitle({ againName: "Foe Tester", state, plain })).toEqual(plain);
    expect(swapNote(state, STONES.black)).toBeNull();
  });
});
