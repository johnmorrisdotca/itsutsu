import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import { COLOUR_CHOICES, colourFromAddress, colourIsChosen, colourToTake } from "./colourChoice";

describe("choosing which seat to take", () => {
  it("reads white and a lot off the address, and anything else as black", () => {
    expect(colourFromAddress("white")).toBe(COLOUR_CHOICES.white);
    expect(colourFromAddress("lot")).toBe(COLOUR_CHOICES.lot);
    expect(colourFromAddress("black")).toBe(COLOUR_CHOICES.black);
    expect(colourFromAddress(null)).toBe(COLOUR_CHOICES.black);
    expect(colourFromAddress("purple")).toBe(COLOUR_CHOICES.black);
  });

  it("is offered against a named opponent under an ordinary opening, and nowhere the answer is already settled", () => {
    const plain = { named: true, opening: "free", again: false, forked: false };
    expect(colourIsChosen(plain)).toBe(true);
    // A posted seat binds its poster to black by the route's own rule.
    expect(colourIsChosen({ ...plain, named: false })).toBe(false);
    // A rematch swaps the colours; a fork keeps the position's.
    expect(colourIsChosen({ ...plain, again: true })).toBe(false);
    expect(colourIsChosen({ ...plain, forked: true })).toBe(false);
    // Swap and Swap2 make the colour a move in the game.
    expect(colourIsChosen({ ...plain, opening: "swap" })).toBe(false);
    expect(colourIsChosen({ ...plain, opening: "swap2" })).toBe(false);
  });

  it("settles a lot by the roll, and the two plain answers by themselves", () => {
    expect(colourToTake(COLOUR_CHOICES.black, 0.9)).toBe(STONES.black);
    expect(colourToTake(COLOUR_CHOICES.white, 0.1)).toBe(STONES.white);
    expect(colourToTake(COLOUR_CHOICES.lot, 0.2)).toBe(STONES.black);
    expect(colourToTake(COLOUR_CHOICES.lot, 0.8)).toBe(STONES.white);
  });
});
